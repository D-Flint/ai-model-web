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

    const parsed = openRouterModelSchema.safeParse(sample);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.id).toBe('anthropic/claude-sonnet-4.5');
      expect(parsed.data.context_length).toBe(1000000);
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
  it('resolves canonical models across OpenRouter, LMArena, and SWE-bench', () => {
    expect(
      defaultAliasResolver.resolve('openrouter', 'anthropic/claude-sonnet-4.5')
        ?.slug,
    ).toBe('claude-sonnet-4-5');

    expect(
      defaultAliasResolver.resolve('lmarena', 'claude-sonnet-4-5-20250929')
        ?.slug,
    ).toBe('claude-sonnet-4-5');

    expect(
      defaultAliasResolver.resolve('swebench', 'Claude 4.5 Sonnet')?.slug,
    ).toBe('claude-sonnet-4-5');
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
    expect(verifiedModels.length).toBeGreaterThanOrEqual(50);

    const validated = validateCatalog(verifiedModels);
    expect(validated.length).toBeGreaterThanOrEqual(50);

    for (const model of validated) {
      expect(model.dataKind).toBe('verified');
      expect(model.lastVerifiedAt).toBeDefined();
      expect(model.confidence).toBeGreaterThan(0);
      expect(model.sources.length).toBeGreaterThanOrEqual(3);
      expect(model.facts.context).toBeGreaterThan(0);
      expect(model.facts.speedTokensPerSec).toBeGreaterThan(0);
      expect(model.scores.overall).toBeGreaterThan(0);

      const speedEvidence = model.evidence.find((e) => e.metric === 'speed');
      expect(speedEvidence).toBeDefined();
      expect(speedEvidence?.raw).toBe(model.facts.speedTokensPerSec);
    }
  });

  it('rejects duplicate model slugs in catalog', () => {
    const dupes = [
      verifiedModels[0],
      { ...verifiedModels[0], name: 'Duplicate Slug' },
    ];
    expect(() => catalogSchema.parse(dupes)).toThrow('Duplicate model slugs');
  });
});
