import { z } from 'zod';
import type { Capability } from '../data/config';

// ---------------------------------------------------------------------------
// OpenRouter Payload Schemas
// ---------------------------------------------------------------------------
export const openRouterPricingSchema = z.object({
  prompt: z.string(),
  completion: z.string(),
  request: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
});

export const openRouterArchitectureSchema = z.object({
  modality: z.string().optional().nullable(),
  tokenizer: z.string().optional().nullable(),
  instruct_type: z.string().optional().nullable(),
});

export const openRouterModelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  canonical_slug: z.string().optional().nullable(),
  created: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  context_length: z.number().int().nonnegative(),
  pricing: openRouterPricingSchema,
  architecture: openRouterArchitectureSchema.optional().nullable(),
  top_provider: z
    .object({
      context_length: z.number().optional().nullable(),
      max_completion_tokens: z.number().optional().nullable(),
      is_moderated: z.boolean().optional().nullable(),
    })
    .optional()
    .nullable(),
  per_request_limits: z.unknown().optional().nullable(),
});

export const openRouterThroughputSchema = z.object({
  p50: z.number().nonnegative().optional().nullable(),
  p75: z.number().nonnegative().optional().nullable(),
  p90: z.number().nonnegative().optional().nullable(),
  p99: z.number().nonnegative().optional().nullable(),
});

export const openRouterEndpointSchema = z.object({
  model_id: z.string().min(1),
  provider_name: z.string().min(1),
  status: z.number().int().optional().nullable(),
  throughput_last_30m: openRouterThroughputSchema.optional().nullable(),
});

export const openRouterEndpointsResponseSchema = z.object({
  data: z.object({
    endpoints: z.array(openRouterEndpointSchema),
  }),
});

export const openRouterFrontendEndpointStatsSchema = z.object({
  provider_slug: z.string().min(1),
  provider_display_name: z.string().min(1).optional().nullable(),
  stats: z
    .object({
      p50_throughput: z.number().nonnegative().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export const openRouterFrontendEndpointStatsResponseSchema = z.object({
  data: z.array(openRouterFrontendEndpointStatsSchema),
});

export type OpenRouterFrontendEndpointStats = z.infer<
  typeof openRouterFrontendEndpointStatsSchema
>;

export const openRouterResponseSchema = z.object({
  data: z.array(openRouterModelSchema),
});

export type OpenRouterModel = z.infer<typeof openRouterModelSchema>;
export type OpenRouterEndpoint = z.infer<typeof openRouterEndpointSchema>;

// ---------------------------------------------------------------------------
// LMArena Payload Schemas (Hugging Face Serverless Dataset API)
// ---------------------------------------------------------------------------
export const lmarenaTextRowSchema = z.object({
  model_name: z.string().min(1),
  organization: z.string().optional().nullable(),
  license: z.string().optional().nullable(),
  rating: z.number(),
  rating_lower: z.number().optional().nullable(),
  rating_upper: z.number().optional().nullable(),
  variance: z.number().optional().nullable(),
  vote_count: z.number().int().optional().nullable(),
  rank: z.number().int().optional().nullable(),
  category: z.string().optional().nullable(),
  leaderboard_publish_date: z.string().optional().nullable(),
});

export const lmarenaAgentRowSchema = z.object({
  model_name: z.string().min(1),
  organization: z.string().optional().nullable(),
  license: z.string().optional().nullable(),
  score: z.number(),
  score_ci_lower: z.number().optional().nullable(),
  score_ci_upper: z.number().optional().nullable(),
  observation_count: z.number().int().optional().nullable(),
  session_count: z.number().int().optional().nullable(),
  rank: z.number().int().optional().nullable(),
  category: z.string().optional().nullable(),
  leaderboard_publish_date: z.string().optional().nullable(),
});

export const lmarenaResponseSchema = z.object({
  rows: z.array(
    z.object({
      row_idx: z.number(),
      row: z.record(z.string(), z.unknown()),
    }),
  ),
  num_rows_total: z.number().optional(),
});

export type LMArenaTextRow = z.infer<typeof lmarenaTextRowSchema>;
export type LMArenaAgentRow = z.infer<typeof lmarenaAgentRowSchema>;

// ---------------------------------------------------------------------------
// SWE-bench Payload Schemas
// ---------------------------------------------------------------------------
export const sweBenchResultSchema = z
  .object({
    name: z.string().optional().nullable(),
    model_display: z.string().min(1),
    model_org: z.string().optional().nullable(),
    agent: z.string().optional().nullable(),
    agent_org: z.string().optional().nullable(),
    resolved: z.number().min(0).max(100),
    date: z.string().optional().nullable(),
    cost: z.number().optional().nullable(),
    instance_cost: z.number().optional().nullable(),
    site: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .nullable(),
    tags: z.array(z.string()).optional().nullable(),
  })
  .catchall(z.unknown());

export const sweBenchLeaderboardSchema = z.object({
  leaderboards: z.array(
    z.object({
      name: z.string(),
      results: z.array(sweBenchResultSchema),
    }),
  ),
});

export type SweBenchResult = z.infer<typeof sweBenchResultSchema>;

// ---------------------------------------------------------------------------
// LiveBench Payload Schemas
// ---------------------------------------------------------------------------
export const liveBenchRowSchema = z.object({
  model: z.string().min(1),
  global_average: z.number().min(0).max(100),
  reasoning: z.number().min(0).max(100).optional(),
  math: z.number().min(0).max(100).optional(),
  coding: z.number().min(0).max(100).optional(),
  data_analysis: z.number().min(0).max(100).optional(),
  instruction_following: z.number().min(0).max(100).optional(),
  agentic_coding: z.number().min(0).max(100).optional(),
  language: z.number().min(0).max(100).optional(),
  date: z.string().optional(),
});
export type LiveBenchRow = z.infer<typeof liveBenchRowSchema>;

// ---------------------------------------------------------------------------
// Berkeley Function Calling Leaderboard (BFCL) Payload Schemas
// ---------------------------------------------------------------------------
export const bfclRowSchema = z.object({
  model: z.string().min(1),
  overall_accuracy: z.number().min(0).max(100),
  ast_summary: z.number().min(0).max(100).optional(),
  exec_summary: z.number().min(0).max(100).optional(),
  date: z.string().optional(),
});
export type BfclRow = z.infer<typeof bfclRowSchema>;

// ---------------------------------------------------------------------------
// Canonical & Internal Types
// ---------------------------------------------------------------------------
export type ModelRole =
  | 'general-purpose'
  | 'reasoning'
  | 'coding'
  | 'agentic'
  | 'vision'
  | 'safety-classifier';

export interface LiveBenchBenchmark {
  release: string;
  overall: number | null;
  reasoning: number | null;
  coding: number | null;
  agenticCoding: number | null;
  mathematics: number | null;
  dataAnalysis: number | null;
  language: number | null;
  instructionFollowing: number | null;
}

export interface ModelBenchmarks {
  livebench: LiveBenchBenchmark | null;
  sweBench?: { resolvedRate: number | null; evaluatedDate: string } | null;
  bfcl?: { overallAccuracy: number | null } | null;
  lmarena?: { elo: number | null; category: string } | null;
}

export interface CanonicalModelConfig {
  slug: string;
  name: string;
  provider: string;
  providerSlug: string;
  family: string;
  openWeights: boolean;
  roles?: ModelRole[];
  openRouterId: string;
  openRouterAliases?: string[];
  lmarenaAliases: string[];
  swebenchAliases: string[];
  livebenchAliases?: string[];
  bfclAliases?: string[];
  officialDocsUrl: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  tags: string[];
  reasoningEffort?: ('none' | 'low' | 'medium' | 'high' | 'max' | 'fixed')[];
  defaultEffort?: 'none' | 'low' | 'medium' | 'high' | 'max' | 'fixed';
  speedTokensPerSec?: number;
}

export interface OfficialProviderSpec {
  slug: string;
  releaseDate: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsAudio: boolean;
  supportsTools: boolean;
  supportsStructuredOutput: boolean;
  apiAvailable: boolean;
  officialPricing: {
    input: number | null;
    output: number | null;
    cached: number | null;
  };
  inputPer1M?: number | null;
  outputPer1M?: number | null;
  cachedInputPer1M?: number | null;
  provenanceUrl?: string;
  verifiedAt?: string;
  roles?: ModelRole[];
  isOpenWeights?: boolean;
  speedTokensPerSec?: number;
  reasoningEffort?: ('none' | 'low' | 'medium' | 'high' | 'max' | 'fixed')[];
  defaultEffort?: 'none' | 'low' | 'medium' | 'high' | 'max' | 'fixed';
  lastVerifiedAt: string;
  sourceUrl: string;
  sourceName: string;
}

export interface BenchmarkMeasurement {
  id: string;
  modelSlug: string;
  benchmarkName: string;
  category: Capability;
  rawScore: number;
  minScale: number;
  maxScale: number;
  normalizedScore: number;
  rank?: number | null;
  sampleCount?: number | null;
  confidenceLow?: number | null;
  confidenceHigh?: number | null;
  harness?: string | null;
  evaluationDate: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  retrievedAt: string;
  metadata?: Record<string, unknown>;
}
