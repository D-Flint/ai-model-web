import { describe, expect, it, vi } from 'vitest';
import { recommend } from '../src/lib/decision';
import {
  calculateApiCost,
  choosePricing,
  comparablePrice,
  formatPrice,
  priceFreshness,
} from '../src/lib/apiPricing';
import { apiPricingSchema } from '../src/lib/apiPricingSchema';
import { verifiedApiPricing } from '../src/data/officialProviders';
import { models, allModels } from '../src/data/models';
import { validateCatalog } from '../src/lib/importCatalog';

const now = new Date('2026-09-06T12:00:00Z');
const claude = verifiedApiPricing['claude-sonnet-5'];
const gemini = verifiedApiPricing['gemini-2-5-pro'];
describe('user-provided API workloads', () => {
  it('multiplies uncached, cached and output categories by requests without double counting', () => {
    const result = calculateApiCost(
      claude,
      { input: 1000, output: 500, cached: 2000, requests: 10 },
      now,
    );
    expect(result.input).toBeCloseTo(0.02);
    expect(result.output).toBeCloseTo(0.05);
    expect(result.cached).toBeCloseTo(0.004);
    expect(result.total).toBeCloseTo(0.074);
  });
  it('uses the higher rate for the entire request above the inclusive threshold, counting cached input', () => {
    const low = calculateApiCost(
      gemini,
      { input: 199000, cached: 1000, output: 1000, requests: 1 },
      now,
    );
    const high = calculateApiCost(
      gemini,
      { input: 199001, cached: 1000, output: 1000, requests: 1 },
      now,
    );
    expect(low.tier.id).toBe('standard');
    expect(high.tier.id).toBe('long-context');
    expect(high.output).toBeCloseTo(0.015);
    expect(high.input).toBeCloseTo((199001 * 2.5) / 1e6);
  });
  it('adds cache writes and search per request but storage once per workload', () => {
    expect(
      calculateApiCost(
        claude,
        {
          input: 0,
          output: 0,
          cached: 0,
          requests: 2,
          cacheWrite5m: 1000,
          cacheWrite1h: 1000,
          search: 1,
        },
        now,
      ).total,
    ).toBeCloseTo(0.033);
    expect(
      calculateApiCost(
        gemini,
        {
          input: 0,
          output: 0,
          cached: 0,
          requests: 10,
          cacheTokenHours: 1000000,
        },
        now,
      ).total,
    ).toBe(4.5);
  });
  it('accepts explicit zero usage and rejects missing rates, unsupported categories and invalid counts', () => {
    const empty = { input: 0, output: 0, cached: 0, requests: 0 };
    expect(calculateApiCost(claude, empty, now).total).toBe(0);
    expect(() => calculateApiCost(null, empty, now)).toThrow('unavailable');
    expect(() =>
      calculateApiCost(gemini, { ...empty, requests: 1, search: 1 }, now),
    ).toThrow('unavailable');
    for (const input of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
      expect(() =>
        calculateApiCost(claude, { ...empty, input }, now),
      ).toThrow();
    expect(() =>
      calculateApiCost(gemini, { ...empty, input: 1048577 }, now),
    ).toThrow('unavailable');
  });
  it('blocks stale required rates without replacing the retrieval date', () => {
    expect(() =>
      calculateApiCost(
        claude,
        { input: 1000, output: 100, cached: 0, requests: 1 },
        new Date('2026-09-14'),
      ),
    ).toThrow('verification');
    const rate = claude.tiers[0].input!;
    expect(priceFreshness(rate, new Date('2026-09-13'))).toBe('Current');
    expect(priceFreshness(rate, new Date('2026-09-14'))).toBe(
      'Needs verification',
    );
    expect(priceFreshness(rate, new Date('2026-09-05'))).toBe(
      'Needs verification',
    );
    expect(priceFreshness(null, now)).toBe('Unavailable');
  });
});
describe('pricing provenance and comparisons', () => {
  it('validates the full published catalog after applying pricing snapshots', () => {
    expect(validateCatalog(models)).toHaveLength(models.length);
  });
  it('does not call an API free when only its input is free, or reuse a legacy zero price', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      const model = structuredClone(
        models.find((m) => m.slug === 'claude-sonnet-5')!,
      );
      model.apiPricing!.tiers[0].input!.value = 0;
      expect(recommend([model], 'coding', 'cost', 'free')).toHaveLength(0);
      model.apiPricing!.tiers[0].output!.value = 0;
      expect(recommend([model], 'coding', 'cost', 'free')).toHaveLength(1);
      model.apiPricing = null;
      model.pricing.input = 0;
      model.pricing.output = 0;
      expect(recommend([model], 'coding', 'cost', 'free')).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });
  it('prefers official rates even if the fallback is cheaper', () => {
    expect(choosePricing(claude, gemini)).toBe(claude);
    expect(choosePricing(null, gemini)).toBe(gemini);
    expect(choosePricing(null, null)).toBeNull();
  });
  it('rejects negative prices, missing source dates and overlapping tiers', () => {
    const negative = structuredClone(claude);
    negative.tiers[0].input!.value = -1;
    expect(apiPricingSchema.safeParse(negative).success).toBe(false);
    const overlap = structuredClone(gemini);
    overlap.tiers[1].minContext = 200000;
    expect(apiPricingSchema.safeParse(overlap).success).toBe(false);
    const missing = structuredClone(claude);
    missing.tiers[0].input!.source.retrievedAt = '';
    expect(apiPricingSchema.safeParse(missing).success).toBe(false);
    const unapproved = structuredClone(claude);
    unapproved.tiers[0].input!.source.url = 'https://example.com/pricing';
    expect(apiPricingSchema.safeParse(unapproved).success).toBe(false);
    unapproved.tiers[0].input!.source.type = 'openrouter';
    expect(apiPricingSchema.safeParse(unapproved).success).toBe(false);
  });
  it('preserves unavailable values and never flattens a tiered model for sorting', () => {
    const model = models.find((m) => m.slug === 'gemini-2-5-pro')!;
    expect(comparablePrice(model)).toBeNull();
    expect(model.facts.context).toBe(1_048_576);
    expect(
      model.sources.some((s) => s.id === model.facts.contextSourceId),
    ).toBe(true);
    expect(formatPrice(null)).toBe('Unavailable');
    expect(formatPrice(0)).toBe('$0.00');
    expect(formatPrice(0.0000001)).toBe('<$0.000001');
    expect(
      Object.values(verifiedApiPricing).every((p) => p.benchmarkCost === null),
    ).toBe(true);
    expect(allModels.filter((m) => m.apiPricing)).toHaveLength(20);
  });
});
