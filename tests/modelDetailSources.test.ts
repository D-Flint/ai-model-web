import { describe, expect, it } from 'vitest';
import verifiedModels from '../src/data/verifiedModels.json';
import { catalogSchema, type CatalogModel } from '../src/lib/catalogSchema';
import { getModelDetailSources } from '../src/lib/modelDetailSources';

const models = catalogSchema.parse(verifiedModels);

describe('model detail sources', () => {
  it('resolves at least one source for every verified model dropdown', () => {
    for (const model of models) {
      const sources = getModelDetailSources(model, {
        hasBenchmarkScores: Boolean(model.benchmarks?.livebench),
        hasSpeed:
          typeof model.facts.speedTokensPerSec === 'number' ||
          Boolean(model.facts.speedTokensPerSecRange),
      });

      expect(sources.length, model.slug).toBeGreaterThan(0);
    }
  });

  it('selects displayed data sources and merges duplicate URLs', () => {
    const model = models.find((candidate) => candidate.slug === 'gpt-6-astra');
    expect(model).toBeDefined();

    const sources = getModelDetailSources(model!, {
      hasBenchmarkScores: true,
      hasSpeed: true,
    });

    expect(sources.map((source) => source.name)).toEqual([
      'LiveBench AI Benchmark',
      'OpenRouter recent throughput',
      'OpenAI Official Documentation',
    ]);
    expect(
      sources.find((source) => source.name === 'OpenAI Official Documentation')
        ?.coverage,
    ).toEqual(['API pricing', 'Model facts']);
  });

  it('omits benchmark and speed sources when their values are not displayed', () => {
    const model = models.find((candidate) => candidate.slug === 'gpt-6-astra');
    expect(model).toBeDefined();

    const sources = getModelDetailSources(model!, {
      hasBenchmarkScores: false,
      hasSpeed: false,
    });

    expect(sources.some((source) => source.name.includes('LiveBench'))).toBe(
      false,
    );
    expect(sources.some((source) => source.name.includes('OpenRouter'))).toBe(
      false,
    );
  });

  it('returns an unavailable state when no referenced source resolves', () => {
    const model = structuredClone(models[0]) as CatalogModel;
    model.sources = [];
    model.apiPricing = null;
    model.facts.sourceId = 'missing';
    model.facts.contextSourceId = 'missing';
    model.pricing.sourceId = 'missing';

    expect(
      getModelDetailSources(model, {
        hasBenchmarkScores: false,
        hasSpeed: false,
      }),
    ).toEqual([]);
  });
});
