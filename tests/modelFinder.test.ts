import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { comparablePrice } from '../src/lib/apiPricing';
import {
  buildEffectiveScoreWeights,
  buildTaskWeights,
  defaultModelFinderRequest,
  evaluateEligibility,
  preferredBudgetFit,
  primaryUseCase,
  recommendModels,
  scoreCandidate,
  type ModelFinderRequest,
} from '../src/lib/modelFinder';
import {
  priorityDefinitions,
  useCaseDefinitions,
} from '../src/data/modelFinderConfig';
import { models } from '../src/data/models';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-12T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

function request(
  overrides: Partial<ModelFinderRequest> = {},
): ModelFinderRequest {
  return {
    ...defaultModelFinderRequest,
    useCases: [{ id: 'coding', importance: 'high', selectionOrder: 0 }],
    requirements: { ...defaultModelFinderRequest.requirements },
    budget: { ...defaultModelFinderRequest.budget },
    ...overrides,
  };
}

describe('Model Finder task intent', () => {
  it('combines, merges, and normalizes multiple use-case weights', () => {
    const weights = buildTaskWeights([
      { id: 'coding', importance: 'high', selectionOrder: 0 },
      { id: 'mathematics', importance: 'low', selectionOrder: 1 },
    ]);
    expect(
      Object.values(weights).reduce((sum, value) => sum + value, 0),
    ).toBeCloseTo(1);
    expect(weights.coding).toBeCloseTo(1.65 / 4);
    expect(weights.agenticCoding).toBeCloseTo(0.75 / 4);
    expect(weights.reasoning).toBeCloseTo(0.95 / 4);
    expect(weights.mathematics).toBeCloseTo(0.65 / 4);
  });

  it('uses importance and then selection order to choose the primary use case', () => {
    expect(
      primaryUseCase([
        { id: 'research', importance: 'medium', selectionOrder: 1 },
        { id: 'coding', importance: 'high', selectionOrder: 2 },
      ]),
    ).toBe('coding');
    expect(
      primaryUseCase([
        { id: 'research', importance: 'high', selectionOrder: 1 },
        { id: 'coding', importance: 'high', selectionOrder: 0 },
      ]),
    ).toBe('coding');
  });

  it('keeps reliability unavailable and marks primary vision evidence as pending', () => {
    expect('reliability' in priorityDefinitions).toBe(false);
    expect(useCaseDefinitions['images-vision'].available).toBe(false);
  });
});

describe('Model Finder eligibility gates', () => {
  it('excludes safety classifiers from coding recommendations', () => {
    const shield = {
      ...structuredClone(models[0]),
      slug: 'shieldgemma-2',
      roles: ['safety-classifier' as const],
    };
    expect(shield).toBeDefined();
    expect(evaluateEligibility(shield!, request())).toContain(
      'Model is specialized for a non-assistant role.',
    );
    expect(recommendModels([shield!], request()).recommendations).toHaveLength(
      0,
    );
  });

  it('excludes a text-only model when vision is required', () => {
    const textOnly = models.find((model) => !model.facts.vision)!;
    const failures = evaluateEligibility(
      textOnly,
      request({
        requirements: {
          ...defaultModelFinderRequest.requirements,
          vision: true,
        },
      }),
    );
    expect(failures).toContain('Vision input is not supported.');
  });

  it('excludes a model without tools when tool calling is required', () => {
    const withoutTools = structuredClone(models[0]);
    withoutTools.facts.tools = false;
    expect(
      evaluateEligibility(
        withoutTools,
        request({
          requirements: {
            ...defaultModelFinderRequest.requirements,
            tools: true,
          },
        }),
      ),
    ).toContain('Tool calling is not supported.');
  });

  it('strict budget excludes every over-budget or unknown-price model', () => {
    const result = recommendModels(
      models,
      request({ budget: { tier: 'very-cheap', behavior: 'strict' } }),
    );
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(
      result.recommendations.every(
        (entry) => (comparablePrice(entry.model) ?? Infinity) <= 1,
      ),
    ).toBe(true);
  });

  it('preferred budget penalizes but retains an over-budget model', () => {
    const expensive = models.find(
      (model) => (comparablePrice(model) ?? 0) > 5,
    )!;
    const result = recommendModels(
      [expensive],
      request({ budget: { tier: 'moderate', behavior: 'preferred' } }),
    );
    expect(result.bestMatch?.model.slug).toBe(expensive.slug);
    expect(result.bestMatch?.economicsFit).toBeLessThan(100);
    expect(preferredBudgetFit(comparablePrice(expensive)!, 5)).toBeLessThan(
      100,
    );
  });

  it('requires current price for Lowest Cost and Best Value', () => {
    const missingPrice = models.find(
      (model) => comparablePrice(model) === null,
    )!;
    for (const priority of ['cost', 'value'] as const) {
      const failures = evaluateEligibility(
        missingPrice,
        request({
          priorities: [{ id: priority, importance: 'high', selectionOrder: 0 }],
        }),
      );
      expect(failures).toContain('Current verified pricing is required.');
    }
  });
});

describe('Model Finder evidence and shortlist behavior', () => {
  it('does not turn a missing benchmark into zero', () => {
    const source = models.find(
      (model) =>
        model.benchmarks?.livebench?.language !== null &&
        model.benchmarks?.livebench?.reasoning !== null,
    )!;
    const incomplete = structuredClone(source);
    incomplete.benchmarks!.livebench!.language = null;
    const candidate = scoreCandidate(
      incomplete,
      request({
        useCases: [{ id: 'writing', importance: 'high', selectionOrder: 0 }],
      }),
    );
    expect(candidate).not.toBeNull();
    expect(candidate!.taskFit).toBeGreaterThan(0);
    expect(candidate!.evidenceCoverage).toBeLessThan(100);
  });

  it('prevents low-evidence models from becoming Best Match', () => {
    const incomplete = structuredClone(models[0]);
    const livebench = incomplete.benchmarks!.livebench!;
    livebench.language = null;
    livebench.instructionFollowing = null;
    expect(
      recommendModels(
        [incomplete],
        request({
          useCases: [{ id: 'writing', importance: 'high', selectionOrder: 0 }],
        }),
      ).bestMatch,
    ).toBeNull();
  });

  it('does not let a cheap unsuitable classifier become Best Value', () => {
    const shield = {
      ...structuredClone(models[0]),
      slug: 'shieldgemma-2',
      roles: ['safety-classifier' as const],
    };
    const suitable = models.find((model) => comparablePrice(model) !== null)!;
    const result = recommendModels([shield, suitable], request());
    expect(result.bestValue?.model.slug).not.toBe(shield.slug);
    expect(
      result.recommendations.some((entry) => entry.model.slug === shield.slug),
    ).toBe(false);
  });

  it('chooses a meaningfully different alternative where possible', () => {
    const result = recommendModels(models, request());
    expect(result.bestMatch).not.toBeNull();
    expect(result.alternative).not.toBeNull();
    expect(result.alternative!.model.provider).not.toBe(
      result.bestMatch!.model.provider,
    );
    expect(result.alternative!.tradeoff).not.toHaveLength(0);
  });

  it('returns the same ranking and explanation for identical inputs', () => {
    const input = request({
      useCases: [
        { id: 'coding', importance: 'high', selectionOrder: 0 },
        { id: 'research', importance: 'medium', selectionOrder: 1 },
      ],
      priorities: [
        { id: 'quality', importance: 'high', selectionOrder: 0 },
        { id: 'value', importance: 'medium', selectionOrder: 1 },
      ],
    });
    expect(recommendModels(models, input)).toEqual(
      recommendModels(models, input),
    );
  });

  it('exposes effective weights that reproduce the displayed match score', () => {
    const input = request({
      priorities: [{ id: 'quality', importance: 'high', selectionOrder: 0 }],
    });
    const result = recommendModels(models, input);
    const candidate = result.bestMatch!;
    expect(candidate.effectiveWeights).toEqual(
      buildEffectiveScoreWeights(input.priorities),
    );
    const values = [
      [candidate.taskFit, candidate.effectiveWeights.taskFit],
      [candidate.priorityFit, candidate.effectiveWeights.priorityFit],
      [candidate.economicsFit, candidate.effectiveWeights.economicsFit],
      [candidate.queryConfidence, candidate.effectiveWeights.confidence],
    ] as const;
    const available = values.filter(
      (entry): entry is readonly [number, number] =>
        entry[0] !== null && entry[1] > 0,
    );
    const expected = Math.round(
      available.reduce((sum, [value, weight]) => sum + value * weight, 0) /
        available.reduce((sum, [, weight]) => sum + weight, 0),
    );
    expect(candidate.matchScore).toBe(expected);
  });
});
