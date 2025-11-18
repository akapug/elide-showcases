/**
 * ABTest - Simple AB Testing
 *
 * Simple A/B testing library for quick experiments.
 * **POLYGLOT SHOWCASE**: One AB test library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/abtest (~10K+ downloads/week)
 *
 * Features:
 * - Simple A/B tests
 * - Quick setup
 * - Variant tracking
 * - Zero dependencies
 *
 * Use cases:
 * - Quick A/B tests
 * - Simple experiments
 *
 * Package has ~10K+ downloads/week on npm!
 */

export interface TestOptions {
  name: string;
  variants: string[];
  weights?: number[];
}

export class ABTestRunner {
  private tests = new Map<string, TestOptions>();
  private assignments = new Map<string, string>();

  addTest(options: TestOptions): void {
    this.tests.set(options.name, options);
  }

  getVariant(testName: string, userId: string): string {
    const key = `${testName}:${userId}`;
    if (this.assignments.has(key)) {
      return this.assignments.get(key)!;
    }

    const test = this.tests.get(testName);
    if (!test) return 'control';

    const variant = this.selectVariant(test, userId);
    this.assignments.set(key, variant);
    return variant;
  }

  private selectVariant(test: TestOptions, userId: string): string {
    const hash = this.hash(userId, test.name);
    const weights = test.weights || test.variants.map(() => 1 / test.variants.length);

    let sum = 0;
    for (let i = 0; i < test.variants.length; i++) {
      sum += weights[i];
      if (hash < sum) return test.variants[i];
    }

    return test.variants[test.variants.length - 1];
  }

  private hash(userId: string, testName: string): number {
    const str = testName + userId;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 10000) / 10000;
  }
}

export function createRunner(): ABTestRunner {
  return new ABTestRunner();
}

export default { createRunner, ABTestRunner };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔬 ABTest - Simple AB Testing (POLYGLOT!)\n');

  const runner = createRunner();

  runner.addTest({
    name: 'pricing-page',
    variants: ['monthly', 'annual'],
    weights: [0.5, 0.5],
  });

  console.log('=== Example 1: Get Variant ===');
  console.log('User 1:', runner.getVariant('pricing-page', 'user1'));
  console.log('User 2:', runner.getVariant('pricing-page', 'user2'));
  console.log();

  console.log('=== Example 2: Distribution ===');
  const dist = { monthly: 0, annual: 0 };
  for (let i = 0; i < 1000; i++) {
    const v = runner.getVariant('pricing-page', `user${i}`);
    dist[v as keyof typeof dist]++;
  }
  console.log('Monthly:', dist.monthly, '(~50% expected)');
  console.log('Annual:', dist.annual, '(~50% expected)');
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');
}
