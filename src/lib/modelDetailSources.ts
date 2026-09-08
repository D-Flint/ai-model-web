import type { CatalogModel } from './catalogSchema';

export interface ModelDetailSource {
  name: string;
  url: string;
  retrievedAt: string;
  coverage: string[];
}

interface ModelDetailSourceOptions {
  hasBenchmarkScores: boolean;
  hasSpeed: boolean;
}

interface SourceCandidate {
  name: string;
  url: string;
  retrievedAt: string;
  coverage: string;
}

function sourceById(
  model: CatalogModel,
  sourceId: string | undefined,
): CatalogModel['sources'][number] | undefined {
  return sourceId
    ? model.sources.find((source) => source.id === sourceId)
    : undefined;
}

function addCatalogSource(
  candidates: SourceCandidate[],
  source: CatalogModel['sources'][number] | undefined,
  coverage: string,
): void {
  if (!source) return;
  candidates.push({
    name: source.name,
    url: source.url,
    retrievedAt: source.retrievedAt,
    coverage,
  });
}

export function getModelDetailSources(
  model: CatalogModel,
  { hasBenchmarkScores, hasSpeed }: ModelDetailSourceOptions,
): ModelDetailSource[] {
  const candidates: SourceCandidate[] = [];

  if (hasBenchmarkScores) {
    const liveBenchSource = model.sources.find(
      (source) =>
        source.id === 'livebench-leaderboard' ||
        source.name.toLowerCase().includes('livebench') ||
        source.publisher.toLowerCase().includes('livebench'),
    );
    addCatalogSource(candidates, liveBenchSource, 'Leaderboard scores');
  }

  if (hasSpeed) {
    const speedSourceId =
      model.facts.speedTokensPerSecRange?.sourceId ?? model.facts.sourceId;
    addCatalogSource(candidates, sourceById(model, speedSourceId), 'Speed');
  }

  const pricingSources =
    model.apiPricing?.tiers.flatMap((tier) =>
      [tier.input, tier.output].flatMap((rate) =>
        rate
          ? [
              {
                name: rate.source.name,
                url: rate.source.url,
                retrievedAt: rate.source.retrievedAt,
                coverage: 'API pricing',
              },
            ]
          : [],
      ),
    ) ?? [];
  candidates.push(...pricingSources);
  if (pricingSources.length === 0) {
    addCatalogSource(
      candidates,
      sourceById(model, model.pricing.sourceId),
      'API pricing',
    );
  }

  addCatalogSource(
    candidates,
    sourceById(model, model.facts.sourceId),
    'Model facts',
  );
  addCatalogSource(
    candidates,
    sourceById(model, model.facts.contextSourceId),
    'Context window',
  );

  const sources = new Map<string, ModelDetailSource>();
  for (const candidate of candidates) {
    const key = candidate.url.trim().toLowerCase();
    const existing = sources.get(key);
    if (existing) {
      if (!existing.coverage.includes(candidate.coverage)) {
        existing.coverage.push(candidate.coverage);
      }
      if (candidate.retrievedAt > existing.retrievedAt) {
        existing.retrievedAt = candidate.retrievedAt;
      }
      continue;
    }
    sources.set(key, {
      name: candidate.name,
      url: candidate.url,
      retrievedAt: candidate.retrievedAt,
      coverage: [candidate.coverage],
    });
  }

  return [...sources.values()];
}
