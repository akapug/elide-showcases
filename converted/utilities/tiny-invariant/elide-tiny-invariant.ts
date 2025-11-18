/**
 * tiny-invariant - Tiny invariant function
 * Based on https://www.npmjs.com/package/tiny-invariant (~30M+ downloads/week)
 *
 * Features:
 * - Minimal size (< 200 bytes)
 * - TypeScript support
 * - Production optimized
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Smallest assertion library
 */

function invariant(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || 'Invariant failed');
  }
}

export default invariant;

// Self-test
if (import.meta.url.includes("elide-tiny-invariant.ts")) {
  console.log("✅ tiny-invariant - Tiny Assertions (POLYGLOT!)\n");

  // Valid assertions
  invariant(1 === 1, 'Math works');
  invariant('hello', 'Truthy string');
  console.log('✓ Valid assertions passed');

  // Test with data
  const config = { apiKey: 'abc123' };
  invariant(config.apiKey, 'API key required');
  console.log('✓ Config validated');

  // Test error
  try {
    invariant(false, 'Expected error');
  } catch (error) {
    console.log('✓ Caught error:', (error as Error).message);
  }

  console.log("\n🚀 ~30M+ downloads/week | Smallest assertion library\n");
}
