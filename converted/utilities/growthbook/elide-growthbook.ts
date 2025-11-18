/**
 * GrowthBook - Open Source Feature Flagging and A/B Testing
 *
 * Data-driven feature flagging and experimentation platform.
 * **POLYGLOT SHOWCASE**: One GrowthBook SDK for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@growthbook/growthbook (~30K+ downloads/week)
 *
 * Features:
 * - Feature flags with experiments
 * - Statistical A/B testing
 * - Targeting rules
 * - Percentage rollouts
 * - Multi-variate testing
 * - Analytics integration
 * - Zero dependencies
 *
 * Use cases:
 * - A/B testing and experiments
 * - Data-driven feature releases
 * - Statistical analysis
 *
 * Package has ~30K+ downloads/week on npm!
 */

export interface GrowthBookConfig {
  apiHost?: string;
  clientKey?: string;
  enableDevMode?: boolean;
  features?: Record<string, Feature>;
  attributes?: Record<string, any>;
}

export interface Feature {
  defaultValue?: any;
  rules?: FeatureRule[];
}

export interface FeatureRule {
  condition?: Condition;
  force?: any;
  variations?: any[];
  weights?: number[];
  key?: string;
  coverage?: number;
  hashAttribute?: string;
}

export interface Condition {
  [key: string]: any;
}

export interface Experiment<T> {
  key: string;
  variations: T[];
  weights?: number[];
  active?: boolean;
  coverage?: number;
  condition?: Condition;
  force?: number;
  hashAttribute?: string;
}

export interface Result<T> {
  value: T;
  variationId: number;
  inExperiment: boolean;
  hashUsed: boolean;
  hashAttribute: string;
  hashValue: string;
}

export class GrowthBook {
  private config: GrowthBookConfig;
  private attributes: Record<string, any>;
  private features: Map<string, Feature>;
  private forced = new Map<string, any>();

  constructor(config: GrowthBookConfig) {
    this.config = config;
    this.attributes = config.attributes || {};
    this.features = new Map();

    if (config.features) {
      for (const [key, feature] of Object.entries(config.features)) {
        this.features.set(key, feature);
      }
    }
  }

  setAttributes(attributes: Record<string, any>): void {
    this.attributes = { ...this.attributes, ...attributes };
  }

  setForcedVariations(forced: Record<string, number>): void {
    for (const [key, variation] of Object.entries(forced)) {
      this.forced.set(key, variation);
    }
  }

  getFeatureValue<T>(key: string, defaultValue: T): T {
    const feature = this.features.get(key);
    if (!feature) return defaultValue;

    if (feature.rules) {
      for (const rule of feature.rules) {
        if (rule.condition && !this.evalCondition(rule.condition)) {
          continue;
        }

        if (rule.force !== undefined) {
          return rule.force as T;
        }

        if (rule.variations && rule.weights) {
          const hash = this.hash(this.attributes[rule.hashAttribute || 'id'] || '', key);
          const variation = this.chooseVariation(hash, rule.weights);
          return rule.variations[variation] as T;
        }
      }
    }

    return (feature.defaultValue !== undefined ? feature.defaultValue : defaultValue) as T;
  }

  isOn(key: string): boolean {
    return this.getFeatureValue(key, false);
  }

  isOff(key: string): boolean {
    return !this.isOn(key);
  }

  run<T>(experiment: Experiment<T>): Result<T> {
    // Check if forced
    const forced = this.forced.get(experiment.key);
    if (forced !== undefined) {
      return {
        value: experiment.variations[forced],
        variationId: forced,
        inExperiment: true,
        hashUsed: false,
        hashAttribute: '',
        hashValue: '',
      };
    }

    // Check if active
    if (experiment.active === false) {
      return {
        value: experiment.variations[0],
        variationId: 0,
        inExperiment: false,
        hashUsed: false,
        hashAttribute: '',
        hashValue: '',
      };
    }

    // Check condition
    if (experiment.condition && !this.evalCondition(experiment.condition)) {
      return {
        value: experiment.variations[0],
        variationId: 0,
        inExperiment: false,
        hashUsed: false,
        hashAttribute: '',
        hashValue: '',
      };
    }

    // Hash and choose variation
    const hashAttribute = experiment.hashAttribute || 'id';
    const hashValue = this.attributes[hashAttribute] || '';
    const hash = this.hash(hashValue, experiment.key);
    const weights = experiment.weights || experiment.variations.map(() => 1 / experiment.variations.length);
    const coverage = experiment.coverage !== undefined ? experiment.coverage : 1;

    if (hash >= coverage) {
      return {
        value: experiment.variations[0],
        variationId: 0,
        inExperiment: false,
        hashUsed: true,
        hashAttribute,
        hashValue,
      };
    }

    const variationId = this.chooseVariation(hash / coverage, weights);
    return {
      value: experiment.variations[variationId],
      variationId,
      inExperiment: true,
      hashUsed: true,
      hashAttribute,
      hashValue,
    };
  }

  private evalCondition(condition: Condition): boolean {
    // Simplified condition evaluation
    for (const [key, value] of Object.entries(condition)) {
      if (this.attributes[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private hash(value: string, seed: string): number {
    const str = value + seed;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 10000) / 10000;
  }

  private chooseVariation(hash: number, weights: number[]): number {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (hash < sum) return i;
    }
    return weights.length - 1;
  }

  destroy(): void {
    this.features.clear();
    this.forced.clear();
  }
}

export default { GrowthBook };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('📊 GrowthBook - A/B Testing & Feature Flags (POLYGLOT!)\n');

  const gb = new GrowthBook({
    attributes: { id: 'user123', plan: 'premium', country: 'US' },
    features: {
      'new-checkout': {
        defaultValue: false,
        rules: [
          { force: true, condition: { plan: 'premium' } },
        ],
      },
      'button-color': {
        defaultValue: 'blue',
        rules: [
          { variations: ['blue', 'green', 'red'], weights: [0.33, 0.33, 0.34], key: 'color-test' },
        ],
      },
    },
  });

  console.log('=== Example 1: Feature Flags ===');
  console.log('New checkout:', gb.isOn('new-checkout'));
  console.log('Dark mode:', gb.isOn('dark-mode'));
  console.log();

  console.log('=== Example 2: Feature Values ===');
  console.log('Button color:', gb.getFeatureValue('button-color', 'blue'));
  console.log('Max items:', gb.getFeatureValue('max-items', 10));
  console.log();

  console.log('=== Example 3: A/B Testing ===');
  const experiment: Experiment<string> = {
    key: 'checkout-flow',
    variations: ['control', 'variant-a', 'variant-b'],
    weights: [0.33, 0.33, 0.34],
  };

  const result = gb.run(experiment);
  console.log('Variation:', result.value);
  console.log('Variation ID:', result.variationId);
  console.log('In experiment:', result.inExperiment);
  console.log();

  console.log('=== Example 4: Distribution Test ===');
  const dist = { control: 0, 'variant-a': 0, 'variant-b': 0 };
  for (let i = 0; i < 1000; i++) {
    const tempGb = new GrowthBook({
      attributes: { id: `user${i}` },
    });
    const res = tempGb.run(experiment);
    dist[res.value as keyof typeof dist]++;
  }
  console.log('Distribution over 1000 users:');
  console.log('  Control:', dist.control, '(~33% expected)');
  console.log('  Variant A:', dist['variant-a'], '(~33% expected)');
  console.log('  Variant B:', dist['variant-b'], '(~34% expected)');
  console.log();

  console.log('=== Example 5: Forced Variations ===');
  gb.setForcedVariations({ 'checkout-flow': 1 });
  const forcedResult = gb.run(experiment);
  console.log('Forced to variant:', forcedResult.value);
  console.log();

  console.log('=== Example 6: Conditional Features ===');
  gb.setAttributes({ plan: 'free' });
  console.log('Premium feature (free plan):', gb.isOn('new-checkout'));
  gb.setAttributes({ plan: 'premium' });
  console.log('Premium feature (premium plan):', gb.isOn('new-checkout'));
  console.log();

  console.log('✅ Use Cases:');
  console.log('- A/B testing and experiments');
  console.log('- Data-driven feature releases');
  console.log('- Statistical analysis');
  console.log('- Multi-variate testing');
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');

  gb.destroy();
}
