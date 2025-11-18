/**
 * tape - TAP-Producing Test Harness
 *
 * Tap-producing test harness for node and browsers.
 * **POLYGLOT SHOWCASE**: One TAP test framework for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/tape (~500K+ downloads/week)
 *
 * Features:
 * - TAP (Test Anything Protocol) output
 * - No global state
 * - Works in Node and browsers
 * - Simple API
 * - No configuration needed
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - TAP testing from Python, Ruby, Java
 * - ONE test harness works everywhere on Elide
 * - Language-agnostic test output
 * - Universal test format
 *
 * Use cases:
 * - CI/CD testing
 * - TAP consumers
 * - Simple unit tests
 * - Library testing
 *
 * Package has ~500K+ downloads/week on npm!
 */

interface AssertFunction {
  (value: any, message?: string): void;
  equal(actual: any, expected: any, message?: string): void;
  deepEqual(actual: any, expected: any, message?: string): void;
  ok(value: any, message?: string): void;
  notOk(value: any, message?: string): void;
  throws(fn: () => void, message?: string): void;
  end(): void;
}

let testCount = 0;
let assertCount = 0;

export default function test(name: string, cb: (t: AssertFunction) => void | Promise<void>) {
  testCount++;
  console.log(`# ${name}`);

  const t: AssertFunction = Object.assign(
    (value: any, message?: string) => {
      assertCount++;
      if (value) {
        console.log(`ok ${assertCount} ${message || ''}`);
      } else {
        console.log(`not ok ${assertCount} ${message || ''}`);
      }
    },
    {
      equal(actual: any, expected: any, message?: string) {
        assertCount++;
        if (actual === expected) {
          console.log(`ok ${assertCount} ${message || `${actual} === ${expected}`}`);
        } else {
          console.log(`not ok ${assertCount} ${message || `${actual} !== ${expected}`}`);
        }
      },
      deepEqual(actual: any, expected: any, message?: string) {
        assertCount++;
        if (JSON.stringify(actual) === JSON.stringify(expected)) {
          console.log(`ok ${assertCount} ${message || 'deep equal'}`);
        } else {
          console.log(`not ok ${assertCount} ${message || 'not deep equal'}`);
        }
      },
      ok(value: any, message?: string) {
        assertCount++;
        if (value) {
          console.log(`ok ${assertCount} ${message || 'should be truthy'}`);
        } else {
          console.log(`not ok ${assertCount} ${message || 'should be truthy'}`);
        }
      },
      notOk(value: any, message?: string) {
        assertCount++;
        if (!value) {
          console.log(`ok ${assertCount} ${message || 'should be falsy'}`);
        } else {
          console.log(`not ok ${assertCount} ${message || 'should be falsy'}`);
        }
      },
      throws(fn: () => void, message?: string) {
        assertCount++;
        try {
          fn();
          console.log(`not ok ${assertCount} ${message || 'should throw'}`);
        } catch (e) {
          console.log(`ok ${assertCount} ${message || 'should throw'}`);
        }
      },
      end() {
        console.log('');
      }
    }
  );

  const result = cb(t);
  if (result instanceof Promise) {
    result.then(() => t.end()).catch(() => t.end());
  } else {
    t.end();
  }
}

export { test };

if (import.meta.url.includes("elide-tape.ts")) {
  console.log("TAP version 13");
  console.log("🧪 tape - TAP Test Harness for Elide (POLYGLOT!)\n");

  test('basic assertions', (t) => {
    t.ok(true, 'true is truthy');
    t.equal(1 + 1, 2, 'addition works');
    t.deepEqual([1, 2], [1, 2], 'arrays are equal');
    t.end();
  });

  test('math operations', (t) => {
    t.equal(5 - 3, 2, 'subtraction works');
    t.equal(2 * 3, 6, 'multiplication works');
    t.end();
  });

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 TAP output works with all test consumers!");
  console.log("  ✓ Language-agnostic");
  console.log("  ✓ ~500K+ downloads/week on npm!");
}
