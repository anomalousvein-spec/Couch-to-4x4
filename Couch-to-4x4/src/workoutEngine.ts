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
 * Creates a new workout engine instance.
 * This factory function replaces the singleton pattern to improve testability
 * and align with React's rendering model.
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
  let timer: number | null = null;
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
    if (timer) clearInterval(timer);
    timer = window.setInterval(() => tick(), 1000);
    notify();
  }

  function pause() {
    if (status !== 'running') return;
    status = 'paused';
    if (timer) clearInterval(timer);
    notify();
  }

  function reset() {
    if (timer) clearInterval(timer);
    status = 'idle';
    phase = WorkoutPhase.WARMUP;
    currentInterval = 0;
    secondsRemaining = config.warmupSeconds;
    timer = null;
    notify();
  }

  function skipPhase() {
    if (status !== 'idle') {
      secondsRemaining = 0;
      tick();
    }
  }

  function tick() {
    if (secondsRemaining > 0) {
      secondsRemaining--;
    } else {
      nextPhase();
    }
    notify();
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
      if (timer) clearInterval(timer);
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

  function getPhaseDurationSeconds(): number {
    switch (phase) {
      case WorkoutPhase.WARMUP: return config.warmupSeconds;
      case WorkoutPhase.WORK: return config.workSeconds;
      case WorkoutPhase.REST: return config.restSeconds;
      case WorkoutPhase.COOLDOWN: return config.cooldownSeconds;
      default: return 0;
    }
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

  /**
   * Cleans up the engine by clearing the timer and removing all listeners.
   * Call this when the engine is no longer needed to prevent memory leaks.
   */
  function cleanup() {
    if (timer) clearInterval(timer);
    timer = null;
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
    getPhaseDurationSeconds,
    subscribe,
    cleanup,
  };
}

export type WorkoutEngineInstance = ReturnType<typeof createWorkoutEngine>;
