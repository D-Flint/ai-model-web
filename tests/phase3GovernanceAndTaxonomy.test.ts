import { describe, expect, it } from 'vitest';
import {
  capabilityTaxonomy,
  categories,
  metricLabels,
  type Capability,
} from '../src/data/config';
import { getVerifiedSpeedMeasurement } from '../src/lib/rankings';
import type { CatalogModel } from '../src/lib/catalogSchema';
import { allModels } from '../src/data/models';

describe('Phase 3: Catalog Governance & Taxonomy Standardization', () => {
  it('standardizes capability taxonomy across benchmark and ranking domains', () => {
    const requiredCapabilities: Capability[] = [
      'intelligence',
      'coding',
      'agentic',
      'dailyUse',
      'research',
      'writing',
      'vision',
      'speed',
      'reliability',
      'costEfficiency',
    ];

    for (const cap of requiredCapabilities) {
      const entry = capabilityTaxonomy[cap];
      expect(entry).toBeDefined();
      expect(entry.benchmarkLabel.length).toBeGreaterThan(0);
      expect(entry.rankingLabel.length).toBeGreaterThan(0);
      expect(entry.fullDescription.length).toBeGreaterThan(0);
    }

    expect(capabilityTaxonomy.agentic.benchmarkLabel).toBe('Agentic Coding');
    expect(capabilityTaxonomy.agentic.rankingLabel).toBe('Agents');
    expect(metricLabels.agentic).toBe('Agentic coding');
  });

  it('aligns ranking categories with capability taxonomy', () => {
    const agentCategory = categories.find((c) => c.slug === 'agents');
    expect(agentCategory).toBeDefined();
    expect(agentCategory?.label).toBe(capabilityTaxonomy.agentic.rankingLabel);

    const speedCategory = categories.find((c) => c.slug === 'speed');
    expect(speedCategory).toBeDefined();
    expect(speedCategory?.description).toContain('Peak throughput');
  });

  it('computes peakValue and medianValue for verified speed ranges', () => {
    const sampleModel: CatalogModel = structuredClone(allModels[0]);
    const asOf = '2026-09-09';
    sampleModel.lastVerifiedAt = asOf;
    const sourceId = sampleModel.sources[0]?.id ?? 'test-speed-source';
    if (!sampleModel.sources.some((s) => s.id === sourceId)) {
      sampleModel.sources.push({
        id: sourceId,
        name: 'Test Source',
        url: 'https://example.com',
        retrievedAt: asOf,
        kind: 'provider_doc',
        publisher: 'Test Publisher',
      });
    }

    sampleModel.facts.speedTokensPerSecRange = {
      min: 40,
      max: 120,
      sourceId,
      retrievedAt: asOf,
    };

    const measurement = getVerifiedSpeedMeasurement(sampleModel, asOf);
    expect(measurement).not.toBeNull();
    expect(measurement?.value).toBe(120);
    expect(measurement?.peakValue).toBe(120);
    expect(measurement?.medianValue).toBe(80);
    expect(measurement?.range).toEqual({ min: 40, max: 120 });
  });

  it('computes peakValue and medianValue for single verified speed measurements', () => {
    const sampleModel: CatalogModel = structuredClone(allModels[0]);
    const asOf = '2026-09-09';
    sampleModel.lastVerifiedAt = asOf;
    const sourceId = sampleModel.sources[0]?.id ?? 'test-speed-source';
    sampleModel.sources = [
      {
        id: sourceId,
        name: 'Test Source',
        url: 'https://example.com',
        retrievedAt: asOf,
        kind: 'provider_doc',
        publisher: 'Test Publisher',
      },
    ];

    sampleModel.facts.sourceId = sourceId;
    sampleModel.facts.speedTokensPerSecRange = null;
    sampleModel.facts.speedTokensPerSec = 95;

    const measurement = getVerifiedSpeedMeasurement(sampleModel, asOf);
    expect(measurement).not.toBeNull();
    expect(measurement?.value).toBe(95);
    expect(measurement?.peakValue).toBe(95);
    expect(measurement?.medianValue).toBe(95);
    expect(measurement?.range).toBeNull();
  });
});
