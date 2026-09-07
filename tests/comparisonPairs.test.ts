import { describe, expect, it } from 'vitest';
import {
  comparisonPairSlug,
  comparisonSharePath,
  resolveComparisonPair,
} from '../src/lib/comparisonPairs';
import { loadComparisonModels } from '../src/lib/loadComparisonModels';
import { mockModels, models } from '../src/data/models';

describe('canonical comparison routing', () => {
  const slugs = new Set([
    'alpha',
    'beta',
    'alpha-vs-beta',
    'gamma',
    'beta-vs-gamma',
  ]);

  it('resolves either order to one alphabetical URL', () => {
    const expected = { a: 'alpha', b: 'beta', canonical: 'alpha-vs-beta' };
    expect(resolveComparisonPair('alpha-vs-beta', slugs)).toEqual(expected);
    expect(resolveComparisonPair('beta-vs-alpha', slugs)).toEqual(expected);
  });

  it.each([
    undefined,
    '',
    'alpha',
    'alpha-vs-alpha',
    'alpha-vs-unknown',
    '../alpha-vs-beta',
    'alpha~vs~beta~vs~gamma',
  ])('rejects invalid pair %s', (pair) =>
    expect(resolveComparisonPair(pair, slugs)).toBeNull(),
  );

  it('rejects ambiguous old URLs instead of guessing', () => {
    expect(resolveComparisonPair('alpha-vs-beta-vs-gamma', slugs)).toBeNull();
  });

  it('supports embedded delimiters with explicit encoding', () => {
    const canonical = comparisonPairSlug('gamma', 'alpha-vs-beta');
    expect(canonical).toBe('alpha-vs-beta~vs~gamma');
    expect(resolveComparisonPair(canonical, slugs)?.a).toBe('alpha-vs-beta');
  });

  it('preserves unambiguous legacy URLs containing embedded delimiters', () => {
    const result = resolveComparisonPair(
      'alpha-vs-beta-vs-gamma',
      new Set(['alpha-vs-beta', 'gamma']),
    );
    expect(result?.canonical).toBe('alpha-vs-beta~vs~gamma');
  });

  it('resolves an arbitrary pair outside curated rankings', () => {
    const a = models.at(-1)!;
    const b = models.at(-2)!;
    const pair = comparisonPairSlug(a.slug, b.slug);
    expect(
      resolveComparisonPair(pair, new Set(models.map((m) => m.slug)))
        ?.canonical,
    ).toBe(pair);
  });

  it('shares pairs canonically and preserves effort and multi-model selections', () => {
    expect(comparisonSharePath(['beta', 'alpha'])).toBe(
      '/compare/alpha-vs-beta',
    );
    for (const selection of [
      ['alpha:high', 'beta'],
      ['alpha', 'beta', 'gamma'],
      ['alpha', 'alpha'],
    ]) {
      const url = new URL(
        comparisonSharePath(selection),
        'https://example.test',
      );
      expect(url.pathname).toBe('/compare');
      expect(url.searchParams.get('models')).toBe(selection.join(','));
    }
  });
});

describe('comparison record loading', () => {
  const origin = new URL('https://example.test');
  const [a, b] = mockModels;

  it('fetches only the requested records with preserved data', async () => {
    const paths: string[] = [];
    const records = await loadComparisonModels(
      {
        async fetch(request) {
          const path = new URL(request.url).pathname;
          paths.push(path);
          return Response.json(path.includes(a.slug) ? a : b);
        },
      },
      origin,
      [a.slug, b.slug],
    );
    expect(records).toEqual([a, b]);
    expect(paths).toEqual([
      `/_comparison-data/${a.slug}.json`,
      `/_comparison-data/${b.slug}.json`,
    ]);
  });

  it.each(['unavailable', 'invalid', 'mismatch', 'network'])(
    'reports %s data as an operational failure',
    async (failure) => {
      await expect(
        loadComparisonModels(
          {
            async fetch() {
              if (failure === 'network') throw new Error('Asset read failed');
              if (failure === 'unavailable')
                return new Response(null, { status: 404 });
              return Response.json(failure === 'invalid' ? {} : b);
            },
          },
          origin,
          [a.slug, b.slug],
        ),
      ).rejects.toThrow();
    },
  );
});
