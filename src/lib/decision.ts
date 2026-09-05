import {
  metricLabels,
  overallWeights,
  recommendationConfig,
  type Capability,
  type Metric,
} from '../data/config';
import type { CatalogModel } from './catalogSchema';

export function normalize(raw: number, min: number, max: number): number {
  if (![raw, min, max].every(Number.isFinite) || max <= min)
    throw new Error('Invalid normalization range');
  return Math.round(
    Math.max(0, Math.min(100, ((raw - min) / (max - min)) * 100)),
  );
}
export function composite(scores: Record<Capability, number>): number {
  return Math.round(
    Object.entries(overallWeights).reduce(
      (sum, [key, weight]) => sum + scores[key as Capability] * weight,
      0,
    ),
  );
}
export function confidence(input: {
  independentSources: number;
  quality: number;
  ageDays: number;
  testCount: number;
  variance: number;
  coverage: number;
}): number {
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  if (!Object.values(input).every((n) => Number.isFinite(n) && n >= 0))
    throw new Error('Invalid confidence inputs');
  return Math.round(
    100 *
      (clamp(input.independentSources / 5) * 0.2 +
        clamp(input.quality) * 0.2 +
        clamp(1 - input.ageDays / 180) * 0.15 +
        clamp(input.testCount / 50) * 0.15 +
        clamp(1 - input.variance / 25) * 0.1 +
        clamp(input.coverage) * 0.2),
  );
}
export function taskCost(
  model: CatalogModel,
  input = 1000,
  output = 500,
  success = 1,
  toolCalls = 0,
  toolPrice = 0,
): number {
  if (
    ![input, output, toolCalls, toolPrice].every(
      (n) => Number.isFinite(n) && n >= 0,
    ) ||
    !Number.isFinite(success) ||
    success <= 0 ||
    success > 1
  )
    throw new Error(
      'Enter non-negative amounts and a success rate greater than 0 and at most 100%.',
    );
  return (
    ((input * model.pricing.input + output * model.pricing.output) / 1_000_000 +
      toolCalls * toolPrice) /
    success
  );
}
export const money = (value: number, digits = 2) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
export const contextSize = (value: number) =>
  value >= 1_000_000 ? `${value / 1_000_000}M` : `${Math.round(value / 1000)}K`;
export function rankModels(models: CatalogModel[], metric: Metric = 'overall') {
  return [...models].sort(
    (a, b) =>
      b.scores[metric] - a.scores[metric] || a.slug.localeCompare(b.slug),
  );
}
export type Budget = keyof typeof recommendationConfig.budgetLimits;
export type Priority =
  'quality' | 'cost' | 'speed' | 'value' | 'reliability' | 'balanced';
export function recommend(
  models: CatalogModel[],
  metric: Metric,
  priority: Priority,
  budget: Budget,
) {
  const priorityMetric: Record<Priority, Metric> = {
    quality: 'intelligence',
    cost: 'costEfficiency',
    speed: 'speed',
    value: 'costEfficiency',
    reliability: 'reliability',
    balanced: 'overall',
  };
  return models
    .filter(
      (m) =>
        taskCost(m) <= recommendationConfig.budgetLimits[budget] &&
        (metric !== 'vision' || m.facts.vision),
    )
    .map((model) => ({
      model,
      score: Math.round(
        model.scores[metric] * recommendationConfig.task +
          model.scores[priorityMetric[priority]] *
            recommendationConfig.priority +
          model.scores.reliability * recommendationConfig.reliability,
      ),
      reason: `${metricLabels[metric]} contributes 55%, ${metricLabels[priorityMetric[priority]].toLowerCase()} contributes 30%, and reliability contributes 15%.`,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        taskCost(a.model) - taskCost(b.model) ||
        a.model.slug.localeCompare(b.model.slug),
    );
}
export function selectionFromSearch(search: string, models: CatalogModel[]) {
  return [
    ...new Set(new URLSearchParams(search).get('models')?.split(',') ?? []),
  ]
    .filter((slug) => models.some((m) => m.slug === slug))
    .slice(0, 4);
}
