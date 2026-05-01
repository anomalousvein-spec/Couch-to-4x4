interface OnboardingProps {
  onSelectWeek: (week: number) => void;
}

export function Onboarding({ onSelectWeek }: OnboardingProps) {
  return (
    <main className="onboarding-screen">
      <div className="onboarding-card industrial-card">
        <h1 className="onboarding-title">
          Protocol: Norwegian 4x4
        </h1>

        <div className="protocol-info">
          <p>
            The Norwegian 4x4 protocol is the <strong>most evidence-based, time-efficient method</strong> for maximizing VO2 Max and cardiovascular health ROI.
          </p>
          <ul className="protocol-steps">
            <li><strong>Warm-up:</strong> 5 minutes at a moderate pace.</li>
            <li><strong>Intervals:</strong> High-intensity work followed by 3 minutes of active recovery.</li>
            <li><strong>Cool-down:</strong> 5 minutes at a slow pace.</li>
          </ul>
        </div>

        <section className="intensity-guide-box">
          <h2 className="guide-title">Intensity Guide (RPE)</h2>
          <p className="guide-text">RPE (Rate of Perceived Exertion) is how hard you feel you&apos;re working on a scale of 1-10.</p>
          <div className="rpe-scale">
             <div className="rpe-item low">
                <span className="rpe-num">3-4</span>
                <span className="rpe-desc">Warmup/Rest (Can talk easily)</span>
             </div>
             <div className="rpe-item high">
                <span className="rpe-num">9-10</span>
                <span className="rpe-desc">Interval (Huffing &amp; puffing)</span>
             </div>
          </div>
        </section>

        <h2 className="onboarding-subtitle">How active have you been lately?</h2>

        <section
          aria-label="Choose starting point"
          className="onboarding-options"
        >
          <button className="onboarding-btn primary-btn" onClick={() => onSelectWeek(1)} type="button">
            <strong>Starting Fresh</strong>
            <span>Beginning the journey</span>
          </button>
          <button className="onboarding-btn secondary-btn" onClick={() => onSelectWeek(5)} type="button">
            <strong>Already Active</strong>
            <span>Jumping in at Week 5</span>
          </button>
        </section>
      </div>
    </main>
  );
}

export default Onboarding;
