# Replace Dynamic Model Ingestion with a Reviewed Static Catalog

## Summary

Convert the application to a fully static, manually maintained catalog containing exactly 50 OpenRouter usage-ranked models. The runtime will read one validated JSON registry and will never fetch provider, benchmark, pricing, or model metadata.

The existing values may be used as migration seeds, but this first delivery will establish the architecture only; factual corrections remain a later data-audit pass.

## Implementation Changes

- Add one canonical `src/data/modelCatalog.json` containing:
  - Model identity, description, roles, tags, and aliases.
  - Context window, output limits, modalities, tools, availability, effort levels, and release date.
  - Current API pricing.
  - Benchmark values and derived scores.
  - OpenRouter usage rank, token volume, source URL, retrieval date, and verification date.
  - Field-group provenance for facts, pricing, benchmarks, effort, modalities, release data, and usage ranking.
- Add strict validation requiring:
  - Exactly 50 unique models.
  - Unique OpenRouter ranks from 1–50.
  - Valid 0–100 scores and benchmark ranges.
  - Non-null provenance for every published field group.
  - Valid pricing units, dates, URLs, and model identifiers.
- Simplify `src/data/models.ts` so it only loads and validates the static registry. Invalid or incomplete data should fail clearly; no fictional fallback should be used in production.
- Remove external ingestion adapters and refresh scripts, including OpenRouter, LMSYS, SWE-bench, LiveBench, and BFCL fetching.
- Remove Drizzle/PostgreSQL schemas, migrations, persistence scripts, database dependencies, and database environment configuration.
- Preserve the static `/catalog.json` endpoint and existing Astro/React consumer flows.
- Update documentation and npm scripts to describe manual JSON editing, provenance requirements, and the 50-model publication rule.

## Tests and Acceptance Criteria

- Schema tests reject duplicate ranks, missing provenance, invalid dates, malformed URLs, invalid scores, and catalogs with fewer or more than 50 models.
- Existing browse, compare, find, pricing, cost, ranking, and catalog endpoint tests continue to pass using the static registry.
- Tests confirm there are no runtime external fetches or database dependencies.
- `npm run check`, `npm run lint`, and `npm test` pass.
- Build output contains only static catalog data and same-origin catalog requests.
- The migration must not invent the missing ranked entries: the current repository contains only 20 OpenRouter ranking records, so the exact top-50 registry requires the remaining 30 reviewed records to be supplied before publication.

## Assumptions

- The static registry becomes the sole publication authority.
- OpenRouter ranking metadata is manually maintained alongside model records.
- Provider documentation and benchmark pages remain citations only; they are not fetched automatically.
- Historical snapshots are out of scope for the first implementation.
- The initial architecture migration does not certify existing values as accurate; a separate audit pass will correct and verify them.
