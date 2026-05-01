import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createWorkoutEngine, WorkoutPhase, type WorkoutConfig, type WorkoutEngineInstance } from '../workoutEngine';
import { useWakeLock } from './useWakeLock';
import { useHaptics } from './useHaptics';
import { AudioManager } from '../utils/AudioManager';

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
    setTimeout(() => setIsGlitching(false), 1000);
  }, []);

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

  // Handle side effects based on engine state
  useEffect(() => {
    const { status, secondsRemaining, phase } = state;

    if (status === 'completed' && !completionHandled) {
      setCompletionHandled(true);
      setShowSuccessCheck(true);
      void AudioManager.playCue('/audio/workout_complete.mp3');
      void releaseWakeLock();
      return;
    }

    if (status === 'running') {
      void requestWakeLock();

      // Handle Phase Change Audio Cues
      if (phase !== lastPhaseRef.current) {
        if (phase === WorkoutPhase.WORK) {
          void AudioManager.playCue('/audio/work_start_coached.mp3');
        } else if (phase === WorkoutPhase.REST) {
          void AudioManager.playCue('/audio/rest_start_coached.mp3');
        } else if (phase === WorkoutPhase.WARMUP) {
          void AudioManager.playCue('/audio/warmup_start.mp3');
        } else if (phase === WorkoutPhase.COOLDOWN) {
          void AudioManager.playCue('/audio/cooldown_start.mp3');
        }
        lastPhaseRef.current = phase;
      }

      // Feedback logic
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
        const timeoutId = setTimeout(() => setIsGlitching(false), 500);
        return () => clearTimeout(timeoutId);
      } else {
        setIsWarningActive(false);
      }
    } else if (status === 'paused') {
      void releaseWakeLock();
    }
  }, [state, completionHandled, requestWakeLock, releaseWakeLock, triggerWarningHaptic, triggerPhaseChangeHaptic]);

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
