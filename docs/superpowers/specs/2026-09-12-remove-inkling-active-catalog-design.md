# Remove Inkling from the active catalog

## Goal

Remove Inkling from every user-facing active surface because its provider and pricing provenance cannot be verified.

## Scope

Remove the canonical model definition, provider configuration, official-provider specification, role mapping, and active generated catalog entry. Update active-catalog tests and routes/sitemap expectations so Inkling cannot reappear in browse, compare, pricing, recommendation, or direct model pages.

## Preservation

Keep the historical LiveBench record and alias. They remain audit data, not published product data.

## Validation

Verify the active models collection excludes `inkling`, generated routes exclude its detail page, and the relevant catalog tests, type checks, and build pass.

## Non-goals

Do not replace Inkling with another model or alter unrelated historical benchmark data.
