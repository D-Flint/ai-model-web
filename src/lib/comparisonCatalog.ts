import slugs from '../data/generated/comparisonSlugs.json';

// Initialized once per Worker isolate; full records stay in static assets.
export const comparisonSlugs: ReadonlySet<string> = new Set(slugs);
