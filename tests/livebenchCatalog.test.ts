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

  it('publishes exactly 57 eligible models in LiveBench score order', () => {
    expect(models).toHaveLength(LIVEBENCH_CATALOG_LIMIT);
    expect(models.every((model) => model.dataKind === 'verified')).toBe(true);
    expect(
      models.every((model) =>
        model.evidence.some(
          (evidence) => evidence.sourceId === 'livebench-leaderboard',
        ),
      ),
    ).toBe(true);
    expect(new Set(models.map((model) => model.slug)).size).toBe(
      LIVEBENCH_CATALOG_LIMIT,
    );
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

  it('retains 57 eligible candidates and recent discovery models', () => {
    expect(
      selectTopLiveBenchModels(allModels, LIVEBENCH_CANDIDATE_LIMIT),
    ).toHaveLength(57);
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
