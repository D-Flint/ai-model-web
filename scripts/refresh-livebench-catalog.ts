import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { composite } from '../src/lib/decision';
import { validateCatalog } from '../src/lib/importCatalog';
import type { CatalogModel } from '../src/lib/catalogSchema';
import { defaultAliasResolver } from '../src/pipeline/aliasResolver';
import { processLiveBenchResults } from '../src/pipeline/livebench';

async function main() {
  const catalog = JSON.parse(
    await readFile(resolve('src/data/verifiedModels.json'), 'utf8'),
  ) as CatalogModel[];
  const rawRows = JSON.parse(
    await readFile(resolve('src/data/livebenchData.json'), 'utf8'),
  ) as unknown[];
  const measurements = processLiveBenchResults(rawRows, defaultAliasResolver);
  const latestByModelMetric = new Map<string, (typeof measurements)[number]>();
  for (const measurement of measurements) {
    const key = `${measurement.modelSlug}:${measurement.category}`;
    const previous = latestByModelMetric.get(key);
    if (
      !previous ||
      measurement.evaluationDate > previous.evaluationDate ||
      (measurement.evaluationDate === previous.evaluationDate &&
        measurement.normalizedScore > previous.normalizedScore)
    ) {
      latestByModelMetric.set(key, measurement);
    }
  }

  const updated = catalog.map((model) => {
    const modelMeasurements = [...latestByModelMetric.entries()]
      .filter(([key]) => key.startsWith(`${model.slug}:`))
      .map(([, measurement]) => measurement);
    if (modelMeasurements.length === 0) return model;

    const measuredMetrics = new Set(modelMeasurements.map((m) => m.category));
    const evidence = model.evidence.filter(
      (item) =>
        !(
          measuredMetrics.has(item.metric) &&
          (item.sourceId === 'livebench-leaderboard' ||
            item.metric === 'agentic')
        ),
    );
    evidence.push(
      ...modelMeasurements.map((measurement) => ({
        metric: measurement.category,
        kind: 'benchmark' as const,
        raw: measurement.rawScore,
        min: measurement.minScale,
        max: measurement.maxScale,
        normalized: measurement.normalizedScore,
        sourceId: measurement.sourceId,
        updatedAt: measurement.evaluationDate,
      })),
    );
    const scores = { ...model.scores };
    for (const metric of measuredMetrics) {
      const categoryEvidence = evidence.filter(
        (item) => item.metric === metric,
      );
      scores[metric] = Math.round(
        categoryEvidence.reduce((sum, item) => sum + item.normalized, 0) /
          categoryEvidence.length,
      );
    }
    const latestDate = modelMeasurements.reduce(
      (latest, measurement) =>
        measurement.evaluationDate > latest
          ? measurement.evaluationDate
          : latest,
      model.scoreUpdatedAt,
    );
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
            retrievedAt: latestDate,
            kind: 'public_eval' as const,
            publisher: 'LiveBench',
          },
        ];

    return {
      ...model,
      scores: { ...scores, overall: composite(scores) },
      evidence,
      sources,
      scoreUpdatedAt: latestDate,
    };
  });

  validateCatalog(updated);
  await writeFile(
    resolve('src/data/verifiedModels.json'),
    JSON.stringify(updated, null, 2) + '\n',
    'utf8',
  );
  console.log(
    `Updated LiveBench capability scores for ${updated.filter((model, index) => model !== catalog[index]).length} catalog models.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
