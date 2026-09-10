# Mobile Comparison and Pricing Card Redesign

## Objective

Replace the unusable mobile table layouts on the model comparison and API pricing pages with clear vertical cards. Preserve the current desktop tables, data, sorting, scoring, provenance, and comparison behavior.

## Approved Direction

Mobile uses cards with no horizontal scrolling. The comparison page uses metric-centered cards so users can compare the same value across every selected model without moving between separate model summaries. The API pricing page uses one card per model because each result is a complete pricing record.

The responsive boundary follows the existing mobile layout at `768px`. At wider viewports, the current tables remain visually and functionally unchanged.

## Model Comparison Page

### Compared-model controls

The existing selected-model chips remain above the results. Because reasoning-effort controls currently live in the desktop table header, the mobile view adds a compact “Compared models” section. Each selected model row contains its provider mark, model name, selected effort, and the existing effort selector or fixed-effort label. The existing “Compare effort” action remains available when another selection can be added.

### Metric cards

The mobile results follow the same information order as the desktop table:

1. Core focus pillars
2. Secondary capabilities and benchmarks
3. Technical and reasoning specifications

Each metric is an individual card with the metric name as its heading. The card lists all selected models vertically. Each model row contains a compact identity label and its value. The best value uses the existing accent surface and a text label such as “Highest,” “Fastest,” or “Best,” so the result never depends on color alone.

Unavailable evidence remains explicit as “Not measured” with its current explanation. Pricing, score, and model-detail links remain available. Long values wrap within their row instead of widening the page.

The desktop comparison table remains mounted for desktop viewports and hidden on mobile. The mobile card view is hidden on desktop. Both views derive from the same selected items, effort state, metric definitions, winner rules, pricing helpers, and technical facts so their values cannot diverge.

## API Pricing Page

Search and sort controls remain unchanged and stack naturally on mobile. The desktop pricing table remains unchanged above `768px`.

At mobile widths, each sorted model becomes a pricing card:

- Header: model link and provider
- Primary rate grid: input, cached input, and output per 1M tokens
- Conditional rate: blended price when blended sorting is active
- Context: context-window value with a clear label
- Details: pricing scope or “Awaiting verification,” source freshness, and the existing model-pricing details link

Tiered prices continue to display “Varies by context.” Unavailable prices keep their existing wording. Cards render in the exact order produced by the current search and sort logic. The existing no-results notice and workload calculator action remain unchanged.

## Responsive and Visual Rules

- Use a single vertical column from `320px` through `768px`.
- Do not add horizontal scroll, swipe gestures, tabs, carousels, or hidden core data.
- Use existing color, spacing, border, radius, typography, logo, focus, light-theme, and dark-theme tokens.
- Keep numerical values aligned with tabular numerals and give primary values stronger weight than metadata.
- Keep interactive targets at least `44px` high on coarse pointers.
- Preserve visible keyboard focus and semantic headings, lists, links, labels, and form controls.
- Allow model names, provider names, notes, and source text to wrap without clipping.
- Respect reduced-motion preferences; this change requires no new animation.

## Component Boundaries

`ComparisonBuilder.tsx` owns both comparison presentations because it already owns selection, effort, metric, and winner state. Small local render helpers may remove repeated card-row markup, but no generic table/card abstraction will hide comparison behavior.

`PricingComparison.tsx` owns both pricing presentations because it already owns search, sorting, tier handling, and freshness display. The desktop row and mobile card use the same sorted collection and pricing helpers.

`global.css` owns breakpoint visibility and card presentation. No new dependency, route, data type, score, price, or API is required.

## Data and Error Behavior

This redesign changes presentation only. It does not alter model data, scoring, pricing calculations, source provenance, freshness rules, missing-data rules, URLs, or selection limits. Empty search results keep the existing notice. Unsupported pricing and evidence remain plainly labelled rather than estimated.

## Validation

- Verify the comparison page with two and four selected models at `320px`, `390px`, and `768px`.
- Verify reasoning-effort changes update every affected mobile card.
- Verify winner labels and values match the desktop table.
- Verify pricing search and every sort option preserve order in mobile cards.
- Verify tiered, unavailable, stale, and verified pricing states.
- Verify no page-level horizontal overflow or clipped card content.
- Verify desktop tables remain visible and unchanged at `1024px` and larger.
- Verify keyboard focus, accessible names, light mode, dark mode, and reduced motion.
- Run `npm test`, `npm run check`, `npm run lint`, `npm run build`, the focused browser checks, the Impeccable detector, and `git diff --check`.
