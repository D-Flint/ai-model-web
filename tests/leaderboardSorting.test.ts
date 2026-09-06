import { describe, it, expect } from 'vitest';
import {
  sortLeaderboardRows,
  type LeaderboardSortableItem,
  type LeaderboardMetricKey,
} from '../src/lib/decision';

describe('sortLeaderboardRows', () => {
  const sampleRows: LeaderboardSortableItem[] = [
    {
      displayName: 'Model Alpha',
      scores: {
        overall: 80,
        reasoning: 75,
        coding: 90,
        agentic: null,
        mathematics: 70,
        dataAnalysis: 65,
        language: 80,
        instructionFollowing: 85,
        cost: 0.005,
        speed: 120,
      },
    },
    {
      displayName: 'Model Beta',
      scores: {
        overall: 95,
        reasoning: 90,
        coding: 85,
        agentic: 92,
        mathematics: 95,
        dataAnalysis: 90,
        language: 92,
        instructionFollowing: 94,
        cost: 0.02,
        speed: 80,
      },
    },
    {
      displayName: 'Model Gamma',
      scores: {
        overall: 88,
        reasoning: null,
        coding: 90,
        agentic: 80,
        mathematics: null,
        dataAnalysis: null,
        language: null,
        instructionFollowing: null,
        cost: 0.001,
        speed: 0,
      },
    },
    {
      displayName: 'Model Delta',
      scores: {
        overall: 70,
        reasoning: null,
        coding: null,
        agentic: null,
        mathematics: null,
        dataAnalysis: null,
        language: null,
        instructionFollowing: null,
        cost: 0.0,
        speed: null,
      },
    },
  ];

  it('sorts by overall descending by default with highest score first', () => {
    const sorted = sortLeaderboardRows(sampleRows, 'overall', 'desc');
    expect(sorted.map((r) => r.displayName)).toEqual([
      'Model Beta',
      'Model Gamma',
      'Model Alpha',
      'Model Delta',
    ]);
  });

  it('sorts by overall ascending with lowest score first', () => {
    const sorted = sortLeaderboardRows(sampleRows, 'overall', 'asc');
    expect(sorted.map((r) => r.displayName)).toEqual([
      'Model Delta',
      'Model Alpha',
      'Model Gamma',
      'Model Beta',
    ]);
  });

  it('sorts each metric descending and places null values at the bottom', () => {
    const metrics: LeaderboardMetricKey[] = [
      'reasoning',
      'coding',
      'agentic',
      'mathematics',
      'dataAnalysis',
      'language',
      'instructionFollowing',
    ];

    for (const metric of metrics) {
      const sorted = sortLeaderboardRows(sampleRows, metric, 'desc');
      let seenNull = false;
      for (const row of sorted) {
        const val = row.scores[metric];
        if (val === null) {
          seenNull = true;
        } else {
          expect(seenNull).toBe(false);
        }
      }
    }
  });

  it('sorts by coding with tie-breaking by overall score', () => {
    const sorted = sortLeaderboardRows(sampleRows, 'coding', 'desc');
    expect(sorted[0].displayName).toBe('Model Gamma');
    expect(sorted[1].displayName).toBe('Model Alpha');
    expect(sorted[2].displayName).toBe('Model Beta');
    expect(sorted[3].displayName).toBe('Model Delta');
  });

  it('sorts by cost ascending with cheapest first', () => {
    const sorted = sortLeaderboardRows(sampleRows, 'cost', 'asc');
    expect(sorted.map((r) => r.displayName)).toEqual([
      'Model Delta',
      'Model Gamma',
      'Model Alpha',
      'Model Beta',
    ]);
  });

  it('sorts by cost descending with highest cost first', () => {
    const sorted = sortLeaderboardRows(sampleRows, 'cost', 'desc');
    expect(sorted.map((r) => r.displayName)).toEqual([
      'Model Beta',
      'Model Alpha',
      'Model Gamma',
      'Model Delta',
    ]);
  });

  it('sorts by speed descending and treats 0 as unavailable', () => {
    const sorted = sortLeaderboardRows(sampleRows, 'speed', 'desc');
    expect(sorted[0].displayName).toBe('Model Alpha');
    expect(sorted[1].displayName).toBe('Model Beta');
    expect(sorted.slice(2).map((r) => r.displayName)).toEqual([
      'Model Delta',
      'Model Gamma',
    ]);
  });

  it('sorts by model name alphabetically', () => {
    const asc = sortLeaderboardRows(sampleRows, 'name', 'asc');
    expect(asc.map((r) => r.displayName)).toEqual([
      'Model Alpha',
      'Model Beta',
      'Model Delta',
      'Model Gamma',
    ]);

    const desc = sortLeaderboardRows(sampleRows, 'name', 'desc');
    expect(desc.map((r) => r.displayName)).toEqual([
      'Model Gamma',
      'Model Delta',
      'Model Beta',
      'Model Alpha',
    ]);
  });
});
