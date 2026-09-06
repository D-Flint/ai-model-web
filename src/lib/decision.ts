import {
  effortLatency,
  effortScoreAdjustments,
  effortTokens,
  metricLabels,
  overallWeights,
  recommendationConfig,
  type Capability,
  type Metric,
  type ReasoningEffort,
} from '../data/config';
import type { CatalogModel } from './catalogSchema';

export function normalize(raw: number, min: number, max: number): number {
  if (![raw, min, max].every(Number.isFinite) || max <= min)
    throw new Error('Invalid normalization range');
  return Math.round(
    Math.max(0, Math.min(100, ((raw - min) / (max - min)) * 100)),
  );
}
export function composite(
  scores: Partial<Record<Capability, number | null>>,
): number {
  const entries = Object.entries(overallWeights) as [Capability, number][];
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, weight] of entries) {
    const val = scores[key];
    if (val !== null && val !== undefined && Number.isFinite(val)) {
      weightedSum += val * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
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
  effort?: ReasoningEffort,
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
  const extraReasoningTokens =
    effort !== undefined ? (effortTokens[effort] ?? 0) : 0;
  return (
    ((input * model.pricing.input +
      (output + extraReasoningTokens) * model.pricing.output) /
      1_000_000 +
      toolCalls * toolPrice) /
    success
  );
}

export interface ModelEffortStats {
  effort: ReasoningEffort;
  reasoningTokens: number;
  latency: string;
  taskCost: number;
  speedTokensPerSec: number;
  scores: Record<Capability, number | null> & { overall: number | null };
}

export function getSpeedTokensPerSec(
  model: CatalogModel,
  effort?: ReasoningEffort,
): number {
  let baseTps = model.facts.speedTokensPerSec ?? 0;
  if (!baseTps || baseTps <= 0) {
    const speedEvidence = model.evidence?.find((e) => e.metric === 'speed');
    if (speedEvidence && speedEvidence.raw > 0) {
      baseTps = speedEvidence.raw;
    } else if (model.scores.speed !== null) {
      baseTps = Math.round(model.scores.speed * 1.8);
    }
  }

  if (!effort || effort === 'none' || effort === 'fixed') {
    return baseTps;
  }

  const isReasoning = Boolean(
    model.facts.reasoningEffort &&
    model.facts.reasoningEffort.length > 0 &&
    model.facts.reasoningEffort.some((e) => e !== 'none'),
  );

  if (!isReasoning) return baseTps;

  const baseDefault =
    model.facts.defaultEffort && model.facts.defaultEffort !== 'none'
      ? model.facts.defaultEffort
      : 'medium';

  const defaultAdj = effortScoreAdjustments[baseDefault]?.speed ?? 0;
  const targetAdj = effortScoreAdjustments[effort]?.speed ?? 0;
  const delta = targetAdj - defaultAdj;

  return Math.max(10, Math.round(baseTps + delta * 1.8));
}

export function getMaxReasoningEffort(model: CatalogModel): ReasoningEffort {
  const isReasoning = Boolean(
    model.facts.reasoningEffort &&
    model.facts.reasoningEffort.length > 0 &&
    model.facts.reasoningEffort.some((e) => e !== 'none'),
  );

  if (!isReasoning) return 'none';
  if (model.facts.reasoningEffort.includes('fixed')) return 'fixed';

  const tiers: ReasoningEffort[] = ['max', 'high', 'medium', 'low'];
  for (const tier of tiers) {
    if (model.facts.reasoningEffort.includes(tier)) {
      return tier;
    }
  }
  return 'none';
}

export function getModelEffortStats(
  model: CatalogModel,
  requestedEffort?: ReasoningEffort,
): ModelEffortStats {
  const isReasoning = Boolean(
    model.facts.reasoningEffort &&
    model.facts.reasoningEffort.length > 0 &&
    model.facts.reasoningEffort.some((e) => e !== 'none'),
  );

  let effort: ReasoningEffort = 'none';
  if (isReasoning) {
    if (model.facts.reasoningEffort.includes('fixed')) {
      effort = 'fixed';
    } else if (
      requestedEffort &&
      model.facts.reasoningEffort.includes(requestedEffort)
    ) {
      effort = requestedEffort;
    } else {
      effort = getMaxReasoningEffort(model);
    }
  }

  const reasoningTokens = isReasoning ? (effortTokens[effort] ?? 0) : 0;
  const latency = effortLatency[effort] ?? 'Instant (< 1s)';
  const cost = taskCost(model, 1000, 500, 1, 0, 0, effort);
  const speedTokensPerSec = getSpeedTokensPerSec(model, effort);

  const baseDefault =
    isReasoning &&
    model.facts.defaultEffort &&
    model.facts.defaultEffort !== 'none'
      ? model.facts.defaultEffort
      : 'medium';

  const defaultAdj = isReasoning
    ? (effortScoreAdjustments[baseDefault] ?? {})
    : {};
  const targetAdj = isReasoning ? (effortScoreAdjustments[effort] ?? {}) : {};

  const adjustedCapabilities = {} as Record<Capability, number | null>;
  for (const key of Object.keys(overallWeights) as Capability[]) {
    const baseScore = model.scores[key];
    if (baseScore === null) {
      adjustedCapabilities[key] = null;
      continue;
    }
    const delta = (targetAdj[key] ?? 0) - (defaultAdj[key] ?? 0);
    adjustedCapabilities[key] = Math.max(
      0,
      Math.min(100, Math.round(baseScore + delta)),
    );
  }

  const overall = composite(adjustedCapabilities);

  return {
    effort,
    reasoningTokens,
    latency,
    taskCost: cost,
    speedTokensPerSec,
    scores: {
      ...adjustedCapabilities,
      overall,
    },
  };
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
  return [...models].sort((a, b) => {
    const aScore = a.scores[metric];
    const bScore = b.scores[metric];
    if (aScore === null && bScore === null) return a.slug.localeCompare(b.slug);
    if (aScore === null) return 1;
    if (bScore === null) return -1;
    return bScore - aScore || a.slug.localeCompare(b.slug);
  });
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
    .map((model) => {
      const taskVal = model.scores[metric] ?? 0;
      const prioKey = priorityMetric[priority];
      const prioVal = model.scores[prioKey] ?? taskVal;
      const relVal = model.scores.reliability ?? 75;
      return {
        model,
        score: Math.round(
          taskVal * recommendationConfig.task +
            prioVal * recommendationConfig.priority +
            relVal * recommendationConfig.reliability,
        ),
        reason: `${metricLabels[metric]} contributes 55%, ${metricLabels[prioKey].toLowerCase()} contributes 30%, and reliability contributes 15%.`,
      };
    })
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
    .filter((item) => {
      const slug = item.split(':')[0];
      return models.some((m) => m.slug === slug);
    })
    .slice(0, 4);
}

export type LeaderboardMetricKey =
  | 'overall'
  | 'reasoning'
  | 'coding'
  | 'agentic'
  | 'mathematics'
  | 'dataAnalysis'
  | 'language'
  | 'instructionFollowing'
  | 'cost'
  | 'speed';

export type LeaderboardSortColumn =
  LeaderboardMetricKey | 'name' | 'releaseDate';

export interface LeaderboardSortableItem {
  displayName: string;
  releaseDate?: string | null;
  scores: Record<LeaderboardMetricKey, number | null>;
  [key: string]: unknown;
}

export function sortLeaderboardRows<T extends LeaderboardSortableItem>(
  rows: T[],
  sortColumn: LeaderboardSortColumn,
  sortDirection: 'asc' | 'desc',
): T[] {
  return [...rows].sort((a, b) => {
    if (sortColumn === 'name') {
      const cmp = a.displayName.localeCompare(b.displayName);
      return sortDirection === 'asc' ? cmp : -cmp;
    }

    if (sortColumn === 'releaseDate') {
      const aRaw =
        a.releaseDate ??
        (a.model as { facts?: { releaseDate?: string } } | undefined)?.facts
          ?.releaseDate;
      const bRaw =
        b.releaseDate ??
        (b.model as { facts?: { releaseDate?: string } } | undefined)?.facts
          ?.releaseDate;
      const aDate = aRaw ? new Date(aRaw).getTime() : NaN;
      const bDate = bRaw ? new Date(bRaw).getTime() : NaN;
      const aNull = !aRaw || isNaN(aDate);
      const bNull = !bRaw || isNaN(bDate);

      if (aNull && bNull) {
        return a.displayName.localeCompare(b.displayName);
      }
      if (aNull) return 1;
      if (bNull) return -1;

      // Descending means newest date first (larger timestamp first)
      const diff = sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      if (diff !== 0) return diff;

      // Secondary tie-breaker by overall score (higher is better), then name
      const aOverall = a.scores.overall ?? 0;
      const bOverall = b.scores.overall ?? 0;
      if (bOverall !== aOverall) return bOverall - aOverall;
      return a.displayName.localeCompare(b.displayName);
    }

    const aVal = a.scores[sortColumn];
    const bVal = b.scores[sortColumn];

    // Speed <= 0 treated as null / not available
    const aNormVal =
      sortColumn === 'speed' && aVal !== null && aVal !== undefined && aVal <= 0
        ? null
        : aVal;
    const bNormVal =
      sortColumn === 'speed' && bVal !== null && bVal !== undefined && bVal <= 0
        ? null
        : bVal;

    const aNull = aNormVal === null || aNormVal === undefined;
    const bNull = bNormVal === null || bNormVal === undefined;

    // Both null: stable tie-break by name
    if (aNull && bNull) {
      return a.displayName.localeCompare(b.displayName);
    }
    // Items with missing data always sort to the bottom
    if (aNull) return 1;
    if (bNull) return -1;

    // Cost metric: ascending means lowest cost first (e.g. $0.000)
    if (sortColumn === 'cost') {
      const diff =
        sortDirection === 'asc' ? aNormVal - bNormVal : bNormVal - aNormVal;
      if (diff !== 0) return diff;
      // Secondary tie-breaker by overall score (higher is better), then name
      const aOverall = a.scores.overall ?? 0;
      const bOverall = b.scores.overall ?? 0;
      if (bOverall !== aOverall) return bOverall - aOverall;
      return a.displayName.localeCompare(b.displayName);
    }

    // Performance metrics: descending means highest score first
    const diff =
      sortDirection === 'asc' ? aNormVal - bNormVal : bNormVal - aNormVal;
    if (diff !== 0) return diff;

    // Secondary tie-breaker by overall score (higher is better), then name
    if (sortColumn !== 'overall') {
      const aOverall = a.scores.overall ?? 0;
      const bOverall = b.scores.overall ?? 0;
      if (bOverall !== aOverall) return bOverall - aOverall;
    }
    return a.displayName.localeCompare(b.displayName);
  });
}
