# Model Catalog Replacement Design

## Objective

Remove Claude Haiku 5, GPT-5, and GPT-5 Pro from the repository's product data and replace their published catalog positions with DeepSeek V4 Flash 0731, DeepSeek V4.1 Flash, and DeepSeek V4 Pro 0813.

## Data ownership

Canonical model definitions in `src/data/models/` own model identity, aliases, and consumer guidance. `src/data/officialProviders.ts` owns verified provider facts. LiveBench release aliases map source identifiers to canonical slugs. `src/data/verifiedModels.json` remains generated output and must be regenerated after source changes.

DeepSeek V4.1 Flash will use canonical slug `deepseek-v4-1-flash`. Its current LiveBench source identifier is `deepseek-v4.1-flash-max`. No model facts, pricing, or availability will be invented; fields without verified repository sources will remain null or absent.

## Behavior

The three removed model slugs must disappear from canonical definitions, provider metadata, published model collections, generated catalog data, routes, selectors, and comparison assets. References that describe historical comparisons must also be removed when they would keep a deleted product record reachable.

The three DeepSeek replacements must resolve from LiveBench data into distinct canonical models, pass catalog validation, and occupy published catalog positions under the existing selection rules. The published catalog remains limited to 30 models.

## Verification

Regression checks will prove that the removed slugs are absent, the replacement slugs resolve and publish, and the catalog still contains 30 models. Existing data integrity, ranking, recommendation, cost, lint, type, and production build checks will run. The implementation stops after a local Conventional Commit and session-log update; nothing is pushed.
