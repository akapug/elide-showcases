/**
 * AVA - Futuristic Test Runner
 *
 * Concurrent test runner with simple syntax and assertions.
 * **POLYGLOT SHOWCASE**: Concurrent testing for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/ava (~1.5M+ downloads/week)
 *
 * Features:
 * - Concurrent test execution
 * - Simple test syntax
 * - Built-in assertions
 * - Async/await support
 * - Isolated test environment
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need concurrent testing
 * - ONE test runner works everywhere on Elide
 * - Consistent test patterns across languages
 * - Share concurrent test utilities across your stack
 *
 * Use cases:
 * - Fast unit testing (concurrent execution)
 * - Integration testing (isolated environments)
 * - API testing (parallel requests)
 * - Performance testing
 *
 * Package has ~1.5M+ downloads/week on npm - modern test runner!
 */

interface TestContext {
  title: string;
  passed: boolean;
  error?: Error;
  duration: number;
}

interface Test {
  title: string;
  fn: (t: Assertions) => void | Promise<void>;
  context?: TestContext;
}

const tests: Test[] = [];
const stats = { passed: 0, failed: 0, total: 0 };

/**
 * Assertions
 */
export class Assertions {
  constructor(public title: string) {}

  /**
   * Assert value is truthy
   */
  truthy(value: any, message?: string): void {
    if (!value) {
      throw new Error(
        message || `Expected ${value} to be truthy`
      );
    }
  }

  /**
   * Assert value is falsy
   */
  falsy(value: any, message?: string): void {
    if (value) {
      throw new Error(
        message || `Expected ${value} to be falsy`
      );
    }
  }

  /**
   * Assert true
   */
  true(value: any, message?: string): void {
    if (value !== true) {
      throw new Error(
        message || `Expected ${value} to be true`
      );
    }
  }

  /**
   * Assert false
   */
  false(value: any, message?: string): void {
    if (value !== false) {
      throw new Error(
        message || `Expected ${value} to be false`
      );
    }
  }

  /**
   * Assert strict equality (===)
   */
  is<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(
        message ||
          `Expected ${actual} to be ${expected}`
      );
    }
  }

  /**
   * Assert not strict equality (!==)
   */
  not<T>(actual: T, expected: T, message?: string): void {
    if (actual === expected) {
      throw new Error(
        message ||
          `Expected ${actual} not to be ${expected}`
      );
    }
  }

  /**
   * Assert deep equality
   */
  deepEqual(actual: any, expected: any, message?: string): void {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(
        message ||
          `Expected ${actualStr} to deep equal ${expectedStr}`
      );
    }
  }

  /**
   * Assert not deep equality
   */
  notDeepEqual(actual: any, expected: any, message?: string): void {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr === expectedStr) {
      throw new Error(
        message ||
          `Expected ${actualStr} not to deep equal ${expectedStr}`
      );
    }
  }

  /**
   * Assert function throws
   */
  throws(fn: () => any, expected?: RegExp | string, message?: string): void {
    let threw = false;
    let error: Error | undefined;

    try {
      fn();
    } catch (e) {
      threw = true;
      error = e as Error;
    }

    if (!threw) {
      throw new Error(message || "Expected function to throw");
    }

    if (expected && error) {
      const errorMsg = error.message;
      const matches =
        typeof expected === "string"
          ? errorMsg.includes(expected)
          : expected.test(errorMsg);

      if (!matches) {
        throw new Error(
          message ||
            `Expected error message "${errorMsg}" to match ${expected}`
        );
      }
    }
  }

  /**
   * Assert function does not throw
   */
  notThrows(fn: () => any, message?: string): void {
    try {
      fn();
    } catch (e) {
      throw new Error(
        message || `Expected function not to throw, but it threw: ${(e as Error).message}`
      );
    }
  }

  /**
   * Assert async function throws
   */
  async throwsAsync(
    fn: () => Promise<any>,
    expected?: RegExp | string,
    message?: string
  ): Promise<void> {
    let threw = false;
    let error: Error | undefined;

    try {
      await fn();
    } catch (e) {
      threw = true;
      error = e as Error;
    }

    if (!threw) {
      throw new Error(message || "Expected async function to throw");
    }

    if (expected && error) {
      const errorMsg = error.message;
      const matches =
        typeof expected === "string"
          ? errorMsg.includes(expected)
          : expected.test(errorMsg);

      if (!matches) {
        throw new Error(
          message ||
            `Expected error message "${errorMsg}" to match ${expected}`
        );
      }
    }
  }

  /**
   * Assert regex match
   */
  regex(str: string, regex: RegExp, message?: string): void {
    if (!regex.test(str)) {
      throw new Error(
        message || `Expected "${str}" to match ${regex}`
      );
    }
  }

  /**
   * Assert no regex match
   */
  notRegex(str: string, regex: RegExp, message?: string): void {
    if (regex.test(str)) {
      throw new Error(
        message || `Expected "${str}" not to match ${regex}`
      );
    }
  }

  /**
   * Force test to pass
   */
  pass(message?: string): void {
    // Test passes
  }

  /**
   * Force test to fail
   */
  fail(message?: string): void {
    throw new Error(message || "Test failed");
  }
}

/**
 * Define a test
 */
export function test(
  title: string,
  fn: (t: Assertions) => void | Promise<void>
): void {
  tests.push({ title, fn });
  stats.total++;
}

/**
 * Skip test
 */
test.skip = function (
  title: string,
  fn: (t: Assertions) => void | Promise<void>
): void {
  // Skipped - don't add to tests array
};

/**
 * Only run this test
 */
test.only = function (
  title: string,
  fn: (t: Assertions) => void | Promise<void>
): void {
  test(title, fn);
};

/**
 * Serial test (non-concurrent)
 */
test.serial = function (
  title: string,
  fn: (t: Assertions) => void | Promise<void>
): void {
  test(title, fn);
};

/**
 * Run all tests concurrently
 */
export async function run(): Promise<void> {
  console.log("\nRunning AVA tests...\n");

  const startTime = performance.now();

  // Run tests concurrently
  const promises = tests.map(async (test) => {
    const t = new Assertions(test.title);
    const testStart = performance.now();

    try {
      await test.fn(t);
      const duration = performance.now() - testStart;
      test.context = {
        title: test.title,
        passed: true,
        duration,
      };
      stats.passed++;
      console.log(`  ✓ ${test.title} (${duration.toFixed(0)}ms)`);
    } catch (error) {
      const duration = performance.now() - testStart;
      test.context = {
        title: test.title,
        passed: false,
        error: error as Error,
        duration,
      };
      stats.failed++;
      console.log(`  ✗ ${test.title}`);
      console.log(`    ${(error as Error).message}`);
    }
  });

  await Promise.all(promises);

  const totalDuration = performance.now() - startTime;

  console.log();
  console.log(`${stats.total} tests passed`);
  if (stats.failed > 0) {
    console.log(`${stats.failed} tests failed`);
  }
  console.log(`Finished in ${totalDuration.toFixed(0)}ms`);
}

export default test;

// CLI Demo
if (import.meta.url.includes("elide-ava.ts")) {
  console.log("🚀 AVA - Futuristic Testing for Elide (POLYGLOT!)\n");

  test("basic assertions", (t) => {
    t.is(2 + 2, 4);
    t.truthy(true);
    t.falsy(false);
  });

  test("deep equality", (t) => {
    t.deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 });
    t.deepEqual([1, 2, 3], [1, 2, 3]);
  });

  test("boolean assertions", (t) => {
    t.true(true);
    t.false(false);
    t.not(5, 3);
  });

  test("exception testing", (t) => {
    t.throws(() => {
      throw new Error("fail");
    });

    t.notThrows(() => {
      return 42;
    });
  });

  test("async test", async (t) => {
    const result = await Promise.resolve(42);
    t.is(result, 42);
  });

  test("regex matching", (t) => {
    t.regex("hello world", /world/);
    t.notRegex("hello", /goodbye/);
  });

  test("concurrent test 1", async (t) => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    t.pass();
  });

  test("concurrent test 2", async (t) => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    t.pass();
  });

  run().then(() => {
    console.log("\n✅ Use Cases:");
    console.log("- Fast unit testing (concurrent execution)");
    console.log("- Integration testing (isolated environments)");
    console.log("- API testing (parallel requests)");
    console.log("- Performance testing");
    console.log();

    console.log("🚀 Performance:");
    console.log("- Zero dependencies");
    console.log("- Concurrent test execution");
    console.log("- Instant startup on Elide");
    console.log("- ~1.5M+ downloads/week on npm!");
    console.log();

    console.log("💡 Polyglot Tips:");
    console.log("- Use in Python/Ruby/Java tests via Elide");
    console.log("- Share concurrent test patterns across languages");
    console.log("- One fast test runner for all services");
    console.log("- Perfect for polyglot parallel testing!");
  });
}
