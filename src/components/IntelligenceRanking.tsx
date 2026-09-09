import { useMemo, useState } from 'react';
import { ProviderLogo } from './ProviderLogo';
import { RankingSortControls } from './RankingSortControls';
import type { RankingDirection } from '../lib/rankings';

export interface IntelligenceRankingItem {
  slug: string;
  name: string;
  provider: string;
  family: string;
  description: string;
  tags: string[];
  weakness: string;
  rank: number;
  score: number;
  rawScore: number;
  confidence: number;
  lastVerifiedAt: string;
  components: {
    intelligence: number;
    coding: number;
    research: number;
  };
}

export function sortIntelligenceRankingItems(
  items: IntelligenceRankingItem[],
  direction: RankingDirection,
): IntelligenceRankingItem[] {
  return [...items].sort((a, b) => {
    const scoreDifference =
      direction === 'desc' ? b.rawScore - a.rawScore : a.rawScore - b.rawScore;
    if (scoreDifference !== 0) return scoreDifference;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    const dateDifference = b.lastVerifiedAt.localeCompare(a.lastVerifiedAt);
    if (dateDifference !== 0) return dateDifference;
    return a.name.localeCompare(b.name);
  });
}

export default function IntelligenceRanking({
  items,
}: {
  items: IntelligenceRankingItem[];
}) {
  const [direction, setDirection] = useState<RankingDirection>('desc');
  const sortedItems = useMemo(
    () => sortIntelligenceRankingItems(items, direction),
    [items, direction],
  );

  return (
    <>
      <RankingSortControls
        id="intelligence-ranking-order"
        direction={direction}
        onDirectionChange={setDirection}
        totalCount={sortedItems.length}
      />

      {sortedItems.length === 0 ? (
        <div className="panel ranking-empty" role="status">
          No current production models have enough recent intelligence evidence
          to rank.
        </div>
      ) : (
        <div className="ranking-list">
          {sortedItems.map((item) => (
            <article className="panel ranking-row" key={item.slug}>
              <div className="ranking-row-header">
                <div className="ranking-identity">
                  <span className="rank-position">
                    {String(item.rank).padStart(2, '0')}
                  </span>
                  <span
                    className={`model-mark provider-${item.family.toLowerCase()}`}
                    aria-hidden="true"
                  >
                    <ProviderLogo provider={item.provider} size={18} />
                  </span>
                  <h3>
                    <a href={`/models/${item.slug}`}>{item.name}</a>
                  </h3>
                </div>
                <a
                  className="score-number"
                  href={`/models/${item.slug}#score-intelligence`}
                  aria-label={`${item.name} intelligence ranking score ${item.score} out of 100`}
                >
                  {item.score}
                  <small>Intelligence fit / 100</small>
                </a>
              </div>
              <div className="ranking-row-content">
                <p>
                  {item.description} Choose it for{' '}
                  {item.tags.slice(0, 2).join(' and ').toLowerCase()}.
                </p>
                <div className="rank-notes">
                  <span>
                    Components: intelligence {item.components.intelligence},
                    coding {item.components.coding}, research{' '}
                    {item.components.research}
                  </span>
                  <span>Tradeoff: {item.weakness.toLowerCase()}</span>
                  <a href={`/compare?models=${item.slug}`}>Add to comparison</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
