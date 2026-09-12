import { describe, expect, it } from 'vitest';
import liveBenchRows from '../src/data/livebenchData.json';
import { allModels, models } from '../src/data/models';
import {
  LIVEBENCH_CATALOG_LIMIT,
  LIVEBENCH_CANDIDATE_LIMIT,
  CURATED_PUBLISHED_MODEL_SLUGS,
  curateRecentCatalog,
  selectTopLiveBenchModels,
} from '../src/lib/livebenchCatalog';

describe('LiveBench catalog selection', () => {
  it('retains LiveBench cost per successful task values', () => {
    const flash = liveBenchRows.find(
      (row) => row.model === 'deepseek-v4.1-flash-max',
    );
    expect(flash?.cost_per_successful_task).toBe(0.0292);
  });

  it('publishes only models with verified speed telemetry', () => {
    expect(models).toHaveLength(51);
    expect(
      models.every((model) => model.facts.speedTokensPerSec !== null),
    ).toBe(true);
    expect(models).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: 'qwen-3-8-flash-next' }),
        expect.objectContaining({ slug: 'smaug-agentic' }),
        expect.objectContaining({ slug: 'smaug-flash' }),
        expect.objectContaining({ slug: 'smaug-mini' }),
      ]),
    );
    expect(models.every((model) => model.dataKind === 'verified')).toBe(true);
    expect(
      models.every((model) =>
        model.evidence.some(
          (evidence) => evidence.sourceId === 'livebench-leaderboard',
        ),
      ),
    ).toBe(true);
    expect(new Set(models.map((model) => model.slug)).size).toBe(51);
    expect(
      [...CURATED_PUBLISHED_MODEL_SLUGS].every((slug) =>
        models.some((model) => model.slug === slug),
      ),
    ).toBe(true);
    expect(
      models.some((model) =>
        model.evidence.some(
          (evidence) =>
            evidence.metric === 'agentic' &&
            evidence.sourceId === 'livebench-leaderboard',
        ),
      ),
    ).toBe(true);
  });

  it('fully removes the replaced product records', () => {
    const removed = new Set([
      'claude-haiku-5',
      'gpt-5',
      'gpt-5-pro',
      'gpt-5-2-pro',
    ]);
    expect(allModels.some((model) => removed.has(model.slug))).toBe(false);
  });

  it('does not expose Ox Alpha in the active catalog', () => {
    expect(models.some((model) => model.slug === 'ox-alpha')).toBe(false);
  });

  it('does not expose Inkling in the active catalog', () => {
    expect(models.some((model) => model.slug === 'inkling')).toBe(false);
    expect(allModels.some((model) => model.slug === 'inkling')).toBe(false);
  });

  it('retains 55 eligible candidates and recent discovery models', () => {
    expect(
      selectTopLiveBenchModels(allModels, LIVEBENCH_CANDIDATE_LIMIT),
    ).toHaveLength(55);
    expect(allModels.length).toBeGreaterThanOrEqual(LIVEBENCH_CANDIDATE_LIMIT);
    expect(allModels.length).toBeLessThanOrEqual(
      LIVEBENCH_CANDIDATE_LIMIT + LIVEBENCH_CATALOG_LIMIT,
    );
    expect(curateRecentCatalog(allModels)).toEqual(allModels);
    expect(allModels.some((model) => model.slug === 'hy4-preview')).toBe(true);
  });

  it('fails instead of substituting models when requested limit is unavailable', () => {
    expect(() => selectTopLiveBenchModels(allModels.slice(0, 1), 2)).toThrow(
      'LiveBench catalog requires 2 eligible models; found 1',
    );
  });
});
