import React, { useEffect, useState } from 'react';
import { formatTime } from '../../utils/time';
import { WorkoutPhase } from '../../workoutEngine';
import { getRandomFact, type ScienceFact } from '../../protocolContent';

interface DashboardProps {
  currentWeek?: number;
  sessionCount?: number;
  phase: WorkoutPhase;
  intervalLabel: string;
  totalRemaining: number;
  totalProgress: number;
}

const intensityGuide: Record<WorkoutPhase, { hr: string; rpe: string }> = {
  [WorkoutPhase.WARMUP]: { hr: '60-70%', rpe: '3-4' },
  [WorkoutPhase.WORK]: { hr: '85-95%', rpe: '9-10' },
  [WorkoutPhase.REST]: { hr: '70%', rpe: '3' },
  [WorkoutPhase.COOLDOWN]: { hr: '<60%', rpe: '2' },
};

export const Dashboard: React.FC<DashboardProps> = React.memo(({
  currentWeek,
  sessionCount,
  phase,
  intervalLabel,
  totalRemaining,
  totalProgress,
}) => {
  const [currentFact, setCurrentFact] = useState<ScienceFact | null>(null);

  useEffect(() => {
    if (phase === WorkoutPhase.REST || phase === WorkoutPhase.COOLDOWN) {
      setCurrentFact(getRandomFact());
    } else {
      setCurrentFact(null);
    }
  }, [phase]);

  const targetIntensity = intensityGuide[phase];

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

        <div className="phase-header">
          <p className="phase-label">{phase}</p>
          <div className="intensity-target">
             <span className="intensity-tag">Target Intensity</span>
             <span className="intensity-values">HR: {targetIntensity.hr} | RPE: {targetIntensity.rpe}</span>
          </div>
        </div>

        <p className="interval-label">{intervalLabel}</p>
        <p className="total-remaining-label">Total remaining: {formatTime(totalRemaining)}</p>

        {currentFact && (
          <div className="bio-insight-ticker">
            <span className="ticker-label">BIO-INSIGHT:</span>
            <p className="ticker-text">{currentFact.text}</p>
            {currentFact.source && <span className="ticker-source">Source: {currentFact.source}</span>}
          </div>
        )}
      </section>
    </>
  );
});

Dashboard.displayName = 'Dashboard';
