import { describe, it, expect } from 'vitest';
import {
  openRouterModelSchema,
  sweBenchResultSchema,
} from '../src/pipeline/types';
import { defaultAliasResolver } from '../src/pipeline/aliasResolver';
import {
  normalizeElo,
  normalizeSweBench,
  normalizeAgentScore,
  calculateCostEfficiencyScore,
} from '../src/pipeline/normalization';
import { calculateConfidence } from '../src/pipeline/confidence';
import { processOpenRouterModels } from '../src/pipeline/openrouter';
import {
  normalizeOpenRouterFrontendEndpointStats,
  processOpenRouterThroughput,
} from '../src/pipeline/openrouter';
import {
  buildLiveBenchBenchmark,
  processLiveBenchResults,
} from '../src/pipeline/livebench';
import { catalogSchema } from '../src/lib/catalogSchema';
import { validateCatalog } from '../src/lib/importCatalog';
import verifiedModels from '../src/data/verifiedModels.json';

describe('OpenRouter Payload Validation', () => {
  it('validates standard OpenRouter model payloads', () => {
    const sample = {
      id: 'anthropic/claude-sonnet-4.5',
      name: 'Anthropic: Claude Sonnet 4.5',
      context_length: 1000000,
      pricing: {
        prompt: '0.000003',
        completion: '0.000015',
      },
      architecture: {
        modality: 'text+image->text',
      },
    };

    const sampleWithCanonical = {
      ...sample,
      canonical_slug: 'anthropic/claude-sonnet-4.5-20260901',
    };
    const parsedWithCanonical =
      openRouterModelSchema.safeParse(sampleWithCanonical);
    expect(parsedWithCanonical.success).toBe(true);
    if (parsedWithCanonical.success) {
      expect(parsedWithCanonical.data.canonical_slug).toBe(
        'anthropic/claude-sonnet-4.5-20260901',
      );
    }
  });

  it('rejects malformed OpenRouter payloads', () => {
    const invalid = {
      id: '', // Empty ID
      name: 'Broken Model',
      context_length: -500, // Invalid negative context
      pricing: {}, // Missing prompt/completion pricing
    };

    const parsed = openRouterModelSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it('extracts recent p50 throughput as a model range', () => {
    const throughput = processOpenRouterThroughput([
      {
        model_id: 'openai/gpt-5',
        provider_name: 'OpenAI',
        status: 0,
        throughput_last_30m: { p50: 20 },
      },
      {
        model_id: 'openai/gpt-5',
        provider_name: 'Together',
        status: 0,
        throughput_last_30m: { p50: 40 },
      },
      {
        model_id: 'openai/gpt-5',
        provider_name: 'Unavailable',
        status: 1,
        throughput_last_30m: { p50: 999 },
      },
    ]);

    expect(throughput).toMatchObject({
      min: 20,
      max: 40,
      midpoint: 30,
      providerCount: 2,
      sourceId: 'openrouter-throughput',
    });
  });

  it('collapses repeated endpoints from one provider into one speed value', () => {
    const throughput = processOpenRouterThroughput([
      {
        model_id: 'openai/gpt-5',
        provider_name: 'OpenAI',
        status: 0,
        throughput_last_30m: { p50: 20 },
      },
      {
        model_id: 'openai/gpt-5',
        provider_name: 'OpenAI',
        status: 0,
        throughput_last_30m: { p50: 40 },
      },
    ]);

    expect(throughput).toMatchObject({
      min: 30,
      max: 30,
      midpoint: 30,
      providerCount: 1,
    });
  });

  it('normalizes OpenRouter frontend provider stats into throughput endpoints', () => {
    const endpoints = normalizeOpenRouterFrontendEndpointStats(
      'openai/gpt-4o',
      [
        {
          provider_slug: 'azure',
          provider_display_name: 'Azure',
          stats: { p50_throughput: 47 },
        },
        {
          provider_slug: 'openai',
          provider_display_name: 'OpenAI',
          stats: { p50_throughput: 49 },
        },
      ],
    );

    expect(processOpenRouterThroughput(endpoints)).toMatchObject({
      min: 47,
      max: 49,
      midpoint: 48,
      providerCount: 2,
    });
  });
});

describe('LiveBench native categories', () => {
  it('normalizes Agentic Coding into traceable agentic evidence', () => {
    const measurements = processLiveBenchResults(
      [
        {
          model: 'o3-mini',
          global_average: 80,
          reasoning: 82,
          coding: 78,
          agentic_coding: 71.5,
          math: 80,
          data_analysis: 79,
          language: 81,
          instruction_following: 80,
          date: '2026-06-25',
        },
      ],
      defaultAliasResolver,
    );

    expect(
      measurements.find((measurement) => measurement.category === 'agentic'),
    ).toMatchObject({
      benchmarkName: 'LiveBench Agentic Coding',
      rawScore: 71.5,
      normalizedScore: 72,
      sourceId: 'livebench-leaderboard',
      evaluationDate: '2026-06-25',
    });
    expect(measurements.map((measurement) => measurement.category)).toEqual([
      'intelligence',
      'coding',
      'agentic',
    ]);
  });
});

describe('SWE-bench Payload Validation', () => {
  it('validates SWE-bench entries with string or array site fields', () => {
    const entryStringSite = {
      name: 'Agent + Claude',
      model_display: 'Claude 4.5 Sonnet',
      resolved: 74.8,
      site: 'https://example.com',
    };
    const entryArraySite = {
      name: 'Agent + Claude',
      model_display: 'Claude 4.5 Sonnet',
      resolved: 74.8,
      site: ['https://example.com'],
    };

    expect(sweBenchResultSchema.safeParse(entryStringSite).success).toBe(true);
    expect(sweBenchResultSchema.safeParse(entryArraySite).success).toBe(true);
  });
});

describe('Model Identity Resolution', () => {
  it('resolves canonical models across OpenRouter, LiveBench, and BFCL', () => {
    expect(
      defaultAliasResolver.resolve('openrouter', 'openai/o3-mini')?.slug,
    ).toBe('o3-mini');
    expect(
      defaultAliasResolver.resolve('openrouter', 'openai/gpt-5.6-sol')?.slug,
    ).toBe('gpt-5-6-sol');
    expect(
      defaultAliasResolver.resolve('openrouter', 'openai/gpt-5.3-codex')?.slug,
    ).toBe('gpt-5-3-codex');
    expect(
      defaultAliasResolver.resolve(
        'openrouter',
        'google/gemini-3.1-pro-preview',
      )?.slug,
    ).toBe('gemini-3-1-pro');

    expect(defaultAliasResolver.resolve('livebench', 'o3-mini')?.slug).toBe(
      'o3-mini',
    );

    expect(defaultAliasResolver.resolve('bfcl', 'o3-mini')?.slug).toBe(
      'o3-mini',
    );
  });

  it('does not resolve arbitrary substrings or unknown models', () => {
    expect(defaultAliasResolver.resolve('openrouter', 'claude')).toBeNull();
    expect(
      defaultAliasResolver.resolve('lmarena', 'random-fake-model'),
    ).toBeNull();
    expect(
      defaultAliasResolver.resolve('swebench', 'Unknown Agent Run'),
    ).toBeNull();
  });

  it('generates unique database alias records', () => {
    const rows = defaultAliasResolver.getDatabaseAliasRows();
    expect(rows.length).toBeGreaterThan(15);
    const ids = new Set(rows.map((r) => r.id));
    expect(ids.size).toBe(rows.length);
  });
});

describe('Benchmark Normalization', () => {
  it('normalizes Elo ratings predictably onto a 0-100 scale', () => {
    const low = normalizeElo(1000);
    expect(low.normalized).toBe(0);

    const mid = normalizeElo(1350);
    expect(mid.normalized).toBe(50);

    const frontier = normalizeElo(1700);
    expect(frontier.normalized).toBe(100);
  });

  it('normalizes SWE-bench resolved percentages', () => {
    expect(normalizeSweBench(0).normalized).toBe(0);
    expect(normalizeSweBench(75).normalized).toBe(75);
    expect(normalizeSweBench(100).normalized).toBe(100);
  });

  it('normalizes agent delta scores within bounds', () => {
    expect(normalizeAgentScore(-0.3).normalized).toBe(0);
    expect(normalizeAgentScore(0).normalized).toBe(50);
    expect(normalizeAgentScore(0.3).normalized).toBe(100);
  });

  it('calculates cost efficiency logarithmically', () => {
    // Ultra cheap ($0.10 input, $0.32 output)
    const cheap = calculateCostEfficiencyScore(0.1, 0.32);
    // Expensive flagship ($15 input, $60 output)
    const expensive = calculateCostEfficiencyScore(15, 60);

    expect(cheap.normalized).toBeGreaterThan(expensive.normalized);
    expect(cheap.normalized).toBeGreaterThanOrEqual(80);
    expect(expensive.normalized).toBeLessThan(35);
  });
});

describe('Confidence Calculation', () => {
  it('awards higher confidence to models with more independent sources and full coverage', () => {
    const fullConfidence = calculateConfidence({
      independentSourcesCount: 4,
      coveredCategoriesCount: 10,
      totalCategoriesCount: 10,
      totalSampleCount: 10000,
      recencyDays: 2,
      hasOfficialVerification: true,
    });

    const lowConfidence = calculateConfidence({
      independentSourcesCount: 1,
      coveredCategoriesCount: 2,
      totalCategoriesCount: 10,
      totalSampleCount: 10,
      recencyDays: 120,
      hasOfficialVerification: false,
    });

    expect(fullConfidence).toBeGreaterThanOrEqual(80);
    expect(lowConfidence).toBeLessThan(40);
  });
});

describe('Price Conversion', () => {
  it('correctly converts OpenRouter per-token prices into per-million USD', () => {
    const mockOpenRouterRaw = [
      {
        id: 'openai/gpt-4o',
        name: 'OpenAI: GPT-4o',
        context_length: 128000,
        pricing: {
          prompt: '0.0000025',
          completion: '0.00001',
        },
      },
    ];

    const processed = processOpenRouterModels(
      mockOpenRouterRaw,
      defaultAliasResolver,
    );
    expect(processed.length).toBe(1);
    expect(processed[0].pricing.inputPerMillion).toBe(2.5);
    expect(processed[0].pricing.outputPerMillion).toBe(10.0);
  });
});

describe('Verified Catalog Integrity', () => {
  it('verifiedModels.json satisfies strict catalog validation', () => {
    expect(Array.isArray(verifiedModels)).toBe(true);
    expect(verifiedModels.length).toBeGreaterThanOrEqual(10);

    const validated = validateCatalog(verifiedModels);
    expect(validated.length).toBeGreaterThanOrEqual(10);

    for (const model of validated) {
      expect(model.dataKind).toBe('verified');
      for (const metric of [
        'dailyUse',
        'research',
        'writing',
        'vision',
        'reliability',
      ] as const) {
        expect(model.scores[metric]).toBeNull();
        expect(model.evidence.some((item) => item.metric === metric)).toBe(
          false,
        );
      }
      expect(
        model.scores.speed === null ||
          (model.scores.speed >= 0 && model.scores.speed <= 100),
      ).toBe(true);
      expect(model.lastVerifiedAt).toBeDefined();
      expect(model.confidence).toBeGreaterThan(0);
      expect(model.sources.length).toBeGreaterThanOrEqual(2);
      expect(model.facts.context).toBeGreaterThan(0);
      expect(model.scores.overall === null || model.scores.overall > 0).toBe(
        true,
      );
      expect(model.methodology).toBe('v1-external-only');
    }

    expect(
      validated.some(
        (model) => model.scores.overall !== null && model.scores.overall > 0,
      ),
    ).toBe(true);
  });

  it('rejects duplicate model slugs in catalog', () => {
    const dupes = [
      verifiedModels[0],
      { ...verifiedModels[0], name: 'Duplicate Slug' },
    ];
    expect(() => catalogSchema.parse(dupes)).toThrow('Duplicate model slugs');
  });
});

describe('LiveBench overall invariant', () => {
  it('uses all seven native categories and rejects incomplete averages', () => {
    const row = {
      model: 'o3-mini',
      global_average: 99,
      reasoning: 10,
      coding: 20,
      agentic_coding: 30,
      math: 40,
      data_analysis: 50,
      language: 60,
      instruction_following: 70,
    };
    expect(buildLiveBenchBenchmark(row, '2026-09-12').overall).toBe(40);
    expect(
      buildLiveBenchBenchmark({ ...row, language: undefined }, '2026-09-12')
        .overall,
    ).toBeNull();
  });
});
