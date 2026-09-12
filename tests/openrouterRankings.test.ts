import { describe, it, expect } from 'vitest';
import { allModels } from '../src/data/models';
import {
  OPENROUTER_TOP_MODELS,
  getMostUsedOpenRouterModels,
} from '../src/data/openrouterRankings';

describe('openrouterRankings', () => {
  it('has valid top model rankings data from OpenRouter', () => {
    expect(OPENROUTER_TOP_MODELS.length).toBeGreaterThanOrEqual(10);
    expect(OPENROUTER_TOP_MODELS[0].rank).toBe(1);
    expect(OPENROUTER_TOP_MODELS[0].name).toBe('Hy4 preview');
    expect(OPENROUTER_TOP_MODELS[0].provider).toBe('Tencent');
    expect(OPENROUTER_TOP_MODELS[1].rank).toBe(2);
    expect(OPENROUTER_TOP_MODELS[1].name).toBe('GLM 5.3 Flash');
    expect(OPENROUTER_TOP_MODELS[1].provider).toBe('Z.ai');
    expect(OPENROUTER_TOP_MODELS[2].rank).toBe(3);
    expect(OPENROUTER_TOP_MODELS[2].name).toBe('DeepSeek V4 Flash 0731');
    expect(OPENROUTER_TOP_MODELS[3].rank).toBe(4);
    expect(OPENROUTER_TOP_MODELS[3].name).toBe('GPT-5.6 Luna');
  });

  it('correctly filters and returns the most used models from the catalog in exact rank order', () => {
    const featured = getMostUsedOpenRouterModels(allModels, 4);
    expect(featured).toHaveLength(4);

    expect(featured[0].ranking.rank).toBe(1);
    expect(featured[0].model.name).toBe('Hy4 preview');
    expect(featured[0].badge).toBe('#1 · 14.1T tokens');

    for (let index = 1; index < featured.length; index++) {
      expect(featured[index].ranking.rank).toBeGreaterThan(
        featured[index - 1].ranking.rank,
      );
      expect(allModels).toContain(featured[index].model);
    }
  });
});
