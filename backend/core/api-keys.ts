import { api, APIError } from "encore.dev/api";
import { db } from "./db";
import { encryptApiKey, decryptApiKey, generateUserSecret, getKeyHint } from "./crypto";
import type { ApiKey } from "./types";

interface SaveApiKeyRequest {
  userId: string;
  provider: string;
  apiKey: string;
  label?: string;
}

interface SaveApiKeyResponse {
  id: number;
  keyHint: string;
}

interface GetApiKeysRequest {
  userId: string;
}

interface GetApiKeysResponse {
  keys: Array<{
    id: number;
    provider: string;
    keyHint: string;
    label?: string;
    isActive: boolean;
    createdAt: string;
    lastUsed?: string;
  }>;
}

// Saves an encrypted API key for a user
export const saveApiKey = api<SaveApiKeyRequest, SaveApiKeyResponse>(
  { expose: true, method: "POST", path: "/api/keys" },
  async (req) => {
    const { userId, provider, apiKey, label } = req;
    
    // Generate user-specific secret for encryption
    const userSecret = generateUserSecret();
    const encryptedKey = encryptApiKey(apiKey, userSecret);
    const keyHint = getKeyHint(apiKey);
    
    // First ensure user exists
    await db.exec`
      INSERT OR IGNORE INTO users (id, created_at, last_seen) 
      VALUES (${userId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    
    // Save encrypted API key
    const result = await db.queryRow<{ id: number }>`
      INSERT INTO api_keys (user_id, provider, encrypted_key, key_hint, label, is_active, created_at)
      VALUES (${userId}, ${provider}, ${encryptedKey}, ${keyHint}, ${label}, 1, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    
    if (!result) {
      throw APIError.internal("Failed to save API key");
    }
    
    return {
      id: result.id,
      keyHint
    };
  }
);

// Gets all API keys for a user (encrypted data stays on server)
export const getApiKeys = api<GetApiKeysRequest, GetApiKeysResponse>(
  { expose: true, method: "GET", path: "/api/keys/:userId" },
  async (req) => {
    const { userId } = req;
    
    const keys = await db.queryAll<{
      id: number;
      provider: string;
      key_hint: string;
      label: string;
      is_active: boolean;
      created_at: string;
      last_used: string;
    }>`
      SELECT id, provider, key_hint, label, is_active, created_at, last_used
      FROM api_keys 
      WHERE user_id = ${userId} AND is_active = 1
      ORDER BY created_at DESC
    `;
    
    return {
      keys: keys.map(key => ({
        id: key.id,
        provider: key.provider,
        keyHint: key.key_hint || '',
        label: key.label,
        isActive: key.is_active === 1,
        createdAt: key.created_at,
        lastUsed: key.last_used
      }))
    };
  }
);

// Internal function to get decrypted API key for generation
export async function getDecryptedApiKey(userId: string, provider: string): Promise<string | null> {
  const keyData = await db.queryRow<{
    encrypted_key: string;
  }>`
    SELECT encrypted_key
    FROM api_keys 
    WHERE user_id = ${userId} AND provider = ${provider} AND is_active = 1
    ORDER BY created_at DESC
    LIMIT 1
  `;
  
  if (!keyData) {
    return null;
  }
  
  try {
    // For demo, we'll use a fixed secret - in production this should be user-specific
    const userSecret = generateUserSecret();
    return decryptApiKey(keyData.encrypted_key, userSecret);
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    return null;
  }
}
