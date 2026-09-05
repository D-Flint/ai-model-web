import {
  fetchOpenRouterModels,
  processOpenRouterModels,
} from '../src/pipeline/openrouter';
import { defaultAliasResolver } from '../src/pipeline/aliasResolver';

async function main() {
  console.log('=== Ingesting OpenRouter Data ===');
  const models = await fetchOpenRouterModels();
  console.log(`Fetched ${models.length} raw models from OpenRouter.`);

  const processed = processOpenRouterModels(models, defaultAliasResolver);
  console.log(`Matched ${processed.length} canonical models:`);

  console.table(
    processed.map((p) => ({
      slug: p.canonicalModel.slug,
      name: p.canonicalModel.name,
      context: p.contextWindow,
      inputPerMillion: `$${p.pricing.inputPerMillion}`,
      outputPerMillion: `$${p.pricing.outputPerMillion}`,
      vision: p.supportsVision,
      audio: p.supportsAudio,
    })),
  );
}

main().catch((err) => {
  console.error('OpenRouter ingestion failed:', err);
  process.exit(1);
});
