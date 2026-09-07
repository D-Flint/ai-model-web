# LiveBench and OpenRouter metric completion design

## Goal

Populate missing visible metrics from authoritative source data:

- Add LiveBench Agentic Coding and other native category values to the local release snapshot and UI.
- Add OpenRouter recent throughput ranges such as `20–40 tok/s`.
- Preserve `null` when a source does not publish a value.
- Never infer, estimate, or relabel one benchmark category as another category.

## Current cause

The local `livebenchData.json` snapshot and `liveBenchRowSchema` omit `agentic_coding`. `ModelExplorer.tsx` also assigns `null` directly to its Agentic Coding column. The pipeline can ingest intelligence and coding from LiveBench, but cannot ingest Agentic Coding until the field exists in the validated snapshot.

The current catalog uses product-facing score names (`dailyUse`, `research`, `writing`, `vision`, and `reliability`) that do not all match LiveBench categories. The Explorer already has LiveBench-native columns, so those columns must read native fields directly:

| Explorer metric | LiveBench field |
| --- | --- |
| Overall | `global_average` |
| Reasoning | `reasoning` |
| Coding | `coding` |
| Agentic Coding | `agentic_coding` |
| Mathematics | `math` |
| Data Analysis | `data_analysis` |
| Language | `language` |
| Instruction Following | `instruction_following` |

## Recommended approach

### 1. Refresh and validate LiveBench release data

Use the current official LiveBench release artifact. Store one normalized row per model in `src/data/livebenchData.json`, including `agentic_coding` and `language` when present. Add both fields to `liveBenchRowSchema` as validated 0–100 numbers.

Do not create values from the old row fields. If a model lacks a category in the official release, keep that category `null` or omit it according to the source artifact and render `—`.

### 2. Ingest Agentic Coding

Extend `processLiveBenchResults` to emit an `agentic` `BenchmarkMeasurement` from `row.agentic_coding`. When LiveBench Agentic Coding exists, use that measurement as the published `scores.agentic` value; do not average BFCL into that value. Keep BFCL available as separate historical ingestion data, but do not let it populate the LiveBench-native Explorer column or dilute the LiveBench score.

Update `ModelExplorer` to use `lbRow.agentic_coding` instead of a hardcoded `null`, and use `lbRow.language` instead of the current derived language fallback when the field exists.

### 3. Import OpenRouter throughput

Keep the existing OpenRouter model-list request for identity, pricing, and metadata. For matched canonical models, request the documented OpenRouter endpoint details:

`GET /api/v1/models/{author}/{slug}/endpoints`

Read `throughput_last_30m.p50` from healthy endpoint records. Use finite positive values only. Aggregate values by model:

- one value: display `N tok/s`;
- multiple values: display `min–max tok/s`;
- no values or failed request: display `—` and record a non-fatal refresh warning.

Store the range separately from the existing scalar `facts.speedTokensPerSec` so current consumers remain compatible. Add OpenRouter source provenance and retrieval date to the speed range. Do not turn throughput into a 0–100 benchmark score unless a documented normalization is added later.

Use bounded concurrency for endpoint requests. A single model request failure must not discard the catalog or unrelated source data. Preserve previous data only if the refresh workflow explicitly supports snapshot retention; otherwise publish `null` for that refresh.

OpenRouter documents throughput as recent endpoint performance, not a permanent model property. UI labels must identify it as `OpenRouter recent throughput` and include retrieval date/source details.

## Data flow

```text
LiveBench release artifact
  -> Zod row validation
  -> canonical alias resolution
  -> native category measurements
  -> catalog scores and Explorer columns

OpenRouter model list + endpoint details
  -> model identity resolution
  -> healthy endpoint p50 throughput values
  -> per-model min/max range
  -> facts and Explorer speed display
```

## Error handling and integrity

- Invalid LiveBench category values fail row validation.
- Missing LiveBench category values remain `null`.
- OpenRouter endpoint HTTP errors are warnings, not catalog-fatal errors.
- Unresolved model aliases are excluded and reported for review.
- Every new evidence record references a dated HTTPS source.
- No fallback from BFCL, SWE-bench, LMArena, or estimates into LiveBench Agentic Coding.
- No fallback from OpenRouter throughput into fabricated speed values.

## Tests

Add focused tests for:

1. LiveBench schema acceptance of `agentic_coding` and `language`.
2. Agentic Coding measurement normalization and provenance.
3. Explorer field mapping for all eight LiveBench-native columns.
4. OpenRouter endpoint schema validation, p50 filtering, single-value display, range display, and empty/error handling.
5. Catalog validation with Agentic Coding evidence.
6. Existing ranking, comparison, build, and full test behavior.

## Acceptance criteria

- Visible models with LiveBench Agentic Coding data show numeric Agentic Coding values.
- LiveBench-native category columns show source values without category relabeling.
- Models with OpenRouter throughput show a truthful scalar or range with `tok/s`.
- Missing source values still render `—`, never zero or guessed numbers.
- Source and retrieval date remain inspectable.
- `npm test`, `npm run check`, `npm run build`, and relevant lint checks pass.
- Data refresh failure does not silently publish malformed metrics.

## Sources

- [LiveBench leaderboard](https://livebench.ai/)
- [LiveBench redesigned leaderboard data layout](https://github.com/LiveBench/new-livebench)
- [OpenRouter model list API](https://openrouter.ai/docs/api/api-reference/models/get-models)
- [OpenRouter model endpoint API](https://openrouter.ai/docs/api/api-reference/endpoints/list-all-endpoints-for-a-model)
