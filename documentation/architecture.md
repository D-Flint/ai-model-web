# Architecture

## Runtime model

Synapse is an Astro application with selective React islands and the Cloudflare adapter.

| Layer | Responsibility | Primary location |
| --- | --- | --- |
| Astro pages | Routes, SEO content, metadata, server-rendered page structure | `src/pages/` |
| Shared shell | HTML document structure, theme and site metadata | `src/layouts/RootLayout.astro` |
| Astro components | Small server-rendered presentation pieces | `src/components/*.astro` |
| React islands | Client interaction that benefits from state or event handling | `src/components/*.tsx` |
| Domain data | Catalog fixtures, source configuration, ranking configuration, and reviewed snapshots | `src/data/` |
| Domain logic | Validation, scoring, rankings, comparisons, pricing, and recommendations | `src/lib/` |
| Data pipeline | Source adapters, normalization, aliases, confidence, and persistence orchestration | `src/pipeline/` and `scripts/` |
| Optional persistence | Drizzle schema, migrations, and PostgreSQL client | `src/db/` |
| Static/public assets | Logos, styles, crawler policy, and generated comparison records | `public/` |

Astro owns the page lifecycle. React is not used as a full application shell; it is mounted only where a user interaction needs client-side state.

## User-facing routes

| Route | Purpose | Rendering notes |
| --- | --- | --- |
| `/` | Product entry point and discovery | Static page with links into the decision journey |
| `/models` | Browse the eligible catalog | Static page plus interactive explorer island |
| `/models/[slug]` | Explain one model and its evidence | Static model detail page |
| `/compare` | Choose models to compare | Static comparison builder |
| `/compare/[pair]` | Render a canonical comparison pair | On-demand Worker route; pair data is loaded from prepared public assets |
| `/rankings` | Ranking directory | Static index |
| `/rankings/[category]` | Intelligence, speed, value, cost, coding, agents, daily use, research, writing, or vision ranking | Static ranking page with interactive sort controls where needed |
| `/find` | Explainable model recommendation flow | Static page with the `ModelFinder` React island |
| `/cost` | Token-workload cost estimation | Static page with the cost calculator island |
| `/pricing` | Reviewed API pricing comparison | Static page with pricing interaction |
| `/methodology` | Explain sources, scoring, confidence, and limitations | Static methodology page |
| `/catalog.json` | Machine-readable catalog endpoint | Generated from the active catalog |
| `/sitemap.xml` | Search-engine sitemap | Generated route list |

## Cloudflare rendering boundary

`astro.config.mjs` uses the Cloudflare adapter and keeps the application output compatible with static assets plus Worker-rendered routes. `wrangler.jsonc` binds the static asset directory as `ASSETS` and sends `/compare/*` requests through the Worker first.

The comparison route is deliberately on demand. The build prepares one JSON record per model in `public/_comparison-data/` and a generated slug list in `src/data/generated/comparisonSlugs.json`. The Worker uses those assets to resolve and render a requested pair without querying PostgreSQL at request time.

The `prebuild` npm lifecycle script runs `scripts/prepare-comparisons.ts` before every `astro build`. The generated files remain ignored because they are reproducible build artifacts, not independent source data.

## Data flow

```text
Source adapters / reviewed fixtures
        ↓
Normalization, aliases, validation, and confidence
        ↓
Active catalog and pricing boundaries
        ↓
Scoring, rankings, comparisons, and recommendations
        ↓
Astro pages + React islands + prepared Cloudflare assets
```

The normal browsing path reads prepared data from the repository. Database persistence is optional and is used by ingestion and archival workflows when `DATABASE_URL` is configured.

## Ownership rules

- Put a new route in `src/pages/`.
- Put shared shells and metadata in `src/layouts/`.
- Put domain-focused UI in `src/components/`; use React only when interaction requires it.
- Put raw or reviewed data and configuration in `src/data/`.
- Put reusable decision logic in `src/lib/` rather than inside page components.
- Put source adapters and refresh orchestration in `src/pipeline/` and `scripts/`.
- Keep database schema and migrations under `src/db/`.
- Keep generated build outputs out of source control.
