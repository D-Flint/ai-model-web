# Mobile Reasoning Effort Selector Refinement

## Objective

Make reasoning-effort selection compact, clear, and touch-friendly inside mobile comparison model cards. Preserve current behavior, effort options, score updates, comparison URLs, and desktop presentation.

## Approved Design

Each reasoning model keeps one compact control row beneath its identity. The “Reasoning effort” label sits on the left. A rounded native select sits on the right with the selected effort and an icon-library chevron. The control uses the existing surface, border, text, accent, focus, light-theme, and dark-theme tokens.

The select remains at least `44px` high, uses a readable `16px` value, and stays wide enough for labels such as “High effort.” It must not span the full model-card width or create the large empty field shown in the current mobile layout.

“Compare another effort” remains below the selector as a quieter secondary action. It uses the existing Plus icon, a compact bordered treatment, and a `44px` touch target. Fixed and standard models keep their current non-interactive status text.

## Scope

- Change only the mobile compared-model settings inside `ComparisonBuilder.tsx` and their styles in `global.css`.
- Keep the native select for accessibility and low JavaScript cost.
- Keep every current effort option and `changeEffort` behavior.
- Keep desktop comparison controls unchanged.
- Add no dependency, data change, scoring change, or new interaction state.

## Responsive and Accessibility Rules

- Use the inline layout through the existing `768px` mobile breakpoint.
- At very narrow widths, allow the row to wrap without overflow; the selector remains usable at `320px`.
- Preserve the visible focus ring, keyboard operation, accessible label, and native option menu.
- Use Lucide for the chevron; do not use a Unicode glyph.
- Do not rely on color to communicate selection or interactivity.

## Validation

- Verify low, medium, high, and other available effort labels fit without clipping.
- Verify selecting an effort updates metrics and the comparison URL.
- Verify the secondary compare-effort action still adds another effort when allowed.
- Verify no horizontal overflow at `320px`, `390px`, and `768px`.
- Verify desktop comparison table and selector remain unchanged at `1024px` and larger.
- Run formatting, Astro and TypeScript checks, lint, unit tests, production build, focused browser checks, the Impeccable detector, and `git diff --check`.
