import type { CatalogModel } from './catalogSchema';
import { getMostUsedOpenRouterModels } from '../data/openrouterRankings';

export interface SeoComparisonPair {
  slug: string;
  a: CatalogModel;
  b: CatalogModel;
}

/**
 * Priority model slugs to prioritize for SEO comparison static generation.
 */
export const TOP_SEO_MODEL_SLUGS: readonly string[] = [
  'gpt-6-astra',
  'claude-sonnet-5',
  'claude-opus-5',
  'gemini-2-5-pro',
  'gemini-3-8-flash',
  'gemini-3-7-flash',
  'gpt-5-6-sol',
  'gpt-5-6-luna',
  'deepseek-v4-pro',
  'deepseek-v4-flash',
  'kimi-k3',
  'glm-5-3-flash',
  'hy4-preview',
  'gemma-4',
  'claude-3-5-sonnet-20241022',
  'o1',
  'gpt-4o',
  // Fallback mock fixture slugs
  'quill-pro',
  'orbit-ultra',
  'nova-reason',
  'quill-air',
  'orbit-flash',
  'tide-fast',
];

/**
 * Curated key rivalries that must be generated for SEO when both models exist.
 */
export const CURATED_SEO_PAIRS: readonly [string, string][] = [
  ['claude-sonnet-5', 'gemini-2-5-pro'],
  ['gpt-6-astra', 'claude-sonnet-5'],
  ['gpt-6-astra', 'claude-opus-5'],
  ['gpt-6-astra', 'gemini-2-5-pro'],
  ['gpt-6-astra', 'hy4-preview'],
  ['claude-sonnet-5', 'gpt-5-6-sol'],
  ['gemini-3-8-flash', 'glm-5-3-flash'],
  ['deepseek-v4-pro', 'claude-sonnet-5'],
  ['deepseek-v4-pro', 'gpt-6-astra'],
  ['claude-opus-5', 'gemini-2-5-pro'],
  ['claude-sonnet-5', 'deepseek-v4-flash'],
  ['gpt-5-6-sol', 'gpt-5-6-luna'],
  ['gemini-3-7-flash', 'gemini-3-8-flash'],
  // Mock fixtures fallback pairs
  ['quill-pro', 'orbit-ultra'],
  ['quill-air', 'orbit-flash'],
  ['nova-reason', 'tide-fast'],
];

/**
 * Returns a bounded, curated list of high-value pairwise comparisons for static SEO pages.
 * Arbitrary comparisons outside this set are served via client-side /compare?models=...
 */
export function getSeoComparisonPairs(
  catalogModels: CatalogModel[],
  maxPairs = 100,
): SeoComparisonPair[] {
  const modelMap = new Map<string, CatalogModel>(
    catalogModels.map((m) => [m.slug, m]),
  );

  const candidateSlugs = new Set<string>();

  // 1. Slugs from priority list
  for (const slug of TOP_SEO_MODEL_SLUGS) {
    if (modelMap.has(slug)) {
      candidateSlugs.add(slug);
    }
  }

  // 2. Slugs from top OpenRouter token usage
  const topOrModels = getMostUsedOpenRouterModels(catalogModels, 10);
  for (const item of topOrModels) {
    candidateSlugs.add(item.model.slug);
  }

  // 3. Fallback: ensure at least the first 6 catalog models are candidates
  for (const m of catalogModels.slice(0, 6)) {
    candidateSlugs.add(m.slug);
  }

  const topModels = Array.from(candidateSlugs)
    .map((slug) => modelMap.get(slug)!)
    .filter(Boolean);

  const seenKeys = new Set<string>();
  const pairs: SeoComparisonPair[] = [];

  function tryAddPair(a: CatalogModel, b: CatalogModel): boolean {
    if (a.slug === b.slug) return false;
    const sortedKey = [a.slug, b.slug].sort().join('-vs-');
    if (seenKeys.has(sortedKey)) return false;
    seenKeys.add(sortedKey);
    pairs.push({
      slug: `${a.slug}-vs-${b.slug}`,
      a,
      b,
    });
    return true;
  }

  // Add curated rivalries first
  for (const [slugA, slugB] of CURATED_SEO_PAIRS) {
    const a = modelMap.get(slugA);
    const b = modelMap.get(slugB);
    if (a && b) {
      tryAddPair(a, b);
    }
  }

  // Add default homepage featured pairs if available
  if (catalogModels.length >= 6) {
    tryAddPair(catalogModels[0], catalogModels[1]);
    tryAddPair(catalogModels[3], catalogModels[4]);
    tryAddPair(catalogModels[2], catalogModels[5]);
  }

  // Generate combinations among top models up to maxPairs
  const boundedTop = topModels.slice(0, 14);
  for (let i = 0; i < boundedTop.length; i++) {
    for (let j = i + 1; j < boundedTop.length; j++) {
      if (pairs.length >= maxPairs) break;
      tryAddPair(boundedTop[i], boundedTop[j]);
    }
    if (pairs.length >= maxPairs) break;
  }

  return pairs;
}
