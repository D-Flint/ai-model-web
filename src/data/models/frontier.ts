import type { CanonicalModelConfig } from '../../pipeline/types';

export const FRONTIER_MODELS: CanonicalModelConfig[] = [
  {
    slug: 'inkling',
    name: 'Inkling',
    provider: 'Inkling AI',
    providerSlug: 'inkling',
    family: 'Inkling',
    openWeights: false,
    openRouterId: 'inkling/inkling',
    lmarenaAliases: ['inkling-xhigh', 'inkling'],
    swebenchAliases: ['inkling-xhigh', 'inkling'],
    livebenchAliases: ['inkling-xhigh', 'inkling'],
    bfclAliases: ['inkling-xhigh', 'inkling'],
    officialDocsUrl: 'https://livebench.ai/',
    description:
      'Novel reasoning architecture evaluated on LiveBench featuring deep reflection and rigorous logic chains.',
    strengths: [
      'High reasoning depth on symbolic logic and math',
      'Reflective chain-of-thought verification',
    ],
    weaknesses: ['Extended latency on complex reasoning paths'],
    tags: ['Reasoning', 'STEM'],
    reasoningEffort: ['high', 'max'],
    defaultEffort: 'max',
  },
  {
    slug: 'ox-alpha',
    name: 'Ox Alpha',
    provider: 'Ox Labs',
    providerSlug: 'ox',
    family: 'Ox',
    openWeights: false,
    openRouterId: 'ox/ox-alpha',
    lmarenaAliases: ['ox-alpha-max', 'ox-alpha'],
    swebenchAliases: ['ox-alpha-max', 'ox-alpha'],
    livebenchAliases: ['ox-alpha-max', 'ox-alpha'],
    bfclAliases: ['ox-alpha-max', 'ox-alpha'],
    officialDocsUrl: 'https://livebench.ai/',
    description:
      'Experimental frontier research model designed for high-precision autonomous code planning and validation.',
    strengths: [
      'Strong autonomous coding plan generation',
      'Careful multi-step validation',
    ],
    weaknesses: ['Preview access research model'],
    tags: ['Coding', 'Reasoning', 'Experimental'],
    reasoningEffort: ['max'],
    defaultEffort: 'max',
  },
];
