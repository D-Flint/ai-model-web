import { rankingConfig } from '../data/config';
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
