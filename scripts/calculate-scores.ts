import { runIngestionPipeline } from '../src/pipeline/engine';
import { overallWeights } from '../src/data/config';

async function main() {
  console.log('=== Calculating Real AI Model Scores ===');
  console.log('Scoring weights:');
  for (const [key, weight] of Object.entries(overallWeights)) {
    console.log(`  - ${key}: ${Math.round(weight * 100)}%`);
  }

  const { catalog } = await runIngestionPipeline({ dryRun: true });

  console.log(`\nDerived scores for ${catalog.length} verified models:\n`);
  console.table(
    catalog.map((m) => ({
      Model: m.name,
      Overall: m.scores.overall,
      Intelligence: m.scores.intelligence,
      Coding: m.scores.coding,
      Agentic: m.scores.agentic,
      DailyUse: m.scores.dailyUse,
      Research: m.scores.research,
      Writing: m.scores.writing,
      Vision: m.scores.vision,
      Speed: m.scores.speed,
      CostEff: m.scores.costEfficiency,
      Confidence: `${m.confidence}%`,
    })),
  );
}

main().catch((err) => {
  console.error('Score calculation failed:', err);
  process.exit(1);
});
