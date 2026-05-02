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
        <div className="phase-header">
          <p className="phase-label">{phase}</p>
          <div className="intensity-target">
             <span className="hud-label">TARGET INTENSITY</span>
             <span className="hud-value">HR: {targetIntensity.hr} | RPE: {targetIntensity.rpe}</span>
          </div>
        </div>

        <div className="workout-meta-grid">
          <div className="meta-item">
            <span className="hud-label">INTERVAL</span>
            <p className="interval-label">{intervalLabel}</p>
          </div>
          <div className="meta-item">
            <span className="hud-label">TIME REMAINING</span>
            <p className="total-remaining-label">{formatTime(totalRemaining)}</p>
          </div>
        </div>

        {currentFact && (
          <div className="bio-insight-ticker">
            <span className="hud-label insight-label">BIO-INSIGHT:</span>
            <p className="ticker-text">{currentFact.text}</p>
            {currentFact.source && <span className="ticker-source">SOURCE: {currentFact.source}</span>}
          </div>
        )}
      </section>
    </>
  );
});

Dashboard.displayName = 'Dashboard';
