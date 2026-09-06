import { useState } from 'react';
import type { CatalogModel } from '../lib/catalogSchema';
import { comparablePrice, formatPrice } from '../lib/apiPricing';
import { PriceSource } from './ApiPricing';

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
        className="table-scroll"
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
              const tiers = m.apiPricing?.tiers ?? [];
              const varying = tiers.length > 1;
              const t = tiers[0];
              return (
                <tr key={m.slug}>
                  <th scope="row">
                    <a href={`/models/${m.slug}#pricing`}>{m.name}</a>
                  </th>
                  <td>{m.provider}</td>
                  {(['input', 'cached', 'output'] as const).map((key) => (
                    <td key={key}>
                      {varying
                        ? 'Varies by context'
                        : formatPrice(t?.[key]?.value)}
                    </td>
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
                    <PriceSource price={t?.input ?? null} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
