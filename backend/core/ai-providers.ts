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
  },
  google: {
    name: 'Google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    authHeader: 'x-goog-api-key',
    models: [
      {
        name: 'gemini-1.5-pro-latest',
        contextWindow: 2000000,
        inputCostPer1k: 0.00125,
        outputCostPer1k: 0.005,
        description: 'Large context window, excellent for complex PRDs'
      },
      {
        name: 'gemini-1.5-flash-latest',
        contextWindow: 1000000,
        inputCostPer1k: 0.000075,
        outputCostPer1k: 0.0003,
        description: 'Fast and economical with large context'
      },
      {
        name: 'gemini-2.0-flash-exp',
        contextWindow: 1000000,
        inputCostPer1k: 0.000075,
        outputCostPer1k: 0.0003,
        description: 'Latest experimental model with improved capabilities'
      }
    ]
  },
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    authHeader: 'Bearer',
    models: [
      {
        name: 'anthropic/claude-3.5-sonnet',
        contextWindow: 200000,
        inputCostPer1k: 0.003,
        outputCostPer1k: 0.015,
        description: 'Claude 3.5 Sonnet via OpenRouter'
      },
      {
        name: 'openai/gpt-4o',
        contextWindow: 128000,
        inputCostPer1k: 0.005,
        outputCostPer1k: 0.015,
        description: 'GPT-4o via OpenRouter'
      },
      {
        name: 'google/gemini-pro-1.5',
        contextWindow: 2000000,
        inputCostPer1k: 0.00125,
        outputCostPer1k: 0.005,
        description: 'Gemini Pro 1.5 via OpenRouter'
      },
      {
        name: 'meta-llama/llama-3.1-405b-instruct',
        contextWindow: 128000,
        inputCostPer1k: 0.003,
        outputCostPer1k: 0.003,
        description: 'Llama 3.1 405B, open source powerhouse'
      }
    ]
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    authHeader: 'Bearer',
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
  moonshot: {
    name: 'Moonshot.ai',
    baseUrl: 'https://api.moonshot.cn/v1',
    authHeader: 'Bearer',
    models: [
      {
        name: 'moonshot-v1-8k',
        contextWindow: 8000,
        inputCostPer1k: 0.001,
        outputCostPer1k: 0.001,
        description: 'Moonshot 8K context model'
      },
      {
        name: 'moonshot-v1-32k',
        contextWindow: 32000,
        inputCostPer1k: 0.002,
        outputCostPer1k: 0.002,
        description: 'Moonshot 32K context model'
      },
      {
        name: 'moonshot-v1-128k',
        contextWindow: 128000,
        inputCostPer1k: 0.005,
        outputCostPer1k: 0.005,
        description: 'Moonshot 128K context model'
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
