import type { CanonicalModelConfig } from '../../pipeline/types';

export const TENCENT_MODELS: CanonicalModelConfig[] = [
  {
    slug: 'hy4-preview',
    name: 'Hy4 preview',
    provider: 'Tencent',
    providerSlug: 'tencent',
    family: 'Hunyuan',
    openWeights: false,
    openRouterId: 'tencent/hy4-preview',
    lmarenaAliases: ['tencent/hy4-preview', 'hy4-preview', 'hunyuan-4-preview'],
    swebenchAliases: ['hy4-preview', 'Tencent: Hy4 preview'],
    livebenchAliases: ['hy4-preview'],
    bfclAliases: ['hy4-preview'],
    officialDocsUrl: 'https://hunyuan.tencent.com/',
    description:
      "Tencent's next-generation frontier foundation model delivering extraordinary token throughput, bilingual reasoning, and autonomous agent capabilities across large contexts.",
    strengths: [
      'Top-ranked model by token volume on OpenRouter with over 14T weekly processed tokens',
      '1,048,576 token context window with reliable long-sequence retrieval',
      'High-throughput inference with fast response generation',
      'Adaptive reasoning depth with multiple effort levels',
    ],
    weaknesses: [
      'Higher output token price ($2.50/1M) relative to lightweight flash tiers',
      'Preview checkpoint subject to continuous tuning updates',
    ],
    tags: [
      'Frontier',
      'OpenRouter #1',
      'Reasoning',
      'Large context',
      'Agentic',
    ],
    reasoningEffort: ['none', 'low', 'high'],
    defaultEffort: 'high',
    speedTokensPerSec: 145,
  },
];
