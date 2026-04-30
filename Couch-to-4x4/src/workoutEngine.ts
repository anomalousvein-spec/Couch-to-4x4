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

export const LEVELS: (WorkoutConfig & { week: number })[] = [
  { week: 1, intervals: 2, workSeconds: 30, restSeconds: 180, warmupSeconds: 300, cooldownSeconds: 300 },
  { week: 2, intervals: 2, workSeconds: 30, restSeconds: 180, warmupSeconds: 300, cooldownSeconds: 300 },
  { week: 3, intervals: 3, workSeconds: 45, restSeconds: 180, warmupSeconds: 300, cooldownSeconds: 300 },
  { week: 4, intervals: 3, workSeconds: 45, restSeconds: 180, warmupSeconds: 300, cooldownSeconds: 300 },
  { week: 5, intervals: 4, workSeconds: 30, restSeconds: 180, warmupSeconds: 300, cooldownSeconds: 300 },
  { week: 6, intervals: 4, workSeconds: 30, restSeconds: 180, warmupSeconds: 300, cooldownSeconds: 300 },
  { week: 7, intervals: 4, workSeconds: 60, restSeconds: 180, warmupSeconds: 300, cooldownSeconds: 300 },
  { week: 8, intervals: 4, workSeconds: 60, restSeconds: 180, warmupSeconds: 300, cooldownSeconds: 300 },
  { week: 9, intervals: 4, workSeconds: 120, restSeconds: 180, warmupSeconds: 300, cooldownSeconds: 300 },
  { week: 10, intervals: 4, workSeconds: 120, restSeconds: 180, warmupSeconds: 300, cooldownSeconds: 300 },
  { week: 11, intervals: 4, workSeconds: 180, restSeconds: 180, warmupSeconds: 300, cooldownSeconds: 300 },
  { week: 12, intervals: 4, workSeconds: 240, restSeconds: 180, warmupSeconds: 300, cooldownSeconds: 300 },
];

class WorkoutEngine {
  private status: Status = 'idle';
  private phase: WorkoutPhase = WorkoutPhase.WARMUP;
  private currentInterval: number = 0;
  private secondsRemaining: number = 300;
  private config: WorkoutConfig = LEVELS[0];
  private timer: number | null = null;
  private listeners: ((state: WorkoutState) => void)[] = [];

  getState(): WorkoutState {
    return {
      status: this.status,
      phase: this.phase,
      currentInterval: this.currentInterval,
      totalIntervals: this.config.intervals,
      secondsRemaining: this.secondsRemaining,
    };
  }

  setConfig(config: WorkoutConfig) {
    this.config = config;
    this.reset();
  }

  start() {
    if (this.status === 'running') return;
    this.status = 'running';
    if (this.timer) clearInterval(this.timer);
    this.timer = window.setInterval(() => this.tick(), 1000);
    this.notify();
  }

  pause() {
    if (this.status !== 'running') return;
    this.status = 'paused';
    if (this.timer) clearInterval(this.timer);
    this.notify();
  }

  reset() {
    if (this.timer) clearInterval(this.timer);
    this.status = 'idle';
    this.phase = WorkoutPhase.WARMUP;
    this.currentInterval = 0;
    this.secondsRemaining = this.config.warmupSeconds;
    this.timer = null;
    this.notify();
  }

  skipPhase() {
    if (this.status !== 'idle') {
      this.secondsRemaining = 0;
      this.tick();
    }
  }

  private tick() {
    if (this.secondsRemaining > 0) {
      this.secondsRemaining--;
    } else {
      this.nextPhase();
    }
    this.notify();
  }

  private nextPhase() {
    if (this.phase === WorkoutPhase.WARMUP) {
      this.phase = WorkoutPhase.WORK;
      this.currentInterval = 1;
      this.secondsRemaining = this.config.workSeconds;
    } else if (this.phase === WorkoutPhase.WORK) {
      this.phase = WorkoutPhase.REST;
      this.secondsRemaining = this.config.restSeconds;
    } else if (this.phase === WorkoutPhase.REST) {
      if (this.currentInterval < this.config.intervals) {
        this.phase = WorkoutPhase.WORK;
        this.currentInterval++;
        this.secondsRemaining = this.config.workSeconds;
      } else {
        this.phase = WorkoutPhase.COOLDOWN;
        this.secondsRemaining = this.config.cooldownSeconds;
      }
    } else if (this.phase === WorkoutPhase.COOLDOWN) {
      this.status = 'completed';
      if (this.timer) clearInterval(this.timer);
    }
  }

  getTotalDurationSeconds(): number {
    return this.config.warmupSeconds +
           (this.config.intervals * (this.config.workSeconds + this.config.restSeconds)) +
           this.config.cooldownSeconds;
  }

  getElapsedSeconds(): number {
    let elapsed = 0;

    if (this.phase === WorkoutPhase.WARMUP) {
      elapsed += this.config.warmupSeconds - this.secondsRemaining;
    } else {
      elapsed += this.config.warmupSeconds;

      if (this.phase === WorkoutPhase.WORK || this.phase === WorkoutPhase.REST) {
        const fullIntervals = this.currentInterval - 1;
        elapsed += fullIntervals * (this.config.workSeconds + this.config.restSeconds);

        if (this.phase === WorkoutPhase.WORK) {
          elapsed += this.config.workSeconds - this.secondsRemaining;
        } else {
          elapsed += this.config.workSeconds + (this.config.restSeconds - this.secondsRemaining);
        }
      } else if (this.phase === WorkoutPhase.COOLDOWN) {
        elapsed += (this.config.intervals * (this.config.workSeconds + this.config.restSeconds)) + (this.config.cooldownSeconds - this.secondsRemaining);
      }
    }
    return elapsed;
  }

  getPhaseDurationSeconds(): number {
    switch (this.phase) {
      case WorkoutPhase.WARMUP: return this.config.warmupSeconds;
      case WorkoutPhase.WORK: return this.config.workSeconds;
      case WorkoutPhase.REST: return this.config.restSeconds;
      case WorkoutPhase.COOLDOWN: return this.config.cooldownSeconds;
      default: return 0;
    }
  }

  subscribe(listener: (state: WorkoutState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(l => l(state));
  }
}

export const workoutEngine = new WorkoutEngine();
