import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
}

export function encryptApiKey(apiKey: string, userSecret: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(userSecret, salt);
  
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Combine salt + iv + tag + encrypted data
  const combined = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);
  return combined.toString('base64');
}

export function decryptApiKey(encryptedData: string, userSecret: string): string {
  const combined = Buffer.from(encryptedData, 'base64');
  
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  const key = deriveKey(userSecret, salt);
  
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, null, 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function generateUserSecret(): string {
  return randomBytes(32).toString('hex');
}

export function getKeyHint(apiKey: string): string {
  return `...${apiKey.slice(-4)}`;
}
