const fs = require('fs');
const path = require('path');

const configPath = path.join(process.cwd(), '.z-ai-config');

const config = {
  baseUrl: process.env.ZAI_BASE_URL || 'https://api.z.ai/v1',
  apiKey: process.env.ZAI_API_KEY || ''
};

// Only create if API key is provided
if (config.apiKey) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('✅ Generated .z-ai-config file');
} else {
  console.warn('⚠️ ZAI_API_KEY not set, skipping config generation');
}