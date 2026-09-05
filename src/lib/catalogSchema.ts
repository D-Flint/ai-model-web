import { z } from 'zod';
const score = z.number().min(0).max(100);
const date = z.iso.date();
const factSource = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().min(1),
  retrievedAt: date,
  kind: z.enum(['mock', 'provider_doc', 'public_eval', 'internal_test']),
  publisher: z.string().min(1),
});
export const capabilitySchema = z.object({
  intelligence: score,
  coding: score,
  agentic: score,
  dailyUse: score,
  research: score,
  writing: score,
  vision: score,
  speed: score,
  reliability: score,
  costEfficiency: score,
});
export const catalogModelSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    provider: z.string().min(1),
    family: z.string().min(1),
    dataKind: z.enum(['mock', 'verified']),
    description: z.string().min(1),
    strengths: z.array(z.string()).min(1),
    weaknesses: z.array(z.string()).min(1),
    tags: z.array(z.string()).min(1),
    facts: z.object({
      context: z.number().int().positive(),
      maxOutput: z.number().int().positive(),
      vision: z.boolean(),
      audio: z.boolean(),
      tools: z.boolean(),
      structured: z.boolean(),
      api: z.boolean(),
      openWeights: z.boolean(),
      easeOfUse: score,
      availability: z.string().min(1),
      releaseDate: date,
      sourceId: z.string().min(1),
    }),
    pricing: z.object({
      input: z.number().nonnegative(),
      output: z.number().nonnegative(),
      cached: z.number().nonnegative().nullable(),
      currency: z.literal('USD'),
      unit: z.literal('per-million-tokens'),
      sourceId: z.string().min(1),
      updatedAt: date,
    }),
    scores: capabilitySchema.extend({ overall: score }),
    evidence: z
      .array(
        z.object({
          metric: z.enum([
            'intelligence',
            'coding',
            'agentic',
            'dailyUse',
            'research',
            'writing',
            'vision',
            'speed',
            'reliability',
            'costEfficiency',
          ]),
          kind: z.enum(['mock', 'benchmark', 'internal_test']),
          raw: z.number(),
          min: z.number(),
          max: z.number(),
          normalized: score,
          sourceId: z.string().min(1),
          updatedAt: date,
        }),
      )
      .min(1),
    confidence: score,
    methodology: z.string().min(1),
    scoreUpdatedAt: date,
    lastVerifiedAt: date.nullable(),
    sourceUpdatedAt: date,
    sources: z.array(factSource).min(1),
  })
  .superRefine((model, ctx) => {
    const ids = new Set(model.sources.map((s) => s.id));
    for (const id of [
      model.pricing.sourceId,
      model.facts.sourceId,
      ...model.evidence.map((e) => e.sourceId),
    ]) {
      if (!ids.has(id))
        ctx.addIssue({ code: 'custom', message: `Unresolved source: ${id}` });
    }
    for (const metric of Object.keys(capabilitySchema.shape)) {
      if (!model.evidence.some((e) => e.metric === metric))
        ctx.addIssue({
          code: 'custom',
          message: `Missing evidence for ${metric}`,
        });
    }
    if (
      model.dataKind === 'verified' &&
      (!model.lastVerifiedAt ||
        model.sources.some(
          (s) => s.kind === 'mock' || !/^https:\/\//.test(s.url),
        ) ||
        model.evidence.some((e) => e.kind === 'mock'))
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Verified data requires real dated sources and evidence',
      });
    }
  });
export const catalogSchema = z
  .array(catalogModelSchema)
  .min(1)
  .superRefine((models, ctx) => {
    if (new Set(models.map((m) => m.slug)).size !== models.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate model slugs' });
  });
export type CatalogModel = z.infer<typeof catalogModelSchema>;
