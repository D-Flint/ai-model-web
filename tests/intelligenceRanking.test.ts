import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import IntelligenceRanking, {
  sortIntelligenceRankingItems,
  type IntelligenceRankingItem,
} from '../src/components/IntelligenceRanking';
import { allModels } from '../src/data/models';
import { evaluateModelEligibility } from '../src/lib/catalogEligibility';
import {
  isIntelligenceRankingEligible,
  rankIntelligenceModels,
} from '../src/lib/rankings';
import type { CatalogModel } from '../src/lib/catalogSchema';

const asOf = '2026-09-09';
const baseModel: CatalogModel = (() => {
  const model = allModels.find(
    (candidate) =>
      evaluateModelEligibility(candidate).status === 'active' &&
      candidate.facts.api &&
      candidate.facts.availability === 'Production API' &&
      candidate.scores.intelligence !== null &&
      candidate.scores.coding !== null &&
      candidate.scores.research !== null,
  );
  if (!model) throw new Error('Expected intelligence ranking fixture');
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

describe('intelligence ranking', () => {
  it('requires a current production API model with recent verification', () => {
    const current = copyModel({ lastVerifiedAt: asOf });
    expect(isIntelligenceRankingEligible(current, asOf)).toBe(true);
    expect(
      isIntelligenceRankingEligible(
        { ...current, facts: { ...current.facts, api: false } },
        asOf,
      ),
    ).toBe(false);
    expect(
      isIntelligenceRankingEligible(
        {
          ...current,
          facts: { ...current.facts, availability: 'Preview API' },
        },
        asOf,
      ),
    ).toBe(false);
    expect(
      isIntelligenceRankingEligible(
        { ...current, lastVerifiedAt: '2026-06-09' },
        asOf,
      ),
    ).toBe(false);
  });

  it('requires evidence for every weighted metric', () => {
    const model = copyModel({ lastVerifiedAt: asOf });
    model.evidence = model.evidence.filter(
      (evidence) => evidence.metric !== 'research',
    );
    expect(isIntelligenceRankingEligible(model, asOf)).toBe(false);
  });

  it('calculates the configured 80/10/10 score', () => {
    const model = copyModel({ lastVerifiedAt: asOf });
    model.scores = {
      ...model.scores,
      intelligence: 90,
      coding: 80,
      research: 70,
    };
    const [result] = rankIntelligenceModels([model], asOf);
    expect(result.rawScore).toBe(87);
    expect(result.score).toBe(87);
  });

  it('sorts in both directions without mutating source models', () => {
    const lower = copyModel({
      slug: 'ranking-lower',
      name: 'Ranking Lower',
      lastVerifiedAt: asOf,
    });
    lower.scores = { ...lower.scores, intelligence: 60 };
    const higher = copyModel({
      slug: 'ranking-higher',
      name: 'Ranking Higher',
      lastVerifiedAt: asOf,
    });
    higher.scores = { ...higher.scores, intelligence: 95 };
    const source = [lower, higher];

    expect(rankIntelligenceModels(source, asOf)[0].model.name).toBe(
      'Ranking Higher',
    );
    expect(rankIntelligenceModels(source, asOf, 'asc')[0].model.name).toBe(
      'Ranking Lower',
    );
    expect(source.map((model) => model.name)).toEqual([
      'Ranking Lower',
      'Ranking Higher',
    ]);
  });

  it('breaks equal scores by confidence, freshness, then name', () => {
    const older = copyModel({
      slug: 'ranking-older',
      name: 'A Older',
      confidence: 90,
      lastVerifiedAt: '2026-09-01',
    });
    const newer = copyModel({
      slug: 'ranking-newer',
      name: 'Z Newer',
      confidence: 90,
      lastVerifiedAt: asOf,
    });
    const lowerConfidence = copyModel({
      slug: 'ranking-low-confidence',
      name: 'Lower Confidence',
      confidence: 80,
      lastVerifiedAt: asOf,
    });

    expect(
      rankIntelligenceModels([lowerConfidence, older, newer], asOf).map(
        (result) => result.model.name,
      ),
    ).toEqual(['Z Newer', 'A Older', 'Lower Confidence']);
  });
});

describe('intelligence ranking control', () => {
  const items: IntelligenceRankingItem[] = [
    {
      slug: 'lower',
      name: 'Lower',
      provider: 'OpenAI',
      family: 'Test',
      description: 'Lower score.',
      tags: ['General'],
      weakness: 'Lower score',
      rank: 2,
      score: 70,
      rawScore: 70,
      confidence: 80,
      lastVerifiedAt: asOf,
      components: { intelligence: 70, coding: 70, research: 70 },
    },
    {
      slug: 'higher',
      name: 'Higher',
      provider: 'OpenAI',
      family: 'Test',
      description: 'Higher score.',
      tags: ['General'],
      weakness: 'Higher price',
      rank: 1,
      score: 90,
      rawScore: 90,
      confidence: 80,
      lastVerifiedAt: asOf,
      components: { intelligence: 90, coding: 90, research: 90 },
    },
  ];

  it('defaults to highest-first and renders both sort options', () => {
    const html = renderToStaticMarkup(
      createElement(IntelligenceRanking, { items }),
    );
    expect(html.indexOf('Higher')).toBeLessThan(html.indexOf('Lower'));
    expect(html).toContain('Highest to lowest');
    expect(html).toContain('Lowest to highest');
    expect(html).toContain('aria-pressed="true"');
  });

  it('sorts client items lowest-first when selected', () => {
    expect(sortIntelligenceRankingItems(items, 'asc')[0].name).toBe('Lower');
    expect(sortIntelligenceRankingItems(items, 'desc')[0].name).toBe('Higher');
  });
});
