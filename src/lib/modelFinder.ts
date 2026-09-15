import { comparablePrice, priceFreshness, standardRate } from './apiPricing';
import type { CatalogModel } from './catalogSchema';
import {
  finderMetricLabels,
  importanceValues,
  modelFinderConfig,
  useCaseDefinitions,
  type BudgetBehavior,
  type BudgetTier,
  type FinderMetric,
  type Importance,
  type PriorityId,
  type UseCaseId,
} from '../data/modelFinderConfig';

export interface WeightedSelection<T> {
  id: T;
  importance: Importance;
  selectionOrder: number;
}

export interface ModelFinderRequirements {
  vision: boolean;
  tools: boolean;
  api: boolean;
  openWeights: boolean;
  structuredOutput: boolean;
  minimumContext: number | null;
}

export interface ModelFinderRequest {
  useCases: WeightedSelection<UseCaseId>[];
  priorities: WeightedSelection<PriorityId>[];
  requirements: ModelFinderRequirements;
  budget: { tier: BudgetTier; behavior: BudgetBehavior };
}

export interface EffectiveScoreWeights {
  taskFit: number;
  priorityFit: number;
  economicsFit: number;
  confidence: number;
}

export interface FinderCandidate {
  model: CatalogModel;
  matchScore: number;
  taskFit: number;
  priorityFit: number | null;
  economicsFit: number | null;
  queryConfidence: number;
  evidenceCoverage: number;
  priorityEvidenceCoverage: number;
  effectiveWeights: EffectiveScoreWeights;
  metricWeights: Partial<Record<FinderMetric, number>>;
  metricScores: Partial<Record<FinderMetric, number>>;
  useCaseFits: Partial<Record<UseCaseId, number>>;
  satisfiedRequirements: string[];
  reasons: string[];
  tradeoff: string;
}

export interface FinderRecommendation extends FinderCandidate {
  category: 'best-match' | 'best-value' | 'alternative';
}

export interface ModelFinderResult {
  recommendations: FinderRecommendation[];
  bestMatch: FinderRecommendation | null;
  bestValue: FinderRecommendation | null;
  alternative: FinderRecommendation | null;
  eligibleCount: number;
  excludedCount: number;
  effectiveWeights: EffectiveScoreWeights;
  omissions: string[];
}

const defaultRequirements: ModelFinderRequirements = {
  vision: false,
  tools: false,
  api: false,
  openWeights: false,
  structuredOutput: false,
  minimumContext: null,
};

export const defaultModelFinderRequest: ModelFinderRequest = {
  useCases: [],
  priorities: [],
  requirements: defaultRequirements,
  budget: { tier: 'flexible', behavior: 'preferred' },
};

function clamp(value: number, minimum = 0, maximum = 100): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function isFiniteScore(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateSelections<T>(
  selections: WeightedSelection<T>[],
  maximum: number,
  label: string,
): void {
  if (selections.length > maximum) {
    throw new Error(`Choose no more than ${maximum} ${label}.`);
  }
  const ids = new Set(selections.map((selection) => selection.id));
  if (ids.size !== selections.length) {
    throw new Error(`Choose each ${label.slice(0, -1)} only once.`);
  }
  if (
    selections.some(
      (selection) =>
        !Number.isInteger(selection.selectionOrder) ||
        selection.selectionOrder < 0 ||
        !importanceValues[selection.importance],
    )
  ) {
    throw new Error(`Invalid ${label} selection.`);
  }
}

export function validateModelFinderRequest(request: ModelFinderRequest): void {
  validateSelections(
    request.useCases,
    modelFinderConfig.maxUseCases,
    'use cases',
  );
  validateSelections(
    request.priorities,
    modelFinderConfig.maxPriorities,
    'priorities',
  );
  if (request.useCases.length === 0) {
    throw new Error('Choose at least one use case.');
  }
  for (const selection of request.useCases) {
    if (!useCaseDefinitions[selection.id].available) {
      throw new Error(
        useCaseDefinitions[selection.id].unavailableReason ??
          'This use case is not available yet.',
      );
    }
  }
  if (
    request.requirements.minimumContext !== null &&
    (!Number.isInteger(request.requirements.minimumContext) ||
      request.requirements.minimumContext <= 0)
  ) {
    throw new Error('Minimum context must be a positive whole number.');
  }
}

export function buildTaskWeights(
  selections: WeightedSelection<UseCaseId>[],
): Partial<Record<FinderMetric, number>> {
  const totals: Partial<Record<FinderMetric, number>> = {};
  let totalWeight = 0;

  for (const selection of selections) {
    const importance = importanceValues[selection.importance];
    for (const [metric, baseWeight] of Object.entries(
      useCaseDefinitions[selection.id].metrics,
    ) as [FinderMetric, number][]) {
      const contribution = baseWeight * importance;
      totals[metric] = (totals[metric] ?? 0) + contribution;
      totalWeight += contribution;
    }
  }

  if (totalWeight === 0) return {};
  return Object.fromEntries(
    Object.entries(totals).map(([metric, weight]) => [
      metric,
      weight / totalWeight,
    ]),
  );
}

export function primaryUseCase(
  selections: WeightedSelection<UseCaseId>[],
): UseCaseId | null {
  return (
    [...selections].sort(
      (a, b) =>
        importanceValues[b.importance] - importanceValues[a.importance] ||
        a.selectionOrder - b.selectionOrder,
    )[0]?.id ?? null
  );
}

export function buildEffectiveScoreWeights(
  priorities: WeightedSelection<PriorityId>[],
): EffectiveScoreWeights {
  if (priorities.length === 0) {
    return { ...modelFinderConfig.balancedScoreWeights };
  }

  const totalImportance = priorities.reduce(
    (total, priority) => total + importanceValues[priority.importance],
    0,
  );
  const weights: EffectiveScoreWeights = {
    ...modelFinderConfig.baseScoreWeights,
  };

  for (const priority of priorities) {
    const share = importanceValues[priority.importance] / totalImportance;
    const modifier = modelFinderConfig.priorityModifiers[priority.id];
    weights.taskFit += modifier.taskFit * share;
    weights.priorityFit += modifier.priorityFit * share;
    weights.economicsFit += modifier.economicsFit * share;
  }

  return weights;
}

function metricValue(model: CatalogModel, metric: FinderMetric): number | null {
  const value = model.benchmarks?.livebench?.[metric];
  return isFiniteScore(value) ? value : null;
}

function scoreWithWeights(
  model: CatalogModel,
  metricWeights: Partial<Record<FinderMetric, number>>,
): {
  fit: number | null;
  coverage: number;
  scores: Partial<Record<FinderMetric, number>>;
} {
  let availableWeight = 0;
  let requestedWeight = 0;
  let weightedScore = 0;
  const scores: Partial<Record<FinderMetric, number>> = {};

  for (const [metric, weight] of Object.entries(metricWeights) as [
    FinderMetric,
    number,
  ][]) {
    requestedWeight += weight;
    const value = metricValue(model, metric);
    if (value === null) continue;
    scores[metric] = value;
    availableWeight += weight;
    weightedScore += value * weight;
  }

  return {
    fit: availableWeight > 0 ? weightedScore / availableWeight : null,
    coverage: requestedWeight > 0 ? availableWeight / requestedWeight : 0,
    scores,
  };
}

function contextFit(context: number): number {
  return (
    modelFinderConfig.contextTiers.find((tier) => context >= tier.minimum)
      ?.score ?? 20
  );
}

export function priceFit(price: number): number {
  return clamp(100 - 20 * Math.log2(1 + price));
}

export function preferredBudgetFit(price: number, limit: number): number {
  if (price <= limit) return 100;
  if (limit <= 0) return 0;
  return clamp(100 - 35 * Math.log2(price / limit));
}

function budgetLimit(tier: BudgetTier): number {
  return modelFinderConfig.budgetLimits[tier];
}

function hasVerifiedFreePrice(model: CatalogModel): boolean {
  return comparablePrice(model) === 0 && comparablePrice(model, 'output') === 0;
}

function costIsEssential(request: ModelFinderRequest): boolean {
  return request.priorities.some(
    (priority) => priority.id === 'cost' || priority.id === 'value',
  );
}

export function evaluateEligibility(
  model: CatalogModel,
  request: ModelFinderRequest,
): string[] {
  const failures: string[] = [];
  const roles = model.roles ?? [];
  if (roles.length === 0) failures.push('Model role is not classified.');
  if (
    roles.some((role) => modelFinderConfig.excludedAssistantRoles.has(role))
  ) {
    failures.push('Model is specialized for a non-assistant role.');
  }

  const facts = model.facts;
  if (request.requirements.vision && !facts.vision)
    failures.push('Vision input is not supported.');
  if (request.requirements.tools && !facts.tools)
    failures.push('Tool calling is not supported.');
  if (request.requirements.api && !facts.api)
    failures.push('API access is not available.');
  if (request.requirements.openWeights && !facts.openWeights)
    failures.push('Open weights are required.');
  if (request.requirements.structuredOutput && !facts.structured)
    failures.push('Structured output is not supported.');
  if (
    request.requirements.minimumContext !== null &&
    facts.context < request.requirements.minimumContext
  ) {
    failures.push('Context window is below the requested minimum.');
  }

  const price = comparablePrice(model);
  const limit = budgetLimit(request.budget.tier);
  const strictBudget =
    request.budget.behavior === 'strict' || request.budget.tier === 'free';
  if (request.budget.tier === 'free' && !hasVerifiedFreePrice(model)) {
    failures.push('Verified free API pricing is required.');
  } else if (
    request.budget.tier !== 'flexible' &&
    strictBudget &&
    (price === null || price > limit)
  ) {
    failures.push('Model exceeds the strict budget.');
  }
  if (costIsEssential(request) && price === null) {
    failures.push('Current verified pricing is required.');
  }

  const primary = primaryUseCase(request.useCases);
  const generativeRoles = new Set([
    'general-purpose',
    'reasoning',
    'coding',
    'agentic',
  ]);
  if (primary && !roles.some((role) => generativeRoles.has(role))) {
    failures.push('Model is not a generative assistant for this work.');
  }
  if (primary === 'coding' && metricValue(model, 'coding') === null) {
    failures.push('Coding evidence is unavailable.');
  }
  if (primary === 'agentic-workflows') {
    if (!facts.tools) failures.push('Agentic work requires tool calling.');
    if (metricValue(model, 'agenticCoding') === null)
      failures.push('Agentic evidence is unavailable.');
  }
  if (
    (primary === 'writing' || primary === 'daily-use' || primary === 'study') &&
    !roles.some((role) => role === 'general-purpose' || role === 'reasoning')
  ) {
    failures.push('A general-purpose generative assistant is required.');
  }

  return [...new Set(failures)];
}

function priorityScore(
  model: CatalogModel,
  priority: PriorityId,
  taskFit: number,
): number | null {
  const price = comparablePrice(model);
  switch (priority) {
    case 'quality':
      return taskFit;
    case 'speed':
      return isFiniteScore(model.scores.speed) ? model.scores.speed : null;
    case 'cost':
      return price === null ? null : priceFit(price);
    case 'value':
      return price === null ? null : taskFit * 0.8 + priceFit(price) * 0.2;
    case 'long-context':
      return contextFit(model.facts.context);
    case 'open-weights':
      return model.facts.openWeights ? 100 : 0;
  }
}

function calculatePriorityFit(
  model: CatalogModel,
  request: ModelFinderRequest,
  taskFit: number,
): { fit: number | null; coverage: number } {
  if (request.priorities.length === 0) return { fit: null, coverage: 1 };
  let requested = 0;
  let available = 0;
  let total = 0;
  for (const priority of request.priorities) {
    const weight = importanceValues[priority.importance];
    requested += weight;
    const score = priorityScore(model, priority.id, taskFit);
    if (score === null) continue;
    available += weight;
    total += score * weight;
  }
  return {
    fit: available > 0 ? total / available : null,
    coverage: requested > 0 ? available / requested : 1,
  };
}

function calculateEconomicsFit(
  model: CatalogModel,
  request: ModelFinderRequest,
): number | null {
  const price = comparablePrice(model);
  if (price === null) return null;
  const generalPriceFit = priceFit(price);
  if (request.budget.tier === 'flexible') return generalPriceFit;
  if (request.budget.tier === 'free')
    return hasVerifiedFreePrice(model) ? 100 : null;
  const fit = preferredBudgetFit(price, budgetLimit(request.budget.tier));
  return generalPriceFit * 0.6 + fit * 0.4;
}

function calculateQueryCoverage(
  request: ModelFinderRequest,
  taskCoverage: number,
  priorityCoverage: number,
  economicsAvailable: boolean,
): number {
  let requestedWeight = 0.7;
  let availableWeight = taskCoverage * 0.7;
  if (request.priorities.length > 0) {
    requestedWeight += 0.2;
    availableWeight += priorityCoverage * 0.2;
  }
  if (request.budget.tier !== 'flexible' || costIsEssential(request)) {
    requestedWeight += 0.1;
    availableWeight += economicsAvailable ? 0.1 : 0;
  }
  return availableWeight / requestedWeight;
}

function calculateFinalScore(
  values: {
    taskFit: number;
    priorityFit: number | null;
    economicsFit: number | null;
    confidence: number;
  },
  weights: EffectiveScoreWeights,
): number {
  const components: Array<[number | null, number]> = [
    [values.taskFit, weights.taskFit],
    [values.priorityFit, weights.priorityFit],
    [values.economicsFit, weights.economicsFit],
    [values.confidence, weights.confidence],
  ];
  let availableWeight = 0;
  let total = 0;
  for (const [value, weight] of components) {
    if (weight <= 0 || value === null) continue;
    availableWeight += weight;
    total += value * weight;
  }
  return availableWeight > 0 ? Math.round(total / availableWeight) : 0;
}

function requirementLabels(request: ModelFinderRequest): string[] {
  const labels: string[] = [];
  if (request.requirements.vision) labels.push('Vision support');
  if (request.requirements.tools) labels.push('Tool calling');
  if (request.requirements.api) labels.push('API available');
  if (request.requirements.openWeights) labels.push('Open weights');
  if (request.requirements.structuredOutput) labels.push('Structured output');
  if (request.requirements.minimumContext !== null) {
    labels.push(
      `${Math.round(request.requirements.minimumContext / 1000)}K+ context`,
    );
  }
  return labels;
}

function topMetricReasons(
  weights: Partial<Record<FinderMetric, number>>,
  scores: Partial<Record<FinderMetric, number>>,
): string[] {
  return (Object.entries(scores) as [FinderMetric, number][])
    .sort(
      ([metricA, scoreA], [metricB, scoreB]) =>
        scoreB * (weights[metricB] ?? 0) - scoreA * (weights[metricA] ?? 0) ||
        metricA.localeCompare(metricB),
    )
    .slice(0, 3)
    .map(
      ([metric, score]) => `${finderMetricLabels[metric]} ${Math.round(score)}`,
    );
}

function useCaseFits(
  model: CatalogModel,
  request: ModelFinderRequest,
): Partial<Record<UseCaseId, number>> {
  return Object.fromEntries(
    request.useCases.flatMap((selection) => {
      const result = scoreWithWeights(
        model,
        useCaseDefinitions[selection.id].metrics,
      );
      return result.fit === null ? [] : [[selection.id, result.fit]];
    }),
  );
}

function candidateTradeoff(
  model: CatalogModel,
  coverage: number,
  eligibleModels: CatalogModel[],
): string {
  if (coverage < 1) return 'Some requested benchmark evidence is unavailable.';
  const price = comparablePrice(model);
  if (price === null) {
    const rate = standardRate(model, 'input');
    if (rate && priceFreshness(rate) === 'Needs verification') {
      return 'Current API pricing is pending verification.';
    }
    return 'Current API pricing is unavailable.';
  }
  const fastest = Math.max(
    ...eligibleModels.map((candidate) => candidate.scores.speed ?? 0),
  );
  if ((model.scores.speed ?? 0) < fastest)
    return 'Slower than the fastest eligible option.';
  const prices = eligibleModels
    .map((candidate) => comparablePrice(candidate))
    .filter((value): value is number => value !== null);
  if (prices.length > 0 && price > Math.min(...prices))
    return 'Costs more than the lowest-priced eligible option.';
  return 'Does not lead every selected priority.';
}

export function scoreCandidate(
  model: CatalogModel,
  request: ModelFinderRequest,
  eligibleModels: CatalogModel[] = [model],
): FinderCandidate | null {
  const metricWeights = buildTaskWeights(request.useCases);
  const task = scoreWithWeights(model, metricWeights);
  if (
    task.fit === null ||
    task.coverage < modelFinderConfig.minimumEvidenceCoverage
  ) {
    return null;
  }
  const priority = calculatePriorityFit(model, request, task.fit);
  const economicsFit = calculateEconomicsFit(model, request);
  const queryCoverage = calculateQueryCoverage(
    request,
    task.coverage,
    priority.coverage,
    economicsFit !== null,
  );
  const queryConfidence = Math.round(
    model.confidence * (0.5 + 0.5 * queryCoverage),
  );
  const effectiveWeights = buildEffectiveScoreWeights(request.priorities);
  const roundedTaskFit = Math.round(task.fit);
  const roundedPriorityFit =
    priority.fit === null ? null : Math.round(priority.fit);
  const roundedEconomicsFit =
    economicsFit === null ? null : Math.round(economicsFit);
  const matchScore = calculateFinalScore(
    {
      taskFit: roundedTaskFit,
      priorityFit: roundedPriorityFit,
      economicsFit: roundedEconomicsFit,
      confidence: queryConfidence,
    },
    effectiveWeights,
  );
  const reasons = topMetricReasons(metricWeights, task.scores);
  if (request.priorities.length > 0 && priority.fit !== null) {
    reasons.push(`Priority fit ${roundedPriorityFit}`);
  }

  return {
    model,
    matchScore,
    taskFit: roundedTaskFit,
    priorityFit: roundedPriorityFit,
    economicsFit: roundedEconomicsFit,
    queryConfidence,
    evidenceCoverage: Math.round(task.coverage * 100),
    priorityEvidenceCoverage: Math.round(priority.coverage * 100),
    effectiveWeights,
    metricWeights,
    metricScores: task.scores,
    useCaseFits: useCaseFits(model, request),
    satisfiedRequirements: requirementLabels(request),
    reasons: reasons.slice(0, 4),
    tradeoff: candidateTradeoff(model, task.coverage, eligibleModels),
  };
}

function candidateOrder(a: FinderCandidate, b: FinderCandidate): number {
  return (
    b.matchScore - a.matchScore ||
    b.taskFit - a.taskFit ||
    b.queryConfidence - a.queryConfidence ||
    (comparablePrice(a.model) ?? Number.POSITIVE_INFINITY) -
      (comparablePrice(b.model) ?? Number.POSITIVE_INFINITY) ||
    a.model.slug.localeCompare(b.model.slug)
  );
}

function measurableAlternative(
  candidate: FinderCandidate,
  best: FinderCandidate,
  request: ModelFinderRequest,
): string | null {
  const candidatePrice = comparablePrice(candidate.model);
  const bestPrice = comparablePrice(best.model);
  if (
    candidatePrice !== null &&
    bestPrice !== null &&
    candidatePrice < bestPrice
  ) {
    return 'Lower verified API input price.';
  }
  if (
    isFiniteScore(candidate.model.scores.speed) &&
    (!isFiniteScore(best.model.scores.speed) ||
      candidate.model.scores.speed > best.model.scores.speed)
  ) {
    return 'Higher verified response throughput.';
  }
  if (
    contextFit(candidate.model.facts.context) >
    contextFit(best.model.facts.context)
  )
    return 'Larger context tier.';
  if (candidate.model.facts.openWeights && !best.model.facts.openWeights)
    return 'Open weights provide a different deployment tradeoff.';
  const primary = primaryUseCase(request.useCases);
  const hasStrongerSecondary = request.useCases.some(
    (selection) =>
      selection.id !== primary &&
      (candidate.useCaseFits[selection.id] ?? -1) >
        (best.useCaseFits[selection.id] ?? -1),
  );
  return hasStrongerSecondary ? 'Stronger fit for a secondary use case.' : null;
}

function diversityRank(
  candidate: FinderCandidate,
  best: FinderCandidate,
): number {
  const differentProvider = candidate.model.provider !== best.model.provider;
  const differentFamily = candidate.model.family !== best.model.family;
  if (differentProvider && differentFamily) return 0;
  if (differentProvider) return 1;
  if (differentFamily) return 2;
  return 3;
}

export function recommendModels(
  models: CatalogModel[],
  request: ModelFinderRequest,
): ModelFinderResult {
  validateModelFinderRequest(request);
  const eligibleModels = models.filter(
    (model) => evaluateEligibility(model, request).length === 0,
  );
  const candidates = eligibleModels
    .map((model) => scoreCandidate(model, request, eligibleModels))
    .filter((candidate): candidate is FinderCandidate => candidate !== null)
    .sort(candidateOrder);

  const bestCandidate = candidates[0] ?? null;
  const bestMatch = bestCandidate
    ? { ...bestCandidate, category: 'best-match' as const }
    : null;
  let bestValue: FinderRecommendation | null = null;
  let alternative: FinderRecommendation | null = null;
  const omissions: string[] = [];

  if (bestCandidate) {
    const bestPrice = comparablePrice(bestCandidate.model);
    if (bestPrice === null) {
      omissions.push(
        'Best Value omitted because Best Match has no current verified price.',
      );
    } else {
      const valueCandidates = candidates
        .filter((candidate) => {
          const price = comparablePrice(candidate.model);
          return (
            candidate.model.slug !== bestCandidate.model.slug &&
            price !== null &&
            price <=
              bestPrice *
                (1 - modelFinderConfig.bestValue.minimumSavingsRatio) &&
            candidate.taskFit >=
              bestCandidate.taskFit *
                modelFinderConfig.bestValue.minimumTaskFitRatio
          );
        })
        .sort((a, b) => {
          const aValue =
            a.taskFit * modelFinderConfig.bestValue.taskWeight +
            priceFit(comparablePrice(a.model)!) *
              modelFinderConfig.bestValue.priceWeight;
          const bValue =
            b.taskFit * modelFinderConfig.bestValue.taskWeight +
            priceFit(comparablePrice(b.model)!) *
              modelFinderConfig.bestValue.priceWeight;
          return bValue - aValue || candidateOrder(a, b);
        });
      if (valueCandidates[0]) {
        bestValue = {
          ...valueCandidates[0],
          category: 'best-value',
          tradeoff: `Costs at least ${Math.round(modelFinderConfig.bestValue.minimumSavingsRatio * 100)}% less than Best Match.`,
        };
      } else {
        omissions.push(
          'Best Value omitted because no strongly suitable model is meaningfully cheaper.',
        );
      }
    }

    const used = new Set([
      bestCandidate.model.slug,
      ...(bestValue ? [bestValue.model.slug] : []),
    ]);
    const alternatives = candidates
      .filter((candidate) => !used.has(candidate.model.slug))
      .map((candidate) => ({
        candidate,
        tradeoff: measurableAlternative(candidate, bestCandidate, request),
      }))
      .filter(
        (entry): entry is { candidate: FinderCandidate; tradeoff: string } =>
          entry.tradeoff !== null,
      )
      .sort(
        (a, b) =>
          diversityRank(a.candidate, bestCandidate) -
            diversityRank(b.candidate, bestCandidate) ||
          candidateOrder(a.candidate, b.candidate),
      );
    if (alternatives[0]) {
      alternative = {
        ...alternatives[0].candidate,
        category: 'alternative',
        tradeoff: alternatives[0].tradeoff,
      };
    } else {
      omissions.push(
        'Alternative omitted because no remaining model offers a measurable tradeoff.',
      );
    }
  } else {
    omissions.push(
      'No model passed the selected roles, requirements, budget, and evidence gates.',
    );
  }

  return {
    recommendations: [bestMatch, bestValue, alternative].filter(
      (result): result is FinderRecommendation => result !== null,
    ),
    bestMatch,
    bestValue,
    alternative,
    eligibleCount: candidates.length,
    excludedCount: models.length - candidates.length,
    effectiveWeights: buildEffectiveScoreWeights(request.priorities),
    omissions,
  };
}
