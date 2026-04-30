import { useCallback, useEffect, useRef, useState } from "react";
import { useSilentAudio } from "./hooks/useSilentAudio";
import { AudioManager } from "./utils/AudioManager";
import type { WorkoutConfig, WorkoutState } from "./workoutEngine";
import {
  WorkoutEngine,
  WorkoutPhase,
} from "./workoutEngine";

type VoiceCue = WorkoutPhase | "WARNING_10";

interface WorkoutDisplayProps {
  config: WorkoutConfig;
  currentWeek?: number;
  onSuccessCheck?: (result: "too-hard" | "progress") => void;
  sessionCount?: number;
}

type WakeLockSentinelLike = {
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
  removeEventListener: (type: "release", listener: () => void) => void;
};

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
};

const audioCueByPhase: Partial<Record<WorkoutPhase, string>> = {
  [WorkoutPhase.WARMUP]: "/audio/warmup_start.wav",
  [WorkoutPhase.WORK]: "/audio/work_start.wav",
  [WorkoutPhase.REST]: "/audio/rest_start.wav",
  [WorkoutPhase.COOLDOWN]: "/audio/cooldown_start.wav",
  [WorkoutPhase.COMPLETE]: "/audio/workout_complete.wav",
};
const warningAudioCue = "/audio/warning_10.wav";

const defaultState = (config: WorkoutConfig): WorkoutState => ({
  phase: WorkoutPhase.WARMUP,
  secondsRemaining: config.warmupSeconds,
  currentInterval: 0,
  totalIntervals: config.intervals,
  active: false,
});

const playVoiceCue = (cue: VoiceCue): void => {
  const cuePath = cue === "WARNING_10" ? warningAudioCue : audioCueByPhase[cue];

  if (!cuePath) {
    return;
  }

  void AudioManager.playCue(cuePath).catch(() => undefined);
};

export function WorkoutDisplay({
  config,
  currentWeek,
  onSuccessCheck,
  sessionCount,
}: WorkoutDisplayProps) {
  const engineRef = useRef<WorkoutEngine | null>(null);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const completionHandledRef = useRef(false);
  const workoutStartedRef = useRef(false);
  const suppressNextPhaseCueRef = useRef(false);
  const [state, setState] = useState<WorkoutState>(() => defaultState(config));
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);
  const [silentAudioActive, setSilentAudioActive] = useState(false);
  const [isWarningActive, setIsWarningActive] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glitchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useSilentAudio(silentAudioActive);

  const triggerGlitch = useCallback((): void => {
    if (glitchTimeoutRef.current !== null) {
      clearTimeout(glitchTimeoutRef.current);
    }

    setIsGlitching(false);
    requestAnimationFrame(() => {
      setIsGlitching(true);
      glitchTimeoutRef.current = setTimeout(() => {
        setIsGlitching(false);
        glitchTimeoutRef.current = null;
      }, 500);
    });
  }, []);

  const cancelWarningTimer = useCallback((): void => {
    if (warningTimeoutRef.current !== null) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  }, []);

  const clearWarning = useCallback((): void => {
    cancelWarningTimer();
    setIsWarningActive(false);
  }, [cancelWarningTimer]);

  const triggerWarning = useCallback((): void => {
    playVoiceCue("WARNING_10");
    setIsWarningActive(true);

    cancelWarningTimer();

    warningTimeoutRef.current = setTimeout(() => {
      setIsWarningActive(false);
      warningTimeoutRef.current = null;
    }, 2500);
  }, [cancelWarningTimer]);

  const releaseWakeLock = useCallback(async (): Promise<void> => {
    if (!wakeLockRef.current) {
      return;
    }

    const wakeLock = wakeLockRef.current;
    wakeLockRef.current = null;
    await wakeLock.release().catch(() => undefined);
  }, []);

  const requestWakeLock = useCallback(async (): Promise<void> => {
    const wakeLockApi = (navigator as NavigatorWithWakeLock).wakeLock;

    if (!wakeLockApi || wakeLockRef.current) {
      return;
    }

    const wakeLock = await wakeLockApi.request("screen").catch(() => null);

    if (!wakeLock) {
      return;
    }

    wakeLock.addEventListener("release", () => {
      wakeLockRef.current = null;
    });
    wakeLockRef.current = wakeLock;
  }, []);

  useEffect(() => {
    completionHandledRef.current = false;
    workoutStartedRef.current = false;
    setShowSuccessCheck(false);
    clearWarning();

    const engine = new WorkoutEngine(config, {
      onTick: setState,
      onPhaseChange: (phase, nextState) => {
        setState(nextState);

        if (suppressNextPhaseCueRef.current) {
          suppressNextPhaseCueRef.current = false;
        } else {
          playVoiceCue(phase);
          triggerGlitch();
        }

        if (phase === WorkoutPhase.COMPLETE) {
          setSilentAudioActive(false);
          void releaseWakeLock();

          if (!completionHandledRef.current) {
            completionHandledRef.current = true;
            setShowSuccessCheck(true);
          }
        }
      },
      onWarning: triggerWarning,
    });

    engineRef.current = engine;
    setState(engine.getState());

    return () => {
      engine.pause();
      cancelWarningTimer();
      if (glitchTimeoutRef.current !== null) {
        clearTimeout(glitchTimeoutRef.current);
        glitchTimeoutRef.current = null;
      }
      engineRef.current = null;
      void releaseWakeLock();
    };
  }, [cancelWarningTimer, clearWarning, config, releaseWakeLock, triggerGlitch, triggerWarning]);

  const handleStart = (): void => {
    void AudioManager.unlock();
    const shouldPlayWarmupCue =
      !workoutStartedRef.current &&
      engineRef.current?.getState().phase === WorkoutPhase.WARMUP;

    engineRef.current?.start();

    if (engineRef.current?.getState().active) {
      workoutStartedRef.current = true;
      if (shouldPlayWarmupCue) {
        playVoiceCue(WorkoutPhase.WARMUP);
      }
      setSilentAudioActive(true);
      void requestWakeLock();
    }
  };

  const handlePause = (): void => {
    engineRef.current?.pause();
    setSilentAudioActive(false);
    clearWarning();
    void releaseWakeLock();
  };

  const handleReset = (): void => {
    suppressNextPhaseCueRef.current = true;
    engineRef.current?.reset();
    completionHandledRef.current = false;
    workoutStartedRef.current = false;
    setShowSuccessCheck(false);
    setSilentAudioActive(false);
    clearWarning();
    void releaseWakeLock();
  };

  const handleSuccessCheck = (result: "too-hard" | "progress"): void => {
    void AudioManager.unlock();
    onSuccessCheck?.(result);
    suppressNextPhaseCueRef.current = true;
    engineRef.current?.reset();
    completionHandledRef.current = false;
    workoutStartedRef.current = false;
    setShowSuccessCheck(false);
    setSilentAudioActive(false);
    clearWarning();
  };

  const intervalLabel =
    state.currentInterval > 0
      ? `Interval ${state.currentInterval} of ${state.totalIntervals}`
      : `Interval 0 of ${state.totalIntervals}`;
  const progressDots = Array.from({ length: 3 }, (_, index) => index < (sessionCount ?? 0));
  const phaseClass = `phase-${state.phase.toLowerCase()}`;
  const workoutClassName = [
    "workout-display",
    phaseClass,
    isWarningActive ? "phase-warning" : "",
    isGlitching ? "glitching" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={workoutClassName}>
      <section aria-live="polite" className="dashboard-readout">
        {currentWeek !== undefined ? (
          <p style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>
            Week {currentWeek}
            {sessionCount !== undefined
              ? ` | ${sessionCount}/3 sessions completed`
              : ""}
          </p>
        ) : null}
        {sessionCount !== undefined ? (
          <div
            aria-label={`${sessionCount} of 3 weekly sessions completed`}
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "center",
              marginBottom: "0.75rem",
            }}
          >
            {progressDots.map((isComplete, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: isComplete ? "currentColor" : "transparent",
                  border: "2px solid currentColor",
                  borderRadius: "999px",
                  display: "block",
                  height: "0.85rem",
                  width: "0.85rem",
                }}
              />
            ))}
          </div>
        ) : null}
        <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
          {state.phase}
        </p>
        <p style={{ fontSize: "1.125rem", margin: "0.5rem 0 0" }}>
          {intervalLabel}
        </p>
      </section>

      <div
        aria-label={`${state.secondsRemaining} seconds remaining`}
        className="timer-text"
      >
        {state.secondsRemaining}
      </div>

      {isWarningActive ? (
        <p
          aria-live="assertive"
          className="warning-label"
        >
          Get Ready!
        </p>
      ) : null}

      <section
        aria-label="Workout controls"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          justifyContent: "center",
        }}
      >
        <button onClick={handleStart} type="button">
          Start
        </button>
        <button onClick={handlePause} type="button">
          Pause
        </button>
        <button onClick={handleReset} type="button">
          Reset
        </button>
      </section>

      {showSuccessCheck ? (
        <section
          aria-modal="true"
          role="dialog"
          className="success-overlay"
        >
          <div className="success-card industrial-card">
            <h2 style={{ fontSize: "1.5rem", margin: 0 }}>
              How was your effort today?
            </h2>
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

export default WorkoutDisplay;
