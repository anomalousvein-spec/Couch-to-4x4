import { useMemo, useState } from "react";
import { getAllWeekSummaries } from "../configMapper";
import {
  type SessionHistoryEntry,
} from "../progressStorage";

interface SettingsProps {
  currentWeek: number;
  history: SessionHistoryEntry[];
  onSelectWeek: (week: number) => void;
}

const ratingLabel: Record<SessionHistoryEntry["rating"], string> = {
  "too-hard": "Too Hard",
  progress: "Just Right",
};

export function Settings({ currentWeek, history, onSelectWeek }: SettingsProps) {
  const [pendingWeek, setPendingWeek] = useState<number | null>(null);
  const weekSummaries = useMemo(() => getAllWeekSummaries(), []);
  const recentHistory = history.slice(0, 5);

  const handleWeekSelect = (week: number): void => {
    if (week > currentWeek + 2) {
      setPendingWeek(week);
      return;
    }

    onSelectWeek(week);
  };

  const confirmPendingWeek = (): void => {
    if (pendingWeek === null) {
      return;
    }

    onSelectWeek(pendingWeek);
    setPendingWeek(null);
  };

  return (
    <main className="settings-screen">
      <section className="settings-layout">
        <header className="settings-header">
          <h1 className="settings-title">Level Selector</h1>
          <p className="current-week-text">Current week: {currentWeek}</p>
        </header>

        <section
          aria-label="Program weeks"
          className="week-list"
        >
          {weekSummaries.map(({ label, week }) => {
            const isCurrent = week === currentWeek;

            return (
              <button
                className={`week-button ${isCurrent ? "current" : ""}`}
                key={week}
                onClick={() => handleWeekSelect(week)}
                type="button"
              >
                {label}
              </button>
            );
          })}
        </section>

        <section
          aria-label="Session history"
          className="industrial-card history-card"
        >
          <h2 className="history-title">Recent Workouts</h2>
          {recentHistory.length > 0 ? (
            <ul className="history-list">
              {recentHistory.map((entry) => (
                <li key={entry.id} className="history-item">
                  {formatHistoryEntry(entry)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-history-text">No sessions logged yet.</p>
          )}
        </section>
      </section>

      {pendingWeek !== null ? (
        <section
          aria-modal="true"
          role="dialog"
          className="settings-modal"
        >
          <div className="settings-dialog industrial-card">
            <h2 className="modal-title">Skip ahead to week {pendingWeek}?</h2>
            <p className="modal-text">
              This protocol is designed around cardiorespiratory recovery. Jumping ahead too quickly can make the next intervals harder to recover from.
            </p>
            <button className="confirm-btn" onClick={confirmPendingWeek} type="button">
              Confirm week {pendingWeek}
            </button>
            <button className="cancel-btn" onClick={() => setPendingWeek(null)} type="button">
              Stay on week {currentWeek}
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function formatHistoryEntry(entry: SessionHistoryEntry): string {
  const date = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(entry.timestamp));

  return `${date}: Week ${entry.week}, Day ${entry.sessionNumber} - ${ratingLabel[entry.rating]}`;
}

export default Settings;
