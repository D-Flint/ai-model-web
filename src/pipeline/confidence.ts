/**
 * Calculates evidence confidence (0-100%) for a model's derived scores.
 * Considers independent sources, category coverage, sample size, and recency.
 */

export interface ConfidenceFactors {
  independentSourcesCount: number;
  coveredCategoriesCount: number;
  totalCategoriesCount?: number;
  totalSampleCount: number;
  recencyDays: number;
  hasOfficialVerification: boolean;
}

export function calculateConfidence(factors: ConfidenceFactors): number {
  const {
    independentSourcesCount,
    coveredCategoriesCount,
    totalCategoriesCount = 10,
    totalSampleCount,
    recencyDays,
    hasOfficialVerification,
  } = factors;

  // 1. Independent sources weight: up to 30% (maxes out at 4 independent sources)
  const sourceScore = Math.min(1, independentSourcesCount / 4) * 30;

  // 2. Category coverage weight: up to 30%
  const coverageScore =
    Math.min(1, coveredCategoriesCount / totalCategoriesCount) * 30;

  // 3. Sample size weight: up to 20% (maxes out at 5000+ benchmark votes/runs)
  const sampleScore =
    Math.min(1, Math.log10(Math.max(1, totalSampleCount)) / 4) * 20;

  // 4. Recency weight: up to 10% (decays linearly over 180 days)
  const recencyScore = Math.max(0, 1 - recencyDays / 180) * 10;

  // 5. Official provider verification weight: 10%
  const verificationScore = hasOfficialVerification ? 10 : 0;

  const total = Math.round(
    sourceScore +
      coverageScore +
      sampleScore +
      recencyScore +
      verificationScore,
  );

  return Math.max(0, Math.min(100, total));
}
