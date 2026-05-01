export interface ScienceFact {
  id: string;
  text: string;
  category: 'mitochondria' | 'vo2max' | 'heart-health' | 'protocol';
}

export const SCIENCE_FACTS: ScienceFact[] = [
  {
    id: 'fact-1',
    category: 'vo2max',
    text: 'VO2 Max is the single best predictor of longevity. The 4x4 protocol can increase it by up to 10% in just 8 weeks.'
  },
  {
    id: 'fact-2',
    category: 'mitochondria',
    text: 'Mitochondria are your cellular power plants. 4x4 intervals trigger "biogenesis"—the creation of new mitochondria.'
  },
  {
    id: 'fact-3',
    category: 'heart-health',
    text: 'Interval training increases "Stroke Volume"—the amount of blood your heart pumps with every single beat.'
  },
  {
    id: 'fact-4',
    category: 'protocol',
    text: 'The 3-minute active recovery is key. It clears lactate while keeping your heart rate high enough for the next "push".'
  },
  {
    id: 'fact-5',
    category: 'mitochondria',
    text: 'Mitochondrial efficiency helps your body burn fat more effectively even when you are at rest.'
  },
  {
    id: 'fact-6',
    category: 'heart-health',
    text: 'Norwegian 4x4 has been shown to reverse some markers of cardiac aging by improving heart muscle elasticity.'
  }
];

/**
 * Calculates a gamified "Mitochondrial Boost" score based on the workout intensity.
 * This is a representative metric for "Biological ROI".
 */
export function calculateMitochondrialBoost(intervals: number, workSeconds: number): number {
  // Base boost is 1.2 units per minute of high-intensity work
  const workMinutes = (intervals * workSeconds) / 60;
  return Math.round(workMinutes * 1.25 * 10) / 10;
}

/**
 * Returns a random science fact for display during rest/cooldown.
 */
export function getRandomFact(): ScienceFact {
  const index = Math.floor(Math.random() * SCIENCE_FACTS.length);
  return SCIENCE_FACTS[index];
}
