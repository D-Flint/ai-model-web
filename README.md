# Astra: AI Model Guide

A content-first Astro application for discovering, comparing, understanding, and choosing AI models. The local edition implements the product flows with 12 explicitly fictional models. No sample score or price is a claim about a real provider.

## Run locally

Use Node.js 24 or newer and npm 9.6.5 or newer (Node.js 22.13+ is also supported by the app and lint tools).

```sh
npm install
npm run dev
```

Open the local address printed by Astro (normally http://localhost:4321). No database, API key, or external account is needed for the sample app.

## Implemented experience

- Homepage with a working comparison, search, task shortcuts, model highlights, and cost examples.
- Model explorer with search, provider and numerical filters, capability filters, sorting, and a four-model comparison tray.
- Twelve model detail pages with numerical scores, expandable evidence, pricing, facts, alternatives, and tradeoffs.
- Two-to-four-model comparisons with shareable query URLs, 66 static pair pages, grouped metrics, ties, and conditional verdicts.
- Overall and eight task-specific rankings with plain-language explanations.
- Three-question deterministic finder, budget filtering, explained matches, and a free-budget empty state.
- Simple and advanced cost estimates with adjustable workload, usage, success probability, and tool overhead.
- Responsive light/dark layouts, keyboard focus, mobile navigation, reduced-motion support, and semantic tables.
- Validated sample inputs, configurable scoring, source references, snapshot imports, optional PostgreSQL persistence, and generated Drizzle migrations.

## Validation

```sh
npm test             # Domain logic and data integrity tests
npm run check        # Astro and strict TypeScript diagnostics
npm run lint         # TypeScript/Astro ESLint rules and Prettier checks
npm run build        # Static production output
npm run preview      # Serve the production build
npm run test:browser # Python Playwright flows against localhost:4321
```

The browser suite requires Python, `pip install playwright`, and `python -m playwright install chromium`. It expects the local server to be running. Screenshots go to the ignored `artifacts/` directory. Set `ASTRA_TEST_URL` to test another local server address.

`npm run format` formats source files. Build output contains 94 pages plus sitemap output. Static model and ranking content works without client JavaScript; interactive controls require JavaScript.

## Architecture and data policy

`src/pages` owns Astro content and routes. `src/components` contains static components and React islands. `src/data/config.ts` holds scoring weights, workload assumptions, and recommendation parameters. `src/lib` contains validation and deterministic calculations. `src/db` holds the optional database connection, schema, and migrations.

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

This is a complete sample-data application, not a verified live model directory. Provider ingestion, licensed benchmarks, actual internal evaluations, and real-model editorial review have not been performed. The brief explicitly permits mock data until verification is available.

The sample site emits `noindex, nofollow` and blocks crawlers in `robots.txt`. Set `SITE_URL` to a real deployment origin to generate canonical URLs and sitemap locations. Local mode omits canonical URLs and returns an empty sitemap rather than inventing a production domain. Only remove the indexing restrictions after replacing and reviewing all fictional content. Nothing has been deployed or pushed.

Dependency audit at implementation time reported four moderate advisories in the existing Drizzle Kit development dependency chain (`esbuild` development-server advisory). These are not in the static site's runtime. The suggested automatic fix downgrades Drizzle Kit; no forced downgrade was applied.

See [the product brief](ai-model-guide-gpt6-astra-brief.md), [implementation design](docs/implementation-design.md), and [session log](SESSION_LOG.md).
