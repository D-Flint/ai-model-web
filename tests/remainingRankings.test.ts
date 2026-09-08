import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import MetricRanking, {
  sortMetricRankingItems,
  type MetricRankingItem,
} from '../src/components/MetricRanking';
import { allModels } from '../src/data/models';
import { evaluateModelEligibility } from '../src/lib/catalogEligibility';
import type { CatalogModel } from '../src/lib/catalogSchema';
import {
  getScoreRankingMetric,
  getVerifiedInputPrice,
  isScoreRankingEligible,
  rankLowestCostModels,
  rankScoreModels,
  scoreRankingMetrics,
  type ScoreRankingMetric,
} from '../src/lib/rankings';

const asOf = '2026-09-08';
const baseModel: CatalogModel = (() => {
  const model = allModels.find(
    (candidate) =>
      evaluateModelEligibility(candidate).status === 'active' &&
      candidate.facts.api &&
      candidate.facts.availability === 'Production API',
  );
  if (!model) throw new Error('Expected score ranking fixture');
  return model;
})();
const pricedModel: CatalogModel = (() => {
  const model = allModels.find(
    (candidate) => getVerifiedInputPrice(candidate, asOf) !== null,
  );
  if (!model) throw new Error('Expected price ranking fixture');
  return model;
})();

function copyModel(
  source = baseModel,
  overrides: {
    slug?: string;
    name?: string;
    confidence?: number;
    lastVerifiedAt?: string | null;
  } = {},
): CatalogModel {
  const model = structuredClone(source);
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

function setMetric(
  model: CatalogModel,
  metric: ScoreRankingMetric,
  score: number,
): void {
  model.scores = { ...model.scores, [metric]: score };
  model.evidence = [
    ...model.evidence.filter((evidence) => evidence.metric !== metric),
    { ...model.evidence[0], metric, normalized: score },
  ];
  if (metric === 'vision') {
    model.facts = { ...model.facts, vision: true };
  }
}

function setInputPrice(model: CatalogModel, value: number): void {
  const tier = model.apiPricing!.tiers[0];
  model.apiPricing = {
    ...model.apiPricing!,
    tiers: [
      {
        ...tier,
        input: {
          ...tier.input!,
          value,
          source: { ...tier.input!.source, retrievedAt: asOf },
        },
      },
    ],
  };
}

describe('remaining score rankings', () => {
  it('maps every supported route to its metric', () => {
    expect(getScoreRankingMetric('value')).toBe('costEfficiency');
    expect(getScoreRankingMetric('coding')).toBe('coding');
    expect(getScoreRankingMetric('agents')).toBe('agentic');
    expect(getScoreRankingMetric('daily-use')).toBe('dailyUse');
    expect(getScoreRankingMetric('research')).toBe('research');
    expect(getScoreRankingMetric('writing')).toBe('writing');
    expect(getScoreRankingMetric('vision')).toBe('vision');
    expect(getScoreRankingMetric('overall')).toBeNull();
  });

  it.each(scoreRankingMetrics)(
    'requires matching evidence for %s',
    (metric) => {
      const model = copyModel(baseModel, { lastVerifiedAt: asOf });
      setMetric(model, metric, 80);
      expect(isScoreRankingEligible(model, metric, asOf)).toBe(true);
      model.evidence = model.evidence.filter(
        (evidence) => evidence.metric !== metric,
      );
      expect(isScoreRankingEligible(model, metric, asOf)).toBe(false);
    },
  );

  it('requires vision support for the vision ranking', () => {
    const model = copyModel(baseModel, { lastVerifiedAt: asOf });
    setMetric(model, 'vision', 85);
    model.facts = { ...model.facts, vision: false };
    expect(isScoreRankingEligible(model, 'vision', asOf)).toBe(false);
  });

  it('sorts scores both directions without mutating source models', () => {
    const lower = copyModel(baseModel, {
      slug: 'metric-lower',
      name: 'Metric Lower',
      lastVerifiedAt: asOf,
    });
    const higher = copyModel(baseModel, {
      slug: 'metric-higher',
      name: 'Metric Higher',
      lastVerifiedAt: asOf,
    });
    setMetric(lower, 'coding', 60);
    setMetric(higher, 'coding', 95);
    const source = [lower, higher];

    expect(rankScoreModels(source, 'coding', asOf)[0].model.name).toBe(
      'Metric Higher',
    );
    const ascending = rankScoreModels(source, 'coding', asOf, 'asc');
    expect(ascending[0].model.name).toBe('Metric Lower');
    expect(ascending[0].rank).toBe(2);
    expect(source.map((model) => model.name)).toEqual([
      'Metric Lower',
      'Metric Higher',
    ]);
  });

  it('breaks equal scores by confidence, freshness, then name', () => {
    const older = copyModel(baseModel, {
      slug: 'metric-older',
      name: 'A Older',
      confidence: 90,
      lastVerifiedAt: '2026-09-01',
    });
    const newer = copyModel(baseModel, {
      slug: 'metric-newer',
      name: 'Z Newer',
      confidence: 90,
      lastVerifiedAt: asOf,
    });
    const lowerConfidence = copyModel(baseModel, {
      slug: 'metric-low-confidence',
      name: 'Lower Confidence',
      confidence: 80,
      lastVerifiedAt: asOf,
    });
    for (const model of [older, newer, lowerConfidence]) {
      setMetric(model, 'research', 80);
    }

    expect(
      rankScoreModels([lowerConfidence, older, newer], 'research', asOf).map(
        (result) => result.model.name,
      ),
    ).toEqual(['Z Newer', 'A Older', 'Lower Confidence']);
  });
});

describe('lowest cost ranking', () => {
  it('requires current single-tier verified input pricing', () => {
    const current = copyModel(pricedModel, { lastVerifiedAt: asOf });
    setInputPrice(current, 2);
    expect(getVerifiedInputPrice(current, asOf)?.value).toBe(2);

    const stale = copyModel(current);
    stale.apiPricing!.tiers[0].input!.source.retrievedAt = '2026-08-31';
    expect(getVerifiedInputPrice(stale, asOf)).toBeNull();

    const tiered = copyModel(current);
    tiered.apiPricing!.tiers.push({
      ...structuredClone(tiered.apiPricing!.tiers[0]),
      id: 'second-tier',
    });
    expect(getVerifiedInputPrice(tiered, asOf)).toBeNull();
  });

  it('defaults to lowest price and reverses without changing ranks', () => {
    const cheaper = copyModel(pricedModel, {
      slug: 'cost-cheaper',
      name: 'Cost Cheaper',
      lastVerifiedAt: asOf,
    });
    const expensive = copyModel(pricedModel, {
      slug: 'cost-expensive',
      name: 'Cost Expensive',
      lastVerifiedAt: asOf,
    });
    setInputPrice(cheaper, 1);
    setInputPrice(expensive, 9);

    expect(rankLowestCostModels([expensive, cheaper], asOf)[0].model.name).toBe(
      'Cost Cheaper',
    );
    const descending = rankLowestCostModels([expensive, cheaper], asOf, 'desc');
    expect(descending[0].model.name).toBe('Cost Expensive');
    expect(descending[0].rank).toBe(2);
  });
});

describe('shared metric ranking control', () => {
  const items: MetricRankingItem[] = [
    {
      slug: 'lower',
      name: 'Lower',
      provider: 'OpenAI',
      family: 'Test',
      description: 'Lower value.',
      tags: ['General'],
      weakness: 'Lower value',
      rank: 2,
      value: 10,
      tieScore: 80,
      verifiedAt: asOf,
    },
    {
      slug: 'higher',
      name: 'Higher',
      provider: 'OpenAI',
      family: 'Test',
      description: 'Higher value.',
      tags: ['General'],
      weakness: 'Higher price',
      rank: 1,
      value: 90,
      tieScore: 80,
      verifiedAt: asOf,
    },
  ];

  it('renders score rankings highest-first by default', () => {
    const html = renderToStaticMarkup(
      createElement(MetricRanking, {
        items,
        metricLabel: 'Coding',
        metricAnchor: 'score-coding',
        valueKind: 'score',
        defaultDirection: 'desc',
      }),
    );
    expect(html.indexOf('Higher')).toBeLessThan(html.indexOf('Lower'));
    expect(html).toContain('<option value="desc" selected="">');
    expect(html).toContain('Highest to lowest');
  });

  it('renders price rankings lowest-first by default', () => {
    const html = renderToStaticMarkup(
      createElement(MetricRanking, {
        items: sortMetricRankingItems(items, 'asc'),
        metricLabel: 'Lowest cost',
        metricAnchor: 'pricing',
        valueKind: 'price',
        defaultDirection: 'asc',
      }),
    );
    expect(html.indexOf('Lower')).toBeLessThan(html.indexOf('Higher'));
    expect(html).toContain('<option value="asc" selected="">');
    expect(html).toContain('Lowest to highest');
  });
});
