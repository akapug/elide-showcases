/**
 * Jest Clone - Main Entry Point
 * Delightful testing framework for Elide
 */

import { TestRunner } from './core/runner';
import { expect } from './matchers';
import { jest } from './mocking/mock';
import type {
  Config,
  TestFn,
  Hook,
  Matchers,
  MockFunction,
  SpyInstance
} from './types';

// Global test runner instance
let globalRunner: TestRunner | null = null;

function getGlobalRunner(): TestRunner {
  if (!globalRunner) {
    globalRunner = new TestRunner({});
  }
  return globalRunner;
}

// Test definition functions
export function describe(name: string, fn: () => void): void {
  getGlobalRunner().describe(name, fn);
}

export function it(name: string, fn: TestFn, timeout?: number): void {
  getGlobalRunner().it(name, fn, timeout);
}

export function test(name: string, fn: TestFn, timeout?: number): void {
  it(name, fn, timeout);
}

// Test modifiers
describe.only = function(name: string, fn: () => void): void {
  // Implementation for .only
  describe(name, fn);
};

describe.skip = function(name: string, fn: () => void): void {
  // Implementation for .skip
  describe(name, fn);
};

it.only = function(name: string, fn: TestFn, timeout?: number): void {
  // Implementation for .only
  it(name, fn, timeout);
};

it.skip = function(name: string, fn: TestFn, timeout?: number): void {
  // Implementation for .skip
  it(name, fn, timeout);
};

it.todo = function(name: string): void {
  // Implementation for .todo
  it(name, () => {});
};

test.only = it.only;
test.skip = it.skip;
test.todo = it.todo;

// Lifecycle hooks
export function beforeAll(fn: Hook): void {
  getGlobalRunner().beforeAll(fn);
}

export function beforeEach(fn: Hook): void {
  getGlobalRunner().beforeEach(fn);
}

export function afterAll(fn: Hook): void {
  getGlobalRunner().afterAll(fn);
}

export function afterEach(fn: Hook): void {
  getGlobalRunner().afterEach(fn);
}

// Export core functionality
export { expect, jest };

// Export types
export type {
  Config,
  TestResult,
  AssertionResult,
  TestSuite,
  Test,
  TestFn,
  Hook,
  MockFunction,
  SpyInstance,
  Matchers,
  Expect,
  Reporter,
  AggregatedResult,
  FileCoverage,
  CoverageSummary,
  SnapshotState
} from './types';

// Export utilities
export { TestRunner } from './core/runner';
export { DefaultReporter, VerboseReporter, JSONReporter } from './reporters/default';
export { CoverageCollector, CoverageReporter } from './coverage/collector';
export { SnapshotStateImpl, SnapshotResolver } from './snapshot/state';
export { WatchMode, WatchPlugin } from './watch/watcher';
export { CLI } from './cli';

// Default export
export default {
  describe,
  it,
  test,
  expect,
  jest,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach
};
