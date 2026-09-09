import type { ModelRole } from '../pipeline/types';

export type FinderMetric =
  | 'reasoning'
  | 'coding'
  | 'agenticCoding'
  | 'mathematics'
  | 'dataAnalysis'
  | 'language'
  | 'instructionFollowing';

export type Importance = 'low' | 'medium' | 'high';
export type UseCaseId =
  | 'coding'
  | 'agentic-workflows'
  | 'research'
  | 'daily-use'
  | 'writing'
  | 'study'
  | 'images-vision'
  | 'data-analysis'
  | 'mathematics';
export type PriorityId =
  'quality' | 'speed' | 'cost' | 'value' | 'long-context' | 'open-weights';
export type BudgetTier = 'free' | 'very-cheap' | 'moderate' | 'flexible';
export type BudgetBehavior = 'strict' | 'preferred';

interface UseCaseDefinition {
  label: string;
  description: string;
  metrics: Partial<Record<FinderMetric, number>>;
  available: boolean;
  unavailableReason?: string;
}

export const importanceValues: Record<Importance, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export const finderMetricLabels: Record<FinderMetric, string> = {
  reasoning: 'Reasoning',
  coding: 'Coding',
  agenticCoding: 'Agentic coding',
  mathematics: 'Mathematics',
  dataAnalysis: 'Data analysis',
  language: 'Language',
  instructionFollowing: 'Instruction following',
};

export const useCaseDefinitions: Record<UseCaseId, UseCaseDefinition> = {
  coding: {
    label: 'Coding',
    description: 'Build, debug, and understand software',
    metrics: { coding: 0.55, agenticCoding: 0.25, reasoning: 0.2 },
    available: true,
  },
  'agentic-workflows': {
    label: 'Agentic workflows',
    description: 'Complete multi-step work with tools',
    metrics: {
      agenticCoding: 0.6,
      reasoning: 0.25,
      instructionFollowing: 0.15,
    },
    available: true,
  },
  research: {
    label: 'Research',
    description: 'Synthesize evidence and complex information',
    metrics: {
      reasoning: 0.35,
      dataAnalysis: 0.25,
      instructionFollowing: 0.2,
      language: 0.2,
    },
    available: true,
  },
  'daily-use': {
    label: 'Daily use',
    description: 'Questions, planning, and everyday help',
    metrics: {
      instructionFollowing: 0.4,
      language: 0.3,
      reasoning: 0.3,
    },
    available: true,
  },
  writing: {
    label: 'Writing',
    description: 'Draft, edit, and shape clear prose',
    metrics: { language: 0.5, instructionFollowing: 0.3, reasoning: 0.2 },
    available: true,
  },
  study: {
    label: 'Study',
    description: 'Learn concepts and work through problems',
    metrics: {
      reasoning: 0.35,
      instructionFollowing: 0.25,
      language: 0.2,
      mathematics: 0.2,
    },
    available: true,
  },
  'images-vision': {
    label: 'Images & vision',
    description: 'Compare image and chart understanding',
    metrics: {},
    available: false,
    unavailableReason: 'Vision quality evidence is not available yet.',
  },
  'data-analysis': {
    label: 'Data analysis',
    description: 'Interpret data and produce useful analysis',
    metrics: { dataAnalysis: 0.55, reasoning: 0.25, coding: 0.2 },
    available: true,
  },
  mathematics: {
    label: 'Mathematics',
    description: 'Solve and explain mathematical problems',
    metrics: { mathematics: 0.65, reasoning: 0.35 },
    available: true,
  },
};

export const priorityDefinitions: Record<
  PriorityId,
  { label: string; description: string }
> = {
  quality: {
    label: 'Best quality',
    description: 'Favor the strongest fit for your work',
  },
  speed: {
    label: 'Fastest answers',
    description: 'Use verified response throughput when available',
  },
  cost: {
    label: 'Lowest cost',
    description: 'Require a current verified API price',
  },
  value: {
    label: 'Best value',
    description: 'Keep task suitability ahead of savings',
  },
  'long-context': {
    label: 'Long context',
    description: 'Favor room for larger documents and histories',
  },
  'open-weights': {
    label: 'Open weights',
    description: 'Prefer models with downloadable weights',
  },
};

export const modelFinderConfig = {
  maxUseCases: 3,
  maxPriorities: 3,
  minimumEvidenceCoverage: 0.4,
  budgetLimits: {
    free: 0,
    'very-cheap': 1,
    moderate: 5,
    flexible: Number.POSITIVE_INFINITY,
  } satisfies Record<BudgetTier, number>,
  baseScoreWeights: {
    taskFit: 0.6,
    priorityFit: 0.25,
    economicsFit: 0.1,
    confidence: 0.05,
  },
  balancedScoreWeights: {
    taskFit: 0.7,
    priorityFit: 0,
    economicsFit: 0.2,
    confidence: 0.1,
  },
  priorityModifiers: {
    quality: { taskFit: 0.1, priorityFit: -0.05, economicsFit: -0.05 },
    speed: { taskFit: 0, priorityFit: 0, economicsFit: 0 },
    cost: { taskFit: -0.05, priorityFit: -0.05, economicsFit: 0.1 },
    value: { taskFit: -0.05, priorityFit: -0.05, economicsFit: 0.1 },
    'long-context': { taskFit: 0, priorityFit: 0, economicsFit: 0 },
    'open-weights': { taskFit: 0, priorityFit: 0, economicsFit: 0 },
  } satisfies Record<
    PriorityId,
    { taskFit: number; priorityFit: number; economicsFit: number }
  >,
  contextTiers: [
    { minimum: 1_000_000, score: 100 },
    { minimum: 256_000, score: 80 },
    { minimum: 128_000, score: 60 },
    { minimum: 32_000, score: 40 },
    { minimum: 0, score: 20 },
  ],
  bestValue: {
    minimumTaskFitRatio: 0.8,
    minimumSavingsRatio: 0.2,
    taskWeight: 0.7,
    priceWeight: 0.3,
  },
  excludedAssistantRoles: new Set<ModelRole>([
    'safety-classifier',
    'moderation',
    'embedding',
    'reranker',
    'image-generation',
    'speech',
  ]),
} as const;

export const useCaseOrder = Object.keys(useCaseDefinitions) as UseCaseId[];
export const priorityOrder = Object.keys(priorityDefinitions) as PriorityId[];
