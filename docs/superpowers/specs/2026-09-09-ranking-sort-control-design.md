# Ranking sort control design

## Goal

Improve only the ranking sort control. Keep the existing choices and sorting behavior: “Highest to lowest” and “Lowest to highest”.

## Chosen design

Replace the native select and separate invert button with one two-option segmented control. Each segment uses the complete existing label. The selected segment has the existing green accent and high-contrast white text. The inactive segment stays on the surface color with a muted border and text.

The control remains associated with the visible “Sort ranking” label. Each segment is a native button with an explicit accessible name and pressed state. The component supports keyboard focus, activation with Enter or Space, and visible focus indication. On small screens, the segmented control fills available width without truncating either label.

## Scope

- Update `RankingSortControls.tsx` markup and accessible state.
- Update only ranking sort-control CSS in `global.css`.
- Preserve current ordering, default direction, ranking count, and price-ranking ordering semantics.
- Update affected unit and browser assertions.

## Non-goals

- No changes to ranking data, scoring, filtering, cards, or page layout.
- No dependency changes.

## Verification

- Unit tests confirm both labels, direction changes, and price ordering remain correct.
- Browser tests confirm keyboard-accessible controls and both ranking pages work.
- Run TypeScript/Astro checks, lint, and relevant tests.
