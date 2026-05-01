import React, { useMemo, useState } from 'react';
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
  const [showReward, setShowReward] = useState(false);

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

  const handleProgress = () => {
    setShowReward(true);
    // Delay the completion to show the reward
    setTimeout(() => {
      onSuccessCheck("progress");
    }, 2000);
  };

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

        {showReward ? (
          <div className="biological-reward" style={{
            padding: '1.5rem',
            margin: '1rem 0',
            border: '1px solid var(--neon-green)',
            background: 'rgba(0, 255, 102, 0.05)',
            fontFamily: 'var(--font-mono)',
            textAlign: 'center',
            animation: 'fade-in 0.5s ease-out'
          }}>
            <strong style={{ color: 'var(--neon-green)', display: 'block', marginBottom: '0.5rem' }}>BIOLOGICAL REWARD:</strong>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Biogenesis Triggered: Your heart and mitochondria are adapting.
            </p>
          </div>
        ) : (
          <div className="effort-selector">
            <h3 className="effort-title">Assess Adaptive Response:</h3>
            <button className="success-button repeat" onClick={() => onSuccessCheck("too-hard")} type="button">
              <strong>CRITICAL LOAD</strong>
              <span>Too hard, repeat level</span>
            </button>
            <button className="success-button progress" onClick={handleProgress} type="button">
              <strong>ADAPTATION SYNCED</strong>
              <span>Just right, progress</span>
            </button>
          </div>
        )}

        <footer className="report-footer">
          <p>Validated via Norwegian University of Science and Technology (NTNU) cardiovascular research.</p>
        </footer>
      </div>
    </section>
  );
});

SuccessOverlay.displayName = 'SuccessOverlay';
