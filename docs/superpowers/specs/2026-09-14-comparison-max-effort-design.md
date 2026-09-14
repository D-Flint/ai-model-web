# Comparison Initial Effort Design

## Objective

When the comparison page loads, every selected reasoning model starts at its maximum supported effort level. This applies to direct URLs and shared comparison links. An effort encoded in the URL is not treated as an initial user choice. After the page is loaded, manual effort changes continue to update the comparison state and URL normally.

## Scope and approach

Update the existing selected-column initialization in `ComparisonBuilder`. For reasoning models, derive the initial effort from the existing `getMaxReasoningEffort(model)` domain helper. Keep fixed-effort and non-reasoning models unchanged. Do not alter model selection parsing, link generation, or the manual `changeEffort` flow.

This is preferred over URL normalization because it changes only the initial display/state derivation and avoids changing serialized comparison links. An effect-based overwrite is excluded because it can briefly render a URL-provided effort before correcting it.

## Data flow

`selection` continues to come from the current URL/search state. `selectedItems` maps each selected slug to a model and computes its initial effort. For reasoning models, the maximum supported tier becomes `effort`; `getModelEffortStats` then calculates the displayed metrics for that tier. Once a user selects another tier, `changeEffort` writes the explicit effort into `selection`, and subsequent renders preserve it.

## Edge cases

- Fixed-effort models remain `fixed`.
- Non-reasoning models remain `none`.
- A model with no usable effort tiers falls back to the existing safe fallback behavior through the domain helper/type contract.
- Duplicate models or additional effort comparison entries retain their existing behavior after explicit user interaction.

## Verification

Add a regression test for initial comparison effort resolution with an encoded non-maximum effort, asserting that the loaded comparison uses the model maximum. Preserve coverage for explicit manual effort changes and shared-link selection behavior. Run the focused Vitest suite, then `npm run check`, `npm run lint`, and the full test suite as practical.
