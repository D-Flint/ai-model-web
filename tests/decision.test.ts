import { comparablePrice } from '../src/lib/apiPricing';
import { describe, it, expect } from 'vitest';
import { models, mockModels } from '../src/data/models';
import {
  confidence,
  normalize,
  recommend,
  rankModels,
  selectionAtMaximumEffort,
  selectionFromSearch,
  taskCost,
  getModelEffortStats,
  getMaxReasoningEffort,
  getSpeedDisplayValue,
  getSpeedTokensPerSec,
} from '../src/lib/decision';
import { validateCatalog } from '../src/lib/importCatalog';
import { catalogSchema } from '../src/lib/catalogSchema';

describe('normalized, traceable scores', () => {
  it('normalizes incompatible raw ranges with explicit bounds and clamps outliers', () => {
    expect(normalize(750, 0, 1000)).toBe(75);
    expect(normalize(3, 0, 4)).toBe(75);
    expect(normalize(150, 0, 100)).toBe(100);
    expect(() => normalize(1, 1, 1)).toThrow();
  });
  it('accepts the complete fictional catalog with no claimed real confidence', () => {
    expect(validateCatalog(mockModels)).toHaveLength(12);
    expect(
      mockModels.every((m) => m.confidence === 0 && m.lastVerifiedAt === null),
    ).toBe(true);
  });
  it('rejects untraceable prices and missing capability evidence', () => {
    const copy = structuredClone(models);
    copy[0].pricing.sourceId = 'missing';
    expect(() => validateCatalog(copy)).toThrow();
    const missing = structuredClone(models);
    missing[0].evidence = [];
    expect(() => validateCatalog(missing)).toThrow();
  });
  it('rejects synthetic evidence passed off as verified data', () => {
    const copy = structuredClone(mockModels);
    copy[0].dataKind = 'verified';
    expect(() => catalogSchema.parse(copy)).toThrow();
  });
  it('rejects changed scores and duplicate slugs', () => {
    const copy = structuredClone(models);
    copy[0].scores.coding = 12;
    expect(() => validateCatalog(copy)).toThrow();
    expect(() => validateCatalog([models[0], models[0]])).toThrow();
  });
  it('decreases confidence for stale, inconsistent, and limited evidence', () => {
    const input = {
      independentSources: 5,
      quality: 1,
      ageDays: 0,
      testCount: 50,
      variance: 0,
      coverage: 1,
    };
    expect(confidence(input)).toBe(100);
    expect(confidence({ ...input, ageDays: 180 })).toBe(85);
    expect(confidence({ ...input, variance: 25, coverage: 0.5 })).toBe(80);
  });
});
describe('recommendation and comparison flows', () => {
  it('produces deterministic recommendations and respects hard budgets', () => {
    const a = recommend(models, 'coding', 'balanced', 'cheap');
    expect(a).toEqual(recommend(models, 'coding', 'balanced', 'cheap'));
    expect(a.every((r) => (comparablePrice(r.model) ?? Infinity) <= 1)).toBe(
      true,
    );
    expect(recommend(models, 'coding', 'cost', 'free')).toEqual([]);
  });
  it('excludes text-only models from vision recommendations', () => {
    expect(
      recommend(models, 'vision', 'quality', 'any').every(
        (r) => r.model.facts.vision,
      ),
    ).toBe(true);
  });
  it('ranks without mutating the source order', () => {
    const first = models[0].slug;
    const ranked = rankModels(models, 'speed');
    expect(ranked.length).toBe(models.length);
    expect(models[0].slug).toBe(first);
  });
  it('sanitizes and caps shareable model selections', () => {
    expect(
      selectionFromSearch(
        `?models=bad,${models[0].slug},${models[0].slug},${models[1].slug},${models[2].slug},${models[3].slug},${models[4].slug}`,
        models,
      ),
    ).toEqual([models[0].slug, models[1].slug, models[2].slug, models[3].slug]);
  });
  it('supports comparing different reasoning effort levels for the same or different models', () => {
    const reasoningModel = models.find(
      (m) =>
        m.facts.reasoningEffort &&
        m.facts.reasoningEffort.length > 1 &&
        !m.facts.reasoningEffort.includes('none'),
    );
    expect(reasoningModel).toBeDefined();
    if (reasoningModel) {
      const selections = selectionFromSearch(
        `?models=${reasoningModel.slug}:low,${reasoningModel.slug}:high`,
        models,
      );
      expect(selections).toEqual([
        `${reasoningModel.slug}:low`,
        `${reasoningModel.slug}:high`,
      ]);
    }
  });
});
describe('task cost assumptions and reasoning effort stats', () => {
  it('supports every Muse Spark 1.1 effort level', () => {
    const museSpark = models.find((m) => m.slug === 'muse-spark-1-1');
    expect(museSpark?.facts.reasoningEffort).toEqual([
      'none',
      'low',
      'medium',
      'high',
      'max',
    ]);

    if (!museSpark) return;
    for (const effort of ['none', 'low', 'medium', 'high', 'max'] as const) {
      expect(getModelEffortStats(museSpark, effort).effort).toBe(effort);
    }
  });

  it('includes tool overhead in every retried attempt', () => {
    expect(taskCost(mockModels[0], 1000, 500, 0.5, 2, 0.005)).toBeCloseTo(
      0.041,
    );
  });
  it('accepts zero usage and rejects invalid success and token values', () => {
    expect(taskCost(mockModels[0], 0, 0)).toBe(0);
    for (const bad of [0, -1, 1.1, NaN])
      expect(() => taskCost(mockModels[0], 1, 1, bad)).toThrow();
    expect(() => taskCost(mockModels[0], -1, 10)).toThrow();
  });
  it('computes differential stats for different reasoning effort levels', () => {
    const reasoningModel = models.find(
      (m) =>
        m.facts.reasoningEffort?.includes('low') &&
        m.facts.reasoningEffort?.includes('high'),
    );
    expect(reasoningModel).toBeDefined();
    if (reasoningModel) {
      const lowStats = getModelEffortStats(reasoningModel, 'low');
      const highStats = getModelEffortStats(reasoningModel, 'high');

      if (
        highStats.scores.intelligence !== null &&
        lowStats.scores.intelligence !== null
      ) {
        expect(highStats.scores.intelligence).toBeGreaterThanOrEqual(
          lowStats.scores.intelligence,
        );
      }
      if (highStats.scores.coding !== null && lowStats.scores.coding !== null) {
        expect(highStats.scores.coding).toBeGreaterThanOrEqual(
          lowStats.scores.coding,
        );
      }
    }
  });
  it('safely accesses model speed in tokens/sec when available', () => {
    for (const model of models) {
      const tps = getSpeedTokensPerSec(model);
      expect(Number.isFinite(tps)).toBe(true);
      expect(tps).toBeGreaterThanOrEqual(0);
      if (
        model.facts.speedTokensPerSecRange?.sourceId === 'openrouter-throughput'
      ) {
        expect(model.facts.speedTokensPerSec).toBe(tps);
      } else {
        expect(tps).toBe(0);
      }
    }
  });
  it('displays one provider speed or a multi-provider speed range', () => {
    const oneProvider = structuredClone(mockModels[0]);
    oneProvider.facts.speedTokensPerSec = 30;
    oneProvider.facts.speedTokensPerSecRange = {
      min: 30,
      max: 30,
      providerCount: 1,
      sourceId: 'openrouter-throughput',
      retrievedAt: '2026-09-07',
    };
    expect(getSpeedDisplayValue(oneProvider)).toBe('30');

    const twoProviders = structuredClone(oneProvider);
    twoProviders.facts.speedTokensPerSecRange = {
      min: 20,
      max: 40,
      providerCount: 2,
      sourceId: 'openrouter-throughput',
      retrievedAt: '2026-09-07',
    };
    expect(getSpeedDisplayValue(twoProviders)).toBe('20–40');
  });
  it('hides static speed values without OpenRouter throughput evidence', () => {
    const staticSpeed = structuredClone(mockModels[0]);
    staticSpeed.facts.speedTokensPerSec = 90;
    staticSpeed.scores.speed = 45;

    expect(getSpeedTokensPerSec(staticSpeed)).toBe(0);
    expect(getSpeedDisplayValue(staticSpeed)).toBeNull();
    expect(getModelEffortStats(staticSpeed).scores.speed).toBeNull();
  });
  it('determines the maximum possible effort for any model', () => {
    const multiEffortModel = models.find(
      (m) =>
        m.facts.reasoningEffort?.includes('max') &&
        m.facts.reasoningEffort?.includes('low'),
    );
    if (multiEffortModel) {
      expect(getMaxReasoningEffort(multiEffortModel)).toBe('max');
    }

    const highOnlyModel = models.find(
      (m) =>
        m.facts.reasoningEffort?.includes('high') &&
        !m.facts.reasoningEffort?.includes('max'),
    );
    if (highOnlyModel) {
      expect(getMaxReasoningEffort(highOnlyModel)).toBe('high');
    }

    const fixedModel = models.find((m) =>
      m.facts.reasoningEffort?.includes('fixed'),
    );
    if (fixedModel) {
      expect(getMaxReasoningEffort(fixedModel)).toBe('fixed');
    }

    const nonReasoning = models.find(
      (m) =>
        !m.facts.reasoningEffort ||
        m.facts.reasoningEffort.every((e) => e === 'none'),
    );
    if (nonReasoning) {
      expect(getMaxReasoningEffort(nonReasoning)).toBe('none');
    }
  });
  it('defaults getModelEffortStats to maximum possible effort when unspecified', () => {
    const multiEffortModel = models.find(
      (m) =>
        m.facts.reasoningEffort?.includes('max') &&
        m.facts.reasoningEffort?.includes('low'),
    );
    if (multiEffortModel) {
      const defaultStats = getModelEffortStats(multiEffortModel);
      const maxStats = getModelEffortStats(multiEffortModel, 'max');
      expect(defaultStats.effort).toBe('max');
      expect(defaultStats.scores.intelligence).toBe(
        maxStats.scores.intelligence,
      );
    }
  });
  it('normalizes comparison selections to maximum effort on load', () => {
    const multiEffortModel = models.find(
      (m) =>
        m.facts.reasoningEffort?.includes('max') &&
        m.facts.reasoningEffort?.includes('low'),
    );
    if (!multiEffortModel) return;

    expect(
      selectionAtMaximumEffort(
        [`${multiEffortModel.slug}:low`, multiEffortModel.slug],
        models,
      ),
    ).toEqual([`${multiEffortModel.slug}:max`, `${multiEffortModel.slug}:max`]);
  });
});

describe('cost efficiency and workload profiles', () => {
  it('rewards prompt caching in agent workloads compared to one-shot workloads', () => {
    const terra = models.find((m) => m.slug === 'gpt-5-6-terra');
    expect(terra).toBeDefined();
    if (terra) {
      const agentStats = getModelEffortStats(terra, 'none', 'agent');
      const oneshotStats = getModelEffortStats(terra, 'none', 'oneshot');

      expect(agentStats.effectivePrice).toBeDefined();
      expect(oneshotStats.effectivePrice).toBeDefined();
      // Agent workload with 75% prompt cache should have a much lower effective price than one-shot
      expect(agentStats.effectivePrice!).toBeLessThan(
        oneshotStats.effectivePrice!,
      );
      // Cost efficiency score should be noticeably higher in agent workload than one-shot
      expect(agentStats.scores.costEfficiency!).toBeGreaterThan(
        oneshotStats.scores.costEfficiency!,
      );
    }
  });

  it('correctly defaults to agent profile when workload is not specified', () => {
    const terra = models.find((m) => m.slug === 'gpt-5-6-terra');
    if (terra) {
      const defaultStats = getModelEffortStats(terra, 'none');
      const agentStats = getModelEffortStats(terra, 'none', 'agent');
      expect(defaultStats.workloadProfile).toBe('agent');
      expect(defaultStats.effectivePrice).toBe(agentStats.effectivePrice);
      expect(defaultStats.scores.costEfficiency).toBe(
        agentStats.scores.costEfficiency,
      );
    }
  });
});
