/**
 * Example: Using the Elide Test Runner
 */

import ElideTestRunner from '../testing/src/test-runner';

async function main() {
  // Create test runner
  const runner = new ElideTestRunner({
    parallel: true,
    coverage: true,
    verbose: true,
    timeout: 5000
  });

  // Example: Basic tests
  runner.describe('Math Operations', () => {
    runner.test('addition works', () => {
      const result = 2 + 2;
      runner.expect(result).toBe(4);
    });

    runner.test('subtraction works', () => {
      const result = 10 - 5;
      runner.expect(result).toBe(5);
    });

    runner.test('multiplication works', () => {
      const result = 3 * 4;
      runner.expect(result).toBe(12);
    });
  });

  // Example: Async tests
  runner.describe('Async Operations', () => {
    runner.test('promises resolve', async () => {
      const result = await Promise.resolve(42);
      runner.expect(result).toBe(42);
    });

    runner.test('async/await works', async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      await delay(100);
      runner.expect(true).toBeTruthy();
    });

    runner.test('promises can reject', async () => {
      const promise = Promise.reject(new Error('Expected error'));
      await runner.expect(promise).rejects('Expected error');
    });
  });

  // Example: Lifecycle hooks
  runner.describe('Lifecycle Hooks', () => {
    let setupValue: number;

    runner.beforeAll(() => {
      console.log('[beforeAll] Suite setup');
      setupValue = 0;
    });

    runner.beforeEach(() => {
      console.log('[beforeEach] Test setup');
      setupValue++;
    });

    runner.afterEach(() => {
      console.log('[afterEach] Test cleanup');
    });

    runner.afterAll(() => {
      console.log('[afterAll] Suite cleanup');
    });

    runner.test('first test', () => {
      runner.expect(setupValue).toBe(1);
    });

    runner.test('second test', () => {
      runner.expect(setupValue).toBe(2);
    });
  });

  // Example: Mocking
  runner.describe('Mocking', () => {
    runner.test('mock functions track calls', () => {
      const mockFn = runner.fn((x: number) => x * 2);

      mockFn(5);
      mockFn(10);

      runner.expect(mockFn.mock.calls.length).toBe(2);
      runner.expect(mockFn.mock.calls[0]).toEqual([5]);
      runner.expect(mockFn.mock.calls[1]).toEqual([10]);
    });

    runner.test('mock return values', () => {
      const mockFn = runner.fn();
      mockFn.mockReturnValue(42);

      const result = mockFn();
      runner.expect(result).toBe(42);
    });

    runner.test('mock async values', async () => {
      const mockFn = runner.fn();
      mockFn.mockResolvedValue('async result');

      const result = await mockFn();
      runner.expect(result).toBe('async result');
    });
  });

  // Example: Array and object assertions
  runner.describe('Collections', () => {
    runner.test('array contains', () => {
      const arr = [1, 2, 3, 4, 5];
      runner.expect(arr).toContain(3);
    });

    runner.test('object equality', () => {
      const obj = { name: 'John', age: 30 };
      runner.expect(obj).toEqual({ name: 'John', age: 30 });
    });

    runner.test('string contains', () => {
      const str = 'Hello, World!';
      runner.expect(str).toContain('World');
    });
  });

  // Example: Skip and only
  runner.describe('Test Selection', () => {
    runner.skip('this test is skipped', () => {
      // Won't run
      runner.expect(false).toBeTruthy();
    });

    runner.test('this test runs', () => {
      runner.expect(true).toBeTruthy();
    });
  });

  // Listen for events
  runner.on('runStart', () => {
    console.log('\n[Test Run] Started\n');
  });

  runner.on('suiteStart', (suite) => {
    console.log(`\n[Suite] ${suite.name}`);
  });

  runner.on('testComplete', (test) => {
    const icon = test.status === 'passed' ? '✓' : '✗';
    console.log(`  ${icon} ${test.name} (${test.duration}ms)`);
  });

  runner.on('runComplete', (result) => {
    console.log('\n[Test Run] Complete');
    console.log(`Tests: ${result.passedTests} passed, ${result.failedTests} failed`);
    console.log(`Duration: ${result.duration}ms`);
  });

  // Run tests
  const result = await runner.run();

  // Display results
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Tests:   ${result.totalTests}`);
  console.log(`Passed:        ${result.passedTests}`);
  console.log(`Failed:        ${result.failedTests}`);
  console.log(`Skipped:       ${result.skippedTests}`);
  console.log(`Duration:      ${result.duration}ms`);

  if (result.coverage) {
    console.log('\nCOVERAGE:');
    console.log(`Lines:      ${result.coverage.lines.percentage}%`);
    console.log(`Functions:  ${result.coverage.functions.percentage}%`);
    console.log(`Branches:   ${result.coverage.branches.percentage}%`);
    console.log(`Statements: ${result.coverage.statements.percentage}%`);
  }

  console.log('='.repeat(60) + '\n');

  process.exit(result.failedTests > 0 ? 1 : 0);
}

main().catch(console.error);
