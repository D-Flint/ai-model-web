import type { RankingDirection } from '../lib/rankings';
import { ArrowDownNarrowWide, ArrowUpNarrowWide } from 'lucide-react';

interface Props {
  id: string;
  direction: RankingDirection;
  onDirectionChange: (direction: RankingDirection) => void;
  totalCount: number;
}

export function RankingSortControls({
  id,
  direction,
  onDirectionChange,
  totalCount,
}: Props) {
  const isAscending = direction === 'asc';
  const directionLabel = isAscending
    ? 'Lowest to highest'
    : 'Highest to lowest';
  const nextDirectionLabel = isAscending
    ? 'Highest to lowest'
    : 'Lowest to highest';

  return (
    <div className="ranking-controls">
      <div className="ranking-controls-meta">
        {totalCount > 0 && (
          <span className="ranking-count-badge">
            <span className="ranking-count-dot" aria-hidden="true" />
            {totalCount} verified {totalCount === 1 ? 'model' : 'models'}
          </span>
        )}
      </div>

      <div className="ranking-sort-group">
        <span id={`${id}-label`} className="ranking-sort-label">
          Sort ranking
        </span>
        <button
          type="button"
          className="ranking-sort-toggle"
          aria-pressed={isAscending}
          aria-label={`Sort ranking: ${directionLabel}. Activate to sort ${nextDirectionLabel.toLowerCase()}.`}
          onClick={() => onDirectionChange(isAscending ? 'desc' : 'asc')}
        >
          {isAscending ? (
            <ArrowUpNarrowWide size={14} aria-hidden="true" />
          ) : (
            <ArrowDownNarrowWide size={14} aria-hidden="true" />
          )}
          {directionLabel}
        </button>
      </div>
    </div>
  );
}

export default RankingSortControls;
