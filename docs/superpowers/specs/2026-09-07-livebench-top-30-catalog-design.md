# LiveBench top-30 catalog design

## Objective

Reduce Synapse's visible LiveBench-backed catalog from 77 models to exactly 30 models selected by the existing OpenRouter usage ranking. Preserve the complete verified catalog for history and future review.

## Selection rules

1. Store an authoritative OpenRouter usage snapshot with at least the top 30 ranked entries and retrieval date.
2. Resolve each ranked entry through explicit canonical OpenRouter IDs and aliases. Do not use fuzzy matching for catalog selection.
3. Keep a model only when it has LiveBench evidence and passes existing relevance, access, status, duplicate, and supported-type checks.
4. Deduplicate canonical slugs. Keep the highest OpenRouter rank.
5. Select the first 30 eligible, deduplicated ranked models. If fewer than 30 qualify, fail validation and report the shortfall instead of filling from non-ranked data.
6. Leave `allModels` unchanged. Export capped `models` for Explorer, Finder, rankings, comparisons, detail pages, and sitemap consumers.

## Data flow

```text
OpenRouter top-30 snapshot
        ↓
canonical ID and alias resolution
        ↓
LiveBench and existing eligibility checks
        ↓
deduplicated rank order
        ↓
exact 30-model tracked catalog
```

OpenRouter usage selects catalog membership. LiveBench remains the only source for leaderboard performance. Official provider sources remain the source for metadata and pricing.

## Code changes

- Extend `src/data/openrouterRankings.ts` with verified top-30 entries and a reusable ranked-catalog selector.
- Add explicit OpenRouter identity fields or alias mappings where current canonical records cannot resolve ranked IDs.
- Update `src/lib/catalogEligibility.ts` or a focused catalog-selection module to enforce the exact 30-model cap.
- Keep existing `allModels` export intact and derive `models` from the selector.
- Update tests to cover exact count, rank order, duplicate handling, missing identity, LiveBench filtering, and shortfall failure.
- Update `SESSION_LOG.md` with previous count, selected models, excluded classes, unresolved identities, source date, files, tests, and commit hash.

## Failure handling

- Ambiguous or missing canonical identity: exclude from selection and log for manual review.
- Ranked model without LiveBench data: exclude from visible catalog.
- Fewer than 30 eligible ranked models: throw a clear validation error; do not substitute models.
- Duplicate usage rows: retain highest rank once.

## Non-goals

- No OpenRouter benchmark substitution.
- No synthetic popularity, benchmark, pricing, or capability values.
- No deletion of historical catalog rows.
- No unrelated UI redesign.

## Verification

Run focused unit tests, `npm test`, `npm run check`, `npm run lint`, and `npm run build`. Confirm generated routes and catalog JSON expose 30 tracked models, while `allModels` retains 282 verified models.
