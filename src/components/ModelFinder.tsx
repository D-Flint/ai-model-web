import { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import type { CatalogModel } from '../lib/catalogSchema';
import {
  recommend,
  taskCost,
  money,
  type Budget,
  type Priority,
} from '../lib/decision';
import type { Metric } from '../data/config';
import { ModelMark } from './ModelCard';
const tasks: { value: Metric; label: string; description: string }[] = [
  {
    value: 'coding',
    label: 'Coding',
    description: 'Build, debug, and understand code',
  },
  {
    value: 'dailyUse',
    label: 'Daily use',
    description: 'Questions, planning, and everyday help',
  },
  {
    value: 'intelligence',
    label: 'Study',
    description: 'Explain ideas and work through problems',
  },
  {
    value: 'writing',
    label: 'Writing',
    description: 'Draft, edit, and find your voice',
  },
  {
    value: 'research',
    label: 'Research',
    description: 'Synthesize documents and information',
  },
  {
    value: 'agentic',
    label: 'Agentic workflows',
    description: 'Complete multi-step tasks with tools',
  },
  {
    value: 'vision',
    label: 'Images and vision',
    description: 'Understand images and charts',
  },
  {
    value: 'overall',
    label: 'A bit of everything',
    description: 'A balanced all-round assistant',
  },
];
const priorities: { value: Priority; label: string; description: string }[] = [
  {
    value: 'quality',
    label: 'Best quality',
    description: 'Take the time to get a stronger answer',
  },
  {
    value: 'cost',
    label: 'Lowest cost',
    description: 'Keep spending as low as possible',
  },
  {
    value: 'speed',
    label: 'Fastest answers',
    description: 'Keep up with my pace',
  },
  {
    value: 'value',
    label: 'Best value',
    description: 'Balance useful results and price',
  },
  {
    value: 'reliability',
    label: 'Most reliable',
    description: 'Consistent results and fewer corrections',
  },
  {
    value: 'balanced',
    label: 'A balanced choice',
    description: 'A little of everything',
  },
];
const budgets: { value: Budget; label: string; description: string }[] = [
  { value: 'free', label: 'Free', description: 'No paid API usage' },
  {
    value: 'cheap',
    label: 'Very cheap',
    description: 'Up to $0.005 per sample task',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Up to $0.03 per sample task',
  },
  {
    value: 'any',
    label: 'Cost is flexible',
    description: 'Show every price range',
  },
];
export default function ModelFinder({ models }: { models: CatalogModel[] }) {
  const [step, setStep] = useState(0);
  const [task, setTask] = useState<Metric>('coding');
  const [priority, setPriority] = useState<Priority>('balanced');
  const [budget, setBudget] = useState<Budget>('any');
  const results = recommend(models, task, priority, budget);
  const best = results[0];
  const value = [...results]
    .filter((r) => r.model.slug !== best?.model.slug)
    .sort(
      (a, b) => b.model.scores.costEfficiency - a.model.scores.costEfficiency,
    )[0];
  const alternative = results.find(
    (r) =>
      r.model.slug !== best?.model.slug && r.model.slug !== value?.model.slug,
  );
  const picks = [best, value, alternative].filter(
    (r): r is NonNullable<typeof r> => Boolean(r),
  );
  return (
    <div className="wizard">
      <div className="wizard-progress">
        {['Your work', 'Your priority', 'Your budget'].map((label, i) => (
          <span key={label} className={step >= i ? 'active' : ''}>
            {label}
          </span>
        ))}
      </div>
      <div className="panel">
        {step < 3 ? (
          <>
            <fieldset>
              <legend>
                {
                  [
                    'What do you mainly want AI for?',
                    'What matters most to you?',
                    'What is your budget preference?',
                  ][step]
                }
              </legend>
              <p className="wizard-description">
                {
                  [
                    'Choose the task you come back to most often.',
                    'We’ll use this to weigh the tradeoffs.',
                    'These are API task budgets, not chat subscriptions.',
                  ][step]
                }
              </p>
              <div className="option-grid">
                {step === 0
                  ? tasks.map((option) => (
                      <label className="option-card" key={option.value}>
                        <input
                          type="radio"
                          name="task"
                          value={option.value}
                          checked={task === option.value}
                          onChange={() => setTask(option.value)}
                        />
                        <span>
                          {option.label}
                          <small>{option.description}</small>
                        </span>
                      </label>
                    ))
                  : step === 1
                    ? priorities.map((option) => (
                        <label className="option-card" key={option.value}>
                          <input
                            type="radio"
                            name="priority"
                            value={option.value}
                            checked={priority === option.value}
                            onChange={() => setPriority(option.value)}
                          />
                          <span>
                            {option.label}
                            <small>{option.description}</small>
                          </span>
                        </label>
                      ))
                    : budgets.map((option) => (
                        <label className="option-card" key={option.value}>
                          <input
                            type="radio"
                            name="budget"
                            value={option.value}
                            checked={budget === option.value}
                            onChange={() => setBudget(option.value)}
                          />
                          <span>
                            {option.label}
                            <small>{option.description}</small>
                          </span>
                        </label>
                      ))}
              </div>
            </fieldset>
            <div className="wizard-actions">
              <button
                className="button"
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                className="button primary"
                onClick={() => setStep(step + 1)}
              >
                {step === 2 ? 'Find my matches' : 'Continue'}
                <ArrowRight size={14} />
              </button>
            </div>
          </>
        ) : (
          <div aria-live="polite">
            <h2>Your shortlist, with reasons.</h2>
            <p className="wizard-description">
              {tasks.find((t) => t.value === task)?.label} ·{' '}
              {priorities.find((p) => p.value === priority)?.label}. Sample
              recommendations only.
            </p>
            {!picks.length ? (
              <div className="empty-state">
                <h3>No models fit this budget.</h3>
                <p>
                  The sample catalog has no free API models. Free chat plans and
                  self-hosting are separate from API pricing.
                </p>
                <button className="button primary" onClick={() => setStep(2)}>
                  Adjust my budget
                </button>
              </div>
            ) : (
              picks.map((pick, i) => (
                <article
                  className="recommendation-result"
                  key={pick.model.slug}
                >
                  <div className="tags">
                    <span>
                      {['Best match', 'Best value choice', 'Alternative'][i]}
                    </span>
                    <span>{pick.score}/100 fit score</span>
                  </div>
                  <ModelMark model={pick.model} />
                  <h3>{pick.model.name}</h3>
                  <p>
                    {pick.model.description} {pick.model.strengths[0]}
                  </p>
                  <p>
                    <strong>The tradeoff:</strong>{' '}
                    {pick.model.weaknesses.join('; ')}.
                  </p>
                  <p>
                    <strong>Estimated task cost:</strong>{' '}
                    {money(taskCost(pick.model), 4)} for 1,000 input + 500
                    output tokens, one attempt.
                  </p>
                  <details className="score-details">
                    <summary>Why this match?</summary>
                    <p>
                      {pick.reason} Budget filtering happens first.{' '}
                      {i === 1
                        ? 'The value choice has the highest cost-efficiency score among remaining eligible models.'
                        : ''}{' '}
                      Equal fit scores are ordered by lower task cost, then
                      model slug.
                    </p>
                  </details>
                  <a href={`/models/${pick.model.slug}`} className="button">
                    Explore {pick.model.name}
                    <ArrowRight size={14} />
                  </a>
                </article>
              ))
            )}
            <div className="wizard-actions">
              <button className="button" onClick={() => setStep(0)}>
                Start again
              </button>
              {picks.length >= 2 && (
                <a
                  className="button primary"
                  href={`/compare?models=${picks.map((p) => p.model.slug).join(',')}`}
                >
                  Compare my matches <ArrowRight size={14} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
