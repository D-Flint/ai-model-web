# Model Finder Decision Engine Design

**Date:** 2026-09-09  
**Status:** Approved in conversation; awaiting written-spec review  
**Scope:** `/find`, its recommendation engine, supporting model-role data, and focused tests

## Objective

Replace the current three-radio Model Finder with a deterministic, evidence-aware decision engine that helps non-technical users choose an appropriate model for several kinds of work. Preserve the existing Synapse visual system and the core journey:

```text
Discover -> Compare -> Understand -> Choose
```

The implementation must not change unrelated rankings, comparison logic, pricing pages, or model-detail presentation.

## Current implementation

The current finder accepts one public capability metric, one priority, and one strict input-price tier. It filters only by budget and vision capability, then scores candidates as:

```text
0.55 * selected task score
+ 0.30 * one priority score
+ 0.15 * reliability
```

Missing task data becomes zero, missing priority data becomes the task value, and missing reliability becomes 75. Best Value is the remaining model with the largest cost-efficiency score, and Alternative is the first unused ranked result. Model roles are optional in the schema and absent from the verified catalog, so specialized models are not excluded.

## Product decisions

- Users may select one to three use cases and one to three priorities.
- Every selection has High, Medium, or Low importance, mapped to 3, 2, or 1.
- The primary use case is the selected use case with the greatest importance. Ties are resolved by user selection order.
- No selected priority means balanced behavior; Balanced is not a selectable priority.
- Most Reliable is hidden until a defensible reliability metric exists.
- Images & Vision is visible but disabled as a primary use case until approved vision-performance evidence exists. Vision support remains available as a hard requirement.
- Daily Use is explicitly described as a proxy based on instruction following, language, and reasoning because no approved human-preference metric exists.
- Free means verified zero-cost API input and output, not access through a free consumer chat plan.
- Missing data is never converted to zero, an average, or a fabricated default.

## Architecture

### `src/data/modelFinderConfig.ts`

Own all changeable policy:

- use-case labels and metric mappings;
- importance values;
- priority definitions and modifiers;
- role eligibility rules;
- budget thresholds and penalties;
- evidence threshold;
- base and balanced score weights;
- Best Value thresholds;
- diversification rules;
- deterministic tie-break order.

React components must not contain scoring constants.

### `src/lib/modelFinder.ts`

Own the pure recommendation pipeline. It accepts catalog models plus a validated request and returns structured, explainable results. It must not mutate its inputs or call an LLM, network service, clock, or random-number generator.

Public operations include:

```ts
buildTaskWeights(request)
buildEffectiveScoreWeights(request)
evaluateEligibility(model, request)
scoreCandidate(model, request)
recommendModels(models, request)
```

The engine returns intermediate components so tests and UI explanations use the same source of truth.

### `src/components/ModelFinder.tsx`

Own only form state, validation, progressive disclosure, and rendering. It calls the finder engine with a complete request and renders the returned explanations. It does not re-rank or independently choose result categories.

### Catalog and pipeline

Expand the shared model-role taxonomy and carry explicit roles from canonical or official model configuration into generated catalog records. Roles used by the finder are:

```text
general-purpose
reasoning
coding
agentic
vision
safety-classifier
moderation
embedding
reranker
image-generation
speech
specialized
```

Explicitly classify every currently tracked model and known specialized safety/moderation models. A tracked model without a role remains visible elsewhere but is ineligible for a top Finder recommendation. This conservative default prevents an unclassified specialized model from becoming a general assistant recommendation.

## Request model

```ts
interface ModelFinderRequest {
  useCases: Array<{
    id: UseCaseId;
    importance: Importance;
    selectionOrder: number;
  }>;
  priorities: Array<{
    id: PriorityId;
    importance: Importance;
    selectionOrder: number;
  }>;
  requirements: {
    vision: boolean;
    tools: boolean;
    api: boolean;
    openWeights: boolean;
    structuredOutput: boolean;
    minimumContext: number | null;
  };
  budget: {
    tier: 'free' | 'very-cheap' | 'moderate' | 'flexible';
    behavior: 'strict' | 'preferred';
  };
}
```

The UI prevents more than three use cases or priorities. The engine validates the same limits so direct callers cannot bypass them.

## Task-fit mappings

Task Fit uses approved LiveBench submetrics already stored in `benchmarks.livebench`. It does not mix those inputs with public-facing scores derived from the same measurements.

| Use case | Metric weights |
|---|---|
| Coding | Coding 0.55, Agentic Coding 0.25, Reasoning 0.20 |
| Agentic workflows | Agentic Coding 0.60, Reasoning 0.25, Instruction Following 0.15 |
| Research | Reasoning 0.35, Data Analysis 0.25, Instruction Following 0.20, Language 0.20 |
| Daily use | Instruction Following 0.40, Language 0.30, Reasoning 0.30 |
| Writing | Language 0.50, Instruction Following 0.30, Reasoning 0.20 |
| Study | Reasoning 0.35, Instruction Following 0.25, Language 0.20, Mathematics 0.20 |
| Data analysis | Data Analysis 0.55, Reasoning 0.25, Coding 0.20 |
| Mathematics | Mathematics 0.65, Reasoning 0.35 |

Images & Vision has no mapping in this release because the tracked catalog has no approved vision score. The disabled UI explains that Synapse can filter for image support but cannot yet compare vision quality responsibly.

For each selected use case, multiply its metric weights by importance. Merge duplicate metrics and normalize the combined vector to 1.0. Task Fit is the weighted mean of available requested metrics. Evidence Coverage is the sum of available requested weight divided by total requested weight.

Candidates with Task Evidence Coverage below 0.40 are removed before scoring.

## Role and capability eligibility

The engine applies these checks before numerical scoring:

1. Exclude any model with `safety-classifier`, `moderation`, `embedding`, `reranker`, `image-generation`, or `speech` when the request is for generative assistant work.
2. Exclude models with no explicit role.
3. Coding primary requires at least one of `general-purpose`, `reasoning`, `coding`, or `agentic`, plus coding evidence.
4. Agentic primary requires `facts.tools`, an eligible generative role, and agentic-coding evidence.
5. Writing, Daily Use, and Study require `general-purpose` or `reasoning`.
6. Research, Data Analysis, and Mathematics require `general-purpose`, `reasoning`, `coding`, or `agentic`, plus the request-specific evidence threshold.
7. Apply every selected hard requirement directly against verified catalog facts.

These are taxonomy rules, not model-name exceptions.

## Hard requirements

The first release supports:

- vision input;
- tool/function calling;
- API availability;
- open weights;
- structured output;
- minimum context window.

Failure of any requested requirement excludes the model. Requirement values are displayed in each result explanation.

## Priorities

Available priorities are:

| Priority | Fit calculation |
|---|---|
| Best quality | Task Fit |
| Fastest answers | Approved public speed score |
| Lowest cost | Verified-price fit |
| Best value | 0.80 Task Fit + 0.20 verified-price fit |
| Long context | Configured context tier score |
| Open weights | 100 when open, otherwise 0 |

Context tiers are deliberately non-linear:

```text
1M or more: 100
256K-999K:   80
128K-255K:   60
32K-127K:    40
below 32K:   20
```

Priority Fit is the importance-weighted mean of available selected priority fits. Priority Evidence Coverage records the selected weight with available data. Missing speed or price leaves that priority contribution unavailable and lowers confidence.

Lowest Cost and Best Value make verified current price essential; candidates without it are excluded for those requests. Fastest Answers does not exclude missing-speed models, but their priority evidence is absent and confidence falls.

## Budget behavior

Budget ceilings use verified standard API input price per one million tokens:

```text
Free:       input = 0 and output = 0
Very cheap: input <= $1
Moderate:   input <= $5
Flexible:   no ceiling
```

Strict budgets exclude over-budget and unknown-price candidates before scoring. Preferred budgets retain over-budget candidates and calculate:

```text
Budget Fit = clamp(100 - 35 * log2(input price / ceiling), 0, 100)
```

Candidates at or below a nonzero ceiling receive 100. Unknown price produces no Budget Fit. Free cannot use preferred overage semantics: Free + Preferred behaves as a strict verified-free requirement and the UI explains this.

General verified-price fit is:

```text
Price Fit = clamp(100 - 20 * log2(1 + input price), 0, 100)
```

Economics Fit is 0.60 Price Fit + 0.40 Budget Fit when both exist, otherwise the available component. Flexible budgets use Price Fit alone.

## Dynamic score weights

With selected priorities, start from:

```text
Task Fit              0.60
Priority Fit          0.25
Economics Fit         0.10
Evidence Confidence  0.05
```

Priority modifiers are importance-weighted and added to the base vector:

```text
Best quality:              Task +0.10, Priority -0.05, Economics -0.05
Lowest cost / Best value:  Task -0.05, Priority -0.05, Economics +0.10
Other priorities:          no composite-weight change
```

When several priorities are present, average their modifiers by importance. Each modifier sums to zero, so the composite remains normalized. All effective weights are returned to the UI.

With no selected priorities, balanced behavior is explicit:

```text
Task Fit              0.70
Priority Fit          0.00
Economics Fit         0.20
Evidence Confidence  0.10
```

If an optional component is unavailable, calculate the Match Score over available components by renormalizing their effective weights. The missing requested evidence still reduces the separately displayed confidence; it is never inserted as zero or a default.

## Confidence

First calculate query evidence coverage from the active evidence domains:

```text
Task evidence      70%
Priority evidence  20% when priorities are selected
Economics evidence 10% when budget or cost priorities require it
```

Normalize over active domains. Then combine it with the catalog's existing provenance confidence:

```text
Query Confidence = round(
  catalog confidence * (0.50 + 0.50 * query evidence coverage)
)
```

Match Score and Query Confidence remain separate values. Confidence contributes only its configured 5% or 10% composite weight.

## Candidate pipeline

```text
Tracked catalog
  -> explicit role eligibility
  -> hard requirements
  -> strict budget
  -> primary-use-case suitability
  -> minimum task evidence coverage
  -> Task Fit
  -> Priority Fit
  -> Economics Fit
  -> Query Confidence
  -> Final Match Score
  -> diversified result selection
```

Final candidate ordering is deterministic:

1. Final Match Score descending;
2. Task Fit descending;
3. Query Confidence descending;
4. verified input price ascending, with missing last;
5. model slug ascending.

## Result selection

### Best Match

The first fully eligible candidate after deterministic ordering.

### Best Value

A candidate must:

- satisfy all gates;
- have Task Fit at least 80% of Best Match's Task Fit;
- have verified current pricing;
- cost at least 20% less than Best Match when Best Match has a verified price.

Eligible candidates are ranked by `0.70 * Task Fit + 0.30 * Price Fit`, followed by the standard tie-break order. If Best Match has no verified price or no candidate meets the conditions, omit Best Value and explain why.

### Alternative

Choose the highest-ranked unused candidate that provides a measurable tradeoff: lower verified price, higher approved speed, larger context tier, open weights, or stronger fit for a selected secondary use case. Prefer a different provider and family, then a different provider, then a different family. If no candidate has a measurable tradeoff, omit the category rather than relabeling the next model.

## Explanations

Every returned recommendation includes structured data for:

- category;
- Match Score and Query Confidence;
- Task Fit, Priority Fit, Economics Fit, and effective weights;
- evidence coverage;
- top three contributing task metrics;
- satisfied requirements;
- deterministic strengths;
- one measurable tradeoff;
- current price or an explicit unavailable state;
- exclusion and omission reasons where relevant.

The UI builds sentences from deterministic templates. It does not append model marketing descriptions as recommendation evidence.

## Interface

Keep the existing Synapse colors, type hierarchy, panel treatment, focus treatment, and compact green accent.

### Step 1: Your work

Render full-width selectable rows. Selection reveals an importance control in the same row. Copy says "Select up to 3." Disabled Images & Vision includes an evidence-pending note and does not behave like an available checkbox.

### Step 2: Your priorities

Render up to three selectable priorities with importance controls. With none selected, show a quiet "Balanced by default" status rather than a fake option.

### Step 3: Requirements & budget

Show common requirements first. Put structured output and minimum context inside an accessible disclosure. Present Budget and Budget behavior as separate labeled controls. Disable Preferred when Free is selected.

### Results

Use distinct Best Match, Best Value, and Alternative cards when each category is available. Show score, confidence, top reasons, tradeoff, requirements, and price before the expandable score breakdown. The breakdown exposes real component values and effective weights.

The progress indicator uses an ordered list with `aria-current="step"`. Validation errors receive `role="alert"`, and the result heading receives focus after submission instead of announcing the entire result list through one large live region.

### Mobile

- one-column rows and result cards;
- minimum 44px control targets;
- compact importance select aligned to the row;
- sticky action bar only when it does not obscure content;
- advanced requirements use the native disclosure pattern;
- no horizontal scrolling at 320px.

Respect `prefers-reduced-motion`; no new decorative animation is required.

## Empty and error states

- No use case: prevent continuation and identify the required choice.
- More than three selections: keep the fourth option unchecked and explain the limit.
- No eligible models: identify which requirements, budget, or evidence gate removed candidates and provide an Adjust choices action.
- No Best Value or Alternative: omit the card and show a short category-specific explanation.
- Unsupported evidence option: render disabled with a plain-language reason.
- Invalid direct request: throw a typed validation error in the engine; the component converts it to an actionable form message.

## Tests

Add focused unit tests covering:

1. Multi-use-case weight combination and normalization.
2. Importance and primary-use-case tie behavior.
3. Safety classifiers excluded from Coding.
4. Text-only models excluded by Vision requirement.
5. Non-tool models excluded by Tool Calling requirement.
6. Strict budgets exclude over-budget models.
7. Preferred budgets penalize without excluding.
8. Missing price cannot win Lowest Cost or Best Value.
9. Missing benchmark values are not treated as zero.
10. Evidence coverage below 40% cannot produce Best Match.
11. Cheap unsuitable models cannot become Best Value.
12. Alternative selection prefers a measurable, diverse tradeoff.
13. Identical requests always return identical ordering and explanations.
14. Reliability and primary Vision remain unavailable with current data.
15. Effective weights and displayed component math reproduce Match Score.

Update the browser flow to cover multi-selection, importance controls, requirements, strict/preferred budget behavior, score breakdowns, empty states, keyboard flow, mobile width, and comparison handoff.

## Verification

Run:

```text
npm test
npm run check
npm run lint
npm run build
```

Run focused Playwright coverage for `/find` at desktop, 390px, and 320px. Run the Impeccable detector once after UI work is complete. Preserve unrelated working-tree changes and create a local Conventional Commit only after all relevant checks pass.

## Acceptance boundary

The change is complete when the new inputs, eligibility gates, evidence handling, scoring, confidence, diversified shortlist, explanations, responsive UI, and critical tests work together. It does not add new benchmark sources, fabricate missing vision or reliability scores, modify general rankings, or call an LLM at runtime.
