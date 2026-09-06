# GPT-6 Astra Task Brief — Replace Monthly Cost Estimates with Defensible API Pricing

## Context

You are working inside an existing AI model comparison website.

The product is designed for normal users, not benchmark researchers. It compares AI models across capability, pricing, use cases, and other practical dimensions.

The current UI includes a generic monthly cost estimate based on assumptions such as:

```text
20 questions/day
X input tokens/question
Y output tokens/question
```

This approach is being removed.

The reason is simple:

> Generic monthly cost estimates create false precision because actual usage varies dramatically by conversation history, caching, reasoning, tools, agents, files, web search, retries, and provider-specific billing rules.

The website should not pretend to know what a user's real monthly spend will be.

---

# Primary Goal

Replace generic monthly-cost estimates with **defensible, source-backed pricing information**.

The site should show:

1. Official API input price
2. Official API output price
3. Cached input price where applicable
4. Context window
5. Optional benchmark cost per task only when sourced from a real benchmark
6. A separate calculator where the user enters their own workload

Do not show a generic:

```text
Estimated monthly cost: $X
```

unless it is explicitly based on user-provided usage data.

---

# Product Decision

The cost section should follow this hierarchy:

```text
Official API Pricing
        ↓
Benchmark Cost per Task
        ↓
User-Specific Cost Calculator
```

Do not use:

```text
Generic Monthly Estimate
```

as a product feature.

---

# Source of Truth

For factual pricing, use official provider sources first.

Approved source priority:

```text
1. Official provider pricing/documentation
2. OpenRouter as fallback/cross-check
3. unavailable
```

Examples of official providers:

- OpenAI
- Anthropic
- Google
- DeepSeek
- xAI
- Mistral
- Meta
- other official model providers

If OpenRouter conflicts with the official provider:

> The official provider wins.

Every production pricing value must retain:

```text
value
currency
unit
source_name
source_url
retrieved_at
effective_from
```

Never invent or estimate official pricing.

---

# What to Show on Model Cards

Replace any monthly cost UI with compact API pricing.

Recommended model-card section:

```text
API Pricing

Input   $X.XX / 1M tokens
Output  $Y.YY / 1M tokens
```

If cached pricing exists:

```text
Cached  $Z.ZZ / 1M tokens
```

If the model uses a more complex pricing structure, do not flatten it incorrectly.

Instead show something like:

```text
Pricing varies by context length
View pricing details →
```

Do not overload compact cards.

---

# What to Show on Model Detail Pages

Create a richer pricing section.

Example:

```text
Pricing

Input
$3.00 / 1M tokens

Cached input
$0.30 / 1M tokens

Output
$15.00 / 1M tokens

Context window
200K tokens
```

Include provider-specific notes where relevant.

Examples:

- different rates above a context threshold
- batch API discounts
- cache write/read differences
- reasoning-token billing
- search/tool fees
- image/audio pricing
- provider-specific surcharges

Do not imply all models use identical billing structures.

---

# Cost Calculator

Keep a calculator, but make it user-driven.

Do not invent usage assumptions by default.

## Simple Calculator

Ask the user for:

```text
Input tokens
Output tokens
Number of requests
```

Optional:

```text
Cached input tokens
```

Calculate:

```text
Input Cost =
Input Tokens / 1,000,000 × Input Price

Output Cost =
Output Tokens / 1,000,000 × Output Price

Cached Input Cost =
Cached Input Tokens / 1,000,000 × Cached Input Price

Total =
Input Cost + Output Cost + Cached Input Cost
```

---

# Advanced Calculator

Support additional provider-specific inputs where data exists:

- uncached input tokens
- cached input tokens
- output tokens
- reasoning tokens
- requests
- web/search calls
- tool fees
- image inputs
- audio inputs
- cache storage
- batch discounts
- provider-specific modifiers

Only expose advanced fields when relevant.

Do not create fake fields for providers that do not bill that way.

---

# Monthly Cost

Monthly cost may be shown only if the user provides their own workload.

Example:

```text
Requests/day: 40
Input/request: 8,000 tokens
Output/request: 2,000 tokens
Days/month: 30
```

Then the site may calculate:

```text
Estimated monthly API cost: $X
```

This must be labeled:

> Based on your inputs

Do not use terms like:

- typical monthly cost
- average monthly spend
- expected monthly cost

unless backed by real observed user data.

---

# Benchmark Cost Per Task

This feature is allowed only when a benchmark or dataset provides enough real workload information to calculate it defensibly.

Examples:

```text
Benchmark cost/task
$0.42

Source:
SWE-bench Verified
```

or:

```text
Benchmark task cost
$1.18

Measured under:
[benchmark name]
```

Requirements:

- source must be named
- methodology must be available
- benchmark must be reproducible or documented
- task scope must be clear
- cost must not be presented as normal-user monthly spend

If there is no trustworthy cost-per-task source:

```text
null
```

Do not estimate it.

---

# Homepage Cost Section

Replace the current monthly-cost card with an API pricing comparison section.

Recommended structure:

```text
Compare model pricing

See what each model actually charges.

Model A
Input   $X / 1M
Output  $Y / 1M

Model B
Input   $X / 1M
Output  $Y / 1M

Model C
Input   $X / 1M
Output  $Y / 1M

[Compare pricing]
```

Suggested supporting copy:

> Compare official API pricing without guessing your monthly usage.

Keep this section simple.

---

# Pricing Comparison Page

If a pricing comparison page already exists, improve it.

Recommended columns:

- Model
- Provider
- Input / 1M
- Cached input / 1M
- Output / 1M
- Context window
- Pricing notes
- Source freshness

Allow sorting by:

- lowest input price
- lowest output price
- lowest blended price
- context window

Do not create a "cheapest overall" ranking without defining the calculation.

---

# Optional Blended Price

If useful, allow a clearly defined blended-price view.

Example:

```text
Blended price =
70% input cost
30% output cost
```

or let the user configure the ratio.

Do not hide this assumption.

If shown, label it:

```text
Blended API Price
Based on 70% input / 30% output
```

Do not call it "real cost."

---

# Pricing Data Model

Ensure the database can represent more than one simple input/output pair.

Suggested fields/concepts:

```text
model_pricing
- id
- model_id
- provider
- pricing_type
- input_per_million
- cached_input_per_million
- output_per_million
- reasoning_per_million
- currency
- min_context
- max_context
- batch_discount
- source_id
- effective_from
- last_verified_at
```

If a model has tiered pricing, support multiple rows.

Do not force tiered pricing into one incorrect number.

---

# Source Provenance

Every pricing field must be traceable.

Store:

```text
source_name
source_url
source_type
retrieved_at
effective_from
```

The UI should be able to show:

```text
Source: Official provider pricing
Verified: 2 days ago
```

---

# Freshness

Pricing changes often.

Mark pricing stale after a configurable threshold.

Recommended initial value:

```text
7 days
```

The UI should not silently present stale values as current.

Possible states:

```text
Current
Needs verification
Unavailable
```

---

# UI Design Principles

Keep the existing clean, modern design.

Do not make pricing look like an accounting dashboard.

Prioritize:

- readable numbers
- strong hierarchy
- simple labels
- restrained color
- responsive layouts

Avoid:

- giant cost estimates
- fake savings percentages
- misleading "cheapest" badges
- excessive financial terminology

The user should understand pricing immediately.

---

# Existing UI Cleanup

Inspect the project for:

- "monthly cost"
- "estimated monthly cost"
- "20 questions/day"
- assumed message counts
- assumed token counts
- arbitrary usage presets
- hidden monthly-cost formulas

Remove or replace them.

Do not leave stale copy behind.

---

# Do Not Do These Things

Do not:

- invent typical usage
- invent average token counts
- invent average monthly spend
- present monthly costs without user input
- present benchmark cost as normal usage
- use random third-party pricing pages as source of truth
- ignore cached pricing
- ignore tiered pricing
- flatten complex pricing incorrectly
- hardcode prices without provenance
- silently reuse stale prices
- estimate unavailable values

---

# Acceptance Criteria

This task is complete when:

1. Generic monthly cost estimates are removed.
2. No "20 questions/day" or similar default assumption remains.
3. Model cards show official API pricing instead.
4. Model detail pages show richer pricing details.
5. Pricing values come from approved sources.
6. Pricing provenance is stored.
7. Cached input pricing is shown where available.
8. Tiered pricing is supported.
9. Context window remains visible.
10. Cost calculator uses user-provided workload.
11. Monthly cost is shown only from user-entered data.
12. Benchmark cost/task is shown only when sourced and defensible.
13. Missing pricing values are `null` / unavailable.
14. Existing UI remains clean and responsive.
15. No unrelated redesign is introduced.
16. Documentation explains the pricing methodology.

---

# Execution Instructions

First inspect the existing repository.

Find:

- monthly cost components
- homepage pricing section
- model cards
- model detail pricing
- calculator
- pricing schema
- pricing data sources
- existing assumptions

Then provide a short implementation plan.

After that:

1. remove generic monthly estimates
2. update pricing data structures
3. update UI components
4. connect official pricing data
5. improve provenance
6. update calculator
7. test formulas
8. update documentation

Do not rewrite unrelated parts of the application.

At the end, report:

- files changed
- UI removed/replaced
- pricing fields added
- source rules used
- calculator behavior
- remaining unsupported pricing cases
- commands/tests run

The final product should communicate:

> **Official API pricing first. User-specific estimates only when the user provides the workload.**
