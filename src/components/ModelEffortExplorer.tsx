import { useState } from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import type { CatalogModel } from '../lib/catalogSchema';
import { effortLabels, type ReasoningEffort } from '../data/config';
import { getModelEffortStats, money } from '../lib/decision';

export default function ModelEffortExplorer({
  model,
}: {
  model: CatalogModel;
}) {
  const isReasoning = Boolean(
    model.facts.reasoningEffort &&
    model.facts.reasoningEffort.length > 0 &&
    !model.facts.reasoningEffort.includes('none'),
  );

  const availableEfforts: ReasoningEffort[] = isReasoning
    ? model.facts.reasoningEffort.filter((e) => e !== 'none')
    : [];

  const defaultEffort: ReasoningEffort =
    model.facts.defaultEffort && model.facts.defaultEffort !== 'none'
      ? model.facts.defaultEffort
      : (availableEfforts[0] ?? 'medium');

  const [selectedEffort, setSelectedEffort] =
    useState<ReasoningEffort>(defaultEffort);

  if (!isReasoning || availableEfforts.length <= 1) {
    return null;
  }

  const currentStats = getModelEffortStats(model, selectedEffort);
  const baselineStats = getModelEffortStats(model, defaultEffort);

  const overallDelta =
    currentStats.scores.overall - baselineStats.scores.overall;
  const intelligenceDelta =
    currentStats.scores.intelligence - baselineStats.scores.intelligence;
  const speedDelta = currentStats.scores.speed - baselineStats.scores.speed;
  const costDelta = currentStats.taskCost - baselineStats.taskCost;

  // Comparison link comparing available effort levels of this model
  const compareEffortsParam = availableEfforts
    .slice(0, 3)
    .map((e) => `${model.slug}:${e}`)
    .join(',');
  const compareUrl = `/compare?models=${compareEffortsParam}`;

  return (
    <div className="effort-explorer">
      <div className="effort-explorer-header">
        <div className="effort-explorer-title">
          <Layers size={18} />
          <span>Reasoning Effort Levels & Dynamic Stats</span>
        </div>
        <div
          className="effort-tabs"
          role="tablist"
          aria-label="Select reasoning effort"
        >
          {availableEfforts.map((effort) => (
            <button
              key={effort}
              type="button"
              role="tab"
              aria-selected={selectedEffort === effort}
              className={`effort-tab ${selectedEffort === effort ? 'active' : ''}`}
              onClick={() => setSelectedEffort(effort)}
            >
              {effortLabels[effort]}
            </button>
          ))}
        </div>
      </div>

      <p className="micro muted" style={{ margin: '0 0 16px' }}>
        Adjusting reasoning effort allocates more or fewer internal thinking
        tokens, directly altering intelligence, speed, and cost tradeoffs.
      </p>

      <div className="effort-stats-grid">
        <div className="effort-stat-card">
          <span className="label">Overall Score</span>
          <div className="value">{currentStats.scores.overall}/100</div>
          {overallDelta !== 0 && (
            <div
              className={`delta ${overallDelta > 0 ? 'delta-positive' : 'delta-negative'}`}
            >
              {overallDelta > 0 ? `+${overallDelta}` : overallDelta} vs default
            </div>
          )}
        </div>

        <div className="effort-stat-card">
          <span className="label">Intelligence</span>
          <div className="value">{currentStats.scores.intelligence}/100</div>
          {intelligenceDelta !== 0 && (
            <div
              className={`delta ${intelligenceDelta > 0 ? 'delta-positive' : 'delta-negative'}`}
            >
              {intelligenceDelta > 0
                ? `+${intelligenceDelta}`
                : intelligenceDelta}{' '}
              pts
            </div>
          )}
        </div>

        <div className="effort-stat-card">
          <span className="label">Speed Rating</span>
          <div className="value">{currentStats.scores.speed}/100</div>
          {speedDelta !== 0 && (
            <div
              className={`delta ${speedDelta > 0 ? 'delta-positive' : 'delta-negative'}`}
            >
              {speedDelta > 0 ? `+${speedDelta}` : speedDelta} pts
            </div>
          )}
        </div>

        <div className="effort-stat-card">
          <span className="label">Thinking Tokens</span>
          <div className="value">
            {currentStats.reasoningTokens > 0
              ? `+${currentStats.reasoningTokens.toLocaleString()}`
              : '0'}
          </div>
          <div className="micro muted">per task</div>
        </div>

        <div className="effort-stat-card">
          <span className="label">Latency Profile</span>
          <div className="value" style={{ fontSize: '14px', marginTop: '6px' }}>
            {currentStats.latency}
          </div>
        </div>

        <div className="effort-stat-card">
          <span className="label">Est. Task Cost</span>
          <div className="value">{money(currentStats.taskCost, 4)}</div>
          {costDelta !== 0 && (
            <div
              className={`delta ${costDelta < 0 ? 'delta-positive' : 'delta-negative'}`}
            >
              {costDelta > 0 ? `+${money(costDelta, 4)}` : money(costDelta, 4)}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
        }}
      >
        <a className="button primary" href={compareUrl}>
          Compare {model.name} effort levels side-by-side{' '}
          <ArrowRight size={14} />
        </a>
      </div>
    </div>
  );
}
