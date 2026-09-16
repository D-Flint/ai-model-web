import { formatPrice, rateLabel } from '../lib/apiPricing';
import ApiPricing from './ApiPricing';
import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown, Copy, X, Plus, Check } from 'lucide-react';
import { catalogSchema, type CatalogModel } from '../lib/catalogSchema';
import {
  effortLabels,
  metricLabels,
  workloadProfiles,
  type ReasoningEffort,
  type WorkloadProfileId,
} from '../data/config';
import {
  contextSize,
  getMaxReasoningEffort,
  getModelEffortStats,
  getSpeedDisplayValue,
  selectionAtDefaultEffort,
  selectionAtMaximumEffort,
  selectionFromSearch,
  type ModelEffortStats,
} from '../lib/decision';
import { ModelMark } from './ModelCard';
import { ProviderLogo } from './ProviderLogo';
import { comparisonSharePath } from '../lib/comparisonPairs';
import { groupModelsByProvider } from '../lib/comparisonGroups';

export interface ComparedColumn {
  id: string;
  token: string;
  model: CatalogModel;
  effort: ReasoningEffort;
  isReasoning: boolean;
  availableEfforts: ReasoningEffort[];
  stats: ModelEffortStats;
}

const secondaryMetrics = [
  'overall',
  'coding',
  'agentic',
  'dailyUse',
  'writing',
  'research',
  'vision',
  'reliability',
  'costEfficiency',
] as const;

function renderFactBadge(value: string): ReactNode {
  if (value === 'Yes') {
    return (
      <span className="fact-badge fact-badge-yes">
        <Check size={12} strokeWidth={2.5} aria-hidden="true" /> Yes
      </span>
    );
  }
  if (value === 'No') {
    return (
      <span className="fact-badge fact-badge-no">
        <X size={12} strokeWidth={2.5} aria-hidden="true" /> No
      </span>
    );
  }
  return value;
}

function MobileMetricCard({
  label,
  items,
  renderValue,
  isWinner = () => false,
  winnerLabel = 'Best',
  wideValues = false,
}: {
  label: string;
  items: ComparedColumn[];
  renderValue: (item: ComparedColumn) => ReactNode;
  isWinner?: (item: ComparedColumn) => boolean;
  winnerLabel?: string;
  wideValues?: boolean;
}) {
  return (
    <article
      className={`mobile-metric-card${wideValues ? ' mobile-metric-card--wide' : ''}`}
    >
      <h3>{label}</h3>
      <div className="mobile-metric-values">
        {items.map((item) => {
          const winner = isWinner(item);
          return (
            <div
              className={`mobile-metric-row${winner ? ' mobile-metric-row--winner' : ''}`}
              key={item.id}
            >
              <div className="mobile-metric-model">
                <ProviderLogo provider={item.model.provider} size={18} />
                <span>
                  <a href={`/models/${item.model.slug}`}>{item.model.name}</a>
                  <small>
                    {item.model.provider}
                    {item.isReasoning && item.effort !== 'none'
                      ? ` · ${effortLabels[item.effort]} effort`
                      : ''}
                  </small>
                </span>
              </div>
              <div className="mobile-metric-value">
                {renderValue(item)}
                {winner && (
                  <span className="mobile-winner-label">{winnerLabel}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default function ComparisonBuilder({
  models: initialModels,
  initial = [],
  catalogUrl,
}: {
  models: CatalogModel[];
  initial?: string[];
  catalogUrl?: string;
}) {
  const [models, setModels] = useState(initialModels);
  const [selection, setSelection] = useState<string[]>(
    selectionAtDefaultEffort(
      initial.length ? initial : models.slice(0, 2).map((m) => m.slug),
      models,
    ),
  );
  const [add, setAdd] = useState('');
  const [status, setStatus] = useState('');
  const [workload, setWorkload] = useState<WorkloadProfileId>('agent');

  useEffect(() => {
    if (!catalogUrl) return;
    const controller = new AbortController();
    async function loadCatalog() {
      try {
        const response = await fetch(catalogUrl!, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Catalog request failed');
        const data: unknown = await response.json();
        const catalog = catalogSchema.parse(data);
        if (!controller.signal.aborted) setModels(catalog);
      } catch {
        if (!controller.signal.aborted)
          setStatus(
            'Additional models could not load. Reload this page to retry.',
          );
      }
    }
    void loadCatalog();
    return () => controller.abort();
  }, [catalogUrl]);

  useEffect(() => {
    const search = new URLSearchParams(location.search);
    if (search.has('models') || (search.has('a') && search.has('b')))
      setSelection(
        selectionAtDefaultEffort(
          selectionFromSearch(location.search, models),
          models,
        ),
      );
  }, [models]);

  function update(next: string[]) {
    setSelection(next);
    const url = new URL('/compare', location.origin);
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
        model.facts.reasoningEffort.some((effort) => effort !== 'none'),
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
        } else {
          effort =
            model.facts.defaultEffort &&
            model.facts.defaultEffort !== 'none' &&
            model.facts.reasoningEffort.includes(model.facts.defaultEffort)
              ? model.facts.defaultEffort
              : model.facts.reasoningEffort.includes('medium')
                ? 'medium'
                : getMaxReasoningEffort(model);
        }
      }

      const stats = getModelEffortStats(model, effort, workload);

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

  function nextEffortFor(item: ComparedColumn) {
    return (
      item.availableEfforts.find(
        (effort) =>
          !selectedItems.some(
            (selected) =>
              selected.model.slug === item.model.slug &&
              selected.effort === effort,
          ),
      ) ||
      item.availableEfforts.find((effort) => effort !== item.effort) ||
      item.effort
    );
  }

  function removeItem(index: number) {
    update(selection.filter((_, i) => i !== index));
  }

  async function copy() {
    const url = new URL(comparisonSharePath(selection), location.origin);
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

  const availableModels = models.filter(
    (model) => !selection.some((item) => item.split(':')[0] === model.slug),
  );
  const providerGroups = groupModelsByProvider(availableModels);

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
                const tokenToAdd = val.includes(':')
                  ? val
                  : (selectionAtDefaultEffort([val], models)[0] ?? val);
                update([...selection, tokenToAdd]);
                setAdd('');
              }
            }}
          >
            <option value="">
              {selection.length >= 4
                ? '4 items selected'
                : 'Choose a model or effort…'}
            </option>
            {providerGroups.map((group) => (
              <optgroup label={group.provider} key={group.provider}>
                {group.models.map((model) => (
                  <option value={model.slug} key={model.slug}>
                    {model.name}
                  </option>
                ))}
              </optgroup>
            ))}
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
          {selection.length >= 4 && (
            <span className="compare-limit-warning" role="status">
              You can compare up to 4 items. Remove one above to add another.
            </span>
          )}
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
            Add up to four to see scores, API pricing, and practical tradeoffs
            side by side.
          </p>
        </div>
      ) : (
        <>
          <p className="section-note">
            Comparison data. Highlighted cells show the best value in the
            selected group; ties are highlighted equally. Select reasoning
            effort to see real-time performance and cost changes. “Not measured”
            means no verified evidence exists for that model and metric; Astra
            does not fill gaps with proxy scores.
          </p>
          <div className="compare-workload-bar">
            <div className="compare-workload-info">
              <span className="compare-workload-title">
                Cost efficiency workload profile
              </span>
              <span className="compare-workload-desc">
                {workloadProfiles[workload].description}
              </span>
            </div>
            <div
              className="segmented compare-workload-segmented"
              role="group"
              aria-label="Workload profile for cost calculation"
            >
              {(Object.keys(workloadProfiles) as WorkloadProfileId[]).map(
                (id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={workload === id}
                    onClick={() => setWorkload(id)}
                  >
                    {workloadProfiles[id].label}
                  </button>
                ),
              )}
            </div>
          </div>
          <div
            className="mobile-comparison"
            aria-label="Model comparison cards"
          >
            <section
              className="mobile-compared-models"
              aria-labelledby="mobile-compared-models-heading"
            >
              <header>
                <h2 id="mobile-compared-models-heading">Compared models</h2>
                <p>Adjust reasoning effort before comparing results.</p>
              </header>
              <div className="mobile-model-settings">
                {selectedItems.map((item, idx) => (
                  <div className="mobile-model-setting" key={item.id}>
                    <div className="mobile-model-setting-identity">
                      <ProviderLogo provider={item.model.provider} size={22} />
                      <span>
                        <a href={`/models/${item.model.slug}`}>
                          {item.model.name}
                        </a>
                        <small>{item.model.provider}</small>
                      </span>
                    </div>
                    {item.isReasoning ? (
                      item.effort !== 'fixed' ? (
                        <div className="mobile-effort-control">
                          <div className="mobile-effort-row">
                            <label htmlFor={`mobile-effort-select-${item.id}`}>
                              Reasoning effort
                            </label>
                            <div className="control-select-wrapper mobile-effort-select-wrapper">
                              <select
                                id={`mobile-effort-select-${item.id}`}
                                className="control-select mobile-effort-select"
                                value={item.effort}
                                onChange={(event) =>
                                  changeEffort(
                                    idx,
                                    event.target.value as ReasoningEffort,
                                  )
                                }
                              >
                                {item.availableEfforts.map((effort) => (
                                  <option key={effort} value={effort}>
                                    {effortLabels[effort]}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                className="control-select-arrow"
                                size={16}
                                aria-hidden="true"
                              />
                            </div>
                            {item.stats.isEstimated && (
                              <div style={{ marginTop: '4px' }}>
                                <span
                                  className="estimate-badge"
                                  title="Scores for this effort level are modeled based on standard reasoning scaling behavior, not an independent LiveBench evaluation run."
                                >
                                  Estimated
                                </span>
                              </div>
                            )}
                          </div>
                          {item.availableEfforts.length > 1 &&
                            selection.length < 4 && (
                              <button
                                type="button"
                                className="mobile-compare-effort"
                                onClick={() =>
                                  addEffort(
                                    item.model.slug,
                                    nextEffortFor(item),
                                  )
                                }
                              >
                                <Plus size={14} /> Compare another effort
                              </button>
                            )}
                        </div>
                      ) : (
                        <span className="mobile-effort-status">Fixed CoT</span>
                      )
                    ) : (
                      <span className="mobile-effort-status">
                        Standard · Instant
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section
              className="mobile-metric-section"
              aria-labelledby="mobile-core-metrics-heading"
            >
              <div className="mobile-metric-section-heading">
                <h2 id="mobile-core-metrics-heading">Core focus pillars</h2>
                <p>Intelligence, speed, and price</p>
              </div>
              <MobileMetricCard
                label="Intelligence / 100"
                items={selectedItems}
                isWinner={(item) => {
                  const score = item.stats.scores.intelligence;
                  const scores = selectedItems
                    .map((selected) => selected.stats.scores.intelligence)
                    .filter((value): value is number => value !== null);
                  return score !== null && score === Math.max(...scores);
                }}
                winnerLabel="Highest"
                renderValue={(item) => {
                  const score = item.stats.scores.intelligence;
                  return score !== null ? (
                    <a href={`/models/${item.model.slug}#score-intelligence`}>
                      <strong>{score}</strong>
                    </a>
                  ) : (
                    <span className="muted">Not measured</span>
                  );
                }}
              />
              <MobileMetricCard
                label="Speed"
                items={selectedItems}
                isWinner={(item) => {
                  const speeds = selectedItems
                    .map((selected) => selected.stats.speedTokensPerSec)
                    .filter((value) => value > 0);
                  return (
                    item.stats.speedTokensPerSec > 0 &&
                    item.stats.speedTokensPerSec === Math.max(...speeds)
                  );
                }}
                winnerLabel="Fastest"
                renderValue={(item) => {
                  const speed = item.stats.speedTokensPerSec;
                  const displaySpeed = getSpeedDisplayValue(
                    item.model,
                    item.effort,
                  );
                  const speedScore = item.stats.scores.speed;
                  if (speed > 0) {
                    return (
                      <>
                        <a href={`/models/${item.model.slug}#score-speed`}>
                          <strong>{displaySpeed ?? speed}</strong>{' '}
                          <small>tok/s</small>
                        </a>
                        <span className="mobile-metric-detail">
                          {speedScore !== null ? `${speedScore}/100 · ` : ''}
                          {item.stats.latency}
                        </span>
                      </>
                    );
                  }
                  if (speedScore !== null) {
                    return (
                      <>
                        <a href={`/models/${item.model.slug}#score-speed`}>
                          <strong>{speedScore}</strong> <small>/100</small>
                        </a>
                        <span className="mobile-metric-detail">
                          No throughput claim
                        </span>
                      </>
                    );
                  }
                  return (
                    <span className="muted">
                      Not measured
                      <small className="mobile-metric-detail">
                        No verified speed evidence
                      </small>
                    </span>
                  );
                }}
              />
              <MobileMetricCard
                label="API pricing"
                items={selectedItems}
                wideValues
                renderValue={(item) => (
                  <>
                    <ApiPricing model={item.model} />
                    {item.stats.effectivePrice !== null && (
                      <span className="mobile-metric-detail">
                        Est. {formatPrice(item.stats.effectivePrice)}/1M blended
                        ({workloadProfiles[workload].shortLabel})
                      </span>
                    )}
                  </>
                )}
              />
            </section>

            <section
              className="mobile-metric-section"
              aria-labelledby="mobile-capability-metrics-heading"
            >
              <div className="mobile-metric-section-heading">
                <h2 id="mobile-capability-metrics-heading">
                  Capabilities and benchmarks
                </h2>
                <p>Scores use available verified evidence</p>
              </div>
              {secondaryMetrics.map((metric) => {
                const validScores = selectedItems
                  .map((item) => item.stats.scores[metric])
                  .filter((score): score is number => score !== null);
                const maximum =
                  validScores.length > 0 ? Math.max(...validScores) : null;
                return (
                  <MobileMetricCard
                    label={
                      metric === 'costEfficiency'
                        ? `${metricLabels[metric]} (${workloadProfiles[workload].shortLabel})`
                        : metricLabels[metric]
                    }
                    items={selectedItems}
                    key={metric}
                    isWinner={(item) => {
                      const score = item.stats.scores[metric];
                      return score !== null && score === maximum;
                    }}
                    renderValue={(item) => {
                      const score = item.stats.scores[metric];
                      return score !== null ? (
                        <a href={`/models/${item.model.slug}#score-${metric}`}>
                          <strong>{score}</strong>
                          <small> / 100</small>
                        </a>
                      ) : (
                        <span className="muted">Not measured</span>
                      );
                    }}
                  />
                );
              })}
            </section>

            <section
              className="mobile-metric-section"
              aria-labelledby="mobile-technical-metrics-heading"
            >
              <div className="mobile-metric-section-heading">
                <h2 id="mobile-technical-metrics-heading">
                  Technical and reasoning specs
                </h2>
                <p>Configuration and capability details</p>
              </div>
              <MobileMetricCard
                label="Cached input / 1M"
                items={selectedItems}
                renderValue={(item) => rateLabel(item.model, 'cached')}
              />
              <MobileMetricCard
                label="Speed latency tier"
                items={selectedItems}
                renderValue={(item) => item.stats.latency}
              />
              {technicalFacts.map((row) => (
                <MobileMetricCard
                  label={row.label}
                  items={selectedItems}
                  key={row.label}
                  renderValue={(item) => renderFactBadge(row.value(item))}
                />
              ))}
            </section>
          </div>
          <div
            className="table-scroll comparison-desktop-table"
            tabIndex={0}
            role="region"
            aria-label="Model comparison table"
          >
            <table
              className="comparison-table"
              style={
                {
                  minWidth: `${Math.max(680, 220 + selectedItems.length * 220)}px`,
                } as React.CSSProperties
              }
            >
              <caption className="sr-only">
                Model comparison, scores out of 100 and USD API prices
              </caption>
              <colgroup>
                <col className="comparison-col-label" />
                {selectedItems.map((item) => (
                  <col key={item.id} className="comparison-col-model" />
                ))}
              </colgroup>
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
                        item.effort !== 'fixed' ? (
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
                            {item.availableEfforts.length > 1 &&
                              selection.length < 4 && (
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
                            {item.stats.isEstimated && (
                              <div style={{ marginTop: '4px' }}>
                                <span
                                  className="estimate-badge"
                                  title="Scores for this effort level are modeled based on standard reasoning scaling behavior, not an independent LiveBench evaluation run."
                                >
                                  Estimated
                                </span>
                              </div>
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
                    const speedDisplayValue = getSpeedDisplayValue(
                      item.model,
                      item.effort,
                    );
                    const speedScore = item.stats.scores.speed;
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
                              <strong>{speedDisplayValue ?? tps}</strong>{' '}
                              <small className="micro muted">tok/s</small>
                            </a>
                            <div className="micro muted">
                              {item.stats.scores.speed !== null
                                ? `${item.stats.scores.speed}/100 rating · `
                                : ''}
                              {item.stats.latency}
                            </div>
                          </>
                        ) : speedScore !== null ? (
                          <>
                            <a href={`/models/${item.model.slug}#score-speed`}>
                              <strong>{speedScore}</strong>{' '}
                              <small className="micro muted">/100 rating</small>
                            </a>
                            <div className="micro muted">
                              No throughput claim
                            </div>
                          </>
                        ) : (
                          <div className="micro muted">
                            <span>Not measured</span>
                            <div>No verified speed evidence</div>
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
                  <th scope="row">API pricing</th>
                  {selectedItems.map((item) => (
                    <td key={item.id}>
                      <ApiPricing model={item.model} />
                      {item.stats.effectivePrice !== null && (
                        <div
                          className="micro muted"
                          style={{ marginTop: '4px' }}
                        >
                          Est. {formatPrice(item.stats.effectivePrice)}/1M
                          blended ({workloadProfiles[workload].shortLabel})
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                <tr className="group-row">
                  <th colSpan={selectedItems.length + 1}>
                    Secondary Capabilities & Benchmarks
                  </th>
                </tr>
                {secondaryMetrics.map((metric) => (
                  <tr key={metric}>
                    <th scope="row">
                      {metricLabels[metric]}
                      {metric === 'costEfficiency' && (
                        <span
                          className="micro muted"
                          style={{ display: 'block', fontWeight: 'normal' }}
                        >
                          {workloadProfiles[workload].shortLabel} profile
                        </span>
                      )}
                    </th>
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
                            <span
                              className="muted"
                              title={`No verified ${metricLabels[metric].toLowerCase()} evidence`}
                            >
                              Not measured
                            </span>
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
                    <td key={item.id}>{rateLabel(item.model, 'cached')}</td>
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
                      <td key={item.id}>{renderFactBadge(row.value(item))}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="section-note">
            API rates depend on provider and context.{' '}
            <a href="/cost">Calculate with your workload</a>.
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
                        ? `${getSpeedDisplayValue(bestSpeed.model, bestSpeed.effort) ?? bestSpeed.stats.speedTokensPerSec} tokens/sec throughput (${bestSpeed.stats.latency}).`
                        : 'Speed measurements not claimed yet without approved independent benchmark.',
                  },
                  {
                    title: 'Best Overall',
                    item: bestOverall,
                    detail:
                      bestOverall.stats.scores.overall !== null
                        ? `${bestOverall.stats.scores.overall}/100 Synapse composite across available verified metrics.`
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
