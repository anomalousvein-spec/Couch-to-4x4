import React, { useMemo } from 'react';
import { calculateMitochondrialBoost } from '../../protocolContent';
import { formatTime } from '../../utils/time';

interface SuccessOverlayProps {
  onSuccessCheck: (result: "too-hard" | "progress") => void;
  config: {
    intervals: number;
    workSeconds: number;
    restSeconds: number;
  };
}

export const SuccessOverlay: React.FC<SuccessOverlayProps> = React.memo(({
  onSuccessCheck,
  config
}) => {
  const stats = useMemo(() => {
    const totalWorkTime = config.intervals * config.workSeconds;
    const totalRestTime = config.intervals * config.restSeconds;
    const mitochondrialBoost = calculateMitochondrialBoost(config.intervals, config.workSeconds);

    return {
      totalWorkTime,
      totalRestTime,
      mitochondrialBoost
    };
  }, [config]);

  return (
    <section aria-modal="true" role="dialog" className="success-overlay">
      <div className="success-card industrial-card">
        <header className="report-header">
          <h2 className="success-title">BIO-SYNC REPORT</h2>
          <div className="sync-status">PROTOCOL COMPLETED</div>
        </header>

        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">HIGH INTENSITY TIME</span>
            <span className="stat-value">{formatTime(stats.totalWorkTime)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">MITOCHONDRIAL BOOST</span>
            <span className="stat-value boost">+{stats.mitochondrialBoost} ROI</span>
          </div>
        </div>

        <div className="effort-selector">
          <h3 className="effort-title">Assess Adaptive Response:</h3>
          <button className="success-button repeat" onClick={() => onSuccessCheck("too-hard")} type="button">
            <strong>CRITICAL LOAD</strong>
            <span>Too hard, repeat level</span>
          </button>
          <button className="success-button progress" onClick={() => onSuccessCheck("progress")} type="button">
            <strong>ADAPTATION SYNCED</strong>
            <span>Just right, progress</span>
          </button>
        </div>
      </div>
    </section>
  );
});

SuccessOverlay.displayName = 'SuccessOverlay';
