import { useState } from 'react';
import { SAFETY_WARNINGS, EXERCISE_TYPES, NUTRITION_GUIDANCE } from './configMapper';

interface OnboardingProps {
  onComplete: (week: number, age: number) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [age, setAge] = useState<string>('30');
  const [step, setStep] = useState<1 | 2 | 3>(1);
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
                <li><strong>Warm-up:</strong> 10 minutes at a moderate pace.</li>
                <li><strong>Intervals:</strong> 4 × 4 minutes high-intensity work (85-95% HRmax) with 3 minutes active recovery (60-70% HRmax).</li>
                <li><strong>Cool-down:</strong> 10 minutes at a slow pace.</li>
                <li><strong>Total Time:</strong> 48 minutes</li>
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
              <p className="age-hint">Used to calculate target heart rate zones using the HUNT formula (211 - 0.64 × age).</p>
            </section>

            <button className="onboarding-btn primary-btn" onClick={handleContinue} type="button" style={{ marginTop: '1.5rem' }}>
              <strong>Continue</strong>
            </button>
          </>
        ) : step === 2 ? (
          <>
            <h1 className="onboarding-title">Safety First</h1>

            <section style={{
              margin: '1.5rem 0',
              padding: '1.5rem',
              background: 'rgba(255, 176, 0, 0.05)',
              borderLeft: '4px solid var(--neon-orange)',
              fontFamily: 'var(--font-mono)',
              textAlign: 'left'
            }}>
              <h3 style={{ color: 'var(--neon-orange)', marginTop: 0 }}>⚠️ Medical Clearance Required</h3>
              <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                Before starting high-intensity training, please consult your physician, especially if you have:
              </p>
              <ul style={{ fontSize: '0.9rem', lineHeight: '1.6', marginTop: '0.5rem', marginBottom: 0 }}>
                <li>Cardiovascular concerns or heart conditions</li>
                <li>High blood pressure</li>
                <li>Recent injuries or surgery</li>
                <li>Pregnancy</li>
                <li>Any chronic health conditions</li>
              </ul>
            </section>

            <section style={{
              margin: '1.5rem 0',
              padding: '1rem',
              background: 'rgba(0, 255, 255, 0.05)',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              textAlign: 'left'
            }}>
              <h3 style={{ color: 'var(--neon-cyan)', marginTop: 0 }}>📋 Safety Guidelines</h3>
              <ul style={{ fontSize: '0.85rem', lineHeight: '1.6', margin: '0.5rem 0 0 0', paddingLeft: '1.2rem' }}>
                {SAFETY_WARNINGS.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </section>

            {!protocolConfirmed ? (
              <button
                className="onboarding-btn primary-btn"
                onClick={() => setProtocolConfirmed(true)}
                type="button"
                style={{ borderColor: 'var(--neon-orange)', color: 'var(--neon-orange)' }}
              >
                <strong>I Understand & Accept</strong>
              </button>
            ) : (
              <button className="onboarding-btn primary-btn" onClick={() => setStep(3)} type="button">
                <strong>Continue</strong>
              </button>
            )}
          </>
        ) : (
          <>
            <h1 className="onboarding-title">Exercise Options</h1>

            <p style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              The Norwegian 4x4 protocol is sport-agnostic. Choose any cardio activity:
            </p>

            <section style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.75rem',
              margin: '1.5rem 0',
              padding: '1rem',
              background: 'rgba(0, 255, 255, 0.03)',
              borderRadius: '8px'
            }}>
              {EXERCISE_TYPES.map((exercise) => (
                <div key={exercise.name} style={{
                  padding: '0.75rem',
                  background: 'rgba(0, 255, 255, 0.08)',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{exercise.name}</strong>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{exercise.description}</span>
                </div>
              ))}
            </section>

            <section style={{
              margin: '1.5rem 0',
              padding: '1rem',
              background: 'rgba(100, 255, 100, 0.05)',
              borderRadius: '8px',
              fontFamily: 'var(--font-mono)',
              textAlign: 'left'
            }}>
              <h3 style={{ color: '#66ff66', marginTop: 0 }}>🥗 Nutrition Tips</h3>
              <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                <p style={{ margin: '0.5rem 0' }}><strong>Pre-Workout:</strong> {NUTRITION_GUIDANCE.preWorkout}</p>
                <p style={{ margin: '0.5rem 0' }}><strong>During:</strong> {NUTRITION_GUIDANCE.during}</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Post-Workout:</strong> {NUTRITION_GUIDANCE.postWorkout}</p>
              </div>
            </section>

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
                <strong>I&apos;m Ready</strong>
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
