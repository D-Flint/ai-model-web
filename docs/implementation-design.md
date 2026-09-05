# Astra implementation design

The approved product brief defines the scope. Complete one local implementation before user preview.

## Architecture

Astro owns routes, navigation, metadata, model details, rankings, and methodology. React islands own explorer filtering, comparison selection, the recommendation wizard, and cost inputs. Domain functions own deterministic calculations. Zod validates imports before they enter the catalog. PostgreSQL/Drizzle separates sources, facts, benchmarks, internal results, derived scores, estimates, and history; the local experience uses a validated fixture catalog without requiring a database service.

## Design

Use the existing Astra identity and indigo accent. Canvas #F8F9FB, surface #FFFFFF, text #171923, secondary #636775, accent #5146D9, soft accent #EEECFC. Dark equivalents use charcoal surfaces. System sans typography with a strong display weight and tabular numerical figures avoids external font latency. Soft 14px panels and 8px controls. Design variance 5, motion 3, density 4. A working two-model comparison in the homepage hero makes the product itself the visual signature. Scores are selectable and explainable. No decorative photography is needed for this data utility.

## Data and integrity

Ship 12 explicitly fictional sample models, never synthetic scores attached to real provider products. All sample values have local fixture provenance, a fixture date, and no claimed real verification. Normalize synthetic evaluation inputs before deriving capability and overall scores. Confidence indicates evidence coverage, never certainty. Production import rejects missing provenance and requires dated external URLs; preserve imported snapshots instead of overwriting historical files.

## Route and component map

- Home: working comparison preview, task shortcuts, model highlights, comparisons, cost preview, transparency.
- Models: searchable directory, numerical and capability filters, sorting, comparison tray.
- Model details: score explanations, prices, strengths/tradeoffs, facts, alternatives, evidence.
- Compare: shareable selection of 2-4 models, grouped metrics, winners and conditional verdicts.
- Rankings: overall and capability-specific lists with explanations.
- Finder: use case, priority, budget; deterministic explained choices and empty states.
- Cost: simple workloads and advanced token inputs, success probability, tool overhead, monthly/per-task estimates.
- Methodology: normalization, weights, evidence confidence, source distinctions, freshness.

## Sequence and validation

Domain data and calculations; shared layout and homepage; explorer and model routes; comparison and rankings; finder and calculator; persistence schema/imports; unit tests, type checks, lint, production build, and desktop/mobile browser flows. Append session log and make one local implementation commit. Do not push. Ask for user preview only after completion.
