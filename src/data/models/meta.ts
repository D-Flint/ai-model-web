import type { CanonicalModelConfig } from '../../pipeline/types';

export const META_MODELS: CanonicalModelConfig[] = [
  {
    slug: 'llama-3-2-90b-vision-instruct',
    name: 'Llama 3.2 90B Vision Instruct',
    provider: 'Meta AI',
    providerSlug: 'meta',
    family: 'Llama 3.2',
    openWeights: true,
    openRouterId: 'meta-llama/llama-3.2-90b-vision-instruct',
    lmarenaAliases: [
      'llama-3.2-90b-vision-instruct',
      'meta-llama/llama-3.2-90b-vision-instruct',
    ],
    swebenchAliases: [
      'Llama-3.2-90B-Vision-Instruct',
      'llama-3.2-90b-vision-instruct',
    ],
    livebenchAliases: [
      'Llama-3.2-90B-Vision-Instruct',
      'llama-3.2-90b-vision-instruct',
    ],
    bfclAliases: [
      'Llama-3.2-90B-Vision-Instruct',
      'llama-3.2-90b-vision-instruct',
    ],
    officialDocsUrl:
      'https://ai.meta.com/blog/llama-3-2-connect-2024-vision-edge-mobile-devices/',
    description:
      "Meta's flagship open multimodal model, integrating visual recognition with Llama 3 language capabilities for document reasoning and visual question answering.",
    strengths: [
      'High-quality visual recognition, chart reading, and image grounding',
      '131,072 token context window with open model weights',
      'Cost-effective hosting rates across public cloud endpoints ($0.70/1M)',
    ],
    weaknesses: [
      'Lower code generation accuracy compared to dedicated coding models',
      'Text outputs capped at 8,192 tokens per response',
    ],
    tags: ['Vision', 'Multimodal', 'Open weights', 'Research'],
    reasoningEffort: ['none'],
    defaultEffort: 'none',
  },
  {
    slug: 'llama-3-3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    provider: 'Meta AI',
    providerSlug: 'meta',
    family: 'Llama 3.3',
    openWeights: true,
    openRouterId: 'meta-llama/llama-3.3-70b-instruct',
    lmarenaAliases: [
      'llama-3.3-70b-instruct',
      'meta-llama/llama-3.3-70b-instruct',
      'llama-3-3-70b',
    ],
    swebenchAliases: [
      'Llama-3.3-70B-Instruct',
      'llama-3.3-70b-instruct',
      'Meta: Llama 3.3 70B',
    ],
    livebenchAliases: ['Llama-3.3-70B-Instruct', 'llama-3.3-70b-instruct'],
    bfclAliases: ['Llama-3.3-70B-Instruct', 'llama-3.3-70b-instruct'],
    officialDocsUrl: 'https://ai.meta.com/blog/llama-3-3/',
    description:
      "Meta's premier 70B open-weights model, delivering capabilities comparable to the earlier 405B flagship with significantly reduced deployment requirements.",
    strengths: [
      'Industry-standard open weights with extensive community and fine-tuning support',
      '128,000 token context window with strong instruction following',
      'Easily deployable on dual high-end consumer or enterprise GPUs',
    ],
    weaknesses: [
      'Text-only model without vision processing',
      'Lower code generation depth than specialized coding frontier models',
    ],
    tags: ['Open weights', 'Daily use', 'Research', 'Best value'],
    reasoningEffort: ['none'],
    defaultEffort: 'none',
  },
  {
    slug: 'llama-3-2-11b-vision-instruct',
    name: 'Llama 3.2 11B Vision Instruct',
    provider: 'Meta AI',
    providerSlug: 'meta',
    family: 'Llama 3.2',
    openWeights: true,
    openRouterId: 'meta-llama/llama-3.2-11b-vision-instruct',
    lmarenaAliases: [
      'llama-3.2-11b-vision-instruct',
      'meta-llama/llama-3.2-11b-vision-instruct',
    ],
    swebenchAliases: [
      'llama-3.2-11b-vision-instruct',
      'Llama-3.2-11B-Vision-Instruct',
    ],
    livebenchAliases: [
      'llama-3.2-11b-vision-instruct',
      'Llama-3.2-11B-Vision-Instruct',
    ],
    bfclAliases: [
      'llama-3.2-11b-vision-instruct',
      'Llama-3.2-11B-Vision-Instruct',
    ],
    officialDocsUrl:
      'https://ai.meta.com/blog/llama-3-2-connect-2024-vision-edge-mobile-devices/',
    description:
      "Meta's lightweight open multimodal model designed for visual reasoning, document understanding, and image description that easily deploys on consumer hardware.",
    strengths: [
      'Open multimodal weights with permissive community license',
      '128,000 token context window with image and document comprehension',
      'Extremely economical cloud hosting pricing ($0.16 / $0.16 per 1M tokens)',
      'Fits comfortably on a single 24GB consumer GPU (RTX 3090/4090)',
    ],
    weaknesses: [
      'Lower complex reasoning and coding scores than 90B or frontier models',
      'Output generation capped at 8,192 tokens',
    ],
    tags: ['Vision', 'Multimodal', 'Open weights', 'Best value'],
    reasoningEffort: ['none'],
    defaultEffort: 'none',
  },
  {
    slug: 'llama-3-2-3b-instruct',
    name: 'Llama 3.2 3B Instruct',
    provider: 'Meta AI',
    providerSlug: 'meta',
    family: 'Llama 3.2',
    openWeights: true,
    openRouterId: 'meta-llama/llama-3.2-3b-instruct',
    lmarenaAliases: [
      'llama-3.2-3b-instruct',
      'llama-3.2-3b',
      'meta-llama/llama-3.2-3b-instruct',
    ],
    swebenchAliases: ['llama-3.2-3b-instruct', 'Llama-3.2-3B-Instruct'],
    livebenchAliases: ['llama-3.2-3b-instruct', 'Llama-3.2-3B-Instruct'],
    bfclAliases: ['llama-3.2-3b-instruct', 'Llama-3.2-3B-Instruct'],
    officialDocsUrl:
      'https://ai.meta.com/blog/llama-3-2-connect-2024-vision-edge-mobile-devices/',
    description:
      "Meta's highly efficient open-weights 3B model optimized for on-device edge AI, summarization, tool calling, and interactive personal computing.",
    strengths: [
      'Lightweight open weights deployable on smartphones, laptops, and edge devices',
      '128,000 token context window',
      'Extremely cheap hosting ($0.05 input / $0.05 output per 1M tokens)',
      'State-of-the-art performance for sub-5B open architectures',
    ],
    weaknesses: [
      'Text only; lacks visual and audio comprehension',
      'Not suitable for high-difficulty coding or multi-hop logical deductions',
    ],
    tags: ['Open weights', 'Best value', 'Speed', 'Fast'],
    reasoningEffort: ['none'],
    defaultEffort: 'none',
  },
  {
    slug: 'llama-3-2-1b-instruct',
    name: 'Llama 3.2 1B Instruct',
    provider: 'Meta AI',
    providerSlug: 'meta',
    family: 'Llama 3.2',
    openWeights: true,
    openRouterId: 'meta-llama/llama-3.2-1b-instruct',
    lmarenaAliases: [
      'llama-3.2-1b-instruct',
      'llama-3.2-1b',
      'meta-llama/llama-3.2-1b-instruct',
    ],
    swebenchAliases: ['llama-3.2-1b-instruct', 'Llama-3.2-1B-Instruct'],
    livebenchAliases: ['llama-3.2-1b-instruct', 'Llama-3.2-1B-Instruct'],
    bfclAliases: ['llama-3.2-1b-instruct', 'Llama-3.2-1B-Instruct'],
    officialDocsUrl:
      'https://ai.meta.com/blog/llama-3-2-connect-2024-vision-edge-mobile-devices/',
    description:
      "Meta's ultra-lightweight 1B parameter open-weights model designed for embedded systems, mobile on-device NLP, and real-time text classification.",
    strengths: [
      'Featherweight footprint (fits in <1.5 GB memory with 4-bit quantization)',
      '128,000 token context window',
      'Near-instantaneous first-token latency on edge hardware',
      'Permissive open-weights community license',
    ],
    weaknesses: [
      'Text only; basic reasoning capabilities',
      'Prone to hallucination on complex multi-step technical instructions',
    ],
    tags: ['Open weights', 'Speed', 'Fast', 'Best value'],
    reasoningEffort: ['none'],
    defaultEffort: 'none',
  },
];
