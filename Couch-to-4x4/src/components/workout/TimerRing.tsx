import React from 'react';
import { CIRCLE_CIRCUMFERENCE } from '../../constants';

interface TimerRingProps {
  secondsRemaining: number;
  phaseDuration: number;
  phase: string;
}

export const TimerRing: React.FC<TimerRingProps> = React.memo(({
  secondsRemaining,
  phaseDuration,
  phase,
}) => {
  const phaseProgress = phaseDuration > 0 ? (secondsRemaining / phaseDuration) * 100 : 0;

  return (
    <div className="timer-container">
      <svg className="timer-ring" viewBox="0 0 100 100">
        <circle
          className="timer-ring-bg"
          cx="50"
          cy="50"
          r="45"
        />
        <circle
          className="timer-ring-progress"
          cx="50"
          cy="50"
          r="45"
          style={{
            strokeDashoffset: `${CIRCLE_CIRCUMFERENCE - (CIRCLE_CIRCUMFERENCE * phaseProgress) / 100}`
          }}
        />
      </svg>
      <div
        aria-label={`${secondsRemaining} seconds remaining in ${phase} phase`}
        className="timer-text"
      >
        {secondsRemaining}
        <div className="phase-duration-readout">
          {secondsRemaining} / {phaseDuration}s
        </div>
      </div>
    </div>
  );
});

TimerRing.displayName = 'TimerRing';
