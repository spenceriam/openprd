-- Lightweight user tracking (no auth required)
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- UUID generated client-side
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP,
    preferences JSONB, -- Theme, default model, etc.
    usage_tier TEXT DEFAULT 'free' -- For future monetization
);

-- Encrypted API key storage
CREATE TABLE api_keys (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL CHECK(provider IN ('openai', 'deepseek', 'openrouter')),
    encrypted_key TEXT NOT NULL, -- AES-256-GCM encrypted
    key_hint TEXT, -- Last 4 characters for identification
    label TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Generated PRDs
CREATE TABLE prds (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    input_text TEXT,
    input_mode TEXT CHECK(input_mode IN ('quick', 'wizard')),
    wizard_responses JSONB,
    generated_content TEXT, -- Full Markdown
    output_mode TEXT CHECK(output_mode IN ('ai_agent', 'human_dev')),
    model_provider TEXT,
    model_name TEXT,
    total_tokens INTEGER,
    generation_time_ms INTEGER,
    cost_usd DECIMAL(10, 6),
    compaction_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- PRD sections for granular regeneration
CREATE TABLE sections (
    id BIGSERIAL PRIMARY KEY,
    prd_id BIGINT NOT NULL,
    section_type TEXT, -- 'summary', 'problem', 'features', etc.
    section_order INTEGER,
    content TEXT, -- Markdown content
    tokens INTEGER,
    version INTEGER DEFAULT 1,
    parent_version INTEGER, -- For version tracking
    regeneration_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prd_id) REFERENCES prds(id) ON DELETE CASCADE
);

-- Detailed generation logs for analytics
CREATE TABLE generation_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    prd_id BIGINT,
    action TEXT, -- 'generate', 'regenerate_section', 'compact', 'validate'
    model_provider TEXT,
    model_name TEXT,
    tokens_input INTEGER,
    tokens_output INTEGER,
    tokens_total INTEGER,
    cost_usd DECIMAL(10, 6),
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB, -- Additional context
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (prd_id) REFERENCES prds(id)
);

-- System prompts with versioning
CREATE TABLE system_prompts (
    id BIGSERIAL PRIMARY KEY,
    version TEXT NOT NULL,
    prompt_key TEXT NOT NULL, -- 'main', 'compact', 'agents_md', 'validation'
    prompt_content TEXT NOT NULL,
    model_specific_variations JSONB,
    is_active BOOLEAN DEFAULT true,
    changelog TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT DEFAULT 'system',
    UNIQUE(version, prompt_key)
);

-- Indexes for performance
CREATE INDEX idx_users_last_seen ON users(last_seen);
CREATE INDEX idx_api_keys_user ON api_keys(user_id, provider);
CREATE INDEX idx_prds_user_created ON prds(user_id, created_at DESC);
CREATE INDEX idx_sections_prd ON sections(prd_id, section_order);
CREATE INDEX idx_logs_user_created ON generation_logs(user_id, created_at DESC);
CREATE INDEX idx_prompts_active ON system_prompts(is_active, prompt_key);
