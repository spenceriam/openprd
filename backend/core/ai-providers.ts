export interface ModelInfo {
  name: string;
  contextWindow: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
}

export type AuthMethod = 'Bearer' | 'x-api-key' | 'google-api-key';

export interface ProviderModelList {
  endpoint: string;
  authMethod: AuthMethod;
  responseFormat: 'openai' | 'google' | 'anthropic' | 'openrouter' | 'deepseek' | 'moonshot';
  // Optional headers for specific providers
  headers?: Record<string, string>;
}

export interface ProviderInfo {
  name: string;
  models: ModelInfo[];
  baseUrl: string;
  modelList?: ProviderModelList;
  availableBaseUrls?: { name: string; url: string }[];
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
      },
      {
        name: 'gpt-4o-mini',
        contextWindow: 128000,
        inputCostPer1k: 0.00015,
        outputCostPer1k: 0.0006,
      },
      {
        name: 'gpt-4-turbo',
        contextWindow: 128000,
        inputCostPer1k: 0.01,
        outputCostPer1k: 0.03,
      }
    ]
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    modelList: {
      endpoint: '/models',
      authMethod: 'x-api-key',
      responseFormat: 'anthropic',
      headers: { 'anthropic-version': '2023-06-01' },
    },
    models: [
      {
        name: 'claude-3-5-sonnet-20241022',
        contextWindow: 200000,
        inputCostPer1k: 0.003,
        outputCostPer1k: 0.015,
      },
      {
        name: 'claude-3-haiku-20240307',
        contextWindow: 200000,
        inputCostPer1k: 0.00025,
        outputCostPer1k: 0.00125,
      }
    ]
  },
  google: {
    name: 'Google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    modelList: {
      endpoint: '/models',
      authMethod: 'google-api-key',
      responseFormat: 'google',
    },
    models: [
      {
        name: 'gemini-1.5-pro-latest',
        contextWindow: 2000000,
        inputCostPer1k: 0.00125,
        outputCostPer1k: 0.005,
      },
      {
        name: 'gemini-1.5-flash-latest',
        contextWindow: 1000000,
        inputCostPer1k: 0.000075,
        outputCostPer1k: 0.0003,
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
      // OpenRouter provides pricing and context, so we can leave this empty
      // and populate it entirely from the API response.
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
      },
      {
        name: 'deepseek-coder',
        contextWindow: 128000,
        inputCostPer1k: 0.00014,
        outputCostPer1k: 0.00028,
      }
    ]
  },
  moonshot: {
    name: 'Moonshot.ai',
    baseUrl: 'https://api.moonshot.ai/v1',
    modelList: {
      endpoint: '/models',
      authMethod: 'Bearer',
      responseFormat: 'moonshot',
    },
    availableBaseUrls: [
      { name: 'Global', url: 'https://api.moonshot.ai/v1' },
      { name: 'China', url: 'https://api.moonshot.cn/v1' },
    ],
    models: [
      {
        name: 'moonshot-v1-8k',
        contextWindow: 8000,
        inputCostPer1k: 0.001,
        outputCostPer1k: 0.001,
      },
      {
        name: 'moonshot-v1-32k',
        contextWindow: 32000,
        inputCostPer1k: 0.002,
        outputCostPer1k: 0.002,
      },
      {
        name: 'moonshot-v1-128k',
        contextWindow: 128000,
        inputCostPer1k: 0.005,
        outputCostPer1k: 0.005,
      }
    ]
  },
  zai: {
    name: 'Z.ai',
    baseUrl: 'https://api.z.ai/api/paas/v4',
    models: [
      {
        name: 'glm-4.5',
        contextWindow: 128000,
        inputCostPer1k: 0.0006,
        outputCostPer1k: 0.0022,
      },
      {
        name: 'glm-4-32b-0414-128k',
        contextWindow: 128000,
        inputCostPer1k: 0.0001,
        outputCostPer1k: 0.0001,
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
