/**
 * Jest Clone - Type Definitions
 * Comprehensive type system for the testing framework
 */

export interface Config {
  testMatch?: string[];
  testPathIgnorePatterns?: string[];
  collectCoverageFrom?: string[];
  coveragePathIgnorePatterns?: string[];
  coverageThreshold?: CoverageThreshold;
  setupFilesAfterEnv?: string[];
  testTimeout?: number;
  maxWorkers?: number;
  bail?: number | boolean;
  verbose?: boolean;
  silent?: boolean;
  rootDir?: string;
  moduleNameMapper?: Record<string, string>;
  transform?: Record<string, string>;
  globals?: Record<string, any>;
  testEnvironment?: 'node' | 'jsdom';
  clearMocks?: boolean;
  resetMocks?: boolean;
  restoreMocks?: boolean;
}

export interface CoverageThreshold {
  global?: CoverageMetrics;
  [path: string]: CoverageMetrics | undefined;
}

export interface CoverageMetrics {
  branches?: number;
  functions?: number;
  lines?: number;
  statements?: number;
}

export interface TestResult {
  testFilePath: string;
  testResults: AssertionResult[];
  numPassingTests: number;
  numFailingTests: number;
  numPendingTests: number;
  numTodoTests: number;
  perfStats: {
    start: number;
    end: number;
    runtime: number;
  };
  failureMessage?: string;
  coverage?: FileCoverage;
}

export interface AssertionResult {
  ancestorTitles: string[];
  fullName: string;
  status: 'passed' | 'failed' | 'pending' | 'todo';
  title: string;
  duration: number;
  failureMessages: string[];
  location?: {
    line: number;
    column: number;
  };
}

export interface TestSuite {
  name: string;
  tests: Test[];
  suites: TestSuite[];
  beforeAll: Hook[];
  beforeEach: Hook[];
  afterAll: Hook[];
  afterEach: Hook[];
}

export interface Test {
  name: string;
  fn: TestFn;
  timeout?: number;
  mode?: 'skip' | 'only' | 'todo';
}

export type TestFn = () => void | Promise<void>;
export type Hook = () => void | Promise<void>;

export interface MockFunction<T = any, Y extends any[] = any[]> {
  (...args: Y): T;
  mock: MockContext<T, Y>;
  mockClear(): this;
  mockReset(): this;
  mockRestore(): void;
  mockImplementation(fn: (...args: Y) => T): this;
  mockImplementationOnce(fn: (...args: Y) => T): this;
  mockReturnValue(value: T): this;
  mockReturnValueOnce(value: T): this;
  mockResolvedValue(value: Awaited<T>): this;
  mockResolvedValueOnce(value: Awaited<T>): this;
  mockRejectedValue(value: any): this;
  mockRejectedValueOnce(value: any): this;
  mockName(name: string): this;
}

export interface MockContext<T, Y extends any[]> {
  calls: Y[];
  results: MockResult<T>[];
  instances: any[];
  contexts: any[];
  lastCall?: Y;
}

export interface MockResult<T> {
  type: 'return' | 'throw' | 'incomplete';
  value: T | undefined;
}

export interface Matchers<R = void> {
  toBe(expected: any): R;
  toEqual(expected: any): R;
  toStrictEqual(expected: any): R;
  toBeTruthy(): R;
  toBeFalsy(): R;
  toBeNull(): R;
  toBeUndefined(): R;
  toBeDefined(): R;
  toBeNaN(): R;
  toBeGreaterThan(expected: number): R;
  toBeGreaterThanOrEqual(expected: number): R;
  toBeLessThan(expected: number): R;
  toBeLessThanOrEqual(expected: number): R;
  toBeCloseTo(expected: number, precision?: number): R;
  toMatch(expected: string | RegExp): R;
  toContain(expected: any): R;
  toContainEqual(expected: any): R;
  toHaveLength(expected: number): R;
  toHaveProperty(keyPath: string | string[], value?: any): R;
  toMatchObject(expected: object): R;
  toThrow(expected?: string | RegExp | Error): R;
  toThrowError(expected?: string | RegExp | Error): R;
  toHaveBeenCalled(): R;
  toHaveBeenCalledTimes(expected: number): R;
  toHaveBeenCalledWith(...args: any[]): R;
  toHaveBeenLastCalledWith(...args: any[]): R;
  toHaveBeenNthCalledWith(n: number, ...args: any[]): R;
  toHaveReturned(): R;
  toHaveReturnedTimes(expected: number): R;
  toHaveReturnedWith(expected: any): R;
  toHaveLastReturnedWith(expected: any): R;
  toHaveNthReturnedWith(n: number, expected: any): R;
  toMatchSnapshot(propertyMatchers?: object, hint?: string): R;
  toMatchInlineSnapshot(propertyMatchers?: object | string, inlineSnapshot?: string): R;
  resolves: Matchers<Promise<R>>;
  rejects: Matchers<Promise<R>>;
  not: Matchers<R>;
}

export interface Expect {
  <T = any>(actual: T): Matchers<void>;
  extend(matchers: CustomMatchers): void;
  assertions(count: number): void;
  hasAssertions(): void;
  any(constructor: any): any;
  anything(): any;
  arrayContaining(sample: any[]): any;
  objectContaining(sample: object): any;
  stringContaining(substring: string): any;
  stringMatching(pattern: string | RegExp): any;
}

export interface CustomMatchers {
  [matcherName: string]: CustomMatcher;
}

export interface CustomMatcher {
  (this: MatcherContext, received: any, ...args: any[]): CustomMatcherResult;
}

export interface MatcherContext {
  isNot: boolean;
  promise: string;
  equals(a: any, b: any): boolean;
  utils: MatcherUtils;
}

export interface CustomMatcherResult {
  pass: boolean;
  message: () => string;
}

export interface MatcherUtils {
  matcherHint(matcherName: string, received?: string, expected?: string, options?: object): string;
  printReceived(value: any): string;
  printExpected(value: any): string;
  stringify(value: any): string;
}

export interface FileCoverage {
  path: string;
  statementMap: Record<string, StatementCoverage>;
  fnMap: Record<string, FunctionCoverage>;
  branchMap: Record<string, BranchCoverage>;
  s: Record<string, number>;
  f: Record<string, number>;
  b: Record<string, number[]>;
}

export interface StatementCoverage {
  start: Location;
  end: Location;
}

export interface FunctionCoverage {
  name: string;
  decl: StatementCoverage;
  loc: StatementCoverage;
}

export interface BranchCoverage {
  loc: StatementCoverage;
  type: string;
  locations: StatementCoverage[];
}

export interface Location {
  line: number;
  column: number;
}

export interface CoverageSummary {
  lines: CoverageStats;
  statements: CoverageStats;
  functions: CoverageStats;
  branches: CoverageStats;
}

export interface CoverageStats {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

export interface Reporter {
  onRunStart?(config: Config): void | Promise<void>;
  onTestStart?(test: TestResult): void | Promise<void>;
  onTestResult?(test: TestResult): void | Promise<void>;
  onRunComplete?(results: AggregatedResult): void | Promise<void>;
}

export interface AggregatedResult {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  numTodoTests: number;
  startTime: number;
  endTime: number;
  success: boolean;
  testResults: TestResult[];
  coverageMap?: Map<string, FileCoverage>;
}

export interface SnapshotState {
  update: boolean;
  match(testName: string, received: any, key: string): SnapshotMatchResult;
  save(): void;
  getUncheckedCount(): number;
  removeUncheckedKeys(): void;
}

export interface SnapshotMatchResult {
  actual: string;
  expected: string | undefined;
  pass: boolean;
  key: string;
}

export interface WatchPlugin {
  apply(hooks: WatchHooks): void;
}

export interface WatchHooks {
  onFileChange(callback: (changedFiles: Set<string>) => void): void;
  onTestRunComplete(callback: (results: AggregatedResult) => void): void;
}

export interface Timer {
  setTimeout(callback: () => void, delay: number): number;
  clearTimeout(id: number): void;
  setInterval(callback: () => void, delay: number): number;
  clearInterval(id: number): void;
  Date: typeof Date;
}

export interface MockedModule {
  [key: string]: any;
}

export interface SpyInstance<T = any, Y extends any[] = any[]> extends MockFunction<T, Y> {
  mockRestore(): void;
}
