import {
  fetchLMArenaCategory,
  processLMArenaRows,
  LMARENA_CONFIGS,
} from '../src/pipeline/lmarena';
import { defaultAliasResolver } from '../src/pipeline/aliasResolver';

async function main() {
  console.log('=== Ingesting LMSYS Chatbot Arena Data ===');

  for (const cfg of LMARENA_CONFIGS) {
    console.log(`\nFetching ${cfg.config} category...`);
    try {
      const rows = await fetchLMArenaCategory(cfg.config);
      const measurements = processLMArenaRows(rows, cfg, defaultAliasResolver);
      console.log(
        `Found ${measurements.length} matching entries for ${cfg.config}:`,
      );
      console.table(
        measurements.map((m) => ({
          model: m.modelSlug,
          benchmark: m.benchmarkName,
          rawScore: m.rawScore,
          normalized: `${m.normalizedScore} / 100`,
          rank: m.rank ?? '-',
          samples: m.sampleCount ?? '-',
          date: m.evaluationDate,
        })),
      );
    } catch (err: unknown) {
      console.error(`Failed to ingest ${cfg.config}:`, err);
    }
  }
}

main().catch((err) => {
  console.error('LMArena ingestion failed:', err);
  process.exit(1);
});
