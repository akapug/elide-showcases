/**
 * Vitest Clone - Type Definitions
 */

export interface VitestConfig {
  test?: TestConfig;
  resolve?: {
    alias?: Record<string, string>;
  };
  plugins?: any[];
}

export interface TestConfig {
  globals?: boolean;
  environment?: 'node' | 'jsdom' | 'happy-dom';
  include?: string[];
  exclude?: string[];
  testTimeout?: number;
  hookTimeout?: number;
  threads?: boolean;
  maxThreads?: number;
  minThreads?: number;
  isolate?: boolean;
  watch?: boolean;
  reporters?: string[] | Reporter[];
  outputFile?: string;
  coverage?: CoverageConfig;
  includeSource?: string[];
  browser?: BrowserConfig;
  ui?: boolean;
  open?: boolean;
  api?: boolean | number;
  benchmark?: BenchmarkConfig;
}

export interface CoverageConfig {
  provider?: 'v8' | 'istanbul';
  enabled?: boolean;
  include?: string[];
  exclude?: string[];
  extension?: string[];
  reporter?: Array<'text' | 'json' | 'html' | 'lcov'>;
  reportsDirectory?: string;
  all?: boolean;
  clean?: boolean;
  branches?: number;
  functions?: number;
  lines?: number;
  statements?: number;
}

export interface BrowserConfig {
  enabled?: boolean;
  name?: 'chrome' | 'firefox' | 'safari' | 'edge';
  headless?: boolean;
  provider?: 'webdriverio' | 'playwright';
  api?: {
    port?: number;
    host?: string;
  };
}

export interface BenchmarkConfig {
  include?: string[];
  exclude?: string[];
  outputFile?: string;
}

export interface Reporter {
  onInit?(ctx: ReporterContext): void | Promise<void>;
  onPathsCollected?(paths: string[]): void | Promise<void>;
  onCollected?(files: File[]): void | Promise<void>;
  onTestStart?(test: TestCase): void | Promise<void>;
  onTestComplete?(test: TestCase): void | Promise<void>;
  onFinished?(files: File[], errors: unknown[]): void | Promise<void>;
}

export interface ReporterContext {
  config: VitestConfig;
  files: File[];
}

export interface File {
  filepath: string;
  name: string;
  tasks: Task[];
  type: 'suite';
  mode: 'run' | 'skip' | 'only' | 'todo';
  result?: TaskResult;
  meta?: Record<string, any>;
}

export interface Suite extends Task {
  type: 'suite';
  tasks: Task[];
}

export interface TestCase extends Task {
  type: 'test';
  result?: TaskResult;
}

export interface Benchmark extends Task {
  type: 'benchmark';
  result?: BenchmarkResult;
}

export interface Task {
  id: string;
  name: string;
  mode: 'run' | 'skip' | 'only' | 'todo';
  concurrent?: boolean;
  shuffle?: boolean;
  suite?: Suite;
  file?: File;
  meta?: Record<string, any>;
}

export interface TaskResult {
  state: 'pass' | 'fail' | 'skip' | 'todo';
  duration?: number;
  error?: unknown;
  htmlError?: string;
  hooks?: {
    beforeAll?: TaskResult[];
    beforeEach?: TaskResult[];
    afterEach?: TaskResult[];
    afterAll?: TaskResult[];
  };
  retryCount?: number;
}

export interface BenchmarkResult {
  hz?: number;
  mean?: number;
  samples?: number;
  p999?: number;
  p99?: number;
  p95?: number;
  p75?: number;
}

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
}

export interface MockContext<T, Y extends any[]> {
  calls: Y[];
  results: MockResult<T>[];
  instances: any[];
  invocationCallOrder: number[];
  lastCall?: Y;
}

export interface MockResult<T> {
  type: 'return' | 'throw';
  value: T | undefined;
}

export interface SpyInstance<T = any, Y extends any[] = any[]> extends MockFunction<T, Y> {
  mockRestore(): void;
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
  toBeTypeOf(type: string): R;
  toBeInstanceOf(constructor: any): R;
  toBeGreaterThan(expected: number): R;
  toBeGreaterThanOrEqual(expected: number): R;
  toBeLessThan(expected: number): R;
  toBeLessThanOrEqual(expected: number): R;
  toBeCloseTo(expected: number, precision?: number): R;
  toMatch(expected: string | RegExp): R;
  toMatchObject(expected: object): R;
  toContain(expected: any): R;
  toContainEqual(expected: any): R;
  toHaveLength(expected: number): R;
  toHaveProperty(keyPath: string | string[], value?: any): R;
  toThrow(expected?: string | RegExp | Error): R;
  toThrowError(expected?: string | RegExp | Error): R;
  toSatisfy(predicate: (value: any) => boolean): R;
  toHaveBeenCalled(): R;
  toHaveBeenCalledTimes(expected: number): R;
  toHaveBeenCalledWith(...args: any[]): R;
  toHaveBeenLastCalledWith(...args: any[]): R;
  toHaveBeenNthCalledWith(n: number, ...args: any[]): R;
  toHaveReturned(): R;
  toHaveReturnedTimes(expected: number): R;
  toHaveReturnedWith(expected: any): R;
  toMatchSnapshot(hint?: string): R;
  toMatchInlineSnapshot(snapshot?: string): R;
  toMatchFileSnapshot(filepath: string): R;
  resolves: Matchers<Promise<R>>;
  rejects: Matchers<Promise<R>>;
  not: Matchers<R>;
}

export interface Expect {
  <T = any>(actual: T): Matchers<void>;
  extend(matchers: any): void;
  soft<T = any>(actual: T): Matchers<void>;
  unreachable(message?: string): never;
  assertions(count: number): void;
  hasAssertions(): void;
  anything(): any;
  any(constructor: any): any;
  arrayContaining(sample: any[]): any;
  objectContaining(sample: object): any;
  stringContaining(substring: string): any;
  stringMatching(pattern: string | RegExp): any;
}

export interface Vi {
  fn<T = any, Y extends any[] = any[]>(implementation?: (...args: Y) => T): MockFunction<T, Y>;
  spyOn<T extends {}, M extends keyof T>(object: T, method: M): SpyInstance;
  mock(path: string, factory?: () => any): void;
  unmock(path: string): void;
  doMock(path: string, factory?: () => any): void;
  doUnmock(path: string): void;
  importActual<T = any>(path: string): Promise<T>;
  importMock<T = any>(path: string): Promise<T>;
  mocked<T>(item: T, deep?: boolean): T;
  clearAllMocks(): void;
  resetAllMocks(): void;
  restoreAllMocks(): void;
  useFakeTimers(): void;
  useRealTimers(): void;
  advanceTimersByTime(ms: number): void;
  advanceTimersToNextTimer(): void;
  runAllTimers(): void;
  runOnlyPendingTimers(): void;
  clearAllTimers(): void;
  getTimerCount(): number;
  setSystemTime(time: number | Date): void;
  getRealSystemTime(): number;
  stubGlobal(name: string, value: any): void;
  unstubAllGlobals(): void;
  hoisted<T>(factory: () => T): T;
}

export interface TestContext {
  expect: Expect;
  meta: Record<string, any>;
  skip: () => void;
  onTestFinished(fn: () => void): void;
  onTestFailed(fn: (error: unknown) => void): void;
}

export interface BenchmarkOptions {
  time?: number;
  iterations?: number;
  warmupTime?: number;
  warmupIterations?: number;
}
