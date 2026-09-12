import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import {
  liveBenchRowSchema,
  type LiveBenchRow,
  type BenchmarkMeasurement,
  type ModelBenchmarks,
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

export function buildLiveBenchBenchmark(
  lbRow: LiveBenchRow,
  today: string,
): NonNullable<ModelBenchmarks['livebench']> {
  const reasoning =
    lbRow.reasoning !== undefined && lbRow.reasoning !== null
      ? Number(lbRow.reasoning.toFixed(1))
      : null;
  const coding =
    lbRow.coding !== undefined && lbRow.coding !== null
      ? Number(lbRow.coding.toFixed(1))
      : null;
  const agenticCoding =
    lbRow.agentic_coding !== undefined && lbRow.agentic_coding !== null
      ? Number(lbRow.agentic_coding.toFixed(1))
      : null;
  const mathematics =
    lbRow.math !== undefined && lbRow.math !== null
      ? Number(lbRow.math.toFixed(1))
      : null;
  const dataAnalysis =
    lbRow.data_analysis !== undefined && lbRow.data_analysis !== null
      ? Number(lbRow.data_analysis.toFixed(1))
      : null;
  const language =
    lbRow.language !== undefined && lbRow.language !== null
      ? Number(lbRow.language.toFixed(1))
      : null;
  const instructionFollowing =
    lbRow.instruction_following !== undefined &&
    lbRow.instruction_following !== null
      ? Number(lbRow.instruction_following.toFixed(1))
      : null;

  const subcategories = [
    reasoning,
    coding,
    agenticCoding,
    mathematics,
    dataAnalysis,
    language,
    instructionFollowing,
  ];
  const hasAll7 = subcategories.every(
    (val) => typeof val === 'number' && Number.isFinite(val),
  );

  // Deterministic LiveBench Overall: unweighted average of the 7 LiveBench categories.
  // If any category is missing or null, set overall = null.
  const overall = hasAll7
    ? Number(
        (
          (reasoning! +
            coding! +
            agenticCoding! +
            mathematics! +
            dataAnalysis! +
            language! +
            instructionFollowing!) /
          7
        ).toFixed(1),
      )
    : null;

  return {
    release: lbRow.date ?? today,
    overall,
    reasoning,
    coding,
    agenticCoding,
    mathematics,
    dataAnalysis,
    language,
    instructionFollowing,
  };
}
