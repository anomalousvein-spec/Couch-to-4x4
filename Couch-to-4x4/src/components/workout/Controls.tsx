import React from 'react';
import { Status } from '../../workoutEngine';

interface ControlsProps {
  status: Status;
  onPause: () => void;
  onStart: () => void;
  onReset: () => void;
  onSkipPhase: () => void;
}

export const Controls: React.FC<ControlsProps> = React.memo(({
  status,
  onPause,
  onStart,
  onReset,
  onSkipPhase,
}) => {
  return (
    <section aria-label="Workout controls" className="controls-container" role="group">
      {status === 'running' ? (
        <button aria-pressed={status === 'running'} className="control-btn primary-btn" onClick={onPause} type="button">
          Pause
        </button>
      ) : (
        <button className="control-btn primary-btn" onClick={onStart} type="button">
          {status === 'idle' ? 'Start' : 'Resume'}
        </button>
      )}
      <button className="control-btn secondary-btn" onClick={onReset} type="button">
        Reset
      </button>
      <button className="control-btn secondary-btn skip-btn" onClick={onSkipPhase} type="button">
        Skip
      </button>
    </section>
  );
});

Controls.displayName = 'Controls';
