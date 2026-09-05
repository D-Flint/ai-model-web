import { useEffect, useState } from 'react';
import { Copy, X, ArrowRight, Plus } from 'lucide-react';
import type { CatalogModel } from '../lib/catalogSchema';
import {
  effortLabels,
  metricLabels,
  type Metric,
  type ReasoningEffort,
} from '../data/config';
import {
  contextSize,
  getModelEffortStats,
  money,
  selectionFromSearch,
  type ModelEffortStats,
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

export interface ComparedColumn {
  id: string;
  token: string;
  model: CatalogModel;
  effort: ReasoningEffort;
  isReasoning: boolean;
  availableEfforts: ReasoningEffort[];
  stats: ModelEffortStats;
}

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

  function update(next: string[]) {
    setSelection(next);
    const url = new URL(location.href);
    url.searchParams.set('models', next.join(','));
    history.replaceState(null, '', url);
  }

  const selectedItems: ComparedColumn[] = selection
    .map((token, index) => {
      const [slug, effortSuffix] = token.split(':');
      const model = models.find((m) => m.slug === slug);
      if (!model) return null;

      const isReasoning = Boolean(
        model.facts.reasoningEffort &&
          model.facts.reasoningEffort.length > 0 &&
          !model.facts.reasoningEffort.includes('none'),
      );

      const availableEfforts: ReasoningEffort[] = isReasoning
        ? model.facts.reasoningEffort.filter((e) => e !== 'none')
        : ['none'];

      let effort: ReasoningEffort = 'none';
      if (isReasoning) {
        if (model.facts.reasoningEffort.includes('fixed')) {
          effort = 'fixed';
        } else if (
          effortSuffix &&
          model.facts.reasoningEffort.includes(effortSuffix as ReasoningEffort)
        ) {
          effort = effortSuffix as ReasoningEffort;
        } else if (
          model.facts.defaultEffort &&
          model.facts.defaultEffort !== 'none'
        ) {
          effort = model.facts.defaultEffort;
        } else {
          effort = availableEfforts[0] ?? 'medium';
        }
      }

      const stats = getModelEffortStats(model, effort);

      return {
        id: `${token}-${index}`,
        token,
        model,
        effort,
        isReasoning,
        availableEfforts,
        stats,
      };
    })
    .filter((item): item is ComparedColumn => Boolean(item));

  function changeEffort(index: number, newEffort: ReasoningEffort) {
    const next = [...selection];
    const slug = next[index].split(':')[0];
    next[index] = `${slug}:${newEffort}`;
    update(next);
  }

  function addEffort(modelSlug: string, newEffort: ReasoningEffort) {
    if (selection.length >= 4) return;
    update([...selection, `${modelSlug}:${newEffort}`]);
  }

  function removeItem(index: number) {
    update(selection.filter((_, i) => i !== index));
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

  const technicalFacts: {
    label: string;
    value: (item: ComparedColumn) => string;
  }[] = [
    {
      label: 'Selected reasoning effort',
      value: (item) => effortLabels[item.effort],
    },
    {
      label: 'Context window',
      value: (item) => contextSize(item.model.facts.context) + ' tokens',
    },
    {
      label: 'Maximum output',
      value: (item) => contextSize(item.model.facts.maxOutput) + ' tokens',
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
      value: (item: ComparedColumn) => (item.model.facts[key] ? 'Yes' : 'No'),
    })),
  ];

  return (
    <>
      <div className="compare-controls">
        <label className="field">
          Add a model or effort
          <select
            value={add}
            disabled={selection.length >= 4}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                update([...selection, val]);
                setAdd('');
              }
            }}
          >
            <option value="">
              {selection.length >= 4
                ? '4 items selected'
                : 'Choose a model or effort…'}
            </option>
            <optgroup label="Add model">
              {models
                .filter(
                  (m) =>
                    !selection.some((s) => s.split(':')[0] === m.slug),
                )
                .map((m) => (
                  <option value={m.slug} key={m.slug}>
                    {m.name}
                  </option>
                ))}
            </optgroup>
            {selectedItems
              .filter(
                (item) =>
                  item.isReasoning &&
                  item.availableEfforts.length > 1 &&
                  item.availableEfforts.some(
                    (eff) =>
                      !selectedItems.some(
                        (s) =>
                          s.model.slug === item.model.slug &&
                          s.effort === eff,
                      ),
                  ),
              )
              .filter(
                (item, idx, arr) =>
                  arr.findIndex((x) => x.model.slug === item.model.slug) ===
                  idx,
              )
              .map((item) => {
                const unused = item.availableEfforts.filter(
                  (eff) =>
                    !selectedItems.some(
                      (s) =>
                        s.model.slug === item.model.slug &&
                        s.effort === eff,
                    ),
                );
                return (
                  <optgroup
                    label={`Compare effort: ${item.model.name}`}
                    key={`group-${item.model.slug}`}
                  >
                    {unused.map((eff) => (
                      <option
                        value={`${item.model.slug}:${eff}`}
                        key={`${item.model.slug}:${eff}`}
                      >
                        {item.model.name} ({effortLabels[eff]})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
          </select>
        </label>
        <button className="button" onClick={copy}>
          <Copy size={15} /> Copy comparison link
        </button>
      </div>

      <div className="selected-models">
        {selectedItems.map((item, idx) => (
          <span className="selection-chip" key={item.id}>
            <ModelMark model={item.model} />
            <span>
              {item.model.name}
              {item.isReasoning && item.effort !== 'none' && (
                <small
                  style={{
                    marginLeft: '5px',
                    opacity: 0.8,
                    fontWeight: 600,
                  }}
                >
                  ({effortLabels[item.effort]})
                </small>
              )}
            </span>
            <button
              onClick={() => removeItem(idx)}
              aria-label={`Remove ${item.model.name}`}
            >
              <X size={15} />
            </button>
          </span>
        ))}
      </div>

      <p className="status-text" role="status">
        {status}
      </p>

      {selectedItems.length < 2 ? (
        <div className="empty-state">
          <h2>Pick at least two models or effort levels.</h2>
          <p>
            Add up to four to see scores, pricing, thinking tokens, and practical
            tradeoffs side by side.
          </p>
        </div>
      ) : (
        <>
          <p className="section-note">
            Comparison data. Highlighted cells show the best value in the
            selected group; ties are highlighted equally. Select reasoning
            effort to see real-time performance and cost changes.
          </p>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Model comparison table"
          >
            <table className="comparison-table">
              <caption className="sr-only">
                Model comparison, scores out of 100 and USD API prices
              </caption>
              <thead>
                <tr>
                  <th scope="col">At a glance</th>
                  {selectedItems.map((item, idx) => (
                    <th scope="col" key={item.id}>
                      <div
                        className="provider-badge"
                        style={{ marginBottom: '4px' }}
                      >
                        <ProviderLogo
                          provider={item.model.provider}
                          size={15}
                        />
                        <span className="micro">{item.model.provider}</span>
                      </div>
                      <a href={`/models/${item.model.slug}`}>
                        {item.model.name}
                      </a>
                      {item.isReasoning ? (
                        item.availableEfforts.length > 1 ? (
                          <div className="effort-selector-cell">
                            <label
                              className="effort-selector-label"
                              htmlFor={`effort-select-${item.id}`}
                            >
                              Reasoning Effort
                            </label>
                            <select
                              id={`effort-select-${item.id}`}
                              className="effort-selector-dropdown"
                              value={item.effort}
                              onChange={(e) =>
                                changeEffort(
                                  idx,
                                  e.target.value as ReasoningEffort,
                                )
                              }
                            >
                              {item.availableEfforts.map((eff) => (
                                <option key={eff} value={eff}>
                                  {effortLabels[eff]}
                                </option>
                              ))}
                            </select>
                            {selection.length < 4 && (
                              <button
                                type="button"
                                className="effort-compare-pill"
                                onClick={() => {
                                  const nextEff =
                                    item.availableEfforts.find(
                                      (e) =>
                                        !selectedItems.some(
                                          (s) =>
                                            s.model.slug ===
                                              item.model.slug &&
                                            s.effort === e,
                                        ),
                                    ) ||
                                    item.availableEfforts.find(
                                      (e) => e !== item.effort,
                                    ) ||
                                    item.effort;
                                  addEffort(item.model.slug, nextEff);
                                }}
                                title={`Compare ${item.model.name} at another effort`}
                              >
                                <Plus size={11} /> Compare effort
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ marginTop: '6px' }}>
                            <span className="effort-badge effort-fixed">
                              Fixed CoT
                            </span>
                          </div>
                        )
                      ) : (
                        <div style={{ marginTop: '6px' }}>
                          <span className="micro muted">Standard (Instant)</span>
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
                    selected={selectedItems}
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
                    {selectedItems.map((item) => (
                      <td
                        key={item.id}
                        className={
                          item.model.pricing[key] ===
                          Math.min(
                            ...selectedItems.map(
                              (x) => x.model.pricing[key] ?? Infinity,
                            ),
                          )
                            ? 'winner'
                            : ''
                        }
                      >
                        {item.model.pricing[key] === null
                          ? 'Not available'
                          : money(item.model.pricing[key])}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row">Reasoning tokens / task</th>
                  {selectedItems.map((item) => (
                    <td
                      key={item.id}
                      className={
                        item.stats.reasoningTokens ===
                        Math.min(
                          ...selectedItems.map((x) => x.stats.reasoningTokens),
                        )
                          ? 'winner'
                          : ''
                      }
                    >
                      {item.stats.reasoningTokens > 0
                        ? `+${item.stats.reasoningTokens.toLocaleString()} tokens`
                        : '0 tokens'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Thinking latency profile</th>
                  {selectedItems.map((item) => (
                    <td key={item.id}>{item.stats.latency}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Estimated task cost</th>
                  {selectedItems.map((item) => (
                    <td
                      key={item.id}
                      className={
                        item.stats.taskCost ===
                        Math.min(...selectedItems.map((x) => x.stats.taskCost))
                          ? 'winner'
                          : ''
                      }
                    >
                      {money(item.stats.taskCost, 4)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Ease of use / 100</th>
                  {selectedItems.map((item) => (
                    <td key={item.id}>{item.model.facts.easeOfUse}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Availability</th>
                  {selectedItems.map((item) => (
                    <td key={item.id}>{item.model.facts.availability}</td>
                  ))}
                </tr>
                <tr className="group-row">
                  <th colSpan={selectedItems.length + 1}>Technical facts</th>
                </tr>
                {technicalFacts.map((f) => (
                  <tr key={f.label}>
                    <th scope="row">{f.label}</th>
                    {selectedItems.map((item) => (
                      <td key={item.id}>{f.value(item)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="section-note">
            Task estimate: 1,000 input + 500 base output tokens + reasoning
            tokens for the selected effort level, one attempt, no tools.{' '}
            <a href="/cost">Adjust the assumptions in the calculator</a>.
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
                const best = [...selectedItems].sort(
                  (a, b) =>
                    b.stats.scores[metric] - a.stats.scores[metric] ||
                    a.stats.taskCost - b.stats.taskCost,
                )[0];
                return (
                  <article className="panel" key={metric}>
                    <span className="micro">
                      {metric === 'costEfficiency'
                        ? 'Best value'
                        : `Best ${metricLabels[metric].toLowerCase()}`}{' '}
                      in this selection
                    </span>
                    <h3>
                      {best.model.name}
                      {best.isReasoning && best.effort !== 'none'
                        ? ` (${effortLabels[best.effort]})`
                        : ''}
                    </h3>
                    <p>
                      {best.stats.scores[metric]}/100 on{' '}
                      {metricLabels[metric].toLowerCase()}.{' '}
                      {best.model.weaknesses[0]} is the main tradeoff.
                    </p>
                    <a
                      className="text-link"
                      href={`/models/${best.model.slug}`}
                    >
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
              {selectedItems.map((item) => (
                <article className="panel" key={item.id}>
                  <h3>
                    Choose {item.model.name}
                    {item.isReasoning && item.effort !== 'none'
                      ? ` (${effortLabels[item.effort]})`
                      : ''}{' '}
                    if…
                  </h3>
                  <p>
                    {item.model.tags.slice(0, 2).join(' and ').toLowerCase()}{' '}
                    matter most to you in this configuration.{' '}
                    {item.isReasoning &&
                      item.effort === 'low' &&
                      'Low effort prioritizes low latency and minimal cost per request.'}
                    {item.isReasoning &&
                      (item.effort === 'high' || item.effort === 'max') &&
                      'High/max effort prioritizes maximum reasoning depth and multi-step verification.'}
                    {item.model.description}
                  </p>
                  <p>
                    Keep in mind:{' '}
                    {item.model.weaknesses.join('; ').toLowerCase()}.
                  </p>
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
  selected: ComparedColumn[];
}) {
  return (
    <>
      <tr className="group-row">
        <th colSpan={selected.length + 1}>{group.name}</th>
      </tr>
      {group.metrics.map((metric) => (
        <tr key={metric}>
          <th scope="row">{metricLabels[metric]}</th>
          {selected.map((item) => {
            const score = item.stats.scores[metric];
            const maxScore = Math.max(
              ...selected.map((x) => x.stats.scores[metric]),
            );
            const isWinner = score === maxScore;
            return (
              <td key={item.id} className={isWinner ? 'winner' : ''}>
                <a href={`/models/${item.model.slug}#score-${metric}`}>
                  {score}
                </a>
                {isWinner && (
                  <span className="winner-label">Best in selection</span>
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

