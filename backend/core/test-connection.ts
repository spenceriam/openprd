import { api, APIError } from "encore.dev/api";
import { AI_PROVIDERS } from "./ai-providers";

interface TestConnectionRequest {
  provider: string;
  apiKey: string;
}

interface TestConnectionResponse {
  valid: boolean;
  model?: string;
  contextWindow?: number;
  error?: string;
}

// Tests API key connection for a given provider
export const testConnection = api<TestConnectionRequest, TestConnectionResponse>(
  { expose: true, method: "POST", path: "/api/test-connection" },
  async (req) => {
    const { provider, apiKey } = req;
    
    if (!AI_PROVIDERS[provider]) {
      throw APIError.invalidArgument(`Unsupported provider: ${provider}`);
    }

    const providerInfo = AI_PROVIDERS[provider];
    
    try {
      if (provider === 'openai') {
        const response = await fetch(`${providerInfo.baseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const error = await response.text();
          return {
            valid: false,
            error: response.status === 401 ? 'Invalid API key' : `API error: ${error}`
          };
        }

        const data = await response.json();
        const defaultModel = providerInfo.models[0];
        
        return {
          valid: true,
          model: defaultModel.name,
          contextWindow: defaultModel.contextWindow
        };
      }
      
      if (provider === 'anthropic') {
        // Test with a minimal request to Claude
        const response = await fetch(`${providerInfo.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: providerInfo.models[0].name,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }]
          })
        });

        if (!response.ok) {
          const error = await response.text();
          return {
            valid: false,
            error: response.status === 401 ? 'Invalid API key' : `API error: ${error}`
          };
        }

        const defaultModel = providerInfo.models[0];
        return {
          valid: true,
          model: defaultModel.name,
          contextWindow: defaultModel.contextWindow
        };
      }

      return {
        valid: false,
        error: 'Provider validation not implemented'
      };
      
    } catch (error) {
      return {
        valid: false,
        error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
);
