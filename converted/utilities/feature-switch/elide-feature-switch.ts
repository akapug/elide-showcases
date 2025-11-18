/**
 * Feature Switch - Feature Control System
 *
 * System for switching features on and off dynamically.
 * **POLYGLOT SHOWCASE**: One feature switch for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/feature-switch (~3K+ downloads/week)
 *
 * Features:
 * - Dynamic feature switching
 * - Runtime control
 * - Feature groups
 * - State persistence
 * - Zero dependencies
 *
 * Use cases:
 * - Feature control
 * - Runtime switching
 *
 * Package has ~3K+ downloads/week on npm!
 */

export interface FeatureSwitchConfig {
  [feature: string]: boolean | FeatureConfig;
}

export interface FeatureConfig {
  enabled: boolean;
  description?: string;
  group?: string;
}

export class FeatureSwitch {
  private features = new Map<string, FeatureConfig>();

  constructor(config: FeatureSwitchConfig = {}) {
    for (const [name, value] of Object.entries(config)) {
      if (typeof value === 'boolean') {
        this.features.set(name, { enabled: value });
      } else {
        this.features.set(name, value);
      }
    }
  }

  isEnabled(name: string): boolean {
    return this.features.get(name)?.enabled || false;
  }

  enable(name: string): void {
    const feature = this.features.get(name);
    if (feature) {
      feature.enabled = true;
    } else {
      this.features.set(name, { enabled: true });
    }
  }

  disable(name: string): void {
    const feature = this.features.get(name);
    if (feature) {
      feature.enabled = false;
    }
  }

  toggle(name: string): void {
    const feature = this.features.get(name);
    if (feature) {
      feature.enabled = !feature.enabled;
    }
  }

  getGroup(group: string): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [name, config] of this.features) {
      if (config.group === group) {
        result[name] = config.enabled;
      }
    }
    return result;
  }

  enableGroup(group: string): void {
    for (const [name, config] of this.features) {
      if (config.group === group) {
        config.enabled = true;
      }
    }
  }

  disableGroup(group: string): void {
    for (const [name, config] of this.features) {
      if (config.group === group) {
        config.enabled = false;
      }
    }
  }

  getAll(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [name, config] of this.features) {
      result[name] = config.enabled;
    }
    return result;
  }

  export(): FeatureSwitchConfig {
    const result: FeatureSwitchConfig = {};
    for (const [name, config] of this.features) {
      result[name] = config;
    }
    return result;
  }
}

export function createSwitch(config?: FeatureSwitchConfig): FeatureSwitch {
  return new FeatureSwitch(config);
}

export default { createSwitch, FeatureSwitch };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔀 Feature Switch - Feature Control (POLYGLOT!)\n');

  const features = createSwitch({
    'dark-mode': { enabled: true, description: 'Dark mode theme', group: 'ui' },
    'new-ui': { enabled: false, description: 'New UI design', group: 'ui' },
    'api-v2': { enabled: true, description: 'API version 2', group: 'api' },
    'graphql': { enabled: false, description: 'GraphQL endpoint', group: 'api' },
  });

  console.log('=== Example 1: Check Features ===');
  console.log('Dark mode:', features.isEnabled('dark-mode'));
  console.log('New UI:', features.isEnabled('new-ui'));
  console.log();

  console.log('=== Example 2: Toggle Features ===');
  features.toggle('new-ui');
  console.log('After toggle:', features.isEnabled('new-ui'));
  features.disable('dark-mode');
  console.log('After disable:', features.isEnabled('dark-mode'));
  console.log();

  console.log('=== Example 3: Feature Groups ===');
  console.log('UI features:', features.getGroup('ui'));
  console.log('API features:', features.getGroup('api'));
  console.log();

  console.log('=== Example 4: Group Control ===');
  features.enableGroup('ui');
  console.log('After enable UI group:', features.getGroup('ui'));
  features.disableGroup('api');
  console.log('After disable API group:', features.getGroup('api'));
  console.log();

  console.log('=== Example 5: Export State ===');
  console.log('All features:', features.getAll());
  console.log();

  console.log('=== Example 6: Full Export ===');
  console.log('Export config:', features.export());
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');
}
