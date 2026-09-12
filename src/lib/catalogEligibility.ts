import type { CatalogModel } from './catalogSchema';

export type EligibilityReason =
  | 'KEEP'
  | 'NO_LIVEBENCH_DATA'
  | 'SPECIALIZED_SAFETY_CLASSIFIER'
  | 'RESEARCH_OR_MULTIMODAL_ONLY'
  | 'DEPRECATED_OR_SUPERSEDED'
  | 'DUPLICATE_CHECKPOINT'
  | 'OBSCURE_OR_SUB_VARIANT';

export interface EligibilityResult {
  eligible: boolean;
  status: 'active' | 'deprecated' | 'legacy' | 'experimental';
  isTracked: boolean;
  reason: EligibilityReason;
}

export const EXCLUDED_SPECIALIZED_OR_SAFETY = new Set<string>([
  'shieldgemma',
  'shieldgemma-2',
  'gpt-oss-safeguard-120b',
  'gpt-oss-safeguard-20b',
]);

export const EXCLUDED_RESEARCH_OR_MULTIMODAL_ONLY = new Set<string>([
  'janus-1-3b',
  'janusflow-1-3b',
  'janus-pro-1b',
  'janus-pro-7b',
  'paligemma',
  'txgemma',
  'medgemma',
  'recurrentgemma',
  'codegemma',
  'deepseek-prover-v1-5-rl',
  'deepseek-math-7b-rl',
  'deepseek-math-7b-instruct',
  'deepseek-v3-base',
  'deepseek-vl2',
  'deepseek-vl2-small',
  'deepseek-vl2-tiny',
  'deepseek-vl-7b-chat',
  'deepseek-vl-1-3b-chat',
]);

export const EXCLUDED_DEPRECATED_SUPERSEDED = new Set<string>([
  'gpt-3-5-turbo',
  'gpt-4-0314',
  'gpt-4-0613',
  'gpt-4-32k',
  'gpt-4-1106-preview',
  'gpt-4-0125-preview',
  'gpt-5-2',
  'gpt-5-2-pro',
  'claude-1-0',
  'claude-1-3',
  'claude-instant-1-0',
  'claude-instant-1-1',
  'claude-instant-1-2',
  'claude-2-0',
  'claude-2-1',
  'claude-3-haiku-20240307',
  'claude-3-sonnet-20240229',
  'claude-3-opus-20240229',
  'claude-3-5-sonnet-20240620',
  'gemini-1-0-pro',
  'gemini-1-0-nano',
  'gemini-1-0-ultra',
  'gemma-2b',
  'gemma-7b',
  'deepseek-llm-7b-chat',
  'deepseek-llm-67b-chat',
  'deepseek-coder-1-3b-instruct',
  'deepseek-coder-6-7b-instruct',
  'deepseek-coder-33b-instruct',
  'deepseek-coder-v2-instruct',
  'deepseek-coder-v2-lite-instruct',
  'deepseek-v2-chat',
  'deepseek-v2-lite-chat',
  'deepseek-v2-5',
  'deepseek-r1-zero',
]);

export const EXCLUDED_DUPLICATE_CHECKPOINTS = new Set<string>([
  'gpt-4o-2024-08-06',
  'command-r-plus-08-2024',
  'gemini-2-0-pro-exp',
  'o1-preview',
]);

export const EXCLUDED_SUB_VARIANTS_AND_OBSCURE = new Set<string>([
  'deepseek-r1-distill-qwen-1-5b',
  'deepseek-r1-distill-qwen-7b',
  'deepseek-r1-distill-llama-8b',
  'deepseek-r1-distill-qwen-14b',
  'llama-3-2-1b-instruct',
  'llama-3-2-3b-instruct',
  'llama-3-2-11b-vision-instruct',
  'gemini-1-5-flash-8b',
  'ministral-3b',
  'amazon-nova-micro',
  'gemma-2-2b',
  'gemma-3n',
  'gpt-4-1-nano',
  'gpt-5-nano',
  'claude-opus-4-1',
  'claude-opus-4',
  'claude-sonnet-4',
  'claude-opus-4-7',
  'claude-opus-4-8',
  'gemini-3-1-flash-lite',
  'gemini-2-5-flash-lite',
  'gemini-2-0-flash-lite',
  'o4-mini-deep-research',
  'o3-deep-research',
]);

/**
 * Configurable eligibility function to determine if a model is part of the
 * curated, LiveBench-backed Synapse v1 catalog.
 */
export function evaluateModelEligibility(
  model: CatalogModel,
): EligibilityResult {
  if (model.dataKind === 'mock') {
    return {
      eligible: true,
      status: 'active',
      isTracked: true,
      reason: 'KEEP',
    };
  }

  const hasLiveBench =
    model.evidence &&
    model.evidence.some((e) => e.sourceId === 'livebench-leaderboard');

  if (!hasLiveBench) {
    return {
      eligible: false,
      status: 'legacy',
      isTracked: false,
      reason: 'NO_LIVEBENCH_DATA',
    };
  }

  const slug = model.slug;

  if (EXCLUDED_SPECIALIZED_OR_SAFETY.has(slug)) {
    return {
      eligible: false,
      status: 'experimental',
      isTracked: false,
      reason: 'SPECIALIZED_SAFETY_CLASSIFIER',
    };
  }

  if (EXCLUDED_RESEARCH_OR_MULTIMODAL_ONLY.has(slug)) {
    return {
      eligible: false,
      status: 'experimental',
      isTracked: false,
      reason: 'RESEARCH_OR_MULTIMODAL_ONLY',
    };
  }

  if (EXCLUDED_DEPRECATED_SUPERSEDED.has(slug)) {
    return {
      eligible: false,
      status: 'deprecated',
      isTracked: false,
      reason: 'DEPRECATED_OR_SUPERSEDED',
    };
  }

  if (EXCLUDED_DUPLICATE_CHECKPOINTS.has(slug)) {
    return {
      eligible: false,
      status: 'legacy',
      isTracked: false,
      reason: 'DUPLICATE_CHECKPOINT',
    };
  }

  if (EXCLUDED_SUB_VARIANTS_AND_OBSCURE.has(slug)) {
    return {
      eligible: false,
      status: 'legacy',
      isTracked: false,
      reason: 'OBSCURE_OR_SUB_VARIANT',
    };
  }

  return {
    eligible: true,
    status: 'active',
    isTracked: true,
    reason: 'KEEP',
  };
}
