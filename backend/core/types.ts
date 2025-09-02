export interface User {
  id: string;
  created_at: string;
  last_seen?: string;
  preferences?: any;
  usage_tier: string;
}

export interface ApiKey {
  id: number;
  user_id: string;
  provider: 'openai' | 'anthropic' | 'google';
  encrypted_key: string;
  key_hint?: string;
  label?: string;
  is_active: boolean;
  created_at: string;
  last_used?: string;
}

export interface PRD {
  id: number;
  user_id: string;
  title?: string;
  input_text?: string;
  input_mode: 'quick' | 'wizard';
  wizard_responses?: any;
  generated_content?: string;
  output_mode: 'ai_agent' | 'human_dev';
  model_provider?: string;
  model_name?: string;
  total_tokens?: number;
  generation_time_ms?: number;
  cost_usd?: number;
  compaction_used: boolean;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: number;
  prd_id: number;
  section_type?: string;
  section_order?: number;
  content?: string;
  tokens?: number;
  version: number;
  parent_version?: number;
  regeneration_notes?: string;
  created_at: string;
}

export interface GenerationLog {
  id: number;
  user_id: string;
  prd_id?: number;
  action: string;
  model_provider?: string;
  model_name?: string;
  tokens_input?: number;
  tokens_output?: number;
  tokens_total?: number;
  cost_usd?: number;
  duration_ms?: number;
  error_message?: string;
  metadata?: any;
  created_at: string;
}

export interface SystemPrompt {
  id: number;
  version: string;
  prompt_key: string;
  prompt_content: string;
  model_specific_variations?: any;
  is_active: boolean;
  changelog?: string;
  created_at: string;
  created_by: string;
}
