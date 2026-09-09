# Synapse project documentation

This folder documents the Synapse application itself: its product purpose, runtime architecture, data boundaries, development workflow, and deployment path.

The root [`README.md`](../README.md) remains the project’s quick-start overview. These pages provide deeper implementation context without including agent instructions, learning notes, or unrelated planning material.

## Product purpose

Synapse is a consumer-first AI model decision engine. It turns model facts, public evaluations, reviewed pricing, provenance, and confidence into guidance for people choosing a model for a real task.

The core journey is:

```text
Discover → Compare → Understand → Choose
```

Synapse is intentionally not a technical leaderboard. Scores are decision inputs that must be read alongside evidence coverage, source freshness, confidence, price, and practical tradeoffs.

## Documentation map

- [Architecture](architecture.md) — application boundaries, routes, rendering, and data flow.
- [Data and scoring](data-and-scoring.md) — catalog inputs, provenance, validation, rankings, recommendations, and pricing.
- [Development and deployment](development-and-deployment.md) — local setup, commands, environment variables, testing, and Cloudflare deployment.

## Project boundaries

- Astro owns routes, layouts, metadata, SEO content, and server-rendered pages.
- React is used for meaningful interaction such as filtering, comparison, finding, ranking controls, and cost calculation.
- `src/data/` contains reviewed fixtures and configuration; `src/lib/` contains decision logic; `src/pipeline/` contains ingestion and normalization; `src/db/` contains optional persistence.
- Current catalog and pricing claims must retain provenance. Mock or estimated values must remain clearly labeled.
- The production runtime does not require a database connection for normal catalog browsing. Prepared catalog assets are served with the Cloudflare Worker.
