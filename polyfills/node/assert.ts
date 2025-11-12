/**
 * Assert - Assertion Testing for Elide
 *
 * Complete implementation of Node.js assert module.
 * **POLYGLOT SHOWCASE**: Testing assertions for ALL languages on Elide!
 *
 * Features:
 * - Equality assertions
 * - Deep equality
 * - Throws assertions
 * - Strict mode
 * - Custom error messages
 *
 * Use cases:
 * - Unit testing
 * - Integration testing
 * - Contract validation
 * - Input validation
 * - Development assertions
 */

/**
 * AssertionError class
 */
export class AssertionError extends Error {
  actual: any;
  expected: any;
  operator: string;
  generatedMessage: boolean;

  constructor(options: {
    message?: string;
    actual?: any;
    expected?: any;
    operator?: string;
    stackStartFn?: Function;
  }) {
    super(options.message || `Assertion failed: ${options.actual} ${options.operator} ${options.expected}`);
    this.name = 'AssertionError';
    this.actual = options.actual;
    this.expected = options.expected;
    this.operator = options.operator || '==';
    this.generatedMessage = !options.message;
  }
}

/**
 * Assert that value is truthy
 */
export function assert(value: any, message?: string | Error): asserts value {
  if (!value) {
    throw new AssertionError({
      message: message instanceof Error ? message.message : message,
      actual: value,
      expected: true,
      operator: '=='
    });
  }
}

/**
 * Always fails
 */
export function fail(message?: string | Error): never {
  throw new AssertionError({
    message: message instanceof Error ? message.message : (message || 'Failed')
  });
}

/**
 * Assert that two values are equal (==)
 */
export function equal(actual: any, expected: any, message?: string | Error): void {
  if (actual != expected) {
    throw new AssertionError({
      message: message instanceof Error ? message.message : message,
      actual,
      expected,
      operator: '=='
    });
  }
}

/**
 * Assert that two values are not equal (!=)
 */
export function notEqual(actual: any, expected: any, message?: string | Error): void {
  if (actual == expected) {
    throw new AssertionError({
      message: message instanceof Error ? message.message : message,
      actual,
      expected,
      operator: '!='
    });
  }
}

/**
 * Assert that two values are strictly equal (===)
 */
export function strictEqual(actual: any, expected: any, message?: string | Error): void {
  if (actual !== expected) {
    throw new AssertionError({
      message: message instanceof Error ? message.message : message,
      actual,
      expected,
      operator: '==='
    });
  }
}

/**
 * Assert that two values are strictly not equal (!==)
 */
export function notStrictEqual(actual: any, expected: any, message?: string | Error): void {
  if (actual === expected) {
    throw new AssertionError({
      message: message instanceof Error ? message.message : message,
      actual,
      expected,
      operator: '!=='
    });
  }
}

/**
 * Deep equality check
 */
function deepEqual(a: any, b: any): boolean {
  // Same reference
  if (a === b) return true;

  // Dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // RegExp
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  // null or undefined
  if (a === null || a === undefined || b === null || b === undefined) {
    return a === b;
  }

  // Different types
  if (typeof a !== typeof b) return false;

  // Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  return false;
}

/**
 * Assert that two values are deeply equal
 */
export function deepStrictEqual(actual: any, expected: any, message?: string | Error): void {
  if (!deepEqual(actual, expected)) {
    throw new AssertionError({
      message: message instanceof Error ? message.message : message,
      actual,
      expected,
      operator: 'deepStrictEqual'
    });
  }
}

/**
 * Assert that two values are not deeply equal
 */
export function notDeepStrictEqual(actual: any, expected: any, message?: string | Error): void {
  if (deepEqual(actual, expected)) {
    throw new AssertionError({
      message: message instanceof Error ? message.message : message,
      actual,
      expected,
      operator: 'notDeepStrictEqual'
    });
  }
}

/**
 * Assert that a function throws an error
 */
export function throws(
  fn: () => any,
  error?: RegExp | Function | Error,
  message?: string
): void {
  let threw = false;
  let thrownError: any;

  try {
    fn();
  } catch (err) {
    threw = true;
    thrownError = err;
  }

  if (!threw) {
    throw new AssertionError({
      message: message || 'Missing expected exception',
      operator: 'throws'
    });
  }

  // Check error type/message
  if (error) {
    if (error instanceof RegExp) {
      if (!error.test(thrownError.message)) {
        throw new AssertionError({
          message: message || `Error message does not match: ${thrownError.message}`,
          actual: thrownError.message,
          expected: error,
          operator: 'throws'
        });
      }
    } else if (typeof error === 'function') {
      if (!(thrownError instanceof error)) {
        throw new AssertionError({
          message: message || `Error is not instance of ${error.name}`,
          actual: thrownError,
          expected: error,
          operator: 'throws'
        });
      }
    }
  }
}

/**
 * Assert that a function does not throw
 */
export function doesNotThrow(
  fn: () => any,
  error?: RegExp | Function,
  message?: string
): void {
  try {
    fn();
  } catch (err) {
    throw new AssertionError({
      message: message || `Got unwanted exception: ${err}`,
      actual: err,
      operator: 'doesNotThrow'
    });
  }
}

/**
 * Assert that value is truthy (alias for ok)
 */
export function ok(value: any, message?: string | Error): asserts value {
  assert(value, message);
}

/**
 * Assert that a promise rejects
 */
export async function rejects(
  asyncFn: (() => Promise<any>) | Promise<any>,
  error?: RegExp | Function | Error,
  message?: string
): Promise<void> {
  const promise = typeof asyncFn === 'function' ? asyncFn() : asyncFn;

  try {
    await promise;
  } catch (err) {
    // Check error type/message if provided
    if (error) {
      if (error instanceof RegExp) {
        if (!error.test((err as Error).message)) {
          throw new AssertionError({
            message: message || `Error message does not match: ${(err as Error).message}`,
            actual: (err as Error).message,
            expected: error,
            operator: 'rejects'
          });
        }
      } else if (typeof error === 'function') {
        if (!(err instanceof error)) {
          throw new AssertionError({
            message: message || `Error is not instance of ${error.name}`,
            actual: err,
            expected: error,
            operator: 'rejects'
          });
        }
      }
    }
    return;
  }

  throw new AssertionError({
    message: message || 'Missing expected rejection',
    operator: 'rejects'
  });
}

/**
 * Assert that a promise does not reject
 */
export async function doesNotReject(
  asyncFn: (() => Promise<any>) | Promise<any>,
  error?: RegExp | Function,
  message?: string
): Promise<void> {
  const promise = typeof asyncFn === 'function' ? asyncFn() : asyncFn;

  try {
    await promise;
  } catch (err) {
    throw new AssertionError({
      message: message || `Got unwanted rejection: ${err}`,
      actual: err,
      operator: 'doesNotReject'
    });
  }
}

/**
 * Match regex or substring
 */
export function match(actual: string, expected: RegExp, message?: string | Error): void {
  if (!expected.test(actual)) {
    throw new AssertionError({
      message: message instanceof Error ? message.message : message,
      actual,
      expected,
      operator: 'match'
    });
  }
}

/**
 * Does not match regex
 */
export function doesNotMatch(actual: string, expected: RegExp, message?: string | Error): void {
  if (expected.test(actual)) {
    throw new AssertionError({
      message: message instanceof Error ? message.message : message,
      actual,
      expected,
      operator: 'doesNotMatch'
    });
  }
}

// Strict mode (default export)
export const strict = {
  AssertionError,
  equal: strictEqual,
  notEqual: notStrictEqual,
  deepEqual: deepStrictEqual,
  notDeepEqual: notDeepStrictEqual,
  strictEqual,
  notStrictEqual,
  deepStrictEqual,
  notDeepStrictEqual,
  throws,
  doesNotThrow,
  rejects,
  doesNotReject,
  ok,
  assert,
  fail,
  match,
  doesNotMatch
};

// Default export
export default Object.assign(assert, {
  AssertionError,
  equal,
  notEqual,
  strictEqual,
  notStrictEqual,
  deepEqual: deepStrictEqual,
  notDeepEqual: notDeepStrictEqual,
  deepStrictEqual,
  notDeepStrictEqual,
  throws,
  doesNotThrow,
  rejects,
  doesNotReject,
  ok,
  fail,
  match,
  doesNotMatch,
  strict
});

// CLI Demo
if (import.meta.url.includes("assert.ts")) {
  console.log("✅ Assert - Assertion Testing for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Assertions ===");
  try {
    assert(true, 'This passes');
    console.log('✓ assert(true) passed');

    assert(1 === 1);
    console.log('✓ assert(1 === 1) passed');
  } catch (err) {
    console.log('✗ Failed:', (err as Error).message);
  }
  console.log();

  console.log("=== Example 2: Equality ===");
  try {
    equal(1, '1');
    console.log('✓ equal(1, "1") passed (loose)');

    strictEqual(1, 1);
    console.log('✓ strictEqual(1, 1) passed');
  } catch (err) {
    console.log('✗ Failed:', (err as Error).message);
  }
  console.log();

  console.log("=== Example 3: Deep Equality ===");
  try {
    deepStrictEqual({ a: 1, b: 2 }, { a: 1, b: 2 });
    console.log('✓ deepStrictEqual passed for objects');

    deepStrictEqual([1, 2, 3], [1, 2, 3]);
    console.log('✓ deepStrictEqual passed for arrays');
  } catch (err) {
    console.log('✗ Failed:', (err as Error).message);
  }
  console.log();

  console.log("=== Example 4: Throws Assertion ===");
  try {
    throws(() => {
      throw new Error('Expected error');
    });
    console.log('✓ throws() passed');

    throws(() => {
      throw new TypeError('Type error');
    }, TypeError);
    console.log('✓ throws() with type check passed');
  } catch (err) {
    console.log('✗ Failed:', (err as Error).message);
  }
  console.log();

  console.log("=== Example 5: Does Not Throw ===");
  try {
    doesNotThrow(() => {
      const x = 1 + 1;
    });
    console.log('✓ doesNotThrow() passed');
  } catch (err) {
    console.log('✗ Failed:', (err as Error).message);
  }
  console.log();

  console.log("=== Example 6: Match Regex ===");
  try {
    match('hello world', /world/);
    console.log('✓ match() passed');

    doesNotMatch('hello world', /goodbye/);
    console.log('✓ doesNotMatch() passed');
  } catch (err) {
    console.log('✗ Failed:', (err as Error).message);
  }
  console.log();

  console.log("=== Example 7: Async Assertions ===");
  (async () => {
    try {
      await rejects(async () => {
        throw new Error('Async error');
      });
      console.log('✓ rejects() passed');

      await doesNotReject(async () => {
        return 42;
      });
      console.log('✓ doesNotReject() passed');
    } catch (err) {
      console.log('✗ Failed:', (err as Error).message);
    }
    console.log();

    console.log("=== Example 8: Failure Example ===");
    try {
      strictEqual(1, 2, 'Numbers should be equal');
    } catch (err) {
      console.log('✗ Expected failure:', (err as Error).message);
    }
    console.log();

    console.log("=== Example 9: Strict Mode ===");
    try {
      strict.equal(1, 1);
      console.log('✓ strict.equal() passed');
    } catch (err) {
      console.log('✗ Failed:', (err as Error).message);
    }
    console.log();

    console.log("=== Example 10: Real-World Testing ===");
    function validateUser(user: any) {
      assert(user, 'User is required');
      assert(user.name, 'User name is required');
      assert(user.email, 'User email is required');
      match(user.email, /@/, 'Email must contain @');
    }

    try {
      validateUser({ name: 'John', email: 'john@example.com' });
      console.log('✓ User validation passed');
    } catch (err) {
      console.log('✗ Validation failed:', (err as Error).message);
    }
    console.log();

    console.log("=== POLYGLOT Use Case ===");
    console.log("🌐 Assert module works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
    console.log();
    console.log("Benefits:");
    console.log("  ✓ One testing API for all languages");
    console.log("  ✓ Consistent assertions");
    console.log("  ✓ Share test utilities");
    console.log("  ✓ Cross-language test suites");
  })();
}
