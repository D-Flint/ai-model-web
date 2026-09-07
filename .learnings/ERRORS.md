## [ERR-20260907-001] implementation-checks

**Logged**: 2026-09-07
**Status**: resolved or documented

- Combined alias patch initially failed because the surrounding `ModelExplorer` lines differed; split into smaller patches.
- `npx tsx -e` top-level await attempt failed; used a normal async IIFE for read-only API inspection.
- `npm run check` / Astro check reported Wrangler log `EPERM`, but Astro diagnostics completed with 0 errors; direct `npx tsc --noEmit` passed.
- OpenRouter endpoint telemetry returned `throughput_last_30m: null`; speed remains unset until upstream publishes values.
- Full catalog refresh was not run because it can persist to `DATABASE_URL`; used local-only LiveBench and throughput refresh scripts instead.
