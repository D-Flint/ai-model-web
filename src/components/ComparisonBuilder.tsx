import { useEffect, useState } from 'react';
import { Copy, X, ArrowRight } from 'lucide-react';
import type { CatalogModel } from '../lib/catalogSchema';
import { metricLabels, type Metric } from '../data/config';
import {
  contextSize,
  money,
  rankModels,
  selectionFromSearch,
  taskCost,
} from '../lib/decision';
import { ModelMark } from './ModelCard';
import { ProviderLogo } from './ProviderLogo';
const groups: { name: string; metrics: Metric[] }[] = [
  {
    name: 'Performance',
    metrics: [
      'overall',
      'intelligence',
      'coding',
      'agentic',
      'dailyUse',
      'writing',
      'research',
      'vision',
    ],
  },
  { name: 'Experience', metrics: ['speed', 'reliability'] },
  { name: 'Economics', metrics: ['costEfficiency'] },
];
export default function ComparisonBuilder({
  models,
  initial = [],
}: {
  models: CatalogModel[];
  initial?: string[];
}) {
  const [selection, setSelection] = useState<string[]>(
    initial.length ? initial : models.slice(0, 2).map((m) => m.slug),
  );
  const [add, setAdd] = useState('');
  const [status, setStatus] = useState('');
  useEffect(() => {
    if (new URLSearchParams(location.search).has('models'))
      setSelection(selectionFromSearch(location.search, models));
  }, [models]);
  const selected = selection
    .map((slug) => models.find((m) => m.slug === slug))
    .filter((m): m is CatalogModel => Boolean(m));
  function update(next: string[]) {
    setSelection(next);
    const url = new URL(location.href);
    url.searchParams.set('models', next.join(','));
    history.replaceState(null, '', url);
  }
  async function copy() {
    const url = new URL('/compare', location.origin);
    url.searchParams.set('models', selection.join(','));
    try {
      await navigator.clipboard.writeText(url.href);
      setStatus('Comparison link copied.');
    } catch {
      setStatus(`Copy this link: ${url.href}`);
    }
  }
  const facts: { label: string; value: (m: CatalogModel) => string }[] = [
    {
      label: 'Reasoning effort',
      value: (m) =>
        m.facts.reasoningEffort &&
        m.facts.reasoningEffort.length > 0 &&
        !m.facts.reasoningEffort.includes('none')
          ? m.facts.reasoningEffort.includes('fixed')
            ? 'Fixed CoT'
            : `Selectable (${m.facts.reasoningEffort.join(', ')})`
          : 'Standard (Instant)',
    },
    {
      label: 'Context window',
      value: (m) => contextSize(m.facts.context) + ' tokens',
    },
    {
      label: 'Maximum output',
      value: (m) => contextSize(m.facts.maxOutput) + ' tokens',
    },
    ...(
      ['vision', 'audio', 'tools', 'structured', 'api', 'openWeights'] as const
    ).map((key, i) => ({
      label: [
        'Vision input',
        'Audio input',
        'Tool use',
        'Structured output',
        'API available',
        'Open weights',
      ][i],
      value: (m: CatalogModel) => (m.facts[key] ? 'Yes' : 'No'),
    })),
  ];
  return (
    <>
      <div className="compare-controls">
        <label className="field">
          Add a model
          <select
            value={add}
            disabled={selection.length >= 4}
            onChange={(e) => {
              const slug = e.target.value;
              if (slug) {
                update([...selection, slug]);
                setAdd('');
              }
            }}
          >
            <option value="">
              {selection.length >= 4 ? '4 models selected' : 'Choose a model…'}
            </option>
            {models
              .filter((m) => !selection.includes(m.slug))
              .map((m) => (
                <option value={m.slug} key={m.slug}>
                  {m.name}
                </option>
              ))}
          </select>
        </label>
        <button className="button" onClick={copy}>
          <Copy size={15} /> Copy comparison link
        </button>
      </div>
      <div className="selected-models">
        {selected.map((m) => (
          <span className="selection-chip" key={m.slug}>
            <ModelMark model={m} />
            {m.name}
            <button
              onClick={() => update(selection.filter((x) => x !== m.slug))}
              aria-label={`Remove ${m.name}`}
            >
              <X size={15} />
            </button>
          </span>
        ))}
      </div>
      <p className="status-text" role="status">
        {status}
      </p>
      {selected.length < 2 ? (
        <div className="empty-state">
          <h2>Pick at least two models.</h2>
          <p>
            Add up to four to see scores, prices, and practical tradeoffs side
            by side.
          </p>
        </div>
      ) : (
        <>
          <p className="section-note">
            Sample data. Highlighted cells show the best value in the selected
            group; ties are highlighted equally. Swipe the table on smaller
            screens.
          </p>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Model comparison table"
          >
            <table className="comparison-table">
              <caption className="sr-only">
                Sample model comparison, scores out of 100 and USD API prices
              </caption>
              <thead>
                <tr>
                  <th scope="col">At a glance</th>
                  {selected.map((m) => (
                    <th scope="col" key={m.slug}>
                      <div
                        className="provider-badge"
                        style={{ marginBottom: '4px' }}
                      >
                        <ProviderLogo provider={m.provider} size={15} />
                        <span className="micro">{m.provider}</span>
                      </div>
                      <a href={`/models/${m.slug}`}>{m.name}</a>
                      {m.facts.reasoningEffort &&
                        m.facts.reasoningEffort.length > 0 &&
                        !m.facts.reasoningEffort.includes('none') && (
                          <div style={{ marginTop: '4px' }}>
                            <span
                              className={`effort-badge ${m.facts.reasoningEffort.includes('fixed') ? 'effort-fixed' : ''}`}
                            >
                              {m.facts.reasoningEffort.includes('fixed')
                                ? 'Fixed CoT'
                                : `Effort: ${m.facts.defaultEffort !== 'none' ? m.facts.defaultEffort : 'Selectable'}`}
                            </span>
                          </div>
                        )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <ComparisonGroup
                    key={group.name}
                    group={group}
                    selected={selected}
                  />
                ))}
                {(['input', 'output', 'cached'] as const).map((key, i) => (
                  <tr key={key}>
                    <th scope="row">
                      {
                        [
                          'Input / 1M tokens',
                          'Output / 1M tokens',
                          'Cached input / 1M',
                        ][i]
                      }
                    </th>
                    {selected.map((m) => (
                      <td
                        key={m.slug}
                        className={
                          m.pricing[key] ===
                          Math.min(
                            ...selected.map((x) => x.pricing[key] ?? Infinity),
                          )
                            ? 'winner'
                            : ''
                        }
                      >
                        {m.pricing[key] === null
                          ? 'Not available'
                          : money(m.pricing[key])}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row">Estimated task cost</th>
                  {selected.map((m) => (
                    <td
                      key={m.slug}
                      className={
                        taskCost(m) ===
                        Math.min(...selected.map((x) => taskCost(x)))
                          ? 'winner'
                          : ''
                      }
                    >
                      {money(taskCost(m), 4)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Ease of use / 100</th>
                  {selected.map((m) => (
                    <td key={m.slug}>{m.facts.easeOfUse}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Availability</th>
                  {selected.map((m) => (
                    <td key={m.slug}>{m.facts.availability}</td>
                  ))}
                </tr>
                <tr className="group-row">
                  <th colSpan={selected.length + 1}>Technical facts</th>
                </tr>
                {facts.map((f) => (
                  <tr key={f.label}>
                    <th scope="row">{f.label}</th>
                    {selected.map((m) => (
                      <td key={m.slug}>{f.value(m)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="section-note">
            Task estimate: 1,000 input + 500 output tokens, one attempt, no
            tools. <a href="/cost">Adjust the assumptions</a>.
          </p>
          <section className="section">
            <h2>The short version</h2>
            <div className="verdict-grid">
              {(
                [
                  'overall',
                  'costEfficiency',
                  'coding',
                  'agentic',
                  'dailyUse',
                ] as const
              ).map((metric) => {
                const m = rankModels(selected, metric)[0];
                return (
                  <article className="panel" key={metric}>
                    <span className="micro">
                      {metric === 'costEfficiency'
                        ? 'Best value'
                        : `Best ${metricLabels[metric].toLowerCase()}`}{' '}
                      in this selection
                    </span>
                    <h3>{m.name}</h3>
                    <p>
                      {m.scores[metric]}/100 on{' '}
                      {metricLabels[metric].toLowerCase()}. {m.weaknesses[0]} is
                      the main tradeoff.
                    </p>
                    <a className="text-link" href={`/models/${m.slug}`}>
                      Explore the evidence <ArrowRight size={14} />
                    </a>
                  </article>
                );
              })}
            </div>
          </section>
          <section className="section">
            <h2>Choose based on your work</h2>
            <div className="verdict-grid">
              {selected.map((m) => (
                <article className="panel" key={m.slug}>
                  <h3>Choose {m.name} if…</h3>
                  <p>
                    {m.tags.slice(0, 2).join(' and ').toLowerCase()} matter most
                    to you in this sample. {m.description}
                  </p>
                  <p>Keep in mind: {m.weaknesses.join('; ').toLowerCase()}.</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
function ComparisonGroup({
  group,
  selected,
}: {
  group: { name: string; metrics: Metric[] };
  selected: CatalogModel[];
}) {
  return (
    <>
      <tr className="group-row">
        <th colSpan={selected.length + 1}>{group.name}</th>
      </tr>
      {group.metrics.map((metric) => (
        <tr key={metric}>
          <th scope="row">{metricLabels[metric]}</th>
          {selected.map((m) => (
            <td
              key={m.slug}
              className={
                m.scores[metric] ===
                Math.max(...selected.map((x) => x.scores[metric]))
                  ? 'winner'
                  : ''
              }
            >
              <a href={`/models/${m.slug}#score-${metric}`}>
                {m.scores[metric]}
              </a>
              {m.scores[metric] ===
                Math.max(...selected.map((x) => x.scores[metric])) && (
                <span className="winner-label">Best in selection</span>
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
