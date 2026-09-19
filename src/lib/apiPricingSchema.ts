import { z } from 'zod';

export const pricingSourceSchema = z
  .object({
    name: z.string().min(1),
    url: z.url().refine((url) => url.startsWith('https://')),
    type: z.enum(['provider_doc', 'openrouter', 'public_eval']),
    lifecycle: z.enum(['current', 'historical']).optional(),
    retrievedAt: z.iso.date(),
    effectiveFrom: z.iso.date().nullable(),
  })
  .refine(
    (s) =>
      s.type !== 'openrouter' || new URL(s.url).hostname === 'openrouter.ai',
    'Fallback must be OpenRouter',
  );
export const priceValueSchema = z.object({
  value: z.number().nonnegative(),
  currency: z.literal('USD'),
  unit: z.enum([
    'per-million-tokens',
    'per-call',
    'per-million-token-hours',
    'multiplier',
    'per-task',
  ]),
  source: pricingSourceSchema,
});
const tokenPrice = priceValueSchema
  .refine((p) => p.unit === 'per-million-tokens', 'Expected token rate')
  .nullable();
const pricingPeriodSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  input: tokenPrice,
  output: tokenPrice,
  cached: tokenPrice,
});
export const pricingTierSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    minContext: z.number().int().nonnegative(),
    maxContext: z.number().int().positive().nullable(),
    input: tokenPrice,
    output: tokenPrice,
    cached: tokenPrice,
    cacheWrite5m: tokenPrice,
    cacheWrite1h: tokenPrice,
    cacheStorage: priceValueSchema.nullable(),
    search: priceValueSchema.nullable(),
  })
  .refine(
    (t) => t.maxContext === null || t.maxContext >= t.minContext,
    'Invalid context range',
  );
export const apiPricingSchema = z
  .object({
    provider: z.string().min(1),
    scope: z.string().min(1),
    tiers: z.array(pricingTierSchema),
    periods: z.array(pricingPeriodSchema).optional(),
    notes: z.array(z.string()),
    benchmarkCost: z
      .object({
        amount: priceValueSchema.refine(
          (p) => p.unit === 'per-task' && p.source.type === 'public_eval',
          'Benchmark cost requires a public evaluation source and per-task unit',
        ),
        benchmark: z.string().min(1),
        methodologyUrl: z.url(),
        taskScope: z.string().min(1),
      })
      .nullable(),
  })
  .superRefine((p, ctx) => {
    const approvedHosts: Record<string, string[]> = {
      Anthropic: [
        'platform.claude.com',
        'docs.anthropic.com',
        'www.anthropic.com',
        'claude.com',
      ],
      Google: ['ai.google.dev', 'cloud.google.com'],
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
    const tiers = [...p.tiers].sort((a, b) => a.minContext - b.minContext);
    if (new Set(tiers.map((t) => t.id)).size !== tiers.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate pricing tier' });
    tiers.forEach((t, i) => {
      for (const rate of [
        t.input,
        t.output,
        t.cached,
        t.cacheWrite5m,
        t.cacheWrite1h,
        t.cacheStorage,
        t.search,
      ]) {
        if (!rate) continue;
        const host = new URL(rate.source.url).hostname;
        if (
          rate.source.type === 'public_eval' ||
          (rate.source.type === 'provider_doc' &&
            !approvedHosts[p.provider]?.includes(host))
        )
          ctx.addIssue({
            code: 'custom',
            message:
              'Pricing requires an approved provider host or OpenRouter fallback',
          });
      }
      const previous = tiers[i - 1];
      if (
        previous &&
        (previous.maxContext === null || previous.maxContext >= t.minContext)
      )
        ctx.addIssue({ code: 'custom', message: 'Overlapping pricing tiers' });
      for (const [key, unit] of [
        ['cacheStorage', 'per-million-token-hours'],
        ['search', 'per-call'],
      ] as const) {
        if (t[key] && t[key].unit !== unit)
          ctx.addIssue({ code: 'custom', message: `Invalid ${key} unit` });
      }
    });
    for (const period of p.periods ?? []) {
      for (const rate of [period.input, period.output, period.cached]) {
        if (!rate) continue;
        const host = new URL(rate.source.url).hostname;
        if (
          rate.source.type === 'public_eval' ||
          (rate.source.type === 'provider_doc' &&
            !approvedHosts[p.provider]?.includes(host))
        )
          ctx.addIssue({
            code: 'custom',
            message:
              'Pricing requires an approved provider host or OpenRouter fallback',
          });
      }
    }
  });
export type ApiPricing = z.infer<typeof apiPricingSchema>;
export type PriceValue = z.infer<typeof priceValueSchema>;
export type PricingTier = z.infer<typeof pricingTierSchema>;
export type PricingPeriod = z.infer<typeof pricingPeriodSchema>;
