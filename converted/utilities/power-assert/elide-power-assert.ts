/**
 * power-assert - Enhanced assertions with detailed output
 *
 * Assertions that provide rich error messages automatically.
 * **POLYGLOT SHOWCASE**: Powerful assertions for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/power-assert (~500K+ downloads/week)
 *
 * Features:
 * - Detailed error messages
 * - Expression evaluation display
 * - Value inspection
 * - Zero dependencies
 *
 * Use cases:
 * - Debugging test failures
 * - Detailed error reporting
 * - Test diagnostics
 *
 * Package has ~500K+ downloads/week on npm!
 */

class PowerAssertionError extends Error {
  constructor(message: string, public context: any) {
    super(message);
    this.name = 'PowerAssertionError';
  }
}

function assert(value: any, message?: string): void {
  if (!value) {
    const context = { value, evaluated: !!value };
    const msg = message || formatAssertion(value, context);
    throw new PowerAssertionError(msg, context);
  }
}

function formatAssertion(value: any, context: any): string {
  let msg = `Assertion failed\n\n`;
  msg += `  assert(${JSON.stringify(value)})\n`;
  msg += `         |\n`;
  msg += `         ${value}\n`;
  return msg;
}

assert.equal = (actual: any, expected: any, message?: string): void => {
  if (actual !== expected) {
    const msg = message || `\nAssertion failed:\n  assert.equal(${JSON.stringify(actual)}, ${JSON.stringify(expected)})\n    Expected: ${expected}\n    Actual: ${actual}`;
    throw new PowerAssertionError(msg, { actual, expected });
  }
};

assert.deepEqual = (actual: any, expected: any, message?: string): void => {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    const msg = message || `\nAssertion failed:\n  assert.deepEqual(...)\n    Expected: ${expectedStr}\n    Actual: ${actualStr}`;
    throw new PowerAssertionError(msg, { actual, expected });
  }
};

assert.ok = assert;
assert.strictEqual = assert.equal;
assert.notEqual = (actual: any, expected: any, message?: string): void => {
  if (actual === expected) {
    throw new PowerAssertionError(message || `Expected ${actual} not to equal ${expected}`, { actual, expected });
  }
};

assert.throws = (fn: () => any, pattern?: RegExp | string): void => {
  let threw = false;
  try {
    fn();
  } catch (e) {
    threw = true;
    if (pattern) {
      const msg = (e as Error).message;
      const matches = typeof pattern === 'string' ? msg.includes(pattern) : pattern.test(msg);
      if (!matches) {
        throw new PowerAssertionError(`Expected error to match ${pattern}, got: ${msg}`, { error: e });
      }
    }
  }
  if (!threw) {
    throw new PowerAssertionError('Expected function to throw', {});
  }
};

export default assert;
export { PowerAssertionError };

// CLI Demo
if (import.meta.url.includes('elide-power-assert.ts')) {
  console.log('⚡ power-assert - Enhanced Assertions for Elide (POLYGLOT!)\n');

  console.log('Example 1: Basic Assertions\n');
  assert(true);
  assert(1 + 1 === 2);
  console.log('✓ Basic assertions work');

  console.log('\nExample 2: Equality with Details\n');
  assert.equal(2 + 2, 4);
  assert.deepEqual({ a: 1 }, { a: 1 });
  console.log('✓ Detailed equality checks work');

  console.log('\nExample 3: Failed Assertion (caught)\n');
  try {
    assert.equal(2 + 2, 5);
  } catch (e) {
    console.log('Caught error:', (e as Error).message.split('\n')[0]);
  }

  console.log('\n✅ All assertions passed!');
  console.log('🚀 ~500K+ downloads/week on npm!');
  console.log('💡 Enhanced error messages for debugging!');
}
