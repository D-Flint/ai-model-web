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

function parseDate(value: string): number | null {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(parsed) ? parsed : null;
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
  const asOfTime = parseDate(asOf);
  const verifiedTime = model.lastVerifiedAt
    ? parseDate(model.lastVerifiedAt)
    : null;

  if (asOfTime === null || verifiedTime === null) return false;

  const ageDays = (asOfTime - verifiedTime) / millisecondsPerDay;
  const eligibility = evaluateModelEligibility(model);

  return (
    model.dataKind === 'verified' &&
    eligibility.status === 'active' &&
    model.facts.api &&
    model.facts.availability === 'Production API' &&
    ageDays >= 0 &&
    ageDays <= rankingConfig.maxVerificationAgeDays &&
    hasRequiredIntelligenceEvidence(model)
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
