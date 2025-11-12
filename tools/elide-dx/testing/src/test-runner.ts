/**
 * Elide Test Runner
 * Fast, Jest-compatible test framework
 */

import { EventEmitter } from 'events';

export interface TestConfig {
  testMatch?: string[];
  testIgnore?: string[];
  parallel?: boolean;
  maxWorkers?: number;
  coverage?: boolean;
  coverageThreshold?: CoverageThreshold;
  watchMode?: boolean;
  verbose?: boolean;
  bail?: boolean;
  timeout?: number;
}

export interface CoverageThreshold {
  lines?: number;
  functions?: number;
  branches?: number;
  statements?: number;
}

export interface TestSuite {
  name: string;
  file: string;
  tests: Test[];
  hooks: TestHooks;
  coverage?: Coverage;
}

export interface Test {
  name: string;
  fn: () => void | Promise<void>;
  timeout?: number;
  skip?: boolean;
  only?: boolean;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: Error;
}

export interface TestHooks {
  beforeAll: (() => void | Promise<void>)[];
  afterAll: (() => void | Promise<void>)[];
  beforeEach: (() => void | Promise<void>)[];
  afterEach: (() => void | Promise<void>)[];
}

export interface TestResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage?: Coverage;
}

export interface Coverage {
  lines: CoverageData;
  functions: CoverageData;
  branches: CoverageData;
  statements: CoverageData;
}

export interface CoverageData {
  total: number;
  covered: number;
  percentage: number;
}

export interface Snapshot {
  name: string;
  value: any;
  file: string;
}

export interface MockFunction {
  (...args: any[]): any;
  mock: {
    calls: any[][];
    results: any[];
    instances: any[];
  };
  mockReturnValue: (value: any) => MockFunction;
  mockResolvedValue: (value: any) => MockFunction;
  mockRejectedValue: (value: any) => MockFunction;
  mockImplementation: (fn: (...args: any[]) => any) => MockFunction;
  mockClear: () => void;
  mockReset: () => void;
}

/**
 * Test Runner for Elide
 */
export class ElideTestRunner extends EventEmitter {
  private config: TestConfig;
  private suites: Map<string, TestSuite> = new Map();
  private currentSuite?: TestSuite;
  private snapshots: Map<string, Snapshot> = new Map();
  private mocks: Map<string, MockFunction> = new Map();
  private isRunning: boolean = false;

  constructor(config: TestConfig = {}) {
    super();
    this.config = {
      testMatch: ['**/*.test.ts', '**/*.spec.ts'],
      testIgnore: ['**/node_modules/**'],
      parallel: true,
      maxWorkers: 4,
      coverage: false,
      watchMode: false,
      verbose: false,
      bail: false,
      timeout: 5000,
      ...config
    };
  }

  /**
   * Describe a test suite
   */
  describe(name: string, fn: () => void): void {
    const suite: TestSuite = {
      name,
      file: '',
      tests: [],
      hooks: {
        beforeAll: [],
        afterAll: [],
        beforeEach: [],
        afterEach: []
      }
    };

    this.suites.set(name, suite);
    this.currentSuite = suite;

    // Execute suite definition
    fn();

    this.currentSuite = undefined;
  }

  /**
   * Define a test
   */
  test(name: string, fn: () => void | Promise<void>, timeout?: number): void {
    if (!this.currentSuite) {
      throw new Error('test() must be called inside describe()');
    }

    const test: Test = {
      name,
      fn,
      timeout: timeout || this.config.timeout,
      status: 'pending'
    };

    this.currentSuite.tests.push(test);
  }

  /**
   * Alias for test()
   */
  it(name: string, fn: () => void | Promise<void>, timeout?: number): void {
    this.test(name, fn, timeout);
  }

  /**
   * Skip a test
   */
  skip(name: string, fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('skip() must be called inside describe()');
    }

    const test: Test = {
      name,
      fn,
      skip: true,
      status: 'skipped'
    };

    this.currentSuite.tests.push(test);
  }

  /**
   * Run only this test
   */
  only(name: string, fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('only() must be called inside describe()');
    }

    const test: Test = {
      name,
      fn,
      only: true,
      status: 'pending'
    };

    this.currentSuite.tests.push(test);
  }

  /**
   * Before all tests hook
   */
  beforeAll(fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('beforeAll() must be called inside describe()');
    }
    this.currentSuite.hooks.beforeAll.push(fn);
  }

  /**
   * After all tests hook
   */
  afterAll(fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('afterAll() must be called inside describe()');
    }
    this.currentSuite.hooks.afterAll.push(fn);
  }

  /**
   * Before each test hook
   */
  beforeEach(fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('beforeEach() must be called inside describe()');
    }
    this.currentSuite.hooks.beforeEach.push(fn);
  }

  /**
   * After each test hook
   */
  afterEach(fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error('afterEach() must be called inside describe()');
    }
    this.currentSuite.hooks.afterEach.push(fn);
  }

  /**
   * Run all tests
   */
  async run(): Promise<TestResult> {
    if (this.isRunning) {
      throw new Error('Tests are already running');
    }

    console.log('[Test] Starting test run');
    this.isRunning = true;
    this.emit('runStart');

    const startTime = Date.now();
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    // Run suites
    const suites = Array.from(this.suites.values());

    if (this.config.parallel) {
      // Run suites in parallel
      const results = await Promise.all(
        suites.map(suite => this.runSuite(suite))
      );

      for (const result of results) {
        totalTests += result.total;
        passedTests += result.passed;
        failedTests += result.failed;
        skippedTests += result.skipped;
      }
    } else {
      // Run suites sequentially
      for (const suite of suites) {
        const result = await this.runSuite(suite);
        totalTests += result.total;
        passedTests += result.passed;
        failedTests += result.failed;
        skippedTests += result.skipped;

        if (this.config.bail && failedTests > 0) {
          break;
        }
      }
    }

    const duration = Date.now() - startTime;

    const result: TestResult = {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      duration
    };

    if (this.config.coverage) {
      result.coverage = await this.collectCoverage();
    }

    this.isRunning = false;
    this.emit('runComplete', result);

    return result;
  }

  /**
   * Run a test suite
   */
  private async runSuite(suite: TestSuite): Promise<SuiteResult> {
    console.log(`[Test] Running suite: ${suite.name}`);
    this.emit('suiteStart', suite);

    let passed = 0;
    let failed = 0;
    let skipped = 0;

    // Run beforeAll hooks
    for (const hook of suite.hooks.beforeAll) {
      await hook();
    }

    // Check if we should only run specific tests
    const hasOnly = suite.tests.some(t => t.only);
    const testsToRun = hasOnly
      ? suite.tests.filter(t => t.only)
      : suite.tests;

    // Run tests
    for (const test of testsToRun) {
      if (test.skip) {
        skipped++;
        continue;
      }

      const result = await this.runTest(suite, test);
      if (result === 'passed') {
        passed++;
      } else if (result === 'failed') {
        failed++;
        if (this.config.bail) break;
      } else {
        skipped++;
      }
    }

    // Run afterAll hooks
    for (const hook of suite.hooks.afterAll) {
      await hook();
    }

    this.emit('suiteComplete', { suite, passed, failed, skipped });

    return {
      total: testsToRun.length,
      passed,
      failed,
      skipped
    };
  }

  /**
   * Run a single test
   */
  private async runTest(suite: TestSuite, test: Test): Promise<'passed' | 'failed' | 'skipped'> {
    if (this.config.verbose) {
      console.log(`  Running: ${test.name}`);
    }

    test.status = 'running';
    this.emit('testStart', test);

    const startTime = Date.now();

    try {
      // Run beforeEach hooks
      for (const hook of suite.hooks.beforeEach) {
        await hook();
      }

      // Run test with timeout
      await this.runWithTimeout(test.fn, test.timeout!);

      // Run afterEach hooks
      for (const hook of suite.hooks.afterEach) {
        await hook();
      }

      test.status = 'passed';
      test.duration = Date.now() - startTime;

      this.emit('testComplete', test);
      return 'passed';
    } catch (error) {
      test.status = 'failed';
      test.duration = Date.now() - startTime;
      test.error = error instanceof Error ? error : new Error(String(error));

      console.error(`  ✗ ${test.name}`);
      console.error(`    ${test.error.message}`);

      this.emit('testComplete', test);
      return 'failed';
    }
  }

  /**
   * Run function with timeout
   */
  private async runWithTimeout(fn: () => void | Promise<void>, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test timeout after ${timeout}ms`));
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

  /**
   * Collect code coverage
   */
  private async collectCoverage(): Promise<Coverage> {
    console.log('[Test] Collecting coverage');

    // In production, this would use V8 coverage or similar
    return {
      lines: { total: 1000, covered: 850, percentage: 85 },
      functions: { total: 200, covered: 180, percentage: 90 },
      branches: { total: 400, covered: 320, percentage: 80 },
      statements: { total: 1200, covered: 1020, percentage: 85 }
    };
  }

  /**
   * Expect assertion
   */
  expect(actual: any): Expectation {
    return new Expectation(actual);
  }

  /**
   * Create mock function
   */
  fn(implementation?: (...args: any[]) => any): MockFunction {
    const calls: any[][] = [];
    const results: any[] = [];
    const instances: any[] = [];

    let mockImpl = implementation;

    const mockFn = function(this: any, ...args: any[]): any {
      calls.push(args);
      instances.push(this);

      if (mockImpl) {
        try {
          const result = mockImpl.apply(this, args);
          results.push({ type: 'return', value: result });
          return result;
        } catch (error) {
          results.push({ type: 'throw', value: error });
          throw error;
        }
      }
    } as MockFunction;

    mockFn.mock = { calls, results, instances };

    mockFn.mockReturnValue = (value: any) => {
      mockImpl = () => value;
      return mockFn;
    };

    mockFn.mockResolvedValue = (value: any) => {
      mockImpl = async () => value;
      return mockFn;
    };

    mockFn.mockRejectedValue = (value: any) => {
      mockImpl = async () => {
        throw value;
      };
      return mockFn;
    };

    mockFn.mockImplementation = (fn: (...args: any[]) => any) => {
      mockImpl = fn;
      return mockFn;
    };

    mockFn.mockClear = () => {
      calls.length = 0;
      results.length = 0;
      instances.length = 0;
    };

    mockFn.mockReset = () => {
      mockFn.mockClear();
      mockImpl = undefined;
    };

    return mockFn;
  }

  /**
   * Snapshot testing
   */
  toMatchSnapshot(name: string, value: any): boolean {
    const snapshot = this.snapshots.get(name);

    if (!snapshot) {
      // Create new snapshot
      this.snapshots.set(name, { name, value, file: '' });
      console.log(`[Test] Snapshot created: ${name}`);
      return true;
    }

    // Compare with existing snapshot
    const matches = JSON.stringify(value) === JSON.stringify(snapshot.value);

    if (!matches) {
      console.error(`[Test] Snapshot mismatch: ${name}`);
    }

    return matches;
  }

  /**
   * Update snapshots
   */
  updateSnapshots(): void {
    console.log('[Test] Updating snapshots');
    // In production, this would write snapshots to files
  }

  /**
   * Watch for file changes
   */
  watch(): void {
    console.log('[Test] Starting watch mode');
    this.config.watchMode = true;

    // In production, this would watch for file changes
    // and re-run tests automatically
  }

  /**
   * Stop watch mode
   */
  stopWatch(): void {
    this.config.watchMode = false;
  }

  /**
   * Clear all mocks
   */
  clearAllMocks(): void {
    for (const mock of this.mocks.values()) {
      mock.mockClear();
    }
  }

  /**
   * Reset all mocks
   */
  resetAllMocks(): void {
    for (const mock of this.mocks.values()) {
      mock.mockReset();
    }
  }
}

/**
 * Expectation assertions
 */
class Expectation {
  constructor(private actual: any) {}

  toBe(expected: any): void {
    if (this.actual !== expected) {
      throw new Error(`Expected ${this.actual} to be ${expected}`);
    }
  }

  toEqual(expected: any): void {
    if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} to equal ${JSON.stringify(expected)}`);
    }
  }

  toBeTruthy(): void {
    if (!this.actual) {
      throw new Error(`Expected ${this.actual} to be truthy`);
    }
  }

  toBeFalsy(): void {
    if (this.actual) {
      throw new Error(`Expected ${this.actual} to be falsy`);
    }
  }

  toBeNull(): void {
    if (this.actual !== null) {
      throw new Error(`Expected ${this.actual} to be null`);
    }
  }

  toBeUndefined(): void {
    if (this.actual !== undefined) {
      throw new Error(`Expected ${this.actual} to be undefined`);
    }
  }

  toContain(item: any): void {
    if (Array.isArray(this.actual)) {
      if (!this.actual.includes(item)) {
        throw new Error(`Expected array to contain ${item}`);
      }
    } else if (typeof this.actual === 'string') {
      if (!this.actual.includes(item)) {
        throw new Error(`Expected string to contain ${item}`);
      }
    }
  }

  toThrow(error?: string | RegExp): void {
    try {
      this.actual();
      throw new Error('Expected function to throw');
    } catch (e) {
      if (error) {
        const message = e instanceof Error ? e.message : String(e);
        if (typeof error === 'string' && !message.includes(error)) {
          throw new Error(`Expected error to contain "${error}"`);
        } else if (error instanceof RegExp && !error.test(message)) {
          throw new Error(`Expected error to match ${error}`);
        }
      }
    }
  }

  async rejects(error?: string | RegExp): Promise<void> {
    try {
      await this.actual();
      throw new Error('Expected promise to reject');
    } catch (e) {
      if (error) {
        const message = e instanceof Error ? e.message : String(e);
        if (typeof error === 'string' && !message.includes(error)) {
          throw new Error(`Expected error to contain "${error}"`);
        } else if (error instanceof RegExp && !error.test(message)) {
          throw new Error(`Expected error to match ${error}`);
        }
      }
    }
  }

  async resolves(): Promise<void> {
    try {
      await this.actual();
    } catch (e) {
      throw new Error('Expected promise to resolve');
    }
  }
}

interface SuiteResult {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

export default ElideTestRunner;
