/**
 * Unleash Client - Feature Flag Management
 *
 * Feature toggle system for gradual rollouts and A/B testing.
 * **POLYGLOT SHOWCASE**: One feature flag system for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/unleash-client (~100K+ downloads/week)
 *
 * Features:
 * - Feature toggles with gradual rollout
 * - User segmentation and targeting
 * - A/B testing support
 * - Percentage-based rollouts
 * - Custom activation strategies
 * - Offline mode with fallbacks
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need feature flags
 * - ONE implementation works everywhere on Elide
 * - Consistent flag behavior across languages
 * - Share feature rollout logic across your stack
 *
 * Use cases:
 * - Gradual feature rollouts
 * - A/B testing and experiments
 * - User segmentation
 * - Kill switches for emergency shutdowns
 *
 * Package has ~100K+ downloads/week on npm - essential for feature management!
 */

export interface UnleashContext {
  userId?: string;
  sessionId?: string;
  remoteAddress?: string;
  environment?: string;
  appName?: string;
  properties?: Record<string, string>;
}

export interface FeatureToggle {
  name: string;
  enabled: boolean;
  strategies: Strategy[];
  variants?: Variant[];
}

export interface Strategy {
  name: string;
  parameters?: Record<string, string>;
  constraints?: Constraint[];
}

export interface Constraint {
  contextName: string;
  operator: 'IN' | 'NOT_IN' | 'STR_CONTAINS' | 'NUM_GT' | 'NUM_LT';
  values?: string[];
}

export interface Variant {
  name: string;
  weight: number;
  payload?: { type: string; value: string };
  overrides?: { contextName: string; values: string[] }[];
}

export interface UnleashConfig {
  appName: string;
  environment?: string;
  instanceId?: string;
  refreshInterval?: number;
  metricsInterval?: number;
  disableMetrics?: boolean;
  storageProvider?: StorageProvider;
  bootstrap?: FeatureToggle[];
}

export interface StorageProvider {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

/**
 * In-memory storage provider
 */
class InMemoryStorageProvider implements StorageProvider {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }
}

/**
 * Strategy evaluator
 */
class StrategyEvaluator {
  /**
   * Evaluate if strategy is active
   */
  isEnabled(strategy: Strategy, context: UnleashContext): boolean {
    // Check constraints first
    if (strategy.constraints) {
      for (const constraint of strategy.constraints) {
        if (!this.evaluateConstraint(constraint, context)) {
          return false;
        }
      }
    }

    // Evaluate strategy
    switch (strategy.name) {
      case 'default':
        return true;
      case 'userWithId':
        return this.evaluateUserWithId(strategy, context);
      case 'gradualRolloutUserId':
        return this.evaluateGradualRollout(strategy, context);
      case 'gradualRolloutSessionId':
        return this.evaluateGradualRolloutSession(strategy, context);
      case 'gradualRolloutRandom':
        return this.evaluateGradualRolloutRandom(strategy);
      case 'remoteAddress':
        return this.evaluateRemoteAddress(strategy, context);
      case 'applicationHostname':
        return this.evaluateHostname(strategy);
      default:
        return false;
    }
  }

  private evaluateConstraint(constraint: Constraint, context: UnleashContext): boolean {
    const value = this.getContextValue(constraint.contextName, context);
    if (!value) return false;

    switch (constraint.operator) {
      case 'IN':
        return constraint.values?.includes(value) || false;
      case 'NOT_IN':
        return !constraint.values?.includes(value);
      case 'STR_CONTAINS':
        return constraint.values?.some(v => value.includes(v)) || false;
      case 'NUM_GT':
        return constraint.values?.some(v => parseFloat(value) > parseFloat(v)) || false;
      case 'NUM_LT':
        return constraint.values?.some(v => parseFloat(value) < parseFloat(v)) || false;
      default:
        return false;
    }
  }

  private getContextValue(contextName: string, context: UnleashContext): string | undefined {
    switch (contextName) {
      case 'userId': return context.userId;
      case 'sessionId': return context.sessionId;
      case 'remoteAddress': return context.remoteAddress;
      case 'environment': return context.environment;
      case 'appName': return context.appName;
      default: return context.properties?.[contextName];
    }
  }

  private evaluateUserWithId(strategy: Strategy, context: UnleashContext): boolean {
    const userIds = strategy.parameters?.userIds?.split(',').map(id => id.trim()) || [];
    return !!context.userId && userIds.includes(context.userId);
  }

  private evaluateGradualRollout(strategy: Strategy, context: UnleashContext): boolean {
    if (!context.userId) return false;
    const percentage = parseInt(strategy.parameters?.percentage || '0', 10);
    const groupId = strategy.parameters?.groupId || '';
    const normalizedId = this.normalizeValue(context.userId, groupId);
    return percentage > 0 && normalizedId <= percentage;
  }

  private evaluateGradualRolloutSession(strategy: Strategy, context: UnleashContext): boolean {
    if (!context.sessionId) return false;
    const percentage = parseInt(strategy.parameters?.percentage || '0', 10);
    const groupId = strategy.parameters?.groupId || '';
    const normalizedId = this.normalizeValue(context.sessionId, groupId);
    return percentage > 0 && normalizedId <= percentage;
  }

  private evaluateGradualRolloutRandom(strategy: Strategy): boolean {
    const percentage = parseInt(strategy.parameters?.percentage || '0', 10);
    return Math.random() * 100 < percentage;
  }

  private evaluateRemoteAddress(strategy: Strategy, context: UnleashContext): boolean {
    const ips = strategy.parameters?.IPs?.split(',').map(ip => ip.trim()) || [];
    return !!context.remoteAddress && ips.includes(context.remoteAddress);
  }

  private evaluateHostname(strategy: Strategy): boolean {
    const hostnames = strategy.parameters?.hostNames?.split(',').map(h => h.trim()) || [];
    return hostnames.length > 0; // Simplified - would check actual hostname
  }

  private normalizeValue(id: string, groupId: string): number {
    const str = groupId + ':' + id;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash % 100) + 1;
  }
}

/**
 * Main Unleash client
 */
export class UnleashClient {
  private config: UnleashConfig;
  private storage: StorageProvider;
  private toggles = new Map<string, FeatureToggle>();
  private evaluator = new StrategyEvaluator();
  private ready = false;

  constructor(config: UnleashConfig) {
    this.config = {
      environment: 'production',
      instanceId: `instance-${Date.now()}`,
      refreshInterval: 15000,
      metricsInterval: 60000,
      disableMetrics: false,
      ...config,
    };
    this.storage = config.storageProvider || new InMemoryStorageProvider();

    // Load bootstrap toggles
    if (config.bootstrap) {
      for (const toggle of config.bootstrap) {
        this.toggles.set(toggle.name, toggle);
      }
    }

    this.ready = true;
  }

  /**
   * Check if feature is enabled
   */
  isEnabled(name: string, context: UnleashContext = {}, fallback = false): boolean {
    const toggle = this.toggles.get(name);
    if (!toggle) return fallback;
    if (!toggle.enabled) return false;

    // Merge context with config defaults
    const fullContext: UnleashContext = {
      environment: this.config.environment,
      appName: this.config.appName,
      ...context,
    };

    // Evaluate strategies
    if (!toggle.strategies || toggle.strategies.length === 0) {
      return toggle.enabled;
    }

    return toggle.strategies.some(strategy =>
      this.evaluator.isEnabled(strategy, fullContext)
    );
  }

  /**
   * Get variant for feature
   */
  getVariant(name: string, context: UnleashContext = {}): Variant | null {
    if (!this.isEnabled(name, context)) {
      return null;
    }

    const toggle = this.toggles.get(name);
    if (!toggle?.variants || toggle.variants.length === 0) {
      return null;
    }

    // Check for overrides
    for (const variant of toggle.variants) {
      if (variant.overrides) {
        for (const override of variant.overrides) {
          const contextValue = this.getContextValue(override.contextName, context);
          if (contextValue && override.values.includes(contextValue)) {
            return variant;
          }
        }
      }
    }

    // Weighted selection
    const totalWeight = toggle.variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of toggle.variants) {
      random -= variant.weight;
      if (random <= 0) {
        return variant;
      }
    }

    return toggle.variants[0];
  }

  private getContextValue(contextName: string, context: UnleashContext): string | undefined {
    switch (contextName) {
      case 'userId': return context.userId;
      case 'sessionId': return context.sessionId;
      case 'remoteAddress': return context.remoteAddress;
      case 'environment': return context.environment;
      case 'appName': return context.appName;
      default: return context.properties?.[contextName];
    }
  }

  /**
   * Add feature toggle
   */
  addToggle(toggle: FeatureToggle): void {
    this.toggles.set(toggle.name, toggle);
  }

  /**
   * Remove feature toggle
   */
  removeToggle(name: string): void {
    this.toggles.delete(name);
  }

  /**
   * Get all toggles
   */
  getToggles(): FeatureToggle[] {
    return Array.from(this.toggles.values());
  }

  /**
   * Check if client is ready
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Destroy client
   */
  destroy(): void {
    this.toggles.clear();
    this.ready = false;
  }
}

/**
 * Initialize Unleash client
 */
export function initialize(config: UnleashConfig): UnleashClient {
  return new UnleashClient(config);
}

export default { initialize, UnleashClient };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚩 Unleash Client - Feature Flags for Elide (POLYGLOT!)\n');

  // Initialize client
  const unleash = initialize({
    appName: 'my-app',
    environment: 'production',
    bootstrap: [
      {
        name: 'new-checkout',
        enabled: true,
        strategies: [
          {
            name: 'gradualRolloutUserId',
            parameters: { percentage: '50', groupId: 'checkout' },
          },
        ],
      },
      {
        name: 'premium-features',
        enabled: true,
        strategies: [
          {
            name: 'userWithId',
            parameters: { userIds: 'user1,user2,user3' },
          },
        ],
      },
      {
        name: 'dark-mode',
        enabled: true,
        strategies: [{ name: 'default' }],
        variants: [
          { name: 'control', weight: 50 },
          { name: 'variant-a', weight: 30 },
          { name: 'variant-b', weight: 20 },
        ],
      },
    ],
  });

  console.log('=== Example 1: Simple Feature Check ===');
  console.log('Dark mode enabled:', unleash.isEnabled('dark-mode'));
  console.log('Non-existent feature:', unleash.isEnabled('does-not-exist'));
  console.log('With fallback:', unleash.isEnabled('does-not-exist', {}, true));
  console.log();

  console.log('=== Example 2: User-based Rollout ===');
  const user1 = { userId: 'user1' };
  const user5 = { userId: 'user5' };
  console.log('Premium for user1:', unleash.isEnabled('premium-features', user1));
  console.log('Premium for user5:', unleash.isEnabled('premium-features', user5));
  console.log();

  console.log('=== Example 3: Gradual Rollout (50%) ===');
  let enabled = 0;
  for (let i = 0; i < 100; i++) {
    if (unleash.isEnabled('new-checkout', { userId: `user${i}` })) {
      enabled++;
    }
  }
  console.log(`Enabled for ${enabled}/100 users (~50% expected)`);
  console.log();

  console.log('=== Example 4: Variants (A/B Testing) ===');
  const variants = { control: 0, 'variant-a': 0, 'variant-b': 0 };
  for (let i = 0; i < 1000; i++) {
    const variant = unleash.getVariant('dark-mode', { userId: `user${i}` });
    if (variant) variants[variant.name as keyof typeof variants]++;
  }
  console.log('Variant distribution:');
  console.log('  Control:', variants.control, '(~50% expected)');
  console.log('  Variant A:', variants['variant-a'], '(~30% expected)');
  console.log('  Variant B:', variants['variant-b'], '(~20% expected)');
  console.log();

  console.log('=== Example 5: Custom Strategies ===');
  unleash.addToggle({
    name: 'admin-panel',
    enabled: true,
    strategies: [
      {
        name: 'remoteAddress',
        parameters: { IPs: '192.168.1.1,10.0.0.1' },
      },
    ],
  });
  console.log('Admin for IP 192.168.1.1:', unleash.isEnabled('admin-panel', { remoteAddress: '192.168.1.1' }));
  console.log('Admin for IP 8.8.8.8:', unleash.isEnabled('admin-panel', { remoteAddress: '8.8.8.8' }));
  console.log();

  console.log('=== Example 6: Kill Switch ===');
  unleash.addToggle({
    name: 'payment-system',
    enabled: false, // Emergency shutdown
    strategies: [{ name: 'default' }],
  });
  console.log('Payment system active:', unleash.isEnabled('payment-system'));
  console.log();

  console.log('=== Example 7: Environment Context ===');
  unleash.addToggle({
    name: 'debug-logging',
    enabled: true,
    strategies: [
      {
        name: 'default',
        constraints: [
          { contextName: 'environment', operator: 'IN', values: ['development', 'staging'] },
        ],
      },
    ],
  });
  console.log('Debug in prod:', unleash.isEnabled('debug-logging', { environment: 'production' }));
  console.log('Debug in dev:', unleash.isEnabled('debug-logging', { environment: 'development' }));
  console.log();

  console.log('=== Example 8: Feature Management ===');
  console.log('Total toggles:', unleash.getToggles().length);
  unleash.removeToggle('admin-panel');
  console.log('After removal:', unleash.getToggles().length);
  console.log();

  console.log('✅ Use Cases:');
  console.log('- Gradual feature rollouts (reduce risk)');
  console.log('- A/B testing and experiments');
  console.log('- User segmentation (premium vs free)');
  console.log('- Kill switches (emergency shutdowns)');
  console.log('- Environment-specific features');
  console.log('- Percentage-based rollouts');
  console.log();

  console.log('🚀 Performance:');
  console.log('- Zero dependencies');
  console.log('- In-memory evaluation (microseconds)');
  console.log('- Offline mode with bootstrap');
  console.log('- ~100K+ downloads/week on npm!');
  console.log();

  console.log('💡 Polyglot Tips:');
  console.log('- Use from Python/Ruby/Java via Elide');
  console.log('- Share flag config across all services');
  console.log('- Consistent rollout logic everywhere');
  console.log('- Perfect for polyglot microservices!');
}
