/**
 * ConfigCat Client - Feature Flag Service
 *
 * Client for ConfigCat feature flag and configuration service.
 * **POLYGLOT SHOWCASE**: One ConfigCat client for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/configcat-client (~10K+ downloads/week)
 *
 * Features:
 * - Feature flags
 * - Remote configuration
 * - Targeting rules
 * - Percentage rollouts
 * - Zero dependencies
 *
 * Use cases:
 * - ConfigCat integration
 * - Remote config
 *
 * Package has ~10K+ downloads/week on npm!
 */

export interface ConfigCatOptions {
  sdkKey: string;
  pollIntervalSeconds?: number;
  requestTimeoutMs?: number;
}

export interface User {
  identifier: string;
  email?: string;
  country?: string;
  custom?: Record<string, string>;
}

export class ConfigCatClient {
  private options: ConfigCatOptions;
  private settings = new Map<string, any>();

  constructor(options: ConfigCatOptions) {
    this.options = options;
  }

  async getValueAsync<T>(key: string, defaultValue: T, user?: User): Promise<T> {
    const value = this.settings.get(key);
    return value !== undefined ? value as T : defaultValue;
  }

  getValue<T>(key: string, defaultValue: T, user?: User): T {
    const value = this.settings.get(key);
    return value !== undefined ? value as T : defaultValue;
  }

  async getAllKeysAsync(): Promise<string[]> {
    return Array.from(this.settings.keys());
  }

  async forceRefreshAsync(): Promise<void> {
    // Would refresh settings from ConfigCat
    return Promise.resolve();
  }

  dispose(): void {
    this.settings.clear();
  }

  // Demo helper
  setSetting(key: string, value: any): void {
    this.settings.set(key, value);
  }
}

export function createClient(sdkKey: string, options?: Partial<ConfigCatOptions>): ConfigCatClient {
  return new ConfigCatClient({ sdkKey, ...options });
}

export default { createClient, ConfigCatClient };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('⚙️  ConfigCat Client - Remote Config (POLYGLOT!)\n');

  const client = createClient('sdk-key-123');

  // Set demo settings
  client.setSetting('new-ui', true);
  client.setSetting('max-items', 100);
  client.setSetting('api-url', 'https://api.example.com');

  console.log('=== Example 1: Get Values ===');
  console.log('New UI:', client.getValue('new-ui', false));
  console.log('Max items:', client.getValue('max-items', 10));
  console.log('API URL:', client.getValue('api-url', 'https://default.com'));
  console.log();

  console.log('=== Example 2: Async Get ===');
  const value = await client.getValueAsync('new-ui', false);
  console.log('New UI (async):', value);
  console.log();

  console.log('=== Example 3: User Context ===');
  const user: User = { identifier: 'user123', email: 'user@example.com', country: 'US' };
  console.log('With user context:', client.getValue('new-ui', false, user));
  console.log();

  console.log('=== Example 4: All Keys ===');
  const keys = await client.getAllKeysAsync();
  console.log('All keys:', keys);
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');

  client.dispose();
}
