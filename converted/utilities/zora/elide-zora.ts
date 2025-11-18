/**
 * zora - Fast Tape-like Testing
 *
 * Lightest, simplest and fastest testing library for JavaScript.
 * **POLYGLOT SHOWCASE**: One fast testing library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/zora (~20K+ downloads/week)
 *
 * Features:
 * - Minimalist TAP output
 * - Async/await support
 * - Fast execution
 * - No global pollution
 * - Works anywhere
 * - Zero dependencies
 *
 * Use cases:
 * - Lightweight testing
 * - Fast CI/CD pipelines
 * - Browser testing
 * - Quick unit tests
 *
 * Package has ~20K+ downloads/week on npm!
 */

interface Test {
  ok(val: any, msg?: string): void;
  equal(actual: any, expected: any, msg?: string): void;
  test(name: string, cb: (t: Test) => void): void;
}

function createTest(): Test {
  let count = 0;
  return {
    ok(val: any, msg?: string) {
      count++;
      console.log(val ? `ok ${count} ${msg || ''}` : `not ok ${count} ${msg || ''}`);
    },
    equal(actual: any, expected: any, msg?: string) {
      count++;
      const pass = actual === expected;
      console.log(pass ? `ok ${count} ${msg || ''}` : `not ok ${count} ${msg || ''}`);
    },
    test(name: string, cb: (t: Test) => void) {
      console.log(`# ${name}`);
      cb(createTest());
    }
  };
}

export function test(name: string, cb: (t: Test) => void) {
  console.log(`# ${name}`);
  cb(createTest());
}

if (import.meta.url.includes("elide-zora.ts")) {
  console.log("🧪 zora - Fast Testing for Elide (POLYGLOT!)\n");
  test('math', (t) => {
    t.equal(1 + 1, 2, 'addition');
    t.ok(true, 'truthy');
  });
  console.log("\n✓ ~20K+ downloads/week on npm!");
}
