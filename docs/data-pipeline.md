# Astra AI Model Real Data Pipeline Documentation

## Overview

Astra uses an evidence-driven, source-tracked real data pipeline to evaluate and rank current AI foundation models. Rather than guessing benchmark scores or scraping arbitrary websites, the system ingests data from authoritative structured APIs and datasets, normalizes raw measurements into comparable 0–100 capability scores, preserves full provenance, calculates confidence ratings, and feeds both Astro static pages and the PostgreSQL database.

---

## 1. Data Sources

The pipeline integrates three external structured data sources and authoritative provider documentation:

### 1.1 OpenRouter API
- **Endpoint**: `https://openrouter.ai/api/v1/models`
- **Role**: Primary source for current model availability, pricing (prompt, completion, cached tokens), context window lengths, input/output modalities, and tokenizer parameters.
- **Authentication**: Optional `OPENROUTER_API_KEY` for higher rate limits. Works without a key.
- **Adapter**: `src/pipeline/openrouter.ts`

### 1.2 LMSYS Chatbot Arena (Hugging Face Datasets)
- **Source**: `lmarena-ai/leaderboard-dataset` via Hugging Face Serverless Dataset Viewer API:
  - `https://datasets-server.huggingface.co/rows?dataset=lmarena-ai%2Fleaderboard-dataset&config={category}&split=latest`
- **Categories Ingested**:
  - `text`: Daily conversational text preference & general intelligence (Elo rating)
  - `webdev`: Coding & web application generation preference (Elo rating)
  - `agent`: Multi-step agentic performance (Bradley-Terry centered score & observations)
  - `vision`: Image understanding & multimodal reasoning (Elo rating)
  - `search`: Information retrieval, citation quality, and search synthesis (Elo rating)
- **Adapter**: `src/pipeline/lmarena.ts`

### 1.3 SWE-bench Verified Leaderboard
- **Source**: SWE-bench GitHub repository official leaderboard data:
  - `https://raw.githubusercontent.com/swe-bench/swe-bench.github.io/master/data/leaderboards.json`
- **Role**: Ground truth for real-world software engineering capability (resolved percentage across verified problem instances under standardized harnesses such as Sonar Foundation Agent, mini-SWE-agent, OpenHands, Agentless).
- **Adapter**: `src/pipeline/swebench.ts`

### 1.4 Official Provider Specifications
- **Specs Registry**: `src/data/officialProviders.ts`
- **Role**: Source of truth for factual specifications: release dates, maximum completion output tokens, multimodal support (audio/video/vision), structured output compliance, and direct provider pricing verification.
- **Providers**: Anthropic, Google DeepMind, OpenAI, DeepSeek, Alibaba (Qwen), Meta AI, Mistral AI.

---

## 2. Ingestion Flow & Architecture

```text
External Sources (OpenRouter, LMSYS Hugging Face API, SWE-bench)
                           ↓
                Source-Specific Adapters
        (openrouter.ts, lmarena.ts, swebench.ts)
                           ↓
                 Zod Payload Validation
                  (src/pipeline/types.ts)
                           ↓
                Model Identity Resolution
              (src/pipeline/aliasResolver.ts)
                           ↓
              Normalization & Evidence Engine
            (src/pipeline/normalization.ts)
                           ↓
            Derived Scoring & Confidence Engine
             (src/pipeline/confidence.ts)
                           ↓
           PostgreSQL Database (Drizzle ORM) &
          Verified Catalog (verifiedModels.json)
                           ↓
                  Website & UI Pages
```

---

## 3. Environment Variables

Create a `.env` file based on `.env.example`:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | No (Optional) | PostgreSQL connection URI for database persistence and migrations. If omitted, the site runs purely from the local verified catalog. |
| `OPENROUTER_API_KEY` | No (Optional) | Bearer token for OpenRouter API requests. |
| `HF_TOKEN` | No (Optional) | User access token for Hugging Face datasets. |
| `SITE_URL` | No (Optional) | Base URL for sitemap and canonical link generation. |

---

## 4. Database Schema

The pipeline uses PostgreSQL managed with Drizzle ORM:

- **`providers`**: Organization details (id, slug, name, website, description).
- **`models`**: Canonical models with verified architecture facts (slug, name, provider_id, family, release_date, context_window, max_output_tokens, supports_vision, supports_audio, supports_tools, supports_structured_output, open_weights, api_available, last_verified_at).
- **`model_pricing`**: Token pricing per million tokens (input, output, cached, currency, source_id, last_verified_at).
- **`sources`**: Authoritative provenance records (id, name, url, source_type, publisher, license_notes, retrieved_at, published_at).
- **`model_aliases`**: Mapping from external source identifiers to canonical model slugs (`source_name`, `source_model_id`, `model_id`, `alias`).
- **`benchmark_results`**: Preserved raw benchmark measurements (benchmark_name, category, raw_score, normalized_score, scale_min, scale_max, rank, sample_count, confidence_low, confidence_high, harness, evaluation_date, metadata_json).
- **`model_scores`**: Versioned derived consumer scores across 10 capability axes + composite overall score.
- **`score_history`**: Audit trail of score iterations over time.
- **`catalog_snapshots`**: Cryptographically hashed (`sha256`) archives of verified catalog snapshots.

---

## 5. Refresh Commands

The project provides automated NPM scripts to run parts of the pipeline or the entire refresh:

```bash
# Ingest OpenRouter metadata and pricing
npm run data:openrouter

# Ingest LMSYS Chatbot Arena datasets
npm run data:lmarena

# Ingest SWE-bench Verified leaderboard
npm run data:swebench

# Verify against official provider documentation
npm run data:official

# Recalculate 0-100 scores and weights
npm run data:scores

# Full end-to-end refresh (fetches all sources, validates catalog, persists to DB/file)
npm run data:refresh
```

---

## 6. Scoring & Normalization Methodology

### 6.1 Normalization
- **Elo Ratings (LMSYS Arena)**: Normalized linearly between 1,000 and 1,700 using:
  $$\text{Normalized} = \text{round}\left(\frac{\text{Rating} - 1000}{1700 - 1000} \times 100\right)$$
- **SWE-bench Verified**: Normalized linearly on the 0–100% resolved scale.
- **Agent Delta Scores**: Normalized within $[-0.3, +0.3]$ range.
- **Cost Efficiency**: Evaluated using a logarithmic scale on blended token price (70% input + 30% output), awarding higher scores to affordable models while distinguishing tiers from $0.10/1M to $60/1M.
- **Speed & Latency**: Evaluated based on model size tier (Flash/Mini/Haiku vs Pro/Opus).

### 6.2 Centrally Configured Weights
Weights are defined in `src/data/config.ts`:
- Intelligence: 25%
- Coding: 18%
- Agentic: 15%
- Daily Use: 12%
- Research: 10%
- Reliability: 8%
- Writing: 5%
- Vision: 3%
- Speed: 2%
- Cost Efficiency: 2%

### 6.3 Confidence Score Calculation
Confidence (0–100%) reflects:
1. **Independent sources count** (up to 30%)
2. **Category coverage** (up to 30%)
3. **Sample count / vote volume** (up to 20%)
4. **Recency** (up to 10%, decaying over 180 days)
5. **Official provider verification** (10%)

---

## 7. Adding a New Model

To add a new foundation model to the pipeline:

1. Open `src/data/canonicalModels.ts` and add an entry to `CANONICAL_MODELS`:
   ```ts
   {
     slug: 'model-slug',
     name: 'Display Name',
     provider: 'Provider Name',
     providerSlug: 'provider-slug',
     family: 'Family Name',
     openWeights: false,
     openRouterId: 'provider/model-id',
     lmarenaAliases: ['lmarena-name-1', 'lmarena-name-2'],
     swebenchAliases: ['SWE-bench Display Name'],
     officialDocsUrl: 'https://...',
     description: 'Consumer friendly description...',
     strengths: [...],
     weaknesses: [...],
     tags: [...],
   }
   ```
2. Open `src/data/officialProviders.ts` and add official ground-truth specs to `OFFICIAL_PROVIDER_SPECS`:
   - `releaseDate`, `contextWindow`, `maxOutputTokens`, modalities (`supportsVision`, `supportsAudio`), and official pricing.
3. Run `npm run data:refresh` to ingest the new model from OpenRouter, LMSYS, and SWE-bench.
4. Run `npm test` to verify catalog integrity.

---

## 8. Adding a New Data Source

1. Define the payload Zod schema in `src/pipeline/types.ts`.
2. Implement an ingestion adapter in `src/pipeline/<sourceName>.ts` that fetches, validates, and normalizes the payload.
3. Register source aliases in `src/pipeline/aliasResolver.ts`.
4. Add the ingestion step to `runIngestionPipeline` in `src/pipeline/engine.ts`.
5. Add a CLI script in `scripts/ingest-<sourceName>.ts` and add an npm script in `package.json`.

---

## 9. Troubleshooting

- **OpenRouter Rate Limits**: If receiving HTTP 429, supply `OPENROUTER_API_KEY` in `.env`.
- **Hugging Face Serverless Timeout**: If dataset queries fail, supply `HF_TOKEN` in `.env` to bypass anonymous rate restrictions.
- **Missing Benchmark Evidence**: If an external benchmark has not yet evaluated a newly released model, the pipeline falls back gracefully to official provider facts, reduces confidence, and does NOT treat missing data as zero.
- **Normalization Mismatch**: If adding custom evidence, ensure `normalize(raw, min, max) === normalized`.
