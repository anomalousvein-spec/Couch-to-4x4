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

  // Track completion state locally instead of using refs that escape the hook
  const [completionHandled, setCompletionHandled] = useState(false);
  const [workoutStarted, setWorkoutStarted] = useState(false);

  // Configure engine when config changes - with proper cleanup
  useEffect(() => {
    // Pause and reset engine before reconfiguring to prevent timer conflicts
    engine.pause();
    engine.setConfig(config);
    
    const unsubscribe = engine.subscribe(setState);
    
    return () => {
      unsubscribe();
    };
  }, [config, engine]);

  // Handle wake lock based on workout status
  useEffect(() => {
    if (state.status === 'completed' && !completionHandled) {
      setCompletionHandled(true);
      setShowSuccessCheck(true);
      void releaseWakeLock();
    } else if (state.status === 'running') {
      void requestWakeLock();
      setWorkoutStarted(true);
    } else if (state.status === 'paused') {
      void releaseWakeLock();
    }
  }, [state.status, completionHandled, requestWakeLock, releaseWakeLock]);

  // Audio and Haptic feedback logic
  useEffect(() => {
    if (state.status === 'running') {
      if (state.secondsRemaining <= 3 && state.secondsRemaining > 0) {
        triggerWarningHaptic();
        setIsWarningActive(true);
      } else if (state.secondsRemaining === 0) {
        triggerPhaseChangeHaptic();
        setIsWarningActive(false);
        setIsGlitching(true);
        const timeoutId = setTimeout(() => setIsGlitching(false), 500);
        return () => clearTimeout(timeoutId);
      } else {
        setIsWarningActive(false);
      }
    }
    return undefined;
  }, [state.secondsRemaining, state.status, triggerWarningHaptic, triggerPhaseChangeHaptic]);

  // Cleanup engine on unmount
  useEffect(() => {
    return () => {
      engine.cleanup();
    };
  }, [engine]);

  const handleStart = useCallback(() => engine.start(), [engine]);
  const handlePause = useCallback(() => engine.pause(), [engine]);
  const handleReset = useCallback(() => {
    engine.reset();
    setCompletionHandled(false);
    setWorkoutStarted(false);
    setShowSuccessCheck(false);
    setIsWarningActive(false);
  }, [engine]);
  const handleSkipPhase = useCallback(() => engine.skipPhase(), [engine]);

  const totalDuration = engine.getTotalDurationSeconds();
  const elapsedSeconds = engine.getElapsedSeconds();

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
    completionHandled,
    setCompletionHandled,
    workoutStarted,
    setWorkoutStarted,
    clearWarning: () => setIsWarningActive(false),
    releaseWakeLock
  };
}
