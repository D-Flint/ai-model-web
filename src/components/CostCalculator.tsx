import { useEffect, useState } from 'react';
import type { CatalogModel } from '../lib/catalogSchema';
import { calculateApiCost, formatPrice } from '../lib/apiPricing';
import { selectionFromSearch } from '../lib/decision';
import ApiPricing from './ApiPricing';

const empty = {
  input: '',
  output: '',
  cached: '',
  requests: '',
  cacheWrite5m: '',
  cacheWrite1h: '',
  search: '',
  cacheTokenHours: '',
};
export default function CostCalculator({ models }: { models: CatalogModel[] }) {
  const [slug, setSlug] = useState('');
  const [fields, setFields] = useState(empty);
  const [submitted, setSubmitted] = useState(false);
  const model = models.find((m) => m.slug === slug);
  useEffect(() => {
    const selected = selectionFromSearch(location.search, models)[0]?.split(
      ':',
    )[0];
    if (selected) setSlug(selected);
  }, [models]);
  const tiers = model?.apiPricing?.tiers ?? [];
  const optional = [
    ...(tiers.some((t) => t.cached)
      ? [['cached', 'Cached input tokens per request']]
      : []),
    ...(tiers.some((t) => t.cacheWrite5m)
      ? [['cacheWrite5m', '5-minute cache-write tokens per request']]
      : []),
    ...(tiers.some((t) => t.cacheWrite1h)
      ? [['cacheWrite1h', '1-hour cache-write tokens per request']]
      : []),
    ...(tiers.some((t) => t.search)
      ? [['search', 'Web searches per request']]
      : []),
    ...(tiers.some((t) => t.cacheStorage)
      ? [['cacheTokenHours', 'Total stored token-hours across all requests']]
      : []),
  ] as [keyof typeof empty, string][];
  let result: ReturnType<typeof calculateApiCost> | null = null;
  let error = '';
  if (submitted) {
    try {
      if (!model) throw new Error('Choose a model.');
      if (
        ['input', 'output', 'requests'].some(
          (key) => !fields[key as keyof typeof empty].trim(),
        )
      )
        throw new Error(
          'Enter your input tokens, output tokens and number of requests.',
        );
      const enabled = new Set([
        'input',
        'output',
        'requests',
        ...optional.map(([key]) => key),
      ]);
      const counts = Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [
          key,
          enabled.has(key) ? Number(value) : 0,
        ]),
      ) as Record<keyof typeof empty, number>;
      result = calculateApiCost(model.apiPricing, counts);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Check your workload.';
    }
  }
  function field(key: keyof typeof empty, label: string) {
    return (
      <label className="field" key={key}>
        {label}
        <input
          type="number"
          min="0"
          step="1"
          value={fields[key]}
          onChange={(e) => {
            setFields({ ...fields, [key]: e.target.value });
            setSubmitted(false);
          }}
        />
      </label>
    );
  }
  return (
    <div className="calculator-layout">
      <form
        className="panel calculator-inputs"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}
      >
        <h2>Your workload</h2>
        <label className="field">
          Model
          <select
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setFields(empty);
              setSubmitted(false);
            }}
          >
            <option value="">Choose a model</option>
            {models.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}
                {!m.apiPricing ? ' — pricing unavailable' : ''}
              </option>
            ))}
          </select>
        </label>
        {field('input', 'Uncached input tokens per request')}
        {field('output', 'Output tokens per request')}
        {field('requests', 'Number of requests')}
        <p className="micro">
          Use billed token counts, including conversation history and billed
          thinking tokens. Uncached input excludes cached reads and cache
          writes.
        </p>
        {optional.length > 0 && (
          <details>
            <summary>Optional provider-specific usage</summary>
            {optional.map(([key, label]) => field(key, label))}
            <p className="micro">
              Leave unused categories blank. Token-hours = stored tokens × hours
              retained, across your entire workload.
            </p>
          </details>
        )}
        <button className="button primary" type="submit">
          Calculate cost
        </button>
      </form>
      <section aria-live="polite">
        <h2>Estimated API workload cost</h2>
        {!submitted && (
          <p className="notice">
            Enter your own workload to calculate a cost. No usage is assumed.
          </p>
        )}
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        {result && (
          <div className="panel">
            <p>Based on your inputs · {fields.requests} requests</p>
            <h3>{formatPrice(result.total)}</h3>
            <dl className="api-rate-list">
              <div>
                <dt>Uncached input</dt>
                <dd>{formatPrice(result.input)}</dd>
              </div>
              <div>
                <dt>Output</dt>
                <dd>{formatPrice(result.output)}</dd>
              </div>
              <div>
                <dt>Cached input</dt>
                <dd>{formatPrice(result.cached)}</dd>
              </div>
              <div>
                <dt>Provider extras</dt>
                <dd>{formatPrice(result.extras)}</dd>
              </div>
            </dl>
            <p className="micro">
              Applied tier: {result.tier.label}. Each request uses the same
              token counts you entered. Count retries as additional requests.
            </p>
          </div>
        )}
        {model && (
          <div className="panel">
            <ApiPricing model={model} details />
          </div>
        )}
        <p className="micro">
          This is a workload estimate in USD, before taxes. Subscriptions,
          hosting and charges outside the listed billing scope are excluded.
        </p>
        <a href="/pricing">Compare API pricing</a> ·{' '}
        <a href="/methodology#api-pricing">Pricing methodology</a>
      </section>
    </div>
  );
}
