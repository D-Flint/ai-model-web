# Intelligence Ranking Redesign

## Objective

Make `/rankings/intelligence` rank the best current production models with a transparent, use-case-oriented decision score. Keep every other ranking category unchanged. The next ranking redesign, speed, is outside this implementation.

## Eligibility

The ranking engine reads from the complete verified catalog rather than the 30-model LiveBench display subset. A model is eligible only when all of these conditions are true:

- `evaluateModelEligibility(model)` reports an active model.
- The model exposes a production API.
- `facts.availability` is `Production API`.
- `lastVerifiedAt` is no more than 90 days before the supplied ranking date.
- Intelligence, coding, and research scores are present.
- Each required score has supporting evidence for the same metric.

The ranking date is an explicit engine input so tests remain deterministic. Missing or invalid dates make a model ineligible. The engine does not guess values or redistribute missing weights.

## Decision Score

The intelligence decision score uses centrally configured weights:

- Intelligence: 80%
- Coding: 10%
- Research: 10%

The engine calculates the weighted score without modifying catalog records. The displayed decision score is a whole number from 0 to 100. The unrounded value remains available for deterministic sorting.

For equal decision scores, the engine sorts by higher confidence, then newer `lastVerifiedAt`, then model name. This tie-break order applies in both directions; changing direction reverses the decision score only and preserves quality-based tie-breaks.

## Architecture

Add `src/lib/rankings.ts` as the ranking policy boundary. It owns production eligibility, evidence checks, intelligence decision-score calculation, and sorting. Add the intelligence weights and 90-day freshness limit to `src/data/config.ts`.

Add a focused React island for the intelligence ranking list. Astro supplies eligible ranked results rendered highest-first for the initial response and SEO. The island owns only the sort selection and client-side reordering. `RankingList.astro` delegates the intelligence category to this island and preserves its existing behavior for Overall and every other category.

Each result contains the model, displayed score, unrounded score, component values, confidence, and verification date. The UI does not recompute ranking policy.

## User Interface

The intelligence page includes a labeled native select with two options:

- Highest to lowest, selected by default
- Lowest to highest

Each row shows the intelligence decision score, model guidance already present in the ranking card, and a concise explanation that the score combines intelligence, coding, and research. The page notice states the formula, production-only rule, and 90-day freshness rule. Keyboard operation and visible focus behavior use existing accessible control styles.

If no models qualify, the page shows a clear empty state instead of an empty list or runtime error.

## Validation

Unit tests prove:

- Only active production API models verified within 90 days qualify.
- Required metric evidence is enforced.
- The 80/10/10 decision score is correct and bounded.
- Highest-first and lowest-first ordering work.
- Tie-breaks are deterministic.
- Ranking does not mutate source models.

Component or rendered-page tests prove the sort control exists, defaults to highest-first, and changes visible order. Existing tests must continue to pass. Run `npm test`, `npm run check`, `npm run lint`, and `npm run build` before the implementation commit.

## Non-goals

- No changes to Overall or other category algorithms.
- No data refresh or invented model facts.
- No reliability weighting because the catalog has no reliability coverage.
- No URL persistence for sort direction in this first version.
- No visual redesign beyond the ranking control and score explanation.
