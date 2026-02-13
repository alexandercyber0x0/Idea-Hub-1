import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const ITERATIONS = 100000;

// Fields that should be encrypted
export const ENCRYPTED_FIELDS = ['description', 'transcript', 'summary', 'reelLinks', 'notes'] as const;

// Derive encryption key from password and salt
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

// Hash password for verification
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha256');
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

// Verify password against stored hash
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [saltHex, hashHex] = storedHash.split(':');
    if (!saltHex || !hashHex) return false;
    
    const salt = Buffer.from(saltHex, 'hex');
    const hash = Buffer.from(hashHex, 'hex');
    const verifyHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, 'sha256');
    
    return crypto.timingSafeEqual(hash, verifyHash);
  } catch {
    return false;
  }
}

// Encrypt a string value
export function encrypt(value: string | null | undefined, password: string): string | null {
  if (!value) return null;
  
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: salt:iv:authTag:encrypted
  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// Decrypt a string value
export function decrypt(encryptedValue: string | null | undefined, password: string): string | null {
  if (!encryptedValue) return null;
  
  try {
    const parts = encryptedValue.split(':');
    if (parts.length !== 4) {
      // Not encrypted, return as-is (for backward compatibility)
      return encryptedValue;
    }
    
    const [saltHex, ivHex, authTagHex, encrypted] = parts;
    if (!saltHex || !ivHex || !authTagHex || !encrypted) return null;
    
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = deriveKey(password, salt);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch {
    // Decryption failed - wrong password or corrupted data
    return null;
  }
}

// Check if a value is encrypted
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false;
  const parts = value.split(':');
  return parts.length === 4 && parts.every(p => /^[0-9a-f]+$/i.test(p));
}

// Encrypt an object's sensitive fields
export function encryptObject<T extends Record<string, unknown>>(
  obj: T,
  password: string,
  fields: readonly string[] = ENCRYPTED_FIELDS
): T {
  const result = { ...obj };
  
  for (const field of fields) {
    if (field in result && typeof result[field] === 'string') {
      const value = result[field] as string;
      if (value && !isEncrypted(value)) {
        (result as Record<string, unknown>)[field] = encrypt(value, password);
      }
    }
  }
  
  return result;
}

// Decrypt an object's sensitive fields
export function decryptObject<T extends Record<string, unknown>>(
  obj: T,
  password: string,
  fields: readonly string[] = ENCRYPTED_FIELDS
): T {
  const result = { ...obj };
  
  for (const field of fields) {
    if (field in result && typeof result[field] === 'string') {
      const value = result[field] as string;
      if (value && isEncrypted(value)) {
        const decrypted = decrypt(value, password);
        (result as Record<string, unknown>)[field] = decrypted;
      }
    }
  }
  
  return result;
}
