import type { CanonicalModelConfig } from '../../pipeline/types';

export const XAI_MODELS: CanonicalModelConfig[] = [
  {
    slug: 'grok-2',
    name: 'Grok 2',
    provider: 'xAI',
    providerSlug: 'xai',
    family: 'Grok',
    openWeights: false,
    openRouterId: 'x-ai/grok-2-1212',
    lmarenaAliases: [
      'grok-2-1212',
      'grok-2-vision-1212',
      'grok-2',
      'x-ai/grok-2',
    ],
    swebenchAliases: ['grok-2-1212', 'grok-2'],
    livebenchAliases: ['grok-2-1212', 'grok-2', 'grok-2-vision-1212'],
    bfclAliases: ['grok-2-1212', 'grok-2'],
    officialDocsUrl: 'https://docs.x.ai/docs/overview#models',
    description:
      "xAI's flagship frontier model, featuring state-of-the-art visual understanding, real-time factual knowledge, and high-accuracy tool use.",
    strengths: [
      'High conversational responsiveness and candid factual clarity',
      'Multimodal vision comprehension with diagram and chart extraction',
      'Robust function calling and structured outputs compliance',
    ],
    weaknesses: [
      'Higher output pricing ($10.00/1M tokens) than mid-tier open models',
      'Rate limits on specialized enterprise tiers',
    ],
    tags: ['Vision', 'Research', 'Agentic', 'Daily use'],
    reasoningEffort: ['none'],
    defaultEffort: 'none',
  },
];
