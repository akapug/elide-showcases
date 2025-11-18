/**
 * assert-plus - Extra assertions on top of Node's assert
 * Based on https://www.npmjs.com/package/assert-plus (~80M+ downloads/week)
 *
 * Features:
 * - Type checking assertions
 * - Optional assertions
 * - Rich error messages
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Comprehensive type checks
 */

class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

const assert = {
  ok(value: any, message?: string): asserts value {
    if (!value) {
      throw new AssertionError(message || 'Expected value to be truthy');
    }
  },

  string(value: any, message?: string): asserts value is string {
    if (typeof value !== 'string') {
      throw new AssertionError(message || `Expected string, got ${typeof value}`);
    }
  },

  number(value: any, message?: string): asserts value is number {
    if (typeof value !== 'number') {
      throw new AssertionError(message || `Expected number, got ${typeof value}`);
    }
  },

  object(value: any, message?: string): asserts value is object {
    if (typeof value !== 'object' || value === null) {
      throw new AssertionError(message || 'Expected object');
    }
  },

  array(value: any, message?: string): asserts value is any[] {
    if (!Array.isArray(value)) {
      throw new AssertionError(message || 'Expected array');
    }
  },

  func(value: any, message?: string): asserts value is Function {
    if (typeof value !== 'function') {
      throw new AssertionError(message || 'Expected function');
    }
  },

  bool(value: any, message?: string): asserts value is boolean {
    if (typeof value !== 'boolean') {
      throw new AssertionError(message || `Expected boolean, got ${typeof value}`);
    }
  },

  optionalString(value: any, message?: string): asserts value is string | undefined {
    if (value !== undefined && typeof value !== 'string') {
      throw new AssertionError(message || `Expected optional string, got ${typeof value}`);
    }
  },

  optionalNumber(value: any, message?: string): asserts value is number | undefined {
    if (value !== undefined && typeof value !== 'number') {
      throw new AssertionError(message || `Expected optional number, got ${typeof value}`);
    }
  },

  equal(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new AssertionError(
        message || `Expected ${expected}, got ${actual}`
      );
    }
  }
};

export default assert;
export { AssertionError };

// Self-test
if (import.meta.url.includes("elide-assert-plus.ts")) {
  console.log("✅ assert-plus - Extra Assertions (POLYGLOT!)\n");

  // Type assertions
  assert.string('hello');
  assert.number(42);
  assert.bool(true);
  assert.array([1, 2, 3]);
  console.log('✓ Type assertions passed');

  // Optional assertions
  assert.optionalString(undefined);
  assert.optionalNumber(100);
  console.log('✓ Optional assertions passed');

  // Test error
  try {
    assert.string(123);
  } catch (error) {
    console.log('✓ Caught type error:', (error as Error).message);
  }

  console.log("\n🚀 ~80M+ downloads/week | Comprehensive type assertions\n");
}
