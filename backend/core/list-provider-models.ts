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

    // For OpenAI, we can fetch the models list dynamically to ensure the user has access.
    if (provider === 'openai') {
      try {
        const response = await fetch(`${providerInfo.baseUrl}/models`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });

        if (!response.ok) {
          const error = await response.json();
          throw APIError.unauthenticated(error.error?.message || 'Invalid OpenAI API key');
        }

        const data = await response.json();
        const availableModels = data.data.map((model: any) => model.id);
        
        const userModels = providerInfo.models.filter(m => availableModels.includes(m.name));

        if (userModels.length === 0) {
          throw APIError.notFound("No supported OpenAI models found for your API key. Ensure you have access to GPT-4 models.");
        }
        return { models: userModels };
      } catch (error) {
        if (error instanceof APIError) throw error;
        throw APIError.internal(`An error occurred while fetching models: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // For other providers, we validate the key with a minimal request and return our hardcoded list.
    try {
      if (provider === 'anthropic') {
        const response = await fetch(`${providerInfo.baseUrl}/messages`, {
          method: 'POST',
          headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: providerInfo.models[0].name, max_tokens: 1, messages: [{ role: 'user', content: 'test' }] })
        });
        if (!response.ok) {
            const error = await response.json();
            throw APIError.unauthenticated(error.error?.message || 'Invalid Anthropic API key');
        }
      } else if (provider === 'google') {
        const response = await fetch(`${providerInfo.baseUrl}/models/${providerInfo.models[0].name}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }], generationConfig: { maxOutputTokens: 1 } })
        });
        if (!response.ok) {
            const error = await response.json();
            throw APIError.unauthenticated(error.error?.message || 'Invalid Google API key');
        }
      } else if (['openrouter', 'deepseek', 'moonshot', 'zai'].includes(provider)) {
        const headers: HeadersInit = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
        if (provider === 'openrouter') {
            headers['HTTP-Referer'] = 'https://openprd.dev';
            headers['X-Title'] = 'OpenPRD';
        }
        const response = await fetch(`${providerInfo.baseUrl}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ model: providerInfo.models[0].name, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 1 })
        });
        if (!response.ok) {
            const error = await response.json();
            throw APIError.unauthenticated(error.error?.message || `Invalid ${providerInfo.name} API key`);
        }
      } else {
        throw APIError.unimplemented(`Model listing for ${provider} is not supported.`);
      }
    } catch (error) {
        if (error instanceof APIError) throw error;
        throw APIError.internal(`Key validation failed for ${providerInfo.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { models: providerInfo.models };
  }
);
