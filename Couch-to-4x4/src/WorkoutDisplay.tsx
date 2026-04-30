import { WorkoutPhase, type WorkoutConfig } from "./workoutEngine";
import { useWorkout } from "./hooks/useWorkout";
import { AudioManager } from "./utils/AudioManager";

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
    completionHandledRef,
    workoutStartedRef,
    setSilentAudioActive,
    clearWarning,
    releaseWakeLock,
    suppressNextPhaseCueRef,
  } = useWorkout(config);

  if (!state) return null;

  const handleSuccessCheck = (result: "too-hard" | "progress"): void => {
    void AudioManager.unlock();
    onSuccessCheck?.(result);
    suppressNextPhaseCueRef.current = true;
    handleReset();
    completionHandledRef.current = false;
    workoutStartedRef.current = false;
    setShowSuccessCheck(false);
    setSilentAudioActive(false);
    clearWarning();
    void releaseWakeLock();
  };

  const intervalLabel =
    state.currentInterval > 0
      ? `Interval ${state.currentInterval} of ${state.totalIntervals}`
      : `Interval 0 of ${state.totalIntervals}`;

  const phaseClass = `phase-${state.phase.toLowerCase()}`;
  const workoutClassName = [
    "workout-display",
    phaseClass,
    isWarningActive ? "phase-warning" : "",
    isGlitching ? "glitching" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Calculate phase progress for the circular ring
  const phaseDuration = getPhaseDuration(state.phase, config);
  const phaseProgress = phaseDuration > 0 ? (state.secondsRemaining / phaseDuration) * 100 : 0;

  // Calculate total progress for the linear bar
  const totalProgress = totalDuration > 0 ? (elapsedSeconds / totalDuration) * 100 : 0;

  return (
    <main className={workoutClassName}>
      <div className="total-progress-container">
        <div className="total-progress-bar" style={{ width: `${totalProgress}%` }} />
      </div>

      <section aria-live="polite" className="dashboard-readout">
        {currentWeek !== undefined ? (
          <p className="week-label">
            Week {currentWeek}
            {sessionCount !== undefined
              ? ` | ${sessionCount}/3 sessions completed`
              : ""}
          </p>
        ) : null}
        {sessionCount !== undefined ? (
          <div
            aria-label={`${sessionCount} of 3 weekly sessions completed`}
            className="session-dots"
          >
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={`session-dot ${index < (sessionCount ?? 0) ? "complete" : ""}`}
              />
            ))}
          </div>
        ) : null}
        <p className="phase-label">{state.phase}</p>
        <p className="interval-label">{intervalLabel}</p>
      </section>

      <div className="timer-container">
        <svg className="timer-ring" viewBox="0 0 100 100">
          <circle
            className="timer-ring-bg"
            cx="50"
            cy="50"
            r="45"
          />
          <circle
            className="timer-ring-progress"
            cx="50"
            cy="50"
            r="45"
            style={{ strokeDashoffset: `${282.7 - (282.7 * phaseProgress) / 100}` }}
          />
        </svg>
        <div
          aria-label={`${state.secondsRemaining} seconds remaining`}
          className="timer-text"
        >
          {state.secondsRemaining}
        </div>
      </div>

      {isWarningActive ? (
        <p aria-live="assertive" className="warning-label">
          Get Ready!
        </p>
      ) : null}

      <section aria-label="Workout controls" className="controls-container">
        <button className="control-btn" onClick={handleStart} type="button">
          Start
        </button>
        <button className="control-btn" onClick={handlePause} type="button">
          Pause
        </button>
        <button className="control-btn" onClick={handleReset} type="button">
          Reset
        </button>
        <button className="control-btn skip-btn" onClick={handleSkipPhase} type="button">
          Skip
        </button>
      </section>

      {showSuccessCheck ? (
        <section aria-modal="true" role="dialog" className="success-overlay">
          <div className="success-card industrial-card">
            <h2 className="success-title">How was your effort today?</h2>
            <button className="success-button repeat" onClick={() => handleSuccessCheck("too-hard")} type="button">
              Too Hard (Repeat this session)
            </button>
            <button className="success-button progress" onClick={() => handleSuccessCheck("progress")} type="button">
              Just Right / Challenging (Progress)
            </button>
          </div>
        </section>
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
