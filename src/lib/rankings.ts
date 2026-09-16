import { rankingConfig } from '../data/config';
import { priceFreshness, singleRate } from './apiPricing';
import type { CatalogModel } from './catalogSchema';
import { evaluateModelEligibility } from './catalogEligibility';

const millisecondsPerDay = 86_400_000;
const requiredIntelligenceMetrics = [
  'intelligence',
  'coding',
  'research',
] as const;

export type RankingDirection = 'desc' | 'asc';

export interface IntelligenceRankingResult {
  model: CatalogModel;
  rank: number;
  score: number;
  rawScore: number;
  components: {
    intelligence: number;
    coding: number;
    research: number;
  };
}

export interface SpeedMeasurement {
  value: number;
  peakValue?: number;
  medianValue?: number;
  range: { min: number; max: number } | null;
  sourceId: string;
  verifiedAt: string;
}

export interface SpeedRankingResult {
  model: CatalogModel;
  rank: number;
  speedTokensPerSec: number;
  measurement: SpeedMeasurement;
}

export const scoreRankingMetrics = [
  'costEfficiency',
  'coding',
  'agentic',
  'dailyUse',
  'research',
  'writing',
  'vision',
] as const;

export type ScoreRankingMetric = (typeof scoreRankingMetrics)[number];

export const scoreRankingMetricBySlug = {
  value: 'costEfficiency',
  coding: 'coding',
  agents: 'agentic',
  'daily-use': 'dailyUse',
  research: 'research',
  writing: 'writing',
  vision: 'vision',
} as const satisfies Record<string, ScoreRankingMetric>;

export type ScoreRankingSlug = keyof typeof scoreRankingMetricBySlug;

export interface ScoreRankingResult {
  model: CatalogModel;
  rank: number;
  score: number;
  metric: ScoreRankingMetric;
}

export interface LowestCostRankingResult {
  model: CatalogModel;
  rank: number;
  inputPrice: number;
  priceVerifiedAt: string;
}

function parseDate(value: string): number | null {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(parsed) ? parsed : null;
}

function ageInDays(date: string, asOf: string): number | null {
  const dateTime = parseDate(date);
  const asOfTime = parseDate(asOf);
  if (dateTime === null || asOfTime === null) return null;
  return (asOfTime - dateTime) / millisecondsPerDay;
}

function isFresh(date: string, asOf: string): boolean {
  const ageDays = ageInDays(date, asOf);
  return (
    ageDays !== null &&
    ageDays >= 0 &&
    ageDays <= rankingConfig.maxVerificationAgeDays
  );
}

function isCurrentProductionModel(model: CatalogModel, asOf: string): boolean {
  const eligibility = evaluateModelEligibility(model);
  return (
    model.dataKind === 'verified' &&
    eligibility.status === 'active' &&
    model.facts.api &&
    model.facts.availability === 'Production API' &&
    model.lastVerifiedAt !== null &&
    isFresh(model.lastVerifiedAt, asOf)
  );
}

function asOfDate(asOf: string): Date | null {
  const parsed = parseDate(asOf);
  return parsed === null ? null : new Date(parsed);
}

function hasRequiredIntelligenceEvidence(model: CatalogModel): boolean {
  return requiredIntelligenceMetrics.every(
    (metric) =>
      model.scores[metric] !== null &&
      model.evidence.some((evidence) => evidence.metric === metric),
  );
}

export function isIntelligenceRankingEligible(
  model: CatalogModel,
  asOf: string,
): boolean {
  return (
    isCurrentProductionModel(model, asOf) &&
    hasRequiredIntelligenceEvidence(model)
  );
}

export function getVerifiedSpeedMeasurement(
  model: CatalogModel,
  asOf: string,
): SpeedMeasurement | null {
  const range = model.facts.speedTokensPerSecRange;
  if (range) {
    const min = Math.min(range.min, range.max);
    const max = Math.max(range.min, range.max);
    const median = Math.round((min + max) / 2);
    const sourceExists = model.sources.some(
      (source) => source.id === range.sourceId,
    );
    if (
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      max <= 0 ||
      !sourceExists ||
      !isFresh(range.retrievedAt, asOf)
    )
      return null;
    return {
      value: max,
      peakValue: max,
      medianValue: median,
      range: { min, max },
      sourceId: range.sourceId,
      verifiedAt: range.retrievedAt,
    };
  }

  const speed = model.facts.speedTokensPerSec;
  if (
    speed === null ||
    speed === undefined ||
    !Number.isFinite(speed) ||
    speed <= 0
  )
    return null;

  const source = model.sources.find(
    (candidate) => candidate.id === model.facts.sourceId,
  );
  if (!source || !isFresh(source.retrievedAt, asOf)) return null;

  return {
    value: speed,
    peakValue: speed,
    medianValue: speed,
    range: null,
    sourceId: source.id,
    verifiedAt: source.retrievedAt,
  };
}

export function isSpeedRankingEligible(
  model: CatalogModel,
  asOf: string,
): boolean {
  return (
    isCurrentProductionModel(model, asOf) &&
    getVerifiedSpeedMeasurement(model, asOf) !== null
  );
}

function buildIntelligenceResult(
  model: CatalogModel,
): Omit<IntelligenceRankingResult, 'rank'> | null {
  const intelligence = model.scores.intelligence;
  const coding = model.scores.coding;
  const research = model.scores.research;

  if (intelligence === null || coding === null || research === null)
    return null;

  const rawScore =
    intelligence * rankingConfig.intelligence.intelligence +
    coding * rankingConfig.intelligence.coding +
    research * rankingConfig.intelligence.research;

  return {
    model,
    score: Math.round(Math.max(0, Math.min(100, rawScore))),
    rawScore,
    components: { intelligence, coding, research },
  };
}

function compareTieBreakers(
  a: Omit<IntelligenceRankingResult, 'rank'>,
  b: Omit<IntelligenceRankingResult, 'rank'>,
): number {
  if (b.model.confidence !== a.model.confidence) {
    return b.model.confidence - a.model.confidence;
  }

  const aVerified = parseDate(a.model.lastVerifiedAt ?? '') ?? 0;
  const bVerified = parseDate(b.model.lastVerifiedAt ?? '') ?? 0;
  if (bVerified !== aVerified) return bVerified - aVerified;

  return a.model.name.localeCompare(b.model.name);
}

export function rankIntelligenceModels(
  models: CatalogModel[],
  asOf: string,
  direction: RankingDirection = 'desc',
): IntelligenceRankingResult[] {
  const candidates = models.flatMap((model) => {
    if (!isIntelligenceRankingEligible(model, asOf)) return [];
    const result = buildIntelligenceResult(model);
    return result ? [result] : [];
  });

  const highestFirst = candidates.sort(
    (a, b) => b.rawScore - a.rawScore || compareTieBreakers(a, b),
  );
  const ranked = highestFirst.map((result, index) => ({
    ...result,
    rank: index + 1,
  }));

  if (direction === 'desc') return ranked;
  return [...ranked].sort(
    (a, b) => a.rawScore - b.rawScore || compareTieBreakers(a, b),
  );
}

function compareSpeedTieBreakers(
  a: Omit<SpeedRankingResult, 'rank'>,
  b: Omit<SpeedRankingResult, 'rank'>,
): number {
  if (b.model.confidence !== a.model.confidence) {
    return b.model.confidence - a.model.confidence;
  }

  const dateDifference = b.measurement.verifiedAt.localeCompare(
    a.measurement.verifiedAt,
  );
  if (dateDifference !== 0) return dateDifference;

  return a.model.name.localeCompare(b.model.name);
}

export function rankSpeedModels(
  models: CatalogModel[],
  asOf: string,
  direction: RankingDirection = 'desc',
): SpeedRankingResult[] {
  const candidates = models.flatMap((model) => {
    if (!isCurrentProductionModel(model, asOf)) return [];
    const measurement = getVerifiedSpeedMeasurement(model, asOf);
    if (!measurement) return [];
    return [
      {
        model,
        speedTokensPerSec: measurement.value,
        measurement,
      },
    ];
  });

  const highestFirst = candidates.sort(
    (a, b) =>
      b.speedTokensPerSec - a.speedTokensPerSec ||
      compareSpeedTieBreakers(a, b),
  );
  const ranked = highestFirst.map((result, index) => ({
    ...result,
    rank: index + 1,
  }));

  if (direction === 'desc') return ranked;
  return [...ranked].sort(
    (a, b) =>
      a.speedTokensPerSec - b.speedTokensPerSec ||
      compareSpeedTieBreakers(a, b),
  );
}

export function getScoreRankingMetric(slug: string): ScoreRankingMetric | null {
  return Object.hasOwn(scoreRankingMetricBySlug, slug)
    ? scoreRankingMetricBySlug[slug as ScoreRankingSlug]
    : null;
}

export function isScoreRankingEligible(
  model: CatalogModel,
  metric: ScoreRankingMetric,
  asOf: string,
): boolean {
  return (
    isCurrentProductionModel(model, asOf) &&
    model.scores[metric] !== null &&
    model.evidence.some((evidence) => evidence.metric === metric) &&
    (metric !== 'vision' || model.facts.vision)
  );
}

function compareScoreTieBreakers(
  a: Omit<ScoreRankingResult, 'rank'>,
  b: Omit<ScoreRankingResult, 'rank'>,
): number {
  if (b.model.confidence !== a.model.confidence) {
    return b.model.confidence - a.model.confidence;
  }

  const dateDifference = (b.model.lastVerifiedAt ?? '').localeCompare(
    a.model.lastVerifiedAt ?? '',
  );
  if (dateDifference !== 0) return dateDifference;

  return a.model.name.localeCompare(b.model.name);
}

export function rankScoreModels(
  models: CatalogModel[],
  metric: ScoreRankingMetric,
  asOf: string,
  direction: RankingDirection = 'desc',
): ScoreRankingResult[] {
  const candidates = models.flatMap((model) => {
    if (!isScoreRankingEligible(model, metric, asOf)) return [];
    const score = model.scores[metric];
    return score === null ? [] : [{ model, score, metric }];
  });

  const highestFirst = candidates.sort(
    (a, b) => b.score - a.score || compareScoreTieBreakers(a, b),
  );
  const ranked = highestFirst.map((result, index) => ({
    ...result,
    rank: index + 1,
  }));

  if (direction === 'desc') return ranked;
  return [...ranked].sort(
    (a, b) => a.score - b.score || compareScoreTieBreakers(a, b),
  );
}

export function getVerifiedInputPrice(
  model: CatalogModel,
  asOf: string,
): { value: number; verifiedAt: string } | null {
  const date = asOfDate(asOf);
  const input = singleRate(model, 'input');
  if (!date || !input || priceFreshness(input, date) !== 'Current') return null;
  if (!Number.isFinite(input.value) || input.value < 0) return null;
  return { value: input.value, verifiedAt: input.source.retrievedAt };
}

export function isLowestCostRankingEligible(
  model: CatalogModel,
  asOf: string,
): boolean {
  return (
    isCurrentProductionModel(model, asOf) &&
    getVerifiedInputPrice(model, asOf) !== null
  );
}

function compareCostTieBreakers(
  a: Omit<LowestCostRankingResult, 'rank'>,
  b: Omit<LowestCostRankingResult, 'rank'>,
): number {
  const aEfficiency = a.model.scores.costEfficiency ?? -1;
  const bEfficiency = b.model.scores.costEfficiency ?? -1;
  if (bEfficiency !== aEfficiency) return bEfficiency - aEfficiency;

  const dateDifference = b.priceVerifiedAt.localeCompare(a.priceVerifiedAt);
  if (dateDifference !== 0) return dateDifference;

  return a.model.name.localeCompare(b.model.name);
}

export function rankLowestCostModels(
  models: CatalogModel[],
  asOf: string,
  direction: RankingDirection = 'asc',
): LowestCostRankingResult[] {
  const candidates = models.flatMap((model) => {
    if (!isCurrentProductionModel(model, asOf)) return [];
    const price = getVerifiedInputPrice(model, asOf);
    return price
      ? [
          {
            model,
            inputPrice: price.value,
            priceVerifiedAt: price.verifiedAt,
          },
        ]
      : [];
  });

  const lowestFirst = candidates.sort(
    (a, b) => a.inputPrice - b.inputPrice || compareCostTieBreakers(a, b),
  );
  const ranked = lowestFirst.map((result, index) => ({
    ...result,
    rank: index + 1,
  }));

  if (direction === 'asc') return ranked;
  return [...ranked].sort(
    (a, b) => b.inputPrice - a.inputPrice || compareCostTieBreakers(a, b),
  );
}

export function getPublishedRankingModels(
  models: CatalogModel[],
  asOf: string,
): CatalogModel[] {
  const rankedModels = [
    ...rankIntelligenceModels(models, asOf),
    ...rankSpeedModels(models, asOf),
    ...scoreRankingMetrics.flatMap((metric) =>
      rankScoreModels(models, metric, asOf),
    ),
    ...rankLowestCostModels(models, asOf),
  ].map((result) => result.model);

  return [
    ...new Map(rankedModels.map((model) => [model.slug, model])).values(),
  ];
}
