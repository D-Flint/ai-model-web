import { describe, it, expect } from 'vitest';
import { models, mockModels } from '../src/data/models';
import {
  getSeoComparisonPairs,
  CURATED_SEO_PAIRS,
} from '../src/lib/seoComparisons';
import { selectionFromSearch } from '../src/lib/decision';

describe('SEO comparison pairs and arbitrary comparisons', () => {
  it('generates a bounded, finite set of SEO comparison pairs', () => {
    const pairs = getSeoComparisonPairs(models);
    expect(pairs.length).toBeGreaterThan(10);
    expect(pairs.length).toBeLessThanOrEqual(100);
  });

  it('contains unique pairs with no inverted duplicates', () => {
    const pairs = getSeoComparisonPairs(models);
    const seenNormalized = new Set<string>();

    for (const pair of pairs) {
      expect(pair.a.slug).not.toBe(pair.b.slug);
      const normalizedKey = [pair.a.slug, pair.b.slug].sort().join('-vs-');
      expect(seenNormalized.has(normalizedKey)).toBe(false);
      seenNormalized.add(normalizedKey);
    }
  });

  it('includes key curated rivalries if both models exist in catalog', () => {
    const pairs = getSeoComparisonPairs(models);
    const modelSlugs = new Set(models.map((m) => m.slug));

    for (const [slugA, slugB] of CURATED_SEO_PAIRS) {
      if (modelSlugs.has(slugA) && modelSlugs.has(slugB)) {
        const found = pairs.some(
          (p) =>
            (p.a.slug === slugA && p.b.slug === slugB) ||
            (p.a.slug === slugB && p.b.slug === slugA),
        );
        expect(found).toBe(true);
      }
    }
  });

  it('uses Gemini 3.8 Flash in the curated Google comparison cards', () => {
    expect(CURATED_SEO_PAIRS).toEqual(
      expect.arrayContaining([
        ['claude-sonnet-5', 'gemini-3-8-flash'],
        ['gpt-6-astra', 'gemini-3-8-flash'],
        ['claude-opus-5', 'gemini-3-8-flash'],
      ]),
    );
    expect(
      CURATED_SEO_PAIRS.filter(([, slug]) => slug === 'gemini-3-1-pro'),
    ).toHaveLength(0);
  });

  it('works with fallback mock models without exploding', () => {
    const pairs = getSeoComparisonPairs(mockModels);
    expect(pairs.length).toBeGreaterThan(5);
    expect(pairs.length).toBeLessThanOrEqual(100);
    expect(pairs.every((p) => p.a.slug !== p.b.slug)).toBe(true);
  });

  it('supports arbitrary comparisons via selectionFromSearch with ?models=', () => {
    const search = '?models=gpt-6-astra,claude-sonnet-5';
    const selection = selectionFromSearch(search, models);
    expect(selection).toEqual(['gpt-6-astra', 'claude-sonnet-5']);
  });

  it('supports arbitrary comparisons via selectionFromSearch with ?a=&b=', () => {
    const [a, b] = models;
    const search = `?a=${a.slug}&b=${b.slug}`;
    const selection = selectionFromSearch(search, models);
    expect(selection).toEqual([a.slug, b.slug]);
  });

  it('filters out unknown slugs in arbitrary searches and limits to 4', () => {
    const search =
      '?models=non-existent-1,gpt-6-astra,fake-2,claude-sonnet-5,gemini-3-1-pro,glm-5-3,kimi-k3';
    const selection = selectionFromSearch(search, models);
    expect(selection).toContain('gpt-6-astra');
    expect(selection).toContain('claude-sonnet-5');
    expect(selection.includes('non-existent-1')).toBe(false);
    expect(selection.length).toBeLessThanOrEqual(4);
  });
});
