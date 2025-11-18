/**
 * unexpected - Extensible assertion library
 *
 * Pluggable assertion framework with custom matchers.
 * **POLYGLOT SHOWCASE**: Extensible assertions for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/unexpected (~200K+ downloads/week)
 *
 * Features:
 * - Extensible matchers
 * - Plugin system
 * - Rich error messages
 * - Type support
 * - Zero dependencies
 *
 * Use cases:
 * - Custom assertions
 * - Domain-specific testing
 * - Assertion libraries
 *
 * Package has ~200K+ downloads/week on npm!
 */

type Assertion = (actual: any, ...args: any[]) => void;

class Unexpected {
  private assertions: Map<string, Assertion> = new Map();

  constructor() {
    this.addAssertion('to be', (actual: any, expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    });

    this.addAssertion('to equal', (actual: any, expected: any) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
      }
    });

    this.addAssertion('to be truthy', (actual: any) => {
      if (!actual) {
        throw new Error(`Expected ${actual} to be truthy`);
      }
    });

    this.addAssertion('to be falsy', (actual: any) => {
      if (actual) {
        throw new Error(`Expected ${actual} to be falsy`);
      }
    });

    this.addAssertion('to contain', (actual: any, item: any) => {
      const contains = Array.isArray(actual) ? actual.includes(item) : String(actual).includes(item);
      if (!contains) {
        throw new Error(`Expected ${actual} to contain ${item}`);
      }
    });

    this.addAssertion('to have length', (actual: any, length: number) => {
      if (actual.length !== length) {
        throw new Error(`Expected length ${actual.length} to be ${length}`);
      }
    });

    this.addAssertion('to throw', (actual: any) => {
      let threw = false;
      try {
        actual();
      } catch (e) {
        threw = true;
      }
      if (!threw) {
        throw new Error('Expected function to throw');
      }
    });

    this.addAssertion('to match', (actual: any, pattern: RegExp) => {
      if (!pattern.test(String(actual))) {
        throw new Error(`Expected "${actual}" to match ${pattern}`);
      }
    });

    this.addAssertion('to be a', (actual: any, type: string) => {
      if (typeof actual !== type) {
        throw new Error(`Expected type "${typeof actual}" to be "${type}"`);
      }
    });

    this.addAssertion('to be an', this.assertions.get('to be a')!);
  }

  addAssertion(name: string, fn: Assertion): void {
    this.assertions.set(name, fn);
  }

  expect(actual: any, assertion: string, ...args: any[]): void {
    const fn = this.assertions.get(assertion);
    if (!fn) {
      throw new Error(`Unknown assertion: ${assertion}`);
    }
    fn(actual, ...args);
  }

  clone(): Unexpected {
    const instance = new Unexpected();
    this.assertions.forEach((fn, name) => {
      instance.addAssertion(name, fn);
    });
    return instance;
  }

  use(plugin: (expect: Unexpected) => void): this {
    plugin(this);
    return this;
  }
}

const expect = new Unexpected();

export default expect;
export { Unexpected };

// CLI Demo
if (import.meta.url.includes('elide-unexpected.ts')) {
  console.log('🔌 unexpected - Extensible Assertions for Elide (POLYGLOT!)\n');

  console.log('Example 1: Basic Assertions\n');
  expect.expect(2 + 2, 'to be', 4);
  expect.expect({ a: 1 }, 'to equal', { a: 1 });
  console.log('✓ Basic assertions work');

  console.log('\nExample 2: Type Checking\n');
  expect.expect('hello', 'to be a', 'string');
  expect.expect(42, 'to be a', 'number');
  console.log('✓ Type assertions work');

  console.log('\nExample 3: Arrays\n');
  expect.expect([1, 2, 3], 'to contain', 2);
  expect.expect([1, 2, 3], 'to have length', 3);
  console.log('✓ Array assertions work');

  console.log('\nExample 4: Custom Assertion\n');
  expect.addAssertion('to be positive', (actual: number) => {
    if (actual <= 0) {
      throw new Error(`Expected ${actual} to be positive`);
    }
  });
  expect.expect(42, 'to be positive');
  console.log('✓ Custom assertions work');

  console.log('\n✅ All assertions passed!');
  console.log('🚀 ~200K+ downloads/week on npm!');
  console.log('💡 Build your own assertion DSL!');
}
