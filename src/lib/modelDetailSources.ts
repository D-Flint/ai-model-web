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
  benchmarkCoverage?: string[];
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

function addPriceSource(
  candidates: SourceCandidate[],
  rate: {
    source: {
      name: string;
      url: string;
      retrievedAt: string;
    };
  } | null,
  coverage: string,
): void {
  if (!rate) return;
  candidates.push({ ...rate.source, coverage });
}

export function getModelDetailSources(
  model: CatalogModel,
  { hasBenchmarkScores, hasSpeed, benchmarkCoverage }: ModelDetailSourceOptions,
): ModelDetailSource[] {
  const candidates: SourceCandidate[] = [];

  if (hasBenchmarkScores) {
    const liveBenchSource = model.sources.find(
      (source) =>
        source.id === 'livebench-leaderboard' ||
        source.name.toLowerCase().includes('livebench') ||
        source.publisher.toLowerCase().includes('livebench'),
    );
    for (const metric of benchmarkCoverage ?? ['Leaderboard scores']) {
      addCatalogSource(candidates, liveBenchSource, metric);
    }
  }

  if (hasSpeed) {
    const speedSourceId =
      model.facts.speedTokensPerSecRange?.sourceId ?? model.facts.sourceId;
    addCatalogSource(candidates, sourceById(model, speedSourceId), 'Speed');
  }

  const pricingCandidates: SourceCandidate[] = [];
  for (const tier of model.apiPricing?.tiers ?? []) {
    addPriceSource(pricingCandidates, tier.input, 'Input price');
    addPriceSource(pricingCandidates, tier.output, 'Output price');
    addPriceSource(pricingCandidates, tier.cached, 'Cached input price');
  }
  for (const period of model.apiPricing?.periods ?? []) {
    addPriceSource(pricingCandidates, period.input, 'Input price');
    addPriceSource(pricingCandidates, period.output, 'Output price');
    addPriceSource(pricingCandidates, period.cached, 'Cached input price');
  }
  candidates.push(...pricingCandidates);
  if (pricingCandidates.length === 0) {
    const pricingSource = sourceById(model, model.pricing.sourceId);
    if (model.pricing.input !== null) {
      addCatalogSource(candidates, pricingSource, 'Input price');
    }
    if (model.pricing.output !== null) {
      addCatalogSource(candidates, pricingSource, 'Output price');
    }
    if (model.pricing.cached !== null) {
      addCatalogSource(candidates, pricingSource, 'Cached input price');
    }
  }

  addCatalogSource(
    candidates,
    sourceById(model, model.facts.sourceId),
    'Release date',
  );
  addCatalogSource(
    candidates,
    sourceById(model, model.facts.sourceId),
    'Modalities',
  );
  addCatalogSource(
    candidates,
    sourceById(model, model.facts.sourceId),
    'Reasoning tiers',
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
