import { api, APIError } from "encore.dev/api";
import { AI_PROVIDERS, ModelInfo } from "./ai-providers";

interface ListProviderModelsRequest {
  provider: string;
  apiKey: string;
}

interface ListProviderModelsResponse {
  models: ModelInfo[];
}

// Fetches available models for a given provider after validating the API key.
export const listProviderModels = api<ListProviderModelsRequest, ListProviderModelsResponse>(
  { expose: true, method: "POST", path: "/api/provider-models" },
  async ({ provider, apiKey }) => {
    const providerInfo = AI_PROVIDERS[provider];
    if (!providerInfo) {
      throw APIError.invalidArgument(`Unsupported provider: ${provider}`);
    }

    if (!providerInfo.modelList) {
      throw APIError.internal(`Provider ${provider} does not support model listing`);
    }

    const { endpoint, authMethod, responseFormat, headers: customHeaders } = providerInfo.modelList;
    
    const headers: HeadersInit = { ...customHeaders };
    if (authMethod === 'Bearer') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (authMethod === 'x-api-key') {
      headers['x-api-key'] = apiKey;
    }

    // Add OpenRouter specific headers as per their documentation
    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://openprd.dev';
      headers['X-Title'] = 'OpenPRD';
    }

    try {
      const response = await fetch(`${providerInfo.baseUrl}${endpoint}`, { headers });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: 'API key validation failed' } }));
        throw APIError.unauthenticated(error.error?.message || `Invalid ${providerInfo.name} API key`);
      }

      const data = await response.json();

      // Handle OpenRouter's dynamic model response
      if (responseFormat === 'openrouter') {
        const models: ModelInfo[] = data.data
          .filter((model: any) => {
            // Filter out models that don't have basic required information
            return model.id && model.context_length;
          })
          .map((model: any) => {
            // Handle pricing safely - some models may not have pricing info
            let inputCost = 0;
            let outputCost = 0;
            
            if (model.pricing && model.pricing.prompt && model.pricing.completion) {
              // OpenRouter pricing is per token, we need per 1k tokens
              inputCost = parseFloat(model.pricing.prompt) * 1000;
              outputCost = parseFloat(model.pricing.completion) * 1000;
            }
            
            return {
              name: model.id,
              contextWindow: model.context_length || 4096,
              inputCostPer1k: inputCost,
              outputCostPer1k: outputCost,
              description: model.description || model.name || model.id
            };
          })
          .sort((a: ModelInfo, b: ModelInfo) => {
            // Sort by name for better UX
            return a.name.localeCompare(b.name);
          });
        
        return { models };
      }

      // Handle standard model list responses
      let availableModelIds: string[] = [];
      switch (responseFormat) {
        case 'openai':
        case 'deepseek':
          availableModelIds = data.data.map((model: any) => model.id);
          break;
        default:
          throw APIError.internal(`Unsupported response format: ${responseFormat}`);
      }

      // Filter our hardcoded models to only include those available via the API
      const userModels = providerInfo.models.filter(m => availableModelIds.includes(m.name));
      
      if (userModels.length === 0) {
        throw APIError.notFound(`No supported ${providerInfo.name} models found for your API key.`);
      }
      
      return { models: userModels };
      
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw APIError.internal(`An error occurred while fetching models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);
