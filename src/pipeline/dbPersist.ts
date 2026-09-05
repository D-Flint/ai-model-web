import { connectDatabase } from '../db/client';
import {
  providers,
  models,
  modelPricing,
  sources,
  modelScores,
} from '../db/schema/index';
import {
  benchmarkResults,
  scoreHistory,
  catalogSnapshots,
} from '../db/schema/evidence';
import { modelAliases } from '../db/schema/aliases';
import { PROVIDERS_CONFIG } from '../data/canonicalModels';
import { defaultAliasResolver } from './aliasResolver';
import type { CatalogModel } from '../lib/catalogSchema';
import type { BenchmarkMeasurement } from './types';
import { createHash } from 'node:crypto';

export async function persistIngestionToDatabase(options: {
  catalog: CatalogModel[];
  measurements: BenchmarkMeasurement[];
  databaseUrl?: string;
}): Promise<void> {
  const { catalog, measurements, databaseUrl } = options;
  const connection = connectDatabase(databaseUrl);

  try {
    console.log('Persisting ingestion to PostgreSQL database...');

    // 1. Providers
    for (const p of PROVIDERS_CONFIG) {
      await connection.db
        .insert(providers)
        .values({
          id: p.id,
          slug: p.slug,
          name: p.name,
          website: p.website,
          description: p.description,
        })
        .onConflictDoUpdate({
          target: providers.id,
          set: {
            name: p.name,
            website: p.website,
            description: p.description,
          },
        });
    }

    // 2. Sources
    const allSources = new Map<
      string,
      {
        id: string;
        name: string;
        url: string;
        sourceType: string;
        publisher: string;
        retrievedAt: Date;
      }
    >();

    for (const model of catalog) {
      for (const s of model.sources) {
        allSources.set(s.id, {
          id: s.id,
          name: s.name,
          url: s.url,
          sourceType: s.kind,
          publisher: s.publisher,
          retrievedAt: new Date(s.retrievedAt),
        });
      }
    }

    for (const s of allSources.values()) {
      await connection.db
        .insert(sources)
        .values(s)
        .onConflictDoUpdate({
          target: sources.id,
          set: {
            name: s.name,
            url: s.url,
            sourceType: s.sourceType,
            publisher: s.publisher,
            retrievedAt: s.retrievedAt,
          },
        });
    }

    // 3. Models
    for (const model of catalog) {
      const provider = PROVIDERS_CONFIG.find(
        (p) => p.name.toLowerCase() === model.provider.toLowerCase(),
      );
      const providerId = provider ? provider.id : 'anthropic';

      await connection.db
        .insert(models)
        .values({
          id: model.slug,
          slug: model.slug,
          name: model.name,
          providerId,
          family: model.family,
          releaseDate: model.facts.releaseDate,
          status: 'active',
          description: model.description,
          contextWindow: model.facts.context,
          maxOutputTokens: model.facts.maxOutput,
          supportsVision: model.facts.vision,
          supportsAudio: model.facts.audio,
          supportsTools: model.facts.tools,
          supportsStructuredOutput: model.facts.structured,
          openWeights: model.facts.openWeights,
          apiAvailable: model.facts.api,
          lastVerifiedAt: new Date(model.lastVerifiedAt ?? Date.now()),
        })
        .onConflictDoUpdate({
          target: models.id,
          set: {
            name: model.name,
            family: model.family,
            releaseDate: model.facts.releaseDate,
            description: model.description,
            contextWindow: model.facts.context,
            maxOutputTokens: model.facts.maxOutput,
            supportsVision: model.facts.vision,
            supportsAudio: model.facts.audio,
            supportsTools: model.facts.tools,
            supportsStructuredOutput: model.facts.structured,
            openWeights: model.facts.openWeights,
            lastVerifiedAt: new Date(model.lastVerifiedAt ?? Date.now()),
            updatedAt: new Date(),
          },
        });

      // 4. Model Pricing
      await connection.db
        .insert(modelPricing)
        .values({
          id: `pricing-${model.slug}`,
          modelId: model.slug,
          providerName: model.provider,
          inputPerMillion: model.pricing.input.toString(),
          outputPerMillion: model.pricing.output.toString(),
          cachedInputPerMillion: model.pricing.cached?.toString() ?? null,
          currency: model.pricing.currency,
          sourceId: model.pricing.sourceId,
          unit: model.pricing.unit,
          effectiveFrom: model.pricing.updatedAt,
          lastVerifiedAt: new Date(model.lastVerifiedAt ?? Date.now()),
        })
        .onConflictDoUpdate({
          target: modelPricing.id,
          set: {
            inputPerMillion: model.pricing.input.toString(),
            outputPerMillion: model.pricing.output.toString(),
            cachedInputPerMillion: model.pricing.cached?.toString() ?? null,
            effectiveFrom: model.pricing.updatedAt,
            lastVerifiedAt: new Date(model.lastVerifiedAt ?? Date.now()),
            updatedAt: new Date(),
          },
        });

      // 5. Model Scores
      await connection.db
        .insert(modelScores)
        .values({
          modelId: model.slug,
          overall: model.scores.overall,
          intelligence: model.scores.intelligence,
          coding: model.scores.coding,
          agentic: model.scores.agentic,
          dailyUse: model.scores.dailyUse,
          research: model.scores.research,
          writing: model.scores.writing,
          vision: model.scores.vision,
          speed: model.scores.speed,
          reliability: model.scores.reliability,
          costEfficiency: model.scores.costEfficiency,
          confidence: model.confidence,
          methodologyVersion: model.methodology,
          scoreUpdatedAt: new Date(model.scoreUpdatedAt),
          evidenceIds: model.evidence.map(
            (e, i) => `${model.slug}-${e.metric}-${i}`,
          ),
        })
        .onConflictDoUpdate({
          target: modelScores.modelId,
          set: {
            overall: model.scores.overall,
            intelligence: model.scores.intelligence,
            coding: model.scores.coding,
            agentic: model.scores.agentic,
            dailyUse: model.scores.dailyUse,
            research: model.scores.research,
            writing: model.scores.writing,
            vision: model.scores.vision,
            speed: model.scores.speed,
            reliability: model.scores.reliability,
            costEfficiency: model.scores.costEfficiency,
            confidence: model.confidence,
            methodologyVersion: model.methodology,
            scoreUpdatedAt: new Date(model.scoreUpdatedAt),
          },
        });

      // 6. Score History
      for (const [metric, value] of Object.entries(model.scores)) {
        await connection.db.insert(scoreHistory).values({
          id: `${model.slug}-${metric}-${Date.now()}`,
          modelId: model.slug,
          metric,
          value,
          confidence: model.confidence,
          methodology: model.methodology,
          evidenceIds: [model.pricing.sourceId],
          calculatedAt: new Date(model.scoreUpdatedAt),
        });
      }
    }

    // 7. Model Aliases
    const aliasRows = defaultAliasResolver.getDatabaseAliasRows();
    for (const a of aliasRows) {
      await connection.db.insert(modelAliases).values(a).onConflictDoNothing();
    }

    // 8. Benchmark Results
    for (const m of measurements) {
      await connection.db
        .insert(benchmarkResults)
        .values({
          id: m.id,
          modelId: m.modelSlug,
          sourceId: m.sourceId,
          benchmark: m.benchmarkName,
          metric: m.category,
          rawValue: m.rawScore.toString(),
          normalizedScore: m.normalizedScore,
          scaleMin: m.minScale.toString(),
          scaleMax: m.maxScale.toString(),
          rank: m.rank,
          sampleCount: m.sampleCount,
          confidenceLow: m.confidenceLow?.toString() ?? null,
          confidenceHigh: m.confidenceHigh?.toString() ?? null,
          harness: m.harness,
          evaluationDate: m.evaluationDate,
          metadataJson: m.metadata,
          measuredAt: new Date(m.evaluationDate),
        })
        .onConflictDoNothing();
    }

    // 9. Catalog Snapshot
    const serialized = JSON.stringify(catalog);
    const hash = createHash('sha256').update(serialized).digest('hex');
    await connection.db
      .insert(catalogSnapshots)
      .values({
        id: crypto.randomUUID(),
        sha256: hash,
        dataKind: 'verified',
        catalog,
        importedAt: new Date(),
      })
      .onConflictDoNothing();

    console.log('Successfully persisted catalog and evidence to database.');
  } finally {
    await connection.close();
  }
}
