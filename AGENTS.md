# Repository Guidelines

## Project Structure & Module Organization

Use [ai-model-guide-gpt6-astra-brief.md](ai-model-guide-gpt6-astra-brief.md) as the product source of truth. Organize the Astro application by responsibility:

- `src/pages/` — routes, SEO pages, and server-rendered content.
- `src/layouts/` — shared page shells and metadata.
- `src/components/` — domain-focused Astro and React components.
- `src/data/` — validated model fixtures and configuration.
- `src/lib/` — scoring, recommendations, cost calculations, and provenance logic.
- `src/db/` — Drizzle schema, migrations, and database access.
- `tests/` — unit and integration tests.
- `public/` — static assets.

Keep raw facts, benchmarks, internal results, derived scores, and estimates distinguishable in both types and storage.

## Build, Test, and Development Commands

After scaffolding, provide and use:

```text
npm run dev       # start the local Astro server
npm run build     # create the production build
npm run check     # run Astro and TypeScript checks
npm run lint      # run formatting and lint checks
npm test          # run the test suite
```

Do not add guessed production model data. Label fixtures as mock data until each factual value has an authoritative source and verification date.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, and domain-specific types. Name components in PascalCase (`ModelCard.tsx`), utilities in camelCase (`calculateTaskCost.ts`), routes in lowercase URL form, and database tables in snake_case. Keep scoring weights in configuration, validate imported data, and avoid `any` and hidden magic numbers.

## Testing Guidelines

Test scoring, confidence calculations, recommendations, cost estimates, and data validation. Name tests after behavior, such as `calculateTaskCost.test.ts`. Cover browse, compare, find, and cost flows.

## Commit & Pull Request Guidelines

There is no commit history yet. Use imperative Conventional Commit-style subjects, such as `feat: add model comparison grid`. Pull requests should explain the user-visible change, link the issue or brief section, list validation commands, and include UI screenshots when relevant.

## Agent-Specific Instructions

Inspect the repository before editing. Preserve existing work, keep Astro content-first, use React for meaningful interaction, and maintain Discover → Compare → Understand → Choose. Never fabricate citations, scores, pricing, or current model details.

After each implementation, run the relevant local tests and create a local Git commit. Pause before starting the next implementation until the user verifies the result through local testing. Never push to GitHub unless the user explicitly instructs it.

Do not use emoji as icons. Use an appropriate icon asset or icon library when an interface icon is needed.

## Repository-Local Skills

Project-scoped design skills are stored in `.agents/skills/` so compatible agents can discover them from the repository. Available skills include `ui-ux-pro-max`, `frontend-design`, `emil-design-eng`, `design-taste-frontend`, and `impeccable`. Apply them when designing or reviewing the interface, while keeping the product brief and repository conventions authoritative.
