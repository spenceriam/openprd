export interface ModelInfo {
  name: string;
  contextWindow: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  description: string;
}

export interface ProviderInfo {
  name: string;
  models: ModelInfo[];
  baseUrl: string;
  authHeader: string;
}

export const AI_PROVIDERS: Record<string, ProviderInfo> = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    authHeader: 'Bearer',
    models: [
      {
        name: 'gpt-4o',
        contextWindow: 128000,
        inputCostPer1k: 0.005,
        outputCostPer1k: 0.015,
        description: 'Most capable model, best for complex PRDs'
      },
      {
        name: 'gpt-4o-mini',
        contextWindow: 128000,
        inputCostPer1k: 0.00015,
        outputCostPer1k: 0.0006,
        description: 'Fast and cost-effective for most PRDs'
      },
      {
        name: 'gpt-4-turbo',
        contextWindow: 128000,
        inputCostPer1k: 0.01,
        outputCostPer1k: 0.03,
        description: 'Previous generation, still very capable'
      }
    ]
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    authHeader: 'x-api-key',
    models: [
      {
        name: 'claude-3-5-sonnet-20241022',
        contextWindow: 200000,
        inputCostPer1k: 0.003,
        outputCostPer1k: 0.015,
        description: 'Excellent for structured thinking and PRDs'
      },
      {
        name: 'claude-3-haiku-20240307',
        contextWindow: 200000,
        inputCostPer1k: 0.00025,
        outputCostPer1k: 0.00125,
        description: 'Fast and economical for simpler PRDs'
      }
    ]
  }
};

export function getModelInfo(provider: string, modelName: string): ModelInfo | null {
  const providerInfo = AI_PROVIDERS[provider];
  if (!providerInfo) return null;
  
  return providerInfo.models.find(m => m.name === modelName) || null;
}

export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

export function calculateCost(tokens: number, costPer1k: number): number {
  return (tokens / 1000) * costPer1k;
}
