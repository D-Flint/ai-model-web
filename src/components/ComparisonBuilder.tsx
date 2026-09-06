import { useEffect, useState } from 'react';
import { Copy, X, Plus } from 'lucide-react';
import type { CatalogModel } from '../lib/catalogSchema';
import {
  effortLabels,
  metricLabels,
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
                  (m) => !selection.some((s) => s.split(':')[0] === m.slug),
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
                          s.model.slug === item.model.slug && s.effort === eff,
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
                        s.model.slug === item.model.slug && s.effort === eff,
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
            <ModelMark model={item.model} size={16} />
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
            Add up to four to see scores, pricing, thinking tokens, and
            practical tradeoffs side by side.
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
                                            s.model.slug === item.model.slug &&
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
                          <span className="micro muted">
                            Standard (Instant)
                          </span>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="group-row pillar-group-row">
                  <th colSpan={selectedItems.length + 1}>
                    Core Focus Pillars (Intelligence · Speed · Price)
                  </th>
                </tr>
                <tr>
                  <th scope="row">Intelligence / 100</th>
                  {selectedItems.map((item) => {
                    const score = item.stats.scores.intelligence;
                    const validScores = selectedItems
                      .map((x) => x.stats.scores.intelligence)
                      .filter((s): s is number => s !== null);
                    const maxScore =
                      validScores.length > 0 ? Math.max(...validScores) : null;
                    const isWinner = score !== null && score === maxScore;
                    return (
                      <td key={item.id} className={isWinner ? 'winner' : ''}>
                        {score !== null ? (
                          <a
                            href={`/models/${item.model.slug}#score-intelligence`}
                          >
                            <strong>{score}</strong>
                          </a>
                        ) : (
                          <span className="muted">—</span>
                        )}
                        {isWinner && (
                          <span className="winner-label">Highest</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <th scope="row">Speed (tokens/sec)</th>
                  {selectedItems.map((item) => {
                    const tps = item.stats.speedTokensPerSec;
                    const validTps = selectedItems
                      .map((x) => x.stats.speedTokensPerSec)
                      .filter((s): s is number => s > 0);
                    const maxTps =
                      validTps.length > 0 ? Math.max(...validTps) : null;
                    const isWinner = tps > 0 && tps === maxTps;
                    return (
                      <td key={item.id} className={isWinner ? 'winner' : ''}>
                        {tps > 0 ? (
                          <>
                            <a href={`/models/${item.model.slug}#score-speed`}>
                              <strong>{tps}</strong>{' '}
                              <small className="micro muted">tok/s</small>
                            </a>
                            <div className="micro muted">
                              {item.stats.scores.speed !== null
                                ? `${item.stats.scores.speed}/100 rating · `
                                : ''}
                              {item.stats.latency}
                            </div>
                          </>
                        ) : (
                          <div className="micro muted">
                            <span>—</span>
                            <div>Not yet claimed</div>
                          </div>
                        )}
                        {isWinner && (
                          <span className="winner-label">Fastest</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <th scope="row">Price: Input / 1M tokens</th>
                  {selectedItems.map((item) => {
                    const isWinner =
                      item.model.pricing.input ===
                      Math.min(
                        ...selectedItems.map((x) => x.model.pricing.input),
                      );
                    return (
                      <td key={item.id} className={isWinner ? 'winner' : ''}>
                        <strong>{money(item.model.pricing.input)}</strong>
                        {isWinner && (
                          <span className="winner-label">Lowest</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <th scope="row">Price: Output / 1M tokens</th>
                  {selectedItems.map((item) => {
                    const isWinner =
                      item.model.pricing.output ===
                      Math.min(
                        ...selectedItems.map((x) => x.model.pricing.output),
                      );
                    return (
                      <td key={item.id} className={isWinner ? 'winner' : ''}>
                        <strong>{money(item.model.pricing.output)}</strong>
                        {isWinner && (
                          <span className="winner-label">Lowest</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <th scope="row">Estimated task cost</th>
                  {selectedItems.map((item) => {
                    const isWinner =
                      item.stats.taskCost ===
                      Math.min(...selectedItems.map((x) => x.stats.taskCost));
                    return (
                      <td key={item.id} className={isWinner ? 'winner' : ''}>
                        <strong>{money(item.stats.taskCost, 4)}</strong>
                        {isWinner && (
                          <span className="winner-label">Best value</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                <tr className="group-row">
                  <th colSpan={selectedItems.length + 1}>
                    Secondary Capabilities & Benchmarks
                  </th>
                </tr>
                {(
                  [
                    'overall',
                    'coding',
                    'agentic',
                    'dailyUse',
                    'writing',
                    'research',
                    'vision',
                    'reliability',
                    'costEfficiency',
                  ] as const
                ).map((metric) => (
                  <tr key={metric}>
                    <th scope="row">{metricLabels[metric]}</th>
                    {selectedItems.map((item) => {
                      const score = item.stats.scores[metric];
                      const validScores = selectedItems
                        .map((x) => x.stats.scores[metric])
                        .filter((s): s is number => s !== null);
                      const maxScore =
                        validScores.length > 0
                          ? Math.max(...validScores)
                          : null;
                      const isWinner = score !== null && score === maxScore;
                      return (
                        <td key={item.id} className={isWinner ? 'winner' : ''}>
                          {score !== null ? (
                            <a
                              href={`/models/${item.model.slug}#score-${metric}`}
                            >
                              {score}
                            </a>
                          ) : (
                            <span className="muted">—</span>
                          )}
                          {isWinner && (
                            <span className="winner-label">Best</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                <tr className="group-row">
                  <th colSpan={selectedItems.length + 1}>
                    Technical & Reasoning Specs
                  </th>
                </tr>
                <tr>
                  <th scope="row">Cached input / 1M</th>
                  {selectedItems.map((item) => (
                    <td key={item.id}>
                      {item.model.pricing.cached === null
                        ? 'Not available'
                        : money(item.model.pricing.cached)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Reasoning tokens / task</th>
                  {selectedItems.map((item) => (
                    <td key={item.id}>
                      {item.stats.reasoningTokens > 0
                        ? `+${item.stats.reasoningTokens.toLocaleString()} tokens`
                        : '0 tokens'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Speed latency tier</th>
                  {selectedItems.map((item) => (
                    <td key={item.id}>{item.stats.latency}</td>
                  ))}
                </tr>
                {technicalFacts.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {selectedItems.map((item) => (
                      <td key={item.id}>{row.value(item)}</td>
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
              {(() => {
                const bestIntel = [...selectedItems].sort(
                  (a, b) =>
                    (b.stats.scores.intelligence ?? -1) -
                    (a.stats.scores.intelligence ?? -1),
                )[0];
                const bestSpeed = [...selectedItems].sort(
                  (a, b) =>
                    b.stats.speedTokensPerSec - a.stats.speedTokensPerSec,
                )[0];
                const lowestPrice = [...selectedItems].sort(
                  (a, b) => a.stats.taskCost - b.stats.taskCost,
                )[0];
                const bestOverall = [...selectedItems].sort(
                  (a, b) =>
                    (b.stats.scores.overall ?? -1) -
                    (a.stats.scores.overall ?? -1),
                )[0];

                const verdictCards = [
                  {
                    title: 'Highest Intelligence',
                    item: bestIntel,
                    detail:
                      bestIntel.stats.scores.intelligence !== null
                        ? `${bestIntel.stats.scores.intelligence}/100 intelligence score from verified LiveBench evaluations.`
                        : 'Intelligence benchmark unavailable.',
                  },
                  {
                    title: 'Fastest Speed',
                    item: bestSpeed,
                    detail:
                      bestSpeed.stats.speedTokensPerSec > 0
                        ? `${bestSpeed.stats.speedTokensPerSec} tokens/sec throughput (${bestSpeed.stats.latency}).`
                        : 'Speed measurements not claimed yet without approved independent benchmark.',
                  },
                  {
                    title: 'Lowest Price',
                    item: lowestPrice,
                    detail: `${money(lowestPrice.stats.taskCost, 4)} task cost (${money(lowestPrice.model.pricing.input)} / 1M input).`,
                  },
                  {
                    title: 'Best Overall',
                    item: bestOverall,
                    detail:
                      bestOverall.stats.scores.overall !== null
                        ? `${bestOverall.stats.scores.overall}/100 overall composite across available verified metrics.`
                        : 'Overall score pending.',
                  },
                ];

                return verdictCards.map((vc) => (
                  <article className="panel" key={vc.title}>
                    <span className="micro">{vc.title} in this selection</span>
                    <h3>
                      {vc.item.model.name}
                      {vc.item.isReasoning && vc.item.effort !== 'none'
                        ? ` (${effortLabels[vc.item.effort]})`
                        : ''}
                    </h3>
                    <p>{vc.detail}</p>
                    <a
                      className="text-link"
                      href={`/models/${vc.item.model.slug}`}
                    >
                      View model details →
                    </a>
                  </article>
                ));
              })()}
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
