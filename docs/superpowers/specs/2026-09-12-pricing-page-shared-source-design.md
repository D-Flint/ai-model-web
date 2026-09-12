# Pricing page shared source

## Goal

Keep each model's API price values and compact pricing provenance synchronized between the model detail and API pricing pages. The pricing page will show one shared source link per model, rather than a source link for every rate.

## Scope

- Add one shared resolver that selects a stable source from the model's active reviewed `apiPricing` record.
- Use that resolver in the compact provenance shown by `ApiPricing` and in the desktop and mobile entries of `PricingComparison`.
- Preserve the existing price values, pricing tiers, freshness calculation, source URLs, sorting, calculator behavior, and detailed per-rate sources in the model detail view.

## Design

`src/lib/apiPricing.ts` will expose a narrowly named helper that accepts an API pricing record and returns one representative `PriceValue`, or `null` when no reviewed rate is available. It will inspect the active rates in a deterministic order, beginning with standard tier input and then falling back to the remaining tier and scheduled-period rates. The helper does not create, merge, or alter provenance; it returns the selected existing value.

`ApiPricing` will use that resolver for its compact source display. Its detailed pricing presentation will continue to render a source alongside each rate, because those rates may legitimately have distinct provider provenance.

`PricingComparison` will use the same resolver for the single source/freshness display in both its desktop table and mobile card. Both layouts will therefore link to the same source selected by the model-detail compact view while retaining their current shared `model.apiPricing` rate values.

## Error handling

Models without active reviewed pricing, or pricing records with no sourced rates, retain the current unavailable state. No fallback source is fabricated.

## Tests

Add focused unit coverage for deterministic source selection, fallbacks across tiers and scheduled periods, and the unavailable result. Update component-level assertions only where needed to confirm the pricing-page source derives from the shared resolver.

## Out of scope

- Changing price values, provider sources, model records, or verification dates.
- Replacing detailed per-rate source links on the model page.
- Changing price sorting, cost calculation, pricing tiers, or the pricing data schema.
