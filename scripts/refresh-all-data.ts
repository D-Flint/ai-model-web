import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runIngestionPipeline } from '../src/pipeline/engine';
import { persistIngestionToDatabase } from '../src/pipeline/dbPersist';

async function main() {
  console.log('====================================================');
  console.log('       Astra AI Model Real Data Pipeline Refresh     ');
  console.log('====================================================\n');

  const startTime = Date.now();
  const { catalog, measurements, sourceStats, errors } =
    await runIngestionPipeline();

  const outputPath = resolve('src/data/verifiedModels.json');
  await writeFile(outputPath, JSON.stringify(catalog, null, 2) + '\n', 'utf8');
  console.log(
    `\n[✓] Saved verified catalog with ${catalog.length} models to: ${outputPath}`,
  );

  if (process.env.DATABASE_URL) {
    try {
      await persistIngestionToDatabase({ catalog, measurements });
      console.log('[✓] Successfully persisted data to PostgreSQL database.');
    } catch (err: unknown) {
      console.error('[!] Database persistence failed:', err);
    }
  } else {
    console.log(
      '[*] Note: DATABASE_URL not set; verified catalog saved to filesystem.',
    );
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n=== Ingestion Summary ===');
  console.log(`Models ingested:       ${catalog.length}`);
  console.log(`OpenRouter matches:    ${sourceStats.openrouterCount}`);
  console.log(`LMArena benchmarks:    ${sourceStats.lmarenaCount}`);
  console.log(`SWE-bench runs:        ${sourceStats.swebenchCount}`);
  console.log(`Pipeline duration:     ${durationSec}s`);

  if (errors.length > 0) {
    console.warn(`Warnings/Errors encountered (${errors.length}):`);
    for (const e of errors) {
      console.warn(`  - ${e}`);
    }
  }

  console.log('\n[✓] Real data refresh complete!');
}

main().catch((err) => {
  console.error('Data pipeline refresh failed:', err);
  process.exit(1);
});
