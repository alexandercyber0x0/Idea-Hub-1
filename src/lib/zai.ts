import ZAI from 'z-ai-web-dev-sdk';

// Type for ZAI config
interface ZaiConfig {
  baseUrl: string;
  apiKey: string;
  chatId?: string;
  userId?: string;
}

// Type for ZAI class constructor (to bypass private constructor)
type ZaiConstructor = new (config: ZaiConfig) => ZAI;

/**
 * Get a configured ZAI instance using environment variables.
 * This bypasses the SDK's file-based config which doesn't work in production.
 */
export async function getZai(): Promise<ZAI> {
  const baseUrl = process.env.ZAI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
  const apiKey = process.env.ZAI_API_KEY;

  if (!apiKey) {
    throw new Error('ZAI_API_KEY environment variable is not set');
  }

  // Cast ZAI class to access private constructor
  // This is necessary because the SDK doesn't support env vars
  const ZaiClass = ZAI as unknown as ZaiConstructor;
  return new ZaiClass({
    baseUrl,
    apiKey
  });
}
