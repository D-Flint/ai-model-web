# Synapse

> A consumer-first AI model decision engine for finding the right model for the work in front of you.

**Synapse** turns scattered model specifications, public evaluations, pricing, and tradeoffs into guidance people can actually use. It is designed around one journey:

```text
Discover → Compare → Understand → Choose
```

The app is built with Astro, selective React islands, strict TypeScript, and an evidence-aware data pipeline. It is not a technical leaderboard: scores, confidence, source freshness, and price are presented as decision inputs—not a substitute for testing a model on your own work.

## Contents

- [What you can do](#what-you-can-do)
- [Run it locally](#run-it-locally)
- [Data you can inspect](#data-you-can-inspect)
- [How the project is organized](#how-the-project-is-organized)
- [Development commands](#development-commands)
- [Environment variables](#environment-variables)
- [Catalog and data workflows](#catalog-and-data-workflows)
- [Quality and deployment](#quality-and-deployment)
- [Further reading](#further-reading)

## What you can do

| Start here | What Synapse helps with |
| --- | --- |
| **Explore** | Search and filter models by provider, capability, available evidence, price, and practical characteristics. |
| **Compare** | Put two to four models side by side, inspect the differences that matter, and share a comparison URL. |
| **Rank** | Browse overall and task-focused rankings with visible sort direction, evidence-aware eligibility, and plain-language guidance. |
| **Find** | Answer three focused questions to receive a deterministic, explainable shortlist shaped by use case, priorities, requirements, and budget. |
| **Price** | Compare reviewed API rates and calculate a specific token workload where the required pricing data is available. |
| **Verify** | Follow sources, retrieval dates, confidence, methodology, and missing-data states instead of treating a score as unquestionable. |

The interface is responsive, theme-aware, keyboard-accessible, and respects reduced-motion preferences. Static content remains useful without JavaScript; interactive filtering, comparisons, recommendations, and calculation controls use focused React islands.

## Run it locally

No API key, external account, or database is required to explore the local application. Use Node.js 24 or newer; Node.js 22.13+ is also supported by the app and lint tooling.

```sh
npm install
npm run dev
```

Open the address Astro prints in the terminal (normally [http://localhost:4321](http://localhost:4321)).

For a production-like local build:

```sh
npm run build
npm run preview
```

`npm run build` automatically prepares the generated comparison artifacts required by the Cloudflare configuration.

## Data you can inspect

Synapse keeps different kinds of information separate so the UI does not blur a fact, a test result, and an estimate into the same claim.

| Kind | Used for | What is retained |
| --- | --- | --- |
| **Provider facts** | Availability, modalities, context, and reviewed API pricing | Source URL, publisher, source type, retrieval date, and verification date where available. |
| **Public evaluations** | Capability evidence and rankings | Raw value, original scale, normalized 0–100 value, source, and evaluation date. |
| **Derived scores** | Overall and task-specific comparisons | Methodology version, supporting evidence, update date, and confidence. |
| **Estimates** | A user-entered API workload | Inputs, pricing scope, and unsupported-rate handling. Missing data stays unavailable. |

At runtime, the app validates `src/data/verifiedModels.json` and selects its current eligible catalog. If that file is absent, invalid, or empty, it falls back to explicitly fictional local fixtures; those fixtures have mock provenance and zero confidence. The fallback exists to keep development usable, not to make a claim about real AI products.

The pricing interface uses a separate reviewed-pricing boundary. Legacy ingestion prices are not automatically published as current rates, and unavailable pricing is never treated as free. Review the in-app methodology and [pricing methodology](docs/pricing-methodology.md) before using any rate for a purchase decision.

## How the project is organized

```text
src/
├── pages/       Astro routes, SEO content, and API endpoints
├── layouts/     Shared document shell and metadata
├── components/  Domain-focused Astro components and React islands
├── data/        Validated catalog inputs, scoring configuration, and sources
├── lib/         Validation, scoring, rankings, comparisons, and recommendations
├── pipeline/    Source adapters, normalization, confidence, and catalog assembly
└── db/          Drizzle schema, migrations, and optional PostgreSQL persistence

scripts/         Import, refresh, scoring, persistence, and comparison preparation
tests/           Vitest domain tests plus Python browser-flow checks
docs/            Operational guides, methodology, and implementation notes
public/          Static assets, logos, favicon, and crawler policy
```

Astro owns routes, layouts, metadata, and server-rendered content. React is reserved for interaction-heavy islands such as the model explorer, comparison builder, finder, rankings, and cost calculator. Zod schemas validate catalog data before it is selected for display; Drizzle can persist immutable, content-deduplicated snapshots to PostgreSQL when a database is configured.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Astro development server. |
| `npm run build` | Prepare comparison data and create the production build. |
| `npm run preview` | Serve the production output locally. |
| `npm run check` | Run Astro and strict TypeScript diagnostics. |
| `npm run lint` | Run ESLint and the repository Prettier check. |
| `npm run format` | Format supported source, test, script, and configuration files. |
| `npm test` | Run the Vitest domain and data-integrity suite. |
| `npm run test:browser` | Run the Python browser-flow suite against a running local server. |
| `npm run test:pricing:browser` | Exercise pricing, browse, comparison, finder, and mobile pricing flows. |
| `npm run test:cloudflare` | Check Cloudflare comparison-route behavior. |

The browser suites require Python, Playwright, a Chromium installation, and a running local server. Install those browser prerequisites with:

```sh
pip install playwright
python -m playwright install chromium
```

Screenshots and generated browser artifacts are written to the ignored `artifacts/` directory. Set `ASTRA_TEST_URL` to point a browser test at a different local address.

## Environment variables

Copy [.env.example](.env.example) to `.env` and set only the values needed for the workflow you are running. Never commit secrets.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | No | PostgreSQL connection used only by database migrations and persistence scripts. Workers serve prepared catalog assets rather than connecting to the database per request. |
| `OPENROUTER_API_KEY` | No | Raises rate limits for the OpenRouter catalog endpoint. |
| `HF_TOKEN` | No | Enables access to gated Hugging Face datasets or higher access limits where applicable. |
| `SITE_URL` | Production builds | Actual HTTPS origin used to create canonical URLs and sitemap locations. Leave it unset locally. |

## Catalog and data workflows

### Validate and archive an import

Supply a JSON array that matches `CatalogModel`:

```sh
npm run data:import -- path/to/catalog.json
```

The import process validates shape, provenance references, evidence coverage, score bounds and consistency, and slug uniqueness. It archives a dated, content-hashed snapshot under `src/data/history` using exclusive creation; it does not overwrite the active catalog or an existing historical snapshot. Structural validation is not a claim that an external source is true—source review remains necessary.

### Refresh source inputs

The repository includes targeted data commands as well as an end-to-end refresh:

```sh
npm run data:openrouter          # catalog metadata and available pricing inputs
npm run data:lmarena             # public LMSYS Chatbot Arena inputs
npm run data:swebench            # SWE-bench inputs
npm run data:official            # provider-spec verification workflow
npm run data:livebench           # LiveBench snapshot refresh
npm run data:catalog:livebench   # select the eligible LiveBench catalog
npm run data:speed               # OpenRouter throughput refresh
npm run data:scores              # derive configured scores
npm run data:refresh             # run the complete ingestion pipeline
```

`npm run data:refresh` writes the validated catalog to `src/data/verifiedModels.json`. If `DATABASE_URL` is set, it also attempts optional PostgreSQL persistence. Refreshing data is a source-review workflow: check provenance, freshness, benchmark compatibility, and resulting diffs before publishing a change.

### Persist reviewed data

For an explicitly reviewed catalog or pricing snapshot, configure `DATABASE_URL` and run the relevant command:

```sh
npm run db:migrate
npm run data:persist -- path/to/reviewed-catalog.json
npm run data:pricing:persist
```

The database schema separates providers, models, aliases, sources, benchmark results, current facts and prices, derived scores, score history, and catalog snapshots. See [data-pipeline.md](docs/data-pipeline.md) for source adapters, normalization, schema detail, and troubleshooting.

## Quality and deployment

Before opening a pull request or publishing refreshed data, run the checks relevant to the change:

```sh
npm test
npm run check
npm run lint
npm run build
```

The production target is Cloudflare Workers. `/compare/[pair]` is rendered on demand; the rest of the application is static. Set `SITE_URL` during the build, configure the Worker name in `wrangler.jsonc`, then deploy with:

```sh
npm run deploy
```

Deployment authentication and Cloudflare account configuration are intentionally external to this repository. The included crawler policy blocks indexing; do not remove that protection until catalog claims and source review are ready for a public launch. For setup, validation, rollback, and known boundaries, read the [Cloudflare Workers guide](docs/cloudflare-workers.md).

## Further reading

- [Implementation design](docs/implementation-design.md) — route map, interaction boundaries, and original design constraints.
- [Data pipeline](docs/data-pipeline.md) — sources, ingestion stages, normalization, confidence, and persistence.
- [Pricing methodology](docs/pricing-methodology.md) — reviewed-rate publication rules and calculator scope.
- [Cloudflare Workers guide](docs/cloudflare-workers.md) — deployment configuration and rollback.
- [Data-refresh plan](docs/PLAN_DATA_REFRESH_WORKFLOW.md) — proposed automation; no scheduled refresh is active.
- [Verification notes](docs/verification.md) — historical local validation record and known limitations.
- [Session log](SESSION_LOG.md) — concise record of implementation work and handoffs.

## License

Synapse is licensed under [AGPL-3.0-only](LICENSE). The repository is available at [D-Flint/ai-model-web](https://github.com/D-Flint/ai-model-web).
