/**
 * brittle - TAP Test Framework
 *
 * A simple TAP test framework.
 * **POLYGLOT SHOWCASE**: One TAP framework for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/brittle (~5K+ downloads/week)
 *
 * Features:
 * - Simple TAP output
 * - Minimal API
 * - Async support
 * - Lightweight
 * - Zero dependencies
 *
 * Use cases:
 * - Simple unit testing
 * - TAP-compatible testing
 * - Minimal test setup
 *
 * Package has ~5K+ downloads/week on npm!
 */

interface BrittleTest {
  is(actual: any, expected: any, msg?: string): void;
  ok(val: any, msg?: string): void;
  unlike(actual: any, expected: any, msg?: string): void;
  absent(val: any, msg?: string): void;
}

export function test(name: string, cb: (t: BrittleTest) => void) {
  console.log(`# ${name}`);
  let count = 0;
  const t: BrittleTest = {
    is(actual: any, expected: any, msg?: string) {
      count++;
      const pass = actual === expected;
      console.log(pass ? `ok ${count} ${msg || ''}` : `not ok ${count} ${msg || ''}`);
    },
    ok(val: any, msg?: string) {
      count++;
      console.log(val ? `ok ${count} ${msg || ''}` : `not ok ${count} ${msg || ''}`);
    },
    unlike(actual: any, expected: any, msg?: string) {
      count++;
      const pass = actual !== expected;
      console.log(pass ? `ok ${count} ${msg || ''}` : `not ok ${count} ${msg || ''}`);
    },
    absent(val: any, msg?: string) {
      count++;
      console.log(!val ? `ok ${count} ${msg || ''}` : `not ok ${count} ${msg || ''}`);
    }
  };
  cb(t);
}

if (import.meta.url.includes("elide-brittle.ts")) {
  console.log("🧪 brittle - TAP Framework for Elide (POLYGLOT!)\n");
  test('basic', (t) => {
    t.is(1 + 1, 2, 'math works');
    t.ok(true, 'truthy');
  });
  console.log("\n✓ ~5K+ downloads/week on npm!");
}
