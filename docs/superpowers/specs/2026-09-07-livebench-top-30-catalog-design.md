# LiveBench top-30 catalog design

## Objective

Reduce Synapse's visible LiveBench-backed catalog from 77 models to exactly 30 models selected from the current LiveBench dataset. Preserve the complete verified catalog for history and future review.

## Selection rules

1. Parse the current, validated LiveBench dataset and resolve each row through explicit canonical LiveBench aliases.
2. Keep the newest LiveBench row for each canonical model identity.
3. Keep a model only when it has LiveBench evidence and passes existing relevance, access, status, duplicate, and supported-type checks.
4. Sort eligible canonical models by LiveBench global average, descending. Break ties by newest evaluation date, then slug.
5. Select the first 30 eligible, deduplicated models. If fewer than 30 qualify, fail validation instead of filling from another source.
6. Leave `allModels` unchanged. Export capped `models` for Explorer, Finder, rankings, comparisons, detail pages, and sitemap consumers.

## Data flow

```text
LiveBench dataset
        ↓
canonical ID and alias resolution
        ↓
latest row and existing eligibility checks
        ↓
global-average rank order
        ↓
exact 30-model tracked catalog
```

LiveBench selects catalog membership and remains the only source for leaderboard performance. Official provider sources remain the source for metadata and pricing. OpenRouter usage remains separate discovery metadata.

## Code changes

- Add a focused LiveBench catalog-selection module with explicit limit and ranking logic.
- Keep existing `allModels` export intact and derive `models` from the selector.
- Update tests to cover exact count, score order, newest-row selection, duplicate handling, missing identity, LiveBench filtering, and shortfall failure.
- Update `SESSION_LOG.md` with previous count, selected models, excluded classes, unresolved identities, source date, files, tests, and commit hash.

## Failure handling

- Ambiguous or missing canonical identity: exclude from selection and log for manual review.
- Ranked model without LiveBench data: exclude from visible catalog.
- Fewer than 30 eligible LiveBench models: throw a clear validation error; do not substitute models.
- Duplicate LiveBench rows: retain newest evaluation row once.

## Non-goals

- No OpenRouter benchmark substitution.
- No synthetic popularity, benchmark, pricing, or capability values.
- No deletion of historical catalog rows.
- No unrelated UI redesign.

## Verification

Run focused unit tests, `npm test`, `npm run check`, `npm run lint`, and `npm run build`. Confirm generated routes and catalog JSON expose 30 tracked models, while `allModels` retains 282 verified models.
