export enum WorkoutPhase {
  WARMUP = "WARMUP",
  WORK = "WORK",
  REST = "REST",
  COOLDOWN = "COOLDOWN",
}

export type Status = 'idle' | 'running' | 'paused' | 'completed';

export interface WorkoutState {
  status: Status;
  phase: WorkoutPhase;
  currentInterval: number;
  totalIntervals: number;
  secondsRemaining: number;
}

export interface WorkoutConfig {
  week?: number;
  intervals: number;
  workSeconds: number;
  restSeconds: number;
  warmupSeconds: number;
  cooldownSeconds: number;
}

// Default configuration values
const DEFAULT_INTERVALS = 2;
const DEFAULT_WORK_SECONDS = 30;
const DEFAULT_REST_SECONDS = 180;
const DEFAULT_WARMUP_SECONDS = 300;
const DEFAULT_COOLDOWN_SECONDS = 300;

/**
 * Creates a new workout engine instance with drift correction.
 */
export function createWorkoutEngine() {
  let status: Status = 'idle';
  let phase: WorkoutPhase = WorkoutPhase.WARMUP;
  let currentInterval = 0;
  let secondsRemaining = DEFAULT_WARMUP_SECONDS;
  let config: WorkoutConfig = {
    intervals: DEFAULT_INTERVALS,
    workSeconds: DEFAULT_WORK_SECONDS,
    restSeconds: DEFAULT_REST_SECONDS,
    warmupSeconds: DEFAULT_WARMUP_SECONDS,
    cooldownSeconds: DEFAULT_COOLDOWN_SECONDS,
  };

  let timerId: number | null = null;
  let startTime: number | null = null;
  let baseSecondsRemaining: number = DEFAULT_WARMUP_SECONDS;

  const listeners: ((state: WorkoutState) => void)[] = [];

  function getState(): WorkoutState {
    return {
      status,
      phase,
      currentInterval,
      totalIntervals: config.intervals,
      secondsRemaining,
    };
  }

  function setConfig(newConfig: WorkoutConfig) {
    config = newConfig;
    reset();
  }

  function start() {
    if (status === 'running') return;
    status = 'running';
    startTime = Date.now();
    baseSecondsRemaining = secondsRemaining;
    scheduleTick();
    notify();
  }

  function scheduleTick() {
    if (status !== 'running') return;

    timerId = window.setTimeout(() => {
      if (!startTime) return;

      const elapsedMs = Date.now() - startTime;
      const elapsedSec = Math.floor(elapsedMs / 1000);

      const newSecondsRemaining = Math.max(0, baseSecondsRemaining - elapsedSec);

      if (newSecondsRemaining !== secondsRemaining) {
        secondsRemaining = newSecondsRemaining;
        if (secondsRemaining === 0) {
          nextPhase();
          if (status === 'running') {
            startTime = Date.now();
            baseSecondsRemaining = secondsRemaining;
          }
        }
        notify();
      }

      if (status === 'running') {
        scheduleTick();
      }
    }, 100); // Check every 100ms for high precision
  }

  function pause() {
    if (status !== 'running') return;
    status = 'paused';
    if (timerId) clearTimeout(timerId);
    timerId = null;
    notify();
  }

  function reset() {
    if (timerId) clearTimeout(timerId);
    timerId = null;
    status = 'idle';
    phase = WorkoutPhase.WARMUP;
    currentInterval = 0;
    secondsRemaining = config.warmupSeconds;
    startTime = null;
    notify();
  }

  function skipPhase() {
    if (status !== 'idle') {
      nextPhase();
      if (status === 'running') {
        startTime = Date.now();
        baseSecondsRemaining = secondsRemaining;
      }
      notify();
    }
  }

  function nextPhase() {
    if (phase === WorkoutPhase.WARMUP) {
      phase = WorkoutPhase.WORK;
      currentInterval = 1;
      secondsRemaining = config.workSeconds;
    } else if (phase === WorkoutPhase.WORK) {
      phase = WorkoutPhase.REST;
      secondsRemaining = config.restSeconds;
    } else if (phase === WorkoutPhase.REST) {
      if (currentInterval < config.intervals) {
        phase = WorkoutPhase.WORK;
        currentInterval++;
        secondsRemaining = config.workSeconds;
      } else {
        phase = WorkoutPhase.COOLDOWN;
        secondsRemaining = config.cooldownSeconds;
      }
    } else if (phase === WorkoutPhase.COOLDOWN) {
      status = 'completed';
      if (timerId) clearTimeout(timerId);
      timerId = null;
    }
  }

  function getTotalDurationSeconds(): number {
    return config.warmupSeconds +
           (config.intervals * (config.workSeconds + config.restSeconds)) +
           config.cooldownSeconds;
  }

  function getElapsedSeconds(): number {
    let elapsed = 0;

    if (phase === WorkoutPhase.WARMUP) {
      elapsed += config.warmupSeconds - secondsRemaining;
    } else {
      elapsed += config.warmupSeconds;

      if (phase === WorkoutPhase.WORK || phase === WorkoutPhase.REST) {
        const fullIntervals = currentInterval - 1;
        elapsed += fullIntervals * (config.workSeconds + config.restSeconds);

        if (phase === WorkoutPhase.WORK) {
          elapsed += config.workSeconds - secondsRemaining;
        } else {
          elapsed += config.workSeconds + (config.restSeconds - secondsRemaining);
        }
      } else if (phase === WorkoutPhase.COOLDOWN) {
        elapsed += (config.intervals * (config.workSeconds + config.restSeconds)) + (config.cooldownSeconds - secondsRemaining);
      }
    }
    return elapsed;
  }

  function subscribe(listener: (state: WorkoutState) => void) {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  function notify() {
    const state = getState();
    listeners.forEach(l => l(state));
  }

  function cleanup() {
    if (timerId) clearTimeout(timerId);
    timerId = null;
    listeners.length = 0;
  }

  return {
    getState,
    setConfig,
    start,
    pause,
    reset,
    skipPhase,
    getTotalDurationSeconds,
    getElapsedSeconds,
    subscribe,
    cleanup,
  };
}

export type WorkoutEngineInstance = ReturnType<typeof createWorkoutEngine>;
