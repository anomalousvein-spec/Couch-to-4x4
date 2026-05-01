import React from 'react';
import { formatTime } from '../../utils/time';

interface DashboardProps {
  currentWeek?: number;
  sessionCount?: number;
  phase: string;
  intervalLabel: string;
  totalRemaining: number;
  totalProgress: number;
}

export const Dashboard: React.FC<DashboardProps> = React.memo(({
  currentWeek,
  sessionCount,
  phase,
  intervalLabel,
  totalRemaining,
  totalProgress,
}) => {
  return (
    <>
      <div className="total-progress-container">
        <div className="total-progress-bar" style={{ width: `${totalProgress}%` }} />
      </div>

      <section aria-live="polite" className="dashboard-readout">
        {currentWeek !== undefined ? (
          <p className="week-label">
            Week {currentWeek}
            {sessionCount !== undefined
              ? ` | ${sessionCount}/3 sessions completed`
              : ""}
          </p>
        ) : null}
        {sessionCount !== undefined ? (
          <div
            aria-label={`${sessionCount} of 3 weekly sessions completed`}
            className="session-dots"
          >
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={`session-dot ${index < (sessionCount ?? 0) ? "complete" : ""}`}
              />
            ))}
          </div>
        ) : null}
        <p className="phase-label">{phase}</p>
        <p className="interval-label">{intervalLabel}</p>
        <p className="total-remaining-label">Total remaining: {formatTime(totalRemaining)}</p>
      </section>
    </>
  );
});

Dashboard.displayName = 'Dashboard';
