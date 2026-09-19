import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { models, publishedModels } from '../src/data/models';
import HeroCompare from '../src/components/HeroCompare';
import {
  selectionFromSearch,
  selectionAtDefaultEffort,
} from '../src/lib/decision';

describe('Phase 2: Deep Links & Primary Flow State Restoration', () => {
  describe('P0-02: State Restoration & Canonical Search Routing', () => {
    it('uses canonical trailing slash in index.astro hero search action', () => {
      const indexAstroPath = path.resolve(
        __dirname,
        '../src/pages/index.astro',
      );
      const content = fs.readFileSync(indexAstroPath, 'utf8');
      expect(content).toContain('action="/models/"');
      expect(content).not.toMatch(/action="\/models(?!\/)"/);
    });

    it('parses both single model and multiple models query parameters in selectionFromSearch', () => {
      const sample1 = publishedModels[0].slug;
      const sample2 = publishedModels[1].slug;

      // Both ?models= and ?model= are correctly recognized
      expect(
        selectionFromSearch(`?models=${sample1},${sample2}`, publishedModels),
      ).toEqual([sample1, sample2]);
      expect(selectionFromSearch(`?model=${sample1}`, publishedModels)).toEqual(
        [sample1],
      );
      expect(
        selectionFromSearch(`?models=${sample1}:high`, publishedModels),
      ).toEqual([`${sample1}:high`]);
    });
  });

  describe('P1-01: Homepage Comparison Link Semantics & Effort Preservation', () => {
    it('generates comparison links with explicit default effort in HeroCompare', () => {
      const html = renderToStaticMarkup(
        <HeroCompare models={publishedModels} />,
      );
      // Should contain /compare?models= with explicit effort suffix for reasoning models
      expect(html).toContain('href="/compare?models=');
      const match = html.match(/href="\/compare\?models=([^"]+)"/);
      expect(match).not.toBeNull();
      if (match) {
        const queryModels = match[1].split(',');
        expect(queryModels.length).toBe(2);
        for (const token of queryModels) {
          const [slug, effort] = token.split(':');
          const m = publishedModels.find((item) => item.slug === slug);
          expect(m).toBeDefined();
          if (
            m?.facts.reasoningEffort &&
            m.facts.reasoningEffort.some((e) => e !== 'none')
          ) {
            expect(effort).toBeDefined();
            expect(['low', 'medium', 'high', 'max', 'fixed']).toContain(effort);
          }
        }
      }
    });

    it('defaults unadorned reasoning model slugs to default baseline effort', () => {
      const gpt6Astra = models.find((m) => m.slug === 'gpt-6-astra');
      expect(gpt6Astra).toBeDefined();
      if (!gpt6Astra) return;

      const normalized = selectionAtDefaultEffort([gpt6Astra.slug], models);
      expect(normalized).toEqual([`${gpt6Astra.slug}:medium`]);
    });

    it('preserves explicitly requested effort in selectionAtDefaultEffort', () => {
      const gpt6Astra = models.find((m) => m.slug === 'gpt-6-astra');
      expect(gpt6Astra).toBeDefined();
      if (!gpt6Astra) return;

      const normalized = selectionAtDefaultEffort(
        [`${gpt6Astra.slug}:low`],
        models,
      );
      expect(normalized).toEqual([`${gpt6Astra.slug}:low`]);
    });
  });

  describe('P1-02: GPT-6 Astra Pricing Copy Synchronization', () => {
    it('references $50–$75/1M output pricing in openai.ts and verifiedModels.json', () => {
      const openaiTsPath = path.resolve(
        __dirname,
        '../src/data/models/openai.ts',
      );
      const verifiedJsonPath = path.resolve(
        __dirname,
        '../src/data/verifiedModels.json',
      );

      const openaiTs = fs.readFileSync(openaiTsPath, 'utf8');
      const verifiedJson = fs.readFileSync(verifiedJsonPath, 'utf8');

      // No outdated $48/1M copy for gpt-6-astra
      expect(openaiTs).not.toContain('$48/1M');
      expect(verifiedJson).not.toMatch(
        /"High output token pricing \(\$48\/1M\)/,
      );

      // Contains updated range matching officialProviders.ts
      expect(openaiTs).toContain('$50–$75/1M');
      expect(verifiedJson).toContain('$50–$75/1M');
    });
  });

  describe('P1-03: Homepage Usage Ranking Footnote and Explanation', () => {
    it('clarifies OpenRouter usage ranking scope and unverified preview exclusion', () => {
      const indexAstroPath = path.resolve(
        __dirname,
        '../src/pages/index.astro',
      );
      const indexAstro = fs.readFileSync(indexAstroPath, 'utf8');

      expect(indexAstro).toContain('Hy4 preview');
      expect(indexAstro).toMatch(/top\s+verified/);
    });
  });
});
