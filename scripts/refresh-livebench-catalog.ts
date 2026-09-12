import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { normalize } from '../src/lib/decision';
import { validateCatalog } from '../src/lib/importCatalog';
import { defaultAliasResolver } from '../src/pipeline/aliasResolver';
import {
  buildLiveBenchBenchmark,
  fetchLiveBenchData,
} from '../src/pipeline/livebench';
import { curateRecentCatalog } from '../src/lib/livebenchCatalog';

async function main() {
  const catalog = validateCatalog(
    JSON.parse(await readFile(resolve('src/data/verifiedModels.json'), 'utf8')),
  );
  const rows = await fetchLiveBenchData();
  if (!rows.length)
    throw new Error('No LiveBench rows; catalog was not changed');
  const latestRows = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const slug = defaultAliasResolver.resolve('livebench', row.model)?.slug;
    if (!slug) continue;
    const previous = latestRows.get(slug);
    if (
      !previous ||
      (row.date ?? '') > (previous.date ?? '') ||
      (row.date === previous.date &&
        row.global_average > previous.global_average)
    ) {
      latestRows.set(slug, row);
    }
  }
  const updated = catalog.map((model) => {
    const row = latestRows.get(model.slug);
    const livebench = row
      ? buildLiveBenchBenchmark(row, model.scoreUpdatedAt)
      : null;
    const scores = {
      ...model.scores,
      dailyUse: null,
      research: null,
      writing: null,
      vision: null,
      reliability: null,
    };
    const evidence = model.evidence.filter(
      (item) => item.metric === 'speed' || item.metric === 'costEfficiency',
    );
    const metrics = {
      intelligence: livebench?.overall,
      coding: livebench?.coding,
      agentic: livebench?.agenticCoding,
    } as const;
    for (const metric of Object.keys(metrics) as (keyof typeof metrics)[]) {
      const raw = metrics[metric];
      scores[metric] = raw == null ? null : normalize(raw, 0, 100);
      if (raw != null && livebench)
        evidence.push({
          metric,
          kind: 'benchmark',
          raw,
          min: 0,
          max: 100,
          normalized: scores[metric]!,
          sourceId: 'livebench-leaderboard',
          updatedAt: livebench.release,
        });
    }
    scores.overall = scores.intelligence;
    const sources = [...model.sources];
    if (
      livebench &&
      !sources.some((source) => source.id === 'livebench-leaderboard')
    ) {
      sources.push({
        id: 'livebench-leaderboard',
        name: 'LiveBench AI Benchmark',
        url: 'https://livebench.ai',
        retrievedAt: livebench.release,
        kind: 'public_eval',
        publisher: 'LiveBench',
      });
    }
    // Preserve other confidence factors; category coverage contributes 30 / 10 points each.
    const removedCategories =
      new Set(model.evidence.map((item) => item.metric)).size -
      new Set(evidence.map((item) => item.metric)).size;
    return {
      ...model,
      scores,
      evidence,
      sources,
      confidence: Math.max(
        0,
        Math.min(100, model.confidence - removedCategories * 3),
      ),
      facts: { ...model.facts, easeOfUse: null },
      benchmarks: { ...model.benchmarks, livebench },
    };
  });
  const curated = curateRecentCatalog(validateCatalog(updated));
  await writeFile(
    resolve('src/data/verifiedModels.json'),
    JSON.stringify(curated, null, 2) + '\n',
    'utf8',
  );
  console.log(
    `Updated source-native LiveBench benchmarks; retained ${curated.length} models.`,
  );
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
