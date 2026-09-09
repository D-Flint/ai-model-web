import { useMemo, useState } from 'react';
import { formatPrice } from '../lib/apiPricing';
import type { RankingDirection } from '../lib/rankings';
import { ProviderLogo } from './ProviderLogo';
import { RankingSortControls } from './RankingSortControls';

export interface MetricRankingItem {
  slug: string;
  name: string;
  provider: string;
  family: string;
  description: string;
  tags: string[];
  weakness: string;
  rank: number;
  value: number;
  tieScore: number;
  verifiedAt: string;
}

interface Props {
  items: MetricRankingItem[];
  metricLabel: string;
  metricAnchor: string;
  valueKind: 'score' | 'price';
  defaultDirection: RankingDirection;
}

export function sortMetricRankingItems(
  items: MetricRankingItem[],
  direction: RankingDirection,
): MetricRankingItem[] {
  return [...items].sort((a, b) => {
    const valueDifference =
      direction === 'desc' ? b.value - a.value : a.value - b.value;
    if (valueDifference !== 0) return valueDifference;
    if (b.tieScore !== a.tieScore) return b.tieScore - a.tieScore;
    const dateDifference = b.verifiedAt.localeCompare(a.verifiedAt);
    if (dateDifference !== 0) return dateDifference;
    return a.name.localeCompare(b.name);
  });
}

export default function MetricRanking({
  items,
  metricLabel,
  metricAnchor,
  valueKind,
  defaultDirection,
}: Props) {
  const [direction, setDirection] =
    useState<RankingDirection>(defaultDirection);
  const sortedItems = useMemo(
    () => sortMetricRankingItems(items, direction),
    [items, direction],
  );
  const isPrice = valueKind === 'price';

  return (
    <>
      <RankingSortControls
        id={`${metricAnchor}-ranking-order`}
        direction={direction}
        onDirectionChange={setDirection}
        totalCount={sortedItems.length}
      />

      {sortedItems.length === 0 ? (
        <div className="panel ranking-empty" role="status">
          No current production models have recent verified{' '}
          {metricLabel.toLowerCase()} data.
        </div>
      ) : (
        <div className="ranking-list">
          {sortedItems.map((item) => (
            <article className="panel ranking-row" key={item.slug}>
              <div>
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
                <p>
                  {item.description} Choose it for{' '}
                  {item.tags.slice(0, 2).join(' and ').toLowerCase()}.
                </p>
                <div className="rank-notes">
                  <span>
                    {isPrice
                      ? `Verified input price: ${formatPrice(item.value)} / 1M tokens`
                      : `Evidence-backed ${metricLabel.toLowerCase()} score: ${item.value}/100`}
                  </span>
                  <span>Tradeoff: {item.weakness.toLowerCase()}</span>
                  <a href={`/compare?models=${item.slug}`}>Add to comparison</a>
                </div>
              </div>
              <a
                className="score-number"
                href={`/models/${item.slug}#${metricAnchor}`}
                aria-label={`${item.name} ${metricLabel.toLowerCase()} ${isPrice ? formatPrice(item.value) : `${item.value} out of 100`}`}
              >
                {isPrice ? formatPrice(item.value) : item.value}
                <small>
                  {isPrice ? 'input / 1M tokens' : `${metricLabel} / 100`}
                </small>
              </a>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
