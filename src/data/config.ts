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
export const methodologyVersion = 'sample-1.0';
export const fixtureDate = '2026-09-05';
