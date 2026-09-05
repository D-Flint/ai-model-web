import { describe, it, expect } from 'vitest';
import {
  calculateOverallScore,
  calculateEffectiveTaskCost,
  SCORING_WEIGHTS,
} from '../src/lib/scoring';

describe('Scoring Logic', () => {
  it('correctly weights capability scores into an overall score of 0-100', () => {
    const scores = {
      intelligence: 90,
      coding: 95,
      agentic: 92,
      dailyUse: 88,
      research: 85,
      reliability: 90,
      writing: 80,
      vision: 75,
      speed: 85,
      costEfficiency: 70,
    };

    const overall = calculateOverallScore(scores);
    expect(overall).toBeGreaterThanOrEqual(0);
    expect(overall).toBeLessThanOrEqual(100);
    expect(overall).toBe(89);
  });

  it('scoring weights sum to 1.0 (100%)', () => {
    const totalWeight = Object.values(SCORING_WEIGHTS).reduce(
      (sum, w) => sum + w,
      0,
    );
    expect(Number(totalWeight.toFixed(2))).toBe(1.0);
  });
});

describe('Effective Task Cost Calculation', () => {
  it('calculates attempt cost accurately for standard token amounts', () => {
    // 1,000 input tokens at $3/1M, 500 output tokens at $15/1M
    // (1000/1M * 3) = $0.003
    // (500/1M * 15) = $0.0075
    // Total base = $0.0105
    // 100% success probability -> $0.0105
    const cost = calculateEffectiveTaskCost({
      inputTokens: 1000,
      outputTokens: 500,
      inputPerMillion: 3,
      outputPerMillion: 15,
      successProbability: 1.0,
    });

    expect(cost).toBe(0.0105);
  });

  it('factors in lower success probability resulting in higher expected cost', () => {
    // Base cost: $0.0105. At 50% success probability -> $0.021
    const cost = calculateEffectiveTaskCost({
      inputTokens: 1000,
      outputTokens: 500,
      inputPerMillion: 3,
      outputPerMillion: 15,
      successProbability: 0.5,
    });

    expect(cost).toBe(0.021);
  });

  it('factors in agentic tool overhead', () => {
    // Base cost: $0.0105 + 2 tool calls * $0.005 = $0.0205. Success 100%
    const cost = calculateEffectiveTaskCost({
      inputTokens: 1000,
      outputTokens: 500,
      inputPerMillion: 3,
      outputPerMillion: 15,
      successProbability: 1.0,
      toolCallCount: 2,
      costPerToolCall: 0.005,
    });

    expect(cost).toBe(0.0205);
  });

  it('throws error when success probability is zero or negative', () => {
    expect(() =>
      calculateEffectiveTaskCost({
        inputTokens: 1000,
        outputTokens: 500,
        inputPerMillion: 3,
        outputPerMillion: 15,
        successProbability: 0,
      }),
    ).toThrow('Success probability must be greater than 0');
  });
});
