import { rateLabel } from '../lib/apiPricing';
import { useState } from 'react';
import { ArrowRight, ArrowLeftRight } from 'lucide-react';
import type { CatalogModel } from '../lib/catalogSchema';
import { getSpeedDisplayValue, getSpeedTokensPerSec } from '../lib/decision';
import { ModelMark } from './ModelCard';
import { DEFAULT_COMPARISON_SLUGS } from '../lib/comparisonPairs';
function getModelComparisonToken(model: CatalogModel): string {
  const isReasoning = Boolean(
    model.facts.reasoningEffort &&
    model.facts.reasoningEffort.length > 0 &&
    model.facts.reasoningEffort.some((effort) => effort !== 'none'),
  );
  if (!isReasoning) return model.slug;
  const effort =
    model.facts.defaultEffort && model.facts.defaultEffort !== 'none'
      ? model.facts.defaultEffort
      : 'medium';
  return `${model.slug}:${effort}`;
}

export default function HeroCompare({ models }: { models: CatalogModel[] }) {
  const initialLeft =
    models.find((m) => m.slug === DEFAULT_COMPARISON_SLUGS[0])?.slug ??
    models[0].slug;
  const initialRight =
    models.find((m) => m.slug === DEFAULT_COMPARISON_SLUGS[1])?.slug ??
    models[1].slug;
  const [left, setLeft] = useState(initialLeft);
  const [right, setRight] = useState(initialRight);
  const a = models.find((m) => m.slug === left)!;
  const b = models.find((m) => m.slug === right)!;
  const aSpeed = getSpeedTokensPerSec(a);
  const bSpeed = getSpeedTokensPerSec(b);
  const aSpeedDisplay = getSpeedDisplayValue(a);
  const bSpeedDisplay = getSpeedDisplayValue(b);
  return (
    <div className="hero-comparison">
      <div className="preview-top">
        <span>
          <ArrowLeftRight size={15} /> A clearer comparison
        </span>
        <span className="micro">Sample data</span>
      </div>
      <div className="preview-models">
        {[a, b].map((m, i) => (
          <div key={i}>
            <ModelMark model={m} />
            <label className="sr-only" htmlFor={`hero-model-${i}`}>
              {i === 0 ? 'First model' : 'Second model'}
            </label>
            <select
              id={`hero-model-${i}`}
              value={m.slug}
              onChange={(e) =>
                i === 0 ? setLeft(e.target.value) : setRight(e.target.value)
              }
            >
              {models
                .filter((x) => x.slug !== (i === 0 ? right : left))
                .map((x) => (
                  <option key={x.slug} value={x.slug}>
                    {x.name}
                  </option>
                ))}
            </select>
            <span>{m.provider}</span>
          </div>
        ))}
      </div>
      <div className="preview-score">
        <div>
          <strong>{a.scores.overall !== null ? a.scores.overall : '—'}</strong>
          <span>Overall score</span>
        </div>
        <span className="versus">vs</span>
        <div>
          <strong>{b.scores.overall !== null ? b.scores.overall : '—'}</strong>
          <span>Overall score</span>
        </div>
      </div>
      <div className="preview-rows">
        <div>
          <strong
            className={
              (a.scores.intelligence ?? -1) >= (b.scores.intelligence ?? -1) &&
              a.scores.intelligence !== null
                ? 'accent'
                : ''
            }
          >
            {a.scores.intelligence !== null ? a.scores.intelligence : '—'}
          </strong>
          <span>Intelligence</span>
          <strong
            className={
              (b.scores.intelligence ?? -1) >= (a.scores.intelligence ?? -1) &&
              b.scores.intelligence !== null
                ? 'accent'
                : ''
            }
          >
            {b.scores.intelligence !== null ? b.scores.intelligence : '—'}
          </strong>
        </div>
        <div>
          <strong className={aSpeed >= bSpeed && aSpeed > 0 ? 'accent' : ''}>
            {aSpeedDisplay ? (
              <>
                {aSpeedDisplay} <small className="micro muted">tok/s</small>
              </>
            ) : (
              '—'
            )}
          </strong>
          <span>Speed</span>
          <strong className={bSpeed >= aSpeed && bSpeed > 0 ? 'accent' : ''}>
            {bSpeedDisplay ? (
              <>
                {bSpeedDisplay} <small className="micro muted">tok/s</small>
              </>
            ) : (
              '—'
            )}
          </strong>
        </div>
        <div>
          <strong>{rateLabel(a, 'input')}</strong>
          <span>Input / 1M</span>
          <strong>{rateLabel(b, 'input')}</strong>
        </div>
      </div>
      <a
        className="preview-link"
        href={`/compare?models=${getModelComparisonToken(a)},${getModelComparisonToken(b)}`}
      >
        See the full comparison <ArrowRight size={16} />
      </a>
    </div>
  );
}
