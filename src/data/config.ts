export const metricLabels = {
  overall: 'Synapse Composite',
  intelligence: 'Intelligence',
  coding: 'Coding',
  agentic: 'Agentic use',
  dailyUse: 'Daily use',
  research: 'Research',
  writing: 'Writing',
  vision: 'Vision',
  speed: 'Speed',
  reliability: 'Reliability',
  costEfficiency: 'Cost efficiency',
  livebenchOverall: 'LiveBench Overall',
} as const;
export type Metric = Exclude<keyof typeof metricLabels, 'livebenchOverall'>;
export type Capability = Exclude<Metric, 'overall'>;
export const overallWeights: Record<Capability, number> = {
  intelligence: 0.25,
  coding: 0.2,
  agentic: 0.15,
  dailyUse: 0.15,
  research: 0.1,
  vision: 0.05,
  costEfficiency: 0.1,
  writing: 0,
  speed: 0,
  reliability: 0,
};
export const categories = [
  {
    slug: 'intelligence',
    label: 'Intelligence',
    metric: 'intelligence',
    description: 'Frontier reasoning, complex logic, and benchmark depth.',
  },
  {
    slug: 'speed',
    label: 'Speed',
    metric: 'speed',
    description:
      'High throughput measured in tokens/sec, ultra-low latency, and fast generation.',
  },
  {
    slug: 'value',
    label: 'Best value',
    metric: 'costEfficiency',
    description: 'Useful results with a smaller API bill.',
  },
  {
    slug: 'cheap',
    label: 'Lowest cost',
    metric: 'costEfficiency',
    description: 'Compare input API rates per million tokens.',
  },
  {
    slug: 'coding',
    label: 'Coding',
    metric: 'coding',
    description: 'From finding a bug to building something new.',
  },
  {
    slug: 'agents',
    label: 'Agents',
    metric: 'agentic',
    description: 'Multi-step work, tools, and fewer interventions.',
  },
  {
    slug: 'daily-use',
    label: 'Daily use',
    metric: 'dailyUse',
    description: 'A helpful partner for everyday questions.',
  },
  {
    slug: 'research',
    label: 'Research',
    metric: 'research',
    description: 'Make sense of documents and complex topics.',
  },
  {
    slug: 'writing',
    label: 'Writing',
    metric: 'writing',
    description: 'Find the words, refine a draft, shape an idea.',
  },
  {
    slug: 'vision',
    label: 'Vision',
    metric: 'vision',
    description: 'Understand images, charts, and visual context.',
  },
] as const;
export const recommendationConfig = {
  task: 0.55,
  priority: 0.3,
  reliability: 0.15,
  budgetLimits: { free: 0, cheap: 1, moderate: 5, any: Infinity },
} as const;

export const rankingConfig = {
  maxVerificationAgeDays: 90,
  intelligence: {
    intelligence: 0.8,
    coding: 0.1,
    research: 0.1,
  },
} as const;

// Throughput score ceiling for comparable OpenRouter measurements.
export const speedScoreMaxTokensPerSec = 200;

export type WorkloadProfileId = 'agent' | 'chat' | 'oneshot';

export interface WorkloadProfile {
  id: WorkloadProfileId;
  label: string;
  shortLabel: string;
  description: string;
  cachedRatio: number;
  inputRatio: number;
  outputRatio: number;
}

export const workloadProfiles: Record<WorkloadProfileId, WorkloadProfile> = {
  agent: {
    id: 'agent',
    label: 'Agent & Coding',
    shortLabel: 'Agent',
    description:
      'Heavy prompt caching & long context (75% cached, 20% fresh input, 5% output)',
    cachedRatio: 0.75,
    inputRatio: 0.2,
    outputRatio: 0.05,
  },
  chat: {
    id: 'chat',
    label: 'General Assistant',
    shortLabel: 'Chat',
    description:
      'Multi-turn conversation (50% cached, 40% fresh input, 10% output)',
    cachedRatio: 0.5,
    inputRatio: 0.4,
    outputRatio: 0.1,
  },
  oneshot: {
    id: 'oneshot',
    label: 'One-Shot & Bulk',
    shortLabel: 'One-shot',
    description:
      'Fresh generation without cache (0% cached, 75% fresh input, 25% output)',
    cachedRatio: 0.0,
    inputRatio: 0.75,
    outputRatio: 0.25,
  },
};

export const defaultWorkloadProfile: WorkloadProfileId = 'agent';

export type ReasoningEffort =
  'none' | 'low' | 'medium' | 'high' | 'max' | 'fixed';

export const effortLabels: Record<ReasoningEffort, string> = {
  none: 'Instant / Standard',
  low: 'Low effort',
  medium: 'Medium effort',
  high: 'High effort',
  max: 'Max effort',
  fixed: 'Fixed CoT',
};

export const effortLatency: Record<ReasoningEffort, string> = {
  none: 'Instant (< 1s)',
  low: 'Fast (1 - 3s)',
  medium: 'Moderate (4 - 10s)',
  high: 'Extended (15 - 35s)',
  max: 'Deep Thinking (40 - 90s)',
  fixed: 'Standard CoT (3 - 8s)',
};

export const effortScoreAdjustments: Record<
  ReasoningEffort,
  Partial<Record<Capability, number>>
> = {
  none: {},
  low: {
    intelligence: -4,
    coding: -3,
    agentic: -3,
    research: -2,
    speed: 8,
    costEfficiency: 6,
    reliability: -1,
  },
  medium: {
    intelligence: 0,
    coding: 0,
    agentic: 0,
    research: 0,
    speed: 0,
    costEfficiency: 0,
    reliability: 0,
  },
  high: {
    intelligence: 4,
    coding: 4,
    agentic: 4,
    research: 3,
    speed: -16,
    costEfficiency: -14,
    reliability: 2,
  },
  max: {
    intelligence: 7,
    coding: 6,
    agentic: 6,
    research: 5,
    speed: -30,
    costEfficiency: -24,
    reliability: 3,
  },
  fixed: {},
};

export const methodologyVersion = 'v1-external-only';
export const fixtureDate = '2026-09-05';
