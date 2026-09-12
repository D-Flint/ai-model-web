import liveBenchDataRaw from '../data/livebenchData.json';
import { liveBenchRowSchema, type LiveBenchRow } from '../pipeline/types';
import { defaultAliasResolver } from '../pipeline/aliasResolver';
import type { CatalogModel } from './catalogSchema';
import { evaluateModelEligibility } from './catalogEligibility';

export const LIVEBENCH_CATALOG_LIMIT = 28;
export const LIVEBENCH_CANDIDATE_LIMIT = 28;
export const CURATED_PUBLISHED_MODEL_SLUGS = new Set([
  'deepseek-v4-flash-0731',
  'deepseek-v4-1-flash',
  'deepseek-v4-pro-0813',
]);

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

/** Keep recent discovery models and 35 recent eligible candidates for 30 slots. */
export function curateRecentCatalog(catalog: CatalogModel[]): CatalogModel[] {
  const rows = latestLiveBenchRows();
  const recent = [...catalog].sort((a, b) =>
    b.facts.releaseDate.localeCompare(a.facts.releaseDate),
  );
  const eligible = recent.filter(
    (model) =>
      rows.has(model.slug) && evaluateModelEligibility(model).isTracked,
  );
  const candidates = selectTopLiveBenchModels(
    eligible,
    LIVEBENCH_CANDIDATE_LIMIT,
  );
  // Fail before publication if the retained catalog cannot fill the leaderboard.
  selectTopLiveBenchModels(candidates);
  const retained = new Set(
    [...recent.slice(0, LIVEBENCH_CATALOG_LIMIT), ...candidates].map(
      (model) => model.slug,
    ),
  );
  return recent.filter((model) => retained.has(model.slug));
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
  const compareCandidates = (
    a: { model: CatalogModel; row: LiveBenchRow },
    b: { model: CatalogModel; row: LiveBenchRow },
  ) =>
    b.row.global_average - a.row.global_average ||
    dateValue(b.row).localeCompare(dateValue(a.row)) ||
    a.model.slug.localeCompare(b.model.slug);
  const candidates = catalog
    .map((model) => ({ model, row: rowsBySlug.get(model.slug) }))
    .filter(
      (candidate): candidate is { model: CatalogModel; row: LiveBenchRow } =>
        candidate.row !== undefined &&
        evaluateModelEligibility(candidate.model).isTracked,
    )
    .sort(compareCandidates);

  if (candidates.length < limit) {
    throw new Error(
      `LiveBench catalog requires ${limit} eligible models; found ${candidates.length}`,
    );
  }

  const curated = candidates.filter(({ model }) =>
    CURATED_PUBLISHED_MODEL_SLUGS.has(model.slug),
  );
  const selectedCurated = curated.slice(0, limit);
  const remaining = candidates.filter(
    ({ model }) => !CURATED_PUBLISHED_MODEL_SLUGS.has(model.slug),
  );
  return [
    ...selectedCurated,
    ...remaining.slice(0, limit - selectedCurated.length),
  ]
    .sort(compareCandidates)
    .map(({ model }) => model);
}
