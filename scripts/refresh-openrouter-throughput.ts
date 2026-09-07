import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  fetchOpenRouterEndpoints,
  fetchOpenRouterModels,
  processOpenRouterModels,
  processOpenRouterThroughput,
} from '../src/pipeline/openrouter';
import { defaultAliasResolver } from '../src/pipeline/aliasResolver';
import { validateCatalog } from '../src/lib/importCatalog';
import type { CatalogModel } from '../src/lib/catalogSchema';

async function main() {
  const rawModels = await fetchOpenRouterModels();
  const extracted = processOpenRouterModels(rawModels, defaultAliasResolver);
  const throughputBySlug = new Map<
    string,
    {
      modelId: string;
      throughput: NonNullable<ReturnType<typeof processOpenRouterThroughput>>;
    }
  >();
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < extracted.length) {
      const item = extracted[nextIndex++];
      try {
        const endpoints = await fetchOpenRouterEndpoints(item.rawModel.id);
        const throughput = processOpenRouterThroughput(endpoints);
        if (throughput) {
          throughputBySlug.set(item.canonicalModel.slug, {
            modelId: item.rawModel.id,
            throughput,
          });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Skipping ${item.rawModel.id}: ${message}`);
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(5, extracted.length) }, () => worker()),
  );

  if (throughputBySlug.size === 0) {
    console.log(
      'OpenRouter returned no public throughput telemetry; catalog unchanged.',
    );
    return;
  }

  const catalog = JSON.parse(
    await readFile(resolve('src/data/verifiedModels.json'), 'utf8'),
  ) as CatalogModel[];
  const retrievedAt = new Date().toISOString().split('T')[0];
  const updated = catalog.map((model) => {
    const result = throughputBySlug.get(model.slug);
    if (!result) return model;
    const { modelId, throughput } = result;

    const [author, ...slugParts] = modelId.split('/');
    const endpointUrl = `https://openrouter.ai/api/v1/models/${encodeURIComponent(author)}/${encodeURIComponent(slugParts.join('/'))}/endpoints`;
    const source = {
      id: throughput.sourceId,
      name: 'OpenRouter endpoint throughput',
      url: endpointUrl,
      retrievedAt,
      kind: 'provider_doc' as const,
      publisher: 'OpenRouter',
    };
    const sources = model.sources.some(
      (candidate) => candidate.id === source.id,
    )
      ? model.sources
      : [...model.sources, source];

    return {
      ...model,
      facts: {
        ...model.facts,
        speedTokensPerSec: throughput.midpoint,
        speedTokensPerSecRange: {
          min: throughput.min,
          max: throughput.max,
          sourceId: throughput.sourceId,
          retrievedAt: throughput.retrievedAt,
        },
      },
      sources,
    };
  });

  validateCatalog(updated);
  await writeFile(
    resolve('src/data/verifiedModels.json'),
    JSON.stringify(updated, null, 2) + '\n',
    'utf8',
  );
  console.log(
    `Saved OpenRouter throughput for ${throughputBySlug.size} matched models (${catalog.length} total).`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
