import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { composite, normalize } from '../src/lib/decision';
import { validateCatalog } from '../src/lib/importCatalog';
import type { CatalogModel } from '../src/lib/catalogSchema';
import { defaultAliasResolver } from '../src/pipeline/aliasResolver';
import { liveBenchRowSchema, type LiveBenchRow } from '../src/pipeline/types';

function dateValue(row: LiveBenchRow): string {
  return row.date ?? '';
}

async function main() {
  const catalog = JSON.parse(
    await readFile(resolve('src/data/verifiedModels.json'), 'utf8'),
  ) as CatalogModel[];
  const rawRows = JSON.parse(
    await readFile(resolve('src/data/livebenchData.json'), 'utf8'),
  ) as unknown[];
  const latestBySlug = new Map<string, LiveBenchRow>();

  for (const rawRow of rawRows) {
    const row = liveBenchRowSchema.parse(rawRow);
    const canonical = defaultAliasResolver.resolve('livebench', row.model);
    if (!canonical) continue;
    const previous = latestBySlug.get(canonical.slug);
    if (
      !previous ||
      dateValue(row) > dateValue(previous) ||
      (dateValue(row) === dateValue(previous) &&
        row.global_average > previous.global_average)
    ) {
      latestBySlug.set(canonical.slug, row);
    }
  }

  const updated = catalog.map((model) => {
    const row = latestBySlug.get(model.slug);
    if (row?.agentic_coding === undefined) return model;

    const normalized = normalize(row.agentic_coding, 0, 100);
    const evidence = model.evidence.filter((item) => item.metric !== 'agentic');
    evidence.push({
      metric: 'agentic',
      kind: 'benchmark',
      raw: row.agentic_coding,
      min: 0,
      max: 100,
      normalized,
      sourceId: 'livebench-leaderboard',
      updatedAt: row.date ?? new Date().toISOString().split('T')[0],
    });
    const scores = {
      ...model.scores,
      agentic: normalized,
    };
    const sources = model.sources.some(
      (source) => source.id === 'livebench-leaderboard',
    )
      ? model.sources
      : [
          ...model.sources,
          {
            id: 'livebench-leaderboard',
            name: 'LiveBench AI Benchmark',
            url: 'https://livebench.ai',
            retrievedAt: row.date ?? new Date().toISOString().split('T')[0],
            kind: 'public_eval' as const,
            publisher: 'LiveBench',
          },
        ];

    return {
      ...model,
      scores: { ...scores, overall: composite(scores) },
      evidence,
      sources,
      scoreUpdatedAt: row.date ?? model.scoreUpdatedAt,
    };
  });

  validateCatalog(updated);
  await writeFile(
    resolve('src/data/verifiedModels.json'),
    JSON.stringify(updated, null, 2) + '\n',
    'utf8',
  );
  console.log(
    `Updated LiveBench Agentic Coding for ${updated.filter((model, index) => model !== catalog[index]).length} catalog models.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
