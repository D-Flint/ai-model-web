import { describe, it, expect } from 'vitest';
import { models } from '../src/data/models';
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
    const featured = getMostUsedOpenRouterModels(models, 4);
    expect(featured).toHaveLength(4);

    expect(featured[0].ranking.rank).toBe(1);
    expect(featured[0].model.name).toBe('Hy4 preview');
    expect(featured[0].badge).toBe('#1 · 14.1T tokens');

    expect(featured[1].ranking.rank).toBe(2);
    expect(featured[1].model.name).toBe('GLM 5.3 Flash');
    expect(featured[1].badge).toBe('#2 · 12.5T tokens');

    expect(featured[2].ranking.rank).toBe(3);
    expect(featured[2].model.name).toBe('DeepSeek V4-Flash-0731');
    expect(featured[2].badge).toBe('#3 · 12.3T tokens');

    expect(featured[3].ranking.rank).toBe(4);
    expect(featured[3].model.name).toBe('GPT-5.6 Luna');
    expect(featured[3].badge).toBe('#4 · 12.2T tokens');
  });
});
