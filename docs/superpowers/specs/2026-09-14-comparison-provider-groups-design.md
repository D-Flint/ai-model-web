# Comparison Provider Groups Design

## Objective

Group models in the comparison page's add-model dropdown by company, with provider groups and model names ordered alphabetically. Preserve the native select behavior and all existing selection values.

## Scope and approach

Update the existing native `<select>` in `ComparisonBuilder`. Filter out selected models, group the remaining models by their existing `provider` field, sort provider names alphabetically, and sort each provider's models alphabetically by display name. Render each provider as a native `<optgroup>` whose options keep the current model slug as their value.

Keep the placeholder, four-item limit, selected-model filtering, effort comparison groups, and manual effort behavior unchanged. A custom popover is out of scope because it would add interaction and accessibility complexity without being needed for grouping.

## Data flow

The current `models` catalog remains the source of truth. A derived grouped collection is created during render after selected models are excluded. Selecting an option still sends its slug through the existing `update` function, so comparison state and share links do not change.

## Verification

Verify the provider groups and alphabetical ordering through a focused unit test for the grouping helper or the existing browser flow, then run `npm run check`, scoped lint/format checks, and the full test suite as practical. Preserve and report unrelated existing failures.
