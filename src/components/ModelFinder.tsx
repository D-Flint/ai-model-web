import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Info } from 'lucide-react';
import { comparablePrice, rateLabel, standardRate } from '../lib/apiPricing';
import type { CatalogModel } from '../lib/catalogSchema';
import {
  defaultModelFinderRequest,
  recommendModels,
  type FinderRecommendation,
  type ModelFinderRequirements,
  type WeightedSelection,
} from '../lib/modelFinder';
import {
  finderMetricLabels,
  priorityDefinitions,
  priorityOrder,
  useCaseDefinitions,
  useCaseOrder,
  type BudgetBehavior,
  type BudgetTier,
  type Importance,
  type PriorityId,
  type UseCaseId,
} from '../data/modelFinderConfig';
import { ModelMark } from './ModelCard';

const stepLabels = ['Your work', 'Priorities', 'Requirements', 'Results'];
const importanceOptions: Array<{ value: Importance; label: string }> = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];
const budgetOptions: Array<{
  value: BudgetTier;
  label: string;
  description: string;
}> = [
  {
    value: 'free',
    label: 'Free API',
    description: 'Verified zero-cost input and output',
  },
  {
    value: 'very-cheap',
    label: 'Very cheap',
    description: 'Up to $1 / 1M input tokens',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Up to $5 / 1M input tokens',
  },
  {
    value: 'flexible',
    label: 'Flexible',
    description: 'No price ceiling',
  },
];
const requirementOptions: Array<{
  key: Exclude<keyof ModelFinderRequirements, 'minimumContext'>;
  label: string;
  description: string;
}> = [
  {
    key: 'tools',
    label: 'Tool calling',
    description: 'Can use functions and external tools',
  },
  {
    key: 'vision',
    label: 'Vision input',
    description: 'Can understand images and charts',
  },
  {
    key: 'api',
    label: 'API available',
    description: 'Can be integrated into software',
  },
  {
    key: 'openWeights',
    label: 'Open weights',
    description: 'Downloadable model weights',
  },
];

function nextSelectionOrder<T>(selections: WeightedSelection<T>[]): number {
  return (
    Math.max(-1, ...selections.map((selection) => selection.selectionOrder)) + 1
  );
}

function importanceLabel(importance: Importance): string {
  return importanceOptions.find((option) => option.value === importance)!.label;
}

function resultLabel(category: FinderRecommendation['category']): string {
  return {
    'best-match': 'Best match',
    'best-value': 'Best value',
    alternative: 'Alternative',
  }[category];
}

function percentWeight(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function ModelFinder({ models }: { models: CatalogModel[] }) {
  const [step, setStep] = useState(0);
  const [useCases, setUseCases] = useState<WeightedSelection<UseCaseId>[]>([
    { id: 'coding', importance: 'high', selectionOrder: 0 },
  ]);
  const [priorities, setPriorities] = useState<WeightedSelection<PriorityId>[]>(
    [],
  );
  const [requirements, setRequirements] = useState<ModelFinderRequirements>({
    ...defaultModelFinderRequest.requirements,
  });
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('flexible');
  const [budgetBehavior, setBudgetBehavior] =
    useState<BudgetBehavior>('preferred');
  const [error, setError] = useState<string | null>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);

  const request = useMemo(
    () => ({
      useCases,
      priorities,
      requirements,
      budget: { tier: budgetTier, behavior: budgetBehavior },
    }),
    [budgetBehavior, budgetTier, priorities, requirements, useCases],
  );
  const result = useMemo(
    () => (step === 3 ? recommendModels(models, request) : null),
    [models, request, step],
  );

  useEffect(() => {
    if (step === 3) resultHeading.current?.focus();
  }, [step]);

  function toggleUseCase(id: UseCaseId): void {
    setError(null);
    setUseCases((current) => {
      if (current.some((selection) => selection.id === id)) {
        return current.filter((selection) => selection.id !== id);
      }
      if (current.length >= 3) {
        setError('Choose up to 3 use cases. Remove one before adding another.');
        return current;
      }
      return [
        ...current,
        {
          id,
          importance: 'medium',
          selectionOrder: nextSelectionOrder(current),
        },
      ];
    });
  }

  function togglePriority(id: PriorityId): void {
    setError(null);
    setPriorities((current) => {
      if (current.some((selection) => selection.id === id)) {
        return current.filter((selection) => selection.id !== id);
      }
      if (current.length >= 3) {
        setError(
          'Choose up to 3 priorities. Remove one before adding another.',
        );
        return current;
      }
      return [
        ...current,
        {
          id,
          importance: 'medium',
          selectionOrder: nextSelectionOrder(current),
        },
      ];
    });
  }

  function updateImportance<T extends UseCaseId | PriorityId>(
    id: T,
    importance: Importance,
    setter: React.Dispatch<React.SetStateAction<WeightedSelection<T>[]>>,
  ): void {
    setter((current) =>
      current.map((selection) =>
        selection.id === id ? { ...selection, importance } : selection,
      ),
    );
  }

  function continueFromWork(): void {
    if (useCases.length === 0) {
      setError('Choose at least one use case to continue.');
      return;
    }
    setError(null);
    setStep(1);
  }

  function chooseBudget(tier: BudgetTier): void {
    setBudgetTier(tier);
    if (tier === 'free') setBudgetBehavior('strict');
  }

  function reset(): void {
    setUseCases([{ id: 'coding', importance: 'high', selectionOrder: 0 }]);
    setPriorities([]);
    setRequirements({ ...defaultModelFinderRequest.requirements });
    setBudgetTier('flexible');
    setBudgetBehavior('preferred');
    setError(null);
    setStep(0);
  }

  return (
    <div className="wizard finder-wizard">
      <ol className="wizard-progress" aria-label="Model Finder progress">
        {stepLabels.map((label, index) => (
          <li
            key={label}
            className={step >= index ? 'active' : ''}
            aria-current={step === index ? 'step' : undefined}
          >
            <span>{index + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="panel finder-panel">
        {step === 0 ? (
          <fieldset>
            <legend>What do you use AI for?</legend>
            <p className="wizard-description" id="work-help">
              Select up to 3. Importance tells us where tradeoffs matter most.
            </p>
            <div className="finder-option-list" aria-describedby="work-help">
              {useCaseOrder.map((id) => {
                const definition = useCaseDefinitions[id];
                const selection = useCases.find((item) => item.id === id);
                return (
                  <div
                    className={`finder-option-row${selection ? ' selected' : ''}${!definition.available ? ' disabled' : ''}`}
                    key={id}
                  >
                    <label>
                      <input
                        type="checkbox"
                        checked={Boolean(selection)}
                        disabled={!definition.available}
                        onChange={() => toggleUseCase(id)}
                      />
                      <span className="finder-check" aria-hidden="true">
                        {selection ? <Check size={14} strokeWidth={3} /> : null}
                      </span>
                      <span className="finder-option-copy">
                        <strong>{definition.label}</strong>
                        <small>{definition.description}</small>
                        {!definition.available ? (
                          <small className="finder-unavailable">
                            {definition.unavailableReason}
                          </small>
                        ) : null}
                      </span>
                    </label>
                    {selection ? (
                      <select
                        className="importance-select"
                        aria-label={`${definition.label} importance`}
                        value={selection.importance}
                        onChange={(event) =>
                          updateImportance(
                            id,
                            event.target.value as Importance,
                            setUseCases,
                          )
                        }
                      >
                        {importanceOptions.map((option) => (
                          <option value={option.value} key={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <p className="finder-note">
              <Info size={15} /> Daily-use fit currently uses reasoning,
              language, and instruction-following evidence—not an invented
              preference score.
            </p>
          </fieldset>
        ) : null}

        {step === 1 ? (
          <fieldset>
            <legend>What matters most?</legend>
            <p className="wizard-description" id="priority-help">
              Choose up to 3, or leave everything unselected for a balanced
              recommendation.
            </p>
            {priorities.length === 0 ? (
              <p className="finder-balanced-status">Balanced by default</p>
            ) : null}
            <div
              className="finder-option-list"
              aria-describedby="priority-help"
            >
              {priorityOrder.map((id) => {
                const definition = priorityDefinitions[id];
                const selection = priorities.find((item) => item.id === id);
                return (
                  <div
                    className={`finder-option-row${selection ? ' selected' : ''}`}
                    key={id}
                  >
                    <label>
                      <input
                        type="checkbox"
                        checked={Boolean(selection)}
                        onChange={() => togglePriority(id)}
                      />
                      <span className="finder-check" aria-hidden="true">
                        {selection ? <Check size={14} strokeWidth={3} /> : null}
                      </span>
                      <span className="finder-option-copy">
                        <strong>{definition.label}</strong>
                        <small>{definition.description}</small>
                      </span>
                    </label>
                    {selection ? (
                      <select
                        className="importance-select"
                        aria-label={`${definition.label} importance`}
                        value={selection.importance}
                        onChange={(event) =>
                          updateImportance(
                            id,
                            event.target.value as Importance,
                            setPriorities,
                          )
                        }
                      >
                        {importanceOptions.map((option) => (
                          <option value={option.value} key={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                );
              })}
              <div className="finder-option-row disabled">
                <div className="finder-disabled-copy">
                  <span className="finder-check" aria-hidden="true" />
                  <span className="finder-option-copy">
                    <strong>Most reliable</strong>
                    <small>
                      Unavailable until external reliability evidence exists
                    </small>
                  </span>
                </div>
              </div>
            </div>
          </fieldset>
        ) : null}

        {step === 2 ? (
          <div className="finder-requirements">
            <fieldset>
              <legend>Requirements</legend>
              <p className="wizard-description">
                These are hard filters. A model must meet every selected item.
              </p>
              <div className="finder-requirement-grid">
                {requirementOptions.map((option) => (
                  <label className="finder-requirement" key={option.key}>
                    <input
                      type="checkbox"
                      checked={requirements[option.key]}
                      onChange={(event) =>
                        setRequirements((current) => ({
                          ...current,
                          [option.key]: event.target.checked,
                        }))
                      }
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>
              <details className="finder-advanced">
                <summary>
                  Advanced requirements <ChevronRight size={15} />
                </summary>
                <div className="finder-advanced-content">
                  <label className="finder-requirement">
                    <input
                      type="checkbox"
                      checked={requirements.structuredOutput}
                      onChange={(event) =>
                        setRequirements((current) => ({
                          ...current,
                          structuredOutput: event.target.checked,
                        }))
                      }
                    />
                    <span>
                      <strong>Structured output</strong>
                      <small>Supports predictable schema-based responses</small>
                    </span>
                  </label>
                  <label className="finder-field">
                    <span>Minimum context window</span>
                    <select
                      value={requirements.minimumContext ?? ''}
                      onChange={(event) =>
                        setRequirements((current) => ({
                          ...current,
                          minimumContext: event.target.value
                            ? Number(event.target.value)
                            : null,
                        }))
                      }
                    >
                      <option value="">No minimum</option>
                      <option value="32000">32K or more</option>
                      <option value="128000">128K or more</option>
                      <option value="256000">256K or more</option>
                      <option value="1000000">1M or more</option>
                    </select>
                  </label>
                </div>
              </details>
            </fieldset>

            <fieldset className="finder-budget-section">
              <legend>Budget</legend>
              <p className="wizard-description">
                Based on current standard API input price per million tokens.
              </p>
              <div className="finder-budget-grid">
                {budgetOptions.map((option) => (
                  <label
                    className={`finder-budget-option${budgetTier === option.value ? ' selected' : ''}`}
                    key={option.value}
                  >
                    <input
                      type="radio"
                      name="budget"
                      value={option.value}
                      checked={budgetTier === option.value}
                      onChange={() => chooseBudget(option.value)}
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>
              <div className="finder-budget-behavior">
                <span>Budget behavior</span>
                <label>
                  <input
                    type="radio"
                    name="budget-behavior"
                    checked={budgetBehavior === 'strict'}
                    onChange={() => setBudgetBehavior('strict')}
                  />
                  Strict
                </label>
                <label>
                  <input
                    type="radio"
                    name="budget-behavior"
                    checked={budgetBehavior === 'preferred'}
                    disabled={budgetTier === 'free'}
                    onChange={() => setBudgetBehavior('preferred')}
                  />
                  Preferred
                </label>
              </div>
              {budgetTier === 'free' ? (
                <p className="finder-note">
                  <Info size={15} /> Free requires verified zero-cost API input
                  and output, so it always behaves as a strict limit.
                </p>
              ) : null}
            </fieldset>
          </div>
        ) : null}

        {step === 3 && result ? (
          <section
            className="finder-results"
            aria-labelledby="finder-results-heading"
          >
            <div className="finder-results-heading">
              <div>
                <h2
                  id="finder-results-heading"
                  tabIndex={-1}
                  ref={resultHeading}
                >
                  Your evidence-backed shortlist
                </h2>
                <p>
                  {useCases
                    .map(
                      (selection) =>
                        `${useCaseDefinitions[selection.id].label} (${importanceLabel(selection.importance)})`,
                    )
                    .join(' · ')}
                </p>
              </div>
              <span className="finder-candidate-count">
                {result.eligibleCount} of {models.length} models qualified
              </span>
            </div>

            {result.recommendations.length === 0 ? (
              <div className="empty-state finder-empty-state">
                <h3>No trustworthy match yet</h3>
                <p>{result.omissions[0]}</p>
                <button className="button primary" onClick={() => setStep(2)}>
                  Adjust requirements
                </button>
              </div>
            ) : (
              <div className="finder-result-list">
                {result.recommendations.map((recommendation) => (
                  <article
                    className={`recommendation-result ${recommendation.category}`}
                    key={recommendation.category}
                  >
                    <div className="finder-result-topline">
                      <span className="finder-result-category">
                        {resultLabel(recommendation.category)}
                      </span>
                      <span
                        className="finder-confidence"
                        title="Coverage and freshness of verified benchmark evidence"
                      >
                        {recommendation.queryConfidence}% evidence coverage
                      </span>
                    </div>
                    <div className="finder-result-summary">
                      <div>
                        <ModelMark model={recommendation.model} />
                        <h3>{recommendation.model.name}</h3>
                        <p>{recommendation.model.provider}</p>
                      </div>
                      <div className="finder-match-score">
                        <strong>{recommendation.matchScore}</strong>
                        <span>match</span>
                      </div>
                    </div>
                    <div className="finder-result-body">
                      <div>
                        <h4>Why this matches</h4>
                        <ul>
                          {recommendation.reasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                          {recommendation.satisfiedRequirements.map(
                            (requirement) => (
                              <li key={requirement}>
                                Meets {requirement.toLowerCase()}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                      <div className="finder-tradeoff">
                        <span>Tradeoff</span>
                        <p>{recommendation.tradeoff}</p>
                      </div>
                    </div>
                    <p className="finder-price">
                      <strong>API input / 1M:</strong>{' '}
                      {comparablePrice(recommendation.model, 'input') !== null
                        ? rateLabel(recommendation.model, 'input')
                        : standardRate(recommendation.model, 'input')
                          ? `${rateLabel(recommendation.model, 'input')} (unverified)`
                          : 'Unavailable'}
                    </p>
                    <details className="score-details finder-score-details">
                      <summary>Why this match?</summary>
                      <dl className="finder-breakdown">
                        <div>
                          <dt>Task fit score</dt>
                          <dd>{recommendation.taskFit}/100</dd>
                        </div>
                        <div>
                          <dt>Priority fit</dt>
                          <dd>{recommendation.priorityFit ?? 'Unavailable'}</dd>
                        </div>
                        <div>
                          <dt>Budget / value</dt>
                          <dd>
                            {recommendation.economicsFit ?? 'Unavailable'}
                          </dd>
                        </div>
                        <div>
                          <dt>Evidence confidence</dt>
                          <dd>{recommendation.queryConfidence}%</dd>
                        </div>
                        <div className="finder-breakdown-total">
                          <dt>Final match</dt>
                          <dd>{recommendation.matchScore}</dd>
                        </div>
                      </dl>
                      <p>
                        Task evidence coverage:{' '}
                        {recommendation.evidenceCoverage}%. Effective weights:
                        task{' '}
                        {percentWeight(recommendation.effectiveWeights.taskFit)}
                        , priority{' '}
                        {percentWeight(
                          recommendation.effectiveWeights.priorityFit,
                        )}
                        , economics{' '}
                        {percentWeight(
                          recommendation.effectiveWeights.economicsFit,
                        )}
                        , confidence{' '}
                        {percentWeight(
                          recommendation.effectiveWeights.confidence,
                        )}
                        .
                      </p>
                      <div className="finder-metric-tags">
                        {Object.entries(recommendation.metricScores).map(
                          ([metric, score]) => (
                            <span key={metric}>
                              {
                                finderMetricLabels[
                                  metric as keyof typeof finderMetricLabels
                                ]
                              }{' '}
                              {Math.round(score)}
                            </span>
                          ),
                        )}
                      </div>
                    </details>
                    <div className="finder-result-actions">
                      <a
                        href={`/models/${recommendation.model.slug}`}
                        className="button"
                      >
                        Explore {recommendation.model.name}
                        <ArrowRight size={14} />
                      </a>
                      <a
                        href={`/models/${recommendation.model.slug}#pricing`}
                        className="text-link"
                      >
                        Pricing sources
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {result.omissions.length > 0 &&
            result.recommendations.length > 0 ? (
              <div className="finder-omissions">
                {result.omissions.map((omission) => (
                  <p key={omission}>{omission}</p>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {error ? (
          <p className="finder-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="wizard-actions">
          {step > 0 && step < 3 ? (
            <button
              className="button"
              onClick={() => {
                setError(null);
                setStep((current) => current - 1);
              }}
            >
              <ArrowLeft size={14} /> Back
            </button>
          ) : step === 3 ? (
            <button className="button" onClick={reset}>
              Start again
            </button>
          ) : (
            <span />
          )}
          {step === 0 ? (
            <button className="button primary" onClick={continueFromWork}>
              Continue <ArrowRight size={14} />
            </button>
          ) : null}
          {step === 1 ? (
            <button className="button primary" onClick={() => setStep(2)}>
              Continue <ArrowRight size={14} />
            </button>
          ) : null}
          {step === 2 ? (
            <button className="button primary" onClick={() => setStep(3)}>
              Find my matches <ArrowRight size={14} />
            </button>
          ) : null}
          {step === 3 && result && result.recommendations.length >= 2 ? (
            <a
              className="button primary"
              href={`/compare?models=${result.recommendations
                .map((recommendation) => recommendation.model.slug)
                .join(',')}`}
            >
              Compare matches <ArrowRight size={14} />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
