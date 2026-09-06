import {
  apiPricingSchema,
  type ApiPricing,
  type PriceValue,
  type PricingTier,
} from '../lib/apiPricingSchema';
import type { CatalogModel } from '../lib/catalogSchema';

export const reviewedContext: Record<
  string,
  { value: number; source: CatalogModel['sources'][number] }
> = {
  'gemini-2-5-pro': {
    value: 1_048_576,
    source: {
      id: 'google-gemini-2-5-pro-context',
      name: 'Gemini 2.5 Pro model limits',
      url: 'https://ai.google.dev/gemini-api/docs/models/gemini-2.5-pro',
      retrievedAt: '2026-09-06',
      kind: 'provider_doc',
      publisher: 'Google DeepMind',
    },
  },
};

// Manually checked against the linked first-party pricing tables on this date.
// Never substitute the build date for the retrieval date.
const retrievedAt = '2026-09-06';
const anthropic = 'https://platform.claude.com/docs/en/about-claude/pricing';
const google = 'https://ai.google.dev/gemini-api/docs/pricing';
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
          : 'Google Gemini API pricing',
      url,
      type: 'provider_doc',
      retrievedAt,
      effectiveFrom: null,
    },
  };
}
function tier(
  id: string,
  input: number,
  output: number,
  cached: number,
  url: string,
  minContext: number,
  maxContext: number,
): PricingTier {
  return {
    id,
    label: `${minContext.toLocaleString('en-US')}–${maxContext.toLocaleString('en-US')} input tokens`,
    minContext,
    maxContext,
    input: price(input, url),
    output: price(output, url),
    cached: price(cached, url),
    cacheWrite5m: null,
    cacheWrite1h: null,
    cacheStorage: null,
    search: null,
  };
}
const records: Record<string, ApiPricing> = {};
// Standard global first-party text rates only; retired models are deliberately omitted.
for (const [slug, input, output, cached, context] of [
  ['claude-fable-5-1', 10, 50, 0.25, 1_000_000],
  ['claude-fable-5', 10, 50, 1, 1_000_000],
  ['claude-opus-5', 5, 25, 0.5, 1_000_000],
  ['claude-opus-4-8', 5, 25, 0.5, 1_000_000],
  ['claude-opus-4-7', 5, 25, 0.5, 1_000_000],
  ['claude-opus-4-6', 5, 25, 0.5, 1_000_000],
  ['claude-sonnet-5', 2, 10, 0.2, 1_000_000],
  ['claude-sonnet-4-6', 3, 15, 0.3, 1_000_000],
  ['claude-haiku-4-5', 1, 5, 0.1, 200_000],
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
  records[slug] = {
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
  ['gemini-2-5-pro', 1.25, 10, 0.125, 4.5],
  ['gemini-2-5-flash', 0.3, 2.5, 0.03, 1],
  ['gemini-2-5-flash-lite', 0.1, 0.4, 0.01, 1],
] as const) {
  const standard = tier(
    'standard',
    input,
    output,
    cached,
    google,
    0,
    slug === 'gemini-2-5-pro' ? 200_000 : 1_048_576,
  );
  const tiers =
    slug === 'gemini-2-5-pro'
      ? [
          standard,
          tier('long-context', 2.5, 15, 0.25, google, 200_001, 1_048_576),
        ]
      : [standard];
  tiers.forEach((t) => {
    t.cacheStorage = price(storage, google, 'per-million-token-hours');
  });
  records[slug] = {
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
export const verifiedApiPricing: Record<string, ApiPricing> =
  Object.fromEntries(
    Object.entries(records).map(([slug, record]) => [
      slug,
      apiPricingSchema.parse(record),
    ]),
  );
