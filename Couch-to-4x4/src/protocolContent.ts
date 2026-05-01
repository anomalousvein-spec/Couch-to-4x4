export interface ScienceFact {
  id: string;
  text: string;
  category: 'mitochondria' | 'vo2max' | 'heart-health' | 'protocol';
  source?: string;
}

export const SCIENCE_FACTS: ScienceFact[] = [
  {
    id: 'fact-1',
    category: 'vo2max',
    text: 'VO2 Max is the single best predictor of longevity. The 4x4 protocol can increase it by up to 10% in just 8 weeks.',
    source: 'Helgerud et al., 2007'
  },
  {
    id: 'fact-2',
    category: 'mitochondria',
    text: '4x4 intervals trigger "biogenesis"—the creation of new cellular power plants, maximizing oxygen utilization efficiency.',
    source: 'NTNU Medicine'
  },
  {
    id: 'fact-3',
    category: 'heart-health',
    text: 'This protocol increases "Stroke Volume"—your heart pumps more blood per beat, reducing long-term cardiac strain.',
    source: 'American Heart Association'
  },
  {
    id: 'fact-4',
    category: 'protocol',
    text: 'The 3-minute active recovery clears lactate while keeping your heart rate high enough for the next peak push.',
    source: 'Norwegian 4x4 Standard'
  },
  {
    id: 'fact-5',
    category: 'vo2max',
    text: 'A 5 mL/kg/min increase in VO2 Max is associated with a 15% reduction in all-cause mortality.',
    source: 'Kodama et al., 2009'
  },
  {
    id: 'fact-6',
    category: 'heart-health',
    text: 'The 4x4 method is the most time-efficient way to gain cardiovascular health "ROI", requiring only 3 sessions a week.',
    source: 'Sports Medicine Research'
  }
];

/**
 * Calculates a gamified "Mitochondrial Boost" score based on the workout intensity.
 * This is a representative metric for "Biological ROI".
 * Formula: 1.25 units per minute of high-intensity work (representative metric)
 */
export function calculateMitochondrialBoost(intervals: number, workSeconds: number): number {
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
