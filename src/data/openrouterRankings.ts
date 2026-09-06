import type { CatalogModel } from '../lib/catalogSchema';

export interface OpenRouterModelRanking {
  rank: number;
  openRouterId: string;
  slug: string;
  name: string;
  provider: string;
  tokensProcessed: string;
  growth?: string;
  category?: string;
}

export const OPENROUTER_METADATA = {
  source: 'OpenRouter (openrouter.ai/rankings)',
  url: 'https://openrouter.ai/rankings',
  retrievedAt: '2026-09-05',
  metric: 'Tokens processed through OpenRouter API (prompt + completion)',
  description:
    'Live rankings by real-world usage. Models are ranked by tokens processed through the OpenRouter API by millions of developers.',
};

/**
 * Top models ranked by real-world token usage on OpenRouter.
 * Sourced directly from https://openrouter.ai/rankings
 */
export const OPENROUTER_TOP_MODELS: OpenRouterModelRanking[] = [
  {
    rank: 1,
    openRouterId: 'tencent/hy4-preview',
    slug: 'hy4-preview',
    name: 'Hy4 preview',
    provider: 'Tencent',
    tokensProcessed: '14.1T tokens',
    growth: '+639%',
    category: 'Flagship Multimodal',
  },
  {
    rank: 2,
    openRouterId: 'z-ai/glm-5.3-flash',
    slug: 'glm-5-3-flash',
    name: 'GLM 5.3 Flash',
    provider: 'Z.ai',
    tokensProcessed: '12.5T tokens',
    growth: '+170%',
    category: 'High-Speed Multimodal',
  },
  {
    rank: 3,
    openRouterId: 'deepseek/deepseek-v4-flash-0731',
    slug: 'deepseek-v4-flash-0731',
    name: 'DeepSeek V4 Flash 0731',
    provider: 'DeepSeek',
    tokensProcessed: '12.3T tokens',
    growth: '0%',
    category: 'MoE Reasoning & Coding',
  },
  {
    rank: 4,
    openRouterId: 'openai/gpt-5.6-luna',
    slug: 'gpt-5-6-luna',
    name: 'GPT-5.6 Luna',
    provider: 'OpenAI',
    tokensProcessed: '12.2T tokens',
    growth: '+80%',
    category: 'High-Efficiency Agentic',
  },
  {
    rank: 5,
    openRouterId: 'minimax/minimax-m3:free',
    slug: 'minimax-m3',
    name: 'MiniMax M3',
    provider: 'MiniMax',
    tokensProcessed: '5.56T tokens',
    growth: '+206%',
    category: 'Multimodal MoE',
  },
  {
    rank: 6,
    openRouterId: 'deepseek/deepseek-v4-flash',
    slug: 'deepseek-v4-flash',
    name: 'DeepSeek V4 Flash 0423',
    provider: 'DeepSeek',
    tokensProcessed: '5.24T tokens',
    growth: '+3%',
    category: 'MoE Foundation',
  },
  {
    rank: 7,
    openRouterId: 'tencent/hy3',
    slug: 'hy3',
    name: 'Hy3',
    provider: 'Tencent',
    tokensProcessed: '4.44T tokens',
    growth: '+33%',
    category: 'General NLP',
  },
  {
    rank: 8,
    openRouterId: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    slug: 'nemotron-3-ultra',
    name: 'Nemotron 3 Ultra',
    provider: 'Nvidia',
    tokensProcessed: '3.65T tokens',
    growth: '+35%',
    category: 'Enterprise Reasoning',
  },
  {
    rank: 9,
    openRouterId: 'z-ai/glm-5.3',
    slug: 'glm-5-3',
    name: 'GLM 5.3',
    provider: 'Z.ai',
    tokensProcessed: '2.81T tokens',
    growth: '+127%',
    category: 'Dense Reasoning',
  },
  {
    rank: 10,
    openRouterId: 'xiaomi/mimo-v2.5',
    slug: 'mimo-v2-5',
    name: 'MiMo-V2.5',
    provider: 'Xiaomi',
    tokensProcessed: '2.76T tokens',
    growth: '+72%',
    category: 'Device & Edge Agents',
  },
  {
    rank: 11,
    openRouterId: 'z-ai/glm-5.2',
    slug: 'glm-5-2',
    name: 'GLM 5.2',
    provider: 'Z.ai',
    tokensProcessed: '2.3T tokens',
    growth: '+26%',
    category: 'Bilingual Synthesis',
  },
  {
    rank: 12,
    openRouterId: 'google/gemini-3.7-flash',
    slug: 'gemini-3-7-flash',
    name: 'Gemini 3.7 Flash',
    provider: 'Google DeepMind',
    tokensProcessed: '2.26T tokens',
    growth: '+44%',
    category: 'Multimodal Flash',
  },
  {
    rank: 13,
    openRouterId: 'moonshotai/kimi-k3',
    slug: 'kimi-k3',
    name: 'Kimi K3',
    provider: 'Moonshot AI',
    tokensProcessed: '2.03T tokens',
    growth: '+35%',
    category: 'Long-Context Reasoning',
  },
  {
    rank: 14,
    openRouterId: 'openai/gpt-5.6-sol',
    slug: 'gpt-5-6-sol',
    name: 'GPT-5.6 Sol',
    provider: 'OpenAI',
    tokensProcessed: '1.87T tokens',
    growth: '+8%',
    category: 'Flagship Reasoning',
  },
  {
    rank: 15,
    openRouterId: 'anthropic/claude-opus-5',
    slug: 'claude-opus-5',
    name: 'Claude Opus 5',
    provider: 'Anthropic',
    tokensProcessed: '1.66T tokens',
    growth: '+11%',
    category: 'Frontier Intelligence',
  },
  {
    rank: 16,
    openRouterId: 'minimax/minimax-m3',
    slug: 'minimax-m3',
    name: 'MiniMax M3 (Paid)',
    provider: 'MiniMax',
    tokensProcessed: '1.47T tokens',
    growth: '+2%',
    category: 'Dedicated Inference',
  },
  {
    rank: 17,
    openRouterId: 'poolside/laguna-s-2.1:free',
    slug: 'laguna-s-2-1',
    name: 'Laguna S 2.1',
    provider: 'Poolside',
    tokensProcessed: '1.35T tokens',
    growth: '+1%',
    category: 'Code Generation',
  },
  {
    rank: 18,
    openRouterId: 'deepseek/deepseek-v4-pro',
    slug: 'deepseek-v4-pro',
    name: 'DeepSeek V4 Pro 0423',
    provider: 'DeepSeek',
    tokensProcessed: '1.33T tokens',
    growth: '+28%',
    category: 'Frontier Open Weights',
  },
  {
    rank: 19,
    openRouterId: 'anthropic/claude-sonnet-5',
    slug: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'Anthropic',
    tokensProcessed: '1.31T tokens',
    growth: '+10%',
    category: 'Enterprise Coding & Agents',
  },
  {
    rank: 20,
    openRouterId: 'nvidia/nemotron-3.5-lightning:free',
    slug: 'nemotron-3-5-lightning',
    name: 'Nemotron 3.5 Lightning',
    provider: 'Nvidia',
    tokensProcessed: '1.1T tokens',
    growth: '+22%',
    category: 'High-Throughput Serving',
  },
];

export interface FeaturedOpenRouterModel {
  model: CatalogModel;
  ranking: OpenRouterModelRanking;
  badge: string;
}

/**
 * Returns models from the catalog that match the top OpenRouter usage rankings,
 * preserving exact leaderboard rank order.
 */
export function getMostUsedOpenRouterModels(
  catalogModels: CatalogModel[],
  limit = 4,
): FeaturedOpenRouterModel[] {
  const results: FeaturedOpenRouterModel[] = [];
  const seenSlugs = new Set<string>();

  for (const item of OPENROUTER_TOP_MODELS) {
    const found = catalogModels.find(
      (m) =>
        m.slug === item.slug ||
        m.name.toLowerCase() === item.name.toLowerCase() ||
        m.sources?.some((s) => s.url?.includes(item.openRouterId.replace(':free', ''))),
    );

    if (found && !seenSlugs.has(found.slug)) {
      seenSlugs.add(found.slug);
      results.push({
        model: found,
        ranking: item,
        badge: `#${item.rank} · ${item.tokensProcessed}`,
      });

      if (results.length >= limit) {
        break;
      }
    }
  }

  return results;
}
