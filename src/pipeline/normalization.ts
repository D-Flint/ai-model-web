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

export { calculateCostEfficiencyScore } from '../lib/costEfficiency';
