import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createWorkoutEngine, WorkoutPhase, type WorkoutConfig, type WorkoutEngineInstance } from '../workoutEngine';
import { useWakeLock } from './useWakeLock';
import { useHaptics } from './useHaptics';
import { AudioManager } from '../utils/AudioManager';

const GLITCH_DURATION_SHORT = 100;
const GLITCH_DURATION_MEDIUM = 500;

/**
 * Custom hook for managing workout state and controls.
 * Creates an isolated workout engine instance per component mount.
 */
export function useWorkout(config: WorkoutConfig) {
  // Create a single engine instance for this hook instance
  const engine = useMemo<WorkoutEngineInstance>(() => createWorkoutEngine(), []);
  
  const [state, setState] = useState(() => engine.getState());
  const [isWarningActive, setIsWarningActive] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);
  const { requestWakeLock, releaseWakeLock } = useWakeLock();
  const { triggerWarningHaptic, triggerPhaseChangeHaptic } = useHaptics();

  // Track completion state locally
  const [completionHandled, setCompletionHandled] = useState(false);
  const lastPhaseRef = useRef<WorkoutPhase | null>(null);

  const triggerGlitch = useCallback(() => {
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), GLITCH_DURATION_SHORT);
  }, []);

  const handleStart = useCallback(() => engine.start(), [engine]);
  const handlePause = useCallback(() => engine.pause(), [engine]);
  const handleReset = useCallback(() => {
    engine.reset();
    setCompletionHandled(false);
    setShowSuccessCheck(false);
    setIsWarningActive(false);
    lastPhaseRef.current = null;
  }, [engine]);
  const handleSkipPhase = useCallback(() => engine.skipPhase(), [engine]);

  // Configure engine when config changes
  useEffect(() => {
    engine.pause();
    engine.setConfig(config);
    
    const unsubscribe = engine.subscribe(setState);
    
    engine.setOnHalfway((phase) => {
      if (phase === WorkoutPhase.WORK) {
        void AudioManager.playCue('/audio/work_halfway.mp3');
        triggerGlitch();
      }
    });

    return () => {
      unsubscribe();
      engine.cleanup();
    };
  }, [config, engine, triggerGlitch]);

  // Effect: Wake Lock Management
  useEffect(() => {
    if (state.status === 'running') {
      void requestWakeLock();
    } else if (state.status === 'paused' || state.status === 'completed' || state.status === 'idle') {
      void releaseWakeLock();
    }
  }, [state.status, requestWakeLock, releaseWakeLock]);

  // Effect: Workout Completion
  useEffect(() => {
    if (state.status === 'completed' && !completionHandled) {
      setCompletionHandled(true);
      setShowSuccessCheck(true);
      void AudioManager.playCue('/audio/workout_complete.mp3');
    }
  }, [state.status, completionHandled, setShowSuccessCheck]);

  // Effect: Phase Change Audio Cues
  useEffect(() => {
    if (state.status !== 'running') return;

    if (state.phase !== lastPhaseRef.current) {
      const cueMap: Record<WorkoutPhase, string> = {
        [WorkoutPhase.WORK]: '/audio/work_start_coached.mp3',
        [WorkoutPhase.REST]: '/audio/rest_start_coached.mp3',
        [WorkoutPhase.WARMUP]: '/audio/warmup_start.mp3',
        [WorkoutPhase.COOLDOWN]: '/audio/cooldown_start.mp3',
      };

      const cue = cueMap[state.phase];
      if (cue) {
        void AudioManager.playCue(cue);
      }
      lastPhaseRef.current = state.phase;
    }
  }, [state.status, state.phase]);

  // Effect: Interval Feedback (Warning & Haptics)
  useEffect(() => {
    if (state.status !== 'running') return;

    const { secondsRemaining, phase } = state;

    if (secondsRemaining === 10) {
      void AudioManager.playCue('/audio/warning_10.mp3');
    }

    if (secondsRemaining <= 3 && secondsRemaining > 0) {
      triggerWarningHaptic();
      setIsWarningActive(true);
      if (secondsRemaining === 3 && phase === WorkoutPhase.WORK) {
        void AudioManager.playCue('/audio/warning_redline.mp3');
      }
    } else if (secondsRemaining === 0) {
      triggerPhaseChangeHaptic();
      setIsWarningActive(false);
      setIsGlitching(true);
      const timeoutId = setTimeout(() => setIsGlitching(false), GLITCH_DURATION_MEDIUM);
      return () => clearTimeout(timeoutId);
    } else {
      setIsWarningActive(false);
    }
  }, [state, triggerWarningHaptic, triggerPhaseChangeHaptic]);

  const totalDuration = useMemo(() => engine.getTotalDurationSeconds(), [engine]);
  const elapsedSeconds = state.status !== 'idle' ? engine.getElapsedSeconds() : 0;

  return {
    state,
    isWarningActive,
    isGlitching,
    showSuccessCheck,
    setShowSuccessCheck,
    elapsedSeconds,
    totalDuration,
    handleStart,
    handlePause,
    handleReset,
    handleSkipPhase,
    setCompletionHandled,
    clearWarning: useCallback(() => setIsWarningActive(false), []),
    releaseWakeLock
  };
}
