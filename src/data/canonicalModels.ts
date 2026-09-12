import type { CanonicalModelConfig } from '../pipeline/types';
import { OPENAI_MODELS } from './models/openai';
import { ANTHROPIC_MODELS } from './models/anthropic';
import { GOOGLE_MODELS } from './models/google';
import { DEEPSEEK_MODELS } from './models/deepseek';
import { META_MODELS } from './models/meta';
import { MISTRAL_MODELS } from './models/mistral';
import { XAI_MODELS } from './models/xai';
import { AMAZON_MODELS } from './models/amazon';
import { COHERE_MODELS } from './models/cohere';
import { MOONSHOT_MODELS } from './models/moonshot';
import { MINIMAX_MODELS } from './models/minimax';
import { TENCENT_MODELS } from './models/tencent';
import { ZAI_MODELS } from './models/zai';
import { QWEN_MODELS } from './models/qwen';
import { ABACUS_MODELS } from './models/abacus';
import { NVIDIA_MODELS } from './models/nvidia';
import { FRONTIER_MODELS } from './models/frontier';
import { knownModelRoles } from './modelRoles';

export {
  OPENAI_MODELS,
  ANTHROPIC_MODELS,
  GOOGLE_MODELS,
  DEEPSEEK_MODELS,
  META_MODELS,
  MISTRAL_MODELS,
  XAI_MODELS,
  AMAZON_MODELS,
  COHERE_MODELS,
  MOONSHOT_MODELS,
  MINIMAX_MODELS,
  TENCENT_MODELS,
  ZAI_MODELS,
  QWEN_MODELS,
  ABACUS_MODELS,
  NVIDIA_MODELS,
  FRONTIER_MODELS,
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
  {
    id: 'provider-moonshot',
    slug: 'moonshot',
    name: 'Moonshot AI',
    website: 'https://www.moonshot.ai',
    description:
      'Pioneering AI research laboratory and creator of the Kimi and Moonlight long-context reasoning models.',
  },
  {
    id: 'provider-minimax',
    slug: 'minimax',
    name: 'MiniMax',
    website: 'https://www.minimax.io',
    description:
      'Pioneering AI research company developing linear attention MoE foundation models, reasoning architectures, and generative agents.',
  },
  {
    id: 'provider-tencent',
    slug: 'tencent',
    name: 'Tencent',
    website: 'https://hunyuan.tencent.com',
    description:
      'Tencent AI lab creator of the Hunyuan (Hy) family of large-scale foundation and multimodal models.',
  },
  {
    id: 'provider-zai',
    slug: 'z-ai',
    name: 'Z.ai',
    website: 'https://z.ai',
    description:
      'Zhipu AI research enterprise developing the GLM series of multimodal foundation and agentic models.',
  },
  {
    id: 'provider-qwen',
    slug: 'qwen',
    name: 'Alibaba Cloud / Qwen',
    website: 'https://qwenlm.github.io',
    description:
      'Alibaba Cloud open and proprietary foundation models with leading STEM and coding capabilities.',
  },
  {
    id: 'provider-abacus',
    slug: 'abacus',
    name: 'Abacus AI',
    website: 'https://abacus.ai',
    description:
      'Autonomous AI company behind the agent-specialized Smaug foundation models.',
  },
  {
    id: 'provider-nvidia',
    slug: 'nvidia',
    name: 'NVIDIA',
    website: 'https://build.nvidia.com',
    description:
      'Accelerated computing pioneer developing extreme-scale open-weight foundation models.',
  },
];

const canonicalModels: CanonicalModelConfig[] = [
  ...OPENAI_MODELS,
  ...ANTHROPIC_MODELS,
  ...GOOGLE_MODELS,
  ...DEEPSEEK_MODELS,
  ...META_MODELS,
  ...MISTRAL_MODELS,
  ...XAI_MODELS,
  ...AMAZON_MODELS,
  ...COHERE_MODELS,
  ...MOONSHOT_MODELS,
  ...MINIMAX_MODELS,
  ...TENCENT_MODELS,
  ...ZAI_MODELS,
  ...QWEN_MODELS,
  ...ABACUS_MODELS,
  ...NVIDIA_MODELS,
  ...FRONTIER_MODELS,
];

export const CANONICAL_MODELS: CanonicalModelConfig[] = canonicalModels.map(
  (model) => ({
    ...model,
    roles: model.roles ?? knownModelRoles[model.slug],
  }),
);
