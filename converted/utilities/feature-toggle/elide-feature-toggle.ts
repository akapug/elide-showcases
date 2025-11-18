/**
 * Feature Toggle - Simple Feature Flag Management
 *
 * Lightweight feature toggle library for controlling features.
 * **POLYGLOT SHOWCASE**: One toggle system for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/feature-toggle (~10K+ downloads/week)
 *
 * Features:
 * - Simple on/off toggles
 * - Environment-based toggles
 * - User-based toggles
 * - Percentage rollouts
 * - Zero dependencies
 *
 * Use cases:
 * - Feature flags
 * - Environment toggles
 * - Gradual rollouts
 *
 * Package has ~10K+ downloads/week on npm!
 */

export interface FeatureConfig {
  [key: string]: boolean | ToggleConfig;
}

export interface ToggleConfig {
  enabled: boolean;
  percentage?: number;
  users?: string[];
  environments?: string[];
}

export class FeatureToggle {
  private features: Map<string, ToggleConfig> = new Map();
  private environment: string;

  constructor(config: FeatureConfig, environment = 'production') {
    this.environment = environment;

    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'boolean') {
        this.features.set(key, { enabled: value });
      } else {
        this.features.set(key, value);
      }
    }
  }

  isEnabled(featureName: string, userId?: string): boolean {
    const feature = this.features.get(featureName);
    if (!feature) return false;
    if (!feature.enabled) return false;

    // Check environment
    if (feature.environments && !feature.environments.includes(this.environment)) {
      return false;
    }

    // Check user whitelist
    if (feature.users && userId) {
      return feature.users.includes(userId);
    }

    // Check percentage rollout
    if (feature.percentage !== undefined && userId) {
      const hash = this.hashUser(userId, featureName);
      return hash * 100 < feature.percentage;
    }

    return true;
  }

  enable(featureName: string): void {
    const feature = this.features.get(featureName);
    if (feature) {
      feature.enabled = true;
    } else {
      this.features.set(featureName, { enabled: true });
    }
  }

  disable(featureName: string): void {
    const feature = this.features.get(featureName);
    if (feature) {
      feature.enabled = false;
    }
  }

  toggle(featureName: string): void {
    const feature = this.features.get(featureName);
    if (feature) {
      feature.enabled = !feature.enabled;
    }
  }

  getAll(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [key, value] of this.features) {
      result[key] = value.enabled;
    }
    return result;
  }

  private hashUser(userId: string, feature: string): number {
    const str = feature + ':' + userId;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 10000) / 10000;
  }
}

export function create(config: FeatureConfig, environment?: string): FeatureToggle {
  return new FeatureToggle(config, environment);
}

export default { create, FeatureToggle };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎛️  Feature Toggle - Simple Feature Flags (POLYGLOT!)\n');

  const toggles = create({
    'new-ui': true,
    'dark-mode': false,
    'premium-features': {
      enabled: true,
      users: ['user1', 'user2', 'user3'],
    },
    'beta-feature': {
      enabled: true,
      percentage: 50,
    },
    'staging-only': {
      enabled: true,
      environments: ['development', 'staging'],
    },
  });

  console.log('=== Example 1: Simple Toggles ===');
  console.log('New UI:', toggles.isEnabled('new-ui'));
  console.log('Dark mode:', toggles.isEnabled('dark-mode'));
  console.log();

  console.log('=== Example 2: User-based Toggles ===');
  console.log('Premium for user1:', toggles.isEnabled('premium-features', 'user1'));
  console.log('Premium for user99:', toggles.isEnabled('premium-features', 'user99'));
  console.log();

  console.log('=== Example 3: Percentage Rollout ===');
  let enabled = 0;
  for (let i = 0; i < 100; i++) {
    if (toggles.isEnabled('beta-feature', `user${i}`)) {
      enabled++;
    }
  }
  console.log(`Beta enabled for ${enabled}/100 users (~50% expected)`);
  console.log();

  console.log('=== Example 4: Environment Toggles ===');
  const prodToggles = create({ 'staging-only': { enabled: true, environments: ['staging'] } }, 'production');
  const stagingToggles = create({ 'staging-only': { enabled: true, environments: ['staging'] } }, 'staging');
  console.log('Staging-only in prod:', prodToggles.isEnabled('staging-only'));
  console.log('Staging-only in staging:', stagingToggles.isEnabled('staging-only'));
  console.log();

  console.log('=== Example 5: Toggle Management ===');
  toggles.enable('dark-mode');
  console.log('After enable:', toggles.isEnabled('dark-mode'));
  toggles.disable('dark-mode');
  console.log('After disable:', toggles.isEnabled('dark-mode'));
  toggles.toggle('dark-mode');
  console.log('After toggle:', toggles.isEnabled('dark-mode'));
  console.log();

  console.log('=== Example 6: Get All Toggles ===');
  console.log('All toggles:', toggles.getAll());
  console.log();

  console.log('✅ Use Cases:');
  console.log('- Feature flags');
  console.log('- Environment toggles');
  console.log('- Gradual rollouts');
  console.log('- User whitelisting');
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');
}
