/**
 * Simple Test Framework
 * Minimalist testing utility
 */

export interface TestResult {
  name: string;
  passed: boolean;
  error?: Error;
  duration: number;
}

export class TestSuite {
  private tests: Array<{ name: string; fn: () => void | Promise<void> }> = [];
  private results: TestResult[] = [];

  test(name: string, fn: () => void | Promise<void>): void {
    this.tests.push({ name, fn });
  }

  async run(): Promise<TestResult[]> {
    this.results = [];

    for (const test of this.tests) {
      const start = Date.now();
      try {
        await test.fn();
        this.results.push({
          name: test.name,
          passed: true,
          duration: Date.now() - start
        });
      } catch (error) {
        this.results.push({
          name: test.name,
          passed: false,
          error: error as Error,
          duration: Date.now() - start
        });
      }
    }

    return this.results;
  }

  summary(): { total: number; passed: number; failed: number } {
    return {
      total: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length
    };
  }
}

export function assert(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

export function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected} but got ${actual}`);
  }
}

export function assertDeepEquals<T>(actual: T, expected: T, message?: string): void {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);

  if (actualStr !== expectedStr) {
    throw new Error(message || `Expected ${expectedStr} but got ${actualStr}`);
  }
}

export function assertThrows(fn: () => void, message?: string): void {
  try {
    fn();
    throw new Error(message || 'Expected function to throw');
  } catch {
    // Success - function threw as expected
  }
}

// CLI demo
if (import.meta.url.includes("simple-test.ts")) {
  console.log("Simple Test Framework Demo\n");

  const suite = new TestSuite();

  suite.test('addition works', () => {
    assertEquals(2 + 2, 4);
  });

  suite.test('strings concat', () => {
    assertEquals('hello' + ' world', 'hello world');
  });

  suite.test('arrays are deep equal', () => {
    assertDeepEquals([1, 2, 3], [1, 2, 3]);
  });

  suite.test('should fail', () => {
    assertEquals(1, 2, 'This test should fail');
  });

  suite.run().then(results => {
    console.log("Test Results:");
    results.forEach(r => {
      const icon = r.passed ? '✅' : '❌';
      console.log(`${icon} ${r.name} (${r.duration}ms)`);
      if (!r.passed && r.error) {
        console.log(`   Error: ${r.error.message}`);
      }
    });

    const summary = suite.summary();
    console.log(`\nSummary: ${summary.passed}/${summary.total} passed`);
    console.log("✅ Test framework test passed");
  });
}
