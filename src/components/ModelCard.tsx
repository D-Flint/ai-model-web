import ApiPricing from './ApiPricing';
import { ArrowUpRight, Plus, Check } from 'lucide-react';
import type { CatalogModel } from '../lib/catalogSchema';
import {
  contextSize,
  getMaxReasoningEffort,
  getModelEffortStats,
} from '../lib/decision';
import { ProviderLogo } from './ProviderLogo';

export function ModelMark({
  model,
  size = 18,
  className = '',
}: {
  model: CatalogModel;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`model-mark provider-${model.family.toLowerCase()} ${className}`.trim()}
      aria-hidden="true"
    >
      <ProviderLogo provider={model.provider} size={size} />
    </span>
  );
}
export default function ModelCard({
  model,
  selected,
  onSelect,
  badgeText,
}: {
  model: CatalogModel;
  selected?: boolean;
  onSelect?: () => void;
  badgeText?: string;
}) {
  const maxEffort = getMaxReasoningEffort(model);
  const isReasoning = maxEffort !== 'none';
  const stats = getModelEffortStats(model, maxEffort);
  const speedTps = stats.speedTokensPerSec;

  return (
    <article className={`model-card ${selected ? 'selected' : ''}`.trim()}>
      <div className="card-top">
        <div className="provider-badge">
          <ProviderLogo provider={model.provider} size={16} />
          <span className="micro">{model.provider}</span>
          {model.facts.releaseDate && (
            <span
              className="release-date micro"
              title={`Released: ${model.facts.releaseDate}`}
            >
              {model.facts.releaseDate}
            </span>
          )}
        </div>
        {badgeText ? (
          <span className="effort-badge openrouter-badge" title={badgeText}>
            {badgeText}
          </span>
        ) : isReasoning ? (
          <span
            className={`effort-badge ${maxEffort === 'fixed' ? 'effort-fixed' : ''}`}
            title={`Reasoning effort tiers: ${model.facts.reasoningEffort?.join(', ')} (Card effort: ${maxEffort})`}
          >
            {maxEffort === 'fixed' ? 'Fixed CoT' : `Effort: ${maxEffort}`}
          </span>
        ) : model.dataKind === 'verified' ? (
          <span className="sample-label verified-label">Verified</span>
        ) : (
          <span className="sample-label">Sample</span>
        )}
      </div>
      <div className="model-title">
        <h3>
          <a href={`/models/${model.slug}`}>{model.name}</a>
        </h3>
        <a
          href={`/models/${model.slug}#scores`}
          className="score-number"
          aria-label={`${model.name} overall score ${stats.scores.overall ?? 'unavailable'}, see explanation`}
        >
          {stats.scores.overall !== null ? stats.scores.overall : '—'}
          <small>/100</small>
        </a>
      </div>
      <p className="card-description">{model.description}</p>
      <div className="mini-metrics">
        <div>
          <span>Intelligence</span>
          <strong
            title={
              stats.scores.intelligence !== null
                ? `Intelligence: ${stats.scores.intelligence}/100${isReasoning && maxEffort !== 'fixed' ? ` (${maxEffort} effort)` : ''}`
                : 'Intelligence benchmark unavailable'
            }
          >
            {stats.scores.intelligence !== null
              ? stats.scores.intelligence
              : '—'}
          </strong>
        </div>
        <div>
          <span>Speed</span>
          <strong
            title={
              speedTps > 0
                ? `Generation speed: ${speedTps} tokens/sec${isReasoning && maxEffort !== 'fixed' ? ` (${maxEffort} effort)` : ''}`
                : 'Speed benchmark not yet claimed'
            }
          >
            {speedTps > 0 ? (
              <>
                {speedTps} <small className="micro muted">tok/s</small>
              </>
            ) : (
              <span className="muted">—</span>
            )}
          </strong>
        </div>
      </div>
      <div className="tags">
        {model.tags.slice(0, 2).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <ApiPricing model={model} />
      <div className="card-pricing">
        <span>{contextSize(model.facts.context)} context</span>
      </div>
      <div className="card-bottom">
        <a href={`/models/${model.slug}`}>
          View details <ArrowUpRight size={14} />
        </a>
        {onSelect ? (
          <button
            className={selected ? 'compare-add selected' : 'compare-add'}
            onClick={onSelect}
            aria-pressed={selected}
          >
            {selected ? <Check size={14} /> : <Plus size={14} />}{' '}
            {selected ? 'Added' : 'Compare'}
          </button>
        ) : (
          <a
            className="compare-add"
            href={`/compare?models=${model.slug}${isReasoning && maxEffort !== 'fixed' ? `:${maxEffort}` : ''}`}
          >
            <Plus size={14} /> Compare
          </a>
        )}
      </div>
    </article>
  );
}
