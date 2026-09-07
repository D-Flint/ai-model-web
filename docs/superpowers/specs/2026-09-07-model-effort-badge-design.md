# Model effort badge separation

## Goal

Make the model identity easier to scan by separating the reasoning-effort variant from the model name in both the desktop model table and the mobile model list.

## Approved direction

- Keep the base model name as the primary identity label.
- Keep the existing green `open` status beside the model name.
- Render the effort variant on a second line beneath the identity row.
- Use a distinct indigo/blue treatment for the effort badge so it is not confused with open weights.
- Preserve the existing effort values and expanded-detail content; this is a presentation-only change.

## Responsive behavior

The desktop table and mobile card will share the same semantic structure: model name/open status first, effort badge second. The effort row may wrap naturally for long model names and must not widen the table or displace the score/rank controls.

## Validation

Run TypeScript/Astro checks, lint, and the relevant model explorer/browser flow. Run the UI detector against the changed component and stylesheet after the implementation.
