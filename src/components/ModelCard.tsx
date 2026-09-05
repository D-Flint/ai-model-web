import { ArrowUpRight, Plus, Check } from 'lucide-react';
import type { CatalogModel } from '../lib/catalogSchema';
import { contextSize, money } from '../lib/decision';
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
  return (
    <article className="model-card">
      <div className="card-top">
        <ModelMark model={model} />
        <span className="micro">{model.provider}</span>
        <span className="sample-label">Sample</span>
      </div>
      <div className="model-title">
        <h3>
          <a href={`/models/${model.slug}`}>{model.name}</a>
        </h3>
        <a
          href={`/models/${model.slug}#scores`}
          className="score-number"
          aria-label={`${model.name} overall score ${model.scores.overall}, see explanation`}
        >
          {model.scores.overall}
          <small>/100</small>
        </a>
      </div>
      <p className="card-description">{model.description}</p>
      <div className="mini-metrics">
        {(['coding', 'agentic', 'dailyUse'] as const).map((key, i) => (
          <div key={key}>
            <span>{['Coding', 'Agents', 'Daily use'][i]}</span>
            <strong>{model.scores[key]}</strong>
          </div>
        ))}
      </div>
      <div className="tags">
        {model.tags.slice(0, 2).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="card-pricing">
        <span>
          <strong>{money(model.pricing.input)}</strong> input{' '}
          <span className="muted">/ 1M</span>
        </span>
        <span>{contextSize(model.facts.context)} context</span>
      </div>
      <div className="card-pricing output-price">
        <span>{money(model.pricing.output)} output / 1M tokens</span>
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
