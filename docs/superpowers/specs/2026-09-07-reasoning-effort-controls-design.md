# Reasoning effort controls design

## Problem

Comparison headers hide effort selectors for models whose supported effort list includes both `none` and selectable reasoning levels. The UI incorrectly treats those models as standard-only.

## Design

Use one consistent predicate in UI rendering: a model supports reasoning controls when its `reasoningEffort` list contains at least one value other than `none`.

Update the existing predicates in:

- `src/components/ComparisonBuilder.tsx`
- `src/components/ModelEffortExplorer.tsx`
- `src/pages/models/[slug].astro`

Keep `none` as a supported standard mode, but exclude it from the selector options. Keep scoring, routing, data, and URL formats unchanged.

## Verification

Run focused unit checks and browser verification. The comparison containing Claude Fable 5.1, Kimi K3, DeepSeek V4-Pro-0813, and Gemini 3 Deep Think must render one effort selector per selectable model.
