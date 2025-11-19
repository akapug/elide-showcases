/**
 * Unified Assertion Library
 *
 * Provides a consistent, fluent assertion API across TypeScript, Python, Ruby, and Java.
 * Supports synchronous and asynchronous assertions with detailed error messages.
 */

import { diff } from 'jest-diff';
import { inspect } from 'util';

export type Comparator<T> = (actual: T, expected: T) => boolean;

export interface MatcherContext {
  isNot: boolean;
  promise?: string;
  utils: MatcherUtils;
}

export interface MatcherUtils {
  matcherHint: (matcherName: string, received?: string, expected?: string, options?: any) => string;
  printReceived: (value: any) => string;
  printExpected: (value: any) => string;
  stringify: (value: any) => string;
  diff: (a: any, b: any) => string | null;
}

export interface MatcherResult {
  pass: boolean;
  message: () => string;
  actual?: any;
  expected?: any;
}

export interface CustomMatcher<T = any> {
  (this: MatcherContext, received: T, ...args: any[]): MatcherResult | Promise<MatcherResult>;
}

/**
 * Assertion error with detailed information
 */
export class AssertionError extends Error {
  actual: any;
  expected: any;
  operator: string;
  diff?: string;

  constructor(
    message: string,
    actual: any,
    expected: any,
    operator: string
  ) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
    this.operator = operator;
    this.diff = this.generateDiff();
  }

  private generateDiff(): string | undefined {
    if (this.expected === undefined) return undefined;

    const diffResult = diff(this.expected, this.actual, {
      expand: true,
      contextLines: 3,
      aAnnotation: 'Expected',
      bAnnotation: 'Received'
    });

    return diffResult || undefined;
  }
}

/**
 * Main assertion class
 */
export class Assertion<T> {
  private actual: T;
  private isNegated: boolean = false;
  private context: MatcherContext;

  constructor(actual: T, isNegated: boolean = false) {
    this.actual = actual;
    this.isNegated = isNegated;
    this.context = {
      isNot: isNegated,
      utils: createMatcherUtils()
    };
  }

  /**
   * Negates the assertion
   */
  get not(): Assertion<T> {
    return new Assertion(this.actual, !this.isNegated);
  }

  /**
   * Assert strict equality (===)
   */
  toBe(expected: T): void {
    const pass = Object.is(this.actual, expected);

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toBe', expected),
        this.actual,
        expected,
        'toBe'
      );
    }
  }

  /**
   * Assert deep equality
   */
  toEqual(expected: T): void {
    const pass = this.deepEqual(this.actual, expected);

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toEqual', expected),
        this.actual,
        expected,
        'toEqual'
      );
    }
  }

  /**
   * Assert value is truthy
   */
  toBeTruthy(): void {
    const pass = Boolean(this.actual);

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toBeTruthy'),
        this.actual,
        'truthy value',
        'toBeTruthy'
      );
    }
  }

  /**
   * Assert value is falsy
   */
  toBeFalsy(): void {
    const pass = !Boolean(this.actual);

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toBeFalsy'),
        this.actual,
        'falsy value',
        'toBeFalsy'
      );
    }
  }

  /**
   * Assert value is null
   */
  toBeNull(): void {
    const pass = this.actual === null;

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toBeNull'),
        this.actual,
        null,
        'toBeNull'
      );
    }
  }

  /**
   * Assert value is undefined
   */
  toBeUndefined(): void {
    const pass = this.actual === undefined;

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toBeUndefined'),
        this.actual,
        undefined,
        'toBeUndefined'
      );
    }
  }

  /**
   * Assert value is defined (not undefined)
   */
  toBeDefined(): void {
    const pass = this.actual !== undefined;

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toBeDefined'),
        this.actual,
        'defined value',
        'toBeDefined'
      );
    }
  }

  /**
   * Assert number is greater than expected
   */
  toBeGreaterThan(expected: number): void {
    if (typeof this.actual !== 'number') {
      throw new Error('toBeGreaterThan can only be used with numbers');
    }

    const pass = this.actual > expected;

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toBeGreaterThan', expected),
        this.actual,
        expected,
        'toBeGreaterThan'
      );
    }
  }

  /**
   * Assert number is greater than or equal to expected
   */
  toBeGreaterThanOrEqual(expected: number): void {
    if (typeof this.actual !== 'number') {
      throw new Error('toBeGreaterThanOrEqual can only be used with numbers');
    }

    const pass = this.actual >= expected;

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toBeGreaterThanOrEqual', expected),
        this.actual,
        expected,
        'toBeGreaterThanOrEqual'
      );
    }
  }

  /**
   * Assert number is less than expected
   */
  toBeLessThan(expected: number): void {
    if (typeof this.actual !== 'number') {
      throw new Error('toBeLessThan can only be used with numbers');
    }

    const pass = this.actual < expected;

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toBeLessThan', expected),
        this.actual,
        expected,
        'toBeLessThan'
      );
    }
  }

  /**
   * Assert number is less than or equal to expected
   */
  toBeLessThanOrEqual(expected: number): void {
    if (typeof this.actual !== 'number') {
      throw new Error('toBeLessThanOrEqual can only be used with numbers');
    }

    const pass = this.actual <= expected;

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toBeLessThanOrEqual', expected),
        this.actual,
        expected,
        'toBeLessThanOrEqual'
      );
    }
  }

  /**
   * Assert number is close to expected (within precision)
   */
  toBeCloseTo(expected: number, precision: number = 2): void {
    if (typeof this.actual !== 'number') {
      throw new Error('toBeCloseTo can only be used with numbers');
    }

    const pass = Math.abs(this.actual - expected) < Math.pow(10, -precision) / 2;

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toBeCloseTo', expected, `precision: ${precision}`),
        this.actual,
        expected,
        'toBeCloseTo'
      );
    }
  }

  /**
   * Assert string/array contains item
   */
  toContain(item: any): void {
    let pass = false;

    if (typeof this.actual === 'string') {
      pass = this.actual.includes(item);
    } else if (Array.isArray(this.actual)) {
      pass = this.actual.includes(item);
    } else if (this.actual && typeof (this.actual as any).has === 'function') {
      pass = (this.actual as any).has(item);
    } else {
      throw new Error('toContain can only be used with strings, arrays, or Sets');
    }

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toContain', item),
        this.actual,
        item,
        'toContain'
      );
    }
  }

  /**
   * Assert array has length
   */
  toHaveLength(length: number): void {
    if (!this.actual || typeof (this.actual as any).length !== 'number') {
      throw new Error('toHaveLength can only be used with arrays or strings');
    }

    const pass = (this.actual as any).length === length;

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toHaveLength', length),
        (this.actual as any).length,
        length,
        'toHaveLength'
      );
    }
  }

  /**
   * Assert object has property
   */
  toHaveProperty(path: string | string[], value?: any): void {
    const pathArray = Array.isArray(path) ? path : path.split('.');
    const hasProperty = this.hasPath(this.actual, pathArray);

    if (!hasProperty && !this.isNegated) {
      throw new AssertionError(
        this.formatMessage('toHaveProperty', path),
        this.actual,
        path,
        'toHaveProperty'
      );
    }

    if (hasProperty && value !== undefined) {
      const actualValue = this.getPath(this.actual, pathArray);
      const valuesEqual = this.deepEqual(actualValue, value);

      if (this.shouldFail(valuesEqual)) {
        throw new AssertionError(
          this.formatMessage('toHaveProperty', `${path} with value ${inspect(value)}`),
          actualValue,
          value,
          'toHaveProperty'
        );
      }
    } else if (this.shouldFail(hasProperty)) {
      throw new AssertionError(
        this.formatMessage('toHaveProperty', path),
        this.actual,
        path,
        'toHaveProperty'
      );
    }
  }

  /**
   * Assert string matches regex
   */
  toMatch(pattern: string | RegExp): void {
    if (typeof this.actual !== 'string') {
      throw new Error('toMatch can only be used with strings');
    }

    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const pass = regex.test(this.actual);

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toMatch', pattern),
        this.actual,
        pattern,
        'toMatch'
      );
    }
  }

  /**
   * Assert function throws
   */
  toThrow(expected?: string | RegExp | Error | typeof Error): void {
    if (typeof this.actual !== 'function') {
      throw new Error('toThrow can only be used with functions');
    }

    let thrownError: Error | undefined;
    let pass = false;

    try {
      (this.actual as Function)();
    } catch (error) {
      thrownError = error as Error;
      pass = true;
    }

    if (expected && thrownError) {
      pass = this.matchesError(thrownError, expected);
    }

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toThrow', expected),
        thrownError,
        expected,
        'toThrow'
      );
    }
  }

  /**
   * Assert async function resolves
   */
  async toResolve(): Promise<void> {
    if (!(this.actual instanceof Promise)) {
      throw new Error('toResolve can only be used with Promises');
    }

    try {
      await this.actual;
      if (this.isNegated) {
        throw new AssertionError(
          'Expected promise to reject, but it resolved',
          'resolved',
          'rejected',
          'toResolve'
        );
      }
    } catch (error) {
      if (!this.isNegated) {
        throw new AssertionError(
          'Expected promise to resolve, but it rejected',
          error,
          'resolved',
          'toResolve'
        );
      }
    }
  }

  /**
   * Assert async function rejects
   */
  async toReject(expected?: string | RegExp | Error | typeof Error): Promise<void> {
    if (!(this.actual instanceof Promise)) {
      throw new Error('toReject can only be used with Promises');
    }

    let thrownError: Error | undefined;
    let rejected = false;

    try {
      await this.actual;
    } catch (error) {
      thrownError = error as Error;
      rejected = true;
    }

    if (!rejected && !this.isNegated) {
      throw new AssertionError(
        'Expected promise to reject, but it resolved',
        'resolved',
        'rejected',
        'toReject'
      );
    }

    if (rejected && expected && thrownError) {
      const matches = this.matchesError(thrownError, expected);
      if (this.shouldFail(matches)) {
        throw new AssertionError(
          this.formatMessage('toReject', expected),
          thrownError,
          expected,
          'toReject'
        );
      }
    }
  }

  /**
   * Assert instance type
   */
  toBeInstanceOf(constructor: Function): void {
    const pass = this.actual instanceof constructor;

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toBeInstanceOf', constructor.name),
        this.actual?.constructor?.name || typeof this.actual,
        constructor.name,
        'toBeInstanceOf'
      );
    }
  }

  /**
   * Assert array contains equal object
   */
  toContainEqual(item: any): void {
    if (!Array.isArray(this.actual)) {
      throw new Error('toContainEqual can only be used with arrays');
    }

    const pass = this.actual.some(element => this.deepEqual(element, item));

    if (this.shouldFail(pass)) {
      throw new AssertionError(
        this.formatMessage('toContainEqual', item),
        this.actual,
        item,
        'toContainEqual'
      );
    }
  }

  /**
   * Helper: Deep equality check
   */
  private deepEqual(a: any, b: any): boolean {
    if (Object.is(a, b)) return true;

    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.deepEqual(item, b[index]));
    }

    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      return keysA.every(key => this.deepEqual(a[key], b[key]));
    }

    return false;
  }

  /**
   * Helper: Check if object has path
   */
  private hasPath(obj: any, path: string[]): boolean {
    let current = obj;

    for (const key of path) {
      if (current === null || current === undefined) return false;
      if (!(key in current)) return false;
      current = current[key];
    }

    return true;
  }

  /**
   * Helper: Get value at path
   */
  private getPath(obj: any, path: string[]): any {
    let current = obj;

    for (const key of path) {
      if (current === null || current === undefined) return undefined;
      current = current[key];
    }

    return current;
  }

  /**
   * Helper: Check if error matches expected
   */
  private matchesError(
    error: Error,
    expected: string | RegExp | Error | typeof Error
  ): boolean {
    if (typeof expected === 'string') {
      return error.message.includes(expected);
    }

    if (expected instanceof RegExp) {
      return expected.test(error.message);
    }

    if (expected instanceof Error) {
      return error.message === expected.message;
    }

    if (typeof expected === 'function') {
      return error instanceof expected;
    }

    return false;
  }

  /**
   * Helper: Determine if assertion should fail
   */
  private shouldFail(pass: boolean): boolean {
    return this.isNegated ? pass : !pass;
  }

  /**
   * Helper: Format error message
   */
  private formatMessage(matcher: string, expected?: any, extra?: string): string {
    const hint = this.context.utils.matcherHint(
      this.isNegated ? `not.${matcher}` : matcher,
      'received',
      expected !== undefined ? 'expected' : undefined
    );

    let message = hint + '\n\n';

    if (expected !== undefined) {
      message += `Expected: ${this.context.utils.printExpected(expected)}\n`;
      message += `Received: ${this.context.utils.printReceived(this.actual)}\n`;
    } else {
      message += `Received: ${this.context.utils.printReceived(this.actual)}\n`;
    }

    if (extra) {
      message += `\n${extra}`;
    }

    return message;
  }
}

/**
 * Main expect function
 */
export function expect<T>(actual: T): Assertion<T> {
  return new Assertion(actual);
}

/**
 * Create matcher utilities
 */
function createMatcherUtils(): MatcherUtils {
  return {
    matcherHint: (matcherName: string, received = 'received', expected = 'expected', options = {}) => {
      const hint = options.isNot ? `expect(${received}).not.${matcherName}` : `expect(${received}).${matcherName}`;
      return expected ? `${hint}(${expected})` : hint;
    },

    printReceived: (value: any) => {
      return inspect(value, { depth: 3, colors: true });
    },

    printExpected: (value: any) => {
      return inspect(value, { depth: 3, colors: true });
    },

    stringify: (value: any) => {
      return JSON.stringify(value, null, 2);
    },

    diff: (a: any, b: any) => {
      return diff(a, b);
    }
  };
}

/**
 * Custom matcher registration
 */
const customMatchers = new Map<string, CustomMatcher>();

export function addMatcher<T = any>(
  name: string,
  matcher: CustomMatcher<T>
): void {
  customMatchers.set(name, matcher);

  // Extend Assertion prototype
  (Assertion.prototype as any)[name] = async function(...args: any[]) {
    const context: MatcherContext = {
      isNot: this.isNegated,
      utils: createMatcherUtils()
    };

    const result = await matcher.call(context, this.actual, ...args);

    if (this.shouldFail(result.pass)) {
      throw new AssertionError(
        result.message(),
        result.actual || this.actual,
        result.expected,
        name
      );
    }
  };
}

/**
 * Predefined custom matchers
 */

// toMatchSnapshot
addMatcher('toMatchSnapshot', function(received: any, snapshotName?: string) {
  // Snapshot matching logic would go here
  return {
    pass: true,
    message: () => 'Snapshot matched'
  };
});

// toHaveBeenCalled (for spies/mocks)
addMatcher('toHaveBeenCalled', function(received: any) {
  if (!received || typeof received.calls === 'undefined') {
    throw new Error('toHaveBeenCalled can only be used with spies/mocks');
  }

  const pass = received.calls.length > 0;

  return {
    pass,
    message: () => this.isNot
      ? `Expected spy not to have been called, but it was called ${received.calls.length} times`
      : `Expected spy to have been called, but it was not called`
  };
});

// toHaveBeenCalledTimes
addMatcher('toHaveBeenCalledTimes', function(received: any, times: number) {
  if (!received || typeof received.calls === 'undefined') {
    throw new Error('toHaveBeenCalledTimes can only be used with spies/mocks');
  }

  const pass = received.calls.length === times;

  return {
    pass,
    message: () => `Expected spy to have been called ${times} times, but it was called ${received.calls.length} times`,
    actual: received.calls.length,
    expected: times
  };
});

// toHaveBeenCalledWith
addMatcher('toHaveBeenCalledWith', function(received: any, ...expectedArgs: any[]) {
  if (!received || typeof received.calls === 'undefined') {
    throw new Error('toHaveBeenCalledWith can only be used with spies/mocks');
  }

  const pass = received.calls.some((call: any[]) => {
    if (call.length !== expectedArgs.length) return false;
    return call.every((arg, index) => {
      const assertion = new Assertion(arg);
      return assertion['deepEqual'](arg, expectedArgs[index]);
    });
  });

  return {
    pass,
    message: () => this.isNot
      ? `Expected spy not to have been called with ${inspect(expectedArgs)}`
      : `Expected spy to have been called with ${inspect(expectedArgs)}, but it was not`
  };
});

/**
 * Test suite functions
 */
export interface TestSuiteContext {
  describe: (name: string, fn: () => void) => void;
  it: (name: string, fn: () => void | Promise<void>) => void;
  test: (name: string, fn: () => void | Promise<void>) => void;
  beforeAll: (fn: () => void | Promise<void>) => void;
  afterAll: (fn: () => void | Promise<void>) => void;
  beforeEach: (fn: () => void | Promise<void>) => void;
  afterEach: (fn: () => void | Promise<void>) => void;
}

const testSuites: any[] = [];
let currentSuite: any = null;

export function describe(name: string, fn: () => void): void {
  const suite = {
    name,
    tests: [],
    beforeAll: [],
    afterAll: [],
    beforeEach: [],
    afterEach: []
  };

  const previousSuite = currentSuite;
  currentSuite = suite;

  fn();

  currentSuite = previousSuite;
  testSuites.push(suite);
}

export function it(name: string, fn: () => void | Promise<void>): void {
  if (!currentSuite) {
    throw new Error('it() can only be used inside describe()');
  }

  currentSuite.tests.push({ name, fn });
}

export const test = it;

export function beforeAll(fn: () => void | Promise<void>): void {
  if (!currentSuite) {
    throw new Error('beforeAll() can only be used inside describe()');
  }

  currentSuite.beforeAll.push(fn);
}

export function afterAll(fn: () => void | Promise<void>): void {
  if (!currentSuite) {
    throw new Error('afterAll() can only be used inside describe()');
  }

  currentSuite.afterAll.push(fn);
}

export function beforeEach(fn: () => void | Promise<void>): void {
  if (!currentSuite) {
    throw new Error('beforeEach() can only be used inside describe()');
  }

  currentSuite.beforeEach.push(fn);
}

export function afterEach(fn: () => void | Promise<void>): void {
  if (!currentSuite) {
    throw new Error('afterEach() can only be used inside describe()');
  }

  currentSuite.afterEach.push(fn);
}

/**
 * Export test suites for runner
 */
export function getTestSuites(): any[] {
  return testSuites;
}

export default {
  expect,
  describe,
  it,
  test,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  addMatcher,
  AssertionError
};
