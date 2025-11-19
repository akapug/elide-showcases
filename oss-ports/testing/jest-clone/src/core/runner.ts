/**
 * Jest Clone - Test Runner
 * Core test execution engine with parallel execution support
 */

import type {
  Config,
  TestResult,
  AssertionResult,
  TestSuite,
  Test,
  AggregatedResult,
  Reporter
} from '../types';

export class TestRunner {
  private config: Config;
  private reporters: Reporter[] = [];
  private currentSuite: TestSuite | null = null;
  private suiteStack: TestSuite[] = [];
  private hasOnly = false;

  constructor(config: Config) {
    this.config = config;
  }

  addReporter(reporter: Reporter): void {
    this.reporters.push(reporter);
  }

  async runTests(testFiles: string[]): Promise<AggregatedResult> {
    const startTime = Date.now();

    await this.notifyReporters('onRunStart', this.config);

    const testResults: TestResult[] = [];
    const maxWorkers = this.config.maxWorkers || 4;

    // Run tests in parallel batches
    for (let i = 0; i < testFiles.length; i += maxWorkers) {
      const batch = testFiles.slice(i, i + maxWorkers);
      const batchResults = await Promise.all(
        batch.map(file => this.runTestFile(file))
      );
      testResults.push(...batchResults);
    }

    const aggregated = this.aggregateResults(testResults, startTime);
    await this.notifyReporters('onRunComplete', aggregated);

    return aggregated;
  }

  private async runTestFile(filePath: string): Promise<TestResult> {
    const perfStats = {
      start: Date.now(),
      end: 0,
      runtime: 0
    };

    try {
      // Reset state for new file
      this.currentSuite = this.createRootSuite();
      this.suiteStack = [this.currentSuite];
      this.hasOnly = false;

      // Load and execute test file
      await this.loadTestFile(filePath);

      // Check if any tests have .only
      this.hasOnly = this.checkForOnly(this.currentSuite);

      // Run all tests in the suite
      const testResults = await this.runSuite(this.currentSuite);

      perfStats.end = Date.now();
      perfStats.runtime = perfStats.end - perfStats.start;

      const result: TestResult = {
        testFilePath: filePath,
        testResults,
        numPassingTests: testResults.filter(t => t.status === 'passed').length,
        numFailingTests: testResults.filter(t => t.status === 'failed').length,
        numPendingTests: testResults.filter(t => t.status === 'pending').length,
        numTodoTests: testResults.filter(t => t.status === 'todo').length,
        perfStats
      };

      await this.notifyReporters('onTestResult', result);
      return result;
    } catch (error) {
      perfStats.end = Date.now();
      perfStats.runtime = perfStats.end - perfStats.start;

      return {
        testFilePath: filePath,
        testResults: [],
        numPassingTests: 0,
        numFailingTests: 1,
        numPendingTests: 0,
        numTodoTests: 0,
        perfStats,
        failureMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private createRootSuite(): TestSuite {
    return {
      name: 'ROOT',
      tests: [],
      suites: [],
      beforeAll: [],
      beforeEach: [],
      afterAll: [],
      afterEach: []
    };
  }

  private async loadTestFile(filePath: string): Promise<void> {
    // In a real implementation, this would dynamically import the test file
    // For now, we simulate the test file execution
    await import(filePath);
  }

  private checkForOnly(suite: TestSuite): boolean {
    const hasOnlyTest = suite.tests.some(t => t.mode === 'only');
    const hasOnlySuite = suite.suites.some(s => this.checkForOnly(s));
    return hasOnlyTest || hasOnlySuite;
  }

  private async runSuite(
    suite: TestSuite,
    ancestorTitles: string[] = []
  ): Promise<AssertionResult[]> {
    const results: AssertionResult[] = [];

    // Run beforeAll hooks
    for (const hook of suite.beforeAll) {
      await this.runHook(hook);
    }

    // Run tests
    for (const test of suite.tests) {
      // Skip tests if .only is present and this isn't an only test
      if (this.hasOnly && test.mode !== 'only') {
        continue;
      }

      // Skip tests marked as skip
      if (test.mode === 'skip') {
        results.push(this.createSkippedResult(test, ancestorTitles));
        continue;
      }

      // Todo tests
      if (test.mode === 'todo') {
        results.push(this.createTodoResult(test, ancestorTitles));
        continue;
      }

      const result = await this.runTest(test, suite, ancestorTitles);
      results.push(result);
    }

    // Run nested suites
    for (const childSuite of suite.suites) {
      const childResults = await this.runSuite(
        childSuite,
        [...ancestorTitles, childSuite.name]
      );
      results.push(...childResults);
    }

    // Run afterAll hooks
    for (const hook of suite.afterAll) {
      await this.runHook(hook);
    }

    return results;
  }

  private async runTest(
    test: Test,
    suite: TestSuite,
    ancestorTitles: string[]
  ): Promise<AssertionResult> {
    const start = Date.now();
    const result: AssertionResult = {
      ancestorTitles,
      fullName: [...ancestorTitles, test.name].join(' '),
      title: test.name,
      status: 'passed',
      duration: 0,
      failureMessages: []
    };

    try {
      // Run beforeEach hooks
      for (const hook of this.collectBeforeEach(suite)) {
        await this.runHook(hook);
      }

      // Run the test with timeout
      const timeout = test.timeout || this.config.testTimeout || 5000;
      await this.runWithTimeout(test.fn, timeout);

      result.status = 'passed';
    } catch (error) {
      result.status = 'failed';
      result.failureMessages.push(
        error instanceof Error ? error.stack || error.message : String(error)
      );
    } finally {
      // Run afterEach hooks
      for (const hook of this.collectAfterEach(suite)) {
        try {
          await this.runHook(hook);
        } catch (error) {
          // Log but don't fail the test
          console.error('afterEach hook failed:', error);
        }
      }

      result.duration = Date.now() - start;
    }

    return result;
  }

  private collectBeforeEach(suite: TestSuite): Array<() => void | Promise<void>> {
    const hooks: Array<() => void | Promise<void>> = [];
    let current: TestSuite | null = suite;

    while (current) {
      hooks.unshift(...current.beforeEach);
      current = this.findParentSuite(current);
    }

    return hooks;
  }

  private collectAfterEach(suite: TestSuite): Array<() => void | Promise<void>> {
    const hooks: Array<() => void | Promise<void>> = [];
    let current: TestSuite | null = suite;

    while (current) {
      hooks.push(...current.afterEach);
      current = this.findParentSuite(current);
    }

    return hooks;
  }

  private findParentSuite(suite: TestSuite): TestSuite | null {
    // In a real implementation, we'd maintain a proper parent reference
    return null;
  }

  private async runHook(hook: () => void | Promise<void>): Promise<void> {
    await hook();
  }

  private async runWithTimeout(
    fn: () => void | Promise<void>,
    timeout: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test timeout of ${timeout}ms exceeded`));
      }, timeout);

      Promise.resolve(fn())
        .then(() => {
          clearTimeout(timer);
          resolve();
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private createSkippedResult(
    test: Test,
    ancestorTitles: string[]
  ): AssertionResult {
    return {
      ancestorTitles,
      fullName: [...ancestorTitles, test.name].join(' '),
      title: test.name,
      status: 'pending',
      duration: 0,
      failureMessages: []
    };
  }

  private createTodoResult(
    test: Test,
    ancestorTitles: string[]
  ): AssertionResult {
    return {
      ancestorTitles,
      fullName: [...ancestorTitles, test.name].join(' '),
      title: test.name,
      status: 'todo',
      duration: 0,
      failureMessages: []
    };
  }

  private aggregateResults(
    testResults: TestResult[],
    startTime: number
  ): AggregatedResult {
    const aggregated: AggregatedResult = {
      numTotalTests: 0,
      numPassedTests: 0,
      numFailedTests: 0,
      numPendingTests: 0,
      numTodoTests: 0,
      startTime,
      endTime: Date.now(),
      success: true,
      testResults
    };

    for (const result of testResults) {
      aggregated.numTotalTests += result.testResults.length;
      aggregated.numPassedTests += result.numPassingTests;
      aggregated.numFailedTests += result.numFailingTests;
      aggregated.numPendingTests += result.numPendingTests;
      aggregated.numTodoTests += result.numTodoTests;
    }

    aggregated.success = aggregated.numFailedTests === 0;

    return aggregated;
  }

  private async notifyReporters(
    method: keyof Reporter,
    ...args: any[]
  ): Promise<void> {
    await Promise.all(
      this.reporters.map(reporter => {
        const fn = reporter[method];
        if (typeof fn === 'function') {
          return fn.apply(reporter, args);
        }
      })
    );
  }

  // Global test registration methods
  describe(name: string, fn: () => void): void {
    const suite: TestSuite = {
      name,
      tests: [],
      suites: [],
      beforeAll: [],
      beforeEach: [],
      afterAll: [],
      afterEach: []
    };

    const parent = this.suiteStack[this.suiteStack.length - 1];
    if (parent) {
      parent.suites.push(suite);
    }

    this.suiteStack.push(suite);
    fn();
    this.suiteStack.pop();
  }

  it(name: string, fn: () => void | Promise<void>, timeout?: number): void {
    const test: Test = {
      name,
      fn,
      timeout
    };

    const suite = this.suiteStack[this.suiteStack.length - 1];
    if (suite) {
      suite.tests.push(test);
    }
  }

  beforeAll(fn: () => void | Promise<void>): void {
    const suite = this.suiteStack[this.suiteStack.length - 1];
    if (suite) {
      suite.beforeAll.push(fn);
    }
  }

  beforeEach(fn: () => void | Promise<void>): void {
    const suite = this.suiteStack[this.suiteStack.length - 1];
    if (suite) {
      suite.beforeEach.push(fn);
    }
  }

  afterAll(fn: () => void | Promise<void>): void {
    const suite = this.suiteStack[this.suiteStack.length - 1];
    if (suite) {
      suite.afterAll.push(fn);
    }
  }

  afterEach(fn: () => void | Promise<void>): void {
    const suite = this.suiteStack[this.suiteStack.length - 1];
    if (suite) {
      suite.afterEach.push(fn);
    }
  }
}
