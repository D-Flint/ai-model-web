import type { CatalogModel } from '../lib/catalogSchema';
import type { PriceValue } from '../lib/apiPricingSchema';
import { formatPrice, priceFreshness, pricingSource } from '../lib/apiPricing';

export function PriceSource({
  price,
  now,
}: {
  price: PriceValue | null;
  now?: Date;
}) {
  if (!price) return <span className="micro muted">Unavailable</span>;
  return (
    <small className="pricing-source">
      <a href={price.source.url}>{price.source.name}</a> ·{' '}
      <span
        data-price-date={price.source.retrievedAt}
        data-effective-date={price.source.effectiveFrom ?? ''}
        data-price-lifecycle={price.source.lifecycle ?? 'current'}
      >
        {priceFreshness(price, now)}
      </span>{' '}
      ·{' '}
      <time dateTime={price.source.retrievedAt}>
        Verified {price.source.retrievedAt}
      </time>
    </small>
  );
}
export default function ApiPricing({
  model,
  details = false,
}: {
  model: CatalogModel;
  details?: boolean;
}) {
  const pricing = model.apiPricing;
  if (!pricing?.tiers.length)
    return (
      <div className="api-pricing">
        <strong>API pricing</strong>
        <p className="micro">Unavailable — awaiting source verification.</p>
        <span className="micro">
          {model.facts.context.toLocaleString('en-US')} token context
        </span>
      </div>
    );
  if (!details && pricing.tiers.length > 1)
    return (
      <div className="api-pricing">
        <strong>API pricing</strong>
        <dl className="api-rate-list">
          {(
            [
              ['Input', pricing.tiers[0].input],
              ['Output', pricing.tiers[0].output],
              ['Cached input', pricing.tiers[0].cached],
            ] as [string, PriceValue | null][]
          ).map(([label, rate]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                {formatPrice(rate?.value)}
                {rate && <small> / 1M tokens</small>}
              </dd>
            </div>
          ))}
        </dl>
        <a href={`/models/${model.slug}#pricing`}>View pricing details</a>
        <PriceSource price={pricing.tiers[0].input} />
      </div>
    );
  return (
    <div className="api-pricing">
      {!details && <strong>API pricing</strong>}
      {pricing.tiers.map((tier) => (
        <div key={tier.id}>
          {details && <h3>{tier.label}</h3>}
          <dl className="api-rate-list">
            {(
              [
                ['Input', tier.input],
                ['Output', tier.output],
                ['Cached input', tier.cached],
                ...(details
                  ? [
                      ['Cache write · 5 min', tier.cacheWrite5m],
                      ['Cache write · 1 hour', tier.cacheWrite1h],
                    ]
                  : []),
              ] as [string, PriceValue | null][]
            )
              .filter(
                ([label, rate]) =>
                  rate ||
                  label === 'Input' ||
                  label === 'Output' ||
                  (details && label === 'Cached input'),
              )
              .map(([label, rate]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>
                    {formatPrice(rate?.value)}
                    {rate && <small> / 1M tokens</small>}
                    {details && <PriceSource price={rate} />}
                  </dd>
                </div>
              ))}
            {details && tier.cacheStorage && (
              <div>
                <dt>Cache storage</dt>
                <dd>
                  {formatPrice(tier.cacheStorage.value)} / 1M token-hours
                  <PriceSource price={tier.cacheStorage} />
                </dd>
              </div>
            )}
            {details && tier.search && (
              <div>
                <dt>Web search</dt>
                <dd>
                  {formatPrice(tier.search.value)} / call
                  <PriceSource price={tier.search} />
                </dd>
              </div>
            )}
          </dl>
          {!details && <PriceSource price={pricingSource(pricing)} />}
        </div>
      ))}
      {details && (
        <>
          {pricing.periods && pricing.periods.length > 0 && (
            <section
              className="api-pricing-periods"
              aria-label="Scheduled API rates"
            >
              <h3>Peak and off-peak rates</h3>
              {pricing.periods.map((period) => (
                <div key={period.id}>
                  <h4>{period.label}</h4>
                  <dl className="api-rate-list">
                    {(
                      [
                        ['Input', period.input],
                        ['Output', period.output],
                        ['Cached input', period.cached],
                      ] as [string, PriceValue | null][]
                    ).map(([label, rate]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>
                          {formatPrice(rate?.value)}
                          {rate && <small> / 1M tokens</small>}
                          <PriceSource price={rate} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </section>
          )}
          <p>{pricing.scope}</p>
          <p>
            Context window: {model.facts.context.toLocaleString('en-US')} tokens
            {model.facts.contextSourceId && (
              <>
                {' '}
                ·{' '}
                <a
                  href={
                    model.sources.find(
                      (s) => s.id === model.facts.contextSourceId,
                    )?.url
                  }
                >
                  Context source
                </a>
              </>
            )}
          </p>
          {pricing.notes.map((note) => (
            <p className="micro" key={note}>
              {note}
            </p>
          ))}
          <p className="micro">
            Effective date:{' '}
            {pricing.tiers[0].input?.source.effectiveFrom ??
              'Not supplied by provider'}
            .
          </p>
          <h3>Benchmark cost per task</h3>
          {pricing.benchmarkCost ? (
            <p>
              {formatPrice(pricing.benchmarkCost.amount.value)} ·{' '}
              {pricing.benchmarkCost.benchmark} ·{' '}
              {pricing.benchmarkCost.taskScope} ·{' '}
              <a href={pricing.benchmarkCost.methodologyUrl}>Methodology</a>
              <PriceSource price={pricing.benchmarkCost.amount} />
            </p>
          ) : (
            <p className="micro">
              Unavailable — no documented task-cost measurement.
            </p>
          )}
        </>
      )}
    </div>
  );
}
