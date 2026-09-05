import { pgTable, text, integer, boolean, numeric, timestamp } from 'drizzle-orm/pg-core';

export const providers = pgTable('providers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  website: text('website').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const models = pgTable('models', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  providerId: text('provider_id').references(() => providers.id).notNull(),
  family: text('family').notNull(),
  releaseDate: text('release_date').notNull(),
  status: text('status').notNull().default('active'),
  description: text('description').notNull(),
  contextWindow: integer('context_window').notNull(),
  maxOutputTokens: integer('max_output_tokens').notNull(),
  supportsVision: boolean('supports_vision').default(false).notNull(),
  supportsAudio: boolean('supports_audio').default(false).notNull(),
  supportsTools: boolean('supports_tools').default(true).notNull(),
  supportsStructuredOutput: boolean('supports_structured_output').default(true).notNull(),
  openWeights: boolean('open_weights').default(false).notNull(),
  apiAvailable: boolean('api_available').default(true).notNull(),
  lastVerifiedAt: timestamp('last_verified_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const modelPricing = pgTable('model_pricing', {
  id: text('id').primaryKey(),
  modelId: text('model_id').references(() => models.id).notNull(),
  inputPerMillion: numeric('input_per_million', { precision: 10, scale: 4 }).notNull(),
  outputPerMillion: numeric('output_per_million', { precision: 10, scale: 4 }).notNull(),
  cachedInputPerMillion: numeric('cached_input_per_million', { precision: 10, scale: 4 }),
  currency: text('currency').default('USD').notNull(),
  sourceId: text('source_id').notNull(),
  effectiveFrom: text('effective_from').notNull(),
  lastVerifiedAt: timestamp('last_verified_at').notNull()
});

export const modelScores = pgTable('model_scores', {
  modelId: text('model_id').primaryKey().references(() => models.id),
  overall: integer('overall').notNull(),
  intelligence: integer('intelligence').notNull(),
  coding: integer('coding').notNull(),
  agentic: integer('agentic').notNull(),
  dailyUse: integer('daily_use').notNull(),
  research: integer('research').notNull(),
  writing: integer('writing').notNull(),
  vision: integer('vision').notNull(),
  speed: integer('speed').notNull(),
  reliability: integer('reliability').notNull(),
  costEfficiency: integer('cost_efficiency').notNull(),
  confidence: integer('confidence').notNull(),
  methodologyVersion: text('methodology_version').notNull(),
  scoreUpdatedAt: timestamp('score_updated_at').notNull()
});

export const sources = pgTable('sources', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  sourceType: text('source_type').notNull(),
  publisher: text('publisher').notNull(),
  retrievedAt: timestamp('retrieved_at').notNull()
});

export const taskProfiles = pgTable('task_profiles', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  estimatedInputTokens: integer('estimated_input_tokens').notNull(),
  estimatedOutputTokens: integer('estimated_output_tokens').notNull(),
  typicalToolCalls: integer('typical_tool_calls').default(0).notNull()
});
