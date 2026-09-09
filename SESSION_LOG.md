# Session Log

## History summary

- 2026-09-05: Repository setup, Astro foundation, real-data pipeline, model catalog expansion, scoring/speed work, leaderboard UI, branding, and theme.
- 2026-09-06: Provider catalogs for Google, Anthropic, DeepSeek, Moonshot, and MiniMax; official logo assets; leaderboard sorting and limits; OpenRouter featured models; sourced pricing; green palette.
- 2026-09-07: Animation cleanup, SEO comparison pages, Cloudflare hybrid SSR, provider logo fixes, mobile explorer, LiveBench integrity rules, visible top-30 catalog, and AGENTS.md refinement.
- Full pre-compression log preserved at `%LOCALAPPDATA%\caveman-compress\backups\ai-model-web\SESSION_LOG.original.md`.
- Detailed implementation history remains in Git commits.

## Current handoff

- Objective: Ensure speed metric value in model explorer table remains on a single line so table row heights stay even.
- Last implementation: Added `.td-speed` and `.th-speed` with `white-space: nowrap; min-width: 112px;` to `src/styles/global.css` and updated `src/components/ModelExplorer.tsx` to include `th-${col.key}` on header and `td-speed` on metric cell.
- Tests: Browser screenshots verified across desktop viewports, `npm test` 127/127 passed, `astro check` (97 files, 0 errors, 0 warnings), `tsc --noEmit` passed, `npm run lint` clean, `npm run build` production build passed.
- Commits: `96f619d` (`fix: prevent speed metric wrapping to maintain even table row height`).
- Current state: Speed values stay strictly single-lined (`12–48 tok/s`, `26–229 tok/s`), table row heights are uniform across the entire explorer table.
- Exact next step: User verifies the table layout in browser.

## 2026-09-08 — Fix uneven table row heights from speed metric wrap

- Objective: Keep speed metric values on a single line in the Model Explorer table to ensure consistent, even row heights.
- Files changed: `src/components/ModelExplorer.tsx`, `src/styles/global.css`.
- Attempts: 1 implementation attempt.
- Failures/causes: None; browser screenshot confirmed row height asymmetry resolved and all rows are uniform.
- Tests: Visual browser check via Chrome DevTools screenshot (scrolled and top); `npm test` 127/127 passed; `npx astro check` 0 errors/warnings/hints; `npx tsc --noEmit` passed; `npm run lint` clean; `npm run build` succeeded.
- Commit: `96f619d` (`fix: prevent speed metric wrapping to maintain even table row height`).
- Current state: Committed locally; no remote push. Speed values stay single-lined across all rows.
- Exact next step: User verifies explorer table rows.

## 2026-09-08 — Decouple pipeline benchmarks and consolidate pricing

- Objective: Decouple benchmark aggregations in pipeline, consolidate model registry & pricing into officialProviders, remove comparison static build bottleneck, and update schemas.
- Files changed: `src/pipeline/types.ts`, `src/pipeline/engine.ts`, `src/lib/catalogSchema.ts`, `src/data/officialProviders.ts`, `src/data/apiPricing.ts` (deleted), `src/data/models.ts`, `src/data/livebenchData.json`, `src/data/verifiedModels.json`, `src/lib/importCatalog.ts`, `src/lib/decision.ts`, `src/pipeline/dbPersist.ts`, `src/pipeline/official.ts`, `package.json`, `src/lib/comparisonCatalog.ts`, `src/pages/compare/[pair].astro`, `scripts/persist-api-pricing.ts`, `tests/apiPricing.test.ts`, `tests/dataPipeline.test.ts`.
- Attempts: 1 implementation attempt.
- Failures/causes: Float precision rounding difference between raw `Math.round(val)` and `normalize(val, 0, 100)` caused catalog verification mismatches; resolved by using `normalize(val, 0, 100)` consistently. Initial validation in `importCatalog.ts` failed on models without full LiveBench 7 categories; resolved by supporting nullable `benchmarks.livebench.overall`.
- Tests: `npm test` 127/127 passed; `npm run check` 97/97 passed (0 errors, 0 warnings); `npm run lint` 0 errors; `npm run build` production build succeeded.
- Commit: `301e5bd` (`refactor: decouple pipeline benchmarks and consolidate model pricing`).
- Current state: Benchmark containers decoupled, LiveBench overall purely deterministic across 7 categories or null, pricing consolidated with provenance, comparison matrix prebuild eliminated.
- Exact next step: User verifies the updated pipeline, models, and comparisons.

## 2026-09-07 — LiveBench/OpenRouter metrics

- Objective: Populate missing LiveBench capability values, especially Agentic Coding, and wire OpenRouter throughput ranges.
- Files changed: LiveBench/OpenRouter pipeline schemas and processors, explorer/card/detail UI, catalog snapshot, refresh scripts, aliases, tests, package scripts, error log.
- Attempts: 1 implementation attempt; 1 initial combined patch failed due context mismatch and was split.
- Failures/causes: Wrangler log `EPERM`; OpenRouter public `throughput_last_30m` was null for matched models, so speed stayed blank; full refresh skipped because it may persist through `DATABASE_URL`.
- Tests: `npm test` 90/90; `npx tsc --noEmit` passed; `npx astro check` 0 errors/warnings/hints; targeted Prettier check passed. Full lint remains blocked by pre-existing formatting warnings in unrelated files and the intentionally legacy-formatted catalog JSON.
- Commit: `ba0a927` (`feat: wire LiveBench and OpenRouter metrics`).
- Current state: Implementation committed locally; no push. LiveBench Agentic Coding is sourced and rendered where official rows exist. OpenRouter range support is ready but awaits upstream telemetry.
- Exact next step: User verifies local UI and confirms whether to keep or adjust the official LiveBench snapshot policy.

## 2026-09-07 — Comparison pricing audit

- Objective: Double-check missing API prices on comparison page.
- Files changed: `SESSION_LOG.md` only; no product code changes.
- Attempts: 1 diagnostic pass.
- Failures/causes: `tests/pricing_browser.py` stopped at stale `hy4-preview` fixture; unrelated to pricing.
- Tests: Catalog audit found 30 tracked models, 6 with reviewed `apiPricing`, 24 unavailable. Official Anthropic, Google, and DeepSeek pricing pages checked.
- Commit: None.
- Current state: Missing rates come from intentional reviewed-data coverage, not comparison rendering. Legacy prices remain excluded by policy.
- Exact next step: Add model-by-model reviewed `apiPricing` records only after official source verification.

## 2026-09-07 — Comparison metric coverage fix

- Objective: Restore verified LiveBench capability scores, reviewed provider pricing fallback, and comparison missing-state clarity.
- Files changed: LiveBench processor and refresh script, verified catalog snapshot, speed pipeline, pricing validation/helpers, comparison UI, config, tests.
- Attempts: 2 implementation attempts; first catalog refresh failed because mixed coding evidence was not re-averaged; fixed by preserving non-LiveBench coding evidence.
- Failures/causes: Existing `tests/pricing_browser.py` remains stale; it expects excluded `hy4-preview` in model selector. Targeted browser comparison check passed.
- Tests: `npm run check` passed with known Wrangler log `EPERM`; `npm test` 90/90; targeted ESLint and Prettier checks passed; comparison browser smoke check passed.
- Commit: `f7a1327`, `9d6cc52`, `7fa009b` (local commits; no remote push).
- Current state: Active 30-model catalog now has intelligence, coding, agentic, daily-use, research, cost-efficiency values for all tracked models; writing, vision, speed, and reliability remain explicitly unavailable where verified evidence is absent.
- Exact next step: Create local commit, then wait for user verification.

## 2026-09-07 — Reasoning effort selector fix

- Objective: Show effort selectors for models supporting `none` plus selectable reasoning levels.
- Files changed: `src/components/ComparisonBuilder.tsx`, `src/components/ModelEffortExplorer.tsx`, `src/pages/models/[slug].astro`.
- Attempts: 1 implementation attempt after browser reproduction.
- Failures/causes: Full lint reports existing formatting warnings in five files, including unrelated catalog/style files; targeted TypeScript, Astro, and component formatting checks pass.
- Tests: `npm test -- --run tests/decision.test.ts` 17/17; `npm run check` passed with known Wrangler log `EPERM`; browser smoke check shows 4 comparison selectors and 4 detail effort tabs; `git diff --check` passed.
- Commit: `c15c11e` (`fix: show selectable reasoning effort controls`; amended hash may differ).
- Current state: Mixed `none` plus selectable effort lists now render reasoning controls; standard `none` remains excluded from selector options.
- Exact next step: User verifies comparison and model detail effort controls.

## 2026-09-07 — Multimodality detail metric

- Objective: Show whether an expanded model supports text, vision, audio, or both vision and audio.
- Files changed: `src/components/ModelExplorer.tsx`, `src/lib/modalities.ts`, `tests/modalities.test.ts`, `docs/superpowers/specs/2026-09-07-multimodal-model-metric-design.md`.
- Attempts: 1 implementation attempt.
- Failures/causes: Git commit was blocked because the workspace denies writes to `.git/index.lock`; initial Wrangler check/build hit the existing AppData EPERM restriction and passed after redirecting Wrangler config to a temporary workspace directory.
- Tests: Focused modality test 4/4; full Vitest 94/94; `npm run check` passed with known Wrangler log warning; focused ESLint passed; production build passed with temporary Wrangler config; `git diff --check` passed.
- Commit: None; repository metadata is read-only in this workspace.
- Current state: Expanded desktop and mobile model details show a `Modalities` metric derived from verified catalog capability flags.
- Exact next step: User verifies the expanded model detail UI and commits the changes locally when repository metadata is writable.

## 2026-09-07 — Show text in modality labels

- Objective: Include text alongside vision and audio in every modality label.
- Files changed: `src/lib/modalities.ts`, `tests/modalities.test.ts`, `docs/superpowers/specs/2026-09-07-multimodal-model-metric-design.md`, `SESSION_LOG.md`.
- Attempts: 1 implementation attempt.
- Failures/causes: Full lint remains blocked by pre-existing Prettier warnings in unrelated files; Wrangler emits existing AppData `EPERM` log warning.
- Tests: Focused modality test 4/4; full Vitest 96/96; `npm run check` passed; focused Prettier passed; `git diff --check` passed.
- Commit: `d5f84c7` (`fix: include text in modality labels`).
- Current state: Explorer labels now render `Text`, `Text + vision`, `Text + audio`, or `Text + vision + audio`.
- Exact next step: User verifies expanded desktop/mobile explorer rows; no further implementation until requested.

## 2026-09-07 — Provider-aware OpenRouter speed display

- Objective: Display one OpenRouter speed for one provider; display min–max speed across multiple providers.
- Files changed: OpenRouter throughput pipeline, catalog schema, speed display helper, model cards, explorer, comparison, rankings, detail page, effort view, tests, and speed-display design spec.
- Attempts: 1 implementation attempt after approved design.
- Failures/causes: Sandboxed `npm run data:speed` network access failed; escalated refresh succeeded but OpenRouter returned no public throughput telemetry, so catalog stayed unchanged. Browser check confirmed UI still renders legacy static speed values. Initial build hit Wrangler AppData `EPERM`; escalated build passed.
- Tests: `npm test` 96/96; `npm run check` passed with known Wrangler log warnings; production build passed; targeted ESLint and Prettier checks passed; `git diff --check` passed.
- Commit: Pending local commit.
- Current state: New refreshes group throughput by provider, store provider count, and display single value or provider range. Static and derived speed fallbacks are disabled; current catalog correctly shows no speed until OpenRouter telemetry exists.
- Exact next step: User verifies local pages; run `npm run data:speed` again when OpenRouter publishes throughput telemetry.

## 2026-09-07 — Verify OpenRouter speed availability

- Objective: Recheck missing speed after user ran `npm run data:speed`.
- Result: Refresh completed; OpenRouter returned no public throughput telemetry; catalog remains `0` ranges and `153` legacy static speeds.
- Direct API check: OpenRouter `openai/gpt-4o` endpoints returned `throughput_last_30m: null` for Azure and OpenAI.
- Current state: `—` is expected. No wait loop exists; source currently supplies no speed measurement.
- Exact next step: Choose another authoritative speed source or wait for OpenRouter telemetry publication.

## 2026-09-07 — Separate model effort labels

- Objective: Separate reasoning-effort variants from model names in the desktop model table and mobile model list.
- Files changed: `src/components/ModelExplorer.tsx`, `src/styles/global.css`, `docs/superpowers/specs/2026-09-07-model-effort-badge-design.md`.
- Attempts: 1 implementation attempt; 2 browser verification attempts (first exposed a selector-scoping issue, second passed).
- Failures/causes: Initial local browser check hit an Astro server readiness race; repository lint remains blocked by the pre-existing `prefer-const` error in `src/lib/decision.ts`; Wrangler required elevated access to its AppData registry/log directory.
- Tests: `npm run check` passed with known Wrangler log warning; `npm test -- --run` passed 97/97; production `npm run build` passed with elevated Wrangler access; desktop/mobile Playwright verification passed; focused formatter and `git diff --check` passed.
- Commit: `52ac315` (`fix: separate model effort labels`); design note committed separately as `ab16e9b`.
- Current state: Base model names now render independently from indigo effort badges on both responsive model-list surfaces; green open-weight badges remain distinct.
- Exact next step: User verifies the updated desktop and mobile model listings; no further implementation until requested.

## 2026-09-07 — Use OpenRouter provider speed stats

- Objective: Replace the incorrect endpoint telemetry source with the public provider stats source used by OpenRouter model pages.
- Files changed: `src/pipeline/openrouter.ts`, `src/pipeline/types.ts`, `src/pipeline/engine.ts`, `scripts/refresh-openrouter-throughput.ts`, `tests/dataPipeline.test.ts`, `src/data/verifiedModels.json`.
- Attempts: 1 implementation attempt; 3 browser verification attempts, with the final check passing.
- Failures/causes: First browser assertion expected `tok/s` on the rankings page; rankings correctly use `tokens/sec`. The final browser check passed on models, speed rankings, and Gemini 2.5 Pro detail.
- Tests: `npm test -- --run` 98/98; `npm run check` passed with known Wrangler AppData `EPERM` log warnings; targeted ESLint/Prettier passed; `git diff --check` passed; `npm run build` passed; live `npm run data:speed` saved 39 matched models; browser speed check passed.
- Commit: `9822d3b` (`fix: use OpenRouter provider speed stats`).
- Current state: Provider p50 throughput comes from `/api/frontend/v1/stats/endpoint`; multi-provider models display min–max, single-provider models display one speed.
- Exact next step: User verifies the refreshed local pages; no further implementation until requested.

## 2026-09-07 — Correct OpenRouter speed-source diagnosis

- Objective: Verify whether OpenRouter publishes model/provider speed data.
- Result: Confirmed. The public model endpoint `/api/v1/models/:author/:slug/endpoints` can return null telemetry, but the model page uses `/api/frontend/v1/stats/endpoint`.
- Evidence: `openai/gpt-4o` returned Azure `47` and OpenAI `49` p50 tokens/sec from the frontend stats endpoint.
- Current state: Existing refresh code targets the wrong endpoint for current public speed data; catalog remains without OpenRouter ranges.
- Exact next step: Update the refresh pipeline to use the frontend stats endpoint, then rerun `npm run data:speed` and verify min–max rendering.

## 2026-09-07 — Inline model effort badges

- Objective: Move the effort badge inline between the model name and open-weight status on desktop and mobile.
- Files changed: `src/components/ModelExplorer.tsx`, `src/styles/global.css`, `docs/superpowers/specs/2026-09-07-model-effort-badge-design.md`.
- Attempts: 1 implementation attempt; local browser harness needed stale-server cleanup before the final direct-server verification passed.
- Failures/causes: The helper repeatedly raced a previously running Astro server; stopping the stale server and testing against a fresh direct server resolved it. No source/test failure occurred.
- Tests: `npm run check` passed with known Wrangler log warning; `npm test -- --run` passed 97/97; desktop/mobile browser assertions passed; focused Prettier and `git diff --check` passed.
- Commit: `557033a` (`fix: place effort badges inline`).
- Current state: Model rows now read `model name → effort → open`, with wrapping handled by the existing flex rows.
- Exact next step: User verifies the final visual order; no further implementation until requested.

## 2026-09-07 — Verify missing speed metric

- Objective: Verify why the speed metric appears missing across model surfaces.
- Files changed: `SESSION_LOG.md` only; no product code changed.
- Attempts: 1 validation attempt.
- Failures/causes: The repository-local helper path was absent; the skill-owned helper was located and checked successfully.
- Tests: Focused decision and data-pipeline tests passed, 37/37.
- Commit: None; repository metadata unchanged.
- Current state: `ModelExplorer` sets the Speed column `defaultVisible` to `false`, so its header and cells are omitted globally until manually enabled. The tracked catalog has 3/30 OpenRouter-backed speed ranges; remaining models correctly show unavailable values under the verified-only policy.
- Exact next step: If requested, make the Speed column visible by default and separately decide whether any authoritative non-OpenRouter speed source should be approved.

## 2026-09-07 — Show speed column by default

- Objective: Restore the Speed metric column on the model leaderboard.
- Files changed: `src/components/ModelExplorer.tsx`, `SESSION_LOG.md`.
- Attempts: 1 implementation attempt.
- Failures/causes: Initial sandboxed Git staging was denied by `.git/index.lock`; escalated staging and commit succeeded while preserving unrelated user edits.
- Tests: Focused decision and data-pipeline tests 37/37; ESLint and Prettier passed for `ModelExplorer.tsx`; `git diff --check` passed.
- Commit: `bbd6357` (`fix: show speed column by default`).
- Current state: Speed is visible by default; models without verified throughput still display `—`.
- Exact next step: User verifies the leaderboard and comparison surfaces.

## 2026-09-07 — Verify speed values after column fix

- Objective: Verify why Speed still renders as `—` after the column became visible.
- Files changed: `SESSION_LOG.md` only; no product code changed.
- Attempts: 1 validation attempt.
- Failures/causes: None. The column visibility fix is active; the affected model records contain no speed fact, OpenRouter range, or speed evidence.
- Tests: Catalog inspection confirmed 3/30 tracked models have displayable OpenRouter speed; affected screenshot models have 0 displayable speed. Focused decision/data tests remain 37/37.
- Commit: No new commit; prior UI fix remains `bbd6357`.
- Current state: `—` is the correct verified-only output for GPT-6 Astra, Gemini 3.8 Flash, and Gemma 4 until authoritative throughput data is added.
- Exact next step: Run a successful approved speed-data refresh or approve a specific authoritative alternative source; do not hard-code estimates.

## 2026-09-07 — Support OpenRouter canonical_slug for speed throughput

- Objective: Resolve missing speed telemetry for GPT-6 Astra, Gemini 3.8 Flash, Gemma 4, and other models with dated canonical slugs on OpenRouter.
- Files changed: `src/pipeline/types.ts`, `src/pipeline/openrouter.ts`, `src/pipeline/aliasResolver.ts`, `src/pipeline/engine.ts`, `src/data/models/google.ts`, `scripts/refresh-openrouter-throughput.ts`, `src/data/verifiedModels.json`, `tests/dataPipeline.test.ts`, `SESSION_LOG.md`.
- Attempts: 1 implementation attempt.
- Failures/causes: None. OpenRouter stats endpoint requires `canonical_slug` (e.g. `openai/gpt-6-astra-20260903`), which was previously stripped by Zod schema validation.
- Tests: `npm test` passed 98/98; `npm run check` passed with 0 errors/warnings; production `npm run build` passed with HTML verification; Prettier passed on all modified files.
- Commit: Pending local commit.
- Current state: 23 out of 30 tracked models (and 87 catalog models total) now display verified throughput ranges, including GPT-6 Astra (10–50 tok/s), Gemini 3.8 Flash (19–211 tok/s), and Gemma 4 (3–491 tok/s).
- Exact next step: User verifies the leaderboard and model guide pages; no further implementation until requested.

## 2026-09-08 — Fix OpenRouter model identifier mappings for speed throughput

- Objective: Audit and double-check models lacking speed metrics, resolve identifier/alias mismatches, and refresh provider throughput.
- Files changed: `src/data/models/openai.ts`, `src/data/models/google.ts`, `src/data/models/mistral.ts`, `src/data/models/deepseek.ts`, `src/data/models/moonshot.ts`, `src/data/verifiedModels.json`, `tests/dataPipeline.test.ts`, `SESSION_LOG.md`.
- Attempts: 1 audit & fix attempt.
- Failures/causes: Several canonical models had dotted version numbers represented with hyphens in openRouterId (e.g., `openai/gpt-5-6-sol` instead of `openai/gpt-5.6-sol`, `openai/gpt-5-3-codex` instead of `openai/gpt-5.3-codex`) or preview suffixes (e.g., `google/gemini-3.1-pro-preview`), preventing the speed refresh pipeline from matching them.
- Tests: `npm test` 98/98 passed; `npm run check` passed with 0 errors/warnings/hints; Prettier passed on all modified files; `git diff --check` passed.
- Commit: Pending local commit.
- Current state: 27 out of 30 tracked models (and 110 catalog models overall) now have verified OpenRouter speed throughput ranges (GPT-5.6 Sol: 21–81 tok/s, GPT-5.6 Terra: 33–61 tok/s, Gemini 3.1 Pro: 3–102 tok/s, GPT-5.3-Codex: 64–91 tok/s). The remaining 3 tracked models (`gemini-3-deep-think`, `gemini-3-pro`, and `claude-3-7-sonnet`) have no public OpenRouter endpoints and remain unavailable per repository data integrity policy.
- Exact next step: Create local commit and wait for user verification.

## 2026-09-08 — Design intelligence ranking redesign

- Objective: Define a production-only, evidence-backed intelligence ranking with user-controlled sort direction.
- Files changed: `docs/superpowers/specs/2026-09-08-intelligence-ranking-design.md`, `SESSION_LOG.md`.
- Attempts: 1 design attempt.
- Failures/causes: Product brief is deleted in the working tree, so the committed version was read without restoring the user's deletion.
- Tests: Design self-review passed; no product code changed.
- Commit: `cbad3b7` (`docs: define intelligence ranking redesign`).
- Current state: Design approved in conversation and documented; implementation has not started.
- Exact next step: User reviews the written spec, then implementation planning can begin.

## 2026-09-08 — Rework intelligence model rankings

- Objective: Rank current production models using an evidence-backed intelligence decision score and add high-to-low or low-to-high sorting.
- Files changed: `src/components/IntelligenceRanking.tsx`, `src/components/RankingList.astro`, `src/data/config.ts`, `src/lib/rankings.ts`, `src/pages/compare/index.astro`, `src/pages/models/[slug].astro`, `src/pages/rankings/[category].astro`, `src/pages/sitemap.xml.ts`, `src/styles/global.css`, `tests/intelligenceRanking.test.ts`, `tests/intelligence_ranking_browser.py`, `SESSION_LOG.md`.
- Attempts: 1 implementation attempt with 2 verification corrections.
- Failures/causes: Initial TypeScript check found an optional test fixture after closure capture; fixture construction now narrows explicitly. Initial browser check used `127.0.0.1` while Astro served on `localhost`; corrected URL passed. Full `npm run lint` remains blocked by pre-existing `prefer-const` failure at `src/lib/decision.ts:108`; focused lint passed for every implementation file.
- Tests: Vitest passed 105/105; `npm run check` passed with 0 errors, warnings, or hints; production build passed; focused ESLint and Prettier checks passed; Playwright verified default descending sort, ascending sort, no browser console errors, and comparison handoff.
- Commit: `51e9de6` (`feat: rework intelligence model rankings`).
- Current state: Intelligence ranks 86 current production models using 80% intelligence, 10% coding, and 10% research. Default sorting is highest-first; users can reverse it. Ranked models have working detail and comparison paths.
- Exact next step: User verifies `/rankings/intelligence`; after approval, design the speed ranking without changing Overall.

## 2026-09-08 — Repair Chrome DevTools MCP startup

- Objective: Diagnose why the configured Chrome DevTools MCP server was not registering and repair its startup configuration.
- Files changed: `C:\Users\ASUS Rog\.codex\config.toml`, `SESSION_LOG.md`.
- Attempts: 1 diagnosis/fix attempt; 2 runtime probes.
- Failures/causes: The MCP entry omitted npx's non-interactive `--yes` flag, and the bare `npx` command resolved incorrectly under the MCP host, attempting to load npm from the project directory (`node_modules/npm/bin/npx-cli.js`).
- Tests: Official Chrome DevTools MCP configuration checked; absolute `C:\Program Files\nodejs\npx.cmd --yes chrome-devtools-mcp@latest --version` passed and resolved version 1.8.0; config entry verified with a 120-second startup timeout.
- Commit: Pending local commit.
- Current state: The user-level MCP entry now uses the absolute Windows npx path, auto-accepts installation, and allows first-run package startup time.
- Exact next step: Restart Codex so it reloads `config.toml`, then confirm `chrome-devtools` tools appear and invoke one browser inspection tool.

## 2026-09-08 — Design speed ranking redesign

- Objective: Define a current-production Speed ranking that uses maximum verified throughput while supporting single verified speed values.
- Files changed: `docs/superpowers/specs/2026-09-08-speed-ranking-design.md`, `SESSION_LOG.md`.
- Attempts: 1 design attempt.
- Failures/causes: None.
- Tests: Design self-review passed; no product code changed.
- Commit: `9843951` (`docs: define speed ranking redesign`).
- Current state: Design approved in conversation and documented; implementation has not started.
- Exact next step: User reviews the written spec, then implementation planning can begin.

## 2026-09-08 — Rework speed model rankings

- Objective: Rank current production models by maximum verified throughput, include single verified speed values, and support both sort directions.
- Files changed: `src/components/SpeedRanking.tsx`, `src/components/RankingList.astro`, `src/lib/rankings.ts`, `src/pages/compare/index.astro`, `src/pages/models/[slug].astro`, `src/pages/rankings/[category].astro`, `src/pages/sitemap.xml.ts`, `tests/speedRanking.test.ts`, `tests/speed_ranking_browser.py`, `SESSION_LOG.md`.
- Attempts: 1 implementation attempt.
- Failures/causes: Full `npm run lint` remains blocked by the pre-existing `prefer-const` failure at `src/lib/decision.ts:108`; focused lint passed for every implementation file.
- Tests: Vitest passed 112/112; `npm run check` passed with 0 errors, warnings, or hints; production build passed; focused ESLint and Prettier checks passed; Playwright verified peak range selection, default descending sort, ascending sort, comparison handoff, and no browser console errors.
- Commit: `ccf5d7f` (`feat: rank models by verified peak speed`).
- Current state: Speed ranks 65 current production models: 61 verified ranges use their maximum value and 4 verified single values use their only value. Default sorting is highest-first; users can reverse it.
- Exact next step: User verifies `/rankings/speed`; do not change another ranking until requested.

## 2026-09-08 — Design remaining ranking sorting redesign

- Objective: Define verified, reversible sorting for Best value, Lowest cost, Coding, Agents, Daily use, Research, Writing, and Vision.
- Files changed: `docs/superpowers/specs/2026-09-08-remaining-ranking-sorting-design.md`, `SESSION_LOG.md`.
- Attempts: 1 design attempt.
- Failures/causes: None.
- Tests: Design self-review passed; no product code changed.
- Commit: `8925208` (`docs: define remaining ranking sorting`).
- Current state: Design approved in conversation and documented; implementation has not started.
- Exact next step: User reviews the written spec, then implementation planning can begin.

## 2026-09-08 — Add sorting to remaining rankings

- Objective: Apply verified, reversible sorting to Best value, Lowest cost, Coding, Agents, Daily use, Research, Writing, and Vision.
- Files changed: `src/components/MetricRanking.tsx`, `src/components/RankingList.astro`, `src/lib/rankings.ts`, `src/pages/compare/index.astro`, `src/pages/models/[slug].astro`, `src/pages/rankings/[category].astro`, `src/pages/sitemap.xml.ts`, `tests/remainingRankings.test.ts`, `tests/remaining_rankings_browser.py`, `SESSION_LOG.md`.
- Attempts: 1 implementation attempt.
- Failures/causes: Full `npm run lint` remains blocked by the pre-existing `prefer-const` failure at `src/lib/decision.ts:108`; focused lint passed for every implementation file.
- Tests: Vitest passed 127/127; `npm run check` passed with 0 errors, warnings, or hints; production build passed; focused ESLint and Prettier checks passed; Playwright verified default and reverse sorting across all eight routes, comparison handoff, and no browser console errors.
- Commit: `1f620a3` (`feat: add sorting to remaining rankings`).
- Current state: Seven score rankings default highest-first; Lowest cost defaults lowest-first. All eight allow reversing order and rank only current production models with verified metric data.
- Exact next step: User verifies the affected ranking pages; Overall remains unchanged.

## 2026-09-08 — Plan automatic model-data refresh

- Objective: Capture the requirement for automatic model-data refresh without activating automation yet.
- Files changed: `docs/PLAN_DATA_REFRESH_WORKFLOW.md`, `SESSION_LOG.md`.
- Attempts: 1 documentation update.
- Failures/causes: None.
- Tests: `git diff --check` passed; no runtime checks required for documentation-only changes.
- Commit: Pending local commit.
- Current state: The plan documents a scheduled GitHub Actions refresh, validation gate, scoped data commit, automatic redeploy, prerequisites, deferred decisions, acceptance criteria, and non-goals. No workflow is active.
- Exact next step: Decide hosting target, publish policy, cadence, secrets, and failure notifications before implementation.

## 2026-09-09 — Add data sources to model detail dropdowns

- Objective: Add compact, traceable data-source attribution to every expanded Model Explorer detail on desktop and mobile.
- Files changed: `docs/superpowers/specs/2026-09-08-model-dropdown-data-sources-design.md`, `src/components/ModelDataSources.tsx`, `src/components/ModelExplorer.tsx`, `src/lib/modelDetailSources.ts`, `src/styles/global.css`, `tests/modelDetailSources.test.ts`, `tests/model_detail_sources_browser.py`, `SESSION_LOG.md`.
- Attempts: 1 implementation attempt with 1 test-expectation correction.
- Failures/causes: The first unit expectation treated a shared OpenAI facts/pricing URL as two entries; corrected to assert the intended deduplicated entry and merged coverage. The first sandboxed build could not write Wrangler profile registry files; the approved rerun passed. Prettier has no Python parser, so only repository-supported TypeScript/CSS formatting ran. The existing broad pricing browser suite stops before this feature because its `hy4-preview` calculator option is absent; a focused dropdown-source browser test passed independently.
- Tests: Vitest passed 131/131; `npm run check` passed with 0 errors, warnings, or hints; full `npm run lint` passed; production build passed; focused Playwright verified source names, coverage labels, dates, external-link behavior, desktop/mobile rendering, no horizontal overflow, and no browser errors. Impeccable detector reported only pre-existing stylesheet warnings outside this change.
- Commits: `38748a3` (`docs: define model dropdown data sources`); `478422e` (`feat: add sources to model detail dropdowns`).
- Current state: Every Model Explorer expanded detail resolves relevant benchmark, speed, pricing, and provider-fact sources; duplicate URLs merge their coverage labels, and desktop/mobile render the same compact source list.
- Exact next step: User verifies an expanded model row on `/models`; no further implementation is planned.

## 2026-09-09 — Design the Model Finder decision engine

- Objective: Replace the shallow Model Finder quiz with a deterministic, evidence-aware recommendation design covering multi-use-case intent, priorities, requirements, budgets, eligibility, confidence, and explainable diversified results.
- Files changed: `docs/superpowers/specs/2026-09-09-model-finder-decision-engine-design.md`, `SESSION_LOG.md`.
- Attempts: 1 design and self-review pass.
- Failures/causes: The product brief is deleted in the working tree, so its committed `HEAD` version was used without restoring the user's deletion. Live browser inspection was unavailable because the local Astro dev server exited before becoming ready; the preceding audit used source inspection and direct runtime probes.
- Tests: Design checked against the approved redesign prompt and current catalog coverage; no production code changed.
- Commit: `a700483` (`docs: define model finder decision engine`).
- Current state: The approved design now defines exact metric mappings, eligibility rules, missing-data behavior, formulas, result selection, UI states, and tests. Implementation has not started.
- Exact next step: User reviews the written spec, then implementation planning and implementation can begin.

## 2026-09-09 — Rebuild the Model Finder decision engine

- Objective: Implement the approved consumer-first Model Finder with multi-use intent, explicit priorities, hard requirements, strict/preferred budgets, evidence-aware scoring, confidence, explainable result roles, and a responsive accessible flow.
- Files changed: `src/components/ModelFinder.tsx`, `src/data/canonicalModels.ts`, `src/data/modelFinderConfig.ts`, `src/data/modelRoles.ts`, `src/data/models.ts`, `src/lib/catalogSchema.ts`, `src/lib/modelFinder.ts`, `src/pages/find.astro`, `src/pipeline/types.ts`, `src/styles/global.css`, `tests/browser_flows.py`, `tests/modelFinder.test.ts`, `tests/model_finder_browser.py`, `SESSION_LOG.md`.
- Attempts: 1 implementation pass, 2 interaction corrections, and 1 contrast correction.
- Failures/causes: Custom checkbox markers initially intercepted pointer input; pointer ownership was corrected. Selected rows initially missed AA text contrast in light mode; their description color was strengthened. Sandboxed Wrangler could not write its profile log, so the approved production build ran outside the sandbox. The static browser harness required `dist/client`; a flaky noninteractive mobile load was stabilized with `domcontentloaded`. Impeccable reported only five pre-existing global stylesheet warnings outside this feature.
- Tests: Vitest passed 146/146 across 15 files, including 15 focused decision-engine tests; `npm run check` passed with 0 errors, warnings, or hints; `npm run lint` passed; production build passed; Python browser tests compiled; focused Playwright passed selection limits, importance, disabled evidence states, priorities, hard requirements, preferred/free budgets, explanations, comparison handoff, result focus, light/dark WCAG A/AA/2.1 AA checks, and 320–390 px overflow checks; `git diff --check` passed.
- Commit: `2461245` (`feat: rebuild model finder decision engine`).
- Current state: The Finder now applies deterministic eligibility gates before scoring, renormalizes around available evidence, excludes candidates below 40% task coverage, derives query confidence from catalog confidence and evidence coverage, and returns Best Match, suitability-safe Best Value, and a measurable Alternative without inventing model facts.
- Exact next step: User verifies `/find`; do not extend the implementation until requested.

## 2026-09-09 — Add verified Google Gemini API pricing and provenance

- Objective: Integrate verified, authoritative per-1M input/output/cached token pricing and context limits for Google Gemini models from Google AI Developer Docs (`https://ai.google.dev/pricing`) into the pricing registry, models catalog, and rankings.
- Files changed: `src/data/officialProviders.ts`, `src/data/verifiedModels.json`, `tests/apiPricing.test.ts`, `tests/speedRanking.test.ts`, `tests/intelligenceRanking.test.ts`, `tests/remainingRankings.test.ts`, `SESSION_LOG.md`.
- Attempts: 1 implementation and data-refresh pass.
- Failures/causes: Prettier flagged formatting in generated `verifiedModels.json` (`npx prettier --write` resolved it); ranking unit tests hardcoded `asOf = '2026-09-08'` which failed the `isFresh` test against newly refreshed data retrieved at `'2026-09-09'` (updated test `asOf` to `'2026-09-09'`).
- Tests: Vitest passed 146/146 across 15 files; `npx astro check && npx tsc --noEmit` passed 104 files with 0 errors, 0 warnings, 0 hints; `npm run lint` passed; production `npm run build` completed cleanly in 19.93s; static routes pre-rendered successfully.
- Commit: `8d596f1` (`feat: add verified official Google Gemini API pricing and provenance`).
- Current state: 11 active Google Gemini models (Gemini 3.8 Flash, 3.7 Flash, 3.6 Flash, 3.5 Flash, 3.5 Flash-Lite, 3.1 Pro, 3.1 Flash-Lite, 3 Flash, 2.5 Pro, 2.5 Flash, 2.5 Flash-Lite) now feature verified official pricing, cache storage rates, tiered context pricing, and authoritative provenance metadata.
- Exact next step: User verifies the updated Gemini model pricing on `/pricing` and `/models`; wait for user verification before further changes.
