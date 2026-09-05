import type { CanonicalModelConfig } from '../pipeline/types';
import { OPENAI_MODELS } from './models/openai';
import { ANTHROPIC_MODELS } from './models/anthropic';
import { GOOGLE_MODELS } from './models/google';
import { DEEPSEEK_MODELS } from './models/deepseek';
import { META_MODELS } from './models/meta';
import { MISTRAL_MODELS } from './models/mistral';
import { QWEN_MODELS } from './models/qwen';
import { XAI_MODELS } from './models/xai';
import { AMAZON_MODELS } from './models/amazon';
import { COHERE_MODELS } from './models/cohere';

export {
  OPENAI_MODELS,
  ANTHROPIC_MODELS,
  GOOGLE_MODELS,
  DEEPSEEK_MODELS,
  META_MODELS,
  MISTRAL_MODELS,
  QWEN_MODELS,
  XAI_MODELS,
  AMAZON_MODELS,
  COHERE_MODELS,
};

export const PROVIDERS_CONFIG = [
  {
    id: 'provider-openai',
    slug: 'openai',
    name: 'OpenAI',
    website: 'https://openai.com',
    description:
      'Pioneering frontier research laboratory and creator of GPT and reasoning models.',
  },
  {
    id: 'provider-anthropic',
    slug: 'anthropic',
    name: 'Anthropic',
    website: 'https://anthropic.com',
    description:
      'AI safety and research company behind the Claude family of models.',
  },
  {
    id: 'provider-google',
    slug: 'google',
    name: 'Google DeepMind',
    website: 'https://deepmind.google',
    description: 'Google AI division developing Gemini multimodal models.',
  },
  {
    id: 'provider-deepseek',
    slug: 'deepseek',
    name: 'DeepSeek',
    website: 'https://deepseek.com',
    description:
      'Open research lab creating high-performance open-weights foundation models.',
  },
  {
    id: 'provider-meta',
    slug: 'meta',
    name: 'Meta AI',
    website: 'https://ai.meta.com',
    description:
      'Meta open-source AI division creator of the Llama model family.',
  },
  {
    id: 'provider-mistral',
    slug: 'mistral',
    name: 'Mistral AI',
    website: 'https://mistral.ai',
    description:
      'European AI research laboratory developing efficient and frontier models.',
  },
  {
    id: 'provider-qwen',
    slug: 'qwen',
    name: 'Alibaba Cloud / Qwen',
    website: 'https://qwenlm.github.io',
    description:
      'Alibaba Cloud AI team building the Qwen series of open foundation models.',
  },
  {
    id: 'provider-xai',
    slug: 'xai',
    name: 'xAI',
    website: 'https://x.ai',
    description:
      'AI company developing the Grok series of frontier models and vision systems.',
  },
  {
    id: 'provider-amazon',
    slug: 'amazon',
    name: 'Amazon AWS',
    website: 'https://aws.amazon.com/bedrock/nova',
    description:
      'Amazon AWS frontier foundation models built for enterprise speed, cost efficiency, and multimodal intelligence.',
  },
  {
    id: 'provider-cohere',
    slug: 'cohere',
    name: 'Cohere',
    website: 'https://cohere.com',
    description:
      'Enterprise AI platform pioneering command, reasoning, and high-accuracy retrieval-augmented generation.',
  },
];

export const CANONICAL_MODELS: CanonicalModelConfig[] = [
  ...OPENAI_MODELS,
  ...ANTHROPIC_MODELS,
  ...GOOGLE_MODELS,
  ...DEEPSEEK_MODELS,
  ...META_MODELS,
  ...MISTRAL_MODELS,
  ...QWEN_MODELS,
  ...XAI_MODELS,
  ...AMAZON_MODELS,
  ...COHERE_MODELS,
];
