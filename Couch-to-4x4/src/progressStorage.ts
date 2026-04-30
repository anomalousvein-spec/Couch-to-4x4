import { MAX_PROGRAM_WEEK, MIN_PROGRAM_WEEK } from "./configMapper";

const CURRENT_WEEK_KEY = "couchTo4x4.currentWeek";
const SESSION_COUNT_KEY = "couchTo4x4.sessionCount";
const SESSION_HISTORY_KEY = "couchTo4x4.sessionHistory";
const LEGACY_COMPLETED_SESSIONS_KEY = "couchTo4x4.completedSessions";

export const SESSIONS_PER_WEEK = 3;

export type EffortRating = "too-hard" | "progress";

export interface WorkoutProgress {
  currentWeek: number | null;
  sessionCount: number;
}

export interface SessionHistoryEntry {
  id: string;
  timestamp: string;
  week: number;
  sessionNumber: number;
  rating: EffortRating;
}

export function loadWorkoutProgress(): WorkoutProgress {
  if (!canUseLocalStorage()) {
    return {
      currentWeek: null,
      sessionCount: 0,
    };
  }

  const storedSessionCount = readNumber(SESSION_COUNT_KEY, null);
  const legacyCompletedSessions = readNumber(LEGACY_COMPLETED_SESSIONS_KEY, 0) ?? 0;

  return {
    currentWeek: readNumber(CURRENT_WEEK_KEY, null),
    sessionCount: normalizeSessionCount(storedSessionCount ?? legacyCompletedSessions),
  };
}

export function saveCurrentWeek(currentWeek: number): void {
  if (!canUseLocalStorage()) {
    return;
  }

  localStorage.setItem(CURRENT_WEEK_KEY, String(normalizeWeek(currentWeek)));
}

export function saveSessionCount(sessionCount: number): void {
  if (!canUseLocalStorage()) {
    return;
  }

  localStorage.setItem(SESSION_COUNT_KEY, String(normalizeSessionCount(sessionCount)));
}

export function saveWorkoutProgress(progress: WorkoutProgress): void {
  if (!canUseLocalStorage()) {
    return;
  }

  if (progress.currentWeek === null) {
    localStorage.removeItem(CURRENT_WEEK_KEY);
  } else {
    saveCurrentWeek(progress.currentWeek);
  }

  saveSessionCount(progress.sessionCount);
}

export function loadSessionHistory(): SessionHistoryEntry[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  const storedValue = localStorage.getItem(SESSION_HISTORY_KEY);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter(isSessionHistoryEntry)
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  } catch {
    return [];
  }
}

export function logSession(
  week: number,
  rating: EffortRating,
  sessionNumber = 1
): SessionHistoryEntry | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  const entry: SessionHistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    week: normalizeWeek(week),
    sessionNumber: normalizeHistorySessionNumber(sessionNumber),
    rating,
  };
  const nextHistory = [entry, ...loadSessionHistory()].slice(0, 100);

  localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(nextHistory));
  return entry;
}

function readNumber(key: string, fallback: number | null): number | null {
  const storedValue = localStorage.getItem(key);

  if (storedValue === null) {
    return fallback;
  }

  const parsedValue = Number(storedValue);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.floor(parsedValue);
}

function normalizeWeek(week: number): number {
  return Math.min(MAX_PROGRAM_WEEK, Math.max(MIN_PROGRAM_WEEK, Math.floor(week)));
}

function normalizeSessionCount(sessionCount: number): number {
  return Math.min(
    SESSIONS_PER_WEEK - 1,
    Math.max(0, Math.floor(sessionCount))
  );
}

function normalizeHistorySessionNumber(sessionNumber: number): number {
  return Math.min(
    SESSIONS_PER_WEEK,
    Math.max(1, Math.floor(sessionNumber))
  );
}

function isSessionHistoryEntry(value: unknown): value is SessionHistoryEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Record<string, unknown>;

  return (
    typeof entry.id === "string" &&
    typeof entry.timestamp === "string" &&
    typeof entry.week === "number" &&
    Number.isFinite(entry.week) &&
    typeof entry.sessionNumber === "number" &&
    Number.isFinite(entry.sessionNumber) &&
    (entry.rating === "too-hard" || entry.rating === "progress")
  );
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}
