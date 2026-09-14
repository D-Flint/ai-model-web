import type { LeaderboardMetricKey } from './decision';

export const scoreHeatmapMetrics = [
  'reasoning',
  'coding',
  'agentic',
  'mathematics',
  'dataAnalysis',
  'language',
  'instructionFollowing',
] as const satisfies readonly LeaderboardMetricKey[];

export type ScoreHeatmapMetric = (typeof scoreHeatmapMetrics)[number];

const scoreHeatmapLimit = 10;

interface ScoreRow {
  scores: Record<LeaderboardMetricKey, number | null>;
}

export function getTopScoreValues<T extends ScoreRow>(
  rows: readonly T[],
  metric: ScoreHeatmapMetric,
): ReadonlySet<number> {
  const scores = rows
    .map((row) => row.scores[metric])
    .filter((score): score is number => score !== null)
    .sort((a, b) => b - a);
  const cutoff = scores[scoreHeatmapLimit - 1];

  return new Set(
    cutoff === undefined ? scores : scores.filter((score) => score >= cutoff),
  );
}
