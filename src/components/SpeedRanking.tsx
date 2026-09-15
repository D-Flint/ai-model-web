import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { ProviderLogo } from './ProviderLogo';
import { RankingSortControls } from './RankingSortControls';
import type { RankingDirection } from '../lib/rankings';

export interface SpeedRankingItem {
  slug: string;
  name: string;
  provider: string;
  family: string;
  description: string;
  tags: string[];
  weakness: string;
  rank: number;
  speedTokensPerSec: number;
  range: { min: number; max: number } | null;
  confidence: number;
  speedVerifiedAt: string;
}

export function sortSpeedRankingItems(
  items: SpeedRankingItem[],
  direction: RankingDirection,
): SpeedRankingItem[] {
  return [...items].sort((a, b) => {
    const speedDifference =
      direction === 'desc'
        ? b.speedTokensPerSec - a.speedTokensPerSec
        : a.speedTokensPerSec - b.speedTokensPerSec;
    if (speedDifference !== 0) return speedDifference;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    const dateDifference = b.speedVerifiedAt.localeCompare(a.speedVerifiedAt);
    if (dateDifference !== 0) return dateDifference;
    return a.name.localeCompare(b.name);
  });
}

export default function SpeedRanking({ items }: { items: SpeedRankingItem[] }) {
  const [direction, setDirection] = useState<RankingDirection>('desc');
  const sortedItems = useMemo(
    () => sortSpeedRankingItems(items, direction),
    [items, direction],
  );

  return (
    <>
      <RankingSortControls
        id="speed-ranking-order"
        direction={direction}
        onDirectionChange={setDirection}
        totalCount={sortedItems.length}
      />

      {sortedItems.length === 0 ? (
        <div className="panel ranking-empty" role="status">
          No current production models have recent verified speed data.
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
                  href={`/models/${item.slug}#score-speed`}
                >
                  {item.speedTokensPerSec}
                  <small>{item.range ? 'peak tokens/sec' : 'tokens/sec'}</small>
                </a>
              </div>
              <div className="ranking-row-content">
                <p>
                  {item.description} Choose it for{' '}
                  {item.tags.slice(0, 2).join(' and ').toLowerCase()}.
                </p>
                <div className="rank-notes">
                  <div className="rank-notes-meta">
                    <span className="speed-measurement">
                      {item.range
                        ? `Measured range: ${item.range.min}–${item.range.max} tokens/sec`
                        : `Verified speed: ${item.speedTokensPerSec} tokens/sec`}
                    </span>
                    <span>Tradeoff: {item.weakness.toLowerCase()}</span>
                  </div>
                  <a
                    className="rank-compare-btn"
                    href={`/compare?models=${item.slug}`}
                  >
                    <Plus size={12} strokeWidth={2.5} aria-hidden="true" />
                    Add to comparison
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
