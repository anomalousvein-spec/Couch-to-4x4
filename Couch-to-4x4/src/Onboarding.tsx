interface OnboardingProps {
  onSelectWeek: (week: number) => void;
}

export function Onboarding({ onSelectWeek }: OnboardingProps) {
  return (
    <main
      style={{
        alignItems: "center",
        background: "#101820",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, sans-serif",
        gap: "1.5rem",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "clamp(2rem, 8vw, 4rem)", margin: 0 }}>
        How active have you been lately?
      </h1>

      <section
        aria-label="Choose starting point"
        style={{
          display: "grid",
          gap: "1rem",
          maxWidth: "32rem",
          width: "100%",
        }}
      >
        <button onClick={() => onSelectWeek(1)} type="button">
          Starting from the couch
        </button>
        <button onClick={() => onSelectWeek(5)} type="button">
          Already active
        </button>
      </section>
    </main>
  );
}

export default Onboarding;
