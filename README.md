# Astra: AI Model Guide

A content-first Astro application for discovering, comparing, understanding, and choosing AI models. The application loads catalog snapshots with an explicitly fictional fallback. API pricing is published separately from reviewed provider sources; unreviewed rates are unavailable.

## Run locally

Use Node.js 24 or newer and npm 9.6.5 or newer (Node.js 22.13+ is also supported by the app and lint tools).

```sh
npm install
npm run dev
```

Open the local address printed by Astro (normally http://localhost:4321). No database, API key, or external account is needed for the local app.

## Implemented experience

- Homepage with a working comparison, search, task shortcuts, model highlights, and API pricing.
- Model explorer with search, provider and numerical filters, capability filters, sorting, and a four-model comparison tray.
- Model detail pages with numerical scores, expandable evidence, pricing, facts, alternatives, and tradeoffs.
- Two-to-four-model comparisons with shareable query URLs, static pair pages, grouped metrics, ties, and conditional verdicts.
- Overall and eight task-specific rankings with plain-language explanations.
- Three-question deterministic finder, budget filtering, explained matches, and a free-budget empty state.
- Source-backed API pricing comparison and an empty-by-default workload calculator with supported cache and tool charges.
- Responsive light/dark layouts, keyboard focus, mobile navigation, reduced-motion support, and semantic tables.
- Validated sample inputs, configurable scoring, source references, snapshot imports, optional PostgreSQL persistence, and generated Drizzle migrations.

## Validation

```sh
npm test             # Domain logic and data integrity tests
npm run check        # Astro and strict TypeScript diagnostics
npm run lint         # TypeScript/Astro ESLint rules and Prettier checks
npm run build        # Static production output
npm run preview      # Serve the production build
npm run test:pricing:browser # Pricing, browse, compare, find and mobile flows
```

The browser suite requires Python, `pip install playwright`, and `python -m playwright install chromium`. It expects the local server to be running. Screenshots go to the ignored `artifacts/` directory. Set `ASTRA_TEST_URL` to test another local server address.

`npm run format` formats source files. Pair selectors share a single catalog file. Static model and ranking content works without client JavaScript; interactive controls require JavaScript.

## Cloudflare Workers

The production build targets Cloudflare Workers through `@astrojs/cloudflare`. Content pages and model pages are prerendered. `/compare/[pair]` stays on-demand, so arbitrary pairs do not expand the build. Deploy with `npm run deploy`.

Set runtime secrets with Wrangler, for example `npx wrangler secret put DATABASE_URL`. Local catalog rendering works without `DATABASE_URL`; database access uses serverless-compatible PostgreSQL connections when configured.

## Architecture and data policy

`src/pages` owns Astro content and routes. `src/components` contains static components and React islands. `src/data/config.ts` holds scoring weights and recommendation parameters. `src/lib` contains validation and deterministic calculations. `src/db` holds the optional database connection, schema, and migrations.

The fixture catalog in `src/data/models.ts` uses synthetic raw inputs with declared scales. Scores are derived from those inputs, and overall quality uses the brief's provisional weights. Every fictional model has zero evidence confidence and no provider verification date. Capability confidence is not a statistical probability.

Import a JSON array matching `CatalogModel`:

```sh
npm run data:import -- path/to/catalog.json
```

The command validates shape, provenance references, evidence coverage, normalization, score consistency, and uniqueness. It archives a new dated/content-hashed file under `src/data/history` using exclusive creation. It does not overwrite the active catalog or historical snapshots. Source review is still necessary: structural validation does not prove a source's claims.

For optional PostgreSQL storage, set `DATABASE_URL` in the process environment, then run:

```sh
npm run db:migrate
npm run data:persist -- path/to/reviewed-catalog.json
```

The persistence command stores an immutable, content-deduplicated validated snapshot. Normalized tables separate source mappings, raw benchmark results, internal test runs, current facts/prices, score history, and task estimates. A live PostgreSQL server is not bundled and database migration execution requires your configured instance. Never commit credentials.

## Publishing real data

Pricing source review is independent of catalog and benchmark validation. This revision publishes 12 provider-reviewed model prices; other rates remain unavailable. See [pricing methodology](docs/pricing-methodology.md) for source rules, covered models, formulas, freshness, storage and unsupported billing cases. Historical catalog assertions are not made current by this pricing review.

The sample site emits `noindex, nofollow` and blocks crawlers in `robots.txt`. Set `SITE_URL` to a real deployment origin to generate canonical URLs and sitemap locations. Local mode omits canonical URLs and returns an empty sitemap rather than inventing a production domain. Only remove the indexing restrictions after replacing and reviewing all fictional content. Nothing has been deployed or pushed.

Dependency audit at implementation time reported four moderate advisories in the existing Drizzle Kit development dependency chain (`esbuild` development-server advisory). These are not in the static site's runtime. The suggested automatic fix downgrades Drizzle Kit; no forced downgrade was applied.

See [the product brief](ai-model-guide-gpt6-astra-brief.md), [implementation design](docs/implementation-design.md), and [session log](SESSION_LOG.md).
