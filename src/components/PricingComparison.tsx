import { useEffect, useState } from 'react';
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
  initialPricingAsOf,
}: {
  models: CatalogModel[];
  initialPricingAsOf: string;
}) {
  const [sort, setSort] = useState<'input' | 'output' | 'blended' | 'context'>(
    'input',
  );
  const [search, setSearch] = useState('');
  const [pricingAsOf, setPricingAsOf] = useState(
    () => new Date(initialPricingAsOf),
  );

  useEffect(() => {
    setPricingAsOf(new Date());
  }, []);

  const sorted = models
    .filter((m) =>
      `${m.name} ${m.provider}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const av =
        sort === 'context'
          ? -a.facts.context
          : comparablePrice(a, sort, pricingAsOf);
      const bv =
        sort === 'context'
          ? -b.facts.context
          : comparablePrice(b, sort, pricingAsOf);
      return (
        (av ?? Infinity) - (bv ?? Infinity) || a.name.localeCompare(b.name)
      );
    });
  return (
    <section>
      <div className="pricing-controls">
        <label className="field" htmlFor="pricing-search">
          Search model or provider
          <input
            id="pricing-search"
            name="pricing-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="field" htmlFor="pricing-sort">
          Sort pricing
          <select
            id="pricing-sort"
            name="pricing-sort"
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
        USD per 1M tokens. Blended API price uses standard cache-aware workload:
        75% cached input + 20% fresh input + 5% output. Tiered models are sorted
        by standard context rates. Stale and unavailable prices are listed after
        comparable rates.
      </p>
      <div
        className="table-scroll pricing-desktop-table"
        tabIndex={0}
        role="region"
        aria-label="API pricing comparison"
      >
        <table className="cost-table pricing-table">
          <caption>
            Official API pricing, with OpenRouter fallback where verified
          </caption>
          <thead>
            <tr>
              {[
                { title: 'Model', className: 'col-model' },
                { title: 'Provider', className: 'col-provider' },
                { title: 'Input / 1M', className: 'col-rate' },
                { title: 'Cached / 1M', className: 'col-rate' },
                { title: 'Output / 1M', className: 'col-rate' },
                ...(sort === 'blended'
                  ? [{ title: 'Blended / 1M', className: 'col-rate' }]
                  : []),
                { title: 'Context', className: 'col-context' },
                { title: 'Pricing notes', className: 'col-notes' },
                { title: 'Source freshness', className: 'col-source' },
              ].map(({ title, className }) => (
                <th scope="col" key={title} className={className}>
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => {
              return (
                <tr key={m.slug} className="pricing-row">
                  <th scope="row" className="col-model">
                    <a href={`/models/${m.slug}#pricing`}>{m.name}</a>
                    {m.dataKind === 'synthetic' && (
                      <span className="synthetic-badge">Synthetic</span>
                    )}
                  </th>
                  <td className="col-provider">{m.provider}</td>
                  {(['input', 'cached', 'output'] as const).map((key) => (
                    <td key={key} className="col-rate">
                      {rateLabel(m, key, pricingAsOf)}
                    </td>
                  ))}
                  {sort === 'blended' && (
                    <td className="col-rate">
                      {formatPrice(comparablePrice(m, 'blended', pricingAsOf))}
                    </td>
                  )}
                  <td className="col-context">
                    {m.facts.context.toLocaleString('en-US')}
                  </td>
                  <td className="col-notes">
                    <span className="pricing-notes">
                      {m.apiPricing?.scope ?? 'Awaiting verification'}{' '}
                      <a href={`/models/${m.slug}#pricing`}>Details</a>
                    </span>
                  </td>
                  <td className="col-source">
                    <PriceSource
                      price={pricingSource(m.apiPricing)}
                      now={pricingAsOf}
                    />
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
            rateLabel(model, key, pricingAsOf);
          return (
            <article className="mobile-pricing-card" key={model.slug}>
              <header className="mobile-pricing-card-header">
                <ProviderLogo provider={model.provider} size={24} />
                <div>
                  <span>{model.provider}</span>
                  <h2>
                    <a href={`/models/${model.slug}#pricing`}>{model.name}</a>
                  </h2>
                  {model.dataKind === 'synthetic' && (
                    <span className="synthetic-badge">Synthetic</span>
                  )}
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
                    <dd>
                      {formatPrice(
                        comparablePrice(model, 'blended', pricingAsOf),
                      )}
                    </dd>
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
                  <PriceSource
                    price={pricingSource(model.apiPricing)}
                    now={pricingAsOf}
                  />
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
