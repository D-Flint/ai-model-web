import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  rateDisplayWithStatus,
  standardRate,
  comparablePrice,
  priceFreshness,
} from '../src/lib/apiPricing';
import { scoreCandidate } from '../src/lib/modelFinder';
import { models } from '../src/data/models';
import type { CatalogModel } from '../src/lib/catalogSchema';

describe('Model Finder Pricing Status & Tradeoffs (Issue 5)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats unverified rates with status indicator in rateDisplayWithStatus', () => {
    const staleModel: CatalogModel = {
      ...models[0],
      slug: 'test-stale-pricing',
      apiPricing: {
        provider: 'TestProvider',
        scope: 'Test API pricing',
        tiers: [
          {
            id: 'standard',
            label: 'Standard',
            minContext: 0,
            maxContext: 128_000,
            input: {
              value: 0.8,
              currency: 'USD',
              unit: 'per-million-tokens',
              source: {
                name: 'Test Source',
                url: 'https://example.com/pricing',
                type: 'provider_doc',
                retrievedAt: '2026-06-01', // Stale (> 7 days)
                effectiveFrom: null,
              },
            },
            output: null,
            cached: null,
            cacheWrite5m: null,
            cacheWrite1h: null,
            cacheStorage: null,
            search: null,
          },
        ],
        notes: [],
        benchmarkCost: null,
      },
    };

    const rate = standardRate(staleModel, 'input');
    expect(rate).not.toBeNull();
    expect(priceFreshness(rate!)).toBe('Needs verification');
    expect(comparablePrice(staleModel, 'input')).toBeNull();

    const display = rateDisplayWithStatus(staleModel, 'input');
    expect(display).toBe('$0.80 (unverified)');
  });

  it('marks tradeoff as pending verification when rates exist but are stale', () => {
    const staleModel: CatalogModel = {
      ...models[0],
      slug: 'test-stale-tradeoff',
      scores: {
        ...models[0].scores,
        speed: 50,
      },
      apiPricing: {
        provider: 'TestProvider',
        scope: 'Test API pricing',
        tiers: [
          {
            id: 'standard',
            label: 'Standard',
            minContext: 0,
            maxContext: 128_000,
            input: {
              value: 0.8,
              currency: 'USD',
              unit: 'per-million-tokens',
              source: {
                name: 'Test Source',
                url: 'https://example.com/pricing',
                type: 'provider_doc',
                retrievedAt: '2026-06-01',
                effectiveFrom: null,
              },
            },
            output: null,
            cached: null,
            cacheWrite5m: null,
            cacheWrite1h: null,
            cacheStorage: null,
            search: null,
          },
        ],
        notes: [],
        benchmarkCost: null,
      },
    };

    const candidate = scoreCandidate(
      staleModel,
      {
        useCases: [{ id: 'coding', importance: 'high', selectionOrder: 0 }],
        priorities: [],
        requirements: {
          vision: false,
          tools: false,
          api: false,
          openWeights: false,
          structuredOutput: false,
          minimumContext: null,
        },
        budget: { tier: 'flexible', behavior: 'preferred' },
      },
      [staleModel],
    );

    expect(candidate).not.toBeNull();
    expect(candidate?.tradeoff).toBe(
      'Current API pricing is pending verification.',
    );
  });
});
