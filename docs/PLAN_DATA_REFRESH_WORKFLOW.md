# Deployment & Scheduled Data Refresh Plan

> Status: planning only. No scheduled workflow is active yet.

## Overview

Automate model, benchmark, and pricing refreshes so the static Astro site can
stay current without a developer running the data commands manually.

The preferred direction is a scheduled GitHub Actions job that fetches and
validates a new catalog, commits only an approved data change, and relies on
the hosting provider's normal branch deployment. The hosting provider and the
exact activation policy remain undecided for now.

## Proposed strategy: scheduled Git auto-commit

### How It Would Work

1. **Schedule**: GitHub Actions runs on a daily cron and supports a manual
   `workflow_dispatch` trigger.
2. **Refresh**: Run `npm run data:refresh` with the required source credentials.
3. **Validate**: Run `npm run check`, `npm test`, and the relevant data-integrity
   checks. A failed or structurally invalid refresh must stop before commit.
4. **Review the diff**: Limit the write set to generated catalog/data files;
   do not commit source-code or unrelated working-tree changes.
5. **Publish the snapshot**: Commit and push the changed verified catalog only
   when validation succeeds and the diff is within the planned scope.
6. **Deploy**: The selected hosting provider rebuilds the static Astro site
   from the new commit.

---

## Planned workflow specification

Target path when ready to implement: `.github/workflows/data-refresh.yml`

The workflow must not be added or enabled until the hosting target, branch,
refresh frequency, and failure-notification policy are confirmed.

```yaml
name: Scheduled Data Refresh

on:
  schedule:
    # Run every day at 00:00 UTC
    - cron: '0 0 * * *'
  workflow_dispatch: # Manual trigger via GitHub Actions UI

permissions:
  contents: write

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run data refresh pipeline
        run: npm run data:refresh
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

      - name: Run checks and tests
        run: |
          npm run check
          npm test

      - name: Commit and push changes
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'chore(data): automated daily refresh of verified models [skip ci]'
          file_pattern: 'src/data/verifiedModels.json'
```

---

## Prerequisites Before Activating
- [ ] Push repository to GitHub.
- [ ] Connect repository to Vercel or Cloudflare Pages.
- [ ] (Optional) Add OPENROUTER_API_KEY to GitHub Repository Secrets.
- [ ] Ensure GitHub Actions repository permission: **Workflow permissions** -> **Read and write permissions**.

## Decisions to make later

- **Hosting target**: Cloudflare Workers/Pages or another provider. The repo
  currently contains Cloudflare configuration, but the plan must match the
  actual deployment target.
- **Publish policy**: direct auto-commit to `main`, or open a pull request for
  human review before deployment.
- **Refresh cadence**: daily, weekly, or source-specific schedules.
- **Secrets and source access**: which credentials are available for OpenRouter,
  Hugging Face, and any provider-specific checks.
- **Failure handling**: GitHub notification, issue creation, or an external
  alert when refresh or validation fails.

## Acceptance criteria for implementation

- No developer command is required for the agreed scheduled refresh.
- A source outage, schema change, validation failure, or unexpected data diff
  cannot overwrite the published catalog.
- Successful refreshes leave provenance dates and source URLs intact.
- The site deploys the refreshed catalog only after checks pass.
- Manual dispatch can run the same flow for a controlled refresh.
- The workflow documents required secrets, permissions, rollback, and the
  exact files it may modify.

## Explicit non-goals

- Do not fetch provider data from the Astro runtime.
- Do not silently replace official provider facts or reviewed pricing with
  unreviewed OpenRouter values.
- Do not activate automation before the pending decisions above are resolved.
