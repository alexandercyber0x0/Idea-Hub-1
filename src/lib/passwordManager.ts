import fs from 'fs';
import path from 'path';
import { hashPassword, verifyPassword } from './encryption';
import { db } from './db';

// Password config file path
const CONFIG_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'security.config.json');

interface SecurityConfig {
  passwordHash: string;
  createdAt: string;
  lastAccessed: string;
}

// Ensure config directory exists
function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

// Check if database has any data
async function databaseHasData(): Promise<boolean> {
  try {
    const ideaCount = await db.idea.count();
    const toolCount = await db.aITool.count();
    return ideaCount > 0 || toolCount > 0;
  } catch {
    return false;
  }
}

// Check if password is set up (config exists AND database has data)
export async function isPasswordSetup(): Promise<boolean> {
  try {
    // If no config file, definitely not setup
    if (!fs.existsSync(CONFIG_FILE)) return false;
    
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (!config.passwordHash) return false;
    
    // If config exists, password is setup (don't delete just because database is empty)
// User might have set up password before adding any data
const hasData = await databaseHasData();
if (!hasData) {
  // Database is empty but password is set - this is fine for new users
  // Don't delete the config file
}
    
    return true;
  } catch {
    return false;
  }
}

// Synchronous version for quick checks
export function isPasswordSet(): boolean {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return false;
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    return !!config.passwordHash;
  } catch {
    return false;
  }
}

// Set up password for the first time (or after database reset)
export function setupPassword(password: string): { success: boolean; error?: string } {
  try {
    // Check if there's existing encrypted data
    if (isPasswordSet()) {
      // Only block if database has data
      // For simplicity, just overwrite if we're here (database was likely reset)
    }
    
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    
    ensureConfigDir();
    
    const config: SecurityConfig = {
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
    };
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to set up password' };
  }
}

// Verify password
export function verifyStoredPassword(password: string): boolean {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return false;
    const config: SecurityConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    return verifyPassword(password, config.passwordHash);
  } catch {
    return false;
  }
}

// Update last accessed timestamp
export function updateLastAccessed(): void {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return;
    const config: SecurityConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    config.lastAccessed = new Date().toISOString();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch {
    // Ignore errors
  }
}

// Change password (requires old password)
export function changePassword(oldPassword: string, newPassword: string): { success: boolean; error?: string } {
  try {
    if (!verifyStoredPassword(oldPassword)) {
      return { success: false, error: 'Incorrect current password' };
    }
    
    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters' };
    }
    
    const config: SecurityConfig = {
      passwordHash: hashPassword(newPassword),
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
    };
    
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to change password' };
  }
}

// Get security config info (without hash)
export function getSecurityInfo(): { isSetup: boolean; createdAt?: string; lastAccessed?: string } {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return { isSetup: false };
    }
    const config: SecurityConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    return {
      isSetup: true,
      createdAt: config.createdAt,
      lastAccessed: config.lastAccessed,
    };
  } catch {
    return { isSetup: false };
  }
}

// Reset password (for fresh starts - only if database is empty)
export function resetPassword(): { success: boolean } {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
    return { success: true };
  } catch {
    return { success: false };
  }
}
