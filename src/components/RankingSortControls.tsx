import type { RankingDirection } from '../lib/rankings';
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react';

interface Props {
  id: string;
  direction: RankingDirection;
  onDirectionChange: (direction: RankingDirection) => void;
  totalCount: number;
  isPrice?: boolean;
}

export function RankingSortControls({
  id,
  direction,
  onDirectionChange,
  totalCount,
  isPrice = false,
}: Props) {
  const toggleDirection = () => {
    onDirectionChange(direction === 'desc' ? 'asc' : 'desc');
  };

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
        <label htmlFor={id} className="ranking-sort-label">
          Sort ranking
        </label>
        <div className="ranking-select-wrapper">
          <span className="ranking-select-icon" aria-hidden="true">
            {direction === 'desc' ? (
              <ArrowDownNarrowWide size={14} />
            ) : (
              <ArrowUpNarrowWide size={14} />
            )}
          </span>
          <select
            id={id}
            value={direction}
            onChange={(event) =>
              onDirectionChange(event.target.value as RankingDirection)
            }
            className="ranking-select"
          >
            {isPrice ? (
              <>
                <option value="asc">Lowest to highest</option>
                <option value="desc">Highest to lowest</option>
              </>
            ) : (
              <>
                <option value="desc">Highest to lowest</option>
                <option value="asc">Lowest to highest</option>
              </>
            )}
          </select>
          <ChevronDown
            size={14}
            className="ranking-select-arrow"
            aria-hidden="true"
          />
        </div>
        <button
          type="button"
          onClick={toggleDirection}
          className="ranking-sort-toggle-btn"
          title={`Invert sort order (${direction === 'desc' ? 'currently highest to lowest' : 'currently lowest to highest'})`}
          aria-label={`Invert sort order: currently ${direction === 'desc' ? 'highest to lowest' : 'lowest to highest'}`}
        >
          <ArrowUpDown size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default RankingSortControls;
