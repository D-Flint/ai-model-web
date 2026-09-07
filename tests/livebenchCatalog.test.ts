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
    expect(models.map((model) => model.slug)).toEqual([
      'claude-fable-5-1',
      'gpt-6-astra',
      'claude-opus-5',
      'gemini-3-deep-think',
      'o3-pro',
      'gemini-3-1-pro',
      'claude-fable-5',
      'gemini-3-8-flash',
      'gpt-5-6-sol',
      'claude-sonnet-5',
      'gemini-3-pro',
      'gemini-3-7-flash',
      'o3',
      'claude-sonnet-4-6',
      'claude-opus-4-6',
      'gemini-2-5-pro',
      'gpt-5-pro',
      'o1-pro',
      'gpt-5-3-codex',
      'claude-opus-4-5',
      'gemini-3-6-flash',
      'claude-sonnet-4-5',
      'o4-mini',
      'claude-3-7-sonnet',
      'gpt-5-6-terra',
      'deepseek-r1',
      'gemma-4',
      'o1',
      'gpt-5',
      'gemini-2-0-pro',
    ]);
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
