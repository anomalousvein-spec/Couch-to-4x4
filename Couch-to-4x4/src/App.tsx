import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCurrentGoalLabel,
  getWorkoutConfig,
  MAX_PROGRAM_WEEK,
} from "./configMapper";
import Settings from "./components/Settings";
import Onboarding from "./Onboarding";
import {
  loadSessionHistory,
  loadWorkoutProgress,
  logSession,
  saveWorkoutProgress,
  SESSIONS_PER_WEEK,
} from "./progressStorage";
import type { EffortRating, SessionHistoryEntry, WorkoutProgress } from "./progressStorage";
import WorkoutDisplay from "./WorkoutDisplay";

type AppView = "workout" | "settings";

const ratingLabel: Record<EffortRating, string> = {
  "too-hard": "Too Hard",
  progress: "Just Right",
};

export function App() {
  const [progress, setProgress] = useState(() => loadWorkoutProgress());
  const [history, setHistory] = useState<SessionHistoryEntry[]>(() => loadSessionHistory());
  const [view, setView] = useState<AppView>("workout");
  const progressRef = useRef<WorkoutProgress>(progress);
  const currentWeek = progress.currentWeek;
  const config = useMemo(
    () => (currentWeek === null ? null : getWorkoutConfig(currentWeek)),
    [currentWeek]
  );
  const currentGoal = useMemo(
    () => (currentWeek === null ? null : getCurrentGoalLabel(currentWeek)),
    [currentWeek]
  );

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const handleSelectWeek = useCallback((week: number): void => {
    const nextProgress = {
      currentWeek: week,
      sessionCount: 0,
    };

    saveWorkoutProgress(nextProgress);
    progressRef.current = nextProgress;
    setProgress(nextProgress);
    setView("workout");
  }, []);

  const handleSuccessCheck = useCallback((result: EffortRating): void => {
    const previousProgress = progressRef.current;

    if (previousProgress.currentWeek === null) {
      return;
    }

    const sessionNumber = Math.min(
      SESSIONS_PER_WEEK,
      previousProgress.sessionCount + 1
    );
    const loggedSession = logSession(
      previousProgress.currentWeek,
      result,
      sessionNumber
    );

    if (loggedSession) {
      setHistory((previousHistory) => [loggedSession, ...previousHistory].slice(0, 100));
    }

    if (result === "too-hard") {
      return;
    }

    const nextSessionCount = previousProgress.sessionCount + 1;
    const shouldAdvanceWeek = nextSessionCount >= SESSIONS_PER_WEEK;
    const currentWeek = shouldAdvanceWeek
      ? Math.min(previousProgress.currentWeek + 1, MAX_PROGRAM_WEEK)
      : previousProgress.currentWeek;
    const sessionCount = shouldAdvanceWeek ? 0 : nextSessionCount;
    const nextProgress = {
      currentWeek,
      sessionCount,
    };

    saveWorkoutProgress(nextProgress);
    progressRef.current = nextProgress;
    setProgress(nextProgress);
  }, []);

  if (currentWeek === null || config === null || currentGoal === null) {
    return <Onboarding onSelectWeek={handleSelectWeek} />;
  }

  const lastSession = history[0];

  return (
    <div className="app-shell">
      <nav aria-label="Primary" className="app-nav">
        <button
          onClick={() => setView("workout")}
          type="button"
        >
          Workout
        </button>
        <button
          onClick={() => setView("settings")}
          type="button"
        >
          Settings
        </button>
      </nav>
      <aside
        aria-label="Current goal"
        className="industrial-card goal-card"
      >
        Current Goal: {currentGoal}
        <div className="goal-card-text">
          Progress: {progress.sessionCount}/{SESSIONS_PER_WEEK} sessions to level up
        </div>
        {lastSession ? (
          <div className="last-session-text">
            Last session: Week {lastSession.week}, Day {lastSession.sessionNumber} - {ratingLabel[lastSession.rating]}
          </div>
        ) : null}
      </aside>
      {view === "workout" ? (
        <WorkoutDisplay
          config={config}
          currentWeek={currentWeek}
          onSuccessCheck={handleSuccessCheck}
          sessionCount={progress.sessionCount}
        />
      ) : (
        <Settings
          currentWeek={currentWeek}
          history={history}
          onSelectWeek={handleSelectWeek}
        />
      )}
    </div>
  );
}

export default App;
