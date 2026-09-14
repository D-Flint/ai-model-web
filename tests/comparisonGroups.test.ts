import { describe, expect, it } from 'vitest';
import { allModels, models } from '../src/data/models';
import { groupModelsByProvider } from '../src/lib/comparisonGroups';

describe('comparison provider groups', () => {
  it('sorts providers and models alphabetically', () => {
    const groups = groupModelsByProvider(models);

    expect(groups.map((group) => group.provider)).toEqual(
      [...groups.map((group) => group.provider)].sort((a, b) =>
        a.localeCompare(b),
      ),
    );
    for (const group of groups) {
      expect(group.models.map((model) => model.name)).toEqual(
        [...group.models.map((model) => model.name)].sort((a, b) =>
          a.localeCompare(b),
        ),
      );
    }
  });

  it('keeps models with the same provider together', () => {
    const groups = groupModelsByProvider(models);
    expect(
      groups.every((group) =>
        group.models.every((model) => model.provider === group.provider),
      ),
    ).toBe(true);
  });

  it('keeps Meta AI models available to the comparison picker', () => {
    const allGroups = groupModelsByProvider(allModels);
    expect(
      allGroups.find((group) => group.provider === 'Meta AI')?.models.length,
    ).toBeGreaterThan(0);
  });
});
