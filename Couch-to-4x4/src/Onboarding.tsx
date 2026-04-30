interface OnboardingProps {
  onSelectWeek: (week: number) => void;
}

export function Onboarding({ onSelectWeek }: OnboardingProps) {
  return (
    <main className="onboarding-screen industrial-display">
      <h1 className="onboarding-title">
        How active have you been lately?
      </h1>

      <section
        aria-label="Choose starting point"
        className="onboarding-options"
      >
        <button className="onboarding-btn" onClick={() => onSelectWeek(1)} type="button">
          Starting from the couch
        </button>
        <button className="onboarding-btn" onClick={() => onSelectWeek(5)} type="button">
          Already active
        </button>
      </section>
    </main>
  );
}

export default Onboarding;
