import { useState } from 'react';
import type { CatalogModel } from '../lib/catalogSchema';
import {
  comparablePrice,
  formatPrice,
  pricingSource,
  rateLabel,
} from '../lib/apiPricing';
import { PriceSource } from './ApiPricing';
import { ProviderLogo } from './ProviderLogo';

export default function PricingComparison({
  models,
}: {
  models: CatalogModel[];
}) {
  const [sort, setSort] = useState<'input' | 'output' | 'blended' | 'context'>(
    'input',
  );
  const [search, setSearch] = useState('');
  const sorted = models
    .filter((m) =>
      `${m.name} ${m.provider}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const av =
        sort === 'context' ? -a.facts.context : comparablePrice(a, sort);
      const bv =
        sort === 'context' ? -b.facts.context : comparablePrice(b, sort);
      return (
        (av ?? Infinity) - (bv ?? Infinity) || a.name.localeCompare(b.name)
      );
    });
  return (
    <section>
      <div className="pricing-controls">
        <label className="field">
          Search model or provider
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="field">
          Sort pricing
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
          >
            <option value="input">Lowest input price</option>
            <option value="output">Lowest output price</option>
            <option value="blended">Lowest blended API price</option>
            <option value="context">Largest context window</option>
          </select>
        </label>
      </div>
      <p className="micro">
        USD per 1M tokens. Blended API price = 70% input + 30% output. Tiered,
        stale and unavailable prices are excluded from price sorting and listed
        after comparable rates.
      </p>
      <div
        className="table-scroll pricing-desktop-table"
        tabIndex={0}
        role="region"
        aria-label="API pricing comparison"
      >
        <table className="cost-table">
          <caption>
            Official API pricing, with OpenRouter fallback where verified
          </caption>
          <thead>
            <tr>
              {[
                'Model',
                'Provider',
                'Input / 1M',
                'Cached / 1M',
                'Output / 1M',
                ...(sort === 'blended' ? ['Blended / 1M'] : []),
                'Context',
                'Pricing notes',
                'Source freshness',
              ].map((s) => (
                <th scope="col" key={s}>
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => {
              return (
                <tr key={m.slug}>
                  <th scope="row">
                    <a href={`/models/${m.slug}#pricing`}>{m.name}</a>
                  </th>
                  <td>{m.provider}</td>
                  {(['input', 'cached', 'output'] as const).map((key) => (
                    <td key={key}>{rateLabel(m, key)}</td>
                  ))}
                  {sort === 'blended' && (
                    <td>{formatPrice(comparablePrice(m, 'blended'))}</td>
                  )}
                  <td>{m.facts.context.toLocaleString('en-US')}</td>
                  <td>
                    {m.apiPricing?.scope ?? 'Awaiting verification'}{' '}
                    <a href={`/models/${m.slug}#pricing`}>Details</a>
                  </td>
                  <td>
                    <PriceSource price={pricingSource(m.apiPricing)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mobile-pricing-list" aria-label="API pricing cards">
        {sorted.map((model) => {
          const rate = (key: 'input' | 'cached' | 'output') =>
            rateLabel(model, key);
          return (
            <article className="mobile-pricing-card" key={model.slug}>
              <header className="mobile-pricing-card-header">
                <ProviderLogo provider={model.provider} size={24} />
                <div>
                  <span>{model.provider}</span>
                  <h2>
                    <a href={`/models/${model.slug}#pricing`}>{model.name}</a>
                  </h2>
                </div>
              </header>
              <dl className="mobile-pricing-rate-grid">
                <div>
                  <dt>Input / 1M</dt>
                  <dd>{rate('input')}</dd>
                </div>
                <div>
                  <dt>Output / 1M</dt>
                  <dd>{rate('output')}</dd>
                </div>
                <div>
                  <dt>Cached / 1M</dt>
                  <dd>{rate('cached')}</dd>
                </div>
                <div>
                  <dt>Context</dt>
                  <dd>{model.facts.context.toLocaleString('en-US')}</dd>
                </div>
                {sort === 'blended' && (
                  <div className="mobile-pricing-blended">
                    <dt>Blended / 1M</dt>
                    <dd>{formatPrice(comparablePrice(model, 'blended'))}</dd>
                  </div>
                )}
              </dl>
              <div className="mobile-pricing-card-details">
                <p>
                  {model.apiPricing?.scope ?? 'Awaiting verification'}{' '}
                  <a href={`/models/${model.slug}#pricing`}>Pricing details</a>
                </p>
                <div className="mobile-pricing-freshness">
                  <span>Source freshness</span>
                  <PriceSource price={pricingSource(model.apiPricing)} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {sorted.length === 0 && (
        <p className="notice">No models match your search.</p>
      )}
      <p>
        <a className="button" href="/cost">
          Calculate your workload
        </a>
      </p>
    </section>
  );
}
