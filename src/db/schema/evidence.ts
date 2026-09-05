import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  numeric,
  check,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { models, sources, taskProfiles } from './index';
import type { CatalogModel } from '../../lib/catalogSchema';

export const modelSources = pgTable('model_sources', {
  id: text('id').primaryKey(),
  modelId: text('model_id')
    .notNull()
    .references(() => models.id),
  sourceId: text('source_id')
    .notNull()
    .references(() => sources.id),
  factPath: text('fact_path').notNull(),
  lastVerifiedAt: timestamp('last_verified_at').notNull(),
});
export const benchmarkResults = pgTable(
  'benchmark_results',
  {
    id: text('id').primaryKey(),
    modelId: text('model_id')
      .notNull()
      .references(() => models.id),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    benchmark: text('benchmark').notNull(),
    metric: text('metric').notNull(),
    rawValue: numeric('raw_value').notNull(),
    scaleMin: numeric('scale_min').notNull(),
    scaleMax: numeric('scale_max').notNull(),
    measuredAt: timestamp('measured_at').notNull(),
  },
  (t) => [check('valid_benchmark_scale', sql`${t.scaleMax} > ${t.scaleMin}`)],
);
export const internalTestResults = pgTable('internal_test_results', {
  id: text('id').primaryKey(),
  modelId: text('model_id')
    .notNull()
    .references(() => models.id),
  sourceId: text('source_id')
    .notNull()
    .references(() => sources.id),
  task: text('task').notNull(),
  result: jsonb('result')
    .$type<{
      success: boolean;
      quality: number;
      latencyMs: number;
      inputTokens: number;
      outputTokens: number;
      cost: number;
      retries: number;
      failure: string | null;
    }>()
    .notNull(),
  measuredAt: timestamp('measured_at').notNull(),
});
export const scoreHistory = pgTable(
  'score_history',
  {
    id: text('id').primaryKey(),
    modelId: text('model_id')
      .notNull()
      .references(() => models.id),
    metric: text('metric').notNull(),
    value: integer('value').notNull(),
    confidence: integer('confidence').notNull(),
    methodology: text('methodology').notNull(),
    evidenceIds: jsonb('evidence_ids').$type<string[]>().notNull(),
    calculatedAt: timestamp('calculated_at').notNull(),
  },
  (t) => [
    check('score_range', sql`${t.value} between 0 and 100`),
    check('confidence_range', sql`${t.confidence} between 0 and 100`),
    check(
      'score_evidence_required',
      sql`jsonb_array_length(${t.evidenceIds}) > 0`,
    ),
  ],
);
export const taskCostEstimates = pgTable('task_cost_estimates', {
  id: text('id').primaryKey(),
  modelId: text('model_id')
    .notNull()
    .references(() => models.id),
  taskProfileId: text('task_profile_id')
    .notNull()
    .references(() => taskProfiles.id),
  cost: numeric('cost').notNull(),
  currency: text('currency').notNull(),
  assumptions: jsonb('assumptions')
    .$type<{
      inputTokens: number;
      outputTokens: number;
      successProbability: number;
      toolCalls: number;
      toolPrice: number;
    }>()
    .notNull(),
  estimatedAt: timestamp('estimated_at').notNull(),
});
export const catalogSnapshots = pgTable(
  'catalog_snapshots',
  {
    id: text('id').primaryKey(),
    sha256: text('sha256').notNull(),
    dataKind: text('data_kind').notNull(),
    catalog: jsonb('catalog').$type<CatalogModel[]>().notNull(),
    importedAt: timestamp('imported_at').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('catalog_snapshot_hash').on(t.sha256),
    check('catalog_kind', sql`${t.dataKind} in ('mock', 'verified', 'mixed')`),
  ],
);
