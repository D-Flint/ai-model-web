import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import SpeedRanking, {
  sortSpeedRankingItems,
  type SpeedRankingItem,
} from '../src/components/SpeedRanking';
import { allModels } from '../src/data/models';
import { evaluateModelEligibility } from '../src/lib/catalogEligibility';
import type { CatalogModel } from '../src/lib/catalogSchema';
import {
  getVerifiedSpeedMeasurement,
  isSpeedRankingEligible,
  rankSpeedModels,
} from '../src/lib/rankings';

const asOf = '2026-09-09';
const baseModel: CatalogModel = (() => {
  const model = allModels.find(
    (candidate) =>
      evaluateModelEligibility(candidate).status === 'active' &&
      candidate.facts.api &&
      candidate.facts.availability === 'Production API' &&
      candidate.facts.speedTokensPerSecRange !== null &&
      candidate.facts.speedTokensPerSecRange !== undefined,
  );
  if (!model) throw new Error('Expected speed ranking fixture');
  return model;
})();

function copyModel(
  overrides: {
    slug?: string;
    name?: string;
    confidence?: number;
    lastVerifiedAt?: string | null;
  } = {},
): CatalogModel {
  const model = structuredClone(baseModel);
  return {
    ...model,
    slug: overrides.slug ?? model.slug,
    name: overrides.name ?? model.name,
    confidence: overrides.confidence ?? model.confidence,
    lastVerifiedAt:
      overrides.lastVerifiedAt === undefined
        ? model.lastVerifiedAt
        : overrides.lastVerifiedAt,
  };
}

describe('speed ranking', () => {
  it('uses the maximum value from a verified speed range', () => {
    const model = copyModel({ lastVerifiedAt: asOf });
    const sourceId = model.facts.speedTokensPerSecRange!.sourceId;
    model.facts.speedTokensPerSecRange = {
      min: 120,
      max: 40,
      sourceId,
      retrievedAt: asOf,
    };

    expect(getVerifiedSpeedMeasurement(model, asOf)).toEqual({
      value: 120,
      range: { min: 40, max: 120 },
      sourceId,
      verifiedAt: asOf,
    });
    expect(rankSpeedModels([model], asOf)[0].speedTokensPerSec).toBe(120);
  });

  it('uses a single verified speed value when no range exists', () => {
    const model = copyModel({ lastVerifiedAt: asOf });
    const sourceId = model.facts.speedTokensPerSecRange!.sourceId;
    model.facts = {
      ...model.facts,
      sourceId,
      speedTokensPerSec: 75,
      speedTokensPerSecRange: undefined,
    };

    expect(getVerifiedSpeedMeasurement(model, asOf)).toMatchObject({
      value: 75,
      range: null,
      sourceId,
    });
    expect(isSpeedRankingEligible(model, asOf)).toBe(true);
  });

  it('rejects stale, untraceable, and non-production speed entries', () => {
    const stale = copyModel({ lastVerifiedAt: asOf });
    stale.facts.speedTokensPerSecRange = {
      ...stale.facts.speedTokensPerSecRange!,
      retrievedAt: '2026-06-09',
    };
    expect(isSpeedRankingEligible(stale, asOf)).toBe(false);

    const untraceable = copyModel({ lastVerifiedAt: asOf });
    untraceable.facts.speedTokensPerSecRange = {
      ...untraceable.facts.speedTokensPerSecRange!,
      sourceId: 'missing-speed-source',
      retrievedAt: asOf,
    };
    expect(isSpeedRankingEligible(untraceable, asOf)).toBe(false);

    const preview = copyModel({ lastVerifiedAt: asOf });
    preview.facts = { ...preview.facts, availability: 'Preview API' };
    expect(isSpeedRankingEligible(preview, asOf)).toBe(false);
  });

  it('sorts both directions without mutating source models', () => {
    const slower = copyModel({
      slug: 'speed-slower',
      name: 'Speed Slower',
      lastVerifiedAt: asOf,
    });
    slower.facts.speedTokensPerSecRange = {
      ...slower.facts.speedTokensPerSecRange!,
      min: 20,
      max: 80,
      retrievedAt: asOf,
    };
    const faster = copyModel({
      slug: 'speed-faster',
      name: 'Speed Faster',
      lastVerifiedAt: asOf,
    });
    faster.facts.speedTokensPerSecRange = {
      ...faster.facts.speedTokensPerSecRange!,
      min: 30,
      max: 160,
      retrievedAt: asOf,
    };
    const source = [slower, faster];

    expect(rankSpeedModels(source, asOf)[0].model.name).toBe('Speed Faster');
    expect(rankSpeedModels(source, asOf, 'asc')[0].model.name).toBe(
      'Speed Slower',
    );
    expect(source.map((model) => model.name)).toEqual([
      'Speed Slower',
      'Speed Faster',
    ]);
  });

  it('breaks equal speeds by confidence, measurement date, then name', () => {
    const older = copyModel({
      slug: 'speed-older',
      name: 'A Older',
      confidence: 90,
      lastVerifiedAt: asOf,
    });
    older.facts.speedTokensPerSecRange = {
      ...older.facts.speedTokensPerSecRange!,
      max: 100,
      retrievedAt: '2026-09-01',
    };
    const newer = copyModel({
      slug: 'speed-newer',
      name: 'Z Newer',
      confidence: 90,
      lastVerifiedAt: asOf,
    });
    newer.facts.speedTokensPerSecRange = {
      ...newer.facts.speedTokensPerSecRange!,
      max: 100,
      retrievedAt: asOf,
    };
    const lowerConfidence = copyModel({
      slug: 'speed-low-confidence',
      name: 'Lower Confidence',
      confidence: 80,
      lastVerifiedAt: asOf,
    });
    lowerConfidence.facts.speedTokensPerSecRange = {
      ...lowerConfidence.facts.speedTokensPerSecRange!,
      max: 100,
      retrievedAt: asOf,
    };

    expect(
      rankSpeedModels([lowerConfidence, older, newer], asOf).map(
        (result) => result.model.name,
      ),
    ).toEqual(['Z Newer', 'A Older', 'Lower Confidence']);
  });
});

describe('speed ranking control', () => {
  const items: SpeedRankingItem[] = [
    {
      slug: 'slower',
      name: 'Slower',
      provider: 'OpenAI',
      family: 'Test',
      description: 'Slower model.',
      tags: ['General'],
      weakness: 'Lower speed',
      rank: 2,
      speedTokensPerSec: 70,
      range: null,
      confidence: 80,
      speedVerifiedAt: asOf,
    },
    {
      slug: 'faster',
      name: 'Faster',
      provider: 'OpenAI',
      family: 'Test',
      description: 'Faster model.',
      tags: ['General'],
      weakness: 'Higher price',
      rank: 1,
      speedTokensPerSec: 190,
      range: { min: 90, max: 190 },
      confidence: 80,
      speedVerifiedAt: asOf,
    },
  ];

  it('defaults to highest-first and renders one sort toggle', () => {
    const html = renderToStaticMarkup(createElement(SpeedRanking, { items }));
    expect(html.indexOf('Faster')).toBeLessThan(html.indexOf('Slower'));
    expect(html).toContain('Measured range: 90–190 tokens/sec');
    expect(html).toContain('Highest to lowest');
    expect(html).toContain('Activate to sort lowest to highest.');
    expect(html).toContain('class="ranking-sort-toggle"');
    expect(html).toContain('aria-pressed="false"');
  });

  it('sorts client items lowest-first when selected', () => {
    expect(sortSpeedRankingItems(items, 'asc')[0].name).toBe('Slower');
    expect(sortSpeedRankingItems(items, 'desc')[0].name).toBe('Faster');
  });
});
