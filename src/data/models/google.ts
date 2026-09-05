import type { CanonicalModelConfig } from '../../pipeline/types';

export const GOOGLE_MODELS: CanonicalModelConfig[] = [
  {
    slug: 'gemini-2-0-pro-exp',
    name: 'Gemini 2.0 Pro Exp',
    provider: 'Google DeepMind',
    providerSlug: 'google',
    family: 'Gemini',
    openWeights: false,
    openRouterId: 'google/gemini-2.0-pro-exp-02-05:free',
    lmarenaAliases: [
      'gemini-2.0-pro-exp-02-05',
      'gemini-2.0-pro-exp',
      'gemini-2.0-pro',
      'google/gemini-2.0-pro-exp-02-05',
    ],
    swebenchAliases: [
      'gemini-2.0-pro-exp-02-05',
      'gemini-2.0-pro-exp',
      'gemini-2.0-pro',
    ],
    livebenchAliases: [
      'gemini-2.0-pro-exp-02-05',
      'gemini-2.0-pro-exp',
      'gemini-2.0-pro',
    ],
    bfclAliases: [
      'gemini-2.0-pro-exp-02-05',
      'gemini-2.0-pro-exp',
      'gemini-2.0-pro',
    ],
    officialDocsUrl:
      'https://ai.google.dev/gemini-api/docs/models/gemini#gemini-2.0-pro',
    description:
      "Google's most capable Gemini 2.0 model, built for complex reasoning, large-scale coding, and multi-modal problem solving with a 2M token context window.",
    strengths: [
      'Industry-leading 2,097,152 token context window with high recall',
      'Top-tier coding performance and structured output fidelity',
      'Native multimodal vision and audio comprehension',
    ],
    weaknesses: [
      'Experimental status with potential endpoint changes across preview cycles',
      'Higher latency than Gemini 2.0 Flash on basic prompts',
    ],
    tags: ['Coding', 'Research', 'Long context', 'Vision', 'Multimodal'],
    reasoningEffort: ['fixed'],
    defaultEffort: 'fixed',
  },
  {
    slug: 'gemini-2-0-flash-thinking-exp',
    name: 'Gemini 2.0 Flash Thinking Exp',
    provider: 'Google DeepMind',
    providerSlug: 'google',
    family: 'Gemini',
    openWeights: false,
    openRouterId: 'google/gemini-2.0-flash-thinking-exp:free',
    lmarenaAliases: [
      'gemini-2.0-flash-thinking-exp-1219',
      'gemini-2.0-flash-thinking-exp',
      'gemini-2.0-flash-thinking',
      'google/gemini-2.0-flash-thinking-exp',
    ],
    swebenchAliases: [
      'gemini-2.0-flash-thinking-exp-1219',
      'gemini-2.0-flash-thinking-exp',
      'gemini-2.0-flash-thinking',
    ],
    livebenchAliases: [
      'gemini-2.0-flash-thinking-exp-1219',
      'gemini-2.0-flash-thinking-exp',
      'gemini-2.0-flash-thinking',
    ],
    bfclAliases: [
      'gemini-2.0-flash-thinking-exp-1219',
      'gemini-2.0-flash-thinking-exp',
      'gemini-2.0-flash-thinking',
    ],
    officialDocsUrl:
      'https://ai.google.dev/gemini-api/docs/models/gemini#gemini-2.0-flash-thinking',
    description:
      "Google's specialized reasoning model combining the Flash architecture speed with explicit internal chain-of-thought reasoning and multimodal input.",
    strengths: [
      'Visible reasoning traces for debugging math and logic problems',
      '1,048,576 token long context support for reasoning over massive documents',
      'Multimodal reasoning over images, diagrams, and math figures',
    ],
    weaknesses: [
      'Thinking process consumes additional output tokens',
      'Experimental preview endpoint subject to rate limitations',
    ],
    tags: ['Reasoning', 'STEM', 'Long context', 'Vision'],
    reasoningEffort: ['fixed'],
    defaultEffort: 'fixed',
  },
  {
    slug: 'gemini-2-0-flash-lite',
    name: 'Gemini 2.0 Flash-Lite',
    provider: 'Google DeepMind',
    providerSlug: 'google',
    family: 'Gemini',
    openWeights: false,
    openRouterId: 'google/gemini-2.0-flash-lite-preview-02-05:free',
    lmarenaAliases: [
      'gemini-2.0-flash-lite-preview-02-05',
      'gemini-2.0-flash-lite-preview',
      'gemini-2.0-flash-lite',
      'google/gemini-2.0-flash-lite-preview-02-05',
    ],
    swebenchAliases: [
      'gemini-2.0-flash-lite-preview-02-05',
      'gemini-2.0-flash-lite',
    ],
    livebenchAliases: [
      'gemini-2.0-flash-lite-preview-02-05',
      'gemini-2.0-flash-lite',
    ],
    bfclAliases: [
      'gemini-2.0-flash-lite-preview-02-05',
      'gemini-2.0-flash-lite',
    ],
    officialDocsUrl:
      'https://ai.google.dev/gemini-api/docs/models/gemini#gemini-2.0-flash-lite',
    description:
      "Google's ultra-cost-efficient production model, built for high-throughput, low-latency tasks at unprecedented low pricing ($0.075/1M input tokens).",
    strengths: [
      'Industry-leading low pricing ($0.075/1M input, $0.30/1M output)',
      '1,048,576 token long context window',
      'Ultra-fast time to first token and high generation throughput',
    ],
    weaknesses: [
      'Lower maximum reasoning capability on intricate math and coding proofs',
      'Compressed parameter footprint compared to Pro models',
    ],
    tags: ['Best value', 'Fast', 'Long context', 'Vision'],
    reasoningEffort: ['fixed'],
    defaultEffort: 'fixed',
  },
  {
    slug: 'gemini-2-0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google DeepMind',
    providerSlug: 'google',
    family: 'Gemini',
    openWeights: false,
    openRouterId: 'google/gemini-2.0-flash-001',
    lmarenaAliases: [
      'gemini-2.0-flash',
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash-001',
      'google/gemini-2.0-flash-001',
      'gemini-2-0-flash',
    ],
    swebenchAliases: [
      'gemini-2.0-flash',
      'gemini-2.0-flash-exp',
      'Google: Gemini 2.0 Flash',
    ],
    livebenchAliases: ['gemini-2.0-flash', 'gemini-2.0-flash-exp'],
    bfclAliases: ['gemini-2.0-flash', 'gemini-2.0-flash-001'],
    officialDocsUrl:
      'https://ai.google.dev/gemini-api/docs/models/gemini#gemini-2.0-flash',
    description:
      "Google's next-generation multimodal workhorse, built for high-speed agentic workflows, long-context reasoning, and native multimodal understanding.",
    strengths: [
      'Blazing fast output throughput and low time-to-first-token',
      'Massive 1,048,576 token context window for huge documents and codebases',
      'Native multimodal vision and audio processing at low token pricing',
    ],
    weaknesses: [
      'Lower deep-reasoning depth than dedicated o1/r1 reasoning architectures',
      'Output token limit of 8,192 is lower than flagship generation limits',
    ],
    tags: ['Speed', 'Multimodal', 'Vision', 'Large context'],
    reasoningEffort: ['none'],
    defaultEffort: 'none',
  },
  {
    slug: 'gemini-1-5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google DeepMind',
    providerSlug: 'google',
    family: 'Gemini',
    openWeights: false,
    openRouterId: 'google/gemini-pro-1.5',
    lmarenaAliases: [
      'gemini-1.5-pro-002',
      'gemini-1.5-pro',
      'google/gemini-pro-1.5',
      'gemini-1-5-pro',
    ],
    swebenchAliases: [
      'gemini-1.5-pro-002',
      'gemini-1.5-pro',
      'Google: Gemini 1.5 Pro',
    ],
    livebenchAliases: ['gemini-1.5-pro-002', 'gemini-1.5-pro'],
    bfclAliases: ['gemini-1.5-pro-002', 'gemini-1.5-pro'],
    officialDocsUrl:
      'https://ai.google.dev/gemini-api/docs/models/gemini#gemini-1.5-pro',
    description:
      "Google's 2-million-token multimodal flagship model, tailored for expansive document analysis, audio understanding, and repository-wide code exploration.",
    strengths: [
      'Industry-leading 2,097,152 token context window with high recall',
      'Rich multimodal support including video, audio, and high-res imagery',
      'Significant performance improvements on 002 release checkpoint',
    ],
    weaknesses: [
      'Higher latency on very large prompt contexts',
      'Pricing scales up for requests exceeding 128,000 tokens',
    ],
    tags: ['Large context', 'Vision', 'Multimodal', 'Research'],
    reasoningEffort: ['none'],
    defaultEffort: 'none',
  },
  {
    slug: 'gemini-1-5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google DeepMind',
    providerSlug: 'google',
    family: 'Gemini',
    openWeights: false,
    openRouterId: 'google/gemini-flash-1.5',
    lmarenaAliases: [
      'gemini-1.5-flash-002',
      'gemini-1.5-flash',
      'google/gemini-flash-1.5',
      'gemini-1-5-flash',
    ],
    swebenchAliases: ['gemini-1.5-flash-002', 'gemini-1.5-flash'],
    livebenchAliases: ['gemini-1.5-flash-002', 'gemini-1.5-flash'],
    bfclAliases: ['gemini-1.5-flash-002', 'gemini-1.5-flash'],
    officialDocsUrl:
      'https://ai.google.dev/gemini-api/docs/models/gemini#gemini-1.5-flash',
    description:
      "Google's lightweight multimodal model optimized for cost efficiency, high request volume, and million-token document understanding.",
    strengths: [
      '1,048,576 token context window at an entry-level price point',
      'Fast inference throughput and low time-to-first-token',
      'Native multimodal capabilities across text, audio, and visual data',
    ],
    weaknesses: [
      'Lower code synthesis accuracy on complex algorithmic tasks',
      'Requires precise prompting for intricate reasoning chains',
    ],
    tags: ['Speed', 'Best value', 'Vision', 'Large context'],
    reasoningEffort: ['none'],
    defaultEffort: 'none',
  },
];
