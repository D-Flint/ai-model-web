# Data, evidence, and scoring

Synapse separates factual claims from measurements, derived values, and estimates. This prevents a benchmark result or an assumed price from being presented as a universal truth.

## Data categories

| Category | Examples | Required treatment |
| --- | --- | --- |
| Provider facts | Model name, provider, modalities, context limits, availability, official pricing | Keep source URL, source type, retrieval date, and verification date where available |
| Public evaluations | LiveBench, LMSYS/Chatbot Arena, SWE-bench, BFCL, OpenRouter telemetry | Preserve the original value, scale, source, evaluation date, and normalized value when derived |
| Internal or mock evidence | Local fixtures or internal tests | Label the data kind explicitly; mock evidence cannot establish production confidence |
| Derived scores | Overall, intelligence, coding, speed, value, and task-specific scores | Store methodology version, update date, supporting evidence, and confidence |
| User estimates | Token workload cost calculations | Show the inputs and pricing scope; unavailable rates remain unavailable rather than becoming free |

Core schema and validation code lives in `src/pipeline/types.ts`, `src/lib/catalogSchema.ts`, and `src/lib/apiPricingSchema.ts`. The active reviewed catalog is `src/data/verifiedModels.json`, with supporting provider and benchmark data under `src/data/`.

## Provenance and freshness

Every published factual value should answer:

1. What is the value?
2. What kind of evidence is it?
3. Where did it come from?
4. When was it retrieved or measured?
5. When was it verified for publication?
6. How confident is the resulting claim?

The interface exposes source and freshness context instead of hiding it behind a score. Historical snapshots should be preserved when data is refreshed so a changed source value is auditable rather than silently overwritten.

## Validation and refresh flow

The data pipeline follows this order:

```text
Fetch or load source input
        ↓
Normalize names, aliases, units, and provider identifiers
        ↓
Validate shape, provenance, bounds, and uniqueness
        ↓
Calculate configured scores and confidence
        ↓
Review the resulting diff
        ↓
Publish the active catalog or persist an immutable snapshot
```

Useful commands:

```sh
npm run data:import -- path/to/catalog.json
npm run data:official
npm run data:livebench
npm run data:catalog:livebench
npm run data:openrouter
npm run data:lmarena
npm run data:swebench
npm run data:speed
npm run data:scores
npm run data:refresh
```

`npm run data:refresh` writes the validated catalog to the filesystem. If `DATABASE_URL` is available, the workflow can also persist reviewed data to PostgreSQL. Persistence is not required to run the public catalog experience.

## Scoring and confidence

Scores use a 0–100 scale and configured weights rather than hidden page-level constants. The scoring implementation is in `src/lib/scoring.ts`; the configured methodology and weights are in `src/data/config.ts`.

Confidence is separate from capability. `src/pipeline/confidence.ts` combines evidence coverage and source characteristics into a bounded confidence value. A high score with weak evidence must not be presented as equivalent to a well-supported score.

Rankings in `src/lib/rankings.ts` apply eligibility rules before sorting. Categories may use different evidence requirements, so a model is not recommended merely because it has one strong benchmark result.

## Model Finder

The Finder in `src/lib/modelFinder.ts` applies hard requirements and evidence eligibility before scoring candidates against a user’s priorities, use case, and budget. It returns explainable roles rather than a single unexplained winner:

- Best Match — strongest fit for the complete request.
- Best Value — a suitability-safe option with a useful cost tradeoff.
- Alternative — a measurable option with a different tradeoff.

Coverage and confidence affect the result. Missing evidence reduces what the system can claim; it is not silently treated as a zero-cost or perfect-capability result.

## Pricing

Pricing is maintained as a reviewed boundary in `src/lib/apiPricing.ts` and its schema. It distinguishes input, output, cached-input, context, currency, unit, source, and verification date where those fields are available.

The cost calculator estimates a user-entered workload from the applicable published rates. It should be read as an estimate for that workload, not as a guarantee of a provider invoice. When a required rate is unavailable, the UI keeps the estimate unavailable.

## Safe data changes

Before publishing a catalog or pricing change:

- Confirm the source is authoritative or clearly labeled as a public evaluation.
- Check retrieval and verification dates.
- Confirm model aliases and canonical slugs resolve consistently.
- Check score and confidence bounds.
- Review pricing units and currency.
- Inspect the generated diff and run the relevant tests.
- Do not replace a historical value without retaining its provenance.
