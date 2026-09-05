# Gemini Task Brief — Use Only Approved External Data Sources

## Goal

Replace unreliable or guessed AI model data with a **strict, externally sourced data pipeline**.

For this version of the project:

- **Do not run your own benchmarks**
- **Do not self-test models**
- **Do not estimate missing performance values**
- **Do not pull benchmark numbers from random web pages**
- **Do not use Reddit, blogs, news articles, SEO pages, or forum posts as authoritative data**
- **Do not invent values to make the UI look complete**

If an approved source does not contain a value for a model, store it as:

```text
null
```

or mark it as unavailable.

Accuracy is more important than completeness.

---

# Source-of-Truth Policy

There is no single universal source of truth.

Use a **specific authoritative source for each type of data**.

## Tier 1 — Official Provider Sources

Use official provider documentation as the source of truth for factual model metadata.

Approved providers include:

- OpenAI
- Anthropic
- Google
- DeepSeek
- xAI
- Mistral
- Meta
- other model providers only when their official documentation is available

Use official provider sources for:

- official model name
- model ID
- release date
- deprecation/status
- API pricing
- input pricing
- output pricing
- cached input pricing
- context window
- maximum output tokens
- vision support
- audio support
- tool/function calling support
- structured output support
- API availability
- open-weight status where applicable

If an official source conflicts with OpenRouter or another aggregator:

> **The official provider wins.**

---

# Approved Performance Data Sources

Use only the following sources for performance-related metrics.

## 1. LiveBench

Use LiveBench primarily for:

- intelligence
- reasoning
- math
- instruction following
- data analysis
- coding evidence

Do not use LiveBench raw scores directly as the site's final 0–100 scores without normalization.

Possible mapping:

```text
Intelligence
├── reasoning
├── math
├── data analysis
└── instruction following
```

Suggested starting formula:

```text
Intelligence =
35% Reasoning
25% Math
20% Data Analysis
20% Instruction Following
```

This is only a starting methodology and should be kept configurable.

LiveBench Coding should contribute to Coding, not be double-counted heavily inside Intelligence.

---

## 2. SWE-bench Verified

Use SWE-bench Verified as the primary source for coding capability.

Prefer results where models are evaluated using:

- the same benchmark version
- the same or directly comparable harness
- the same evaluation setup

Do not compare a model running under a highly optimized custom coding agent against another model running under a basic harness and treat the difference as purely model capability.

Suggested starting formula:

```text
Coding =
70% SWE-bench Verified
30% LiveBench Coding
```

Keep the raw benchmark result and the normalized result separately.

---

## 3. Berkeley Function Calling Leaderboard / BFCL

Use BFCL for agentic and tool-use performance.

Potential signals include:

- function calling
- multi-turn tool use
- tool selection
- error handling
- recovery
- agent workflows
- structured tool interaction

Suggested starting formula:

```text
Agentic =
60% BFCL
40% LMArena Agent Arena
```

Do not use provider marketing claims for agentic scores.

---

## 4. LMArena

Use the official LMArena leaderboard dataset for human-preference and consumer-oriented performance.

Use only official structured LMArena data.

Possible mappings:

```text
Daily Use  ← LMArena Text
Research   ← LMArena Search
Vision     ← LMArena Vision
Agentic    ← LMArena Agent Arena
Web Dev    ← LMArena WebDev
```

Do not scrape random copies of LMArena tables.

Do not treat Arena ratings as final 0–100 scores without normalization.

Keep:

- raw rating
- rank
- confidence bounds if available
- vote/sample count
- snapshot date
- category
- source URL

---

# Approved Fallback / Discovery Source

## OpenRouter

OpenRouter is allowed for:

- model discovery
- model aliases
- provider availability
- API availability
- cross-checking metadata
- temporary metadata gaps

OpenRouter is **not** the primary source of truth for:

- official provider pricing
- official context window
- official model capabilities
- release dates
- performance scores

If OpenRouter conflicts with official provider documentation:

> Use the official provider value.

---

# Sources That Must NOT Be Used for Production Values

Do not automatically import production values from:

- Reddit
- blogs
- Medium
- Substack
- news articles
- YouTube
- social media
- forum posts
- SEO comparison sites
- random benchmark summary websites
- AI-generated summaries
- cached search snippets
- model-provider marketing claims about superiority
- benchmark screenshots
- third-party tables without primary-source provenance

These sources may be useful for research, but not as authoritative production data.

---

# Artificial Analysis

Do not use Artificial Analysis as a core production data source at this stage.

Do not scrape it.

Only integrate it later if the project has appropriate API access and redistribution rights.

---

# Required Metric Mapping

For the current version of the site, use:

| Site Metric | Primary Source |
|---|---|
| Intelligence | LiveBench |
| Coding | SWE-bench Verified + LiveBench Coding |
| Agentic | BFCL + LMArena Agent Arena |
| Daily Use | LMArena Text |
| Research | LMArena Search |
| Vision | LMArena Vision |
| Web Development | LMArena WebDev |
| Pricing | Official provider docs |
| Context Window | Official provider docs |
| Max Output | Official provider docs |
| Tool Support | Official provider docs |
| API Availability | Official provider docs |
| Model Discovery | OpenRouter |
| Overall | Our own derived score |
| Value | Our own derived score |

---

# Metrics We Are NOT Claiming Yet

Do not create unsupported values for:

- reliability
- real-world cost per completed task
- retry rate
- real-world task success rate
- provider-independent latency
- real-world agent completion rate
- self-tested quality

Until reliable external data is available, these should be:

```text
null
```

or explicitly unavailable.

Do not fake them.

---

# Overall Score

The website may calculate a derived Overall score from approved external metrics.

Suggested starting formula:

```text
Overall =
25% Intelligence
20% Coding
15% Agentic
15% Daily Use
10% Research
5% Vision
10% Value
```

This formula must be configurable.

Do not hardcode the weights throughout components.

Store the methodology version.

Example:

```text
methodology_version = "v1-external-only"
```

---

# Value Score

For now, Value may be derived from:

```text
performance relative to official API price
```

Do not label this as "cost per task".

Possible label:

```text
Value Score
```

or:

```text
API Cost Efficiency
```

The real "cost per completed task" feature should be postponed until actual task-level measurements exist.

---

# Normalization

Different benchmarks use incompatible scoring systems.

Do not directly compare:

- Arena rating
- SWE-bench percentage
- LiveBench score
- BFCL score

Create a normalization layer.

For every benchmark record, store:

```text
raw_score
normalized_score
source
benchmark
category
date
sample_count
confidence_bounds
```

Possible normalization methods:

- percentile rank
- relative-to-leader normalization
- min-max normalization within the current cohort
- robust z-score converted to 0–100

Choose one deliberately and document it.

Do not overwrite raw source values.

---

# Missing Data Rules

Missing data is not zero.

If a model does not appear in SWE-bench:

```text
coding_score = null
```

unless enough approved alternative evidence exists to calculate it.

If a model does not appear in LMArena Vision:

```text
vision_score = null
```

Do not guess.

Do not fill missing data using another model from the same family.

Do not infer performance from price, model size, release date, or provider claims.

---

# Model Identity Resolution

Different sources use different names.

Implement explicit canonical mapping.

Example:

```text
Canonical Model
├── official provider ID
├── OpenRouter ID
├── LMArena ID
├── SWE-bench ID
├── LiveBench ID
├── BFCL ID
└── aliases
```

Do not rely only on fuzzy string matching.

Create explicit aliases where necessary.

If identity is ambiguous, skip the record and log it for manual review.

---

# Required Provenance

Every imported production value must include:

```text
value
source_name
source_url
source_type
retrieved_at
source_date
```

Benchmark values should additionally include:

```text
benchmark_name
benchmark_version
category
raw_score
normalized_score
sample_count
confidence_low
confidence_high
harness
```

where available.

If a production value has no recognized source URL:

> Do not store it as verified production data.

---

# Source Priority

Use this exact priority.

## Factual metadata

```text
1. Official provider
2. OpenRouter
3. unavailable
```

## Intelligence

```text
1. LiveBench
2. unavailable
```

## Coding

```text
1. SWE-bench Verified
2. LiveBench Coding
3. unavailable
```

## Agentic

```text
1. BFCL
2. LMArena Agent Arena
3. unavailable
```

## Daily Use

```text
1. LMArena Text
2. unavailable
```

## Research

```text
1. LMArena Search
2. unavailable
```

## Vision

```text
1. LMArena Vision
2. unavailable
```

No other source should be silently substituted.

---

# Data Freshness

Track:

```text
retrieved_at
source_updated_at
score_updated_at
last_verified_at
```

Suggested freshness thresholds:

```text
Official pricing        7 days
Official capabilities   30 days
LMArena                  14 days
LiveBench                30 days
SWE-bench                30 days
BFCL                     30 days
```

Make thresholds configurable.

---

# Database Requirements

Store raw evidence separately from derived scores.

Recommended concepts:

```text
providers
models
model_aliases
model_pricing
model_capabilities
sources
benchmark_results
model_scores
score_history
```

Do not collapse all source evidence into one model row.

---

# Strict Agent Behavior

When retrieving data:

1. Identify the metric.
2. Determine the approved source for that metric.
3. Query only that source first.
4. Validate the model identity.
5. Store the raw result.
6. Store provenance.
7. Normalize only in the scoring layer.
8. If the approved source has no data:
   - return `null`
   - do not search random alternatives
9. Never invent a value.
10. Never use a generic web-search result as the final source.

---

# Web Search Rule

Generic web search may be used only to locate:

- official provider documentation
- official benchmark repositories
- official benchmark datasets

Once found, use the primary source itself.

Do not extract production values from search-result snippets.

---

# Required Data Sources to Integrate

Implement ingestion for:

1. Official provider metadata
2. LiveBench
3. SWE-bench Verified
4. BFCL
5. LMArena official dataset
6. OpenRouter as fallback/discovery

If one source does not expose a stable API, use its official structured dataset/repository.

Do not scrape HTML if an official downloadable or machine-readable source exists.

---

# Initial Model Scope

Focus on approximately 10–15 important current models.

Do not ingest hundreds of OpenRouter models yet.

Create a tracked-model allowlist.

Example:

```ts
export const trackedModels = [
  // canonical verified models only
]
```

Every model must have an explicit canonical identity.

---

# Existing Data Cleanup

Before importing new data:

1. inspect the current model dataset
2. identify values that have no reliable provenance
3. mark unverified data
4. replace it only when approved-source data exists
5. remove guessed scores from production use
6. preserve useful mock data only if clearly labeled as mock/demo

Do not silently preserve incorrect values.

---

# UI Rules

The UI should show unavailable data honestly.

Good:

```text
Coding: —
Not enough approved benchmark data
```

Bad:

```text
Coding: 87
```

when no approved source supports it.

Expose:

- score
- source
- updated date
- confidence where available
- methodology

---

# Methodology Display

The site should eventually support:

```text
Coding Score: 92

Sources
- SWE-bench Verified
- LiveBench Coding

Updated: ...
Methodology: v1-external-only
```

For LMArena-backed scores:

```text
Daily Use: 90

Source
- LMArena Text Arena

Raw rating: ...
Votes: ...
Snapshot: ...
```

---

# Validation

Use Zod or the project's existing validation layer for all imported external payloads.

Reject malformed values.

Do not silently coerce invalid data.

Log:

- unknown model IDs
- unmatched aliases
- missing expected fields
- stale data
- conflicting official values

---

# Conflict Rules

If two approved sources disagree:

## Factual metadata

Official provider wins.

## Benchmark scores

Do not overwrite one benchmark with another.

Store both separately.

The scoring engine should combine them according to methodology.

Example:

```text
SWE-bench result
LiveBench Coding result
```

remain separate evidence records.

---

# What You Must NOT Do

Do not:

- run new model benchmarks
- call model APIs to self-evaluate models
- create custom tests
- scrape random websites
- invent missing values
- use search snippets as evidence
- infer capability from model branding
- use provider self-reported benchmark claims as independent evidence
- copy values from Artificial Analysis
- fill missing data with an average
- treat missing as zero
- silently merge incompatible benchmark variants
- compare incompatible agent harnesses without labeling them

---

# Acceptance Criteria

The task is complete when:

1. Every production metric has an approved source.
2. Official provider data is used for factual metadata.
3. LiveBench is used for intelligence-related data.
4. SWE-bench Verified is used for coding.
5. BFCL is used for agentic/tool-use performance.
6. LMArena is used for consumer preference, research, vision, and agent evidence.
7. OpenRouter is only fallback/discovery.
8. Unsupported values are `null`.
9. Raw benchmark scores are preserved.
10. Derived 0–100 scores are calculated separately.
11. Provenance exists per value.
12. Model aliases are explicit.
13. Conflicting source data is not silently merged.
14. Incorrect/unverified existing values are removed from production use.
15. No independent self-testing is performed.
16. No random web source is used as production evidence.
17. The methodology is documented.
18. The pipeline can be refreshed later without manually editing every model.

---

# Execution Instructions

First inspect the existing repository and determine:

- current schema
- current mock/real data
- current scoring code
- model aliases
- existing source tracking
- ingestion scripts

Then produce a short audit:

```text
Verified data
Unverified data
Incorrect data
Missing data
```

After the audit, implement the corrected data pipeline.

Do not redesign unrelated UI.

Do not rewrite working architecture unless necessary.

At the end, report:

- sources integrated
- models supported
- values removed because they were unverified
- remaining missing fields
- scoring methodology
- files changed
- commands to refresh data
- known limitations

The objective is:

> **A trustworthy external-data-only AI model comparison system where every production value can be traced back to an approved authoritative source.**
