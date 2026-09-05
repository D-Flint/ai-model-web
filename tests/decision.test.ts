import { describe, it, expect } from 'vitest';
import { models, mockModels } from '../src/data/models';
import {
  confidence,
  normalize,
  recommend,
  rankModels,
  selectionFromSearch,
  taskCost,
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
    expect(a.every((r) => taskCost(r.model) <= 0.005)).toBe(true);
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
});
describe('task cost assumptions', () => {
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
});
