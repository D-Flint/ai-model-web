# Cloudflare Workers deployment

The site uses Astro 7 with the official `@astrojs/cloudflare` adapter. `output: 'static'` remains the default; only `src/pages/compare/[pair].astro` declares `prerender = false`. The adapter generates the deployment configuration consumed by Wrangler. `assets.run_worker_first` routes `/compare/*` to SSR, excluding the static `/compare/` tool. This is necessary for browser navigations: otherwise Cloudflare's asset fallback may serve its 404 before invoking the Worker. Sessions are disabled because the app does not use them. Image compilation happens at build time.

## Rendering and data

The homepage, `/models`, all 282 model details, `/rankings` and category pages, `/methodology`, `/compare`, `/find`, `/cost`, `/pricing`, 404, catalog JSON, and sitemap remain prerendered. Pair pages have no `getStaticPaths()`. The existing bounded discovery list supplies popular links and sitemap entries only; it never generates pair HTML.

`npm run data:prepare-comparisons` validates and prepares the same catalog used by static pages. It writes ignored, generated per-model JSON into `public/_comparison-data/` and a small slug registry into `src/data/generated/`. The dev, build, and check scripts run preparation automatically. Run the npm scripts rather than invoking `astro build` directly. Restart development or rebuild after changing catalog data.

Each pair request resolves against the slug registry and reads only two prepared records through `env.ASSETS.fetch`. There is no database access, filesystem access, benchmark ingestion, catalog validation, or ranking normalization in the request path. Individual record shapes are validated. The interactive selector still loads `/catalog.json` in the browser.

PostgreSQL/Drizzle (`postgres` / `drizzle-orm/postgres-js`) remains an optional Node ingestion and persistence dependency. No Neon-specific client or runtime database integration exists in this repository. Those scripts retain their existing connection lifecycle and never enter the Worker bundle. A live database is not required or tested by this deployment. Moving database queries into Workers later would require a separate serverless connection design and runtime verification.

## URLs and errors

Pairs use alphabetical ASCII slug order. Reverse order receives HTTP 301, preserving query parameters. Normal slugs use `/compare/alpha-vs-beta`. When either slug contains `-vs-`, the generator uses the unambiguous `~vs~` separator, which cannot occur in a catalog slug. Legacy URLs are accepted only when exactly one split matches two known, distinct models. Ambiguous, duplicate, malformed, and unknown pairs return HTTP 404. Valid slugs with unavailable or malformed assets return a friendly HTTP 503 with `Cache-Control: no-store` and `Retry-After: 60`.

Copying a plain two-model selection produces the canonical pair URL. Effort variants and selections of three or four models retain `/compare?models=...`. Editing a pair selection moves the browser URL to the interactive tool. Existing query URLs remain supported.

Pair HTML contains model names, scores, pricing, summaries, model/source links, and methodology links before React hydration. Missing metrics retain the current unavailable states. Set `SITE_URL` during the build to emit canonical metadata. Existing `noindex, nofollow` and robots restrictions remain until the separate content-review process approves indexing.

No HTML CDN cache is enabled. If added later, set cache headers on successful pair responses and define invalidation for catalog deployments. Never cache error responses or future private/user-specific content. `_headers` only affects static assets, not Worker responses.

## Environment and commands

- `SITE_URL`: actual production HTTPS origin, exported in the build environment. Required for production canonical URLs and sitemap locations. Optional locally. Runtime `vars` cannot change generated metadata.
- `DATABASE_URL`: Node data persistence/migrations only; not a Worker secret.
- `OPENROUTER_API_KEY`: optional Node ingestion credential; not a Worker secret.
- `HF_TOKEN`: optional Node ingestion credential; not a Worker secret.
- No application secrets or database bindings are required in Cloudflare. `ASSETS` is configured in `wrangler.jsonc`. For future runtime secrets use `npx wrangler secret put NAME`, never plaintext configuration; local Worker secrets belong in ignored `.dev.vars`.

```sh
npm ci
npm run dev
npm test
npm run check
npm run lint
npm run build
npm run preview
# Against the preview server (default http://localhost:4321):
npm run test:cloudflare
# Package verification without uploading:
npx wrangler deploy --dry-run
# Deploy only when authorized:
npm run deploy
```

Set `SITE_URL` in your shell or Cloudflare Workers Builds environment before building. Workers Builds should use `npm run build` and `npx wrangler deploy`. The `deploy` npm script builds and deploys; it is not a Cloudflare Pages command. Set the desired Worker name in `wrangler.jsonc`. Authentication and a production origin are deployment-time choices.

## Rollback

No database schema or source catalog changes occur. To roll back locally, revert the migration commit and run `npm ci` and `npm run build`; the previous curated static pair behavior returns. Existing comparison query URLs continue to work across either version. For an already deployed Worker, restore the prior deployment through Cloudflare's deployment history. No remote deployment is part of this implementation.

## Verified implementation (2026-09-07)

- Astro 7.3.1, Cloudflare adapter 14.3.0, Wrangler 4.129.0, npm. No prior deployment adapter or Vercel configuration was present.
- Production output contains 301 HTML pages, including 282 model details. The former curated build had 392 HTML pages; the earlier all-pairs build had 39,922. `/compare/index.html` is the only comparison HTML file. The sitemap includes 91 bounded discovery pairs.
- 85 unit tests passed. Astro/TypeScript checks report no errors, warnings, or hints. ESLint and full formatting checks pass. Nine pre-existing CRLF formatting warnings were resolved by normalizing line endings without changing tracked content.
- Local development and production Workers preview passed raw SSR HTML, arbitrary pair, invalid/duplicate pair 404, reverse/trailing-slash 301, static routes, sitemap, hydration, selector editing, query reload, and clipboard-sharing checks. Canonical metadata was checked using the explicitly test-only `https://synapse.example` build origin.
- Temporarily withholding one generated deployment asset produced a friendly HTTP 503 with `no-store`. Restoring the asset recovered HTTP 200. Source model data was not changed.
- Wrangler deployment dry run passed without uploading: 1,188.50 KiB total, 269.78 KiB gzip. Only the `ASSETS` binding is required. A live deployment and production CPU quotas have not been tested.
- Existing robots and `noindex` restrictions remain. Rebuild with the actual `SITE_URL` before deployment. Database connectivity is not part of the Worker request path and was not tested against a live database.

Changed files: `astro.config.mjs`, `wrangler.jsonc`, `package.json`, `package-lock.json`, `.gitignore`, `.env.example`, `eslint.config.js`, `src/env.d.ts`, `scripts/prepare-comparisons.ts`, `src/lib/comparisonCatalog.ts`, `src/lib/comparisonPairs.ts`, `src/lib/loadComparisonModels.ts`, `src/lib/seoComparisons.ts`, `src/pages/compare/[pair].astro`, `src/pages/404.astro`, `src/pages/index.astro`, `src/components/ComparisonBuilder.tsx`, `tests/comparisonPairs.test.ts`, `tests/cloudflare_comparisons.py`, `README.md`, this guide, and `SESSION_LOG.md`.

References: [Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) and [Workers deployment guide](https://docs.astro.build/en/guides/deploy/cloudflare/).
