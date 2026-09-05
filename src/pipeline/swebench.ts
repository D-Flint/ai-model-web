import {
  sweBenchLeaderboardSchema,
  type SweBenchResult,
  type BenchmarkMeasurement,
} from './types';
import { defaultAliasResolver, ModelAliasResolver } from './aliasResolver';
import { normalizeSweBench } from './normalization';

export async function fetchSweBenchLeaderboard(options?: {
  url?: string;
}): Promise<SweBenchResult[]> {
  const url =
    options?.url ||
    'https://raw.githubusercontent.com/swe-bench/swe-bench.github.io/master/data/leaderboards.json';

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Astra-Model-Guide/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(
      `SWE-bench leaderboard fetch failed: HTTP ${response.status} ${response.statusText}`,
    );
  }

  const json = await response.json();
  const parsed = sweBenchLeaderboardSchema.safeParse(json);
  if (!parsed.success) {
    console.error('SWE-bench payload validation failed:', parsed.error.issues);
    throw new Error('SWE-bench payload failed schema validation');
  }

  const verifiedBoard = parsed.data.leaderboards.find(
    (b) => b.name.toLowerCase() === 'verified',
  );
  return verifiedBoard ? verifiedBoard.results : [];
}

export function processSweBenchResults(
  results: SweBenchResult[],
  resolver: ModelAliasResolver = defaultAliasResolver,
): BenchmarkMeasurement[] {
  const retrievedAt = new Date().toISOString().split('T')[0];
  const sourceUrl = 'https://www.swebench.com';

  // Group by canonical model slug to find the top verified standardized run
  const byModel = new Map<string, SweBenchResult[]>();

  for (const item of results) {
    const canonical = resolver.resolve('swebench', item.model_display);
    if (!canonical) continue;

    const list = byModel.get(canonical.slug) ?? [];
    list.push(item);
    byModel.set(canonical.slug, list);
  }

  const measurements: BenchmarkMeasurement[] = [];

  for (const [slug, runs] of byModel.entries()) {
    // Select the best verified run for the model
    runs.sort((a, b) => b.resolved - a.resolved);
    const bestRun = runs[0];

    const {
      normalized,
      min,
      max,
      raw: normalizedRaw,
    } = normalizeSweBench(bestRun.resolved);

    measurements.push({
      id: `swebench-verified-${slug}`,
      modelSlug: slug,
      benchmarkName: 'SWE-bench Verified',
      category: 'coding',
      rawScore: normalizedRaw,
      minScale: min,
      maxScale: max,
      normalizedScore: normalized,
      harness: bestRun.agent || 'Standard SWE-bench Harness',
      evaluationDate: bestRun.date || retrievedAt,
      sourceId: 'swebench-verified',
      sourceName: 'SWE-bench Verified Leaderboard',
      sourceUrl,
      retrievedAt,
      metadata: {
        agentOrg: bestRun.agent_org,
        cost: bestRun.cost,
        site: bestRun.site,
        totalRunsFound: runs.length,
      },
    });
  }

  return measurements;
}
