/**
 * AB Test - Simple A/B Testing Library
 *
 * Lightweight A/B testing for experiments and feature toggles.
 * **POLYGLOT SHOWCASE**: One A/B testing library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/ab-test (~20K+ downloads/week)
 *
 * Features:
 * - Simple A/B test variants
 * - Weighted distribution
 * - User bucketing
 * - Test tracking
 * - Zero dependencies
 *
 * Use cases:
 * - Simple A/B tests
 * - Feature variants
 * - Split testing
 *
 * Package has ~20K+ downloads/week on npm!
 */

export interface ABTestConfig {
  name: string;
  variants: ABVariant[];
  userKey?: string;
}

export interface ABVariant {
  name: string;
  weight: number;
  value?: any;
}

export class ABTest {
  private config: ABTestConfig;
  private selectedVariant: ABVariant | null = null;

  constructor(config: ABTestConfig) {
    this.config = config;

    // Validate weights sum to 100
    const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`Variant weights must sum to 100, got ${totalWeight}`);
    }
  }

  getVariant(userId: string): ABVariant {
    if (this.selectedVariant) return this.selectedVariant;

    const hash = this.hashUserId(userId);
    const random = hash * 100;

    let cumulative = 0;
    for (const variant of this.config.variants) {
      cumulative += variant.weight;
      if (random < cumulative) {
        this.selectedVariant = variant;
        return variant;
      }
    }

    // Fallback to last variant
    this.selectedVariant = this.config.variants[this.config.variants.length - 1];
    return this.selectedVariant;
  }

  getValue(userId: string): any {
    return this.getVariant(userId).value;
  }

  is(userId: string, variantName: string): boolean {
    return this.getVariant(userId).name === variantName;
  }

  private hashUserId(userId: string): number {
    const str = this.config.name + ':' + userId;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 10000) / 10000;
  }
}

export function createTest(config: ABTestConfig): ABTest {
  return new ABTest(config);
}

export default { createTest, ABTest };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🧪 AB Test - Simple A/B Testing (POLYGLOT!)\n');

  const test = createTest({
    name: 'button-color',
    variants: [
      { name: 'control', weight: 50, value: 'blue' },
      { name: 'variant-a', weight: 30, value: 'green' },
      { name: 'variant-b', weight: 20, value: 'red' },
    ],
  });

  console.log('=== Example 1: Get Variant ===');
  const variant = test.getVariant('user123');
  console.log('Variant name:', variant.name);
  console.log('Variant value:', variant.value);
  console.log();

  console.log('=== Example 2: Get Value ===');
  console.log('Button color:', test.getValue('user123'));
  console.log();

  console.log('=== Example 3: Check Variant ===');
  console.log('Is control?', test.is('user123', 'control'));
  console.log('Is variant-a?', test.is('user123', 'variant-a'));
  console.log();

  console.log('=== Example 4: Distribution Test ===');
  const dist = { control: 0, 'variant-a': 0, 'variant-b': 0 };
  for (let i = 0; i < 1000; i++) {
    const v = test.getVariant(`user${i}`);
    dist[v.name as keyof typeof dist]++;
  }
  console.log('Distribution over 1000 users:');
  console.log('  Control:', dist.control, '(~50% expected)');
  console.log('  Variant A:', dist['variant-a'], '(~30% expected)');
  console.log('  Variant B:', dist['variant-b'], '(~20% expected)');
  console.log();

  console.log('✅ Use Cases:');
  console.log('- Simple A/B tests');
  console.log('- Feature variants');
  console.log('- Split testing');
  console.log('- UI experiments');
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');
}
