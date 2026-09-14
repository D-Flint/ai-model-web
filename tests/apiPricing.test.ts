import { describe, expect, it, vi } from 'vitest';
import { recommend } from '../src/lib/decision';
import {
  calculateApiCost,
  choosePricing,
  comparablePrice,
  formatPrice,
  priceFreshness,
  pricingSource,
  rateLabel,
} from '../src/lib/apiPricing';
import { apiPricingSchema } from '../src/lib/apiPricingSchema';
import {
  verifiedApiPricing,
  reviewedContext,
} from '../src/data/officialProviders';
import { models, allModels } from '../src/data/models';
import { validateCatalog } from '../src/lib/importCatalog';

const now = new Date('2026-09-14T12:00:00Z');
const minimaxNow = new Date('2026-09-12T12:00:00Z');
const claude = verifiedApiPricing['claude-sonnet-5'];
const gemini = verifiedApiPricing['gemini-3-1-pro'];
const minimax = verifiedApiPricing['minimax-m3'];
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
      new Date('2026-09-06T12:00:00Z'),
    );
    const high = calculateApiCost(
      gemini,
      { input: 199001, cached: 1000, output: 1000, requests: 1 },
      new Date('2026-09-06T12:00:00Z'),
    );
    expect(low.tier.id).toBe('standard');
    expect(high.tier.id).toBe('long-context');
    expect(high.output).toBeCloseTo(0.018);
    expect(high.input).toBeCloseTo((199001 * 4) / 1e6);
  });
  it('uses the MiniMax M3 long-context tier only above 512K input tokens', () => {
    expect(
      calculateApiCost(
        minimax,
        { input: 512000, output: 0, cached: 0, requests: 1 },
        minimaxNow,
      ).tier.id,
    ).toBe('standard');
    expect(
      calculateApiCost(
        minimax,
        { input: 512001, output: 0, cached: 0, requests: 1 },
        minimaxNow,
      ).tier.id,
    ).toBe('long-context');
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
        new Date('2026-09-06T12:00:00Z'),
      ).total,
    ).toBe(4.5);
  });
  it('accepts explicit zero usage and rejects missing rates, unsupported categories and invalid counts', () => {
    const empty = { input: 0, output: 0, cached: 0, requests: 0 };
    expect(calculateApiCost(claude, empty, now).total).toBe(0);
    expect(() => calculateApiCost(null, empty, now)).toThrow('unavailable');
    expect(() =>
      calculateApiCost(
        gemini,
        { ...empty, requests: 1, search: 1 },
        new Date('2026-09-06T12:00:00Z'),
      ),
    ).toThrow('unavailable');
    for (const input of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
      expect(() =>
        calculateApiCost(claude, { ...empty, input }, now),
      ).toThrow();
    expect(() =>
      calculateApiCost(
        gemini,
        { ...empty, input: 1048577 },
        new Date('2026-09-06T12:00:00Z'),
      ),
    ).toThrow('unavailable');
  });
  it('blocks stale required rates without replacing the retrieval date', () => {
    expect(() =>
      calculateApiCost(
        claude,
        { input: 1000, output: 100, cached: 0, requests: 1 },
        new Date('2026-09-22'),
      ),
    ).toThrow('verification');
    const rate = claude.tiers[0].input!;
    expect(priceFreshness(rate, new Date('2026-09-21'))).toBe('Current');
    expect(priceFreshness(rate, new Date('2026-09-22'))).toBe(
      'Needs verification',
    );
    expect(priceFreshness(rate, new Date('2026-09-05'))).toBe(
      'Needs verification',
    );
    expect(priceFreshness(null, now)).toBe('Unavailable');
  });
});
describe('pricing provenance and comparisons', () => {
  it('publishes verified MiniMax M3 context tiers with first-party provenance', () => {
    expect(minimax.tiers).toEqual([
      expect.objectContaining({
        id: 'standard',
        minContext: 0,
        maxContext: 512000,
        input: expect.objectContaining({ value: 0.3 }),
        output: expect.objectContaining({ value: 1.2 }),
        cached: expect.objectContaining({ value: 0.06 }),
      }),
      expect.objectContaining({
        id: 'long-context',
        minContext: 512001,
        maxContext: 1048576,
        input: expect.objectContaining({ value: 0.6 }),
        output: expect.objectContaining({ value: 2.4 }),
        cached: expect.objectContaining({ value: 0.12 }),
      }),
    ]);
    expect(minimax.tiers[0].input?.source).toMatchObject({
      name: 'MiniMax API pricing',
      url: 'https://platform.minimax.io/subscribe/token-plan?tab=api-enterprise',
      retrievedAt: '2026-09-12',
    });
  });
  it('publishes DeepSeek peak and off-peak API rates', () => {
    const pricing = verifiedApiPricing['deepseek-v4-1-flash'];
    const proPricing = verifiedApiPricing['deepseek-v4-pro-0813'];

    expect(pricing.periods).toEqual([
      expect.objectContaining({
        id: 'off-peak',
        input: expect.objectContaining({ value: 0.15 }),
        output: expect.objectContaining({ value: 0.6 }),
        cached: expect.objectContaining({ value: 0.003 }),
      }),
      expect.objectContaining({
        id: 'peak',
        input: expect.objectContaining({ value: 0.3 }),
        output: expect.objectContaining({ value: 1.2 }),
        cached: expect.objectContaining({ value: 0.006 }),
      }),
    ]);
    expect(proPricing.periods?.[1]).toEqual(
      expect.objectContaining({
        id: 'peak',
        input: expect.objectContaining({ value: 1.32 }),
        output: expect.objectContaining({ value: 3.96 }),
        cached: expect.objectContaining({ value: 0.044 }),
      }),
    );
  });

  it('validates the full published catalog after applying pricing snapshots', () => {
    expect(validateCatalog(models)).toHaveLength(models.length);
  });
  it('publishes sourced catalog rates with their actual source type', () => {
    const glm = models.find((model) => model.slug === 'glm-5-3')!;
    const glmFlash = models.find((model) => model.slug === 'glm-5-3-flash')!;
    const nemotron = models.find(
      (model) => model.slug === 'nemotron-3-ultra-550b',
    )!;

    expect(glm.apiPricing?.tiers[0].input).toMatchObject({
      value: 0.5,
      source: {
        type: 'openrouter',
        url: 'https://openrouter.ai/models/z-ai/glm-5.3',
      },
    });
    expect(rateLabel(glm, 'input')).toBe('$0.50');
    expect(glmFlash.apiPricing?.tiers[0].output).toMatchObject({
      value: 0.25,
      source: {
        type: 'openrouter',
        url: 'https://openrouter.ai/models/z-ai/glm-5.3-flash',
      },
    });
    expect(nemotron.apiPricing?.tiers[0].input).toMatchObject({
      value: 2,
      source: {
        type: 'provider_doc',
        url: 'https://build.nvidia.com/',
      },
    });
  });
  it('publishes GPT-6 Astra short and long-context cached-input rates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-14T12:00:00Z'));
    try {
      const astra = models.find((model) => model.slug === 'gpt-6-astra')!;
      expect(astra.apiPricing?.tiers.map((tier) => tier.cached?.value)).toEqual([
        1,
        2,
      ]);
      expect(rateLabel(astra, 'cached')).toBe(
        '(≤1,048,576: $1.00) (> 1,048,576: $2.00)',
      );
    } finally {
      vi.useRealTimers();
    }
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
  it('selects one stable pricing source across tiers and scheduled periods', () => {
    expect(pricingSource(claude)).toBe(claude.tiers[0].input);

    const outputOnly = structuredClone(claude);
    outputOnly.tiers.forEach((tier) => {
      tier.input = null;
      tier.cached = null;
      tier.cacheWrite5m = null;
      tier.cacheWrite1h = null;
      tier.cacheStorage = null;
      tier.search = null;
      tier.output = null;
    });
    outputOnly.periods = [
      {
        id: 'scheduled',
        label: 'Scheduled rate',
        input: null,
        output: claude.tiers[0].output,
        cached: null,
      },
    ];
    expect(pricingSource(outputOnly)).toBe(claude.tiers[0].output);
    expect(pricingSource(null)).toBeNull();
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
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-06T12:00:00Z'));
    try {
      const model = { ...models[0], apiPricing: gemini };
      expect(comparablePrice(model)).toBeNull();
      expect(rateLabel(model, 'input')).toBe('(≤200k: $2.00) (> 200k: $4.00)');
      expect(rateLabel(model, 'cached')).toBe('(≤200k: $0.20) (> 200k: $0.40)');
      expect(rateLabel(model, 'output')).toBe(
        '(≤200k: $12.00) (> 200k: $18.00)',
      );
      expect(reviewedContext['gemini-3-1-pro'].value).toBe(1_048_576);
      expect(reviewedContext['gemini-3-1-pro'].source.id).toBeTruthy();
      expect(formatPrice(null)).toBe('Unavailable');
      expect(formatPrice(0)).toBe('$0.00');
      expect(formatPrice(0.0000001)).toBe('<$0.000001');
      expect(
        Object.values(verifiedApiPricing).every(
          (p) => p.benchmarkCost === null,
        ),
      ).toBe(true);
      expect(allModels.filter((m) => m.apiPricing).map((m) => m.slug)).toEqual(
        allModels.filter((m) => verifiedApiPricing[m.slug]).map((m) => m.slug),
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
