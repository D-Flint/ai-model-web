import type { CatalogModel } from './catalogSchema';
import type { ApiPricing, PriceValue, PricingTier } from './apiPricingSchema';

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
