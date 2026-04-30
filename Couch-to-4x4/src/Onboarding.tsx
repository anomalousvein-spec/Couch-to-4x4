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
            The Norwegian 4x4 protocol is one of the most effective ways to improve VO2 max.
          </p>
          <ul className="protocol-steps">
            <li><strong>Warm-up:</strong> 5 minutes at a moderate pace.</li>
            <li><strong>Intervals:</strong> 4 minutes of high-intensity work followed by 3 minutes of active recovery.</li>
            <li><strong>Cool-down:</strong> 5 minutes at a slow pace.</li>
          </ul>
          <p>
            This app helps you build up to the full 4x4 standard over several weeks.
          </p>
        </div>

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
