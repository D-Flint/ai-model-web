import type { CanonicalModelConfig } from '../../pipeline/types';

export const NVIDIA_MODELS: CanonicalModelConfig[] = [
  {
    slug: 'nemotron-3-ultra-550b',
    name: 'Nemotron 3 Ultra 550B',
    provider: 'NVIDIA',
    providerSlug: 'nvidia',
    family: 'Nemotron',
    openWeights: true,
    openRouterId: 'nvidia/nemotron-3-ultra-550b',
    lmarenaAliases: ['nemotron-3-ultra-550b-a55b', 'nemotron-3-ultra-550b'],
    swebenchAliases: ['nemotron-3-ultra-550b-a55b', 'nemotron-3-ultra-550b'],
    livebenchAliases: ['nemotron-3-ultra-550b-a55b', 'nemotron-3-ultra-550b'],
    bfclAliases: ['nemotron-3-ultra-550b-a55b', 'nemotron-3-ultra-550b'],
    officialDocsUrl: 'https://build.nvidia.com/',
    description:
      "NVIDIA's massive 550B frontier MoE foundation model, optimized for accelerated GPU clusters and enterprise reasoning.",
    strengths: [
      'Extreme scale MoE architecture with deep world knowledge',
      'Optimized for TensorRT-LLM cluster deployment',
      'Strong mathematical and synthetic data reasoning',
    ],
    weaknesses: [
      'Requires enterprise-scale multi-node infrastructure for local hosting',
    ],
    tags: ['MoE', 'Flagship', 'Reasoning', 'Open weights'],
    reasoningEffort: ['none', 'medium'],
    defaultEffort: 'none',
  },
];
