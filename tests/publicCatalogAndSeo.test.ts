import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { publishedModels } from '../src/data/models';
import { DEFAULT_COMPARISON_SLUGS } from '../src/lib/comparisonPairs';
import { getSeoComparisonPairs } from '../src/lib/seoComparisons';
import { GET as getRobots } from '../src/pages/robots.txt';
import { GET as getSitemap } from '../src/pages/sitemap.xml';

const site = new URL('https://synapse.example/');

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('public catalog boundary', () => {
  it('publishes verified models only and uses a verified default comparison', () => {
    expect(publishedModels).toHaveLength(46);
    expect(
      publishedModels.every((model) => model.dataKind === 'verified'),
    ).toBe(true);
    expect(DEFAULT_COMPARISON_SLUGS).toEqual([
      'claude-sonnet-5',
      'gemini-3-8-flash',
    ]);
    expect(
      DEFAULT_COMPARISON_SLUGS.every((slug) =>
        publishedModels.some((model) => model.slug === slug),
      ),
    ).toBe(true);
  });

  it('never creates public discovery pairs for synthetic fixtures', () => {
    const syntheticSlugs = new Set([
      'claude-fable-5-1',
      'claude-fable-5',
      'gpt-6-astra',
    ]);
    const pairs = getSeoComparisonPairs(publishedModels);

    expect(
      pairs.every(
        ({ a, b }) =>
          !syntheticSlugs.has(a.slug) && !syntheticSlugs.has(b.slug),
      ),
    ).toBe(true);
  });
});

describe('indexing policy', () => {
  it('blocks crawlers and emits an empty sitemap by default', async () => {
    vi.stubEnv('ENABLE_INDEXING', 'false');

    const robots = await getRobots({ site } as never);
    const sitemap = await getSitemap({ site } as never);

    await expect(robots.text()).resolves.toContain('Disallow: /');
    await expect(sitemap.text()).resolves.not.toContain('<url>');
  });

  it('allows crawling and advertises public URLs only when enabled', async () => {
    vi.stubEnv('ENABLE_INDEXING', 'true');

    const robots = await getRobots({ site } as never);
    const sitemap = await getSitemap({ site } as never);
    const robotsText = await robots.text();
    const sitemapText = await sitemap.text();

    expect(robotsText).toContain('Allow: /');
    expect(robotsText).toContain('https://synapse.example/sitemap.xml');
    expect(sitemapText).toContain('https://synapse.example/models');
    expect(sitemapText).not.toContain('gpt-6-astra');
    expect(sitemapText).not.toContain('claude-fable-5-1');
  });

  it('keeps social metadata and the explicit indexing safety gate in layout', () => {
    const layout = readFileSync(
      path.resolve('src/layouts/RootLayout.astro'),
      'utf8',
    );

    expect(layout).toContain('SITE_URL is required when ENABLE_INDEXING=true');
    expect(layout).toContain('property="og:image"');
    expect(layout).toContain('name="twitter:card"');
    expect(layout).toContain('application/ld+json');
  });
});
