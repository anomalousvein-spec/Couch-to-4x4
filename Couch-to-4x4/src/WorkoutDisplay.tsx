import { useMemo, useCallback } from "react";
import { WorkoutPhase, type WorkoutConfig } from "./workoutEngine";
import { useWorkout } from "./hooks/useWorkout";
import { AudioManager } from "./utils/AudioManager";
import { TimerRing } from "./components/workout/TimerRing";
import { Dashboard } from "./components/workout/Dashboard";
import { Controls } from "./components/workout/Controls";
import { SuccessOverlay } from "./components/workout/SuccessOverlay";

interface WorkoutDisplayProps {
  config: WorkoutConfig;
  currentWeek?: number;
  onSuccessCheck?: (result: "too-hard" | "progress") => void;
  sessionCount?: number;
}

export function WorkoutDisplay({
  config,
  currentWeek,
  onSuccessCheck,
  sessionCount,
}: WorkoutDisplayProps) {
  const {
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
    clearWarning,
    releaseWakeLock,
  } = useWorkout(config);

  const handleSuccessCheck = useCallback((result: "too-hard" | "progress"): void => {
    void AudioManager.unlock();
    onSuccessCheck?.(result);
    handleReset();
    setCompletionHandled(false);
    setShowSuccessCheck(false);
    clearWarning();
    void releaseWakeLock();
  }, [onSuccessCheck, handleReset, setCompletionHandled, setShowSuccessCheck, clearWarning, releaseWakeLock]);

  const intervalLabel = useMemo(() => {
    if (!state) return "";
    return state.currentInterval > 0
      ? `Interval ${state.currentInterval} of ${state.totalIntervals}`
      : `Interval 0 of ${state.totalIntervals}`;
  }, [state]);

  const workoutClassName = useMemo(() => {
    if (!state) return "";
    const phaseClass = `phase-${state.phase.toLowerCase()}`;
    return [
      "workout-display",
      phaseClass,
      isWarningActive ? "phase-warning" : "",
      isGlitching ? "glitching phase-change-flash" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }, [state, isWarningActive, isGlitching]);

  const phaseDuration = useMemo(() => {
    if (!state) return 0;
    return getPhaseDuration(state.phase, config);
  }, [state, config]);

  const totalProgress = useMemo(() => {
    return totalDuration > 0 ? (elapsedSeconds / totalDuration) * 100 : 0;
  }, [elapsedSeconds, totalDuration]);

  if (!state) return null;

  return (
    <main className={workoutClassName}>
      <Dashboard
        currentWeek={currentWeek}
        sessionCount={sessionCount}
        phase={state.phase}
        intervalLabel={intervalLabel}
        totalRemaining={totalDuration - elapsedSeconds}
        totalProgress={totalProgress}
      />

      <TimerRing
        secondsRemaining={state.secondsRemaining}
        phaseDuration={phaseDuration}
        phase={state.phase}
      />

      {isWarningActive ? (
        <p aria-live="assertive" className="warning-label">
          Get Ready!
        </p>
      ) : null}

      <Controls
        status={state.status}
        onPause={handlePause}
        onStart={handleStart}
        onReset={handleReset}
        onSkipPhase={handleSkipPhase}
      />

      {showSuccessCheck ? (
        <SuccessOverlay
          onSuccessCheck={handleSuccessCheck}
          config={{
            intervals: config.intervals,
            workSeconds: config.workSeconds,
            restSeconds: config.restSeconds
          }}
        />
      ) : null}
    </main>
  );
}

function getPhaseDuration(phase: WorkoutPhase, config: WorkoutConfig): number {
  switch (phase) {
    case WorkoutPhase.WARMUP: return config.warmupSeconds;
    case WorkoutPhase.WORK: return config.workSeconds;
    case WorkoutPhase.REST: return config.restSeconds;
    case WorkoutPhase.COOLDOWN: return config.cooldownSeconds;
    default: return 0;
  }
}

export default WorkoutDisplay;
