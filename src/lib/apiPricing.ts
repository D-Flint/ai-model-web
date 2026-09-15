import type { CatalogModel } from './catalogSchema';
import {
  apiPricingSchema,
  type ApiPricing,
  type PriceValue,
  type PricingTier,
} from './apiPricingSchema';

export const pricingPolicy = {
  staleAfterDays: 7,
  cachedRatio: 0.75,
  inputRatio: 0.2,
  outputRatio: 0.05,
  tokensPerUnit: 1_000_000,
} as const;
export function priceFreshness(
  price: PriceValue | null | undefined,
  now = new Date(),
): 'Current' | 'Needs verification' | 'Unavailable' {
  if (!price) return 'Unavailable';
  const age = now.getTime() - Date.parse(price.source.retrievedAt);
  return !Number.isFinite(age) ||
    age < 0 ||
    age > pricingPolicy.staleAfterDays * 86_400_000 ||
    (price.source.effectiveFrom !== null &&
      Date.parse(price.source.effectiveFrom) > now.getTime())
    ? 'Needs verification'
    : 'Current';
}
export function formatPrice(value: number | null | undefined): string {
  if (value != null && value > 0 && value < 0.000001) return '<$0.000001';
  return value == null || !Number.isFinite(value)
    ? 'Unavailable'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 6,
      }).format(value);
}
export function singleRate(
  model: CatalogModel,
  key: 'input' | 'output' | 'cached',
): PriceValue | null {
  const tiers = model.apiPricing?.tiers;
  return tiers?.length === 1 ? tiers[0][key] : null;
}

function formatTokenLimit(tokens: number): string {
  if (tokens >= 1_000_000 && tokens % 1_000_000 === 0)
    return `${tokens / 1_000_000}M`;
  if (tokens >= 1_000 && tokens % 1_000 === 0) return `${tokens / 1_000}k`;
  return tokens.toLocaleString('en-US');
}

export function rateLabel(
  model: CatalogModel,
  key: 'input' | 'output' | 'cached',
): string {
  const tiers = model.apiPricing?.tiers ?? [];
  if (tiers.length > 1) {
    const [standard, longContext] = tiers;
    const standardRate = standard[key];
    const longContextRate = longContext[key];
    if (
      standard.maxContext !== null &&
      standardRate &&
      longContextRate &&
      priceFreshness(standardRate) === 'Current' &&
      priceFreshness(longContextRate) === 'Current'
    )
      return `(≤${formatTokenLimit(standard.maxContext)}: ${formatPrice(standardRate.value)}) (> ${formatTokenLimit(standard.maxContext)}: ${formatPrice(longContextRate.value)})`;
    return 'Tiered pricing — see details';
  }
  const rate = singleRate(model, key);
  return formatPrice(rate?.value);
}
export function standardRate(
  model: CatalogModel,
  key: 'input' | 'output' | 'cached',
): PriceValue | null {
  const tiers = model.apiPricing?.tiers;
  if (!tiers || tiers.length === 0) return null;
  return tiers[0][key] ?? null;
}

export function rateDisplayWithStatus(
  model: CatalogModel,
  key: 'input' | 'output' | 'cached',
  now = new Date(),
): string {
  const rate = standardRate(model, key);
  if (!rate) return 'Unavailable';
  const freshness = priceFreshness(rate, now);
  if (freshness === 'Needs verification') {
    return `${formatPrice(rate.value)} (unverified)`;
  }
  if (freshness === 'Unavailable') {
    return 'Unavailable';
  }
  return formatPrice(rate.value);
}

export function comparablePrice(
  model: CatalogModel,
  key: 'input' | 'output' | 'blended' = 'input',
): number | null {
  const input = standardRate(model, 'input');
  const output = standardRate(model, 'output');
  const cached = standardRate(model, 'cached');
  if (key === 'blended') {
    if (
      priceFreshness(input) !== 'Current' ||
      priceFreshness(output) !== 'Current'
    )
      return null;
    const effectiveCached =
      cached && priceFreshness(cached) === 'Current'
        ? cached.value
        : input!.value;
    const blended =
      effectiveCached * pricingPolicy.cachedRatio +
      input!.value * pricingPolicy.inputRatio +
      output!.value * pricingPolicy.outputRatio;
    return Number(blended.toFixed(4));
  }
  const price = key === 'input' ? input : output;
  return priceFreshness(price) === 'Current' ? price!.value : null;
}
export function compareApiPrice(a: CatalogModel, b: CatalogModel): number {
  return (
    (comparablePrice(a) ?? Infinity) - (comparablePrice(b) ?? Infinity) ||
    a.name.localeCompare(b.name)
  );
}
export function choosePricing(
  official: ApiPricing | null,
  fallback: ApiPricing | null,
): ApiPricing | null {
  return official ?? fallback;
}

/** Select one existing reviewed rate for compact pricing provenance. */
export function pricingSource(
  pricing: ApiPricing | null | undefined,
): PriceValue | null {
  if (!pricing) return null;
  const rates = [
    ...pricing.tiers.flatMap((tier) => [
      tier.input,
      tier.output,
      tier.cached,
      tier.cacheWrite5m,
      tier.cacheWrite1h,
      tier.cacheStorage,
      tier.search,
    ]),
    ...(pricing.periods ?? []).flatMap((period) => [
      period.input,
      period.output,
      period.cached,
    ]),
  ];
  return rates.find((rate): rate is PriceValue => rate !== null) ?? null;
}

const reviewedPricingHosts: Record<string, string[]> = {
  Anthropic: ['platform.claude.com', 'docs.anthropic.com'],
  'Google DeepMind': ['ai.google.dev', 'cloud.google.com'],
  OpenAI: ['platform.openai.com', 'developers.openai.com'],
  DeepSeek: ['api-docs.deepseek.com'],
  'Moonshot AI': [
    'platform.moonshot.cn',
    'platform.kimi.ai',
    'platform.kimi.com',
  ],
  'Mistral AI': ['docs.mistral.ai'],
  'Alibaba Cloud / Qwen': ['help.aliyun.com', 'qwenlm.github.io'],
  xAI: ['docs.x.ai'],
  'Amazon AWS': ['aws.amazon.com'],
  Cohere: ['docs.cohere.com'],
  MiniMax: [
    'platform.minimaxi.com',
    'platform.minimax.io',
    'www.minimax.io',
    'minimax.io',
  ],
  Tencent: ['hunyuan.tencent.com'],
  'Z.ai': ['z.ai', 'docs.z.ai'],
  NVIDIA: ['build.nvidia.com'],
  'Meta AI': ['ai.meta.com', 'about.meta.com', 'meta.com'],
};

/** Convert legacy provider pricing only when its source is first-party. */
export function reviewedCatalogPricing(model: CatalogModel): ApiPricing | null {
  const source = model.sources.find(
    (item) => item.id === model.pricing.sourceId,
  );
  if (!source || source.kind !== 'provider_doc') return null;

  let hostname: string;
  try {
    hostname = new URL(source.url).hostname;
  } catch {
    return null;
  }
  const sourceType =
    hostname === 'openrouter.ai'
      ? 'openrouter'
      : reviewedPricingHosts[model.provider]?.includes(hostname)
        ? 'provider_doc'
        : null;
  if (!sourceType) return null;

  const makePrice = (value: number | null): PriceValue | null =>
    value === null
      ? null
      : {
          value,
          currency: 'USD',
          unit: 'per-million-tokens',
          source: {
            name: source.name,
            url: source.url,
            type: sourceType,
            retrievedAt: model.pricing.updatedAt,
            effectiveFrom: null,
          },
        };

  return apiPricingSchema.parse({
    provider: model.provider,
    scope:
      sourceType === 'openrouter'
        ? `${model.provider} API pricing · OpenRouter model listing`
        : `${model.provider} API pricing · reviewed provider documentation`,
    tiers: [
      {
        id: 'standard',
        label: `0–${model.facts.context.toLocaleString('en-US')} input tokens`,
        minContext: 0,
        maxContext: model.facts.context,
        input: makePrice(model.pricing.input),
        output: makePrice(model.pricing.output),
        cached: makePrice(model.pricing.cached),
        cacheWrite5m: null,
        cacheWrite1h: null,
        cacheStorage: null,
        search: null,
      },
    ],
    notes: [
      'Standard rates are taken from the linked first-party provider documentation.',
      'Context-specific, batch, media, tool, and priority charges may differ.',
    ],
    benchmarkCost: null,
  });
}
export interface Workload {
  input: number;
  output: number;
  cached: number;
  requests: number;
  cacheWrite5m?: number;
  cacheWrite1h?: number;
  search?: number;
  cacheTokenHours?: number;
}
export interface WorkloadValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateModelWorkload(
  model: CatalogModel,
  work: Workload,
): WorkloadValidationResult {
  const errors: string[] = [];
  const maxOutput = model.facts.maxOutput;
  const contextWindow = model.facts.context;

  if (maxOutput && work.output > maxOutput) {
    errors.push(
      `Output (${work.output.toLocaleString()} tokens) exceeds ${model.name}'s maximum output limit of ${maxOutput.toLocaleString()} tokens.`,
    );
  }

  const totalTokensPerRequest =
    work.input +
    work.cached +
    (work.cacheWrite5m ?? 0) +
    (work.cacheWrite1h ?? 0) +
    work.output;

  if (contextWindow && totalTokensPerRequest > contextWindow) {
    errors.push(
      `Total request tokens (${totalTokensPerRequest.toLocaleString()}) exceed ${model.name}'s context window of ${contextWindow.toLocaleString()} tokens.`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function calculateApiCost(
  pricing: ApiPricing | null | undefined,
  work: Workload,
  now = new Date(),
  model?: CatalogModel,
): {
  total: number;
  input: number;
  output: number;
  cached: number;
  extras: number;
  tier: PricingTier;
} {
  for (const [key, value] of Object.entries(work)) {
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error(`Enter a whole, non-negative ${key} count.`);
  }
  if (model) {
    const validation = validateModelWorkload(model, work);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }
  }
  const context =
    work.input +
    work.cached +
    (work.cacheWrite5m ?? 0) +
    (work.cacheWrite1h ?? 0);
  const tier = pricing?.tiers.find(
    (t) =>
      context >= t.minContext &&
      (t.maxContext === null || context <= t.maxContext),
  );
  if (!tier) throw new Error('Pricing unavailable for this workload.');
  const cost = (
    count: number,
    price: PriceValue | null,
    divisor: number = pricingPolicy.tokensPerUnit,
  ): number => {
    if (count === 0) return 0;
    if (!price) throw new Error('A required rate is unavailable.');
    if (priceFreshness(price, now) !== 'Current')
      throw new Error('Pricing needs verification before calculating.');
    return (count / divisor) * price.value;
  };
  const input = cost(work.input, tier.input) * work.requests;
  const output = cost(work.output, tier.output) * work.requests;
  const cached = cost(work.cached, tier.cached) * work.requests;
  const extras =
    (cost(work.cacheWrite5m ?? 0, tier.cacheWrite5m) +
      cost(work.cacheWrite1h ?? 0, tier.cacheWrite1h) +
      cost(work.search ?? 0, tier.search, 1)) *
      work.requests +
    cost(work.cacheTokenHours ?? 0, tier.cacheStorage);
  const total = input + output + cached + extras;
  if (!Number.isFinite(total) || total > Number.MAX_SAFE_INTEGER)
    throw new Error('Workload exceeds the calculator range.');
  return { total, input, output, cached, extras, tier };
}
