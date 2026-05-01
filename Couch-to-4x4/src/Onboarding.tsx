import { useState, useRef } from 'react';
import { SAFETY_WARNINGS, EXERCISE_TYPES, NUTRITION_GUIDANCE } from './configMapper';

interface OnboardingProps {
  onComplete: (week: number, age: number) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [age, setAge] = useState<string>('30');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [protocolConfirmed, setProtocolConfirmed] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);
  const ageInputRef = useRef<HTMLInputElement>(null);
  
  const validateAge = (): boolean => {
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setAgeError("Please enter a valid age between 1 and 120.");
      ageInputRef.current?.focus();
      return false;
    }
    setAgeError(null);
    return true;
  };

  const handleComplete = (week: number) => {
    if (!validateAge()) return;
    const ageNum = parseInt(age, 10);
    onComplete(week, ageNum);
  };

  const handleContinue = () => {
    if (!validateAge()) return;
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
                  ref={ageInputRef}
                  type="number"
                  id="age-input"
                  value={age}
                  onChange={(e) => {
                    setAge(e.target.value);
                    if (ageError) setAgeError(null);
                  }}
                  min="1"
                  max="120"
                  className={`industrial-input ${ageError ? 'input-error' : ''}`}
                  aria-invalid={!!ageError}
                  aria-describedby={ageError ? "age-error-message" : undefined}
                />
                <label htmlFor="age-input" className="age-label">YEARS OLD</label>
              </div>
              {ageError && (
                <p id="age-error-message" className="error-message" role="alert">
                  {ageError}
                </p>
              )}
              <p className="age-hint">Used to calculate target heart rate zones using the HUNT formula (211 - 0.64 × age).</p>
            </section>

            <button className="onboarding-btn primary-btn" onClick={handleContinue} type="button">
              <strong>Continue</strong>
            </button>
          </>
        ) : step === 2 ? (
          <>
            <h1 className="onboarding-title">Safety First</h1>

            <section className="warning-callout">
              <h3 className="medical-clearance-title">⚠️ Medical Clearance Required</h3>
              <p className="onboarding-p-refinement">
                Before starting high-intensity training, please consult your physician, especially if you have:
              </p>
              <ul className="onboarding-list">
                <li>Cardiovascular concerns or heart conditions</li>
                <li>High blood pressure</li>
                <li>Recent injuries or surgery</li>
                <li>Pregnancy</li>
                <li>Any chronic health conditions</li>
              </ul>
            </section>

            <section className="info-callout">
              <h3 className="guidelines-title">📋 Safety Guidelines</h3>
              <ul className="guidelines-list">
                {SAFETY_WARNINGS.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </section>

            {!protocolConfirmed ? (
              <button
                className="onboarding-btn primary-btn orange-border-btn"
                onClick={() => setProtocolConfirmed(true)}
                type="button"
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

            <p className="onboarding-disclaimer">
              The Norwegian 4x4 protocol is sport-agnostic. Choose any cardio activity:
            </p>

            <section className="exercise-grid">
              {EXERCISE_TYPES.map((exercise) => (
                <div key={exercise.name} className="exercise-item">
                  <strong className="exercise-name">{exercise.name}</strong>
                  <span className="exercise-desc">{exercise.description}</span>
                </div>
              ))}
            </section>

            <section className="success-callout">
              <h3 className="nutrition-title">🥗 Nutrition Tips</h3>
              <div className="nutrition-content">
                <p className="nutrition-p"><strong>Pre-Workout:</strong> {NUTRITION_GUIDANCE.preWorkout}</p>
                <p className="nutrition-p"><strong>During:</strong> {NUTRITION_GUIDANCE.during}</p>
                <p className="nutrition-p"><strong>Post-Workout:</strong> {NUTRITION_GUIDANCE.postWorkout}</p>
              </div>
            </section>

            <section className="technical-quote">
              <p className="technical-quote-p">
                &ldquo;The Norwegian 4x4 is evidence-based and effective. It is designed to be difficult. It works because it is hard.&rdquo;
              </p>
            </section>

            {!protocolConfirmed ? (
              <button
                className="onboarding-btn primary-btn orange-border-btn"
                onClick={() => setProtocolConfirmed(true)}
                type="button"
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
                    <div className="option-btn-content">
                      <strong>Starting Fresh</strong>
                      <span className="option-btn-subtitle">Beginning the journey</span>
                    </div>
                  </button>
                  <button className="onboarding-btn secondary-btn" onClick={() => handleComplete(5)} type="button">
                    <div className="option-btn-content">
                      <strong>Already Active</strong>
                      <span className="option-btn-subtitle">Jumping in at Week 5</span>
                    </div>
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
