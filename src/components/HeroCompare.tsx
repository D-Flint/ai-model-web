import { useState } from 'react';
import { ArrowRight, ArrowLeftRight } from 'lucide-react';
import type { CatalogModel } from '../lib/catalogSchema';
import { ModelMark } from './ModelCard';
export default function HeroCompare({ models }: { models: CatalogModel[] }) {
  const [left, setLeft] = useState(models[0].slug);
  const [right, setRight] = useState(models[1].slug);
  const a = models.find((m) => m.slug === left)!;
  const b = models.find((m) => m.slug === right)!;
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
          <strong>{a.scores.overall}</strong>
          <span>Overall score</span>
        </div>
        <span className="versus">vs</span>
        <div>
          <strong>{b.scores.overall}</strong>
          <span>Overall score</span>
        </div>
      </div>
      <div className="preview-rows">
        {(['coding', 'research', 'speed'] as const).map((key) => (
          <div key={key}>
            <strong className={a.scores[key] >= b.scores[key] ? 'accent' : ''}>
              {a.scores[key]}
            </strong>
            <span>
              {key === 'coding'
                ? 'Coding'
                : key === 'research'
                  ? 'Research'
                  : 'Speed'}
            </span>
            <strong className={b.scores[key] >= a.scores[key] ? 'accent' : ''}>
              {b.scores[key]}
            </strong>
          </div>
        ))}
      </div>
      <a className="preview-link" href={`/compare?models=${left},${right}`}>
        See the full comparison <ArrowRight size={16} />
      </a>
    </div>
  );
}
