import { useCallback, useMemo, useState } from "react";
import {
  getCurrentGoalLabel,
  getWorkoutConfig,
  MAX_PROGRAM_WEEK,
  RESEARCH_FACTS,
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

function ConsistencyRing({ score }: { score: number }) {
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="consistency-dashboard">
      <div className="consistency-ring-container">
        <svg width="60" height="60" viewBox="0 0 60 60">
          <circle
            className="consistency-ring-bg"
            cx="30"
            cy="30"
            r={radius}
          />
          <circle
            className="consistency-ring-progress"
            cx="30"
            cy="30"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 30 30)"
          />
        </svg>
      </div>
      <div className="consistency-label">
        <span className="consistency-title">Consistency Score</span>
        <span className="consistency-value">{Math.round(score)}%</span>
        <span className="consistency-subtext">Last 28 days</span>
      </div>
    </div>
  );
}

export function App() {
  const [progress, setProgress] = useState<WorkoutProgress>(() => loadWorkoutProgress());
  const [history, setHistory] = useState<SessionHistoryEntry[]>(() => loadSessionHistory());
  const [view, setView] = useState<AppView>("workout");

  const currentWeek = progress.currentWeek;
  const config = useMemo(
    () => (currentWeek === null ? null : getWorkoutConfig(currentWeek)),
    [currentWeek]
  );
  const currentGoal = useMemo(
    () => (currentWeek === null ? null : getCurrentGoalLabel(currentWeek)),
    [currentWeek]
  );

  const consistencyScore = useMemo(() => {
    const twentyEightDaysAgo = Date.now() - 28 * 24 * 60 * 60 * 1000;
    const recentSessions = history.filter(entry => entry.timestamp >= twentyEightDaysAgo).length;
    const goalSessions = SESSIONS_PER_WEEK * 4;
    return Math.min(100, (recentSessions / goalSessions) * 100);
  }, [history]);

  const missionIntel = useMemo(() => {
    return RESEARCH_FACTS[Math.floor(Math.random() * RESEARCH_FACTS.length)];
  }, []);

  const handleCompleteOnboarding = useCallback((week: number, age: number): void => {
    const nextProgress: WorkoutProgress = {
      currentWeek: week,
      sessionCount: 0,
      age: age,
    };

    saveWorkoutProgress(nextProgress);
    setProgress(nextProgress);
    setView("workout");
  }, []);

  const handleSelectWeek = useCallback((week: number): void => {
    const nextProgress: WorkoutProgress = {
      ...progress,
      currentWeek: week,
      sessionCount: 0,
    };

    saveWorkoutProgress(nextProgress);
    setProgress(nextProgress);
    setView("workout");
  }, [progress]);

  const handleResetAll = useCallback((): void => {
    localStorage.clear();
    setProgress({ currentWeek: null, sessionCount: 0, age: null });
    setHistory([]);
    setView("workout");
  }, []);

  const handleSuccessCheck = useCallback((result: EffortRating): void => {
    if (progress.currentWeek === null) {
      return;
    }

    const sessionNumber = Math.min(
      SESSIONS_PER_WEEK,
      progress.sessionCount + 1
    );
    const loggedSession = logSession(
      progress.currentWeek,
      result,
      sessionNumber
    );

    if (loggedSession) {
      setHistory((previousHistory) => [loggedSession, ...previousHistory].slice(0, 100));
    }

    if (result === "too-hard") {
      return;
    }

    const nextSessionCount = progress.sessionCount + 1;
    const shouldAdvanceWeek = nextSessionCount >= SESSIONS_PER_WEEK;
    const newCurrentWeek = shouldAdvanceWeek
      ? Math.min(progress.currentWeek + 1, MAX_PROGRAM_WEEK)
      : progress.currentWeek;
    const newSessionCount = shouldAdvanceWeek ? 0 : nextSessionCount;
    const nextProgress: WorkoutProgress = {
      ...progress,
      currentWeek: newCurrentWeek,
      sessionCount: newSessionCount,
    };

    saveWorkoutProgress(nextProgress);
    setProgress(nextProgress);
  }, [progress]);

  if (currentWeek === null || config === null || currentGoal === null) {
    return <Onboarding onComplete={handleCompleteOnboarding} />;
  }

  const lastSession = history[0];

  return (
    <div className="app-shell">
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

      <ConsistencyRing score={consistencyScore} />

      <section className="angular-glass-card" style={{
        margin: '1rem',
        padding: '1rem',
        border: '1px solid var(--neon-cyan)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.85rem'
      }}>
        <strong style={{ color: 'var(--neon-cyan)', display: 'block', marginBottom: '0.5rem' }}>MISSION INTEL:</strong>
        {missionIntel}
      </section>

      {view === "workout" ? (
        <WorkoutDisplay
          config={config}
          currentWeek={currentWeek}
          onSuccessCheck={handleSuccessCheck}
          sessionCount={progress.sessionCount}
          age={progress.age ?? 30}
        />
      ) : (
        <Settings
          currentWeek={currentWeek}
          history={history}
          onSelectWeek={handleSelectWeek}
          onResetAll={handleResetAll}
        />
      )}

      <nav aria-label="Primary" className="app-nav bottom-nav">
        <button
          onClick={() => setView("workout")}
          type="button"
          className={view === "workout" ? "active-nav-btn" : "nav-btn"}
        >
          Workout
        </button>
        <button
          onClick={() => setView("settings")}
          type="button"
          className={view === "settings" ? "active-nav-btn" : "nav-btn"}
        >
          Settings
        </button>
      </nav>
    </div>
  );
}

export default App;
