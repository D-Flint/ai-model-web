import type { CatalogModel } from './catalogSchema';

export interface ComparisonProviderGroup {
  provider: string;
  models: CatalogModel[];
}

export function groupModelsByProvider(
  models: CatalogModel[],
): ComparisonProviderGroup[] {
  const groups = new Map<string, CatalogModel[]>();

  for (const model of models) {
    const providerModels = groups.get(model.provider) ?? [];
    providerModels.push(model);
    groups.set(model.provider, providerModels);
  }

  return [...groups.entries()]
    .sort(([providerA], [providerB]) => providerA.localeCompare(providerB))
    .map(([provider, providerModels]) => ({
      provider,
      models: [...providerModels].sort(
        (modelA, modelB) =>
          modelA.name.localeCompare(modelB.name) ||
          modelA.slug.localeCompare(modelB.slug),
      ),
    }));
}
