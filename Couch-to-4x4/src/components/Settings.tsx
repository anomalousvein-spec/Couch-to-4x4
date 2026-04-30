import { useMemo, useState } from "react";
import { getAllWeekSummaries } from "../configMapper";
import {
  type SessionHistoryEntry,
} from "../progressStorage";
import { AudioManager } from "../utils/AudioManager";

interface SettingsProps {
  currentWeek: number;
  history: SessionHistoryEntry[];
  onSelectWeek: (week: number) => void;
  onResetAll: () => void;
}

const ratingLabel: Record<SessionHistoryEntry["rating"], string> = {
  "too-hard": "Too Hard",
  progress: "Just Right",
};

export function Settings({ currentWeek, history, onSelectWeek, onResetAll }: SettingsProps) {
  const [pendingWeek, setPendingWeek] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [volume, setVolume] = useState(() => AudioManager.getVolume());
  const weekSummaries = useMemo(() => getAllWeekSummaries(), []);
  const recentHistory = history.slice(0, 10);

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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    AudioManager.setVolume(newVolume);
  };

  return (
    <main className="settings-screen">
      <section className="settings-layout">
        <header className="settings-header">
          <h1 className="settings-title">Control Center</h1>
          <p className="current-week-text">Current Week: {currentWeek}</p>
        </header>

        <section aria-label="Audio settings" className="industrial-card settings-card">
          <h2 className="history-title">Audio</h2>
          <div className="volume-control">
            <label htmlFor="volume-slider">Cue Volume: {Math.round(volume * 100)}%</label>
            <input
              id="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
            />
          </div>
        </section>

        <section
          aria-label="Program weeks"
          className="week-list"
        >
          <h2 className="history-title">Level Selector</h2>
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

        <section aria-label="Danger zone" className="danger-zone">
          <button
            className="control-btn secondary-btn reset-all-btn"
            onClick={() => setShowResetConfirm(true)}
            type="button"
          >
            Reset All Progress
          </button>
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

      {showResetConfirm ? (
        <section
          aria-modal="true"
          role="dialog"
          className="settings-modal"
        >
          <div className="settings-dialog industrial-card">
            <h2 className="modal-title">Reset all progress?</h2>
            <p className="modal-text">
              This will permanently delete your history and reset your progress back to the beginning. This cannot be undone.
            </p>
            <button className="confirm-btn danger-btn" onClick={onResetAll} type="button">
              Reset Everything
            </button>
            <button className="cancel-btn" onClick={() => setShowResetConfirm(false)} type="button">
              Cancel
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
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(entry.timestamp));

  return `${date}: Week ${entry.week}, Day ${entry.sessionNumber} - ${ratingLabel[entry.rating]}`;
}

export default Settings;
