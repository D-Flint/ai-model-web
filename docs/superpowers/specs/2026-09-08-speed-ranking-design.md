# Speed Ranking Redesign

## Objective

Make `/rankings/speed` rank current production models by their fastest verified generation throughput. Match the Intelligence ranking's accessible highest-first and lowest-first sorting. Keep Intelligence, Overall, and every other ranking unchanged.

## Eligibility

The speed ranking reads the complete verified catalog. A model qualifies only when all of these conditions are true:

- `evaluateModelEligibility(model)` reports an active model.
- The model exposes a production API.
- `facts.availability` is `Production API`.
- `lastVerifiedAt` is no more than 90 days before the supplied ranking date.
- The model has a positive speed range or positive single speed value.
- The selected speed value resolves to an existing source record.
- The speed measurement or its source was retrieved no more than 90 days before the ranking date.

The ranking date remains an explicit engine input so tests are deterministic. Missing, future-dated, stale, non-positive, or untraceable measurements make a model ineligible.

## Ranking Value

When `facts.speedTokensPerSecRange` exists, the engine uses its `max` value. When no range exists, the engine uses the single `facts.speedTokensPerSec` value. The engine never averages a range for this ranking and never invents missing throughput.

The displayed value remains the selected measured throughput in `tokens/sec`; it is not converted into a 0–100 score. A ranged measurement also displays its full minimum-to-maximum range.

For equal selected throughput, the engine sorts by higher confidence, then newer speed measurement verification, then model name. These quality-based tie-breaks remain stable in both sort directions.

## Architecture

Extend `src/lib/rankings.ts` with speed measurement resolution, eligibility, and ranking functions. Reuse the existing 90-day ranking configuration.

Add `src/components/SpeedRanking.tsx` as a focused React island. It receives a minimal view model, renders highest-first during server rendering, and owns only client-side sort direction. It reuses existing ranking CSS and interaction conventions without coupling speed display rules to the Intelligence component.

`RankingList.astro` delegates the Speed category to the new island. Its existing branches for Intelligence, Overall, and other categories remain unchanged. Model detail, comparison, and sitemap publication sets include eligible Speed models so every rendered link resolves.

## User Interface

The Speed page includes a labeled native select with two options:

- Highest to lowest, selected by default
- Lowest to highest

Each row shows the selected peak throughput, the full measured range when present, existing model guidance, the primary tradeoff, and a comparison link. The page notice explains that ranges rank by their highest verified value and single measurements rank by their only value.

If no models qualify, the page displays a clear empty state instead of an empty list or runtime error.

## Validation

Unit tests prove:

- Current production and 90-day freshness gates.
- Range maximum selection.
- Single verified value fallback.
- Source provenance and speed-measurement freshness enforcement.
- Highest-first and lowest-first sorting.
- Deterministic tie-breaks.
- Source models remain unchanged.

Rendered-component tests prove the control exists and defaults highest-first. A browser test proves both sort directions, peak-value ordering, comparison handoff, and absence of console errors. Run `npm test`, `npm run check`, focused lint and formatting checks, and `npm run build` before committing.

## Non-goals

- No change to Intelligence, Overall, or another category algorithm.
- No data refresh or invented throughput.
- No confidence-adjusted speed score.
- No midpoint or average-based ranking.
- No URL persistence for sort direction.
- No broader ranking-component refactor.
