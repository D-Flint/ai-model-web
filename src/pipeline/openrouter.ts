import { openRouterResponseSchema, type OpenRouterModel } from './types';
import { defaultAliasResolver, ModelAliasResolver } from './aliasResolver';
import type { CanonicalModelConfig } from './types';

export interface OpenRouterExtractedData {
  canonicalModel: CanonicalModelConfig;
  rawModel: OpenRouterModel;
  pricing: {
    inputPerMillion: number;
    outputPerMillion: number;
    cachedInputPerMillion: number | null;
  };
  contextWindow: number;
  supportsVision: boolean;
  supportsAudio: boolean;
  retrievedAt: string;
  sourceUrl: string;
}

export async function fetchOpenRouterModels(options?: {
  apiKey?: string;
  endpoint?: string;
}): Promise<OpenRouterModel[]> {
  const endpoint = options?.endpoint || 'https://openrouter.ai/api/v1/models';
  const apiKey = options?.apiKey || process.env.OPENROUTER_API_KEY;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'Astra-Model-Guide/1.0',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoint, { headers });
  if (!response.ok) {
    throw new Error(
      `OpenRouter API fetch failed: HTTP ${response.status} ${response.statusText}`,
    );
  }

  const json = await response.json();
  const parsed = openRouterResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.error('OpenRouter payload validation errors:', parsed.error.issues);
    throw new Error('OpenRouter payload failed schema validation');
  }

  return parsed.data.data;
}

export function processOpenRouterModels(
  models: OpenRouterModel[],
  resolver: ModelAliasResolver = defaultAliasResolver,
): OpenRouterExtractedData[] {
  const retrievedAt = new Date().toISOString().split('T')[0];
  const sourceUrl = 'https://openrouter.ai/api/v1/models';
  const results: OpenRouterExtractedData[] = [];

  for (const raw of models) {
    const canonical = resolver.resolve('openrouter', raw.id);
    if (!canonical) continue;

    // Prices on OpenRouter are per-token as strings, e.g. "0.000003"
    const promptPricePerToken = parseFloat(raw.pricing.prompt || '0');
    const completionPricePerToken = parseFloat(raw.pricing.completion || '0');

    const inputPerMillion = Number(
      (promptPricePerToken * 1_000_000).toFixed(4),
    );
    const outputPerMillion = Number(
      (completionPricePerToken * 1_000_000).toFixed(4),
    );

    const modality = raw.architecture?.modality || '';
    const supportsVision = modality.includes('image');
    const supportsAudio = modality.includes('audio');

    results.push({
      canonicalModel: canonical,
      rawModel: raw,
      pricing: {
        inputPerMillion,
        outputPerMillion,
        cachedInputPerMillion: null,
      },
      contextWindow: raw.context_length,
      supportsVision,
      supportsAudio,
      retrievedAt,
      sourceUrl,
    });
  }

  return results;
}
