import { useState } from 'react';

interface OnboardingProps {
  onComplete: (week: number, age: number) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [age, setAge] = useState<string>('30');
  const [step, setStep] = useState<1 | 2>(1);
  const [protocolConfirmed, setProtocolConfirmed] = useState(false);

  const handleComplete = (week: number) => {
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      alert("Please enter a valid age between 1 and 120.");
      return;
    }
    onComplete(week, ageNum);
  };

  const handleContinue = () => {
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      alert("Please enter a valid age between 1 and 120.");
      return;
    }
    setStep(2);
  };

  return (
    <main className="onboarding-screen">
      <div className="onboarding-card industrial-card">
        {step === 1 ? (
          <>
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

            <section className="age-input-section">
              <h2 className="onboarding-subtitle">Your Age</h2>
              <div className="age-input-container">
                <input
                  type="number"
                  id="age-input"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="1"
                  max="120"
                  className="industrial-input"
                />
                <label htmlFor="age-input" className="age-label">YEARS OLD</label>
              </div>
              <p className="age-hint">Used to calculate target heart rate zones.</p>
            </section>

            <button className="onboarding-btn primary-btn" onClick={handleContinue} type="button" style={{ marginTop: '1.5rem' }}>
              <strong>Continue</strong>
            </button>
          </>
        ) : (
          <>
            <h1 className="onboarding-title">The Protocol</h1>

            <section style={{
              margin: '2rem 0',
              padding: '1.5rem',
              background: 'rgba(255, 176, 0, 0.05)',
              borderLeft: '4px solid var(--neon-orange)',
              fontFamily: 'var(--font-mono)',
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.5', margin: 0 }}>
                &ldquo;The Norwegian 4x4 is evidence-based and effective. It is designed to be difficult. It works because it is hard.&rdquo;
              </p>
            </section>

            {!protocolConfirmed ? (
              <button
                className="onboarding-btn primary-btn"
                onClick={() => setProtocolConfirmed(true)}
                type="button"
                style={{ borderColor: 'var(--neon-orange)', color: 'var(--neon-orange)' }}
              >
                <strong>Confirm</strong>
              </button>
            ) : (
              <>
                <h2 className="onboarding-subtitle">How active have you been lately?</h2>

                <section
                  aria-label="Choose starting point"
                  className="onboarding-options"
                >
                  <button className="onboarding-btn primary-btn" onClick={() => handleComplete(1)} type="button">
                    <strong>Starting Fresh</strong>
                    <span>Beginning the journey</span>
                  </button>
                  <button className="onboarding-btn secondary-btn" onClick={() => handleComplete(5)} type="button">
                    <strong>Already Active</strong>
                    <span>Jumping in at Week 5</span>
                  </button>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default Onboarding;
