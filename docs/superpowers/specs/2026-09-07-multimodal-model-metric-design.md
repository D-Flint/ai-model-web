# Multimodal Model Metric Design

## Goal

Help non-technical users understand every supported input modality when they expand a model row in the rankings explorer.

## Design

Add a consumer-facing `Modalities` metric to the expanded model details on desktop and mobile. Derive the value from the existing verified capability flags:

- `Text + vision + audio` when both `supportsVision` and `supportsAudio` are true.
- `Text + vision` when only `supportsVision` is true.
- `Text + audio` when only `supportsAudio` is true.
- `Text` when neither flag is true.

The metric remains plain text so it works with keyboard navigation, screen readers, and the existing responsive layout. No new data fields or dependencies are required.

## Scope

- Add one reusable mapping helper in the model explorer component.
- Render the metric in the desktop expanded spec grid and mobile expanded spec list.
- Add unit coverage for all four capability combinations.

## Verification

Run the focused test suite, TypeScript/Astro checks, and linting. The change is complete when the new mapping is covered and existing checks pass.
