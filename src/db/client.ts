import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as facts from './schema/index';
import * as evidence from './schema/evidence';
import * as aliases from './schema/aliases';
export function connectDatabase(url = process.env.DATABASE_URL) {
  if (!url)
    throw new Error(
      'DATABASE_URL is required for database operations. The local fixture app needs no database.',
    );
  const client = postgres(url, { max: 5 });
  return {
    db: drizzle(client, { schema: { ...facts, ...evidence, ...aliases } }),
    close: () => client.end(),
  };
}
