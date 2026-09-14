import { describe, expect, it } from 'vitest';
import { getTopScoreValues } from '../src/lib/leaderboardHeatmap';
import type { LeaderboardSortableItem } from '../src/lib/decision';

function row(reasoning: number | null): LeaderboardSortableItem {
  return {
    displayName: `Model ${reasoning ?? 'missing'}`,
    scores: {
      overall: reasoning,
      reasoning,
      coding: null,
      agentic: null,
      mathematics: null,
      dataAnalysis: null,
      language: null,
      instructionFollowing: null,
      cost: null,
      speed: null,
    },
  };
}

describe('getTopScoreValues', () => {
  it('returns every available value when fewer than ten rows have a score', () => {
    expect([
      ...getTopScoreValues([row(92), row(78), row(null)], 'reasoning'),
    ]).toEqual([92, 78]);
  });

  it('uses the tenth highest value as the cutoff and includes ties', () => {
    const rows = [100, 99, 98, 97, 96, 95, 94, 93, 92, 80, 80, 79].map(row);

    expect([...getTopScoreValues(rows, 'reasoning')]).toEqual([
      100, 99, 98, 97, 96, 95, 94, 93, 92, 80,
    ]);
  });

  it('recomputes ranking from the supplied filtered rows', () => {
    const catalog = Array.from({ length: 12 }, (_, index) => row(100 - index));
    const filteredRows = catalog.slice(8);

    expect(getTopScoreValues(catalog, 'reasoning').has(90)).toBe(false);
    expect(getTopScoreValues(filteredRows, 'reasoning').has(90)).toBe(true);
  });
});
