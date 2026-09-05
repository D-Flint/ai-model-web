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

  for (const row of rows) {
    const canonical = resolver.resolve('livebench', row.model);
    if (!canonical) {
      continue;
    }

    const evalDate = row.date ?? today;

    // 1. LiveBench Intelligence measurement
    const intelRaw = Number(row.global_average.toFixed(1));
    const intelNorm = normalize(intelRaw, 0, 100);

    measurements.push({
      id: `livebench-intelligence-${canonical.slug}`,
      modelSlug: canonical.slug,
      benchmarkName: 'LiveBench Global Average',
      category: 'intelligence',
      rawScore: intelRaw,
      minScale: 0,
      maxScale: 100,
      normalizedScore: intelNorm,
      evaluationDate: evalDate,
      sourceId: 'livebench-leaderboard',
      sourceName: 'LiveBench AI Benchmark',
      sourceUrl: 'https://livebench.ai',
      retrievedAt: today,
      metadata: {
        reasoning: row.reasoning,
        math: row.math,
        data_analysis: row.data_analysis,
        instruction_following: row.instruction_following,
      },
    });

    // 2. LiveBench Coding measurement (secondary contributor to coding)
    if (row.coding !== undefined && Number.isFinite(row.coding)) {
      const codingRaw = Number(row.coding.toFixed(1));
      const codingNorm = normalize(codingRaw, 0, 100);

      measurements.push({
        id: `livebench-coding-${canonical.slug}`,
        modelSlug: canonical.slug,
        benchmarkName: 'LiveBench Coding',
        category: 'coding',
        rawScore: codingRaw,
        minScale: 0,
        maxScale: 100,
        normalizedScore: codingNorm,
        evaluationDate: evalDate,
        sourceId: 'livebench-leaderboard',
        sourceName: 'LiveBench AI Benchmark',
        sourceUrl: 'https://livebench.ai',
        retrievedAt: today,
      });
    }
  }

  return measurements;
}
