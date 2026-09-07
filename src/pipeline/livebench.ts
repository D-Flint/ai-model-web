import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import {
  liveBenchRowSchema,
  type LiveBenchRow,
  type BenchmarkMeasurement,
} from './types';
import type { ModelAliasResolver } from './aliasResolver';
import { normalize } from '../lib/decision';
import type { Capability } from '../data/config';

export const liveBenchFileSchema = z.array(liveBenchRowSchema);

export async function fetchLiveBenchData(options?: {
  filePath?: string;
}): Promise<LiveBenchRow[]> {
  const path = options?.filePath ?? resolve('src/data/livebenchData.json');
  try {
    const raw = await readFile(path, 'utf8');
    const json = JSON.parse(raw);
    return liveBenchFileSchema.parse(json);
  } catch (err) {
    console.warn(`Could not read LiveBench data file at ${path}:`, err);
    return [];
  }
}

export function processLiveBenchResults(
  rows: LiveBenchRow[],
  resolver: ModelAliasResolver,
): BenchmarkMeasurement[] {
  const measurements: BenchmarkMeasurement[] = [];
  const today = new Date().toISOString().split('T')[0];

  function addMeasurement(
    canonicalSlug: string,
    evalDate: string,
    category: Capability,
    label: string,
    rawValue: number,
  ) {
    const rawScore = Number(rawValue.toFixed(1));
    measurements.push({
      id: `livebench-${category}-${canonicalSlug}`,
      modelSlug: canonicalSlug,
      benchmarkName: label,
      category,
      rawScore,
      minScale: 0,
      maxScale: 100,
      normalizedScore: normalize(rawScore, 0, 100),
      evaluationDate: evalDate,
      sourceId: 'livebench-leaderboard',
      sourceName: 'LiveBench AI Benchmark',
      sourceUrl: 'https://livebench.ai',
      retrievedAt: today,
    });
  }

  for (const row of rows) {
    const canonical = resolver.resolve('livebench', row.model);
    if (!canonical) {
      continue;
    }

    const evalDate = row.date ?? today;

    // LiveBench Global Average represents general intelligence.
    addMeasurement(
      canonical.slug,
      evalDate,
      'intelligence',
      'LiveBench Global Average',
      row.global_average,
    );

    // 2. LiveBench Coding measurement (secondary contributor to coding)
    if (row.coding !== undefined && Number.isFinite(row.coding)) {
      addMeasurement(
        canonical.slug,
        evalDate,
        'coding',
        'LiveBench Coding',
        row.coding,
      );
    }

    // LiveBench sub-scores map directly to consumer-facing work categories.
    if (row.instruction_following !== undefined)
      addMeasurement(
        canonical.slug,
        evalDate,
        'dailyUse',
        'LiveBench Instruction Following',
        row.instruction_following,
      );
    if (row.data_analysis !== undefined)
      addMeasurement(
        canonical.slug,
        evalDate,
        'research',
        'LiveBench Data Analysis',
        row.data_analysis,
      );
    if (row.language !== undefined)
      addMeasurement(
        canonical.slug,
        evalDate,
        'writing',
        'LiveBench Language',
        row.language,
      );

    // LiveBench Agentic Coding is distinct from ordinary coding and BFCL.
    if (
      row.agentic_coding !== undefined &&
      Number.isFinite(row.agentic_coding)
    ) {
      addMeasurement(
        canonical.slug,
        evalDate,
        'agentic',
        'LiveBench Agentic Coding',
        row.agentic_coding,
      );
    }
  }

  return measurements;
}
