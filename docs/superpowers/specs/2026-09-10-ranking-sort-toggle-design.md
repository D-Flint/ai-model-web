# Ranking sort toggle design

## Goal

Replace the two-option ranking sort control with one button that toggles ranking order between highest to lowest and lowest to highest.

## Scope

The shared `RankingSortControls` component will change, so the behavior applies to every ranking view that uses it: intelligence, speed, score metrics, and lowest-cost rankings. Existing sort functions, default directions, tie-breaking rules, and ranking data remain unchanged.

## Interaction and accessibility

The control will use one native button. It will display the active direction and corresponding sort icon. Activating it reverses the `RankingDirection` value and reorders the rendered list. The button will expose its current state and next action through an accessible label, remain keyboard-operable, and keep the existing visible focus treatment.

## Responsive layout

On desktop, the control keeps the `Sort ranking` label beside the toggle. On mobile, CSS hides that separate label so the self-labelled button is the complete control. The verified-model count remains unchanged.

## Implementation boundaries

- `src/components/RankingSortControls.tsx`: render one toggle button and invert direction on activation.
- `src/styles/global.css`: replace segmented-control styles with responsive single-button styles while preserving touch target, focus, and reduced-motion behavior.
- Tests: add focused coverage that validates each state and click inversion without changing existing ranking sort tests.

## Verification

Run type, lint, and relevant ranking tests. Verify desktop and mobile layout plus keyboard activation in the browser checks when available.
