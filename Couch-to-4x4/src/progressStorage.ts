import { SESSIONS_PER_WEEK } from './constants';

export type EffortRating = "too-hard" | "progress";

export interface SessionHistoryEntry {
  week: number;
  rating: EffortRating;
  sessionNumber: number;
  timestamp: number;
}

export interface WorkoutProgress {
  currentWeek: number | null;
  sessionCount: number;
  age: number | null;
}

const STORAGE_KEY_PROGRESS = "couchTo4x4.progress";
const STORAGE_KEY_HISTORY = "couchTo4x4.history";
const STORAGE_KEY_SETTINGS = "couchTo4x4.settings";
const STORAGE_KEY_ONBOARDING = "couchTo4x4.onboarding";

export const ALL_STORAGE_KEYS = [
  STORAGE_KEY_PROGRESS,
  STORAGE_KEY_HISTORY,
  STORAGE_KEY_SETTINGS,
  STORAGE_KEY_ONBOARDING,
];

export function loadWorkoutProgress(): WorkoutProgress {
  const stored = localStorage.getItem(STORAGE_KEY_PROGRESS);
  if (!stored) {
    return { currentWeek: null, sessionCount: 0, age: null };
  }
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse workout progress from localStorage:', error);
    return { currentWeek: null, sessionCount: 0, age: null };
  }
}

export function saveWorkoutProgress(progress: WorkoutProgress): void {
  localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
}

export function loadSessionHistory(): SessionHistoryEntry[] {
  const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse session history from localStorage:', error);
    return [];
  }
}

export function logSession(
  week: number,
  rating: EffortRating,
  sessionNumber: number
): SessionHistoryEntry {
  const entry: SessionHistoryEntry = {
    week,
    rating,
    sessionNumber,
    timestamp: Date.now(),
  };

  const history = loadSessionHistory();
  const nextHistory = [entry, ...history].slice(0, 100);
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(nextHistory));

  return entry;
}

export function clearAllAppData(): void {
  ALL_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
}

export { SESSIONS_PER_WEEK };
