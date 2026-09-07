# Repository Agent Instructions

## Product source of truth

Read [ai-model-guide-gpt6-astra-brief.md](ai-model-guide-gpt6-astra-brief.md) before making product or architecture decisions. Keep the core journey:

```text
Discover → Compare → Understand → Choose
```

Build a consumer AI model decision engine, not a technical leaderboard. Translate technical evidence into clear, useful guidance for non-technical users.

## Architecture

- Use Astro for routes, layouts, SEO content, metadata, and server-rendered pages.
- Use React only for meaningful interaction: filtering, comparison, recommendations, cost calculation, charts, and methodology details.
- Keep responsibility boundaries clear:
  - `src/pages/` — routes and SEO pages
  - `src/layouts/` — shared shells and metadata
  - `src/components/` — domain-focused Astro and React components
  - `src/data/` — validated fixtures and configuration
  - `src/lib/` — scoring, recommendations, costs, and provenance
  - `src/db/` — Drizzle schema, migrations, and database access
  - `tests/` — unit and integration tests
  - `public/` — static assets
- Use strict TypeScript, domain-specific types, schema validation, and two-space indentation.
- Name components in PascalCase, utilities in camelCase, routes in lowercase URL form, and database tables in snake_case. Name tests after behavior.
- Keep scoring weights in configuration. Avoid `any`, hidden magic numbers, unnecessary dependencies, and generic abstractions that hide domain behavior.
- Use relevant repository-local skills from `.agents/skills/` for design and interface work.

## Data integrity

- Never invent current model details, pricing, citations, scores, benchmarks, or availability.
- Label mock data clearly until authoritative sources verify it.
- Distinguish raw facts, public benchmarks, internal tests, derived scores, and estimates in types, storage, and UI.
- Keep provenance for factual values: source URL, source type, retrieval date, and verification date.
- Scores require methodology version, evidence, update date, and confidence. Pricing requires currency, unit, source, and verification date.
- Preserve historical values where practical. Do not silently overwrite data.
- Prefer official provider sources for model facts and pricing. Respect licenses, terms of service, rate limits, and attribution requirements.
- Keep major scores numerical on a 0–100 scale. Make methodology inspectable. Avoid fake precision and benchmark-only recommendations.

## UX and quality

- Keep UI consumer-first, readable, calm, spacious, accessible, and mobile-compatible.
- Show tradeoffs, freshness, confidence, and estimated costs plainly.
- Use semantic HTML, keyboard-accessible controls, visible focus states, adequate contrast, and non-color chart alternatives.
- Respect `prefers-reduced-motion`. Keep JavaScript minimal and use React islands instead of a full SPA.
- Do not use emoji as icons. Use an appropriate icon asset or icon library.

## Commands

```text
npm run dev       # start local Astro server
npm run build     # create production build
npm run check     # run Astro and TypeScript checks
npm run lint      # run ESLint and formatting checks
npm test          # run Vitest suite
```

Run relevant checks after every implementation. Test scoring, confidence, recommendations, cost estimates, data validation, and browse/compare/find/cost flows when affected.

## Change workflow

1. Inspect repository and existing work before editing.
2. Make the smallest change that satisfies the request.
3. Preserve unrelated user changes.
4. Run relevant local checks.
5. Create a local Conventional Commit with an imperative subject.
6. Stop and wait for user verification before starting another implementation.

Never push to GitHub unless explicitly instructed.

## Session log

Before ending a session, append a concise entry to `SESSION_LOG.md` with date, objective, files changed, attempt count, failures and causes, tests and results, commit hash, current state, and exact next step. Record failed approaches once. After a complete implementation, stop after the local commit and wait for user verification.
