# Multi-Agent Collaboration Protocol

This protocol establishes a conflict-free coordination system for multiple AI agents working concurrently on the `ai-model-web` repository.

---

## 1. Core Principles

1. **Pre-flight Awareness**: Before modifying any code, an agent must inspect the active coordination registry to know what the peer agent is working on.
2. **Path Claiming**: No agent may edit a file or directory that is currently claimed by another agent.
3. **Domain Separation**: Agents should preferably operate in distinct sub-systems:
   - **Agent 1 (Data & Architecture)**: Schema, data fixtures, scoring algorithms, cost calculators, Vitest test suites (`src/data/`, `src/db/`, `src/lib/`, `src/types/`, `tests/`).
   - **Agent 2 (Presentation & Interaction)**: Astro pages, React client islands, layouts, styles, and UI components (`src/pages/`, `src/components/`, `src/layouts/`, `src/styles/`).
4. **Shared Type Contracts**: Neither agent may break shared contracts defined in `src/types/model.ts` without explicit agreement.
5. **No Emojis as Icons**: Strictly adhere to the zero-emoji rule across all generated code, markdown, logs, and UI.

---

## 2. Shared Coordination Files

All coordination state lives in `.agents/`:

| File | Purpose | Read/Write Pattern |
| :--- | :--- | :--- |
| `.agents/registry.json` | Live list of active agents and claimed file paths | Atomic read & write via `scripts/agent-collab.mjs` |
| `.agents/activity.jsonl` | Append-only chronological event ledger | Append-only audit stream of actions |
| `SESSION_LOG.md` | Persistent session log across agent lifecycles | Appended at conclusion of major milestones |

---

## 3. Step-by-Step Workflow for Each Agent

### Step 1: Pre-flight Check
Before writing any code or proposing edits, run:
```bash
node scripts/agent-collab.mjs status
```
Inspect:
- Who is active?
- Which files or directories are currently locked?
- What were the most recent changes?

### Step 2: Register Agent
Register your agent identity and session goal:
```bash
node scripts/agent-collab.mjs register <agentId> "<Role>" "<Session Goal>"
```
*Example:*
```bash
node scripts/agent-collab.mjs register agent-alpha "Data Architect" "Populate initial 12 model fixtures"
```

### Step 3: Claim Paths Before Modification
Before editing a file or folder, claim it:
```bash
node scripts/agent-collab.mjs claim <agentId> <filePathOrDirectory> "<Task Description>"
```
*Example:*
```bash
node scripts/agent-collab.mjs claim agent-alpha "src/data/models.json" "Writing verified model fixtures"
```
- If the path (or parent directory) is claimed by another agent, the script **blocks with an error**, displaying the claiming agent and their task.
- If free, the claim is granted and recorded in `.agents/registry.json`.

### Step 4: Implement and Locally Verify
- Write or edit the code.
- Run the required local verification commands:
  ```bash
  npm test
  npm run check
  npm run lint
  ```

### Step 5: Commit and Release Claim
- Create a local Git commit per Conventional Commits:
  ```bash
  git commit -m "feat(data): add initial model fixtures"
  ```
- Release the claim:
  ```bash
  node scripts/agent-collab.mjs release <agentId> <filePathOrDirectory>
  ```
- Optionally log milestone completion:
  ```bash
  node scripts/agent-collab.mjs log <agentId> "COMPLETE" <target> "Milestone description"
  ```

---

## 4. Conflict Resolution Strategy

1. **Path Contention**: If Agent B needs a file currently claimed by Agent A:
   - Agent B works on an unblocked task or complementary module.
   - Alternatively, Agent B waits for Agent A to release the claim.
2. **Git Worktree / Isolated Workspaces**:
   - For major concurrent features, each agent should work in an independent Git worktree or feature branch (`git worktree add ../agent-worktree branch-name`).
   - Merge back into `main` after local tests pass.
3. **Data Contract Changes**:
   - If `src/types/model.ts` must change, the initiating agent creates a non-breaking extension (e.g. optional properties) so the other agent's code does not fail `npm run check`.
