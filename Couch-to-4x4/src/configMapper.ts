import type { WorkoutConfig } from "./workoutEngine";

const WARMUP_SECONDS = 5 * 60;
const REST_SECONDS = 3 * 60;
const COOLDOWN_SECONDS = 5 * 60;

const weeklyProgression: Array<Pick<WorkoutConfig, "intervals" | "workSeconds">> = [
  { intervals: 2, workSeconds: 30 },
  { intervals: 2, workSeconds: 30 },
  { intervals: 3, workSeconds: 45 },
  { intervals: 3, workSeconds: 45 },
  { intervals: 4, workSeconds: 30 },
  { intervals: 4, workSeconds: 30 },
  { intervals: 4, workSeconds: 60 },
  { intervals: 4, workSeconds: 60 },
  { intervals: 4, workSeconds: 120 },
  { intervals: 4, workSeconds: 120 },
  { intervals: 4, workSeconds: 180 },
  { intervals: 4, workSeconds: 180 },
  { intervals: 4, workSeconds: 240 },
  { intervals: 4, workSeconds: 240 },
];

export const MIN_PROGRAM_WEEK = 1;
export const MAX_PROGRAM_WEEK = weeklyProgression.length;

export function getWorkoutConfig(week: number): WorkoutConfig {
  const safeWeek = Math.min(
    MAX_PROGRAM_WEEK,
    Math.max(MIN_PROGRAM_WEEK, Math.floor(week))
  );
  const weekConfig = weeklyProgression[safeWeek - 1];

  return {
    warmupSeconds: WARMUP_SECONDS,
    workSeconds: weekConfig.workSeconds,
    restSeconds: REST_SECONDS,
    cooldownSeconds: COOLDOWN_SECONDS,
    intervals: weekConfig.intervals,
  };
}

export function getCurrentGoalLabel(week: number): string {
  const config = getWorkoutConfig(week);

  if (config.workSeconds === 4 * 60 && config.intervals === 4) {
    return `Week ${week}: The 4x4 Standard`;
  }

  return `Week ${week}: ${config.workSeconds}s High-Intensity Bursts`;
}

export function getWeekSummary(week: number): string {
  const config = getWorkoutConfig(week);

  return `Week ${week}: ${config.intervals} x ${formatDuration(config.workSeconds)} Work / ${formatDuration(config.restSeconds)} Rest`;
}

export function getAllWeekSummaries(): Array<{ label: string; week: number }> {
  return Array.from({ length: MAX_PROGRAM_WEEK }, (_, index) => {
    const week = index + 1;

    return {
      week,
      label: getWeekSummary(week),
    };
  });
}

function formatDuration(seconds: number): string {
  if (seconds % 60 === 0) {
    return `${seconds / 60}m`;
  }

  return `${seconds}s`;
}
