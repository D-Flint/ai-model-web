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
        <div
          className="ranking-sort-options"
          role="group"
          aria-labelledby={`${id}-label`}
        >
          <button
            type="button"
            className={`ranking-sort-option ${
              direction === 'desc' ? 'is-selected' : ''
            }`}
            aria-pressed={direction === 'desc'}
            onClick={() => onDirectionChange('desc')}
          >
            <ArrowDownNarrowWide size={14} aria-hidden="true" />
            Highest to lowest
          </button>
          <button
            type="button"
            className={`ranking-sort-option ${
              direction === 'asc' ? 'is-selected' : ''
            }`}
            aria-pressed={direction === 'asc'}
            onClick={() => onDirectionChange('asc')}
          >
            <ArrowUpNarrowWide size={14} aria-hidden="true" />
            Lowest to highest
          </button>
        </div>
      </div>
    </div>
  );
}

export default RankingSortControls;
