import liveBenchDataRaw from '../data/livebenchData.json';
import { liveBenchRowSchema, type LiveBenchRow } from '../pipeline/types';
import { defaultAliasResolver } from '../pipeline/aliasResolver';
import type { CatalogModel } from './catalogSchema';
import { evaluateModelEligibility } from './catalogEligibility';

export const LIVEBENCH_CATALOG_LIMIT = 30;

const liveBenchRows = liveBenchDataRaw.map((row) =>
  liveBenchRowSchema.parse(row),
);

function dateValue(row: LiveBenchRow): string {
  return row.date ?? '';
}

function latestLiveBenchRows(): Map<string, LiveBenchRow> {
  const latest = new Map<string, LiveBenchRow>();

  for (const row of liveBenchRows) {
    const canonical = defaultAliasResolver.resolve('livebench', row.model);
    if (!canonical) continue;

    const previous = latest.get(canonical.slug);
    if (
      !previous ||
      dateValue(row) > dateValue(previous) ||
      (dateValue(row) === dateValue(previous) &&
        row.global_average > previous.global_average)
    ) {
      latest.set(canonical.slug, row);
    }
  }

  return latest;
}

/** Selects exactly `limit` current, eligible models from LiveBench data. */
export function selectTopLiveBenchModels(
  catalog: CatalogModel[],
  limit = LIVEBENCH_CATALOG_LIMIT,
): CatalogModel[] {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('LiveBench catalog limit must be a positive integer');
  }

  const rowsBySlug = latestLiveBenchRows();
  const candidates = catalog
    .map((model) => ({ model, row: rowsBySlug.get(model.slug) }))
    .filter(
      (candidate): candidate is { model: CatalogModel; row: LiveBenchRow } =>
        candidate.row !== undefined &&
        evaluateModelEligibility(candidate.model).isTracked,
    )
    .sort(
      (a, b) =>
        b.row.global_average - a.row.global_average ||
        dateValue(b.row).localeCompare(dateValue(a.row)) ||
        a.model.slug.localeCompare(b.model.slug),
    );

  if (candidates.length < limit) {
    throw new Error(
      `LiveBench catalog requires ${limit} eligible models; found ${candidates.length}`,
    );
  }

  return candidates.slice(0, limit).map(({ model }) => model);
}
