# Ranking identity layout

## Goal

Keep each ranking card easy to scan on narrow screens by placing its ranking number and provider logo beside its model name.

## Scope

- Apply the same identity layout to intelligence, speed, and metric rankings.
- Reuse the existing `ProviderLogo` component and verified local provider-logo assets.
- Keep the score link at the right edge and all existing model, comparison, and score links unchanged.

## Design

Each ranking card has an identity row inside the content column:

`rank  provider logo  model name`

The ranking number remains text and the logo remains decorative. The model-name link stays the accessible primary link. On small screens, CSS no longer hides the logo; the compact identity row keeps rank, logo, and title together while score remains a separate right column.

## Architecture and data

No ranking data, scoring, source, or provider-logo mapping changes. The three existing React ranking components move their rank and `ProviderLogo` markup into a shared card-header structure. Ranking CSS owns desktop and mobile alignment.

## Failure handling

`ProviderLogo` retains its existing generic-logo fallback when a provider has no known mark. Layout remains usable if an image fails to load because rank and model name are still visible.

## Verification

- Run TypeScript/Astro checks, lint, tests, build, and whitespace validation.
- Verify narrow ranking cards show rank, logo, and model name together.
- Verify ranking, model, comparison, and score links retain their destinations and accessible names.
