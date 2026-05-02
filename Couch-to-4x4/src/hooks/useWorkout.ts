import { useState, useEffect, useCallback, useMemo } from 'react';
import { createWorkoutEngine, type WorkoutConfig, type WorkoutEngineInstance } from '../workoutEngine';
import { useWakeLock } from './useWakeLock';
import { useHaptics } from './useHaptics';
import { useWorkoutAudio } from './useWorkoutAudio';

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

  const triggerGlitch = useCallback(() => {
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), GLITCH_DURATION_SHORT);
  }, []);

  // Delegate audio logic to specialized hook
  useWorkoutAudio(engine, state, triggerGlitch);

  const handleReset = useCallback(() => {
    engine.reset();
    setCompletionHandled(false);
    setShowSuccessCheck(false);
    setIsWarningActive(false);
  }, [engine]);

  const handleSkipPhase = useCallback(() => engine.skipPhase(), [engine]);

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

  // Effect: Wake Lock Management
  useEffect(() => {
    if (state.status === 'running') {
      void requestWakeLock();
    } else if (state.status === 'paused' || state.status === 'completed' || state.status === 'idle') {
      void releaseWakeLock();
    }
  }, [state.status, requestWakeLock, releaseWakeLock]);

  // Effect: Workout Completion UI
  useEffect(() => {
    if (state.status === 'completed' && !completionHandled) {
      setCompletionHandled(true);
      setShowSuccessCheck(true);
    }
  }, [state.status, completionHandled]);

  const handlePause = useCallback(() => {
    engine.pause();
  }, [engine]);
  
  const handleStart = useCallback(() => {
    engine.start();
  }, [engine]);

  // Effect: Interval Feedback (Haptics & Warning UI)
  useEffect(() => {
    if (state.status !== 'running') return;

    const { secondsRemaining } = state;

    if (secondsRemaining <= 3 && secondsRemaining > 0) {
      triggerWarningHaptic();
      setIsWarningActive(true);
    } else if (secondsRemaining === 0) {
      triggerPhaseChangeHaptic();
      setIsWarningActive(false);
      setIsGlitching(true);
      const timeoutId = setTimeout(() => setIsGlitching(false), GLITCH_DURATION_MEDIUM);
      return () => clearTimeout(timeoutId);
    } else {
      setIsWarningActive(false);
    }
  }, [state.status, state.secondsRemaining, triggerWarningHaptic, triggerPhaseChangeHaptic]);

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
