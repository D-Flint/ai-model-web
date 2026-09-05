import {
  fetchSweBenchLeaderboard,
  processSweBenchResults,
} from '../src/pipeline/swebench';
import { defaultAliasResolver } from '../src/pipeline/aliasResolver';

async function main() {
  console.log('=== Ingesting SWE-bench Verified Leaderboard ===');
  const rawResults = await fetchSweBenchLeaderboard();
  console.log(`Fetched ${rawResults.length} total SWE-bench Verified entries.`);

  const measurements = processSweBenchResults(rawResults, defaultAliasResolver);
  console.log(`Matched ${measurements.length} canonical models:`);

  console.table(
    measurements.map((m) => ({
      model: m.modelSlug,
      resolved: `${m.rawScore}%`,
      normalizedScore: `${m.normalizedScore} / 100`,
      harness: m.harness,
      date: m.evaluationDate,
      totalRunsFound: m.metadata?.totalRunsFound,
    })),
  );
}

main().catch((err) => {
  console.error('SWE-bench ingestion failed:', err);
  process.exit(1);
});
