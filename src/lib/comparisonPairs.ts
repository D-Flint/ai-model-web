const modelSlug = /^[a-z0-9-]+$/;
const legacySeparator = '-vs-';
const explicitSeparator = '~vs~';

/** Default side-by-side comparison shown on the homepage and compare page. */
export const DEFAULT_COMPARISON_SLUGS = [
  'claude-sonnet-5',
  'gemini-3-8-flash',
] as const;

/** Alphabetical ASCII slug order. Tildes disambiguate slugs containing -vs-. */
export function comparisonPairSlug(a: string, b: string): string {
  const separator =
    a.includes(legacySeparator) || b.includes(legacySeparator)
      ? explicitSeparator
      : legacySeparator;
  return [a, b].sort().join(separator);
}

export function resolveComparisonPair(
  pair: string | undefined,
  slugs: ReadonlySet<string>,
): { a: string; b: string; canonical: string } | null {
  if (!pair) return null;
  const candidates: [string, string][] = [];
  const add = (a: string, b: string) => {
    if (
      a !== b &&
      modelSlug.test(a) &&
      modelSlug.test(b) &&
      slugs.has(a) &&
      slugs.has(b)
    ) {
      candidates.push([a, b]);
    }
  };
  if (pair.includes(explicitSeparator)) {
    const parts = pair.split(explicitSeparator);
    if (parts.length === 2) add(parts[0], parts[1]);
  } else {
    // Try every delimiter against the catalog; never guess an ambiguous split.
    for (
      let index = pair.indexOf(legacySeparator);
      index !== -1;
      index = pair.indexOf(legacySeparator, index + 1)
    ) {
      add(pair.slice(0, index), pair.slice(index + legacySeparator.length));
    }
  }
  if (candidates.length !== 1) return null;
  const [a, b] = candidates[0].sort();
  return { a, b, canonical: comparisonPairSlug(a, b) };
}

/** Preserve effort configurations and selections of more than two models. */
export function comparisonSharePath(selection: string[]): string {
  if (
    selection.length === 2 &&
    selection[0] !== selection[1] &&
    selection.every((slug) => modelSlug.test(slug))
  ) {
    return `/compare/${comparisonPairSlug(selection[0], selection[1])}`;
  }
  return `/compare?${new URLSearchParams({ models: selection.join(',') })}`;
}
