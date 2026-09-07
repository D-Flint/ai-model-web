import type { CatalogModel } from './catalogSchema';
import {
  apiPricingSchema,
  type ApiPricing,
  type PriceValue,
  type PricingTier,
} from './apiPricingSchema';

export const pricingPolicy = {
  staleAfterDays: 7,
  inputRatio: 0.7,
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
export function rateLabel(
  model: CatalogModel,
  key: 'input' | 'output' | 'cached',
): string {
  if ((model.apiPricing?.tiers.length ?? 0) > 1) return 'Varies by context';
  const rate = singleRate(model, key);
  return priceFreshness(rate) === 'Needs verification'
    ? 'Needs verification'
    : formatPrice(rate?.value);
}
export function comparablePrice(
  model: CatalogModel,
  key: 'input' | 'output' | 'blended' = 'input',
): number | null {
  const input = singleRate(model, 'input');
  const output = singleRate(model, 'output');
  if (key === 'blended')
    return priceFreshness(input) === 'Current' &&
      priceFreshness(output) === 'Current'
      ? input!.value * pricingPolicy.inputRatio +
          output!.value * (1 - pricingPolicy.inputRatio)
      : null;
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

const reviewedPricingHosts: Record<string, string[]> = {
  Anthropic: ['platform.claude.com', 'docs.anthropic.com'],
  'Google DeepMind': ['ai.google.dev', 'cloud.google.com'],
  OpenAI: ['platform.openai.com'],
  DeepSeek: ['api-docs.deepseek.com'],
  'Moonshot AI': ['platform.moonshot.cn'],
  'Mistral AI': ['docs.mistral.ai'],
  'Alibaba Cloud / Qwen': ['help.aliyun.com', 'qwenlm.github.io'],
  xAI: ['docs.x.ai'],
  'Amazon AWS': ['aws.amazon.com'],
  Cohere: ['docs.cohere.com'],
  MiniMax: ['platform.minimaxi.com'],
  Tencent: ['hunyuan.tencent.com'],
  'Z.ai': ['z.ai', 'docs.z.ai'],
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
  if (!reviewedPricingHosts[model.provider]?.includes(hostname)) return null;

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
            type: 'provider_doc',
            retrievedAt: model.pricing.updatedAt,
            effectiveFrom: null,
          },
        };

  return apiPricingSchema.parse({
    provider: model.provider,
    scope: `${model.provider} API pricing · reviewed provider documentation`,
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
export function calculateApiCost(
  pricing: ApiPricing | null | undefined,
  work: Workload,
  now = new Date(),
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
