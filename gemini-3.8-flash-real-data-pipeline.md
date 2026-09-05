# Gemini 3.8 Flash Task Brief — Build the Real AI Model Data Pipeline

## Role

You are the implementation agent responsible for connecting this project to **real, verifiable AI model data**.

Work inside the existing repository. Inspect the project first before changing anything.

The website is a consumer-friendly AI model comparison platform built around:

- Astro
- React
- TypeScript
- Tailwind CSS
- PostgreSQL
- Drizzle ORM
- Zod
- TanStack Table
- Recharts

The product helps normal users understand which AI model to choose without requiring benchmark expertise.

Your task is to replace mock/sample model data with a maintainable, source-tracked real-data pipeline.

---

# Primary Goal

Build a reliable ingestion and normalization system that gathers model data from reputable sources, stores it in PostgreSQL, tracks provenance, and feeds the site's scoring system.

Do **not** invent current model values.

Do **not** hardcode guessed benchmark scores.

Do **not** scrape websites unless no better structured source exists.

Preferred source order:

1. Official APIs
2. Official downloadable datasets
3. Public/licensed benchmark datasets
4. Official documentation
5. Scraping only as a last resort

---

# Data Sources

## 1. OpenRouter

Use OpenRouter primarily for:

- model IDs
- model names
- provider information
- pricing
- context length
- input modalities
- output modalities
- supported parameters
- model availability
- API metadata

Primary endpoint:

```text
https://openrouter.ai/api/v1/models
```

If authentication is required for any endpoint, read the API key from environment variables.

Suggested environment variable:

```text
OPENROUTER_API_KEY=
```

Never commit API keys.

Use `.env.example` for documentation.

OpenRouter data should not automatically override official-provider information when the official provider is more authoritative.

---

## 2. LMArena / Hugging Face

Use the public LMArena leaderboard dataset for human-preference and category-specific evaluation data where licensing permits.

Potential uses:

- general text preference
- daily-use quality
- agent performance
- search/research
- factuality
- vision
- other available leaderboard categories

Retrieve structured dataset files or Hugging Face-hosted data rather than scraping leaderboard HTML.

Store:

- model name
- arena/category
- rating/score
- rank
- confidence bounds if available
- vote/sample count
- snapshot date
- source URL
- retrieved date

Do not assume that Arena ratings can be used directly as a 0–100 score.

Normalize them through the scoring pipeline.

---

## 3. SWE-bench

Use SWE-bench Verified and standardized leaderboard results for coding capability.

Prefer comparisons where models are evaluated under the same or comparable agent harness.

Potential fields:

- model
- benchmark variant
- resolved percentage
- agent/harness
- evaluation date
- cost if available
- run metadata

Do not mix incompatible harnesses without explicitly accounting for the difference.

SWE-bench should contribute evidence to:

- Coding
- Agentic Coding
- Cost Efficiency for coding tasks

---

## 4. Official Provider Sources

Use official provider sources as the source of truth for factual product metadata.

Providers may include:

- OpenAI
- Anthropic
- Google
- DeepSeek
- xAI
- Mistral
- Meta
- others later

Use official sources for:

- official model name
- release date
- pricing
- context window
- maximum output tokens
- vision support
- audio support
- tool/function calling
- structured output support
- API availability
- model status/deprecation

Where possible, use structured APIs or official JSON.

If official documentation must be parsed manually, isolate that logic so it is easy to update.

---

# Do Not Use Artificial Analysis as a Core Public Data Source Yet

Do not depend on Artificial Analysis for the public production dataset unless the project's license and redistribution rights are confirmed.

It may be used later if the project obtains appropriate API access and redistribution permission.

Do not scrape Artificial Analysis.

---

# Architecture Requirements

Create a clear data flow:

```text
External Sources
      ↓
Source-specific adapters
      ↓
Validation
      ↓
Normalization
      ↓
Database
      ↓
Derived scoring pipeline
      ↓
Website
```

Keep source-specific code separate from scoring logic.

A source adapter should not decide the site's final consumer score.

---

# Suggested Project Structure

Adapt this to the existing repository rather than forcing it blindly:

```text
src/
  data/
    providers/
    scoring/
    normalization/
    sources/
    types/

scripts/
  ingest-openrouter.ts
  ingest-lmarena.ts
  ingest-swebench.ts
  verify-official-data.ts
  calculate-scores.ts
  refresh-all-data.ts

db/
  schema/
  migrations/

tests/
  data/
  scoring/
```

If the repository already has a better structure, preserve it and integrate cleanly.

---

# Database Requirements

Use PostgreSQL with Drizzle ORM.

At minimum, support the following concepts.

## providers

```text
id
slug
name
website_url
created_at
updated_at
```

## models

```text
id
slug
name
provider_id
family
release_date
status
description
context_window
max_output_tokens
supports_vision
supports_audio
supports_tools
supports_structured_output
open_weights
api_available
last_verified_at
created_at
updated_at
```

## model_pricing

```text
id
model_id
provider_name
input_per_million
output_per_million
cached_input_per_million
currency
source_id
effective_from
last_verified_at
created_at
updated_at
```

## sources

```text
id
name
url
source_type
publisher
license_notes
retrieved_at
published_at
created_at
```

## benchmark_results

```text
id
model_id
benchmark_name
benchmark_category
raw_score
normalized_score
rank
sample_count
confidence_low
confidence_high
harness
evaluation_date
source_id
metadata_json
created_at
```

## model_scores

```text
id
model_id
overall
intelligence
coding
agentic
daily_use
research
writing
vision
speed
reliability
cost_efficiency
confidence
methodology_version
score_updated_at
```

## score_history

```text
id
model_id
score_type
score_value
confidence
methodology_version
recorded_at
```

Use appropriate numeric types.

Do not store prices as imprecise floating-point values if avoidable.

---

# Validation

Use Zod for every external payload.

Every ingestion adapter must:

1. fetch or load source data,
2. validate it,
3. reject malformed records,
4. log useful diagnostics,
5. normalize into internal types,
6. write to the database.

Do not silently accept malformed data.

Create reusable internal types.

---

# Model Identity Resolution

Different sources often use different names for the same model.

Implement a model alias / identity mapping system.

Example concept:

```text
Canonical Model
  ├── official name
  ├── OpenRouter ID
  ├── LMArena name
  ├── SWE-bench name
  └── aliases
```

Do not match models using fragile substring logic alone.

Create explicit aliases where needed.

Possible table:

```text
model_aliases
- id
- model_id
- source_name
- source_model_id
- alias
```

---

# Provenance

Every imported fact must be traceable.

For each externally sourced value, retain:

- source
- source URL
- retrieved date
- published/evaluation date where available
- raw value
- normalized value if applicable

The UI should eventually be able to answer:

> "Where did this number come from?"

Never fabricate citations or provenance.

---

# Freshness

Track:

```text
last_verified_at
source_updated_at
score_updated_at
```

Where appropriate.

Add logic to identify stale data.

Suggested initial thresholds:

- pricing: stale after 7 days
- model availability: stale after 7 days
- benchmark data: stale after 30 days
- official capabilities: stale after 30 days

Keep thresholds configurable.

Do not delete older historical benchmark data just because a newer snapshot exists.

---

# Scoring Pipeline

The website uses consumer-facing 0–100 scores.

Do not use external leaderboard values directly as final scores.

Create a normalization layer.

Suggested score groups:

## Performance

- Intelligence
- Coding
- Agentic
- Daily Use
- Research
- Writing
- Vision

## Experience

- Speed
- Reliability

## Economics

- Cost Efficiency

## Composite

- Overall

---

# Scoring Rules

The scoring system must be:

- deterministic
- versioned
- configurable
- explainable
- testable

Do not scatter weights throughout UI components.

Create a central scoring configuration.

Example:

```ts
export const scoringConfig = {
  methodologyVersion: "1.0.0",
  overall: {
    intelligence: 0.25,
    coding: 0.18,
    agentic: 0.15,
    dailyUse: 0.12,
    research: 0.10,
    reliability: 0.08,
    writing: 0.05,
    vision: 0.03,
    speed: 0.02,
    costEfficiency: 0.02,
  },
}
```

Weights may be adjusted after inspecting available evidence.

---

# Normalization

External benchmarks have different scales.

Create normalization functions that transform raw benchmark results into comparable 0–100 evidence scores.

Possible methods:

- percentile rank
- min-max within a benchmark cohort
- robust z-score followed by bounded conversion
- relative-to-current-leader normalization

Select methods deliberately and document them.

Avoid misleading precision.

Keep raw values available alongside normalized values.

Never overwrite the original source measurement.

---

# Missing Data

Do not treat missing data as zero.

If a model lacks evidence for a category:

- mark it as missing,
- reduce confidence,
- calculate scores only from available evidence where defensible,
- avoid ranking the model as definitively worse solely because no benchmark exists.

Expose missing-data state to the UI.

---

# Confidence Score

Implement a confidence score for each derived model score.

Confidence should consider:

- number of independent sources
- source quality
- sample/vote count
- recency
- benchmark coverage
- consistency between sources
- amount of internal testing

Suggested output:

```text
Coding: 94
Confidence: 87%
```

Do not imply scientific certainty.

---

# Initial Metric Mapping

Use the following only as a starting point.

## Coding

Evidence may include:

- SWE-bench Verified
- standardized agentic coding tests
- internal coding tests
- relevant human-preference coding data

## Agentic

Evidence may include:

- agent leaderboards
- standardized coding-agent results
- tool-use evaluations
- internal multi-step agent tasks

## Daily Use

Evidence may include:

- LMArena human preference
- internal normal-user tasks
- writing quality
- reasoning quality
- reliability
- latency

## Research

Evidence may include:

- search/research leaderboards
- factuality
- citation quality
- internal multi-source research tests

## Vision

Evidence may include:

- vision arena/evaluations
- document/image understanding evaluations

## Reliability

Evidence may include:

- factuality
- retry rate
- task completion rate
- failure rate
- malformed structured outputs
- instruction-following failures

## Cost Efficiency

Do not score it from raw API price alone.

Consider:

```text
Effective Cost Per Task
=
Average Cost Per Attempt
×
Average Number of Attempts Required
```

or:

```text
Expected Cost To Success
=
Average Attempt Cost / Success Probability
```

Use actual task measurements once internal test data exists.

Until then, clearly mark cost-per-task values as estimates.

---

# Internal Testing Support

Prepare the data model for future first-party tests.

Create task profiles such as:

```text
daily_chat
email_writing
document_summary
research
bug_fix
small_feature
multi_file_agent
landing_page
```

Store:

```text
model_id
task_profile
success
quality_score
input_tokens
output_tokens
latency_ms
cost
attempts
tool_calls
failure_reason
tested_at
```

Do not fake internal test results.

The pipeline should support them when real testing begins.

---

# Refresh Strategy

Create runnable commands for:

```text
ingest OpenRouter
ingest LMArena
ingest SWE-bench
refresh official metadata
recalculate scores
refresh everything
```

Use the project's existing package manager.

Do not assume npm if the repo uses pnpm or bun.

---

# Automation Readiness

Design ingestion so it can later run from:

- GitHub Actions
- cron
- scheduled server job

But do not add unnecessary production automation until the local pipeline works.

A future refresh schedule could be:

```text
OpenRouter metadata/pricing: daily
Official provider verification: daily or weekly
LMArena: daily/weekly
SWE-bench: weekly
Score recalculation: after successful ingestion
```

---

# Error Handling

The refresh pipeline must not destroy good production data because one source fails.

Requirements:

- source-specific transactions where appropriate
- graceful partial failure
- clear logs
- non-zero exit code on critical failure
- avoid truncating tables before successful replacement data is ready

Prefer upserts over destructive full replacement where practical.

---

# Rate Limiting and Responsible Access

Respect:

- API rate limits
- robots.txt where applicable
- dataset licenses
- provider terms
- attribution requirements

Do not implement aggressive scraping.

Add request throttling/retry logic where needed.

Use exponential backoff for transient API errors.

---

# Environment Variables

Create/update `.env.example`.

Possible variables:

```text
DATABASE_URL=
OPENROUTER_API_KEY=
HF_TOKEN=
```

`HF_TOKEN` should only be required if necessary.

Do not commit secrets.

---

# UI Integration

After the data layer works, connect the existing UI to real data.

The site should read:

- models
- pricing
- scores
- benchmark evidence
- freshness
- confidence
- sources

from the database.

Remove mock data only after equivalent real data paths work.

Do not break the existing UI while replacing mocks.

If real data is missing, show an explicit unavailable state instead of a guessed fallback.

---

# Methodology UI

Ensure the backend can support a future expandable section such as:

```text
Coding Score: 94
Confidence: 87%

How this was calculated
- SWE-bench Verified
- LMArena coding preference
- internal coding tests

Last updated: ...
Sources: ...
Methodology version: ...
```

The data layer must make this possible.

---

# Initial Implementation Scope

For the first implementation, focus on approximately **10–15 important current models**.

Do not try to ingest every model available on OpenRouter.

Create a configurable allowlist.

Before adding a model to the list, verify its canonical identity.

---

# Tests

Add tests for:

- OpenRouter payload validation
- model alias resolution
- benchmark normalization
- score calculation
- confidence calculation
- price conversion
- missing-data behavior
- duplicate prevention
- cost-per-task math

Do not rely only on manual testing.

---

# Documentation

Create a concise developer document:

```text
docs/data-pipeline.md
```

It should explain:

- sources
- ingestion flow
- environment variables
- database tables
- refresh commands
- scoring flow
- provenance
- normalization
- adding a new model
- adding a new data source
- troubleshooting

---

# Acceptance Criteria

The task is complete when:

1. The repository contains a structured data ingestion layer.
2. OpenRouter model metadata can be imported.
3. LMArena data can be imported from a structured dataset source.
4. SWE-bench results can be imported from a structured source.
5. External payloads are validated.
6. Models from multiple sources can be mapped to canonical identities.
7. Raw source measurements are preserved.
8. Provenance is stored.
9. Freshness timestamps are stored.
10. Derived scores are calculated separately from ingestion.
11. Scores are versioned.
12. Missing data does not become zero.
13. Confidence values are supported.
14. Mock production scores are no longer required for models with real data.
15. Existing pages can query real model data.
16. No API keys are committed.
17. The pipeline is documented.
18. Critical scoring and normalization functions are tested.
19. No current model facts are guessed.
20. No restricted dataset is scraped or redistributed without permission.

---

# Execution Instructions

Start by inspecting:

- package manager
- Astro configuration
- database setup
- Drizzle schema
- existing mock data
- scoring code
- current model types
- current page data loading

Then provide a short implementation plan before editing.

After that, implement in logical stages.

Do not rewrite unrelated parts of the application.

Do not redesign the UI unless required for real-data integration.

Do not remove working mock data until the real-data path is functional.

Do not invent model scores to make the UI look complete.

When uncertain about a current model fact, retrieve it from an authoritative source or leave it unavailable.

At the end, report:

- files changed
- sources integrated
- commands to run
- required environment variables
- migrations required
- models currently supported
- known data gaps
- next recommended step

The objective is to create a **trustworthy, maintainable real-data foundation** for the AI model comparison website.
