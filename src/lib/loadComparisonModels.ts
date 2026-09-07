import { catalogModelSchema, type CatalogModel } from './catalogSchema';

export interface ComparisonAssets {
  fetch(input: Request): Promise<Response>;
}

/** Two internal asset reads; no runtime database, ranking, or catalog scan. */
export async function loadComparisonModels(
  assets: ComparisonAssets,
  origin: URL,
  slugs: readonly [string, string],
): Promise<[CatalogModel, CatalogModel]> {
  async function load(slug: string): Promise<CatalogModel> {
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Invalid model slug');
    const url = new URL(`/_comparison-data/${slug}.json`, origin);
    const response = await assets.fetch(new Request(url));
    if (!response.ok) throw new Error('Comparison record unavailable');
    const record = catalogModelSchema.parse(await response.json());
    if (record.slug !== slug) throw new Error('Comparison record mismatch');
    return record;
  }
  return Promise.all([load(slugs[0]), load(slugs[1])]);
}
