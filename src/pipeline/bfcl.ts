import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import {
  bfclRowSchema,
  type BfclRow,
  type BenchmarkMeasurement,
} from './types';
import type { ModelAliasResolver } from './aliasResolver';
import { normalize } from '../lib/decision';

export const bfclFileSchema = z.array(bfclRowSchema);

export async function fetchBfclLeaderboard(options?: {
  filePath?: string;
}): Promise<BfclRow[]> {
  const path = options?.filePath ?? resolve('src/data/bfclData.json');
  try {
    const raw = await readFile(path, 'utf8');
    const json = JSON.parse(raw);
    return bfclFileSchema.parse(json);
  } catch (err) {
    console.warn(`Could not read BFCL data file at ${path}:`, err);
    return [];
  }
}

export function processBfclResults(
  rows: BfclRow[],
  resolver: ModelAliasResolver,
): BenchmarkMeasurement[] {
  const measurements: BenchmarkMeasurement[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (const row of rows) {
    const canonical = resolver.resolve('bfcl', row.model);
    if (!canonical) {
      continue;
    }

    const evalDate = row.date ?? today;
    const rawScore = Number(row.overall_accuracy.toFixed(1));
    const normalizedScore = normalize(rawScore, 0, 100);

    measurements.push({
      id: `bfcl-agentic-${canonical.slug}`,
      modelSlug: canonical.slug,
      benchmarkName: 'Berkeley Function Calling Leaderboard',
      category: 'agentic',
      rawScore,
      minScale: 0,
      maxScale: 100,
      normalizedScore,
      evaluationDate: evalDate,
      sourceId: 'berkeley-function-calling-leaderboard',
      sourceName: 'Berkeley Function Calling Leaderboard (BFCL)',
      sourceUrl: 'https://gorilla.cs.berkeley.edu/leaderboard.html',
      retrievedAt: today,
      metadata: {
        ast_summary: row.ast_summary,
        exec_summary: row.exec_summary,
      },
    });
  }

  return measurements;
}
