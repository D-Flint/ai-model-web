import { describe, it, expect } from 'vitest';
import { models } from '../src/data/models';
import verifiedModels from '../src/data/verifiedModels.json';
import { catalogModelSchema } from '../src/lib/catalogSchema';
import { getModelEffortStats } from '../src/lib/decision';
import { workloadProfiles, defaultWorkloadProfile } from '../src/data/config';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 1: Trust & Semantic Integrity', () => {
  describe('P0-01: LiveBench Evidence Classification', () => {
    it('supports preview and synthetic in catalogModelSchema', () => {
      const sample = {
        ...verifiedModels[0],
        dataKind: 'synthetic',
      };
      const result = catalogModelSchema.safeParse(sample);
      expect(result.success).toBe(true);

      const previewSample = {
        ...verifiedModels[0],
        dataKind: 'preview',
      };
      expect(catalogModelSchema.safeParse(previewSample).success).toBe(true);
    });

    it('classifies the LiveBench-backed records as verified', () => {
      const gpt6 = verifiedModels.find((m) => m.slug === 'gpt-6-astra');
      expect(gpt6).toBeDefined();
      expect(gpt6?.dataKind).toBe('verified');

      const fable51 = verifiedModels.find((m) => m.slug === 'claude-fable-5-1');
      expect(fable51).toBeDefined();
      expect(fable51?.dataKind).toBe('verified');

      const fable5 = verifiedModels.find((m) => m.slug === 'claude-fable-5');
      expect(fable5).toBeDefined();
      expect(fable5?.dataKind).toBe('verified');
    });

    it('retains the LiveBench-backed models in the published catalog', () => {
      const gpt6 = models.find((m) => m.slug === 'gpt-6-astra');
      expect(gpt6).toBeDefined();
      expect(gpt6?.dataKind).toBe('verified');

      const realModel = models.find((m) => m.slug === 'deepseek-v4-1-flash');
      expect(realModel).toBeDefined();
      expect(realModel?.dataKind).toBe('verified');
    });
  });

  describe('P0-03: Canonical Composite Harmonization', () => {
    it('produces consistent canonical composite score matching default effort stats', () => {
      const gpt6 = models.find((m) => m.slug === 'gpt-6-astra')!;
      expect(gpt6).toBeDefined();

      const defaultEffort =
        gpt6.facts.defaultEffort && gpt6.facts.defaultEffort !== 'none'
          ? gpt6.facts.defaultEffort
          : 'medium';
      expect(defaultEffort).toBe('medium');

      const defaultStats = getModelEffortStats(gpt6, defaultEffort);
      const canonicalComposite = defaultStats.scores.overall;

      // Ensure the canonical composite matches the default effort stats score
      expect(canonicalComposite).toBe(73);
      expect(defaultStats.scores.overall).toBe(73);
    });

    it('calculates effort-adjusted overall score across all effort levels', () => {
      const gpt6 = models.find((m) => m.slug === 'gpt-6-astra')!;
      const lowStats = getModelEffortStats(gpt6, 'low');
      const medStats = getModelEffortStats(gpt6, 'medium');
      const highStats = getModelEffortStats(gpt6, 'high');
      const maxStats = getModelEffortStats(gpt6, 'max');

      expect(lowStats.scores.overall).toBeLessThanOrEqual(
        medStats.scores.overall!,
      );
      expect(medStats.scores.overall).toBe(73);
      expect(highStats.scores.overall).toBeGreaterThanOrEqual(
        medStats.scores.overall!,
      );
      expect(maxStats.scores.overall).toBeGreaterThanOrEqual(
        highStats.scores.overall!,
      );
    });
  });

  describe('P2-05: Blended-Price Definition Unification', () => {
    it('methodology page does not contain legacy 70/30 static ratio', () => {
      const methodologyContent = fs.readFileSync(
        path.resolve('src/pages/methodology.astro'),
        'utf8',
      );
      expect(methodologyContent).not.toContain('70% input and 30% output');
      expect(methodologyContent).toContain('Agent & Coding');
      expect(methodologyContent).toMatch(
        /75%\s+cached\s+input,\s*20%\s+fresh\s+input,\s*5%\s+output/,
      );
    });

    it('standard workload profiles exist and define valid ratios summing to 1', () => {
      expect(defaultWorkloadProfile).toBe('agent');
      for (const profile of Object.values(workloadProfiles)) {
        const sum =
          profile.cachedRatio + profile.inputRatio + profile.outputRatio;
        expect(sum).toBeCloseTo(1.0, 5);
      }
    });
  });
});
