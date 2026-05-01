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
  { intervals: 4, workSeconds: 240 },
  { intervals: 4, workSeconds: 240 },
  { intervals: 4, workSeconds: 240 },
  { intervals: 4, workSeconds: 240 },
];

export const MIN_PROGRAM_WEEK = 1;
export const MAX_PROGRAM_WEEK = weeklyProgression.length;

export type WorkoutPhase = "Habit" | "Intervals" | "Threshold" | "HIIT";

export function getPhase(week: number): WorkoutPhase {
  if (week <= 4) return "Habit";
  if (week <= 8) return "Intervals";
  if (week <= 12) return "Threshold";
  return "HIIT";
}

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
  // Use the HUNT formula (most accurate according to Norwegian research)
  // HRmax = 211 - (0.64 × age)
  const maxHR = 211 - (0.64 * age);
  return {
    workMin: Math.round(maxHR * 0.85),
    workMax: Math.round(maxHR * 0.95),
    restMin: Math.round(maxHR * 0.60),
    restMax: Math.round(maxHR * 0.70),
  };
}

export const RESEARCH_FACTS = [
  "Why 4 minutes? This duration maximizes time spent at high stroke volume, leading to a stronger heart.",
  "Consistency > Intensity: VO2max gains begin with any increase from zero. The habit loop is your foundation.",
  "Active Recovery: Keeping your HR at 60-70% during rest helps clear lactate for the next interval.",
  "The Norwegian 4x4 protocol is designed to maximize oxygen uptake (VO2max) through high-intensity intervals.",
  "High stroke volume during 4-minute intervals helps the heart pump more blood with each beat.",
  "Studies show 10-15% improvement in VO2 max after 8-12 weeks of consistent 4x4 training.",
  "The 3-minute active recovery keeps metabolism elevated while preparing for the next interval.",
  "VO2 Max is the single best predictor of longevity and cardiovascular health."
];

/**
 * Safety warnings and medical clearance guidance based on Norwegian 4x4 protocol.
 */
export const SAFETY_WARNINGS = [
  "Consult your physician before starting high-intensity training, especially if you have cardiovascular concerns.",
  "Get a baseline fitness assessment if possible before beginning the program.",
  "Never skip the warm-up - it prepares your heart and muscles for high-intensity effort.",
  "Stop immediately if you experience chest pain, dizziness, or severe shortness of breath.",
  "Stay hydrated throughout your workout.",
  "Allow at least 48 hours of recovery between 4x4 sessions.",
  "The cool-down is essential for proper recovery - don't skip it."
];

/**
 * Exercise variety recommendations for the Norwegian 4x4 protocol.
 */
export const EXERCISE_TYPES = [
  { name: "Running", description: "Outdoor or treadmill running" },
  { name: "Cycling", description: "Stationary bike or road cycling" },
  { name: "Rowing", description: "Rowing machine for full-body workout" },
  { name: "Swimming", description: "Pool or open water swimming" },
  { name: "Cross-country Skiing", description: "Excellent full-body cardio option" },
  { name: "Elliptical", description: "Low-impact alternative" }
];

/**
 * Nutritional guidance for pre/during/post-workout.
 */
export const NUTRITION_GUIDANCE = {
  preWorkout: "Eat a light meal 2-3 hours before, or a small snack 30-60 minutes before. Focus on easily digestible carbs.",
  during: "Small sips of water during recovery periods if needed. For workouts under 60 minutes, water is sufficient.",
  postWorkout: "Consume protein and carbs within 30-60 minutes after your workout to aid recovery and replenish glycogen."
};
