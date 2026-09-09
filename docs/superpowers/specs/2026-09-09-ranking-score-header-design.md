# Ranking Score Header Design

## Objective

Place the ranking score in each card's upper-right corner, aligned with the model identity.

## Scope

- Apply the layout to intelligence, speed, metric, and overall ranking cards.
- Preserve existing score links, labels, accessible names, data, ordering, and responsive behavior.
- Keep rank, provider mark, and model name grouped at the upper left.

## Layout

Each card uses a header row with the identity group on the left and score link on the right. The descriptive copy, components, tradeoff, and comparison link remain below it. The score label stays directly beneath its value. On narrow viewports, the header remains a two-sided row; the identity group may shrink and wrap its model name without displacing the score.

## Validation

Run formatting, Astro and TypeScript checks, unit tests, and production build. Add or update focused browser assertions only if existing ranking checks need new layout coverage.
