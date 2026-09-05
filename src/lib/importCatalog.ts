import { catalogSchema, type CatalogModel } from './catalogSchema';
import { composite, normalize } from './decision';
import { capabilitySchema } from './catalogSchema';
import type { Capability } from '../data/config';

/** Validate internal consistency as well as shape. This does not verify external truth. */
export function validateCatalog(value: unknown): CatalogModel[] {
  const catalog = catalogSchema.parse(value);
  for (const model of catalog) {
    for (const key of Object.keys(capabilitySchema.shape) as Capability[]) {
      const evidence = model.evidence.filter((e) => e.metric === key);
      for (const e of evidence) {
        if (normalize(e.raw, e.min, e.max) !== e.normalized)
          throw new Error(`Inconsistent normalization: ${model.slug}/${key}`);
      }
      if (evidence.length > 0) {
        const average = Math.round(
          evidence.reduce((sum, e) => sum + e.normalized, 0) / evidence.length,
        );
        if (model.scores[key] !== average)
          throw new Error(
            `Score does not match evidence: ${model.slug}/${key}`,
          );
      } else {
        if (model.scores[key] !== null)
          throw new Error(
            `Missing evidence for non-null score: ${model.slug}/${key}`,
          );
      }
    }
    const expectedOverall = composite(model.scores);
    if (expectedOverall !== model.scores.overall)
      throw new Error(`Overall mismatch: ${model.slug}`);
    if (model.dataKind === 'mock' && model.confidence !== 0)
      throw new Error('Mock evidence cannot establish confidence');
    if (model.facts.maxOutput > model.facts.context)
      throw new Error('Maximum output exceeds context');
  }
  return catalog;
}
