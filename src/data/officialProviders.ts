import type { OfficialProviderSpec } from '../pipeline/types';
import {
  apiPricingSchema,
  type ApiPricing,
  type PriceValue,
  type PricingTier,
} from '../lib/apiPricingSchema';
import type { CatalogModel } from '../lib/catalogSchema';

export const OFFICIAL_PROVIDER_SPECS: Record<string, OfficialProviderSpec> = {
  'gpt-6-astra': {
    slug: 'gpt-6-astra',
    releaseDate: '2026-09-02',
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    supportsVision: true,
    supportsAudio: true,
    supportsTools: true,
    supportsStructuredOutput: true,
    apiAvailable: true,
    officialPricing: {
      input: 10,
      output: 50,
      cached: 1,
    },
    reasoningEffort: ['low', 'medium', 'high', 'max'],
    defaultEffort: 'medium',
    lastVerifiedAt: '2026-09-14',
    sourceUrl: 'https://developers.openai.com/api/docs/pricing',
    sourceName: 'OpenAI Official Documentation',
  },
  'claude-fable-5-1': {
    slug: 'claude-fable-5-1',
    releaseDate: '2026-06-15',
    contextWindow: 1000000,
    maxOutputTokens: 128000,
    supportsVision: true,
    supportsAudio: false,
    supportsTools: true,
    supportsStructuredOutput: true,
    apiAvailable: true,
    officialPricing: {
      input: 10,
      output: 50,
      cached: 0.25,
    },
    reasoningEffort: ['none', 'low', 'medium', 'high', 'max'],
    defaultEffort: 'high',
    lastVerifiedAt: '2026-09-06',
    sourceUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
    sourceName: 'Anthropic Official Documentation',
  },
  'gemini-3-8-flash': {
    slug: 'gemini-3-8-flash',
    releaseDate: '2026-08-20',
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    supportsVision: true,
    supportsAudio: true,
    supportsTools: true,
    supportsStructuredOutput: true,
    apiAvailable: true,
    officialPricing: {
      input: 0.75,
      output: 3.75,
      cached: 0.075,
    },
    reasoningEffort: ['none', 'low', 'medium', 'high'],
    defaultEffort: 'medium',
    lastVerifiedAt: '2026-09-09',
    sourceUrl: 'https://ai.google.dev/pricing',
    sourceName: 'Google AI Developer Documentation',
  },
  'deepseek-v4-1-flash': {
    slug: 'deepseek-v4-1-flash',
    releaseDate: '2026-09-10',
    contextWindow: 1048576,
    maxOutputTokens: 262144,
    supportsVision: true,
    supportsAudio: false,
    supportsTools: true,
    supportsStructuredOutput: true,
    apiAvailable: true,
    officialPricing: {
      input: 0.15,
      output: 0.6,
      cached: 0.003,
    },
    reasoningEffort: ['low', 'medium', 'high', 'max'],
    defaultEffort: 'medium',
    lastVerifiedAt: '2026-09-12',
    sourceUrl: 'https://api-docs.deepseek.com/quick_start/pricing',
    sourceName: 'DeepSeek API pricing',
  },
  'muse-spark-1-3': {
    slug: 'muse-spark-1-3',
    releaseDate: '2026-06-25',
    contextWindow: 262144,
    maxOutputTokens: 16384,
    supportsVision: false,
    supportsAudio: false,
    supportsTools: true,
    supportsStructuredOutput: true,
    apiAvailable: true,
    officialPricing: {
      input: 1.25,
      output: 4.25,
      cached: 0.15,
    },
    reasoningEffort: ['none', 'low', 'medium', 'high', 'max'],
    defaultEffort: 'high',
    lastVerifiedAt: '2026-09-14',
    sourceUrl: 'https://ai.meta.com/llama/',
    sourceName: 'Meta AI Official Documentation',
  },
  'grok-4-6': {
    slug: 'grok-4-6',
    releaseDate: '2026-06-15',
    contextWindow: 524288,
    maxOutputTokens: 32768,
    supportsVision: true,
    supportsAudio: false,
    supportsTools: true,
    supportsStructuredOutput: true,
    apiAvailable: true,
    officialPricing: {
      input: 8,
      output: 32,
      cached: 2,
    },
    reasoningEffort: ['none', 'medium', 'high'],
    defaultEffort: 'medium',
    lastVerifiedAt: '2026-06-25',
    sourceUrl: 'https://docs.x.ai/docs/overview#models',
    sourceName: 'xAI Official Documentation',
  },
  'amazon-nova-pro': {
    slug: 'amazon-nova-pro',
    releaseDate: '2024-12-03',
    contextWindow: 300000,
    maxOutputTokens: 5000,
    supportsVision: true,
    supportsAudio: false,
    supportsTools: true,
    supportsStructuredOutput: true,
    apiAvailable: true,
    officialPricing: {
      input: 0.8,
      output: 3.2,
      cached: 0.2,
    },
    reasoningEffort: ['none'],
    defaultEffort: 'none',
    lastVerifiedAt: '2026-09-05',
    sourceUrl: 'https://aws.amazon.com/bedrock/nova/',
    sourceName: 'Amazon AWS Bedrock Official Documentation',
  },
  'command-r7b-12-2024': {
    slug: 'command-r7b-12-2024',
    releaseDate: '2024-12-10',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsVision: false,
    supportsAudio: false,
    supportsTools: true,
    supportsStructuredOutput: true,
    apiAvailable: true,
    officialPricing: {
      input: 0.0375,
      output: 0.15,
      cached: null,
    },
    reasoningEffort: ['none'],
    defaultEffort: 'none',
    lastVerifiedAt: '2026-09-05',
    sourceUrl: 'https://docs.cohere.com/docs/models',
    sourceName: 'Cohere Official Documentation',
  },
  'kimi-k3': {
    slug: 'kimi-k3',
    releaseDate: '2026-07-15',
    contextWindow: 1000000,
    maxOutputTokens: 65536,
    supportsVision: true,
    supportsAudio: false,
    supportsTools: true,
    supportsStructuredOutput: true,
    apiAvailable: true,
    officialPricing: {
      input: 3.0,
      output: 15.0,
      cached: 0.3,
    },
    speedTokensPerSec: 58,
    reasoningEffort: ['none', 'low', 'medium', 'high'],
    defaultEffort: 'medium',
    lastVerifiedAt: '2026-09-14',
    sourceUrl: 'https://platform.kimi.ai/',
    sourceName: 'Moonshot AI Official Documentation',
  },
  'minimax-m3': {
    slug: 'minimax-m3',
    releaseDate: '2026-06-15',
    contextWindow: 1048576,
    maxOutputTokens: 262144,
    supportsVision: true,
    supportsAudio: false,
    supportsTools: true,
    supportsStructuredOutput: true,
    apiAvailable: true,
    officialPricing: {
      input: 0.3,
      output: 1.2,
      cached: 0.15,
    },
    speedTokensPerSec: 75,
    reasoningEffort: ['none', 'low', 'medium', 'high'],
    defaultEffort: 'medium',
    lastVerifiedAt: '2026-09-06',
    sourceUrl: 'https://www.minimax.io/',
    sourceName: 'MiniMax Official Documentation',
  },
  'qwen-3-8-max': {
    slug: 'qwen-3-8-max',
    releaseDate: '2026-06-18',
    contextWindow: 524288,
    maxOutputTokens: 32768,
    supportsVision: true,
    supportsAudio: false,
    supportsTools: true,
    supportsStructuredOutput: true,
    apiAvailable: true,
    officialPricing: {
      input: 2.4,
      output: 9.6,
      cached: 0.6,
    },
    reasoningEffort: ['none', 'low', 'medium', 'high'],
    defaultEffort: 'high',
    lastVerifiedAt: '2026-06-25',
    sourceUrl:
      'https://help.aliyun.com/zh/model-studio/developer-reference/what-is-qwen-llm',
    sourceName: 'Alibaba Cloud Model Studio',
  },
  'smaug-agentic': {
    slug: 'smaug-agentic',
    releaseDate: '2026-06-08',
    contextWindow: 262144,
    maxOutputTokens: 16384,
    supportsVision: false,
    supportsAudio: false,
    supportsTools: true,
    supportsStructuredOutput: true,
    apiAvailable: true,
    officialPricing: {
      input: 0.9,
      output: 3.6,
      cached: 0.22,
    },
    reasoningEffort: ['none', 'medium', 'high'],
    defaultEffort: 'medium',
    lastVerifiedAt: '2026-06-25',
    sourceUrl: 'https://abacus.ai/',
    sourceName: 'Abacus AI Documentation',
  },
  'nemotron-3-ultra-550b': {
    slug: 'nemotron-3-ultra-550b',
    releaseDate: '2026-05-28',
    contextWindow: 262144,
    maxOutputTokens: 16384,
    supportsVision: false,
    supportsAudio: false,
    supportsTools: true,
    supportsStructuredOutput: true,
    apiAvailable: true,
    officialPricing: {
      input: null,
      output: null,
      cached: null,
    },
    reasoningEffort: ['none', 'medium'],
    defaultEffort: 'none',
    lastVerifiedAt: '2026-09-14',
    sourceUrl:
      'https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b?nim=hosted',
    sourceName: 'NVIDIA NIM model availability',
  },
  'mistral-small-4': {
    slug: 'mistral-small-4',
    releaseDate: '2026-04-18',
    contextWindow: 131072,
    maxOutputTokens: 16384,
    supportsVision: true,
    supportsAudio: false,
    supportsTools: true,
    supportsStructuredOutput: true,
    apiAvailable: true,
    officialPricing: {
      input: 0.15,
      output: 0.45,
      cached: 0.05,
    },
    speedTokensPerSec: 155,
    reasoningEffort: ['none'],
    defaultEffort: 'none',
    lastVerifiedAt: '2026-09-05',
    sourceUrl: 'https://docs.mistral.ai/getting-started/models/',
    sourceName: 'Mistral AI Official Documentation',
  },
  'hy4-preview': {
    slug: 'hy4-preview',
    releaseDate: '2026-08-27',
    contextWindow: 1048576,
    maxOutputTokens: 65536,
    supportsVision: true,
    supportsAudio: false,
    supportsTools: true,
    supportsStructuredOutput: true,
    apiAvailable: true,
    officialPricing: {
      input: 0.834,
      output: 2.501,
      cached: 0.042,
    },
    speedTokensPerSec: 145,
    reasoningEffort: ['none', 'low', 'high'],
    defaultEffort: 'high',
    lastVerifiedAt: '2026-09-05',
    sourceUrl: 'https://openrouter.ai/models/tencent/hy4-preview',
    sourceName: 'Tencent Official Documentation & OpenRouter',
  },
  'glm-5-3': {
    slug: 'glm-5-3',
    releaseDate: '2026-08-26',
    contextWindow: 1310720,
    maxOutputTokens: 131072,
    supportsVision: true,
    supportsAudio: false,
    supportsTools: true,
    supportsStructuredOutput: true,
    apiAvailable: true,
    officialPricing: {
      input: 0.5,
      output: 1.5,
      cached: 0.1,
    },
    speedTokensPerSec: 85,
    reasoningEffort: ['low', 'high', 'max'],
    defaultEffort: 'max',
    lastVerifiedAt: '2026-09-05',
    sourceUrl: 'https://openrouter.ai/models/z-ai/glm-5.3',
    sourceName: 'Z.ai Official Documentation & OpenRouter',
  },
};

export const reviewedContext: Record<
  string,
  { value: number; source: CatalogModel['sources'][number] }
> = {};

const retrievedAt = '2026-09-14';
const anthropicRetrievedAt = '2026-09-14';
const anthropic = 'https://platform.claude.com/docs/en/about-claude/pricing';
const google = 'https://ai.google.dev/gemini-api/docs/pricing';
const openaiPricing = 'https://developers.openai.com/api/docs/pricing';
const openaiRetrievedAt = '2026-09-14';
const deepseekPricing = 'https://api-docs.deepseek.com/quick_start/pricing';
const minimaxPricing = 'https://platform.minimax.io/docs/guides/pricing-paygo';
const apiPricingRecords: Record<string, ApiPricing> = {};
function price(
  value: number,
  url: string,
  unit: PriceValue['unit'] = 'per-million-tokens',
): PriceValue {
  return {
    value,
    currency: 'USD',
    unit,
    source: {
      name:
        url === anthropic
          ? 'Anthropic API pricing'
          : url === openaiPricing
            ? 'OpenAI API pricing'
            : 'Google Gemini API pricing',
      url,
      type: 'provider_doc',
      retrievedAt:
        url === openaiPricing
          ? openaiRetrievedAt
          : url === anthropic
            ? anthropicRetrievedAt
            : retrievedAt,
      effectiveFrom: null,
    },
  };
}
function tier(
  id: string,
  input: number,
  output: number,
  cached: number | null,
  url: string,
  minContext: number,
  maxContext: number | null,
): PricingTier {
  return {
    id,
    label: `${minContext.toLocaleString('en-US')}–${maxContext === null ? '∞' : maxContext.toLocaleString('en-US')} input tokens`,
    minContext,
    maxContext,
    input: price(input, url),
    output: price(output, url),
    cached: cached === null ? null : price(cached, url),
    cacheWrite5m: null,
    cacheWrite1h: null,
    cacheStorage: null,
    search: null,
  };
}
const gpt6AstraPricing: ApiPricing = {
  provider: 'OpenAI',
  scope: 'OpenAI API · GPT-6 Astra standard text pricing',
  tiers: [
    tier('standard', 10, 50, 1, openaiPricing, 0, 272_000),
    tier('long-context', 20, 75, 2, openaiPricing, 272_001, null),
  ],
  notes: [
    'Standard rates are taken from the linked first-party provider pricing documentation.',
    'Batch, flex, fast mode, regional processing, media, and tool charges may differ.',
  ],
  benchmarkCost: null,
};
apiPricingRecords['gpt-6-astra'] = gpt6AstraPricing;

for (const [slug, spec] of Object.entries(OFFICIAL_PROVIDER_SPECS)) {
  if (
    slug === 'gpt-6-astra' ||
    spec.sourceName !== 'OpenAI Official Documentation' ||
    spec.officialPricing.input === null ||
    spec.officialPricing.output === null
  )
    continue;

  const standard = tier(
    'standard',
    spec.officialPricing.input,
    spec.officialPricing.output,
    spec.officialPricing.cached,
    openaiPricing,
    0,
    spec.contextWindow,
  );
  for (const rate of [standard.input, standard.output, standard.cached]) {
    if (rate) rate.source.retrievedAt = spec.lastVerifiedAt;
  }
  apiPricingRecords[slug] = {
    provider: 'OpenAI',
    scope: `OpenAI API · ${slug} standard text pricing`,
    tiers: [standard],
    notes: [
      'Standard rates are taken from the linked first-party provider pricing documentation.',
      'Batch, flex, fast mode, long-context, regional processing, media, and tool charges may differ.',
    ],
    benchmarkCost: null,
  };
}
function deepseekPrice(value: number): PriceValue {
  return {
    value,
    currency: 'USD',
    unit: 'per-million-tokens',
    source: {
      name: 'DeepSeek API pricing',
      url: deepseekPricing,
      type: 'provider_doc',
      retrievedAt: '2026-09-12',
      effectiveFrom: '2026-09-10',
    },
  };
}
function minimaxPrice(value: number): PriceValue {
  return {
    value,
    currency: 'USD',
    unit: 'per-million-tokens',
    source: {
      name: 'MiniMax API pricing',
      url: minimaxPricing,
      type: 'provider_doc',
      retrievedAt: retrievedAt,
      effectiveFrom: null,
    },
  };
}
const deepseekFlashPricing: ApiPricing = {
  provider: 'DeepSeek',
  scope: 'DeepSeek API · V4.1 Flash text and vision pricing',
  tiers: [
    {
      id: 'standard',
      label: '0–1,048,576 input tokens',
      minContext: 0,
      maxContext: 1_048_576,
      input: deepseekPrice(0.15),
      output: deepseekPrice(0.6),
      cached: deepseekPrice(0.003),
      cacheWrite5m: null,
      cacheWrite1h: null,
      cacheStorage: null,
      search: null,
    },
  ],
  periods: [
    {
      id: 'off-peak',
      label: 'Off-peak',
      input: deepseekPrice(0.15),
      output: deepseekPrice(0.6),
      cached: deepseekPrice(0.003),
    },
    {
      id: 'peak',
      label: 'Peak',
      input: deepseekPrice(0.3),
      output: deepseekPrice(1.2),
      cached: deepseekPrice(0.006),
    },
  ],
  notes: [
    'Off-peak hours are 01:00–04:00 and 06:00–10:00 UTC, Monday through Friday; all other hours are off-peak.',
    'DeepSeek-V4-Flash and DeepSeek-V4-Flash-Vision-Exp are retired and route to V4.1 Flash at Flash rates.',
  ],
  benchmarkCost: null,
};
apiPricingRecords['deepseek-v4-1-flash'] = deepseekFlashPricing;
for (const [slug, input, output, cached, context] of [
  ['claude-fable-5-1', 10, 50, 0.25, 1_000_000],
] as const) {
  const standard = tier(
    'standard',
    input,
    output,
    cached,
    anthropic,
    0,
    context,
  );
  standard.cacheWrite5m = price(input * 1.25, anthropic);
  standard.cacheWrite1h = price(input * 2, anthropic);
  standard.search = price(0.01, anthropic, 'per-call');
  apiPricingRecords[slug] = {
    provider: 'Anthropic',
    scope: 'Claude API · standard global text pricing',
    tiers: [standard],
    notes: [
      'Cache writes and cache reads are separate billing categories. Include billed thinking tokens in output.',
      'Batch, US-only inference, fast mode, media and code execution may change charges; this calculator covers standard global text and the listed extras.',
    ],
    benchmarkCost: null,
  };
}
for (const [slug, input, output, cached, storage] of [
  ['gemini-3-8-flash', 0.75, 3.75, 0.075, 0.5],
] as const) {
  const standard = tier(
    'standard',
    input,
    output,
    cached,
    google,
    0,
    1_048_576,
  );
  const tiers = [standard];
  tiers.forEach((t) => {
    t.cacheStorage = price(storage, google, 'per-million-token-hours');
  });
  apiPricingRecords[slug] = {
    provider: 'Google DeepMind',
    scope: 'Gemini Developer API · paid standard text pricing',
    tiers,
    notes: [
      'Output includes thinking tokens. Cache storage is billed separately.',
      'Audio, media, search allowances, batch, flex and priority rates are outside this calculator.',
    ],
    benchmarkCost: null,
  };
}
apiPricingRecords['minimax-m3'] = {
  provider: 'MiniMax',
  scope: 'MiniMax API · M3 standard text pricing',
  tiers: [
    {
      id: 'standard',
      label: '0–512,000 input tokens',
      minContext: 0,
      maxContext: 512_000,
      input: minimaxPrice(0.3),
      output: minimaxPrice(1.2),
      cached: minimaxPrice(0.06),
      cacheWrite5m: null,
      cacheWrite1h: null,
      cacheStorage: null,
      search: null,
    },
    {
      id: 'long-context',
      label: '512,001–1,048,576 input tokens',
      minContext: 512_001,
      maxContext: 1_048_576,
      input: minimaxPrice(0.6),
      output: minimaxPrice(2.4),
      cached: minimaxPrice(0.12),
      cacheWrite5m: null,
      cacheWrite1h: null,
      cacheStorage: null,
      search: null,
    },
  ],
  notes: [
    'Displayed rates are MiniMax standard pay-as-you-go rates; the provider lists permanent 50% promotional pricing for M3.',
    'Priority service is billed at 1.5× standard rates and is outside this calculator.',
    'Media, subscription, and other charges are outside this calculator.',
  ],
  benchmarkCost: null,
};
export const verifiedApiPricing: Record<string, ApiPricing> =
  Object.fromEntries(
    Object.entries(apiPricingRecords).map(([slug, record]) => [
      slug,
      apiPricingSchema.parse(record),
    ]),
  );
