import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createWorkoutEngine, WorkoutPhase } from './workoutEngine';

describe('workoutEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default state', () => {
    const engine = createWorkoutEngine();
    const state = engine.getState();
    expect(state.status).toBe('idle');
    expect(state.phase).toBe(WorkoutPhase.WARMUP);
    expect(state.currentInterval).toBe(0);
    expect(state.secondsRemaining).toBe(300); // Default warmup
  });

  it('starts and ticks down', () => {
    const engine = createWorkoutEngine();
    engine.setConfig({
      intervals: 1,
      workSeconds: 30,
      restSeconds: 30,
      warmupSeconds: 10,
      cooldownSeconds: 10,
    });

    engine.start();
    expect(engine.getState().status).toBe('running');
    expect(engine.getState().secondsRemaining).toBe(10);

    vi.advanceTimersByTime(1000);
    expect(engine.getState().secondsRemaining).toBe(9);
  });

  it('transitions through phases correctly', () => {
    const engine = createWorkoutEngine();
    engine.setConfig({
      intervals: 1,
      workSeconds: 5,
      restSeconds: 5,
      warmupSeconds: 5,
      cooldownSeconds: 5,
    });

    engine.start();

    // Warmup -> Work
    vi.advanceTimersByTime(5000);
    expect(engine.getState().phase).toBe(WorkoutPhase.WORK);
    expect(engine.getState().currentInterval).toBe(1);
    expect(engine.getState().secondsRemaining).toBe(5);

    // Work -> Rest
    vi.advanceTimersByTime(5000);
    expect(engine.getState().phase).toBe(WorkoutPhase.REST);
    expect(engine.getState().secondsRemaining).toBe(5);

    // Rest -> Cooldown (since intervals = 1)
    vi.advanceTimersByTime(5000);
    expect(engine.getState().phase).toBe(WorkoutPhase.COOLDOWN);
    expect(engine.getState().secondsRemaining).toBe(5);

    // Cooldown -> Completed
    vi.advanceTimersByTime(5000);
    expect(engine.getState().status).toBe('completed');
  });

  it('triggers halfway callback during WORK phase', () => {
    const engine = createWorkoutEngine();
    const onHalfway = vi.fn();
    engine.setOnHalfway(onHalfway);

    engine.setConfig({
      intervals: 1,
      workSeconds: 10,
      restSeconds: 10,
      warmupSeconds: 0,
      cooldownSeconds: 0,
    });

    engine.start();
    // Warmup is 0, so it immediately goes to WORK on first tick or if we skip warmup
    // Actually nextPhase handles transitions when secondsRemaining === 0

    // Tick to finish warmup (0s)
    vi.advanceTimersByTime(100);
    expect(engine.getState().phase).toBe(WorkoutPhase.WORK);

    vi.advanceTimersByTime(4000); // 4s elapsed
    expect(onHalfway).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000); // 5s elapsed (half of 10)
    expect(onHalfway).toHaveBeenCalledWith(WorkoutPhase.WORK);
  });

  it('skips phases correctly', () => {
    const engine = createWorkoutEngine();
    engine.setConfig({
      intervals: 2,
      workSeconds: 30,
      restSeconds: 30,
      warmupSeconds: 30,
      cooldownSeconds: 30,
    });

    engine.start();
    expect(engine.getState().phase).toBe(WorkoutPhase.WARMUP);

    engine.skipPhase();
    expect(engine.getState().phase).toBe(WorkoutPhase.WORK);
    expect(engine.getState().currentInterval).toBe(1);

    engine.skipPhase();
    expect(engine.getState().phase).toBe(WorkoutPhase.REST);

    engine.skipPhase();
    expect(engine.getState().phase).toBe(WorkoutPhase.WORK);
    expect(engine.getState().currentInterval).toBe(2);
  });

  it('calculates elapsed and total duration correctly', () => {
    const engine = createWorkoutEngine();
    const config = {
      intervals: 2,
      workSeconds: 30,
      restSeconds: 30,
      warmupSeconds: 60,
      cooldownSeconds: 60,
    };
    engine.setConfig(config);

    expect(engine.getTotalDurationSeconds()).toBe(60 + (2 * (30 + 30)) + 60); // 240

    engine.start();
    vi.advanceTimersByTime(10000); // 10s into warmup
    expect(engine.getElapsedSeconds()).toBe(10);

    engine.skipPhase(); // Now in WORK 1
    expect(engine.getElapsedSeconds()).toBe(60);

    vi.advanceTimersByTime(10000); // 10s into WORK 1
    expect(engine.getElapsedSeconds()).toBe(70);
  });

  it('resets state correctly', () => {
    const engine = createWorkoutEngine();
    engine.start();
    vi.advanceTimersByTime(5000);

    engine.reset();
    const state = engine.getState();
    expect(state.status).toBe('idle');
    expect(state.phase).toBe(WorkoutPhase.WARMUP);
    expect(state.secondsRemaining).toBe(300);
  });
});
