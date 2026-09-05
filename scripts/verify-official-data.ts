import { CANONICAL_MODELS } from '../src/data/canonicalModels';
import {
  getAllOfficialProviderSpecs,
  verifyAgainstOfficialSpecs,
} from '../src/pipeline/official';
import {
  fetchOpenRouterModels,
  processOpenRouterModels,
} from '../src/pipeline/openrouter';
import { defaultAliasResolver } from '../src/pipeline/aliasResolver';

async function main() {
  console.log('=== Verifying Official Provider Data ===');
  const officialSpecs = getAllOfficialProviderSpecs();
  console.log(
    `Loaded ${officialSpecs.length} official provider specifications.`,
  );

  const openRouterBySlug = new Map<
    string,
    { context: number; input: number; output: number }
  >();
  try {
    const orModels = await fetchOpenRouterModels();
    const processed = processOpenRouterModels(orModels, defaultAliasResolver);
    for (const p of processed) {
      openRouterBySlug.set(p.canonicalModel.slug, {
        context: p.contextWindow,
        input: p.pricing.inputPerMillion,
        output: p.pricing.outputPerMillion,
      });
    }
  } catch {
    console.warn(
      'Could not reach OpenRouter for verification comparison; verifying official specs only.',
    );
  }

  const results = CANONICAL_MODELS.map((model) => {
    const reported = openRouterBySlug.get(model.slug);
    const verification = verifyAgainstOfficialSpecs({
      slug: model.slug,
      reportedContext: reported?.context,
      reportedPricing: reported
        ? { input: reported.input, output: reported.output }
        : undefined,
    });

    return {
      model: model.name,
      slug: model.slug,
      provider: model.provider,
      releaseDate: verification.officialSpec.releaseDate,
      officialContext: `${verification.officialSpec.contextWindow.toLocaleString()} tokens`,
      officialPrice: `$${verification.officialSpec.officialPricing.input} / $${verification.officialSpec.officialPricing.output}`,
      reportedPrice: reported
        ? `$${reported.input} / $${reported.output}`
        : 'N/A',
      verified: verification.isVerified ? 'VERIFIED' : 'DISCREPANCY',
      source: verification.officialSpec.sourceName,
    };
  });

  console.table(results);
}

main().catch((err) => {
  console.error('Official verification failed:', err);
  process.exit(1);
});
