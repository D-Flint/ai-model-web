# Development and deployment

## Requirements

- Node.js 24 or newer is the primary supported runtime. Node.js 22.13 or newer is supported by the application tooling.
- npm is used for dependency installation and scripts.
- Python, Playwright, and Chromium are required only for browser-flow tests.
- PostgreSQL is optional and is needed only for persistence and migration workflows.

## Local setup

```sh
npm install
npm run dev
```

Astro normally serves the site at `http://localhost:4321`.

For a production-like local run:

```sh
npm run build
npm run preview
```

`npm run build` first runs `data:prepare-comparisons`. That creates the reproducible comparison assets required by the comparison Worker route and then runs `astro build`.

## Environment variables

Copy `.env.example` to `.env`. Never commit `.env` or real credentials.

| Variable | Required | Used by |
| --- | --- | --- |
| `SITE_URL` | Production builds | Astro canonical URLs and sitemap generation |
| `DATABASE_URL` | Database workflows only | Drizzle migrations and catalog/pricing persistence |
| `OPENROUTER_API_KEY` | Optional | OpenRouter catalog and telemetry refreshes; helps with rate limits |
| `HF_TOKEN` | Optional | Hugging Face datasets that require authentication or higher limits |

The deployed Worker serves prepared catalog assets and does not require `DATABASE_URL` for normal browsing.

## Quality checks

Run the checks relevant to the change:

```sh
npm test
npm run check
npm run lint
npm run build
```

Browser-flow checks use a running local server:

```sh
pip install playwright
python -m playwright install chromium
npm run dev
npm run test:browser
npm run test:pricing:browser
npm run test:cloudflare
```

Generated browser artifacts belong in the ignored `artifacts/` directory. Use `ASTRA_TEST_URL` when the test server is not at the default address.

## Cloudflare deployment

The production target is Cloudflare Workers through `@astrojs/cloudflare`.

`wrangler.jsonc` defines:

- Worker name: `synapse`
- Worker entry point: Astro’s Cloudflare server entry point
- Compatibility date and Node compatibility flags
- `ASSETS` binding for static output
- Worker-first handling for `/compare/*`

For Cloudflare’s connected Git build, use:

```text
npm run build
```

The output directory is `dist`. The build command automatically prepares comparison assets, so generated files do not need to be committed to GitHub.

For an authenticated Wrangler deployment:

```sh
npm run deploy
```

`npm run deploy` builds first and then runs `wrangler deploy`. A custom domain is optional; Cloudflare can provide a workers.dev or Pages preview address before a domain is configured.

## Deployment troubleshooting

### Missing `comparisonSlugs.json`

If Cloudflare reports that `src/data/generated/comparisonSlugs.json` cannot be resolved, the build is not running the `prebuild` lifecycle. Confirm the repository contains the `prebuild` script and the build command is exactly `npm run build`.

### Missing comparison records

Run `npm run data:prepare-comparisons` locally and confirm `public/_comparison-data/` is generated. These files are derived from the model catalog and are intentionally ignored.

### Environment or authentication errors

Check Cloudflare project settings and secrets separately from this repository. Do not place API keys in source files, `.env.example`, or public assets.

### Local Wrangler permission errors

Wrangler may need to write logs and registry files in its user profile during local builds. A local permission error in that profile is separate from the application build and does not indicate the Cloudflare clean-build import problem.
