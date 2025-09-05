import { api, APIError } from "encore.dev/api";
import { db } from "./db";
import { AI_PROVIDERS, getModelInfo, estimateTokens, calculateCost } from "./ai-providers";
import { getDecryptedApiKey } from "./api-keys";

interface GenerateRequest {
  userId: string;
  input: string;
  mode: 'quick' | 'wizard';
  wizardData?: any;
  provider: string;
  model: string;
  outputMode: 'ai_agent' | 'human_dev';
  apiKey?: string;
}

interface GenerateResponse {
  prdId: number;
  content: string;
  tokens: number;
  cost: number;
  sections: Array<{
    id: number;
    type: string;
    content: string;
    tokens: number;
  }>;
}

// Generates a PRD using the specified AI model
export const generate = api<GenerateRequest, GenerateResponse>(
  { expose: true, method: "POST", path: "/api/generate" },
  async (req) => {
    const { userId, input, mode, wizardData, provider, model, outputMode } = req;
    const startTime = Date.now();
    
    let apiKey = req.apiKey;
    if (!apiKey) {
      apiKey = await getDecryptedApiKey(userId, provider);
    }

    if (!apiKey) {
      throw APIError.notFound("No API key found for this provider. Please provide one or save it for future use.");
    }
    
    // Validate provider and model
    const providerInfo = AI_PROVIDERS[provider];
    if (!providerInfo) {
      throw APIError.invalidArgument(`Unsupported provider: ${provider}`);
    }
    
    const modelInfo = getModelInfo(provider, model);
    if (!modelInfo) {
      throw APIError.invalidArgument(`Unsupported model: ${model}`);
    }
    
    // Get system prompt
    const systemPrompt = await db.queryRow<{ prompt_content: string }>`
      SELECT prompt_content FROM system_prompts 
      WHERE prompt_key = 'main' AND is_active = 1
      ORDER BY created_at DESC LIMIT 1
    `;
    
    if (!systemPrompt) {
      throw APIError.internal("System prompt not found");
    }
    
    // Prepare input for AI
    let finalInput = input;
    if (mode === 'wizard' && wizardData) {
      finalInput = formatWizardData(wizardData, input);
    }
    
    // Estimate tokens for input
    const inputTokens = estimateTokens(systemPrompt.prompt_content + finalInput);
    
    // Check context window
    if (inputTokens > modelInfo.contextWindow * 0.6) {
      throw APIError.invalidArgument("Input too long for selected model context window");
    }
    
    try {
      // Call AI API
      const aiResponse = await callAI(provider, model, apiKey, systemPrompt.prompt_content, finalInput);
      const outputTokens = estimateTokens(aiResponse.content);
      const totalTokens = inputTokens + outputTokens;
      
      // Calculate costs
      const inputCost = calculateCost(inputTokens, modelInfo.inputCostPer1k);
      const outputCost = calculateCost(outputTokens, modelInfo.outputCostPer1k);
      const totalCost = inputCost + outputCost;
      
      // Extract title from generated content
      const title = extractTitle(aiResponse.content);
      
      // Save PRD to database
      const prdResult = await db.queryRow<{ id: number }>`
        INSERT INTO prds (
          user_id, title, input_text, input_mode, wizard_responses, 
          generated_content, output_mode, model_provider, model_name,
          total_tokens, generation_time_ms, cost_usd, created_at, updated_at
        ) VALUES (
          ${userId}, ${title}, ${input}, ${mode}, ${JSON.stringify(wizardData)},
          ${aiResponse.content}, ${outputMode}, ${provider}, ${model},
          ${totalTokens}, ${Date.now() - startTime}, ${totalCost}, 
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING id
      `;
      
      if (!prdResult) {
        throw APIError.internal("Failed to save PRD");
      }
      
      // Parse sections and save them
      const sections = parseSections(aiResponse.content);
      const sectionResults = [];
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionTokens = estimateTokens(section.content);
        
        const sectionResult = await db.queryRow<{ id: number }>`
          INSERT INTO sections (
            prd_id, section_type, section_order, content, tokens, version, created_at
          ) VALUES (
            ${prdResult.id}, ${section.type}, ${i + 1}, ${section.content}, ${sectionTokens}, 1, CURRENT_TIMESTAMP
          ) RETURNING id
        `;
        
        if (sectionResult) {
          sectionResults.push({
            id: sectionResult.id,
            type: section.type,
            content: section.content,
            tokens: sectionTokens
          });
        }
      }
      
      // Log generation
      await db.exec`
        INSERT INTO generation_logs (
          user_id, prd_id, action, model_provider, model_name,
          tokens_input, tokens_output, tokens_total, cost_usd, duration_ms, created_at
        ) VALUES (
          ${userId}, ${prdResult.id}, 'generate', ${provider}, ${model},
          ${inputTokens}, ${outputTokens}, ${totalTokens}, ${totalCost}, ${Date.now() - startTime}, CURRENT_TIMESTAMP
        )
      `;
      
      return {
        prdId: prdResult.id,
        content: aiResponse.content,
        tokens: totalTokens,
        cost: totalCost,
        sections: sectionResults
      };
      
    } catch (error) {
      // Log error
      await db.exec`
        INSERT INTO generation_logs (
          user_id, action, model_provider, model_name,
          error_message, duration_ms, created_at
        ) VALUES (
          ${userId}, 'generate', ${provider}, ${model},
          ${error instanceof Error ? error.message : 'Unknown error'}, ${Date.now() - startTime}, CURRENT_TIMESTAMP
        )
      `;
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw APIError.internal(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

async function callAI(provider: string, model: string, apiKey: string, systemPrompt: string, userInput: string) {
  const providerInfo = AI_PROVIDERS[provider];
  
  if (provider === 'openai') {
    const response = await fetch(`${providerInfo.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }
    
    const data = await response.json();
    return {
      content: data.choices[0].message.content
    };
  }

  if (provider === 'deepseek') {
    const response = await fetch(`${providerInfo.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${error}`);
    }
    
    const data = await response.json();
    return {
      content: data.choices[0].message.content
    };
  }

  if (provider === 'openrouter') {
    const response = await fetch(`${providerInfo.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://openprd.dev',
        'X-Title': 'OpenPRD'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }
    
    const data = await response.json();
    return {
      content: data.choices[0].message.content
    };
  }
  
  throw new Error(`Provider ${provider} not implemented`);
}

function formatWizardData(wizardData: any, input: string): string {
  // Format wizard responses into a structured input
  return `${input}\n\nAdditional Context from Wizard:\n${JSON.stringify(wizardData, null, 2)}`;
}

function extractTitle(content: string): string {
  // Extract title from the first heading
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled PRD';
}

function parseSections(content: string) {
  const sections = [];
  const lines = content.split('\n');
  let currentSection: { type: string; content: string } | null = null;
  
  for (const line of lines) {
    const headerMatch = line.match(/^#\s+\d+\.\s+(.+)$/);
    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // Start new section
      currentSection = {
        type: headerMatch[1].toLowerCase().replace(/\s+/g, '_'),
        content: line + '\n'
      };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    }
  }
  
  // Don't forget the last section
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}
