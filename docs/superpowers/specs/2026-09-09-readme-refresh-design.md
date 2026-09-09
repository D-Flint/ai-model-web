# README refresh design

## Objective

Make the root README a polished, accurate entry point for both prospective Synapse users and project contributors. It should explain the product's value before it asks readers to understand the implementation.

## Audience and navigation

The document serves two audiences in one intentional sequence:

1. Prospective users learn that Synapse is a consumer AI model decision engine and see the journey: Discover → Compare → Understand → Choose.
2. Contributors can quickly reach local setup, commands, architecture, data operations, validation, and deployment references.

A linked table of contents will make both paths scannable without duplicating the detailed documents in `docs/`.

## Content structure

1. Title, concise product value proposition, and repository status links.
2. Product journey and a user-facing feature overview.
3. Quick start: prerequisite versions, installation, development server, and local URL.
4. Data trust: clear source categories, provenance expectations, score and pricing treatment, and indexing status.
5. Architecture: responsibility map for Astro routes, React islands, domain logic, data, and optional persistence.
6. Development reference: npm commands and environment variables.
7. Data workflows: catalog validation/import, supported refresh commands, historical snapshot behavior, and optional PostgreSQL persistence.
8. Quality, deployment, documentation index, repository, and license.

## Accuracy rules

- Derive claims only from the current source tree, package scripts, and maintained project documentation.
- Do not invent product metrics, current catalog counts, deployment state, screenshots, URLs, badges, or support claims.
- Remove the link to the absent `ai-model-guide-gpt6-astra-brief.md` rather than leaving a broken reference.
- Preserve the distinction among provider facts, public benchmark evidence, derived scores, and estimates.

## Presentation

Use calm, readable Markdown: short introductory prose, semantic headings, compact tables only where they improve lookup, and focused shell blocks. Avoid decorative imagery and badges that cannot be verified. Link to detailed operational documents instead of duplicating their content.

## Validation

Run `git diff --check` and confirm all relative Markdown links resolve to tracked repository files. Because the change is documentation-only, no application build or test is required unless the README's commands or scripts prove inaccurate during review.
