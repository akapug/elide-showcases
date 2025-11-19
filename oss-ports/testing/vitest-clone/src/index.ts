/**
 * Vitest Clone - Main Entry Point
 * Vite-native testing framework for Elide
 */

export { expect } from './matchers/expect';
export { vi } from './mocking/vi';
export { VitestRunner } from './core/runner';

export type {
  VitestConfig,
  TestConfig,
  CoverageConfig,
  BrowserConfig,
  BenchmarkConfig,
  Reporter,
  File,
  Suite,
  TestCase,
  Benchmark,
  Task,
  TaskResult,
  BenchmarkResult,
  MockFunction,
  SpyInstance,
  Matchers,
  Expect,
  Vi,
  TestContext,
  BenchmarkOptions
} from './types';

import type { VitestConfig, BenchmarkOptions } from './types';

// Global runner instance
let globalRunner: any = null;

function getRunner() {
  if (!globalRunner) {
    const { VitestRunner } = require('./core/runner');
    globalRunner = new VitestRunner({});
  }
  return globalRunner;
}

// Test definition API
export function describe(name: string, fn: () => void): void {
  getRunner().describe(name, fn);
}

export function it(name: string, fn?: () => void | Promise<void>): void {
  getRunner().it(name, fn);
}

export function test(name: string, fn?: () => void | Promise<void>): void {
  it(name, fn);
}

// Concurrent tests
describe.concurrent = function(name: string, fn: () => void): void {
  // Mark suite as concurrent
  describe(name, fn);
};

it.concurrent = function(name: string, fn?: () => void | Promise<void>): void {
  // Mark test as concurrent
  it(name, fn);
};

test.concurrent = it.concurrent;

// Test modifiers
describe.skip = function(name: string, fn: () => void): void {
  // Skip suite
  describe(name, fn);
};

describe.only = function(name: string, fn: () => void): void {
  // Only run this suite
  describe(name, fn);
};

describe.todo = function(name: string): void {
  // Todo suite
  describe(name, () => {});
};

it.skip = function(name: string, fn?: () => void | Promise<void>): void {
  // Skip test
  it(name, fn);
};

it.only = function(name: string, fn?: () => void | Promise<void>): void {
  // Only run this test
  it(name, fn);
};

it.todo = function(name: string): void {
  // Todo test
  it(name);
};

test.skip = it.skip;
test.only = it.only;
test.todo = it.todo;

// Shuffling
describe.shuffle = function(name: string, fn: () => void): void {
  describe(name, fn);
};

it.shuffle = function(name: string, fn?: () => void | Promise<void>): void {
  it(name, fn);
};

test.shuffle = it.shuffle;

// Lifecycle hooks
export function beforeAll(fn: () => void | Promise<void>): void {
  // Register beforeAll hook
}

export function beforeEach(fn: () => void | Promise<void>): void {
  // Register beforeEach hook
}

export function afterAll(fn: () => void | Promise<void>): void {
  // Register afterAll hook
}

export function afterEach(fn: () => void | Promise<void>): void {
  // Register afterEach hook
}

// Benchmarking
export function bench(name: string, fn: () => void, options?: BenchmarkOptions): void {
  // Register benchmark
}

bench.skip = function(name: string, fn: () => void, options?: BenchmarkOptions): void {
  // Skip benchmark
};

bench.only = function(name: string, fn: () => void, options?: BenchmarkOptions): void {
  // Only run this benchmark
};

bench.todo = function(name: string): void {
  // Todo benchmark
};

// Configuration
export function defineConfig(config: VitestConfig): VitestConfig {
  return config;
}

// Default export
export default {
  describe,
  it,
  test,
  expect: require('./matchers/expect').expect,
  vi: require('./mocking/vi').vi,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
  bench,
  defineConfig
};
