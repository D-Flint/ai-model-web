import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { models } from './index';

export const modelAliases = pgTable(
  'model_aliases',
  {
    id: text('id').primaryKey(),
    modelId: text('model_id')
      .notNull()
      .references(() => models.id),
    sourceName: text('source_name').notNull(),
    sourceModelId: text('source_model_id').notNull(),
    alias: text('alias').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('source_model_alias_idx').on(
      table.sourceName,
      table.sourceModelId,
    ),
  ],
);
