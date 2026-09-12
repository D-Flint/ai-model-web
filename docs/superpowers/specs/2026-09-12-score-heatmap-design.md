# Score heatmap design

## Goal

Make strong model scores easier to scan in the model explorer table without
changing any model data, sorting, filtering, or row interactions.

## Approach

Replace the current per-column top-five highlight with a score threshold
heatmap for benchmark score cells. A score below 75 has the existing neutral
cell treatment. Scores from 75 through 100 receive a green background whose
opacity increases linearly with the score; the score text switches to the
existing dark green emphasis color for contrast.

The heatmap applies only to the score columns shown in the reference:
reasoning, coding, agentic coding, mathematics, data analysis, language, and
instruction following. Overall, cost, and speed retain their existing styling.
The currently sorted column treatment retains precedence so sort state remains
clear.

## Implementation

1. Add one small helper in `ModelExplorer.tsx` that returns the score heatmap
   class only for numeric values at or above 75.
2. Use that helper in each applicable desktop score cell, replacing top-five
   class generation.
3. Add CSS custom properties/classes for a restrained green scale and visible
   text contrast. Keep selection and sorted-column states intact.
4. Add a focused unit test for threshold behavior if the component's existing
   test structure supports it; otherwise cover it through the project type and
   lint checks.

## Accessibility and edge cases

Color is supplementary: each cell keeps its numerical value. Null scores stay
as an em dash with no highlight. The green background has sufficient contrast
with the emphasized text, and the change adds no animation or interactive
behavior.

## Verification

Run `npm run check` and `npm run lint`, then visually inspect the model table
at desktop width to confirm 75.0 is the first shaded value and increasingly
higher scores have stronger shading.
