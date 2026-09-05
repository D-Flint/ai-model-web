import { CANONICAL_MODELS } from '../data/canonicalModels';
import type { CanonicalModelConfig } from './types';

export class ModelAliasResolver {
  private openRouterMap = new Map<string, CanonicalModelConfig>();
  private lmarenaMap = new Map<string, CanonicalModelConfig>();
  private swebenchMap = new Map<string, CanonicalModelConfig>();
  private slugMap = new Map<string, CanonicalModelConfig>();

  constructor(models: CanonicalModelConfig[] = CANONICAL_MODELS) {
    for (const model of models) {
      this.slugMap.set(model.slug.toLowerCase(), model);
      this.slugMap.set(model.name.toLowerCase(), model);

      if (model.openRouterId) {
        this.openRouterMap.set(model.openRouterId.toLowerCase(), model);
      }

      for (const alias of model.lmarenaAliases) {
        this.lmarenaMap.set(alias.toLowerCase().trim(), model);
      }

      for (const alias of model.swebenchAliases) {
        this.swebenchMap.set(alias.toLowerCase().trim(), model);
      }
    }
  }

  /**
   * Resolves an external identifier to a canonical model.
   * Does NOT use fuzzy/fragile guessing. Only exact or explicit normalized aliases.
   */
  resolve(
    source: 'openrouter' | 'lmarena' | 'swebench' | 'canonical',
    identifier: string,
  ): CanonicalModelConfig | null {
    if (!identifier || typeof identifier !== 'string') return null;
    const normalized = identifier.toLowerCase().trim();

    switch (source) {
      case 'openrouter':
        return this.openRouterMap.get(normalized) ?? null;
      case 'lmarena':
        return this.lmarenaMap.get(normalized) ?? null;
      case 'swebench': {
        const direct = this.swebenchMap.get(normalized);
        if (direct) return direct;
        // Check if normalized identifier matches any alias directly
        for (const [alias, model] of this.swebenchMap.entries()) {
          if (alias === normalized) return model;
        }
        return null;
      }
      case 'canonical':
        return this.slugMap.get(normalized) ?? null;
      default:
        return null;
    }
  }

  /**
   * Generates rows to populate the model_aliases database table.
   */
  getDatabaseAliasRows(): Array<{
    id: string;
    modelId: string;
    sourceName: string;
    sourceModelId: string;
    alias: string;
  }> {
    const rows: Array<{
      id: string;
      modelId: string;
      sourceName: string;
      sourceModelId: string;
      alias: string;
    }> = [];

    for (const model of CANONICAL_MODELS) {
      // OpenRouter alias
      if (model.openRouterId) {
        rows.push({
          id: `${model.slug}-openrouter-${model.openRouterId.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          modelId: model.slug,
          sourceName: 'openrouter',
          sourceModelId: model.openRouterId,
          alias: model.name,
        });
      }

      // LMArena aliases
      for (const alias of model.lmarenaAliases) {
        rows.push({
          id: `${model.slug}-lmarena-${alias.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          modelId: model.slug,
          sourceName: 'lmarena',
          sourceModelId: alias,
          alias,
        });
      }

      // SWE-bench aliases
      for (const alias of model.swebenchAliases) {
        rows.push({
          id: `${model.slug}-swebench-${alias.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
          modelId: model.slug,
          sourceName: 'swebench',
          sourceModelId: alias,
          alias,
        });
      }
    }

    return rows;
  }
}

export const defaultAliasResolver = new ModelAliasResolver();
