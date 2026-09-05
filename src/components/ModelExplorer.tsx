import { useEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import ModelCard from './ModelCard';
import type { CatalogModel } from '../lib/catalogSchema';
import { metricLabels, type Metric } from '../data/config';
import { selectionFromSearch, getSpeedTokensPerSec } from '../lib/decision';
export default function ModelExplorer({ models }: { models: CatalogModel[] }) {
  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState('');
  const [sort, setSort] = useState('newest');
  const [minimum, setMinimum] = useState<Record<string, number>>({});
  const [price, setPrice] = useState('');
  const [context, setContext] = useState('0');
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get('q') ?? '');
    setSelected(selectionFromSearch(location.search, models));
  }, [models]);
  const visible = models
    .filter(
      (m) =>
        `${m.name} ${m.provider} ${m.tags.join(' ')}`
          .toLowerCase()
          .includes(query.toLowerCase().trim()) &&
        (!provider || m.provider === provider) &&
        (!price || m.pricing.input <= Number(price)) &&
        m.facts.context >= Number(context) &&
        (!minimum.speed || getSpeedTokensPerSec(m) >= minimum.speed) &&
        Object.entries(minimum)
          .filter(([k]) => k !== 'speed')
          .every(
            ([key, value]) =>
              m.scores[key as Metric] !== null &&
              (m.scores[key as Metric] as number) >= value,
          ) &&
        capabilities.every((key) =>
          Boolean(m.facts[key as 'vision' | 'api' | 'openWeights']),
        ),
    )
    .sort((a, b) => {
      if (sort === 'newest') {
        return (
          new Date(b.facts.releaseDate).getTime() -
          new Date(a.facts.releaseDate).getTime()
        );
      }
      if (sort === 'oldest') {
        return (
          new Date(a.facts.releaseDate).getTime() -
          new Date(b.facts.releaseDate).getTime()
        );
      }
      if (sort === 'price') return a.pricing.input - b.pricing.input;
      if (sort === 'context') return b.facts.context - a.facts.context;
      if (sort === 'speed')
        return getSpeedTokensPerSec(b) - getSpeedTokensPerSec(a);
      return (
        (b.scores[sort as Metric] ?? -1) - (a.scores[sort as Metric] ?? -1)
      );
    });
  function reset() {
    setQuery('');
    setProvider('');
    setPrice('');
    setContext('0');
    setMinimum({});
    setCapabilities([]);
  }
  function toggle(slug: string) {
    if (selected.includes(slug)) {
      setSelected(selected.filter((x) => x !== slug));
      setStatus('Model removed.');
    } else if (selected.length === 4)
      setStatus('You can compare up to 4 models. Remove one to add another.');
    else {
      setSelected([...selected, slug]);
      setStatus('Model added to comparison.');
    }
  }
  return (
    <>
      <div className="toolbar">
        <label className="field search-field">
          Search models
          <input
            type="search"
            placeholder="Search by name, provider, or use case"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="field">
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <optgroup label="Release Date">
              <option value="newest">Newest to Oldest (Release Date)</option>
              <option value="oldest">Oldest to Newest</option>
            </optgroup>
            <optgroup label="Core Pillars">
              <option value="intelligence">Highest Intelligence</option>
              <option value="speed">Fastest Speed (tokens/sec)</option>
              <option value="price">Lowest Input Price</option>
            </optgroup>
            <optgroup label="General">
              <option value="overall">Overall Score</option>
              <option value="context">Highest Context Window</option>
            </optgroup>
            <optgroup label="Detailed Capabilities">
              {Object.entries(metricLabels)
                .filter(
                  ([k]) => !['intelligence', 'speed', 'overall'].includes(k),
                )
                .map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
            </optgroup>
          </select>
        </label>
      </div>
      <div className="explorer-layout">
        <aside className="filters panel" aria-label="Model filters">
          <h2>Refine your search</h2>

          <div className="pillar-filter-card">
            <span className="micro pillar-tag">3 Core Pillars</span>

            <label className="field">
              Maximum input price / 1M
              <select value={price} onChange={(e) => setPrice(e.target.value)}>
                <option value="">Any price</option>
                <option value="0.25">$0.25 or less (Ultra cheap)</option>
                <option value="0.5">$0.50 or less</option>
                <option value="1">$1 or less</option>
                <option value="3">$3 or less</option>
                <option value="5">$5 or less</option>
              </select>
            </label>

            <label className="field">
              Min Intelligence: {minimum.intelligence ?? 0}
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minimum.intelligence ?? 0}
                onChange={(e) =>
                  setMinimum({
                    ...minimum,
                    intelligence: Number(e.target.value),
                  })
                }
              />
            </label>

            <label className="field">
              Min Speed: {minimum.speed ? `${minimum.speed} tokens/sec` : 'Any'}
              <input
                type="range"
                min="0"
                max="220"
                step="10"
                value={minimum.speed ?? 0}
                onChange={(e) =>
                  setMinimum({ ...minimum, speed: Number(e.target.value) })
                }
              />
            </label>
          </div>

          <label className="field">
            Provider
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="">All providers</option>
              {[...new Set(models.map((m) => m.provider))].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>

          <details className="secondary-filter-details">
            <summary>Secondary capabilities & specs</summary>
            <label className="field">
              Minimum context
              <select
                value={context}
                onChange={(e) => setContext(e.target.value)}
              >
                <option value="0">Any size</option>
                <option value="128000">128K tokens</option>
                <option value="200000">200K tokens</option>
                <option value="1000000">1M tokens</option>
              </select>
            </label>
            {(['vision', 'api', 'openWeights'] as const).map((key, i) => (
              <label className="checkbox-label" key={key}>
                <input
                  type="checkbox"
                  checked={capabilities.includes(key)}
                  onChange={(e) =>
                    setCapabilities(
                      e.target.checked
                        ? [...capabilities, key]
                        : capabilities.filter((x) => x !== key),
                    )
                  }
                />
                {['Vision support', 'API available', 'Open weights'][i]}
              </label>
            ))}
            {(
              ['overall', 'coding', 'agentic', 'dailyUse', 'research'] as const
            ).map((key) => (
              <label className="field" key={key}>
                {metricLabels[key]}: {minimum[key] ?? 0}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={minimum[key] ?? 0}
                  onChange={(e) =>
                    setMinimum({ ...minimum, [key]: Number(e.target.value) })
                  }
                />
              </label>
            ))}
          </details>

          <button className="button" onClick={reset}>
            Reset filters
          </button>
        </aside>
        <div>
          <p className="result-count" role="status">
            {visible.length} of {models.length}{' '}
            {models[0]?.dataKind === 'verified'
              ? 'verified models'
              : 'sample models'}
          </p>
          {visible.length ? (
            <div className="model-grid explorer-grid">
              {visible.map((model) => (
                <ModelCard
                  key={model.slug}
                  model={model}
                  selected={selected.includes(model.slug)}
                  onSelect={() => toggle(model.slug)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>No models match yet.</h2>
              <p>Try a broader search or remove a filter.</p>
              <button className="button primary" onClick={reset}>
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="status-text" aria-live="polite">
        {status}
      </p>
      {selected.length > 0 && (
        <div className="compare-tray">
          <strong>{selected.length} / 4 selected</strong>
          {selected.map((slug) => (
            <span className="selection-chip" key={slug}>
              {models.find((m) => m.slug === slug)?.name}
              <button
                aria-label={`Remove ${models.find((m) => m.slug === slug)?.name}`}
                onClick={() => toggle(slug)}
              >
                <X size={13} />
              </button>
            </span>
          ))}
          {selected.length >= 2 ? (
            <a
              className="button primary"
              href={`/compare?models=${selected.join(',')}`}
            >
              Compare models <ArrowRight size={15} />
            </a>
          ) : (
            <span className="micro">Add one more to compare</span>
          )}
        </div>
      )}
    </>
  );
}
