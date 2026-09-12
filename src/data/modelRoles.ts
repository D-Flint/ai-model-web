import type { ModelRole } from '../pipeline/types';

/**
 * Explicit recommendation roles for currently tracked models and known
 * specialized classifiers. Eligibility consumes roles, never model names.
 */
export const knownModelRoles: Readonly<Record<string, ModelRole[]>> = {
  'claude-fable-5-1': [
    'general-purpose',
    'reasoning',
    'coding',
    'agentic',
    'vision',
  ],
  'glm-5-3': ['reasoning', 'coding', 'agentic', 'vision'],
  'claude-fable-5': [
    'general-purpose',
    'reasoning',
    'coding',
    'agentic',
    'vision',
  ],
  'gpt-6-astra': [
    'general-purpose',
    'reasoning',
    'coding',
    'agentic',
    'vision',
  ],
  'gpt-5-6-sol': [
    'general-purpose',
    'reasoning',
    'coding',
    'agentic',
    'vision',
  ],
  'claude-opus-5': [
    'general-purpose',
    'reasoning',
    'coding',
    'agentic',
    'vision',
  ],
  'kimi-k3': ['general-purpose', 'reasoning', 'coding', 'agentic', 'vision'],
  'gemini-3-7-flash': [
    'general-purpose',
    'reasoning',
    'coding',
    'agentic',
    'vision',
  ],
  'gpt-5-6-terra': ['general-purpose', 'coding', 'agentic', 'vision'],
  'deepseek-v4-pro-0813': ['general-purpose', 'reasoning', 'coding', 'agentic'],
  'deepseek-v4-1-flash': [
    'general-purpose',
    'reasoning',
    'coding',
    'agentic',
    'vision',
  ],
  'gemini-3-1-pro': [
    'general-purpose',
    'reasoning',
    'coding',
    'agentic',
    'vision',
  ],
  'muse-spark-1-3': ['general-purpose', 'reasoning', 'coding', 'agentic'],
  'claude-sonnet-5': [
    'general-purpose',
    'reasoning',
    'coding',
    'agentic',
    'vision',
  ],
  'gemini-3-8-flash': ['general-purpose', 'reasoning', 'agentic', 'vision'],
  'gemini-3-5-flash': ['general-purpose', 'agentic', 'vision'],
  'claude-opus-4-6': [
    'general-purpose',
    'reasoning',
    'coding',
    'agentic',
    'vision',
  ],
  'deepseek-v4-flash-0731': ['general-purpose', 'coding', 'agentic'],
  'gpt-oss-safeguard-120b': ['safety-classifier', 'moderation'],
  'gpt-oss-safeguard-20b': ['safety-classifier', 'moderation'],
  shieldgemma: ['safety-classifier', 'moderation'],
  'shieldgemma-2': ['safety-classifier', 'moderation'],
};
