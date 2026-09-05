import { ArrowUpRight, Plus, Check } from 'lucide-react';
import type { CatalogModel } from '../lib/catalogSchema';
import { contextSize, money, getSpeedTokensPerSec } from '../lib/decision';
import { ProviderLogo } from './ProviderLogo';

export function ModelMark({ model }: { model: CatalogModel }) {
  return (
    <span
      className={`model-mark provider-${model.family.toLowerCase()}`}
      aria-hidden="true"
    >
      {model.family.slice(0, 1)}
    </span>
  );
}
export default function ModelCard({
  model,
  selected,
  onSelect,
}: {
  model: CatalogModel;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const speedTps = getSpeedTokensPerSec(model);
  const isReasoning =
    model.facts.reasoningEffort &&
    model.facts.reasoningEffort.length > 0 &&
    !model.facts.reasoningEffort.includes('none');

  return (
    <article className="model-card">
      <div className="card-top">
        <div className="provider-badge">
          <ProviderLogo provider={model.provider} size={16} />
          <span className="micro">{model.provider}</span>
        </div>
        {isReasoning ? (
          <span
            className={`effort-badge ${model.facts.reasoningEffort?.includes('fixed') ? 'effort-fixed' : ''}`}
            title={`Reasoning effort tiers: ${model.facts.reasoningEffort?.join(', ')}`}
          >
            {model.facts.reasoningEffort?.includes('fixed')
              ? 'Fixed CoT'
              : `Effort: ${model.facts.defaultEffort !== 'none' ? model.facts.defaultEffort : 'Selectable'}`}
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
          aria-label={`${model.name} overall score ${model.scores.overall ?? 'unavailable'}, see explanation`}
        >
          {model.scores.overall !== null ? model.scores.overall : '—'}
          <small>/100</small>
        </a>
      </div>
      <p className="card-description">{model.description}</p>
      <div className="mini-metrics">
        <div>
          <span>Intelligence</span>
          <strong
            title={
              model.scores.intelligence !== null
                ? `Intelligence: ${model.scores.intelligence}/100`
                : 'Intelligence benchmark unavailable'
            }
          >
            {model.scores.intelligence !== null
              ? model.scores.intelligence
              : '—'}
          </strong>
        </div>
        <div>
          <span>Speed</span>
          <strong
            title={
              speedTps > 0
                ? `Generation speed: ${speedTps} tokens/sec`
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
        <div>
          <span>Price (1M)</span>
          <strong
            title={`Input cost: ${money(model.pricing.input)} per 1M tokens`}
          >
            {money(model.pricing.input)}
          </strong>
        </div>
      </div>
      <div className="tags">
        {model.tags.slice(0, 2).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="card-pricing">
        <span>
          Output: <strong>{money(model.pricing.output)}</strong>{' '}
          <span className="muted">/ 1M</span>
        </span>
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
          <a className="compare-add" href={`/compare?models=${model.slug}`}>
            <Plus size={14} /> Compare
          </a>
        )}
      </div>
    </article>
  );
}
