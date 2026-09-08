# Remaining Ranking Sorting Redesign

## Objective

Apply the verified, reversible sorting pattern to Best value, Lowest cost, Coding, Agents, Daily use, Research, Writing, and Vision. Leave Overall, Intelligence, and Speed unchanged.

## Shared Eligibility

All affected rankings read the complete verified catalog. A model qualifies only when all of these conditions are true:

- `evaluateModelEligibility(model)` reports an active model.
- The model exposes a production API.
- `facts.availability` is `Production API`.
- `lastVerifiedAt` is no more than 90 days before the explicit ranking date.

Score-based categories also require a non-null selected score and matching evidence for that metric. Vision additionally requires `facts.vision`. Missing, stale, future-dated, or untraceable values make a model ineligible. Rankings never invent or redistribute values.

## Ranking Rules

The affected score categories rank these stored 0–100 metrics directly:

- Best value: `costEfficiency`
- Coding: `coding`
- Agents: `agentic`
- Daily use: `dailyUse`
- Research: `research`
- Writing: `writing`
- Vision: `vision`

Their default direction is highest to lowest. Equal scores sort by higher confidence, newer model verification, then model name. Reversing direction changes only the primary score order and preserves quality-based tie-breaks.

Lowest cost uses a current, verified, single-tier standard input API rate. Tiered, missing, or stale prices are excluded because they cannot be compared fairly. Its default direction is lowest to highest. Equal prices sort by higher cost-efficiency score, newer price retrieval date, then model name.

Displayed rank numbers always represent the default best-first ranking. Reversing visible order does not relabel the worst model as rank 1.

## Architecture

Extend `src/lib/rankings.ts` with a supported score-category type, shared eligibility checks, score ranking, and lowest-cost ranking. The engine returns ranked results without modifying source models.

Add one reusable React island for the affected rankings. Astro passes a minimal category-aware view model rendered in the default order for SEO. The island owns only client-side direction state and sorting. It displays either a metric score out of 100 or an input price per million tokens.

`RankingList.astro` delegates affected categories to the shared island. Intelligence and Speed retain their specialized islands. Overall retains its existing static behavior. Model detail, comparison, and sitemap publication sets include all newly eligible models so every rendered link resolves.

## User Interface

Each score category includes a labeled native select:

- Highest to lowest, selected by default
- Lowest to highest

Lowest cost uses price-specific labels:

- Lowest to highest, selected by default
- Highest to lowest

Rows preserve existing model guidance, primary tradeoff, comparison link, and score styling. Notices state the production-only and 90-day rules and explain the metric being sorted. An empty state replaces an empty list when no model qualifies.

## Validation

Unit tests cover:

- Production and 90-day eligibility.
- Matching evidence enforcement.
- Vision capability enforcement.
- Every category-to-metric mapping.
- Both sort directions and correct defaults.
- Score and price tie-breaks.
- Current single-tier price enforcement.
- Stable rank numbers and source non-mutation.

Rendered-component tests verify both control variants and default order. Browser tests visit every affected route, verify default and reverse ordering, confirm links work, and reject console errors. Run `npm test`, `npm run check`, focused lint and formatting checks, and `npm run build` before committing.

## Non-goals

- No Overall, Intelligence, or Speed behavior change.
- No new blended decision formulas.
- No data refresh or invented values.
- No tiered-price comparison.
- No reliability ranking because the catalog lacks reliability evidence.
- No URL persistence for sort direction.
- No broader ranking visual redesign.
