import { normalize } from '../lib/decision';

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Normalizes LMSYS Arena Elo ratings (typically 1000 to 1700 in 2026).
 */
export function normalizeElo(
  rating: number,
  min = 1000,
  max = 1700,
): { normalized: number; min: number; max: number; raw: number } {
  const raw = Math.round(rating);
  const normalized = normalize(raw, min, max);
  return {
    raw,
    normalized,
    min,
    max,
  };
}

/**
 * Normalizes SWE-bench Verified resolved percentage (0% to 100%).
 */
export function normalizeSweBench(resolvedPct: number): {
  normalized: number;
  min: number;
  max: number;
  raw: number;
} {
  const raw = Number(resolvedPct.toFixed(1));
  const normalized = normalize(raw, 0, 100);
  return {
    raw,
    normalized,
    min: 0,
    max: 100,
  };
}

/**
 * Normalizes centered Bradley-Terry win rates / agent delta scores.
 */
export function normalizeAgentScore(
  score: number,
  min = -0.3,
  max = 0.3,
): { normalized: number; min: number; max: number; raw: number } {
  const raw = Number(score.toFixed(4));
  const normalized = normalize(raw, min, max);
  return {
    raw,
    normalized,
    min,
    max,
  };
}

/**
 * Calculates a 0-100 cost efficiency score from token pricing.
 * Inverts price so that lower cost equals higher efficiency score.
 */
export function calculateCostEfficiencyScore(
  inputPerMillion: number,
  outputPerMillion: number,
): { normalized: number; min: number; max: number; raw: number } {
  const blendedPrice = inputPerMillion * 0.7 + outputPerMillion * 0.3;
  const minCost = 0.05;
  const maxCost = 100.0;

  const safePrice = Math.max(minCost, Math.min(maxCost, blendedPrice));
  const logMin = Math.log10(minCost);
  const logMax = Math.log10(maxCost);
  const logPrice = Math.log10(safePrice);

  const calculated = 100 - ((logPrice - logMin) / (logMax - logMin)) * 100;
  const normalized = Math.round(clamp(calculated, 0, 100));

  // To maintain catalog normalization consistency normalize(raw, min, max) === normalized
  return {
    raw: normalized,
    normalized,
    min: 0,
    max: 100,
  };
}
