export enum WorkoutPhase {
  WARMUP = "WARMUP",
  WORK = "WORK",
  REST = "REST",
  COOLDOWN = "COOLDOWN",
  COMPLETE = "COMPLETE",
}

export interface WorkoutConfig {
  warmupSeconds: number;
  workSeconds: number;
  restSeconds: number;
  cooldownSeconds: number;
  intervals: number;
}

export interface WorkoutState {
  phase: WorkoutPhase;
  secondsRemaining: number;
  currentInterval: number;
  totalIntervals: number;
  active: boolean;
}

export interface WorkoutEngineCallbacks {
  onTick?: (state: WorkoutState) => void;
  onPhaseChange?: (phase: WorkoutPhase, state: WorkoutState) => void;
  onWarning?: (secondsToNextPhase: number) => void;
}

type TimeoutHandle = ReturnType<typeof setTimeout>;

const TICK_MS = 100;
const SECOND_MS = 1000;

export class WorkoutEngine {
  private config: WorkoutConfig;
  private callbacks: WorkoutEngineCallbacks;
  private state: WorkoutState;
  private phaseStartedAtMs = 0;
  private pausedElapsedMs = 0;
  private warningTriggeredForPhase = false;
  private timeoutId: TimeoutHandle | null = null;

  constructor(config: WorkoutConfig, callbacks: WorkoutEngineCallbacks = {}) {
    this.config = this.normalizeConfig(config);
    this.callbacks = callbacks;
    this.state = this.createInitialState();
  }

  public getState(): WorkoutState {
    return { ...this.state };
  }

  public setCallbacks(callbacks: WorkoutEngineCallbacks): void {
    this.callbacks = callbacks;
  }

  public updateConfig(config: WorkoutConfig): void {
    this.config = this.normalizeConfig(config);
    this.reset();
  }

  public start(): void {
    if (this.state.active || this.state.phase === WorkoutPhase.COMPLETE) {
      return;
    }

    this.state = { ...this.state, active: true };
    this.phaseStartedAtMs = Date.now() - this.pausedElapsedMs;
    this.emitTick();
    this.scheduleTick();
  }

  public pause(): void {
    if (!this.state.active) {
      return;
    }

    this.pausedElapsedMs = Date.now() - this.phaseStartedAtMs;
    this.state = { ...this.state, active: false };
    this.cancelTick();
    this.emitTick();
  }

  public reset(config?: WorkoutConfig): void {
    this.cancelTick();

    if (config) {
      this.config = this.normalizeConfig(config);
    }

    this.phaseStartedAtMs = 0;
    this.pausedElapsedMs = 0;
    this.warningTriggeredForPhase = false;
    this.state = this.createInitialState();
    this.emitPhaseChange();
    this.emitTick();
  }

  private tick = (): void => {
    if (!this.state.active) {
      return;
    }

    this.advanceToCurrentPhase(Date.now());
    this.emitTick();

    if (this.state.active) {
      this.scheduleTick();
    }
  };

  private advanceToCurrentPhase(nowMs: number): void {
    let elapsedMs = nowMs - this.phaseStartedAtMs;
    let durationMs = this.getPhaseDurationSeconds(this.state.phase) * SECOND_MS;

    while (durationMs > 0 && elapsedMs >= durationMs && this.state.phase !== WorkoutPhase.COMPLETE) {
      const overflowMs = elapsedMs - durationMs;
      this.transitionToNextPhase(nowMs - overflowMs);
      elapsedMs = nowMs - this.phaseStartedAtMs;
      durationMs = this.getPhaseDurationSeconds(this.state.phase) * SECOND_MS;
    }

    if (durationMs === 0 && this.state.phase !== WorkoutPhase.COMPLETE) {
      this.transitionThroughZeroLengthPhases(nowMs);
      elapsedMs = nowMs - this.phaseStartedAtMs;
      durationMs = this.getPhaseDurationSeconds(this.state.phase) * SECOND_MS;
    }

    const remainingMs = Math.max(0, durationMs - elapsedMs);
    this.state = {
      ...this.state,
      secondsRemaining: Math.ceil(remainingMs / SECOND_MS),
    };
    this.emitWarningIfNeeded();
  }

  private transitionThroughZeroLengthPhases(nowMs: number): void {
    let guard = 0;

    while (
      this.state.phase !== WorkoutPhase.COMPLETE &&
      this.getPhaseDurationSeconds(this.state.phase) === 0 &&
      guard < this.config.intervals + 4
    ) {
      this.transitionToNextPhase(nowMs);
      guard += 1;
    }
  }

  private transitionToNextPhase(startedAtMs: number): void {
    const nextState = this.getNextState();

    this.phaseStartedAtMs = startedAtMs;
    this.pausedElapsedMs = 0;
    this.warningTriggeredForPhase = false;
    this.state = {
      ...nextState,
      active: nextState.phase !== WorkoutPhase.COMPLETE,
      secondsRemaining: this.getPhaseDurationSeconds(nextState.phase),
    };

    this.emitPhaseChange();

    if (this.state.phase === WorkoutPhase.COMPLETE) {
      this.cancelTick();
    }
  }

  private getNextState(): WorkoutState {
    switch (this.state.phase) {
      case WorkoutPhase.WARMUP:
        return {
          ...this.state,
          phase: WorkoutPhase.WORK,
          currentInterval: 1,
        };
      case WorkoutPhase.WORK:
        return {
          ...this.state,
          phase: WorkoutPhase.REST,
        };
      case WorkoutPhase.REST:
        if (this.state.currentInterval >= this.config.intervals) {
          return {
            ...this.state,
            phase: WorkoutPhase.COOLDOWN,
          };
        }

        return {
          ...this.state,
          phase: WorkoutPhase.WORK,
          currentInterval: this.state.currentInterval + 1,
        };
      case WorkoutPhase.COOLDOWN:
      case WorkoutPhase.COMPLETE:
        return {
          ...this.state,
          phase: WorkoutPhase.COMPLETE,
        };
      default:
        return this.createInitialState();
    }
  }

  private getPhaseDurationSeconds(phase: WorkoutPhase): number {
    switch (phase) {
      case WorkoutPhase.WARMUP:
        return this.config.warmupSeconds;
      case WorkoutPhase.WORK:
        return this.config.workSeconds;
      case WorkoutPhase.REST:
        return this.config.restSeconds;
      case WorkoutPhase.COOLDOWN:
        return this.config.cooldownSeconds;
      case WorkoutPhase.COMPLETE:
        return 0;
      default:
        return 0;
    }
  }

  private scheduleTick(): void {
    this.cancelTick();
    this.timeoutId = setTimeout(this.tick, TICK_MS);
  }

  private cancelTick(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = null;
  }

  private emitTick(): void {
    this.callbacks.onTick?.(this.getState());
  }

  private emitPhaseChange(): void {
    this.callbacks.onPhaseChange?.(this.state.phase, this.getState());
  }

  private emitWarningIfNeeded(): void {
    if (
      this.state.phase !== WorkoutPhase.REST ||
      this.state.secondsRemaining !== 10 ||
      this.warningTriggeredForPhase
    ) {
      return;
    }

    this.warningTriggeredForPhase = true;
    this.callbacks.onWarning?.(10);
  }

  private createInitialState(): WorkoutState {
    return {
      phase: WorkoutPhase.WARMUP,
      secondsRemaining: this.config.warmupSeconds,
      currentInterval: 0,
      totalIntervals: this.config.intervals,
      active: false,
    };
  }

  private normalizeConfig(config: WorkoutConfig): WorkoutConfig {
    return {
      warmupSeconds: this.normalizeSeconds(config.warmupSeconds, "warmupSeconds"),
      workSeconds: this.normalizeSeconds(config.workSeconds, "workSeconds"),
      restSeconds: this.normalizeSeconds(config.restSeconds, "restSeconds"),
      cooldownSeconds: this.normalizeSeconds(config.cooldownSeconds, "cooldownSeconds"),
      intervals: this.normalizeIntervals(config.intervals),
    };
  }

  private normalizeSeconds(value: number, fieldName: keyof Omit<WorkoutConfig, "intervals">): number {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${fieldName} must be a non-negative number.`);
    }

    return Math.floor(value);
  }

  private normalizeIntervals(value: number): number {
    if (!Number.isFinite(value) || value < 1) {
      throw new Error("intervals must be at least 1.");
    }

    return Math.floor(value);
  }
}
