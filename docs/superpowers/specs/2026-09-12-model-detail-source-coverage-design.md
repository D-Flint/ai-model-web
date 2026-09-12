# Model detail source coverage

## Objective

Make the evidence behind every metric in an expanded model row easy to identify and open. The consumer journey remains Discover → Compare → Understand → Choose: provenance should clarify a decision without turning the detail panel into a technical audit.

## Scope

Update the shared `ModelDataSources` component used by desktop and mobile model-detail expansions. Keep the existing source name, external link behavior, retrieval date, and empty state.

## Presentation

Replace the generic source coverage copy with a source-coverage map:

- Each source remains a linked heading that opens the authoritative source in a new tab.
- Add a `Used for` line beneath it.
- Render every covered metric as its own external link to that same source, including the source name and metric list in the accessible labeling.
- Group metrics under their shared source, deduplicating sources by URL as today.
- Retain the source retrieval date directly beneath the metric links.

The layout stays compact and wraps naturally on small screens. Metric links use the established accessible link and focus treatment; meaning is not conveyed by color alone.

## Coverage mapping

`getModelDetailSources` will report the same labels that users see in the expanded row:

- LiveBench source: leaderboard metrics available for the row, including task cost when displayed.
- Speed source: Speed.
- Pricing source: Input price, Output price, and Cached input price when present.
- Facts source: Modalities and Reasoning tiers.
- Context source: Context window.

When a single URL supports multiple groups, it produces one source group with all applicable metric links. Missing facts or sources remain absent; no provenance is inferred or invented.

## Data flow

`ModelExplorer` continues to derive `detailSources` once per processed model. `getModelDetailSources` builds a source group with display labels and URL provenance from validated catalog records. `ModelDataSources` renders those labels as individual links. The same component supplies desktop and mobile views, so their evidence coverage stays identical.

## Verification

- Add or update unit coverage for grouping and cached-input provenance.
- Extend the existing browser check to assert individual metric links, external-tab attributes, desktop/mobile rendering, and no mobile overflow.
- Run `npm run check`, `npm run lint`, `npm test`, the focused browser check, and `git diff --check`.
