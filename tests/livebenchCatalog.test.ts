import { describe, expect, it } from 'vitest';
import { allModels, models } from '../src/data/models';
import {
  LIVEBENCH_CATALOG_LIMIT,
  selectTopLiveBenchModels,
} from '../src/lib/livebenchCatalog';

describe('LiveBench catalog selection', () => {
  it('publishes exactly 30 eligible models in LiveBench score order', () => {
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
      models.some((model) =>
        model.evidence.some(
          (evidence) =>
            evidence.metric === 'agentic' &&
            evidence.sourceId === 'livebench-leaderboard',
        ),
      ),
    ).toBe(true);
  });

  it('preserves complete verified catalog for history', () => {
    expect(allModels).toHaveLength(282);
  });

  it('fails instead of substituting models when requested limit is unavailable', () => {
    expect(() => selectTopLiveBenchModels(allModels.slice(0, 1), 2)).toThrow(
      'LiveBench catalog requires 2 eligible models; found 1',
    );
  });
});
