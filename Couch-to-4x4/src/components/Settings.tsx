import { useMemo, useState } from "react";
import { getAllWeekSummaries, getPhase } from "../configMapper";
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

function RoadMap({ currentWeek }: { currentWeek: number }) {
  const currentPhase = getPhase(currentWeek);
  const phases: Array<{ name: string; key: "Habit" | "Intervals" | "Threshold" | "HIIT"; class: string }> = [
    { name: "Habit", key: "Habit", class: "habit" },
    { name: "Intervals", key: "Intervals", class: "intervals" },
    { name: "Threshold", key: "Threshold", class: "threshold" },
    { name: "HIIT", key: "HIIT", class: "hiit" },
  ];

  const phaseOrder = ["Habit", "Intervals", "Threshold", "HIIT"];
  const currentPhaseIndex = phaseOrder.indexOf(currentPhase);

  return (
    <div className="road-map-container industrial-card industrial-card-padded">
      <h2 className="hud-label road-map-title">ROAD TO 4x4</h2>
      <div className="road-map-track">
        {phases.map((phase, index) => {
          const isActive = phase.key === currentPhase;
          const isCompleted = index < currentPhaseIndex;

          return (
            <div
              key={phase.key}
              className={`phase-node ${phase.class} ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
            >
              <div className="node-dot">
                {isCompleted ? "✓" : index + 1}
              </div>
              <span className="node-label node-label-refinement">{phase.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
          <h1 className="settings-title">CONTROL CENTER</h1>
          <p className="hud-label settings-current-week">CURRENT WEEK: {currentWeek}</p>
        </header>

        <RoadMap currentWeek={currentWeek} />

        <section aria-label="Audio settings" className="industrial-card settings-card industrial-card-padded">
          <h2 className="history-title">AUDIO</h2>
          <div className="volume-control">
            <label className="hud-label" htmlFor="volume-slider">CUE VOLUME: {Math.round(volume * 100)}%</label>
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
          <h2 className="history-title level-selector-title">LEVEL SELECTOR</h2>
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
          className="industrial-card history-card industrial-card-padded"
        >
          <h2 className="history-title">RECENT WORKOUTS</h2>
          {recentHistory.length > 0 ? (
            <ul className="history-list">
              {recentHistory.map((entry) => (
                <li key={entry.timestamp} className="history-item">
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
            className="control-btn secondary-btn danger-btn full-width-btn"
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
          aria-labelledby="skip-week-title"
          className="settings-modal"
        >
          <div className="settings-dialog industrial-card">
            <h2 id="skip-week-title" className="onboarding-title modal-title-refinement">Skip to Week {pendingWeek}?</h2>
            <p className="modal-text">
              This protocol is designed around cardiorespiratory recovery. Jumping ahead too quickly can make the next intervals harder to recover from.
            </p>
            <button className="onboarding-btn primary-btn" onClick={confirmPendingWeek} type="button">
              Confirm week {pendingWeek}
            </button>
            <button className="onboarding-btn secondary-btn" onClick={() => setPendingWeek(null)} type="button">
              Stay on week {currentWeek}
            </button>
          </div>
        </section>
      ) : null}

      {showResetConfirm ? (
        <section
          aria-modal="true"
          role="dialog"
          aria-labelledby="reset-title"
          className="settings-modal"
        >
          <div className="settings-dialog industrial-card">
            <h2 id="reset-title" className="onboarding-title modal-title-refinement">Reset all progress?</h2>
            <p className="modal-text">
              This will permanently delete your history and reset your progress back to the beginning. This cannot be undone.
            </p>
            <button className="onboarding-btn primary-btn danger-btn" onClick={onResetAll} type="button">
              Reset Everything
            </button>
            <button className="onboarding-btn secondary-btn" onClick={() => setShowResetConfirm(false)} type="button">
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

  return `${date.toUpperCase()}: WEEK ${entry.week}, DAY ${entry.sessionNumber} - ${ratingLabel[entry.rating].toUpperCase()}`;
}

export default Settings;
