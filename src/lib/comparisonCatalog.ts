import slugs from '../data/generated/comparisonSlugs.json';
import { models } from '../data/models';

const activeSlugs =
  Array.isArray(slugs) && slugs.length > 0 ? slugs : models.map((m) => m.slug);

// Initialized once per Worker isolate; full records stay in static assets or memory.
export const comparisonSlugs: ReadonlySet<string> = new Set(activeSlugs);
