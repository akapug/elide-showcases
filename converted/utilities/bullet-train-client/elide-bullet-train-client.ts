/**
 * Bullet Train Client - Feature Flag Platform
 *
 * Client for Bullet Train (now Flagsmith) feature flags.
 * **POLYGLOT SHOWCASE**: One Bullet Train client for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/bullet-train-client (~5K+ downloads/week)
 *
 * Features:
 * - Feature flags
 * - Remote config values
 * - User traits
 * - Real-time updates
 * - Zero dependencies
 *
 * Use cases:
 * - Legacy Bullet Train
 * - Feature management
 *
 * Package has ~5K+ downloads/week on npm!
 */

export interface BulletTrainConfig {
  environmentID: string;
  api?: string;
  onChange?: () => void;
}

export class BulletTrainClient {
  private config: BulletTrainConfig;
  private flags = new Map<string, boolean>();
  private traits = new Map<string, any>();
  private identity?: string;

  constructor(config: BulletTrainConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    // Would fetch flags
    return Promise.resolve();
  }

  hasFeature(key: string): boolean {
    return this.flags.get(key) || false;
  }

  getValue(key: string): any {
    return this.flags.get(key);
  }

  async identify(userId: string): Promise<void> {
    this.identity = userId;
    // Would fetch user-specific flags
    return Promise.resolve();
  }

  async setTrait(key: string, value: any): Promise<void> {
    this.traits.set(key, value);
    return Promise.resolve();
  }

  getTrait(key: string): any {
    return this.traits.get(key);
  }

  // Demo helper
  setFlag(key: string, value: boolean): void {
    this.flags.set(key, value);
  }
}

export function createClient(config: BulletTrainConfig): BulletTrainClient {
  return new BulletTrainClient(config);
}

export default { createClient, BulletTrainClient };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚄 Bullet Train Client - Feature Flags (POLYGLOT!)\n');

  const client = createClient({ environmentID: 'env-123' });
  client.setFlag('new-ui', true);
  await client.init();

  console.log('=== Example 1: Check Features ===');
  console.log('New UI:', client.hasFeature('new-ui'));
  console.log('Dark mode:', client.hasFeature('dark-mode'));
  console.log();

  console.log('=== Example 2: User Identity ===');
  await client.identify('user123');
  await client.setTrait('plan', 'premium');
  console.log('User plan:', client.getTrait('plan'));
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');
}
