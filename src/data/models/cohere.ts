import type { CanonicalModelConfig } from '../../pipeline/types';

export const COHERE_MODELS: CanonicalModelConfig[] = [
  {
    slug: 'command-r7b-12-2024',
    name: 'Command R7B',
    provider: 'Cohere',
    providerSlug: 'cohere',
    family: 'Command R',
    openWeights: true,
    openRouterId: 'cohere/command-r7b-12-2024',
    lmarenaAliases: [
      'command-r7b-12-2024',
      'command-r7b',
      'cohere/command-r7b-12-2024',
    ],
    swebenchAliases: ['command-r7b-12-2024', 'command-r7b'],
    livebenchAliases: ['command-r7b-12-2024', 'command-r7b'],
    bfclAliases: ['command-r7b-12-2024', 'command-r7b'],
    officialDocsUrl: 'https://docs.cohere.com/docs/models',
    description:
      "Cohere's state-of-the-art 7B open-weights model specialized for enterprise retrieval-augmented generation (RAG), tool use, and multi-step agentic workflows at edge scale.",
    strengths: [
      '128,000 token context window tailored for retrieval augmented generation',
      'High accuracy function calling and multi-step tool execution',
      'Open weights with permissive research and deployment terms',
      'Ultra-affordable cloud inference ($0.0375 input / $0.15 output per 1M tokens)',
    ],
    weaknesses: [
      'Edge scale limits complex mathematical proofs and creative nuance',
      'Text-only inputs without image comprehension',
    ],
    tags: ['Agentic', 'Open weights', 'Best value', 'Fast'],
    reasoningEffort: ['none'],
    defaultEffort: 'none',
  },
  {
    slug: 'command-r-plus-08-2024',
    name: 'Command R+ 08-2024',
    provider: 'Cohere',
    providerSlug: 'cohere',
    family: 'Command R',
    openWeights: true,
    openRouterId: 'cohere/command-r-plus-08-2024',
    lmarenaAliases: [
      'command-r-plus-08-2024',
      'command-r-plus',
      'cohere/command-r-plus-08-2024',
    ],
    swebenchAliases: ['command-r-plus-08-2024', 'command-r-plus'],
    livebenchAliases: ['command-r-plus-08-2024', 'command-r-plus'],
    bfclAliases: ['command-r-plus-08-2024', 'command-r-plus'],
    officialDocsUrl: 'https://docs.cohere.com/docs/models',
    description:
      "Cohere's premier enterprise foundation model updated in August 2024, specialized for production retrieval-augmented generation (RAG), citation grounding, and multi-step tool agents.",
    strengths: [
      'Industry benchmark in citation grounding and verifiable factual attribution',
      '128,000 token context window optimized for enterprise document repositories',
      'Multilingual fluency across 10 business languages',
      'Open weights with weights available on Hugging Face',
    ],
    weaknesses: [
      'Text only (no multimodal vision)',
      'Higher output pricing ($10.00/1M) than generic mid-sized open models',
    ],
    tags: ['Agentic', 'Open weights', 'Research', 'Large context'],
    reasoningEffort: ['none'],
    defaultEffort: 'none',
  },
];
