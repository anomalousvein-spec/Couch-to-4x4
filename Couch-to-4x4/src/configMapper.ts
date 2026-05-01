import {
  WARMUP_SECONDS,
  REST_SECONDS,
  COOLDOWN_SECONDS,
} from "./constants";
import { WorkoutConfig } from "./workoutEngine";

export const weeklyProgression = [
  { intervals: 2, workSeconds: 30 },
  { intervals: 2, workSeconds: 45 },
  { intervals: 2, workSeconds: 60 },
  { intervals: 3, workSeconds: 30 },
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

export interface HRZones {
  workMin: number;
  workMax: number;
  restMin: number;
  restMax: number;
}

export function calculateHRZones(age: number): HRZones {
  const maxHR = 220 - age;
  return {
    workMin: Math.round(maxHR * 0.85),
    workMax: Math.round(maxHR * 0.95),
    restMin: Math.round(maxHR * 0.6),
    restMax: Math.round(maxHR * 0.7),
  };
}

export const RESEARCH_FACTS = [
  "Why 4 minutes? This duration maximizes time spent at high stroke volume, leading to a stronger heart.",
  "Consistency > Intensity: VO2max gains begin with any increase from zero. The habit loop is your foundation.",
  "Active Recovery: Keeping your HR at 60% during rest helps clear lactate for the next interval.",
  "The Norwegian 4x4 protocol is designed to maximize oxygen uptake (VO2max) through high-intensity intervals.",
  "High stroke volume during 4-minute intervals helps the heart pump more blood with each beat."
];
