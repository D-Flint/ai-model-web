# AI Model Guide — Complete Product & Implementation Brief

## 1. Role

You are the lead product engineer, UX designer, data architect, and technical strategist for a new consumer-focused AI model comparison website.

Your job is to design and implement the product described below as a polished, production-oriented web application.

Do not treat this as a benchmark dashboard for researchers. The target audience is normal users who want a clear answer to:

> **"Which AI model should I use for what I want to do?"**

The product should make AI model selection simple, transparent, useful, and understandable without requiring users to know benchmark terminology, token economics, or model architecture.

---

# 2. Product Vision

Build a modern AI model comparison and recommendation website that helps users:

- discover AI models,
- understand what each model is good at,
- compare models side by side,
- understand real-world pricing,
- estimate cost per task,
- find the best model for a specific use case,
- understand tradeoffs,
- and choose a model confidently.

The product should feel more like:

- a clean consumer comparison site,
- a decision engine,
- or "PCPartPicker for AI models",

rather than a technical leaderboard such as Artificial Analysis, Terminal-Bench, or DeepSWE.

The website must translate technical measurements into useful consumer-facing scores.

---

# 3. Core Product Principles

## 3.1 Consumer-first

Never assume the visitor understands:

- GPQA,
- SWE-bench,
- MMLU,
- HumanEval,
- tokens per second,
- TTFT,
- ELO,
- context utilization,
- function calling benchmarks,
- or other technical benchmark terminology.

Technical data may exist underneath the interface, but the main UI should expose simple metrics such as:

- Overall
- Intelligence
- Coding
- Agentic Use
- Daily Use
- Research
- Writing
- Vision
- Speed
- Reliability
- Cost Efficiency

All major scores should use a **0–100 numerical scale**.

Avoid vague labels such as:

- Bad
- Mid
- Good
- Excellent

Those can optionally appear as secondary explanatory text, but the numerical score must remain primary.

---

## 3.2 Explainability

Every score must be explainable.

If a model has:

> Coding: 94

the user should be able to click or expand:

> "How was this calculated?"

and see:

- source benchmarks,
- first-party testing,
- normalization method,
- source dates,
- score weighting,
- confidence level.

Do not create arbitrary scores with no methodology.

---

## 3.3 Practical usefulness over benchmark worship

A model with a slightly higher benchmark score is not automatically the better recommendation.

Recommendations must also consider:

- price,
- reliability,
- retries,
- speed,
- task completion rate,
- availability,
- modality support,
- use-case fit,
- and effective cost per completed task.

---

## 3.4 Clean design

The interface should be:

- modern,
- minimal,
- highly readable,
- calm,
- spacious,
- data-focused,
- professional,
- and accessible.

Avoid:

- excessive neon,
- cyberpunk themes,
- AI circuit graphics,
- heavy glassmorphism,
- excessive gradients,
- cluttered benchmark dashboards,
- dense enterprise analytics aesthetics.

---

# 4. Target Audience

Primary users:

1. People deciding between ChatGPT, Claude, Gemini, DeepSeek, etc.
2. Developers deciding which API model to use.
3. Students choosing an AI assistant.
4. Writers and researchers.
5. People using coding agents.
6. Users trying to minimize AI costs.
7. Users who know model names but do not understand benchmarks.
8. Users who only know what task they want to accomplish.

The site should be useful to both technical and non-technical visitors, but the default experience must favor non-technical users.

---

# 5. Recommended Tech Stack

Use:

- **Astro**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **PostgreSQL**
- **Drizzle ORM**
- **TanStack Table**
- **Recharts**
- Astro server rendering or static generation where appropriate

React must be used as interactive islands rather than turning the entire website into a SPA.

## Astro responsibilities

Use Astro for:

- routing,
- layouts,
- model detail pages,
- SEO pages,
- rankings pages,
- comparison landing pages,
- static content,
- server-rendered content,
- metadata,
- sitemap generation.

## React responsibilities

Use React only where interactivity materially improves the experience:

- comparison builder,
- model selector,
- filtering,
- sorting,
- cost calculator,
- score charts,
- recommendation wizard,
- interactive methodology breakdowns.

---

# 6. Visual Direction

## Theme

Use a **Soft Data / Modern Utility** visual style.

Design inspiration:

- Linear
- Vercel
- Stripe
- Raycast

Do not copy any product directly.

## Light mode

Suggested palette:

- Background: `#F8F9FB`
- Surface: `#FFFFFF`
- Primary text: `#111318`
- Secondary text: `#667085`
- Border: `#E5E7EB`
- Accent: `#6366F1`
- Accent soft: `#EEF2FF`

## Dark mode

Suggested palette:

- Background: `#0B0D10`
- Surface: `#12151A`
- Primary text: `#F5F7FA`
- Secondary text: `#9299A5`
- Border: `#252932`
- Accent: `#818CF8`

## Design rules

- 12–16px card radius
- restrained shadows
- subtle borders
- generous spacing
- strong typographic hierarchy
- numbers should dominate score visualizations
- avoid decorative noise
- use animation sparingly
- transitions should feel fast and intentional
- prioritize legibility

Recommended fonts:

- Geist
- Inter
- Manrope

---

# 7. Information Architecture

Primary navigation:

- Home
- Models
- Compare
- Rankings
- Find a Model
- Cost Calculator
- Methodology

Suggested routes:

```text
/
/models
/models/[slug]
/compare
/compare/[model-a]-vs-[model-b]
/rankings
/rankings/coding
/rankings/agents
/rankings/daily-use
/rankings/research
/rankings/writing
/rankings/value
/find
/cost
/methodology
```

Future routes:

```text
/best/[use-case]
/use-cases/[slug]
/providers/[slug]
/benchmarks/[slug]
```

---

# 8. MVP Feature Set

Build the MVP around these features.

## Feature 1 — Model Explorer

Create a searchable and filterable directory of supported AI models.

Each model card should show:

- Model name
- Provider
- Overall score
- Coding score
- Agentic score
- Daily-use score
- Input price
- Output price
- Context window
- Best-for tags
- Compare button
- View details button

Filters:

- Provider
- Overall score
- Price
- Coding score
- Agentic score
- Daily-use score
- Research score
- Vision support
- API availability
- Open-weight status
- Context window

Sorting:

- Overall
- Intelligence
- Coding
- Agentic
- Daily Use
- Research
- Speed
- Reliability
- Cost Efficiency
- Lowest price
- Highest context

---

## Feature 2 — Model Comparison

This is the flagship feature.

Allow users to compare 2–4 models side by side.

Comparison rows:

### Performance

- Overall
- Intelligence
- Coding
- Agentic Use
- Daily Use
- Writing
- Research
- Vision

### Experience

- Speed
- Reliability
- Ease of use
- Availability

### Economics

- Input price
- Output price
- Cost efficiency
- Estimated cost per task

### Technical facts

- Context window
- Maximum output
- Vision
- Audio
- Tool use
- Structured output
- API availability
- Open weights

Visually highlight:

- best score in each row,
- cheapest price,
- best value,
- major tradeoffs.

Do not overuse green/red colors.

At the bottom provide a simple verdict:

- Best Overall
- Best Value
- Best for Coding
- Best for Agents
- Best for Daily Use

Also provide plain-language decision guidance:

> Choose Model A if...

> Choose Model B if...

---

# 9. Model Detail Page

Every model should have a dedicated SEO-friendly page.

Example structure:

```text
Claude Sonnet

Overall Score
92

Best for
Coding • Agents • Complex tasks
```

Sections:

## Overview

- Provider
- Release date
- Model family
- Status
- Available through
- Key strengths
- Major weaknesses

## Scores

Display:

- Overall
- Intelligence
- Coding
- Agentic Use
- Daily Use
- Writing
- Research
- Vision
- Speed
- Reliability
- Cost Efficiency

Use numerical values from 0–100.

## Pricing

Show:

- input price per 1M tokens,
- output price per 1M tokens,
- cached input if applicable,
- provider pricing differences,
- estimated typical task cost.

## Best For

Examples:

- coding agents,
- complex reasoning,
- casual chat,
- research,
- long-context work.

## Not Ideal For

Explain clear limitations.

## Alternatives

Recommend:

- cheaper alternative,
- faster alternative,
- stronger alternative,
- better everyday option.

## Evidence

Show:

- score sources,
- benchmark evidence,
- internal test results,
- data freshness,
- methodology.

---

# 10. Rankings

Provide use-case-oriented rankings instead of one universal leaderboard.

Initial ranking pages:

- Best AI Models Overall
- Best AI Models for Coding
- Best AI Models for Agents
- Best AI Models for Daily Use
- Best AI Models for Research
- Best AI Models for Writing
- Best Value AI Models
- Best Cheap AI Models
- Best Vision Models

Each ranking should explain:

- why the model ranks where it does,
- what it is best for,
- its biggest downside,
- who should choose it.

Do not display only a table.

---

# 11. Model Finder

Build a simple recommendation wizard for people who do not know which model to choose.

Question 1:

> What do you mainly want AI for?

Options:

- Coding
- Daily use
- Study
- Writing
- Research
- Agentic workflows
- Image / vision
- Mixed use

Question 2:

> What matters most?

Options:

- Best quality
- Lowest cost
- Fastest
- Best value
- Most reliable
- Balanced

Question 3:

Optional budget preference:

- Free
- Very cheap
- Moderate
- Cost does not matter

Return:

- Best choice
- Best value choice
- Alternative

For each result explain:

- why it was selected,
- major advantage,
- major tradeoff,
- estimated cost.

The recommendation algorithm must be deterministic and explainable.

---

# 12. Cost Calculator

The calculator should avoid forcing normal users to estimate token counts.

Offer two modes.

## Simple mode

Examples:

> How much do you use AI?

- 5 messages/day
- 20 messages/day
- 50 messages/day
- Heavy daily use

or:

> What type of work?

- casual chat,
- coding,
- document analysis,
- research,
- agentic coding.

Estimate monthly cost across selected models.

## Advanced mode

Allow direct input of:

- input tokens,
- output tokens,
- requests per day,
- days per month.

Calculate:

- cost per request,
- cost per day,
- cost per month.

---

# 13. Cost Per Task

This should become one of the site's signature features.

Raw token pricing is insufficient because a cheaper model may require:

- more retries,
- more tokens,
- more corrections,
- more tool calls.

Define:

```text
Effective Cost Per Task =
Average Cost Per Attempt
×
Average Number of Attempts Required
```

A more advanced version may account for success probability:

```text
Expected Cost To Success =
Average Attempt Cost / Success Probability
```

For agentic workloads, optionally include:

- tool calls,
- reasoning tokens,
- retry cost,
- repair attempts.

Examples of real-world task categories:

- answer a normal question,
- write an email,
- summarize a document,
- research a topic,
- fix a code bug,
- implement a small feature,
- build a landing page,
- complete a multi-file coding task.

Clearly label these as estimates when they are based on sampled workloads.

---

# 14. Scoring System

Scores use a **0–100 scale**.

Do not create fake precision.

Every score must have:

- value,
- methodology,
- source list,
- updated date,
- confidence.

Recommended score groups:

## Performance

- Intelligence
- Coding
- Agentic Use
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

# 15. Score Methodology

Do not simply average raw benchmark values.

Different benchmarks have incompatible scales.

Use a normalized scoring pipeline.

Suggested process:

1. Gather raw data.
2. Validate sources.
3. Normalize benchmark values.
4. Remove obsolete or invalid measurements.
5. Group benchmarks by capability.
6. Calculate capability scores.
7. Blend benchmark scores with internal testing.
8. calculate confidence.
9. compute Overall independently.

Example:

```text
Coding Score =
40% public coding benchmarks
35% internal real-world coding tests
15% agentic coding performance
10% reliability
```

Example:

```text
Daily Use Score =
35% human preference data
25% internal daily-use tests
15% writing
10% reasoning
10% reliability
5% speed
```

Example:

```text
Agentic Score =
35% tool-use benchmarks
30% internal agent tests
20% coding-agent performance
15% reliability
```

These weights are a starting point and should be stored as configuration rather than hardcoded across components.

---

# 16. Overall Score

Do not let price dominate Overall quality.

Suggested initial weighting:

```text
Overall =
25% Intelligence
18% Coding
15% Agentic
12% Daily Use
10% Research
8% Reliability
5% Writing
3% Vision
2% Speed
2% Cost Efficiency
```

This formula is provisional.

Store scoring weights centrally so they can be changed without rewriting the application.

Also expose specialized scores independently.

A user should be able to see:

```text
Overall:      92
Coding:       96
Agentic:      95
Daily Use:    88
Value:        79
```

---

# 17. Confidence Score

A model score should also have a confidence level.

Example:

```text
Coding: 94
Confidence: 87%
```

Confidence should depend on:

- number of independent sources,
- source quality,
- data recency,
- number of internal tests,
- variance between tests,
- benchmark coverage.

Do not allow confidence to falsely imply scientific certainty.

---

# 18. Data Sources

Use a hybrid data strategy.

## Tier 1 — Official Sources

Use model-provider documentation as the source of truth for:

- model name,
- pricing,
- context window,
- modalities,
- API availability,
- structured outputs,
- tool use,
- release information,
- maximum output size.

Examples:

- OpenAI
- Anthropic
- Google
- DeepSeek
- xAI
- Mistral
- Meta

Store source URL and retrieval date.

---

## Tier 2 — Public Evaluation Sources

Potential sources include:

- LM Arena
- SWE-bench
- Hugging Face leaderboards
- public benchmark repositories
- model technical reports
- provider-published evaluations
- reputable independent evaluation suites

Do not blindly trust a single benchmark.

Keep benchmark provenance.

---

## Tier 3 — Aggregator APIs

Use public or licensed APIs where useful.

Potential uses:

- model pricing,
- provider availability,
- API routing,
- context metadata.

Do not scrape or republish proprietary databases when licensing does not permit redistribution.

Respect:

- terms of service,
- licensing,
- rate limits,
- attribution requirements.

---

## Tier 4 — Internal Testing

Create a small controlled real-world evaluation suite.

Initial categories:

### Daily use

- explanation quality,
- summarization,
- rewriting,
- planning,
- question answering.

### Coding

- bug fixing,
- feature implementation,
- code explanation,
- refactoring,
- tests.

### Research

- multi-source synthesis,
- factual retrieval,
- comparison,
- citation quality.

### Agentic

- multi-step task completion,
- file editing,
- tool use,
- recovery after failure,
- instruction persistence.

Record:

- success,
- quality,
- latency,
- token usage,
- cost,
- retries,
- failures.

---

# 19. Data Freshness

AI models change rapidly.

Every model and metric should have:

- `last_verified_at`
- `source_updated_at`
- `score_updated_at`

Display freshness where useful.

Example:

> Updated 3 days ago

Do not present stale price information as current.

---

# 20. Suggested Database Schema

Use PostgreSQL with Drizzle ORM.

Possible entities:

```text
providers
models
model_versions
model_capabilities
model_pricing
model_scores
score_components
benchmarks
benchmark_results
internal_tests
internal_test_results
sources
model_sources
ranking_snapshots
score_history
task_profiles
task_cost_estimates
```

Recommended model fields:

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

Pricing:

```text
model_id
provider
input_per_million
output_per_million
cached_input_per_million
currency
source_id
effective_from
last_verified_at
```

Scores:

```text
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

---

# 21. Source Provenance

Every factual value should be traceable.

Create a `sources` table:

```text
id
name
url
source_type
publisher
retrieved_at
published_at
license_notes
```

When showing expandable methodology, expose relevant source attribution.

Never fabricate citations.

---

# 22. Search Engine Optimization

SEO matters because comparison searches can drive organic traffic.

Optimize:

- model pages,
- head-to-head pages,
- use-case rankings,
- pricing pages,
- best-model pages.

Examples:

```text
Claude vs Gemini for coding
Best AI model for programming
Best cheap AI model
GPT vs Claude
Best AI model for students
Best AI coding model
```

Requirements:

- server-rendered content,
- semantic HTML,
- canonical URLs,
- metadata,
- Open Graph,
- structured data where appropriate,
- sitemap,
- robots.txt,
- fast page load,
- strong internal linking.

Do not generate low-quality SEO spam.

---

# 23. Ads and Monetization

The initial product should prioritize trust and usability.

Ads should not be part of the initial visual design.

Future monetization may include:

- Google AdSense
- affiliate links
- sponsored placements
- API provider referrals
- premium tools
- sponsorships

Any sponsored placement must be clearly labeled.

Recommendations must not be altered secretly by sponsorship.

Editorial ranking and sponsored ranking must remain separate.

---

# 24. Homepage

The homepage should communicate the product within seconds.

Suggested hero:

```text
Find the right AI model.

Compare intelligence, coding, agents, speed,
pricing and real-world cost.

[ Search models... ]

[ Coding ] [ Daily Use ] [ Agents ] [ Best Value ]
```

Below the hero:

1. Top models right now
2. Find a model
3. Popular comparisons
4. Rankings by use case
5. Cost comparison
6. Methodology / transparency
7. Recently updated models

Do not overload the hero.

---

# 25. Interaction Design

Animations should be subtle.

Use:

- short fade-in,
- slight card elevation,
- smooth number transitions,
- animated comparison changes,
- soft filter transitions,
- skeleton loading where necessary.

Avoid:

- excessive parallax,
- huge motion effects,
- complex scroll hijacking,
- animated backgrounds that reduce readability.

Respect `prefers-reduced-motion`.

---

# 26. Mobile Design

The site must be mobile-first compatible.

Comparison tables must not become unusable horizontally.

Possible strategies:

- sticky model headers,
- swipeable columns,
- metric-group accordions,
- pinned first column,
- two-model mobile comparison mode.

Model cards should retain key information without becoming dense.

---

# 27. Accessibility

Meet practical WCAG standards.

Requirements:

- keyboard-accessible controls,
- visible focus states,
- semantic landmarks,
- adequate contrast,
- accessible chart alternatives,
- proper labels,
- no information encoded only by color.

---

# 28. Performance

Target:

- fast first render,
- minimal JS by default,
- React only for interactive islands,
- optimized fonts,
- optimized images,
- server-rendered SEO content,
- lazy-load noncritical charts.

Avoid shipping large client bundles for static pages.

---

# 29. Initial Model Scope

Do not start with hundreds of models.

Start with approximately **10–15 important current models** across major providers.

The exact list should be kept configurable and should favor models users are actively deciding between.

Before populating production data, verify all model information against current sources.

Do not rely on model details from outdated memory.

---

# 30. Development Phases

## Phase 1 — Foundation

Build:

- project structure,
- global theme,
- database schema,
- model dataset format,
- shared UI components,
- source tracking.

## Phase 2 — Model Explorer

Build:

- model list,
- filters,
- sorting,
- cards,
- detail pages.

## Phase 3 — Comparison

Build:

- model selector,
- side-by-side comparison,
- best-metric highlighting,
- verdict generation,
- shareable comparison URLs.

## Phase 4 — Rankings

Build:

- ranking engine,
- overall ranking,
- use-case rankings.

## Phase 5 — Recommendation

Build:

- Model Finder,
- weighting logic,
- explanation output.

## Phase 6 — Economics

Build:

- cost calculator,
- task profiles,
- cost-per-task estimates.

## Phase 7 — Data Pipeline

Build:

- import scripts,
- source verification,
- freshness tracking,
- scoring pipeline,
- score history.

---

# 31. Recommended Component Architecture

Possible components:

```text
ModelCard
ModelScore
ScoreRing
ScoreBar
ModelLogo
ProviderBadge
PricingDisplay
CapabilityBadge
ModelSelector
ComparisonGrid
ComparisonMetricRow
BestValueIndicator
RankingTable
RankingCard
ModelFinder
CostCalculator
TaskCostCard
SourcePopover
MethodologyPanel
FreshnessBadge
ConfidenceIndicator
ScoreHistoryChart
```

Avoid overly generic abstraction.

Favor readable domain-specific components.

---

# 32. Code Quality Requirements

- TypeScript strict mode
- reusable domain types
- no `any` unless unavoidable
- clear separation between data and presentation
- validation for imported data
- consistent naming
- deterministic scoring functions
- unit tests for scoring
- unit tests for cost calculations
- no hidden magic numbers
- scoring weights in config
- source provenance enforced

Use schema validation for imported model data.

---

# 33. Data Integrity Requirements

Do not allow a model score to exist without:

- methodology version,
- timestamp,
- supporting evidence,
- confidence value.

Do not allow pricing to exist without:

- currency,
- unit,
- source,
- verification date.

Do not silently overwrite historical values.

Maintain score history where practical.

---

# 34. Recommendation Logic

Recommendations should be transparent.

Example:

If the user selects:

```text
Use case: Coding
Priority: Best value
Budget: Moderate
```

the system may calculate:

```text
Recommendation Score =
45% Coding
20% Agentic
15% Reliability
15% Cost Efficiency
5% Speed
```

Then provide:

```text
Best choice
Best cheaper alternative
Best premium alternative
```

The UI should explain why each result appears.

---

# 35. Avoid These Mistakes

Do not:

- build a clone of Artificial Analysis,
- overwhelm users with benchmark acronyms,
- invent scores,
- hide methodology,
- scrape restricted sources blindly,
- conflate intelligence with price,
- make Overall purely benchmark-driven,
- use AI-generated marketing fluff,
- overload every card with metrics,
- turn the entire Astro project into a React SPA,
- prioritize ads before product quality,
- recommend models solely because they sponsor the site.

---

# 36. MVP Acceptance Criteria

The MVP is complete when:

- users can browse models,
- users can filter and sort models,
- users can open a model detail page,
- users can compare 2–4 models,
- every major score is numerical 0–100,
- every score can be traced to a methodology,
- pricing is clearly displayed,
- sources and update dates are stored,
- rankings work,
- the UI works on mobile,
- pages are SEO-friendly,
- the design is clean and consistent,
- dark and light mode work,
- the application does not require benchmark expertise to understand.

---

# 37. Product Success Test

A first-time visitor should be able to answer:

> "Which AI model should I use?"

within approximately one minute without knowing what:

- SWE-bench,
- GPQA,
- ELO,
- or tokens per second

mean.

A technical visitor should still be able to inspect the underlying evidence.

That balance is essential.

---

# 38. Your Execution Instructions

When implementing this project:

1. Inspect the current repository before changing anything.
2. Preserve working code unless a change is justified.
3. Establish the architecture before building isolated UI.
4. Create reusable domain models for AI model data.
5. Build the scoring and source system before hardcoding scores into components.
6. Keep the UI consumer-friendly.
7. Use Astro for content-first pages.
8. Use React only for interactive islands.
9. Use TypeScript strictly.
10. Keep scoring formulas configurable.
11. Build responsive behavior from the beginning.
12. Do not invent current model data.
13. When current model data is required, retrieve it from authoritative sources.
14. Track provenance for every imported factual metric.
15. Clearly distinguish:
    - raw facts,
    - external benchmarks,
    - internal tests,
    - derived scores,
    - estimates.
16. Test critical scoring and cost-calculation logic.
17. Optimize for maintainability and future expansion.
18. Do not add unnecessary dependencies.
19. Do not redesign the product into a technical benchmark dashboard.
20. Keep the core user journey:

```text
Discover → Compare → Understand → Choose
```

---

# 39. First Task

Start by producing:

1. a proposed project architecture,
2. database schema,
3. domain types,
4. scoring configuration,
5. data-source/provenance model,
6. page/component map,
7. MVP implementation sequence.

Then begin implementing the foundation.

Do not populate production scores with guessed values.

Use mock/sample data clearly labeled as mock data until verified real data is available.

The goal is not simply to create a visually attractive AI leaderboard.

The goal is to build a **trustworthy, understandable AI model decision engine for normal users**.
