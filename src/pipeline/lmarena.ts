import {
  lmarenaResponseSchema,
  lmarenaTextRowSchema,
  lmarenaAgentRowSchema,
  type BenchmarkMeasurement,
} from './types';
import { defaultAliasResolver, ModelAliasResolver } from './aliasResolver';
import { normalizeElo, normalizeAgentScore } from './normalization';
import type { Capability } from '../data/config';

export interface LMArenaConfigOption {
  config: 'text' | 'webdev' | 'agent' | 'vision' | 'search';
  category: Capability;
  metricLabel: string;
}

export const LMARENA_CONFIGS: LMArenaConfigOption[] = [
  { config: 'text', category: 'dailyUse', metricLabel: 'LMSYS Arena Text Elo' },
  {
    config: 'webdev',
    category: 'coding',
    metricLabel: 'LMSYS Arena WebDev Elo',
  },
  {
    config: 'agent',
    category: 'agentic',
    metricLabel: 'LMSYS Arena Agent Score',
  },
  {
    config: 'vision',
    category: 'vision',
    metricLabel: 'LMSYS Arena Vision Elo',
  },
  {
    config: 'search',
    category: 'research',
    metricLabel: 'LMSYS Arena Search Elo',
  },
];

export async function fetchLMArenaCategory(
  configName: string,
  options?: { limit?: number; hfToken?: string },
): Promise<Array<Record<string, unknown>>> {
  const limit = options?.limit ?? 100;
  const token = options?.hfToken || process.env.HF_TOKEN;
  const url = `https://datasets-server.huggingface.co/rows?dataset=lmarena-ai%2Fleaderboard-dataset&config=${encodeURIComponent(configName)}&split=latest&offset=0&limit=${limit}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'Astra-Model-Guide/1.0',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(
      `LMArena HF dataset fetch failed for ${configName}: HTTP ${response.status} ${response.statusText}`,
    );
  }

  const json = await response.json();
  const parsed = lmarenaResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.warn(
      `LMArena payload validation warning for ${configName}:`,
      parsed.error.issues[0]?.message,
    );
    throw new Error(`Invalid LMArena API response format for ${configName}`);
  }

  return parsed.data.rows.map((r) => r.row);
}

export function processLMArenaRows(
  rows: Array<Record<string, unknown>>,
  configOption: LMArenaConfigOption,
  resolver: ModelAliasResolver = defaultAliasResolver,
): BenchmarkMeasurement[] {
  const retrievedAt = new Date().toISOString().split('T')[0];
  const sourceUrl = `https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset`;
  const measurements: BenchmarkMeasurement[] = [];

  for (const raw of rows) {
    if (configOption.config === 'agent') {
      const parsed = lmarenaAgentRowSchema.safeParse(raw);
      if (!parsed.success) continue;
      const data = parsed.data;

      const canonical = resolver.resolve('lmarena', data.model_name);
      if (!canonical) continue;

      const {
        normalized,
        min,
        max,
        raw: normalizedRaw,
      } = normalizeAgentScore(data.score);

      measurements.push({
        id: `lmarena-${configOption.config}-${canonical.slug}`,
        modelSlug: canonical.slug,
        benchmarkName: `LMSYS Chatbot Arena (${configOption.config})`,
        category: configOption.category,
        rawScore: normalizedRaw,
        minScale: min,
        maxScale: max,
        normalizedScore: normalized,
        rank: data.rank ?? null,
        sampleCount: data.session_count ?? data.observation_count ?? null,
        confidenceLow: data.score_ci_lower
          ? Number(data.score_ci_lower.toFixed(4))
          : null,
        confidenceHigh: data.score_ci_upper
          ? Number(data.score_ci_upper.toFixed(4))
          : null,
        evaluationDate: data.leaderboard_publish_date || retrievedAt,
        sourceId: 'lmarena-leaderboard',
        sourceName: 'LMSYS Chatbot Arena Leaderboard',
        sourceUrl,
        retrievedAt,
        metadata: {
          license: data.license,
          organization: data.organization,
        },
      });
    } else {
      const parsed = lmarenaTextRowSchema.safeParse(raw);
      if (!parsed.success) continue;
      const data = parsed.data;

      const canonical = resolver.resolve('lmarena', data.model_name);
      if (!canonical) continue;

      const {
        normalized,
        min,
        max,
        raw: normalizedRaw,
      } = normalizeElo(data.rating);

      measurements.push({
        id: `lmarena-${configOption.config}-${canonical.slug}`,
        modelSlug: canonical.slug,
        benchmarkName: `LMSYS Chatbot Arena (${configOption.config})`,
        category: configOption.category,
        rawScore: normalizedRaw,
        minScale: min,
        maxScale: max,
        normalizedScore: normalized,
        rank: data.rank ?? null,
        sampleCount: data.vote_count ?? null,
        confidenceLow: data.rating_lower ? Math.round(data.rating_lower) : null,
        confidenceHigh: data.rating_upper
          ? Math.round(data.rating_upper)
          : null,
        evaluationDate: data.leaderboard_publish_date || retrievedAt,
        sourceId: 'lmarena-leaderboard',
        sourceName: 'LMSYS Chatbot Arena Leaderboard',
        sourceUrl,
        retrievedAt,
        metadata: {
          variance: data.variance,
          license: data.license,
          organization: data.organization,
        },
      });
    }
  }

  return measurements;
}
