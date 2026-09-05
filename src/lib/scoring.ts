import type { ModelScores } from '../types/model';

/**
 * Centrally configured scoring weights as specified in Section 16 of the product brief.
 * Kept configurable to avoid hidden magic numbers.
 */
export const SCORING_WEIGHTS = {
  intelligence: 0.25,
  coding: 0.18,
  agentic: 0.15,
  dailyUse: 0.12,
  research: 0.10,
  reliability: 0.08,
  writing: 0.05,
  vision: 0.03,
  speed: 0.02,
  costEfficiency: 0.02,
} as const;

/**
 * Calculates the overall composite score (0-100) from capability scores.
 */
export function calculateOverallScore(
  scores: Omit<ModelScores, 'overall' | 'confidence' | 'methodologyVersion' | 'scoreUpdatedAt'>
): number {
  const weightedSum =
    scores.intelligence * SCORING_WEIGHTS.intelligence +
    scores.coding * SCORING_WEIGHTS.coding +
    scores.agentic * SCORING_WEIGHTS.agentic +
    scores.dailyUse * SCORING_WEIGHTS.dailyUse +
    scores.research * SCORING_WEIGHTS.research +
    scores.reliability * SCORING_WEIGHTS.reliability +
    scores.writing * SCORING_WEIGHTS.writing +
    scores.vision * SCORING_WEIGHTS.vision +
    scores.speed * SCORING_WEIGHTS.speed +
    scores.costEfficiency * SCORING_WEIGHTS.costEfficiency;

  return Math.round(Math.min(100, Math.max(0, weightedSum)));
}

/**
 * Calculates effective task cost based on attempt cost, success probability, and agentic retries.
 * Section 13 of the product brief:
 * Effective Cost Per Task = (Average Cost Per Attempt / Success Probability) + Tool Overhead
 */
export function calculateEffectiveTaskCost(options: {
  inputTokens: number;
  outputTokens: number;
  inputPerMillion: number;
  outputPerMillion: number;
  successProbability: number;
  toolCallCount?: number;
  costPerToolCall?: number;
}): number {
  const {
    inputTokens,
    outputTokens,
    inputPerMillion,
    outputPerMillion,
    successProbability,
    toolCallCount = 0,
    costPerToolCall = 0,
  } = options;

  if (successProbability <= 0) {
    throw new Error('Success probability must be greater than 0');
  }

  const baseAttemptCost =
    (inputTokens / 1_000_000) * inputPerMillion +
    (outputTokens / 1_000_000) * outputPerMillion;

  const toolOverhead = toolCallCount * costPerToolCall;
  const totalAttemptCost = baseAttemptCost + toolOverhead;

  const effectiveCost = totalAttemptCost / successProbability;
  return Number(effectiveCost.toFixed(6));
}
