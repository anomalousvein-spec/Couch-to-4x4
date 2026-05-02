import { useEffect, useRef } from 'react';
import { WorkoutPhase, type WorkoutState, type WorkoutEngineInstance } from '../workoutEngine';
import { AudioManager } from '../utils/AudioManager';

const ALL_AUDIO_ASSETS = [
  "/audio/warmup_start.mp3",
  "/audio/work_start_coached.mp3",
  "/audio/rest_start_coached.mp3",
  "/audio/warning_10.mp3",
  "/audio/warning_redline.mp3",
  "/audio/cooldown_start.mp3",
  "/audio/workout_complete.mp3",
  "/audio/work_halfway.mp3",
  "/audio/interval_start_1.mp3",
  "/audio/interval_start_2.mp3",
  "/audio/interval_start_3.mp3",
  "/audio/interval_start_4.mp3",
  "/audio/pause_confirm.mp3",
  "/audio/resume_confirm.mp3",
  "/audio/rest_warning_10.mp3",
  "/audio/rest_warning_30.mp3",
];

export function useWorkoutAudio(engine: WorkoutEngineInstance, state: WorkoutState, triggerGlitch: () => void) {
  const lastPhaseRef = useRef<WorkoutPhase | null>(null);
  const lastStatusRef = useRef<WorkoutState['status']>(state.status);

  // Preload all assets on mount
  useEffect(() => {
    void AudioManager.preload(ALL_AUDIO_ASSETS);
  }, []);

  // Effect: Engine Callbacks (Halfway)
  useEffect(() => {
    engine.setOnHalfway((phase) => {
      if (phase === WorkoutPhase.WORK) {
        void AudioManager.playCoachingCue('/audio/work_halfway.mp3', "Halfway Point");
        triggerGlitch();
      }
    });
  }, [engine, triggerGlitch]);

  // Effect: Phase Change Audio Cues
  useEffect(() => {
    if (state.status !== 'running') {
      lastPhaseRef.current = state.phase;
      return;
    }

    if (state.phase !== lastPhaseRef.current) {
      const phaseTitles: Record<WorkoutPhase, string> = {
        [WorkoutPhase.WARMUP]: "Warm-up",
        [WorkoutPhase.WORK]: "WORK Interval",
        [WorkoutPhase.REST]: "Active Recovery",
        [WorkoutPhase.COOLDOWN]: "Cool-down",
      };

      const cueMap: Record<WorkoutPhase, string> = {
        [WorkoutPhase.WORK]: '/audio/work_start_coached.mp3',
        [WorkoutPhase.REST]: '/audio/rest_start_coached.mp3',
        [WorkoutPhase.WARMUP]: '/audio/warmup_start.mp3',
        [WorkoutPhase.COOLDOWN]: '/audio/cooldown_start.mp3',
      };

      const title = phaseTitles[state.phase];
      const cue = cueMap[state.phase];

      if (cue) {
        // Coaching cues are queued
        void AudioManager.playCoachingCue(cue, title);
      }

      // Play interval start beep immediately when entering WORK phase
      // Queue it after the phase announcement to prevent overlapping
      if (state.phase === WorkoutPhase.WORK) {
        const intervalNum = Math.min(state.currentInterval, 4);
        void AudioManager.playCoachingCue(`/audio/interval_start_${intervalNum}.mp3`, `Interval ${state.currentInterval}/4`);
      }

      lastPhaseRef.current = state.phase;
    }
  }, [state.status, state.phase, state.currentInterval]);

  // Effect: Countdown Warnings
  useEffect(() => {
    if (state.status !== 'running') return;

    const { secondsRemaining, phase } = state;

    // Phase-specific countdowns
    if (phase === WorkoutPhase.REST) {
      if (secondsRemaining === 30) {
        void AudioManager.playCoachingCue('/audio/rest_warning_30.mp3', "30s to WORK");
      } else if (secondsRemaining === 10) {
        void AudioManager.playCoachingCue('/audio/rest_warning_10.mp3', "10s to WORK");
      }
    }

    // General 10s warning
    if (secondsRemaining === 10 && phase !== WorkoutPhase.REST) {
      void AudioManager.playCue('/audio/warning_10.mp3', "10s remaining");
    }

    // Redline warning (last 3 seconds of WORK)
    if (secondsRemaining === 3 && phase === WorkoutPhase.WORK) {
      void AudioManager.playCue('/audio/warning_redline.mp3', "REDLINE");
    }
  }, [state.status, state.phase, state.secondsRemaining]);

  // Effect: Pause/Resume/Complete Feedback
  useEffect(() => {
    if (state.status === 'paused' && lastStatusRef.current === 'running') {
      void AudioManager.playCue('/audio/pause_confirm.mp3', "Workout Paused");
    } else if (state.status === 'running' && lastStatusRef.current === 'paused') {
      void AudioManager.playCue('/audio/resume_confirm.mp3', "Resuming...");
    } else if (state.status === 'completed' && lastStatusRef.current !== 'completed') {
      void AudioManager.playCoachingCue('/audio/workout_complete.mp3', "Mission Complete");
    }
    lastStatusRef.current = state.status;
  }, [state.status]);
}
