# API pricing redesign — 2026-09-06

This implements `gpt6-astra-pricing-redesign.md` and supersedes earlier workload-preset and monthly-estimate documentation.

## Publication boundary

`src/data/apiPricing.ts` contains reviewed first-party snapshots for 12 models: nine Anthropic models and Gemini 2.5 Pro, Flash and Flash-Lite. They were checked on September 6, 2026 against [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing) and [Google pricing](https://ai.google.dev/gemini-api/docs/pricing). Context bounds use the provider model documentation: [Claude overview](https://platform.claude.com/docs/en/models/overview), [Gemini Pro](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-pro), and the corresponding Flash model pages.

The publication order is official provider, reviewed OpenRouter fallback, unavailable. There are no approved OpenRouter price snapshots in this revision. No model identity or rate is inferred from a nearby model name. Retired models and other unreviewed entries show unavailable. The legacy `CatalogModel.pricing`, `officialProviders.ts` and `model_pricing` records remain ingestion history; the pricing UI and calculator read only `apiPricing`. This change does not independently re-audit existing capability scores or their historical cost-efficiency inputs.

Each rate retains value, USD currency, billing unit, source name, HTTPS URL, source type, retrieval date and nullable effective date. Unknown effective dates remain null. Approved first-party hosts are checked against the provider registry. Updating that registry requires source review. Structural validation does not verify external truth.

## Pricing and workload rules

- Standard paid text API scope is explicit. Cached reads, uncached input, cache writes and output are separate categories.
- Context tiers use inclusive bounds. Prompt size includes uncached input, cached reads and cache writes. The applicable tier applies to the entire request, including its output rate.
- The calculator starts with empty inputs and no selected model unless a model is supplied in the URL. Input and output tokens are per request; requests multiply their costs. Optional empty categories mean unused, as stated beside the inputs.
- Thinking tokens are included only when the user includes the provider's billed count in output. No effort-level token guesses or score-derived success rates remain in the pricing flows.
- Cache storage is entered as total token-hours across the workload; it is not multiplied by requests again. Anthropic searches and supported cache writes are per request.
- Zero is distinct from missing. Negative, fractional, nonfinite and unsafe counts are rejected. A required missing rate or unsupported tier prevents an estimate.
- Monthly estimates are removed entirely. Users can enter their own total request count for any period, but the result is labeled workload cost, based on their inputs.

## Comparison and freshness

The pricing page sorts current single-tier input, output or explicitly blended rates (70% input / 30% output), or context size. Tiered, missing and stale rates are excluded from price ordering and follow comparable entries. Finder caps are expressed per million input tokens; the free filter also requires zero output price. There is no overall cheapest-price verdict.

Rates older than the configurable seven-day threshold need verification. Future retrieval/effective dates also block estimates. Builds never refresh source dates. Browser freshness labels refresh on page load and every minute; retrieval dates remain visible in static HTML. Rebuild and deploy after any reviewed data update.

Benchmark task costs remain null. Publishing one requires a public evaluation source, per-task unit, named benchmark, documented task scope and a methodology URL. A benchmark result must not be relabeled as ordinary usage.

## Storage and verification

The append-only `api_pricing_tiers` table stores one row per model/tier/snapshot, including field-level rate provenance in JSONB. Content hashes deduplicate identical imports; effective dates remain inside each rate. The migration only creates this table; older score-schema drift was deliberately excluded.

```sh
npm test
npm run check
npm run lint
npm run build
python tests/pricing_browser.py
npm run data:pricing:persist -- --dry-run
# With a configured PostgreSQL instance:
npm run db:migrate
npm run data:pricing:persist
```

No database connection is required to serve reviewed snapshots. Live database migration/persistence is not exercised without a configured database. Pair pages embed their displayed models and fetch `/catalog.json` for additional selections, avoiding full-catalog duplication in every static pair page.

Unsupported calculator cases include batch/flex/priority tiers, fast mode, residency premiums, discounts, account-wide free allowances, media conversion, separate reasoning rates, and tools other than the explicitly sourced extras. Notes link users to full provider billing details. New billing categories need reviewed rules and formula tests before exposure.
