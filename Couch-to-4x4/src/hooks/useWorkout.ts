import { useState, useEffect, useRef, useCallback } from 'react';
import { workoutEngine, type WorkoutConfig } from '../workoutEngine';
import { useWakeLock } from './useWakeLock';
import { useHaptics } from './useHaptics';

export function useWorkout(config: WorkoutConfig) {
  const [state, setState] = useState(workoutEngine.getState());
  const [isWarningActive, setIsWarningActive] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);
  const { requestWakeLock, releaseWakeLock } = useWakeLock();
  const { triggerWarningHaptic, triggerPhaseChangeHaptic } = useHaptics();

  const completionHandledRef = useRef(false);
  const workoutStartedRef = useRef(false);
  const suppressNextPhaseCueRef = useRef(false);

  useEffect(() => {
    workoutEngine.setConfig(config);
    const unsubscribe = workoutEngine.subscribe(setState);
    return () => unsubscribe();
  }, [config]);

  useEffect(() => {
    if (state.status === 'completed' && !completionHandledRef.current) {
      completionHandledRef.current = true;
      setShowSuccessCheck(true);
      void releaseWakeLock();
    } else if (state.status === 'running') {
      void requestWakeLock();
      workoutStartedRef.current = true;
    } else if (state.status === 'paused') {
      void releaseWakeLock();
    }
  }, [state.status, requestWakeLock, releaseWakeLock]);

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

  const handleStart = useCallback(() => workoutEngine.start(), []);
  const handlePause = useCallback(() => workoutEngine.pause(), []);
  const handleReset = useCallback(() => {
    workoutEngine.reset();
    completionHandledRef.current = false;
    workoutStartedRef.current = false;
    setShowSuccessCheck(false);
    setIsWarningActive(false);
  }, []);
  const handleSkipPhase = useCallback(() => workoutEngine.skipPhase(), []);

  const totalDuration = workoutEngine.getTotalDurationSeconds();
  const elapsedSeconds = workoutEngine.getElapsedSeconds();

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
    completionHandledRef,
    workoutStartedRef,
    suppressNextPhaseCueRef,
    clearWarning: () => setIsWarningActive(false),
    releaseWakeLock
  };
}
