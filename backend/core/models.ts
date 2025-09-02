import { api } from "encore.dev/api";
import { AI_PROVIDERS } from "./ai-providers";

interface ModelsResponse {
  providers: typeof AI_PROVIDERS;
}

// Returns available AI models and their information
export const getModels = api<void, ModelsResponse>(
  { expose: true, method: "GET", path: "/api/models" },
  async () => {
    return {
      providers: AI_PROVIDERS
    };
  }
);
