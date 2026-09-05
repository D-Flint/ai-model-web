<div align="center">

# Astra — AI Model Guide & Decision Engine

**The clear, transparent, consumer-first decision engine for AI models.**  
*Because nobody should need a PhD in benchmark metrics just to pick the right AI tool.*

[![Astro](https://img.shields.io/badge/Astro-5.0+-BC52EE?style=flat&logo=astro&logoColor=white)](https://astro.build)
[![React](https://img.shields.io/badge/React-19.0+-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0+-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=flat&logo=drizzle&logoColor=black)](https://orm.drizzle.team)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

<p align="center">
  <a href="#the-vision">Vision</a> •
  <a href="#user-journey">User Journey</a> •
  <a href="#flagship-features">Features</a> •
  <a href="#scoring--methodology">Scoring System</a> •
  <a href="#tech-stack--architecture">Architecture</a> •
  <a href="#design-system-soft-utility">Design</a> •
  <a href="#getting-started">Getting Started</a>
</p>

---

</div>

## The Vision

Choosing an AI model today feels like reading research papers. Standard leaderboards are overloaded with acronyms like **SWE-bench**, **GPQA**, **MMLU**, **TTFT**, and **ELO**, leaving everyday users, students, writers, and software builders asking the same simple question:

> **"Which AI model should I actually use for what I want to do?"**

**Astra** is the **PCPartPicker for AI models**. It bridges the gap between raw research benchmarks and real-world utility by translating complex technical telemetry into intuitive, explainable **0–100 consumer ratings**, transparent cost-per-task estimates, and side-by-side head-to-head comparisons.

---

## User Journey

Astra guides visitors through an intuitive decision funnel rather than a static leaderboard wall:

```text
  +-----------------+       +-----------------+       +-----------------+       +-----------------+
  |   1. DISCOVER   | ----> |   2. COMPARE    | ----> |  3. UNDERSTAND  | ----> |    4. CHOOSE    |
  | Search & filter |       | Head-to-head    |       | Traceable data  |       | Confident, best |
  | by capability   |       | 2-4 models      |       | & task costs    |       | model selection |
  +-----------------+       +-----------------+       +-----------------+       +-----------------+
```

---

## Flagship Features

### 1. Consumer-First Model Explorer
* **Filter with plain terms**: Filter by Provider, Coding ability, Agentic readiness, Daily use, Pricing, Modality, and Context size.
* **Unified 0–100 Scores**: Clean, standardized numerical ratings across Intelligence, Coding, Agents, Writing, Research, Speed, and Reliability.
* **Context at a glance**: Clear badges for open-weights, API availability, audio/vision support, and context limits.

### 2. Head-to-Head Comparison Engine
* Compare **2 to 4 models simultaneously** with synchronous row alignments.
* **Smart Verdicts**: Direct bottom-line guidance (*"Choose Claude 3.7 Sonnet if you need autonomous coding loops; choose Gemini 2.5 Pro if you require a 2M token context window"*).
* **Tradeoff Spotlights**: Highlights strengths, price differentials, and trade-offs without misleading binary red/green color traps.

### 3. Deterministic Model Finder (Wizard)
* An interactive 3-step recommendation flow for undecided users:
  1. *What do you mainly want to accomplish?* (Coding, Research, Casual Chat, Writing, Agents...)
  2. *What matters most to you?* (Peak Quality, Low Latency, Lowest Price, Value Balance...)
  3. *What is your operational budget?* (Free, Budget-conscious, High-volume production...)
* Yields **Top Pick**, **Best Value Alternative**, and **High-Performance Option** with detailed rationales.

### 4. "Effective Cost Per Task" Engine
* **Beyond raw token rates**: Cheaper models that hallucinate or require multiple retries often cost *more* in production than a smarter, higher-priced model.
* **Formula**:
  $$\text{Effective Cost Per Task} = \frac{\text{Average Cost Per Attempt}}{\text{Task Success Probability}} + \text{Agentic Tool Overhead}$$
* Calculates real-world task tiers: *Fix a bug*, *Summarize a 50-page PDF*, *Draft customer emails*, or *Execute a multi-file coding agent task*.

### 5. Dedicated Use-Case Rankings
* Standalone rankings with editorial commentary and context:
  * **Best for Coding & Software Development**
  * **Best for Autonomous Agent Workflows**
  * **Best for Everyday General Use**
  * **Best Value & Cost Efficiency**
  * **Best for In-Depth Research & Synthesis**

### 6. Radical Transparency & Provenance
* **Zero black-box scores**: Every single metric can be expanded to reveal:
  * Raw benchmark inputs and weights
  * First-party testing results
  * Normalization methodology
  * Source links, verification dates, and sample sizes
  * Statistical confidence score (%)

---

## Scoring & Methodology

Astra scores are composite, deterministic evaluations designed to avoid benchmark gaming:

| Metric | Target Capability | Primary Evaluation Inputs |
| :--- | :--- | :--- |
| **Overall** | Holistic model competence | Blended weighted aggregate across all capability pillars |
| **Intelligence** | Reasoning, math, logic, complex problem solving | Public reasoning evals, multi-step deduction, hard logic tests |
| **Coding** | Code gen, debugging, refactoring, tests | Real-world bug fixes, multi-language completion, SWE tests |
| **Agentic Use** | Tool use, CLI execution, error recovery, persistence | Agent benchmarks, multi-turn tool loops, schema adherence |
| **Daily Use** | Tone, conciseness, instruction following, chat | Preference evaluations, summary fidelity, daily prompt suite |
| **Research** | Synthesis, factual retrieval, citation discipline | Long-document comprehension, hallucination rate tests |
| **Reliability** | Consistent formatting, uptime, low refusal rate | Schema compliance rate, response variance across identical seeds |
| **Cost Efficiency** | Quality delivered per dollar spent | Task completion rate / Effective task cost |

### Data Provenance Hierarchy
1. **Tier 1 — Provider Truth**: Official documentation for pricing, context windows, modalities, and limits.
2. **Tier 2 — Public Evals**: Verified independent evaluations and peer-reviewed technical reports.
3. **Tier 3 — Aggregator APIs**: Live routing, pricing indexers, and operational status feeds.
4. **Tier 4 — Internal Real-World Suite**: Controlled multi-turn prompts testing agent repair, code fixes, and long-context recall.

---

## Tech Stack & Architecture

Astra follows a **Content-First, Islands Architecture**:

```text
ai-model-web/
├── public/                 # Static assets, fonts, icons
├── src/
│   ├── components/         # Astro components (static) & React islands (interactive)
│   │   ├── compare/        # Comparison grids, row metrics, verdict cards
│   │   ├── explorer/       # Filter bars, search, model cards
│   │   ├── finder/         # Recommendation wizard steps
│   │   └── ui/             # Reusable design system primitives
│   ├── data/               # Validated fixtures, seed data, scoring configurations
│   ├── db/                 # PostgreSQL schema, Drizzle ORM client, migrations
│   ├── layouts/            # Shared page shells, SEO metadata, breadcrumbs
│   ├── lib/                # Scoring formulas, task cost math, provenance calculators
│   └── pages/              # Astro file-based routes & dynamic SEO pages
├── tests/                  # Scoring & cost estimation unit/integration suites
└── .agents/skills/         # Project-scoped design & engineering skills
```

* **Core Engine**: [Astro 5](https://astro.build) for fast SSR, SSG, and zero-JS default pages.
* **Interactive Islands**: [React 19](https://react.dev) for real-time sliders, comparison trays, and dynamic filters.
* **Styling**: [Tailwind CSS 4](https://tailwindcss.com) with CSS custom variables for instant Dark/Light mode switching.
* **Data Layer**: [Drizzle ORM](https://orm.drizzle.team) with PostgreSQL for strict typed entity relations.
* **Testing**: [Vitest](https://vitest.dev) for unit testing deterministic score calculations and task-cost projections.

---

## Design System: Soft Utility

Astra adopts a **Soft Data / Modern Utility** aesthetic inspired by *Linear*, *Vercel*, and *Raycast*:
* **No AI Clichés**: No gratuitous purple lasers, neon circuit boards, or heavy blur artifacts.
* **Data Legibility**: Strong typographic hierarchy (Geist / Inter), comfortable density, and clear numerical callouts.
* **Calm Palettes**:
  * **Light**: Clean canvas (`#F8F9FB`), crisp cards (`#FFFFFF`), subtle borders (`#E5E7EB`).
  * **Dark**: Deep obsidian (`#0B0D10`), elevated panels (`#12151A`), crisp borders (`#252932`).
* **Motion with Purpose**: Responsive physics (150–250ms), smooth number transitions, and respect for `prefers-reduced-motion`.

### Project-Local Agent Skills
The repository incorporates 5 specialized local design skills in `.agents/skills/`:
* `ui-ux-pro-max` — Design rules, color scales, and stack heuristics.
* `emil-design-eng` — Fluid interaction physics and micro-animations.
* `design-taste-frontend` — Anti-slop visual direction and brief inference.
* `frontend-design` — Subject-grounded typography and layout craft.
* `impeccable` — Design director auditing and polish passes.

---

## Getting Started

### Prerequisites
* **Node.js**: `v20.0.0` or higher
* **Package Manager**: `npm`

### Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/D-Flint/ai-model-web.git
cd ai-model-web

# 2. Install dependencies
npm install

# 3. Start the local development server
npm run dev
```

### Essential Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start local Astro development server with HMR |
| `npm run build` | Compile static output & SSR server entrypoints |
| `npm run preview` | Preview production build locally |
| `npm run check` | Run Astro template and strict TypeScript checks |
| `npm run lint` | Execute code formatting and ESLint validations |
| `npm test` | Run Vitest unit tests on scoring and cost engines |

---

## Repository & Contribution Rules

1. **Product Truth**: Always treat [`ai-model-guide-gpt6-astra-brief.md`](ai-model-guide-gpt6-astra-brief.md) and [`AGENTS.md`](AGENTS.md) as the authoritative product reference.
2. **Strict Data Honesty**: Never guess or invent pricing, scores, or benchmarks. All unverified fixture data must be labeled as mock data with explicit verification timestamps.
3. **No Emojis as Icons**: Absolutely do not use emojis or icons in the product, interface, copy, documentation, or implementation unless explicitly requested.
4. **Island Discipline**: Keep marketing and SEO content server-rendered in Astro; isolate React to interactive stateful widgets.
5. **Conventional Commits**: Use imperative commit messages (`feat: add side-by-side comparison grid`, `test: verify cost per task formula`).

---

<div align="center">
  <sub>Designed and engineered for clarity, transparency, and confidence.</sub>
</div>
