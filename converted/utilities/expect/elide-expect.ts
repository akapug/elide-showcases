/**
 * expect - Assertion library for testing
 *
 * Expressive assertions with chainable matchers.
 * **POLYGLOT SHOWCASE**: Assertions for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/expect (~10M+ downloads/week)
 *
 * Features:
 * - Chainable matchers
 * - Type checking
 * - Array/object matching
 * - Exception testing
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need assertions
 * - ONE assertion API works everywhere on Elide
 * - Share test expectations across languages
 * - Consistent test syntax
 *
 * Use cases:
 * - Unit testing
 * - Integration testing
 * - BDD-style assertions
 * - Test expectations
 *
 * Package has ~10M+ downloads/week on npm!
 */

class Expectation<T> {
  constructor(private actual: T, private isNot = false) {}

  get not(): Expectation<T> {
    return new Expectation(this.actual, !this.isNot);
  }

  private assert(condition: boolean, message: string): void {
    const passes = this.isNot ? !condition : condition;
    if (!passes) {
      throw new Error(message);
    }
  }

  toBe(expected: T): void {
    const message = this.isNot
      ? `Expected ${this.actual} not to be ${expected}`
      : `Expected ${this.actual} to be ${expected}`;
    this.assert(Object.is(this.actual, expected), message);
  }

  toEqual(expected: T): void {
    const message = this.isNot
      ? `Expected ${JSON.stringify(this.actual)} not to equal ${JSON.stringify(expected)}`
      : `Expected ${JSON.stringify(this.actual)} to equal ${JSON.stringify(expected)}`;
    this.assert(deepEqual(this.actual, expected), message);
  }

  toBeTruthy(): void {
    this.assert(!!this.actual, `Expected ${this.actual} to be truthy`);
  }

  toBeFalsy(): void {
    this.assert(!this.actual, `Expected ${this.actual} to be falsy`);
  }

  toBeNull(): void {
    this.assert(this.actual === null, `Expected ${this.actual} to be null`);
  }

  toBeUndefined(): void {
    this.assert(this.actual === undefined, `Expected ${this.actual} to be undefined`);
  }

  toBeDefined(): void {
    this.assert(this.actual !== undefined, `Expected value to be defined`);
  }

  toBeGreaterThan(expected: number): void {
    this.assert(
      (this.actual as any) > expected,
      `Expected ${this.actual} to be greater than ${expected}`
    );
  }

  toBeLessThan(expected: number): void {
    this.assert(
      (this.actual as any) < expected,
      `Expected ${this.actual} to be less than ${expected}`
    );
  }

  toContain(item: any): void {
    const contains = Array.isArray(this.actual)
      ? (this.actual as any[]).includes(item)
      : typeof this.actual === 'string'
      ? (this.actual as string).includes(item)
      : false;
    this.assert(contains, `Expected ${this.actual} to contain ${item}`);
  }

  toHaveLength(length: number): void {
    const actualLength = (this.actual as any).length;
    this.assert(
      actualLength === length,
      `Expected length ${actualLength} to be ${length}`
    );
  }

  toThrow(expected?: string | RegExp): void {
    let threw = false;
    let error: Error | undefined;

    try {
      (this.actual as any)();
    } catch (e) {
      threw = true;
      error = e as Error;
    }

    if (!this.isNot && !threw) {
      throw new Error('Expected function to throw');
    }

    if (this.isNot && threw) {
      throw new Error('Expected function not to throw');
    }

    if (expected && error) {
      const matches =
        typeof expected === 'string'
          ? error.message.includes(expected)
          : expected.test(error.message);

      if (!matches) {
        throw new Error(`Expected error "${error.message}" to match ${expected}`);
      }
    }
  }

  toMatch(pattern: RegExp | string): void {
    const str = String(this.actual);
    const matches =
      typeof pattern === 'string' ? str.includes(pattern) : pattern.test(str);
    this.assert(matches, `Expected "${str}" to match ${pattern}`);
  }

  toMatchObject(expected: Partial<T>): void {
    const matches = Object.keys(expected).every(
      (key) => deepEqual((this.actual as any)[key], (expected as any)[key])
    );
    this.assert(matches, `Expected object to match ${JSON.stringify(expected)}`);
  }

  toHaveProperty(path: string, value?: any): void {
    const keys = path.split('.');
    let current: any = this.actual;

    for (const key of keys) {
      if (current == null || !(key in current)) {
        throw new Error(`Expected object to have property ${path}`);
      }
      current = current[key];
    }

    if (value !== undefined) {
      this.assert(
        deepEqual(current, value),
        `Expected property ${path} to equal ${JSON.stringify(value)}`
      );
    }
  }
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => deepEqual(a[key], b[key]));
  }

  return false;
}

export function expect<T>(actual: T): Expectation<T> {
  return new Expectation(actual);
}

export default expect;

// CLI Demo
if (import.meta.url.includes('elide-expect.ts')) {
  console.log('✅ expect - Assertion Library for Elide (POLYGLOT!)\n');

  console.log('Example 1: Basic Assertions\n');
  expect(2 + 2).toBe(4);
  expect('hello').toBe('hello');
  console.log('✓ toBe works');

  console.log('\nExample 2: Object Equality\n');
  expect({ a: 1, b: 2 }).toEqual({ a: 1, b: 2 });
  console.log('✓ toEqual works');

  console.log('\nExample 3: Truthiness\n');
  expect(true).toBeTruthy();
  expect(0).toBeFalsy();
  console.log('✓ Truthiness checks work');

  console.log('\nExample 4: Arrays\n');
  expect([1, 2, 3]).toContain(2);
  expect([1, 2, 3]).toHaveLength(3);
  console.log('✓ Array matchers work');

  console.log('\nExample 5: Exceptions\n');
  expect(() => {
    throw new Error('Oops!');
  }).toThrow('Oops!');
  console.log('✓ Exception testing works');

  console.log('\n✅ All assertions passed!');
  console.log('\n🚀 ~10M+ downloads/week on npm!');
  console.log('💡 Perfect for polyglot testing!');
}
