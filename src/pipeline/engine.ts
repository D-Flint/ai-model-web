import { CANONICAL_MODELS } from '../data/canonicalModels';
import { OFFICIAL_PROVIDER_SPECS } from '../data/officialProviders';
import {
  fetchOpenRouterEndpoints,
  fetchOpenRouterModels,
  processOpenRouterModels,
  processOpenRouterThroughput,
} from './openrouter';
import {
  fetchLMArenaCategory,
  processLMArenaRows,
  LMARENA_CONFIGS,
} from './lmarena';
import { fetchSweBenchLeaderboard, processSweBenchResults } from './swebench';
import {
  buildLiveBenchBenchmark,
  fetchLiveBenchData,
  processLiveBenchResults,
} from './livebench';
import { fetchBfclLeaderboard, processBfclResults } from './bfcl';
import { calculateCostEfficiencyScore } from './normalization';
import { calculateConfidence } from './confidence';
import { defaultAliasResolver } from './aliasResolver';
import { normalize } from '../lib/decision';
import { validateCatalog } from '../lib/importCatalog';
import type { CatalogModel } from '../lib/catalogSchema';
import type { Capability } from '../data/config';
import type { BenchmarkMeasurement, ModelBenchmarks } from './types';
import { methodologyVersion, speedScoreMaxTokensPerSec } from '../data/config';

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

async function fetchOpenRouterThroughputByModel(
  extracted: ReturnType<typeof processOpenRouterModels>,
  apiKey: string | undefined,
  errors: string[],
): Promise<Map<string, ReturnType<typeof processOpenRouterThroughput>>> {
  const results = new Map<
    string,
    ReturnType<typeof processOpenRouterThroughput>
  >();
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < extracted.length) {
      const item = extracted[nextIndex++];
      try {
        const permaslug = item.rawModel.canonical_slug || item.rawModel.id;
        const endpoints = await fetchOpenRouterEndpoints(item.rawModel.id, {
          apiKey,
          permaslug,
        });
        const throughput = processOpenRouterThroughput(endpoints);
        if (throughput) results.set(item.canonicalModel.slug, throughput);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`OpenRouter throughput (${item.rawModel.id}): ${msg}`);
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(5, extracted.length) }, () => worker()),
  );
  return results;
}

export async function runIngestionPipeline(
  options: IngestionOptions = {},
): Promise<IngestionPipelineResult> {
  const errors: string[] = [];
  const today = new Date().toISOString().split('T')[0];

  // 1. OpenRouter (Fallback / Discovery only)
  let openRouterExtracted: ReturnType<typeof processOpenRouterModels> = [];
  let openRouterThroughputByModel = new Map<
    string,
    ReturnType<typeof processOpenRouterThroughput>
  >();
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
      openRouterThroughputByModel = await fetchOpenRouterThroughputByModel(
        openRouterExtracted,
        options.openRouterApiKey ?? process.env.OPENROUTER_API_KEY,
        errors,
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
  let liveBenchRows: Awaited<ReturnType<typeof fetchLiveBenchData>> = [];
  let liveBenchMeasurements: BenchmarkMeasurement[] = [];
  if (!options.skipLiveBench) {
    try {
      console.log('Ingesting LiveBench dataset...');
      liveBenchRows = await fetchLiveBenchData();
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

  // Group latest LiveBench rows by canonical model slug
  const liveBenchBySlug = new Map<string, (typeof liveBenchRows)[0]>();
  for (const row of liveBenchRows) {
    const canonical = defaultAliasResolver.resolve('livebench', row.model);
    if (canonical) {
      const existing = liveBenchBySlug.get(canonical.slug);
      const rowDate = row.date ?? '';
      const existingDate = existing?.date ?? '';
      if (
        !existing ||
        rowDate > existingDate ||
        (rowDate === existingDate &&
          row.global_average > existing.global_average)
      ) {
        liveBenchBySlug.set(canonical.slug, row);
      }
    }
  }

  // Index other discrete benchmark runs by model slug
  const sweBenchBySlug = new Map<string, (typeof sweBenchMeasurements)[0]>();
  for (const m of sweBenchMeasurements) {
    const existing = sweBenchBySlug.get(m.modelSlug);
    if (!existing || m.rawScore > existing.rawScore) {
      sweBenchBySlug.set(m.modelSlug, m);
    }
  }

  const bfclBySlug = new Map<string, (typeof bfclMeasurements)[0]>();
  for (const m of bfclMeasurements) {
    const existing = bfclBySlug.get(m.modelSlug);
    if (!existing || m.rawScore > existing.rawScore) {
      bfclBySlug.set(m.modelSlug, m);
    }
  }

  const lmarenaBySlug = new Map<string, (typeof allLMArenaMeasurements)[0]>();
  for (const m of allLMArenaMeasurements) {
    const existing = lmarenaBySlug.get(m.modelSlug);
    if (!existing || m.rawScore > existing.rawScore) {
      lmarenaBySlug.set(m.modelSlug, m);
    }
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

    // Official provider documentation WINS for pricing
    const inputPrice = officialSpec.officialPricing.input ?? null;
    const outputPrice = officialSpec.officialPricing.output ?? null;
    const cachedPrice = officialSpec.officialPricing.cached ?? null;

    const pricing = {
      input: inputPrice,
      output: outputPrice,
      cached: cachedPrice,
      currency: 'USD' as const,
      unit: 'per-million-tokens' as const,
      sourceId: `source-${canonical.providerSlug}`,
      updatedAt: officialSpec.lastVerifiedAt || today,
      inputPer1M: inputPrice,
      outputPer1M: outputPrice,
      cachedInputPer1M: cachedPrice,
      provenanceUrl: officialSpec.sourceUrl,
      verifiedAt: officialSpec.lastVerifiedAt || today,
    };

    // Calculate Cost Efficiency (Value Score)
    const costEff =
      inputPrice !== null && outputPrice !== null
        ? calculateCostEfficiencyScore(inputPrice, outputPrice)
        : null;

    const costEvidence: BenchmarkMeasurement | null = costEff
      ? {
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
        }
      : null;

    const openRouterThroughput = openRouterThroughputByModel.get(
      canonical.slug,
    );
    const speedEvidence: BenchmarkMeasurement[] = openRouterThroughput
      ? [
          {
            id: `openrouter-speed-${canonical.slug}`,
            modelSlug: canonical.slug,
            benchmarkName: 'OpenRouter recent throughput',
            category: 'speed',
            rawScore: openRouterThroughput.midpoint,
            minScale: 0,
            maxScale: speedScoreMaxTokensPerSec,
            normalizedScore: Math.min(
              100,
              Math.round(
                (openRouterThroughput.midpoint / speedScoreMaxTokensPerSec) *
                  100,
              ),
            ),
            evaluationDate: openRouterThroughput.retrievedAt,
            sourceId: openRouterThroughput.sourceId,
            sourceName: 'OpenRouter recent throughput',
            sourceUrl: 'https://openrouter.ai/api/v1/models',
            retrievedAt: openRouterThroughput.retrievedAt,
          },
        ]
      : [];

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

    // 1. Source-Native LiveBench: deterministic pure calculation
    const lbRow = liveBenchBySlug.get(canonical.slug);
    let livebenchBenchmark: ModelBenchmarks['livebench'] = null;

    if (lbRow) {
      livebenchBenchmark = buildLiveBenchBenchmark(lbRow, today);

      availableSources.set('livebench-leaderboard', {
        id: 'livebench-leaderboard',
        name: 'LiveBench AI Benchmark',
        url: 'https://livebench.ai',
        retrievedAt: livebenchBenchmark.release,
        kind: 'public_eval',
        publisher: 'LiveBench',
      });
    }

    // 2. Discrete container benchmarks
    const matchedSwe = sweBenchBySlug.get(canonical.slug);
    const sweBenchBenchmark = matchedSwe
      ? {
          resolvedRate: matchedSwe.rawScore,
          evaluatedDate: matchedSwe.evaluationDate,
        }
      : null;
    if (matchedSwe) {
      availableSources.set(matchedSwe.sourceId, {
        id: matchedSwe.sourceId,
        name: matchedSwe.sourceName,
        url: matchedSwe.sourceUrl,
        retrievedAt: matchedSwe.retrievedAt,
        kind: 'public_eval',
        publisher: matchedSwe.sourceName,
      });
    }

    const matchedBfcl = bfclBySlug.get(canonical.slug);
    const bfclBenchmark = matchedBfcl
      ? {
          overallAccuracy: matchedBfcl.rawScore,
        }
      : null;
    if (matchedBfcl) {
      availableSources.set(matchedBfcl.sourceId, {
        id: matchedBfcl.sourceId,
        name: matchedBfcl.sourceName,
        url: matchedBfcl.sourceUrl,
        retrievedAt: matchedBfcl.retrievedAt,
        kind: 'public_eval',
        publisher: matchedBfcl.sourceName,
      });
    }

    const matchedLMArena = lmarenaBySlug.get(canonical.slug);
    const lmarenaBenchmark = matchedLMArena
      ? {
          elo: matchedLMArena.rawScore,
          category: (matchedLMArena.metadata?.category as string) ?? 'text',
        }
      : null;
    if (matchedLMArena) {
      availableSources.set(matchedLMArena.sourceId, {
        id: matchedLMArena.sourceId,
        name: matchedLMArena.sourceName,
        url: matchedLMArena.sourceUrl,
        retrievedAt: matchedLMArena.retrievedAt,
        kind: 'public_eval',
        publisher: matchedLMArena.sourceName,
      });
    }

    if (openRouterThroughput) {
      availableSources.set('openrouter-throughput', {
        id: 'openrouter-throughput',
        name: 'OpenRouter recent throughput',
        url: 'https://openrouter.ai/api/frontend/v1/stats/endpoint',
        retrievedAt: openRouterThroughput.retrievedAt,
        kind: 'public_eval',
        publisher: 'OpenRouter',
      });
    }

    if (costEvidence) {
      availableSources.set('astra-cost-engine', {
        id: 'astra-cost-engine',
        name: 'Astra Cost Efficiency Engine',
        url: 'https://github.com/D-Flint/ai-model-web',
        retrievedAt: today,
        kind: 'public_eval',
        publisher: 'Astra Cost Efficiency Engine',
      });
    }

    const benchmarks: ModelBenchmarks = {
      livebench: livebenchBenchmark,
      sweBench: sweBenchBenchmark,
      bfcl: bfclBenchmark,
      lmarena: lmarenaBenchmark,
    };

    // Capability scores object: strictly pure, unblended
    const scores: Record<Capability, number | null> = {
      intelligence:
        livebenchBenchmark?.overall !== null &&
        livebenchBenchmark?.overall !== undefined
          ? normalize(livebenchBenchmark.overall, 0, 100)
          : null,
      coding:
        livebenchBenchmark?.coding !== null &&
        livebenchBenchmark?.coding !== undefined
          ? normalize(livebenchBenchmark.coding, 0, 100)
          : null,
      agentic:
        livebenchBenchmark?.agenticCoding !== null &&
        livebenchBenchmark?.agenticCoding !== undefined
          ? normalize(livebenchBenchmark.agenticCoding, 0, 100)
          : null,
      dailyUse: null,
      research: null,
      writing: null,
      vision: null,
      speed: null,
      reliability: null,
      costEfficiency: costEff ? costEff.normalized : null,
    };

    if (openRouterThroughput) {
      scores.speed = Math.min(
        100,
        Math.round(
          (openRouterThroughput.midpoint / speedScoreMaxTokensPerSec) * 100,
        ),
      );
    }

    // Deterministic LiveBench Overall
    const overall =
      livebenchBenchmark?.overall !== null &&
      livebenchBenchmark?.overall !== undefined
        ? normalize(livebenchBenchmark.overall, 0, 100)
        : null;

    // Capability evidence array: strictly aligned with non-null scores
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

    if (livebenchBenchmark) {
      if (scores.intelligence !== null && livebenchBenchmark.overall !== null) {
        evidenceList.push({
          metric: 'intelligence',
          kind: 'benchmark',
          raw: livebenchBenchmark.overall,
          min: 0,
          max: 100,
          normalized: scores.intelligence,
          sourceId: 'livebench-leaderboard',
          updatedAt: livebenchBenchmark.release,
        });
      }
      if (scores.coding !== null && livebenchBenchmark.coding !== null) {
        evidenceList.push({
          metric: 'coding',
          kind: 'benchmark',
          raw: livebenchBenchmark.coding,
          min: 0,
          max: 100,
          normalized: scores.coding,
          sourceId: 'livebench-leaderboard',
          updatedAt: livebenchBenchmark.release,
        });
      }
      if (
        scores.agentic !== null &&
        livebenchBenchmark.agenticCoding !== null
      ) {
        evidenceList.push({
          metric: 'agentic',
          kind: 'benchmark',
          raw: livebenchBenchmark.agenticCoding,
          min: 0,
          max: 100,
          normalized: scores.agentic,
          sourceId: 'livebench-leaderboard',
          updatedAt: livebenchBenchmark.release,
        });
      }
    }

    if (scores.speed !== null && speedEvidence.length > 0) {
      evidenceList.push({
        metric: 'speed',
        kind: 'benchmark',
        raw: speedEvidence[0].rawScore,
        min: speedEvidence[0].minScale,
        max: speedEvidence[0].maxScale,
        normalized: speedEvidence[0].normalizedScore,
        sourceId: speedEvidence[0].sourceId,
        updatedAt: speedEvidence[0].evaluationDate,
      });
    }

    if (scores.costEfficiency !== null && costEvidence) {
      evidenceList.push({
        metric: 'costEfficiency',
        kind: 'benchmark',
        raw: costEvidence.rawScore,
        min: costEvidence.minScale,
        max: costEvidence.maxScale,
        normalized: costEvidence.normalizedScore,
        sourceId: costEvidence.sourceId,
        updatedAt: costEvidence.evaluationDate,
      });
    }

    // Confidence calculation based on verified external evidence
    const distinctCategories = new Set(evidenceList.map((e) => e.metric));
    const confidenceVal = calculateConfidence({
      independentSourcesCount: availableSources.size,
      coveredCategoriesCount: distinctCategories.size,
      totalCategoriesCount: 10,
      totalSampleCount: 1000,
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
      roles: officialSpec.roles ?? canonical.roles,
      facts: {
        context: officialSpec.contextWindow,
        contextWindow: officialSpec.contextWindow,
        maxOutput: officialSpec.maxOutputTokens,
        speedTokensPerSec:
          openRouterThroughput?.midpoint ??
          officialSpec.speedTokensPerSec ??
          null,
        speedTokensPerSecRange: openRouterThroughput
          ? {
              min: openRouterThroughput.min,
              max: openRouterThroughput.max,
              providerCount: openRouterThroughput.providerCount,
              sourceId: openRouterThroughput.sourceId,
              retrievedAt: openRouterThroughput.retrievedAt,
            }
          : null,
        vision: officialSpec.supportsVision,
        supportsVision: officialSpec.supportsVision,
        audio: officialSpec.supportsAudio,
        tools: officialSpec.supportsTools,
        supportsTools: officialSpec.supportsTools,
        structured: officialSpec.supportsStructuredOutput,
        api: officialSpec.apiAvailable,
        openWeights: canonical.openWeights,
        isOpenWeights: canonical.openWeights,
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
      benchmarks,
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
