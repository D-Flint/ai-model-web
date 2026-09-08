import { z } from 'zod';
import { apiPricingSchema } from './apiPricingSchema';
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
  intelligence: score.nullable(),
  coding: score.nullable(),
  agentic: score.nullable(),
  dailyUse: score.nullable(),
  research: score.nullable(),
  writing: score.nullable(),
  vision: score.nullable(),
  speed: score.nullable(),
  reliability: score.nullable(),
  costEfficiency: score.nullable(),
});
export const modelBenchmarksSchema = z
  .object({
    livebench: z
      .object({
        release: z.string(),
        overall: score.nullable(),
        reasoning: score.nullable(),
        coding: score.nullable(),
        agenticCoding: score.nullable(),
        mathematics: score.nullable(),
        dataAnalysis: score.nullable(),
        language: score.nullable(),
        instructionFollowing: score.nullable(),
      })
      .nullable(),
    sweBench: z
      .object({
        resolvedRate: score.nullable(),
        evaluatedDate: z.string(),
      })
      .nullable()
      .optional(),
    bfcl: z
      .object({
        overallAccuracy: score.nullable(),
      })
      .nullable()
      .optional(),
    lmarena: z
      .object({
        elo: z.number().nullable(),
        category: z.string(),
      })
      .nullable()
      .optional(),
  })
  .nullable()
  .optional();

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
    roles: z
      .array(
        z.enum([
          'general-purpose',
          'reasoning',
          'coding',
          'agentic',
          'vision',
          'safety-classifier',
        ]),
      )
      .optional(),
    facts: z.object({
      context: z.number().int().positive(),
      contextWindow: z.number().int().positive().optional(),
      contextSourceId: z.string().min(1).optional(),
      maxOutput: z.number().int().positive(),
      speedTokensPerSec: z.number().int().positive().nullable().optional(),
      speedTokensPerSecRange: z
        .object({
          min: z.number().int().positive(),
          max: z.number().int().positive(),
          providerCount: z.number().int().positive().optional(),
          sourceId: z.string().min(1),
          retrievedAt: date,
        })
        .nullable()
        .optional(),
      vision: z.boolean(),
      supportsVision: z.boolean().optional(),
      audio: z.boolean(),
      tools: z.boolean(),
      supportsTools: z.boolean().optional(),
      structured: z.boolean(),
      api: z.boolean(),
      openWeights: z.boolean(),
      isOpenWeights: z.boolean().optional(),
      easeOfUse: score.nullable().optional(),
      availability: z.string().min(1),
      releaseDate: date,
      sourceId: z.string().min(1),
      reasoningEffort: z
        .array(z.enum(['none', 'low', 'medium', 'high', 'max', 'fixed']))
        .default(['none']),
      defaultEffort: z
        .enum(['none', 'low', 'medium', 'high', 'max', 'fixed'])
        .default('none'),
    }),
    apiPricing: apiPricingSchema.nullable().optional(),
    // Legacy ingestion values: not approved for publication or cost calculation.
    pricing: z.object({
      input: z.number().nonnegative().nullable(),
      output: z.number().nonnegative().nullable(),
      cached: z.number().nonnegative().nullable(),
      currency: z.literal('USD'),
      unit: z.literal('per-million-tokens'),
      sourceId: z.string().min(1),
      updatedAt: date,
      inputPer1M: z.number().nonnegative().nullable().optional(),
      outputPer1M: z.number().nonnegative().nullable().optional(),
      cachedInputPer1M: z.number().nonnegative().nullable().optional(),
      provenanceUrl: z.string().optional(),
      verifiedAt: date.optional(),
    }),
    scores: capabilitySchema.extend({ overall: score.nullable() }),
    benchmarks: modelBenchmarksSchema,
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
      .default([]),
    confidence: score,
    methodology: z.string().min(1),
    scoreUpdatedAt: date,
    lastVerifiedAt: date.nullable(),
    sourceUpdatedAt: date,
    sources: z.array(factSource).min(1),
  })
  .superRefine((model, ctx) => {
    if (model.apiPricing && model.apiPricing.provider !== model.provider)
      ctx.addIssue({
        code: 'custom',
        message: 'Pricing provider does not match model',
      });
    const ids = new Set(model.sources.map((s) => s.id));
    for (const id of [
      model.pricing.sourceId,
      model.facts.sourceId,
      ...(model.facts.contextSourceId ? [model.facts.contextSourceId] : []),
      ...model.evidence.map((e) => e.sourceId),
    ]) {
      if (!ids.has(id))
        ctx.addIssue({ code: 'custom', message: `Unresolved source: ${id}` });
    }
    for (const metric of Object.keys(
      capabilitySchema.shape,
    ) as (keyof typeof capabilitySchema.shape)[]) {
      const hasEvidence = model.evidence.some((e) => e.metric === metric);
      const hasScore = model.scores[metric] !== null;
      if (hasScore && !hasEvidence) {
        ctx.addIssue({
          code: 'custom',
          message: `Missing evidence for ${metric}`,
        });
      }
      if (!hasScore && hasEvidence) {
        ctx.addIssue({
          code: 'custom',
          message: `Evidence present for null score: ${metric}`,
        });
      }
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
