import { CANONICAL_MODELS } from '../data/canonicalModels';
import { OFFICIAL_PROVIDER_SPECS } from '../data/officialProviders';
import { fetchOpenRouterModels, processOpenRouterModels } from './openrouter';
import {
  fetchLMArenaCategory,
  processLMArenaRows,
  LMARENA_CONFIGS,
} from './lmarena';
import { fetchSweBenchLeaderboard, processSweBenchResults } from './swebench';
import { fetchLiveBenchData, processLiveBenchResults } from './livebench';
import { fetchBfclLeaderboard, processBfclResults } from './bfcl';
import { calculateCostEfficiencyScore } from './normalization';
import { calculateConfidence } from './confidence';
import { defaultAliasResolver } from './aliasResolver';
import { composite } from '../lib/decision';
import { validateCatalog } from '../lib/importCatalog';
import type { CatalogModel } from '../lib/catalogSchema';
import type { Capability } from '../data/config';
import type { BenchmarkMeasurement } from './types';
import { methodologyVersion } from '../data/config';

export interface IngestionOptions {
  skipOpenRouter?: boolean;
  skipLMArena?: boolean;
  skipSweBench?: boolean;
  skipLiveBench?: boolean;
  skipBfcl?: boolean;
  dryRun?: boolean;
  openRouterApiKey?: string;
  hfToken?: string;
}

export interface IngestionPipelineResult {
  catalog: CatalogModel[];
  measurements: BenchmarkMeasurement[];
  sourceStats: {
    openrouterCount: number;
    lmarenaCount: number;
    swebenchCount: number;
    livebenchCount: number;
    bfclCount: number;
  };
  errors: string[];
}

export async function runIngestionPipeline(
  options: IngestionOptions = {},
): Promise<IngestionPipelineResult> {
  const errors: string[] = [];
  const today = new Date().toISOString().split('T')[0];

  // 1. OpenRouter (Fallback / Discovery only)
  let openRouterExtracted: ReturnType<typeof processOpenRouterModels> = [];
  if (!options.skipOpenRouter) {
    try {
      console.log('Fetching OpenRouter models for discovery & fallback...');
      const orRaw = await fetchOpenRouterModels({
        apiKey: options.openRouterApiKey,
      });
      openRouterExtracted = processOpenRouterModels(
        orRaw,
        defaultAliasResolver,
      );
      console.log(
        `Processed ${openRouterExtracted.length} matching OpenRouter models.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `OpenRouter ingestion warning: ${msg}. Continuing with official specs.`,
      );
      errors.push(`OpenRouter: ${msg}`);
    }
  }

  // 2. Ingest LiveBench (Primary source for Intelligence, secondary for Coding)
  let liveBenchMeasurements: BenchmarkMeasurement[] = [];
  if (!options.skipLiveBench) {
    try {
      console.log('Ingesting LiveBench dataset...');
      const liveBenchRows = await fetchLiveBenchData();
      liveBenchMeasurements = processLiveBenchResults(
        liveBenchRows,
        defaultAliasResolver,
      );
      console.log(
        `LiveBench: extracted ${liveBenchMeasurements.length} verified benchmark records.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`LiveBench ingestion warning: ${msg}. Continuing.`);
      errors.push(`LiveBench: ${msg}`);
    }
  }

  // 3. Ingest BFCL (Berkeley Function Calling Leaderboard for Agentic)
  let bfclMeasurements: BenchmarkMeasurement[] = [];
  if (!options.skipBfcl) {
    try {
      console.log('Ingesting BFCL dataset...');
      const bfclRows = await fetchBfclLeaderboard();
      bfclMeasurements = processBfclResults(bfclRows, defaultAliasResolver);
      console.log(
        `BFCL: extracted ${bfclMeasurements.length} verified agentic records.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`BFCL ingestion warning: ${msg}. Continuing.`);
      errors.push(`BFCL: ${msg}`);
    }
  }

  // 4. Ingest SWE-bench Verified (Primary source for Coding)
  let sweBenchMeasurements: BenchmarkMeasurement[] = [];
  if (!options.skipSweBench) {
    try {
      console.log('Fetching SWE-bench Verified leaderboard...');
      const sweRaw = await fetchSweBenchLeaderboard();
      sweBenchMeasurements = processSweBenchResults(
        sweRaw,
        defaultAliasResolver,
      );
      console.log(
        `SWE-bench: extracted ${sweBenchMeasurements.length} matching model runs.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`SWE-bench ingestion warning: ${msg}. Continuing.`);
      errors.push(`SWE-bench: ${msg}`);
    }
  }

  // 5. Ingest LMArena categories (Daily Use: text, Research: search, Vision: vision, Agentic: agent, WebDev: webdev)
  const allLMArenaMeasurements: BenchmarkMeasurement[] = [];
  if (!options.skipLMArena) {
    for (const cfg of LMARENA_CONFIGS) {
      try {
        console.log(`Fetching LMArena dataset for ${cfg.config}...`);
        const rows = await fetchLMArenaCategory(cfg.config, {
          hfToken: options.hfToken,
        });
        const measurements = processLMArenaRows(
          rows,
          cfg,
          defaultAliasResolver,
        );
        allLMArenaMeasurements.push(...measurements);
        console.log(
          `LMArena (${cfg.config}): extracted ${measurements.length} matching benchmarks.`,
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`LMArena (${cfg.config}) warning: ${msg}. Continuing.`);
        errors.push(`LMArena (${cfg.config}): ${msg}`);
      }
    }
  }

  // 6. Combine all external measurements
  const allMeasurements = [
    ...liveBenchMeasurements,
    ...bfclMeasurements,
    ...sweBenchMeasurements,
    ...allLMArenaMeasurements,
  ];

  // Group measurements by model
  const measurementsByModel = new Map<string, BenchmarkMeasurement[]>();
  for (const m of allMeasurements) {
    const list = measurementsByModel.get(m.modelSlug) ?? [];
    list.push(m);
    measurementsByModel.set(m.modelSlug, list);
  }

  // Map OpenRouter data by model slug for discovery fallback
  const openRouterByModel = new Map<string, (typeof openRouterExtracted)[0]>();
  for (const o of openRouterExtracted) {
    openRouterByModel.set(o.canonicalModel.slug, o);
  }

  // 7. Construct verified CatalogModel objects
  const rawCatalog: unknown[] = [];

  for (const canonical of CANONICAL_MODELS) {
    const officialSpec = OFFICIAL_PROVIDER_SPECS[canonical.slug];
    if (!officialSpec) {
      console.warn(
        `Missing official provider spec for canonical model: ${canonical.slug}`,
      );
      continue;
    }

    const modelMeasurements = measurementsByModel.get(canonical.slug) ?? [];

    // Official provider documentation WINS for pricing
    const pricing = {
      input: officialSpec.officialPricing.input,
      output: officialSpec.officialPricing.output,
      cached: officialSpec.officialPricing.cached,
      currency: 'USD' as const,
      unit: 'per-million-tokens' as const,
      sourceId: `source-${canonical.providerSlug}`,
      updatedAt: officialSpec.lastVerifiedAt || today,
    };

    // Calculate Cost Efficiency (Value Score)
    const costEff = calculateCostEfficiencyScore(pricing.input, pricing.output);
    const costEvidence: BenchmarkMeasurement = {
      id: `cost-efficiency-${canonical.slug}`,
      modelSlug: canonical.slug,
      benchmarkName: 'API Cost Efficiency',
      category: 'costEfficiency',
      rawScore: costEff.raw,
      minScale: costEff.min,
      maxScale: costEff.max,
      normalizedScore: costEff.normalized,
      evaluationDate: today,
      sourceId: 'astra-cost-engine',
      sourceName: 'Astra Cost Efficiency Engine',
      sourceUrl: 'https://github.com/D-Flint/ai-model-web',
      retrievedAt: today,
    };

    const combinedMeasurements = [...modelMeasurements, costEvidence];

    // Master sources repository
    const availableSources = new Map<
      string,
      {
        id: string;
        name: string;
        url: string;
        retrievedAt: string;
        kind: 'provider_doc' | 'public_eval' | 'internal_test';
        publisher: string;
      }
    >();

    // Primary official provider doc
    availableSources.set(`source-${canonical.providerSlug}`, {
      id: `source-${canonical.providerSlug}`,
      name: officialSpec.sourceName,
      url: officialSpec.sourceUrl,
      retrievedAt: officialSpec.lastVerifiedAt || today,
      kind: 'provider_doc',
      publisher: canonical.provider,
    });

    // Add benchmark sources if this model has evidence from them
    for (const m of combinedMeasurements) {
      if (!availableSources.has(m.sourceId)) {
        availableSources.set(m.sourceId, {
          id: m.sourceId,
          name: m.sourceName,
          url: m.sourceUrl,
          retrievedAt: m.retrievedAt,
          kind: 'public_eval',
          publisher: m.sourceName,
        });
      }
    }

    // Capability evidence array
    const evidenceList: Array<{
      metric: Capability;
      kind: 'benchmark' | 'internal_test';
      raw: number;
      min: number;
      max: number;
      normalized: number;
      sourceId: string;
      updatedAt: string;
    }> = [];

    // Capability scores object
    const scores: Record<Capability, number | null> = {
      intelligence: null,
      coding: null,
      agentic: null,
      dailyUse: null,
      research: null,
      writing: null,
      vision: null,
      speed: null,
      reliability: null,
      costEfficiency: null,
    };

    const capabilityKeys: Capability[] = [
      'intelligence',
      'coding',
      'agentic',
      'dailyUse',
      'research',
      'writing',
      'vision',
      'speed',
      'reliability',
      'costEfficiency',
    ];

    for (const key of capabilityKeys) {
      const items = combinedMeasurements.filter((m) => m.category === key);

      // If vision is false in official facts, never add vision evidence
      if (key === 'vision' && !officialSpec.supportsVision) {
        scores.vision = null;
        continue;
      }

      if (items.length > 0) {
        for (const item of items) {
          evidenceList.push({
            metric: key,
            kind: 'benchmark',
            raw: item.rawScore,
            min: item.minScale,
            max: item.maxScale,
            normalized: item.normalizedScore,
            sourceId: item.sourceId,
            updatedAt: item.evaluationDate,
          });
        }
        const avg = Math.round(
          items.reduce((sum, item) => sum + item.normalizedScore, 0) /
            items.length,
        );
        scores[key] = avg;
      } else {
        // No approved evidence exists -> store null!
        scores[key] = null;
      }
    }

    const overall = composite(scores);

    // Confidence calculation based on verified external evidence
    const distinctCategories = new Set(evidenceList.map((e) => e.metric));
    const confidenceVal = calculateConfidence({
      independentSourcesCount: availableSources.size,
      coveredCategoriesCount: distinctCategories.size,
      totalCategoriesCount: 10,
      totalSampleCount: combinedMeasurements.reduce(
        (sum, m) => sum + (m.sampleCount ?? 100),
        0,
      ),
      recencyDays: 5,
      hasOfficialVerification: true,
    });

    rawCatalog.push({
      slug: canonical.slug,
      name: canonical.name,
      provider: canonical.provider,
      family: canonical.family,
      dataKind: 'verified',
      description: canonical.description,
      strengths: canonical.strengths,
      weaknesses: canonical.weaknesses,
      tags: canonical.tags,
      facts: {
        context: officialSpec.contextWindow,
        maxOutput: officialSpec.maxOutputTokens,
        speedTokensPerSec: officialSpec.speedTokensPerSec ?? null,
        vision: officialSpec.supportsVision,
        audio: officialSpec.supportsAudio,
        tools: officialSpec.supportsTools,
        structured: officialSpec.supportsStructuredOutput,
        api: officialSpec.apiAvailable,
        openWeights: canonical.openWeights,
        easeOfUse: scores.dailyUse,
        availability: 'Production API',
        releaseDate: officialSpec.releaseDate,
        sourceId: `source-${canonical.providerSlug}`,
        reasoningEffort: officialSpec.reasoningEffort ??
          canonical.reasoningEffort ?? ['none'],
        defaultEffort:
          officialSpec.defaultEffort ?? canonical.defaultEffort ?? 'none',
      },
      pricing,
      scores: {
        ...scores,
        overall,
      },
      evidence: evidenceList,
      confidence: confidenceVal,
      methodology: methodologyVersion,
      scoreUpdatedAt: today,
      lastVerifiedAt: officialSpec.lastVerifiedAt || today,
      sourceUpdatedAt: today,
      sources: Array.from(availableSources.values()),
    });
  }

  // 8. Validate catalog
  const validatedCatalog = validateCatalog(rawCatalog);

  // 9. Sort catalog strictly from newest to oldest release date
  validatedCatalog.sort(
    (a, b) =>
      new Date(b.facts.releaseDate).getTime() -
      new Date(a.facts.releaseDate).getTime(),
  );

  return {
    catalog: validatedCatalog,
    measurements: allMeasurements,
    sourceStats: {
      openrouterCount: openRouterExtracted.length,
      lmarenaCount: allLMArenaMeasurements.length,
      swebenchCount: sweBenchMeasurements.length,
      livebenchCount: liveBenchMeasurements.length,
      bfclCount: bfclMeasurements.length,
    },
    errors,
  };
}
