export interface ModelInfo {
  name: string;
  contextWindow: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  description: string;
}

export type AuthMethod = 'Bearer' | 'x-api-key' | 'google-api-key';

export interface ProviderModelList {
  endpoint: string;
  authMethod: AuthMethod;
  responseFormat: 'openai' | 'google' | 'anthropic' | 'openrouter' | 'deepseek' | 'moonshot';
  headers?: Record<string, string>;
}

export interface ProviderInfo {
  name: string;
  models: ModelInfo[];
  baseUrl: string;
  modelList?: ProviderModelList;
}

export const AI_PROVIDERS: Record<string, ProviderInfo> = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    modelList: {
      endpoint: '/models',
      authMethod: 'Bearer',
      responseFormat: 'openai',
    },
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
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    modelList: {
      endpoint: '/models',
      authMethod: 'Bearer',
      responseFormat: 'deepseek',
    },
    models: [
      {
        name: 'deepseek-chat',
        contextWindow: 128000,
        inputCostPer1k: 0.00014,
        outputCostPer1k: 0.00028,
        description: 'DeepSeek Chat - excellent reasoning at low cost'
      },
      {
        name: 'deepseek-coder',
        contextWindow: 128000,
        inputCostPer1k: 0.00014,
        outputCostPer1k: 0.00028,
        description: 'DeepSeek Coder - specialized for technical PRDs'
      }
    ]
  },
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    modelList: {
      endpoint: '/models',
      authMethod: 'Bearer',
      responseFormat: 'openrouter',
    },
    models: [
      // OpenRouter provides pricing and context dynamically via API
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
