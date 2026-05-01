import React from 'react';

interface SuccessOverlayProps {
  onSuccessCheck: (result: "too-hard" | "progress") => void;
}

export const SuccessOverlay: React.FC<SuccessOverlayProps> = React.memo(({
  onSuccessCheck,
}) => {
  return (
    <section aria-modal="true" role="dialog" className="success-overlay">
      <div className="success-card industrial-card">
        <h2 className="success-title">How was your effort today?</h2>
        <button className="success-button repeat" onClick={() => onSuccessCheck("too-hard")} type="button">
          Too Hard (Repeat this session)
        </button>
        <button className="success-button progress" onClick={() => onSuccessCheck("progress")} type="button">
          Just Right / Challenging (Progress)
        </button>
      </div>
    </section>
  );
});

SuccessOverlay.displayName = 'SuccessOverlay';
