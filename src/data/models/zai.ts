import type { CanonicalModelConfig } from '../../pipeline/types';

export const ZAI_MODELS: CanonicalModelConfig[] = [
  {
    slug: 'glm-5-3-flash',
    name: 'GLM 5.3 Flash',
    provider: 'Z.ai',
    providerSlug: 'z-ai',
    family: 'GLM',
    openWeights: true,
    openRouterId: 'z-ai/glm-5.3-flash',
    lmarenaAliases: ['z-ai/glm-5.3-flash', 'glm-5.3-flash', 'GLM-5.3-Flash'],
    swebenchAliases: ['glm-5.3-flash', 'Z.ai: GLM 5.3 Flash'],
    livebenchAliases: ['glm-5.3-flash'],
    bfclAliases: ['glm-5.3-flash'],
    officialDocsUrl: 'https://z.ai/',
    description:
      "Z.ai's native multimodal model engineered for ultra-fast coding, high-volume agent workflows, and cost-efficient long-horizon execution.",
    strengths: [
      'Ranked #2 on OpenRouter with over 12.5T tokens processed weekly',
      'Ultra-competitive pricing ($0.075/1M input, $0.25/1M output)',
      '1,310,720 token context length with hybrid sparse attention',
      'Native multimodal support across text, image, and video inputs',
    ],
    weaknesses: [
      'Reasoning is mandatory on complex mathematical queries',
      'Slightly lower general reasoning depth than top-tier flagship frontier models',
    ],
    tags: [
      'High speed',
      'Ultra cheap',
      'OpenRouter #2',
      'Multimodal',
      'Coding',
    ],
    reasoningEffort: ['low', 'high', 'max'],
    defaultEffort: 'max',
    speedTokensPerSec: 165,
  },
];
