# Model dropdown data sources

## Objective

Add a compact, consumer-readable source footer to every expanded model detail in the Model Explorer table and mobile list. The footer must explain where the displayed benchmark scores, speed, pricing, and model facts came from without implying that one source supports every value.

## Design

Each expanded detail renders a `Data sources` section after its facts and scores. Every entry includes the source name, the displayed values it supports, the retrieval date, and an external link. Desktop and mobile use the same React component and source-resolution helper so their content cannot drift.

The resolver collects only sources relevant to content displayed in the expanded detail:

- the LiveBench source when the row contains LiveBench benchmark values;
- the verified speed source when speed is displayed;
- pricing sources used by the current API pricing rates, or the reviewed legacy pricing source when that fallback is displayed;
- provider documentation supporting model facts and context.

Entries with the same source URL are deduplicated and their coverage labels are combined. Source order is benchmark, speed, pricing, then model facts. Missing metadata is not invented; if no relevant source can be resolved, the section states that source details are unavailable.

## Accessibility and responsive behavior

The section uses a heading and semantic list. Source links have descriptive accessible names, use the existing external-link icon, and open in a new tab with `rel="noreferrer"`. Text wraps rather than forcing horizontal scrolling. The existing visual system, spacing, focus styles, and dark/light themes are preserved.

## Verification

- Unit tests prove relevant-source selection, URL deduplication, coverage merging, and the unavailable state.
- The Model Explorer browser flow expands a row on desktop and mobile, confirms the source section and working source links, checks horizontal overflow, and records screenshots.
- Run `npm test`, `npm run check`, `npm run lint`, and `npm run build`.

## Non-goals

- Changing model data, scores, prices, or source URLs.
- Redesigning the leaderboard or model guide.
- Adding per-cell source popovers.
- Adding new dependencies.
