import { useState, useEffect, useCallback, useMemo } from 'react';
import { createWorkoutEngine, type WorkoutConfig, type WorkoutEngineInstance } from '../workoutEngine';
import { useWakeLock } from './useWakeLock';
import { useHaptics } from './useHaptics';

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

  // Configure engine when config changes
  useEffect(() => {
    engine.pause();
    engine.setConfig(config);
    
    const unsubscribe = engine.subscribe(setState);
    
    return () => {
      unsubscribe();
      engine.cleanup();
    };
  }, [config, engine]);

  // Handle side effects based on engine state
  useEffect(() => {
    const { status, secondsRemaining } = state;

    if (status === 'completed' && !completionHandled) {
      setCompletionHandled(true);
      setShowSuccessCheck(true);
      void releaseWakeLock();
      return;
    }

    if (status === 'running') {
      void requestWakeLock();

      // Feedback logic
      if (secondsRemaining <= 3 && secondsRemaining > 0) {
        triggerWarningHaptic();
        setIsWarningActive(true);
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
