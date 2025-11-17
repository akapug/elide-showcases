/**
 * Jest Clone - Matchers
 * Comprehensive assertion library with all Jest matchers
 */

import type { Matchers, CustomMatchers, MatcherContext } from '../types';

class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

export class ExpectImpl implements Matchers {
  private actual: any;
  private isNegated = false;
  private isAsync = false;
  private asyncType: 'resolves' | 'rejects' | null = null;

  constructor(actual: any) {
    this.actual = actual;
  }

  get not(): Matchers {
    const negated = new ExpectImpl(this.actual);
    negated.isNegated = !this.isNegated;
    return negated as Matchers;
  }

  get resolves(): Matchers<Promise<void>> {
    this.isAsync = true;
    this.asyncType = 'resolves';
    return this as any;
  }

  get rejects(): Matchers<Promise<void>> {
    this.isAsync = true;
    this.asyncType = 'rejects';
    return this as any;
  }

  // Basic matchers
  toBe(expected: any): void {
    const pass = Object.is(this.actual, expected);
    this.assert(
      pass,
      `Expected ${this.stringify(this.actual)} to be ${this.stringify(expected)}`,
      `Expected ${this.stringify(this.actual)} not to be ${this.stringify(expected)}`
    );
  }

  toEqual(expected: any): void {
    const pass = this.deepEqual(this.actual, expected);
    this.assert(
      pass,
      `Expected ${this.stringify(this.actual)} to equal ${this.stringify(expected)}`,
      `Expected ${this.stringify(this.actual)} not to equal ${this.stringify(expected)}`
    );
  }

  toStrictEqual(expected: any): void {
    const pass = this.strictEqual(this.actual, expected);
    this.assert(
      pass,
      `Expected ${this.stringify(this.actual)} to strictly equal ${this.stringify(expected)}`,
      `Expected ${this.stringify(this.actual)} not to strictly equal ${this.stringify(expected)}`
    );
  }

  toBeTruthy(): void {
    const pass = Boolean(this.actual);
    this.assert(
      pass,
      `Expected ${this.stringify(this.actual)} to be truthy`,
      `Expected ${this.stringify(this.actual)} not to be truthy`
    );
  }

  toBeFalsy(): void {
    const pass = !Boolean(this.actual);
    this.assert(
      pass,
      `Expected ${this.stringify(this.actual)} to be falsy`,
      `Expected ${this.stringify(this.actual)} not to be falsy`
    );
  }

  toBeNull(): void {
    const pass = this.actual === null;
    this.assert(
      pass,
      `Expected ${this.stringify(this.actual)} to be null`,
      `Expected ${this.stringify(this.actual)} not to be null`
    );
  }

  toBeUndefined(): void {
    const pass = this.actual === undefined;
    this.assert(
      pass,
      `Expected ${this.stringify(this.actual)} to be undefined`,
      `Expected ${this.stringify(this.actual)} not to be undefined`
    );
  }

  toBeDefined(): void {
    const pass = this.actual !== undefined;
    this.assert(
      pass,
      `Expected ${this.stringify(this.actual)} to be defined`,
      `Expected ${this.stringify(this.actual)} not to be defined`
    );
  }

  toBeNaN(): void {
    const pass = Number.isNaN(this.actual);
    this.assert(
      pass,
      `Expected ${this.stringify(this.actual)} to be NaN`,
      `Expected ${this.stringify(this.actual)} not to be NaN`
    );
  }

  // Number matchers
  toBeGreaterThan(expected: number): void {
    const pass = this.actual > expected;
    this.assert(
      pass,
      `Expected ${this.actual} to be greater than ${expected}`,
      `Expected ${this.actual} not to be greater than ${expected}`
    );
  }

  toBeGreaterThanOrEqual(expected: number): void {
    const pass = this.actual >= expected;
    this.assert(
      pass,
      `Expected ${this.actual} to be greater than or equal to ${expected}`,
      `Expected ${this.actual} not to be greater than or equal to ${expected}`
    );
  }

  toBeLessThan(expected: number): void {
    const pass = this.actual < expected;
    this.assert(
      pass,
      `Expected ${this.actual} to be less than ${expected}`,
      `Expected ${this.actual} not to be less than ${expected}`
    );
  }

  toBeLessThanOrEqual(expected: number): void {
    const pass = this.actual <= expected;
    this.assert(
      pass,
      `Expected ${this.actual} to be less than or equal to ${expected}`,
      `Expected ${this.actual} not to be less than or equal to ${expected}`
    );
  }

  toBeCloseTo(expected: number, precision = 2): void {
    const multiplier = Math.pow(10, precision);
    const pass = Math.abs(this.actual - expected) < 1 / multiplier;
    this.assert(
      pass,
      `Expected ${this.actual} to be close to ${expected} (precision: ${precision})`,
      `Expected ${this.actual} not to be close to ${expected} (precision: ${precision})`
    );
  }

  // String matchers
  toMatch(expected: string | RegExp): void {
    const pattern = typeof expected === 'string' ? new RegExp(expected) : expected;
    const pass = pattern.test(String(this.actual));
    this.assert(
      pass,
      `Expected "${this.actual}" to match ${pattern}`,
      `Expected "${this.actual}" not to match ${pattern}`
    );
  }

  // Array/Iterable matchers
  toContain(expected: any): void {
    let pass = false;

    if (typeof this.actual === 'string') {
      pass = this.actual.includes(expected);
    } else if (Array.isArray(this.actual)) {
      pass = this.actual.some(item => Object.is(item, expected));
    } else if (this.actual && typeof this.actual[Symbol.iterator] === 'function') {
      pass = Array.from(this.actual).some(item => Object.is(item, expected));
    }

    this.assert(
      pass,
      `Expected ${this.stringify(this.actual)} to contain ${this.stringify(expected)}`,
      `Expected ${this.stringify(this.actual)} not to contain ${this.stringify(expected)}`
    );
  }

  toContainEqual(expected: any): void {
    const pass = Array.isArray(this.actual) &&
      this.actual.some(item => this.deepEqual(item, expected));
    this.assert(
      pass,
      `Expected ${this.stringify(this.actual)} to contain equal ${this.stringify(expected)}`,
      `Expected ${this.stringify(this.actual)} not to contain equal ${this.stringify(expected)}`
    );
  }

  toHaveLength(expected: number): void {
    const pass = this.actual?.length === expected;
    this.assert(
      pass,
      `Expected length ${this.actual?.length} to be ${expected}`,
      `Expected length ${this.actual?.length} not to be ${expected}`
    );
  }

  // Object matchers
  toHaveProperty(keyPath: string | string[], value?: any): void {
    const path = Array.isArray(keyPath) ? keyPath : keyPath.split('.');
    let current = this.actual;

    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        this.assert(
          false,
          `Expected object to have property "${path.join('.')}"`,
          `Expected object not to have property "${path.join('.')}"`
        );
        return;
      }
    }

    if (value !== undefined) {
      const pass = this.deepEqual(current, value);
      this.assert(
        pass,
        `Expected property "${path.join('.')}" to equal ${this.stringify(value)}`,
        `Expected property "${path.join('.')}" not to equal ${this.stringify(value)}`
      );
    }
  }

  toMatchObject(expected: object): void {
    const pass = this.matchObject(this.actual, expected);
    this.assert(
      pass,
      `Expected ${this.stringify(this.actual)} to match object ${this.stringify(expected)}`,
      `Expected ${this.stringify(this.actual)} not to match object ${this.stringify(expected)}`
    );
  }

  // Exception matchers
  toThrow(expected?: string | RegExp | Error): void {
    return this.toThrowError(expected);
  }

  toThrowError(expected?: string | RegExp | Error): void {
    let thrown = false;
    let error: any;

    try {
      if (typeof this.actual === 'function') {
        this.actual();
      }
    } catch (e) {
      thrown = true;
      error = e;
    }

    if (!thrown) {
      this.assert(
        this.isNegated,
        'Expected function to throw an error',
        'Expected function not to throw an error'
      );
      return;
    }

    if (expected === undefined) {
      this.assert(
        !this.isNegated,
        'Expected function to throw an error',
        'Expected function not to throw an error'
      );
      return;
    }

    let pass = false;
    if (typeof expected === 'string') {
      pass = error.message.includes(expected);
    } else if (expected instanceof RegExp) {
      pass = expected.test(error.message);
    } else if (expected instanceof Error) {
      pass = error.message === expected.message;
    }

    this.assert(
      pass,
      `Expected error message to match ${expected}`,
      `Expected error message not to match ${expected}`
    );
  }

  // Mock function matchers
  toHaveBeenCalled(): void {
    const pass = this.actual?.mock?.calls?.length > 0;
    this.assert(
      pass,
      'Expected mock function to have been called',
      'Expected mock function not to have been called'
    );
  }

  toHaveBeenCalledTimes(expected: number): void {
    const actual = this.actual?.mock?.calls?.length || 0;
    const pass = actual === expected;
    this.assert(
      pass,
      `Expected mock function to have been called ${expected} times, but was called ${actual} times`,
      `Expected mock function not to have been called ${expected} times`
    );
  }

  toHaveBeenCalledWith(...args: any[]): void {
    const calls = this.actual?.mock?.calls || [];
    const pass = calls.some((call: any[]) =>
      call.length === args.length &&
      call.every((arg, i) => this.deepEqual(arg, args[i]))
    );
    this.assert(
      pass,
      `Expected mock function to have been called with ${this.stringify(args)}`,
      `Expected mock function not to have been called with ${this.stringify(args)}`
    );
  }

  toHaveBeenLastCalledWith(...args: any[]): void {
    const calls = this.actual?.mock?.calls || [];
    const lastCall = calls[calls.length - 1];
    const pass = lastCall &&
      lastCall.length === args.length &&
      lastCall.every((arg: any, i: number) => this.deepEqual(arg, args[i]));
    this.assert(
      pass,
      `Expected mock function to have been last called with ${this.stringify(args)}`,
      `Expected mock function not to have been last called with ${this.stringify(args)}`
    );
  }

  toHaveBeenNthCalledWith(n: number, ...args: any[]): void {
    const calls = this.actual?.mock?.calls || [];
    const call = calls[n - 1];
    const pass = call &&
      call.length === args.length &&
      call.every((arg: any, i: number) => this.deepEqual(arg, args[i]));
    this.assert(
      pass,
      `Expected mock function to have been nth (${n}) called with ${this.stringify(args)}`,
      `Expected mock function not to have been nth (${n}) called with ${this.stringify(args)}`
    );
  }

  toHaveReturned(): void {
    const results = this.actual?.mock?.results || [];
    const pass = results.some((r: any) => r.type === 'return');
    this.assert(
      pass,
      'Expected mock function to have returned',
      'Expected mock function not to have returned'
    );
  }

  toHaveReturnedTimes(expected: number): void {
    const results = this.actual?.mock?.results || [];
    const actual = results.filter((r: any) => r.type === 'return').length;
    const pass = actual === expected;
    this.assert(
      pass,
      `Expected mock function to have returned ${expected} times, but returned ${actual} times`,
      `Expected mock function not to have returned ${expected} times`
    );
  }

  toHaveReturnedWith(expected: any): void {
    const results = this.actual?.mock?.results || [];
    const pass = results.some((r: any) =>
      r.type === 'return' && this.deepEqual(r.value, expected)
    );
    this.assert(
      pass,
      `Expected mock function to have returned ${this.stringify(expected)}`,
      `Expected mock function not to have returned ${this.stringify(expected)}`
    );
  }

  toHaveLastReturnedWith(expected: any): void {
    const results = this.actual?.mock?.results || [];
    const lastReturn = results.filter((r: any) => r.type === 'return').pop();
    const pass = lastReturn && this.deepEqual(lastReturn.value, expected);
    this.assert(
      pass,
      `Expected mock function to have last returned ${this.stringify(expected)}`,
      `Expected mock function not to have last returned ${this.stringify(expected)}`
    );
  }

  toHaveNthReturnedWith(n: number, expected: any): void {
    const results = this.actual?.mock?.results || [];
    const returns = results.filter((r: any) => r.type === 'return');
    const nthReturn = returns[n - 1];
    const pass = nthReturn && this.deepEqual(nthReturn.value, expected);
    this.assert(
      pass,
      `Expected mock function to have nth (${n}) returned ${this.stringify(expected)}`,
      `Expected mock function not to have nth (${n}) returned ${this.stringify(expected)}`
    );
  }

  // Snapshot matchers
  toMatchSnapshot(propertyMatchers?: object, hint?: string): void {
    // Snapshot testing implementation
    // In a real implementation, this would serialize the value and compare with saved snapshot
    throw new Error('Snapshot testing not yet implemented');
  }

  toMatchInlineSnapshot(propertyMatchers?: object | string, inlineSnapshot?: string): void {
    // Inline snapshot implementation
    throw new Error('Inline snapshot testing not yet implemented');
  }

  // Helper methods
  private assert(pass: boolean, positiveMessage: string, negativeMessage: string): void {
    const shouldPass = this.isNegated ? !pass : pass;
    if (!shouldPass) {
      const message = this.isNegated ? negativeMessage : positiveMessage;
      throw new AssertionError(message);
    }
  }

  private deepEqual(a: any, b: any): boolean {
    if (Object.is(a, b)) return true;
    if (a === null || b === null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!this.deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  private strictEqual(a: any, b: any): boolean {
    if (!this.deepEqual(a, b)) return false;

    // Check prototypes
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

    // Check for undefined values
    if (typeof a === 'object' && typeof b === 'object') {
      const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
      for (const key of allKeys) {
        if (!(key in a) || !(key in b)) return false;
      }
    }

    return true;
  }

  private matchObject(received: any, expected: any): boolean {
    if (typeof expected !== 'object' || expected === null) {
      return this.deepEqual(received, expected);
    }

    if (typeof received !== 'object' || received === null) {
      return false;
    }

    for (const key in expected) {
      if (!(key in received)) return false;
      if (!this.matchObject(received[key], expected[key])) return false;
    }

    return true;
  }

  private stringify(value: any): string {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
}

// Custom matchers support
const customMatchers: CustomMatchers = {};

export function expect<T = any>(actual: T): Matchers<void> {
  return new ExpectImpl(actual) as Matchers<void>;
}

expect.extend = function(matchers: CustomMatchers): void {
  Object.assign(customMatchers, matchers);
};

expect.assertions = function(count: number): void {
  // Track expected assertion count
};

expect.hasAssertions = function(): void {
  // Track that assertions are expected
};

expect.any = function(constructor: any): any {
  return { asymmetricMatch: (val: any) => val instanceof constructor };
};

expect.anything = function(): any {
  return { asymmetricMatch: (val: any) => val !== null && val !== undefined };
};

expect.arrayContaining = function(sample: any[]): any {
  return {
    asymmetricMatch: (val: any[]) =>
      Array.isArray(val) && sample.every(item => val.includes(item))
  };
};

expect.objectContaining = function(sample: object): any {
  return {
    asymmetricMatch: (val: any) => {
      if (typeof val !== 'object' || val === null) return false;
      return Object.keys(sample).every(key => key in val);
    }
  };
};

expect.stringContaining = function(substring: string): any {
  return {
    asymmetricMatch: (val: string) =>
      typeof val === 'string' && val.includes(substring)
  };
};

expect.stringMatching = function(pattern: string | RegExp): any {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  return {
    asymmetricMatch: (val: string) => typeof val === 'string' && regex.test(val)
  };
};
