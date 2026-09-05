import {
  pgTable,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  jsonb,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const providers = pgTable('providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  website: text('website').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const models = pgTable('models', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  providerId: text('provider_id')
    .references(() => providers.id)
    .notNull(),
  family: text('family').notNull(),
  releaseDate: text('release_date').notNull(),
  status: text('status').notNull().default('active'),
  description: text('description').notNull(),
  contextWindow: integer('context_window').notNull(),
  maxOutputTokens: integer('max_output_tokens').notNull(),
  supportsVision: boolean('supports_vision').default(false).notNull(),
  supportsAudio: boolean('supports_audio').default(false).notNull(),
  supportsTools: boolean('supports_tools').default(true).notNull(),
  supportsStructuredOutput: boolean('supports_structured_output')
    .default(true)
    .notNull(),
  openWeights: boolean('open_weights').default(false).notNull(),
  apiAvailable: boolean('api_available').default(true).notNull(),
  lastVerifiedAt: timestamp('last_verified_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const modelPricing = pgTable('model_pricing', {
  id: text('id').primaryKey(),
  modelId: text('model_id')
    .references(() => models.id)
    .notNull(),
  providerName: text('provider_name'),
  inputPerMillion: numeric('input_per_million', {
    precision: 10,
    scale: 4,
  }).notNull(),
  outputPerMillion: numeric('output_per_million', {
    precision: 10,
    scale: 4,
  }).notNull(),
  cachedInputPerMillion: numeric('cached_input_per_million', {
    precision: 10,
    scale: 4,
  }),
  currency: text('currency').default('USD').notNull(),
  sourceId: text('source_id')
    .notNull()
    .references(() => sources.id),
  unit: text('unit').notNull().default('per-million-tokens'),
  effectiveFrom: text('effective_from').notNull(),
  lastVerifiedAt: timestamp('last_verified_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const modelScores = pgTable(
  'model_scores',
  {
    modelId: text('model_id')
      .primaryKey()
      .references(() => models.id),
    overall: integer('overall'),
    intelligence: integer('intelligence'),
    coding: integer('coding'),
    agentic: integer('agentic'),
    dailyUse: integer('daily_use'),
    research: integer('research'),
    writing: integer('writing'),
    vision: integer('vision'),
    speed: integer('speed'),
    reliability: integer('reliability'),
    costEfficiency: integer('cost_efficiency'),
    confidence: integer('confidence').notNull(),
    methodologyVersion: text('methodology_version').notNull(),
    scoreUpdatedAt: timestamp('score_updated_at').notNull(),
    evidenceIds: jsonb('evidence_ids').$type<string[]>().notNull(),
  },
  (table) => [
    check(
      'current_score_evidence_required',
      sql`jsonb_array_length(${table.evidenceIds}) > 0`,
    ),
    check(
      'current_scores_range',
      sql`(${table.overall} is null or ${table.overall} between 0 and 100) and (${table.intelligence} is null or ${table.intelligence} between 0 and 100) and (${table.coding} is null or ${table.coding} between 0 and 100) and (${table.agentic} is null or ${table.agentic} between 0 and 100) and (${table.dailyUse} is null or ${table.dailyUse} between 0 and 100) and (${table.research} is null or ${table.research} between 0 and 100) and (${table.writing} is null or ${table.writing} between 0 and 100) and (${table.vision} is null or ${table.vision} between 0 and 100) and (${table.speed} is null or ${table.speed} between 0 and 100) and (${table.reliability} is null or ${table.reliability} between 0 and 100) and (${table.costEfficiency} is null or ${table.costEfficiency} between 0 and 100) and ${table.confidence} between 0 and 100`,
    ),
  ],
);

export const sources = pgTable('sources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  sourceType: text('source_type').notNull(),
  publisher: text('publisher').notNull(),
  licenseNotes: text('license_notes'),
  retrievedAt: timestamp('retrieved_at').notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const taskProfiles = pgTable('task_profiles', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  estimatedInputTokens: integer('estimated_input_tokens').notNull(),
  estimatedOutputTokens: integer('estimated_output_tokens').notNull(),
  typicalToolCalls: integer('typical_tool_calls').default(0).notNull(),
});
