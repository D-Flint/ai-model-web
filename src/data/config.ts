export const metricLabels = {
  overall: 'Overall',
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
} as const;
export type Metric = keyof typeof metricLabels;
export type Capability = Exclude<Metric, 'overall'>;
export const overallWeights: Record<Capability, number> = {
  intelligence: 0.25,
  coding: 0.18,
  agentic: 0.15,
  dailyUse: 0.12,
  research: 0.1,
  reliability: 0.08,
  writing: 0.05,
  vision: 0.03,
  speed: 0.02,
  costEfficiency: 0.02,
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
    description: 'Compare the lowest estimated costs per task.',
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
export const workloads = {
  chat: { label: 'Everyday questions', input: 500, output: 500 },
  writing: { label: 'Writing and editing', input: 1500, output: 1200 },
  coding: { label: 'Coding assistance', input: 4000, output: 2000 },
  documents: { label: 'Document analysis', input: 16000, output: 1500 },
  research: { label: 'Research', input: 8000, output: 3000 },
  agents: { label: 'Agentic coding', input: 24000, output: 6000 },
} as const;
export const recommendationConfig = {
  task: 0.55,
  priority: 0.3,
  reliability: 0.15,
  budgetLimits: { free: 0, cheap: 0.005, moderate: 0.03, any: Infinity },
} as const;

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

export const effortTokens: Record<ReasoningEffort, number> = {
  none: 0,
  low: 1000,
  medium: 4000,
  high: 16000,
  max: 32000,
  fixed: 4000,
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

export const methodologyVersion = 'sample-1.0';
export const fixtureDate = '2026-09-05';
