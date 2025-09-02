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
// This function supports two types of providers:
// 1. Providers with a model list API endpoint (configured in `modelList`). For these, we fetch the list dynamically.
// 2. Providers without a model list API (like Z.ai). For these, we validate the API key with a test call and return a hardcoded list of supported models.
export const listProviderModels = api<ListProviderModelsRequest, ListProviderModelsResponse>(
  { expose: true, method: "POST", path: "/api/provider-models" },
  async ({ provider, apiKey }) => {
    const providerInfo = AI_PROVIDERS[provider];
    if (!providerInfo) {
      throw APIError.invalidArgument(`Unsupported provider: ${provider}`);
    }

    // If a model list endpoint is configured, use it to fetch models dynamically.
    if (providerInfo.modelList) {
      const { endpoint, authMethod, responseFormat, headers: customHeaders } = providerInfo.modelList;
      const url = authMethod === 'google-api-key'
        ? `${providerInfo.baseUrl}${endpoint}?key=${apiKey}`
        : `${providerInfo.baseUrl}${endpoint}`;

      const headers: HeadersInit = { ...customHeaders };
      if (authMethod === 'Bearer') {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else if (authMethod === 'x-api-key') {
        headers['x-api-key'] = apiKey;
      }
      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://openprd.dev';
        headers['X-Title'] = 'OpenPRD';
      }

      try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
          const error = await response.json();
          throw APIError.unauthenticated(error.error?.message || `Invalid ${providerInfo.name} API key`);
        }
        const data = await response.json();

        if (responseFormat === 'openrouter') {
          const models: ModelInfo[] = data.data.map((model: any) => ({
            name: model.id,
            contextWindow: model.context_length || 0,
            inputCostPer1k: parseFloat(model.pricing.prompt) * 1000 || 0,
            outputCostPer1k: parseFloat(model.pricing.completion) * 1000 || 0,
          }));
          return { models };
        }

        let availableModelIds: string[] = [];
        switch (responseFormat) {
          case 'openai':
          case 'moonshot':
          case 'anthropic':
          case 'deepseek':
            availableModelIds = data.data.map((model: any) => model.id);
            break;
          case 'google':
            availableModelIds = data.models.map((model: any) => model.name);
            break;
          default:
            throw APIError.internal(`Unsupported response format: ${responseFormat}`);
        }

        const userModels = providerInfo.models.filter(m => availableModelIds.includes(m.name));
        if (userModels.length === 0) {
          throw APIError.notFound(`No supported ${providerInfo.name} models found for your API key.`);
        }
        return { models: userModels };
      } catch (error) {
        if (error instanceof APIError) throw error;
        throw APIError.internal(`An error occurred while fetching models: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // This block handles providers like Z.ai that do not have a public API for listing models.
      // We validate the user's API key by making a minimal, low-cost call to a known endpoint.
      // If the key is valid, we return the hardcoded list of models defined in ai-providers.ts.
      if (providerInfo.models.length === 0) {
        return { models: [] };
      }

      try {
        const validationEndpoint = provider === 'zai'
          ? '/chat/completions'
          : '/chat/completions'; // Default for future similar providers

        const response = await fetch(`${providerInfo.baseUrl}${validationEndpoint}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: providerInfo.models[0].name,
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 1,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw APIError.unauthenticated(error.error?.message || `Invalid ${providerInfo.name} API key`);
        }
      } catch (error) {
        if (error instanceof APIError) throw error;
        throw APIError.internal(`Key validation failed for ${providerInfo.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      return { models: providerInfo.models };
    }
  }
);
