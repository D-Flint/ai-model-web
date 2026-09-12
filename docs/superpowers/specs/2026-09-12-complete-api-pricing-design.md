# Complete API pricing coverage

## Goal

Show API rates for every tracked model whose catalog already contains complete input and output rates plus a source URL. Do not create or estimate rates.

## Data flow

The catalog supplies legacy `pricing` values and a linked source. The pricing normalization layer will turn eligible records into `apiPricing`, which is the only pricing shape consumed by the pricing page.

- A source on the provider's approved host remains `provider_doc`.
- A source on `openrouter.ai` becomes `openrouter`.
- The existing source URL, name, retrieval date, and pricing values remain unchanged.
- A model without complete input/output rates or without a valid source remains unavailable.

## Scope

Apply the conversion to all models rendered on the API pricing page, rather than maintaining a model-by-model allowlist. This makes newly tracked, sourced models appear automatically.

## Safety and validation

The existing Zod pricing schema remains the authority for source-host validation. Tests will assert that every eligible tracked model produces an API-pricing record, and that source type and URL match the catalog provenance.

## Non-goals

No network refresh, price estimation, currency conversion, or change to the seven-day freshness policy is included.
