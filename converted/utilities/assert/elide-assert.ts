/**
 * assert - Node.js assert module
 *
 * Core assertion functions for testing.
 * **POLYGLOT SHOWCASE**: Standard assertions for ALL languages on Elide!
 *
 * Based on https://nodejs.org/api/assert.html (~50M+ downloads/week)
 *
 * Features:
 * - Basic assertions
 * - Deep equality
 * - Type checking
 * - Exception testing
 * - Zero dependencies
 *
 * Use cases:
 * - Unit testing
 * - Input validation
 * - Contract checking
 *
 * Package has ~50M+ downloads/week on npm!
 */

class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

function assert(value: any, message?: string): void {
  if (!value) {
    throw new AssertionError(message || `Expected ${value} to be truthy`);
  }
}

assert.ok = assert;

assert.equal = (actual: any, expected: any, message?: string): void => {
  if (actual != expected) {
    throw new AssertionError(message || `Expected ${actual} to equal ${expected}`);
  }
};

assert.strictEqual = (actual: any, expected: any, message?: string): void => {
  if (actual !== expected) {
    throw new AssertionError(message || `Expected ${actual} to strictly equal ${expected}`);
  }
};

assert.notEqual = (actual: any, expected: any, message?: string): void => {
  if (actual == expected) {
    throw new AssertionError(message || `Expected ${actual} not to equal ${expected}`);
  }
};

assert.notStrictEqual = (actual: any, expected: any, message?: string): void => {
  if (actual === expected) {
    throw new AssertionError(message || `Expected ${actual} not to strictly equal ${expected}`);
  }
};

assert.deepEqual = (actual: any, expected: any, message?: string): void => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new AssertionError(message || `Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`);
  }
};

assert.notDeepEqual = (actual: any, expected: any, message?: string): void => {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    throw new AssertionError(message || `Expected values not to deep equal`);
  }
};

assert.throws = (fn: () => any, error?: RegExp | string, message?: string): void => {
  let threw = false;
  let thrownError: Error | undefined;

  try {
    fn();
  } catch (e) {
    threw = true;
    thrownError = e as Error;
  }

  if (!threw) {
    throw new AssertionError(message || 'Expected function to throw');
  }

  if (error) {
    const msg = thrownError!.message;
    const matches = typeof error === 'string' ? msg.includes(error) : error.test(msg);
    if (!matches) {
      throw new AssertionError(message || `Expected error "${msg}" to match ${error}`);
    }
  }
};

assert.doesNotThrow = (fn: () => any, message?: string): void => {
  try {
    fn();
  } catch (e) {
    throw new AssertionError(message || `Expected function not to throw: ${(e as Error).message}`);
  }
};

assert.fail = (message?: string): never => {
  throw new AssertionError(message || 'Assertion failed');
};

assert.ifError = (value: any): void => {
  if (value) {
    throw value;
  }
};

assert.AssertionError = AssertionError;

export default assert;
export { AssertionError };

// CLI Demo
if (import.meta.url.includes('elide-assert.ts')) {
  console.log('✅ assert - Core Assertions for Elide (POLYGLOT!)\n');

  console.log('Example 1: Basic Assertions\n');
  assert(true);
  assert.ok(1 + 1 === 2);
  console.log('✓ Basic assertions work');

  console.log('\nExample 2: Equality\n');
  assert.equal(2 + 2, 4);
  assert.strictEqual('hello', 'hello');
  console.log('✓ Equality checks work');

  console.log('\nExample 3: Deep Equality\n');
  assert.deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 });
  assert.deepEqual([1, 2, 3], [1, 2, 3]);
  console.log('✓ Deep equality works');

  console.log('\nExample 4: Exceptions\n');
  assert.throws(() => { throw new Error('test'); });
  assert.doesNotThrow(() => { return 42; });
  console.log('✓ Exception testing works');

  console.log('\n✅ All assertions passed!');
  console.log('🚀 ~50M+ downloads/week on npm!');
  console.log('💡 Node.js standard assertions!');
}
