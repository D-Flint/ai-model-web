export interface ModelSource {
  id: string;
  name: string;
  url: string;
  sourceType:
    'provider_doc' | 'public_eval' | 'aggregator_api' | 'internal_test';
  publisher: string;
  retrievedAt: string;
}

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  cachedInputPerMillion?: number;
  currency: string;
  sourceId: string;
  lastVerifiedAt: string;
}

export interface ModelScores {
  overall: number;
  intelligence: number;
  coding: number;
  agentic: number;
  dailyUse: number;
  research: number;
  writing: number;
  vision: number;
  speed: number;
  reliability: number;
  costEfficiency: number;
  confidence: number;
  methodologyVersion: string;
  scoreUpdatedAt: string;
}

export interface Model {
  id: string;
  slug: string;
  name: string;
  provider: string;
  family: string;
  releaseDate: string;
  status: 'active' | 'deprecated' | 'preview';
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsVision: boolean;
  supportsAudio: boolean;
  supportsTools: boolean;
  supportsStructuredOutput: boolean;
  openWeights: boolean;
  apiAvailable: boolean;
  pricing: ModelPricing;
  scores: ModelScores;
  sources: ModelSource[];
  bestForTags: string[];
  lastVerifiedAt: string;
}

export interface TaskProfile {
  id: string;
  slug: string;
  name: string;
  category: 'coding' | 'writing' | 'research' | 'daily' | 'agent';
  description: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  typicalToolCalls: number;
}
