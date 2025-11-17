/**
 * Vitest Clone - Expect/Matchers Implementation
 * Compatible with Jest matchers plus Vitest-specific additions
 */

import type { Expect, Matchers } from '../types';

class ExpectationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpectationError';
  }
}

class ExpectImpl implements Matchers {
  private actual: any;
  private isNegated = false;
  private isSoft = false;
  private softErrors: Error[] = [];

  constructor(actual: any, soft = false) {
    this.actual = actual;
    this.isSoft = soft;
  }

  get not(): Matchers {
    const negated = new ExpectImpl(this.actual, this.isSoft);
    negated.isNegated = !this.isNegated;
    negated.softErrors = this.softErrors;
    return negated as Matchers;
  }

  get resolves(): Matchers<Promise<void>> {
    return this.asyncMatcher('resolves');
  }

  get rejects(): Matchers<Promise<void>> {
    return this.asyncMatcher('rejects');
  }

  private asyncMatcher(type: 'resolves' | 'rejects'): any {
    const self = this;
    return new Proxy(this, {
      get(target, prop) {
        if (typeof prop === 'string' && prop in target) {
          return async (...args: any[]) => {
            try {
              const value = await self.actual;
              if (type === 'rejects') {
                throw new ExpectationError('Expected promise to reject but it resolved');
              }
              const newExpect = new ExpectImpl(value, self.isSoft);
              return (newExpect as any)[prop](...args);
            } catch (error) {
              if (type === 'resolves') {
                throw error;
              }
              const newExpect = new ExpectImpl(error, self.isSoft);
              return (newExpect as any)[prop](...args);
            }
          };
        }
        return (target as any)[prop];
      }
    });
  }

  toBe(expected: any): void {
    const pass = Object.is(this.actual, expected);
    this.assert(
      pass,
      `expected ${this.format(this.actual)} to be ${this.format(expected)}`,
      `expected ${this.format(this.actual)} not to be ${this.format(expected)}`
    );
  }

  toEqual(expected: any): void {
    const pass = this.deepEqual(this.actual, expected);
    this.assert(
      pass,
      `expected ${this.format(this.actual)} to equal ${this.format(expected)}`,
      `expected ${this.format(this.actual)} not to equal ${this.format(expected)}`
    );
  }

  toStrictEqual(expected: any): void {
    const pass = this.strictDeepEqual(this.actual, expected);
    this.assert(
      pass,
      `expected ${this.format(this.actual)} to strictly equal ${this.format(expected)}`,
      `expected ${this.format(this.actual)} not to strictly equal ${this.format(expected)}`
    );
  }

  toBeTruthy(): void {
    this.assert(
      Boolean(this.actual),
      `expected ${this.format(this.actual)} to be truthy`,
      `expected ${this.format(this.actual)} not to be truthy`
    );
  }

  toBeFalsy(): void {
    this.assert(
      !Boolean(this.actual),
      `expected ${this.format(this.actual)} to be falsy`,
      `expected ${this.format(this.actual)} not to be falsy`
    );
  }

  toBeNull(): void {
    this.assert(
      this.actual === null,
      `expected ${this.format(this.actual)} to be null`,
      `expected ${this.format(this.actual)} not to be null`
    );
  }

  toBeUndefined(): void {
    this.assert(
      this.actual === undefined,
      `expected ${this.format(this.actual)} to be undefined`,
      `expected ${this.format(this.actual)} not to be undefined`
    );
  }

  toBeDefined(): void {
    this.assert(
      this.actual !== undefined,
      `expected value to be defined`,
      `expected ${this.format(this.actual)} not to be defined`
    );
  }

  toBeNaN(): void {
    this.assert(
      Number.isNaN(this.actual),
      `expected ${this.format(this.actual)} to be NaN`,
      `expected ${this.format(this.actual)} not to be NaN`
    );
  }

  toBeTypeOf(type: string): void {
    const actualType = typeof this.actual;
    this.assert(
      actualType === type,
      `expected ${this.format(this.actual)} to be type ${type}`,
      `expected ${this.format(this.actual)} not to be type ${type}`
    );
  }

  toBeInstanceOf(constructor: any): void {
    this.assert(
      this.actual instanceof constructor,
      `expected ${this.format(this.actual)} to be instance of ${constructor.name}`,
      `expected ${this.format(this.actual)} not to be instance of ${constructor.name}`
    );
  }

  toBeGreaterThan(expected: number): void {
    this.assert(
      this.actual > expected,
      `expected ${this.actual} to be greater than ${expected}`,
      `expected ${this.actual} not to be greater than ${expected}`
    );
  }

  toBeGreaterThanOrEqual(expected: number): void {
    this.assert(
      this.actual >= expected,
      `expected ${this.actual} to be >= ${expected}`,
      `expected ${this.actual} not to be >= ${expected}`
    );
  }

  toBeLessThan(expected: number): void {
    this.assert(
      this.actual < expected,
      `expected ${this.actual} to be less than ${expected}`,
      `expected ${this.actual} not to be less than ${expected}`
    );
  }

  toBeLessThanOrEqual(expected: number): void {
    this.assert(
      this.actual <= expected,
      `expected ${this.actual} to be <= ${expected}`,
      `expected ${this.actual} not to be <= ${expected}`
    );
  }

  toBeCloseTo(expected: number, precision = 2): void {
    const multiplier = Math.pow(10, precision);
    const pass = Math.abs(this.actual - expected) < 1 / multiplier;
    this.assert(
      pass,
      `expected ${this.actual} to be close to ${expected}`,
      `expected ${this.actual} not to be close to ${expected}`
    );
  }

  toMatch(expected: string | RegExp): void {
    const pattern = typeof expected === 'string' ? new RegExp(expected) : expected;
    this.assert(
      pattern.test(String(this.actual)),
      `expected "${this.actual}" to match ${pattern}`,
      `expected "${this.actual}" not to match ${pattern}`
    );
  }

  toMatchObject(expected: object): void {
    this.assert(
      this.matchObject(this.actual, expected),
      `expected ${this.format(this.actual)} to match object ${this.format(expected)}`,
      `expected ${this.format(this.actual)} not to match object ${this.format(expected)}`
    );
  }

  toContain(expected: any): void {
    let pass = false;

    if (typeof this.actual === 'string') {
      pass = this.actual.includes(expected);
    } else if (Array.isArray(this.actual)) {
      pass = this.actual.some(item => Object.is(item, expected));
    }

    this.assert(
      pass,
      `expected ${this.format(this.actual)} to contain ${this.format(expected)}`,
      `expected ${this.format(this.actual)} not to contain ${this.format(expected)}`
    );
  }

  toContainEqual(expected: any): void {
    const pass = Array.isArray(this.actual) &&
      this.actual.some(item => this.deepEqual(item, expected));
    this.assert(
      pass,
      `expected array to contain equal ${this.format(expected)}`,
      `expected array not to contain equal ${this.format(expected)}`
    );
  }

  toHaveLength(expected: number): void {
    this.assert(
      this.actual?.length === expected,
      `expected length ${this.actual?.length} to be ${expected}`,
      `expected length not to be ${expected}`
    );
  }

  toHaveProperty(keyPath: string | string[], value?: any): void {
    const path = Array.isArray(keyPath) ? keyPath : keyPath.split('.');
    let current = this.actual;

    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        this.assert(
          false,
          `expected object to have property "${path.join('.')}"`,
          `expected object not to have property "${path.join('.')}"`
        );
        return;
      }
    }

    if (value !== undefined) {
      this.assert(
        this.deepEqual(current, value),
        `expected property "${path.join('.')}" to equal ${this.format(value)}`,
        `expected property "${path.join('.')}" not to equal ${this.format(value)}`
      );
    }
  }

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
        'expected function to throw',
        'expected function not to throw'
      );
      return;
    }

    if (expected === undefined) {
      this.assert(
        !this.isNegated,
        'expected function to throw',
        'expected function not to throw'
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
      `expected error to match ${expected}`,
      `expected error not to match ${expected}`
    );
  }

  toSatisfy(predicate: (value: any) => boolean): void {
    this.assert(
      predicate(this.actual),
      `expected ${this.format(this.actual)} to satisfy predicate`,
      `expected ${this.format(this.actual)} not to satisfy predicate`
    );
  }

  // Mock matchers
  toHaveBeenCalled(): void {
    const calls = this.actual?.mock?.calls || [];
    this.assert(
      calls.length > 0,
      'expected function to have been called',
      'expected function not to have been called'
    );
  }

  toHaveBeenCalledTimes(expected: number): void {
    const actual = this.actual?.mock?.calls?.length || 0;
    this.assert(
      actual === expected,
      `expected function to have been called ${expected} times, but was called ${actual} times`,
      `expected function not to have been called ${expected} times`
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
      `expected function to have been called with ${this.format(args)}`,
      `expected function not to have been called with ${this.format(args)}`
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
      `expected function to have been last called with ${this.format(args)}`,
      `expected function not to have been last called with ${this.format(args)}`
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
      `expected function to have been nth (${n}) called with ${this.format(args)}`,
      `expected function not to have been nth (${n}) called with ${this.format(args)}`
    );
  }

  toHaveReturned(): void {
    const results = this.actual?.mock?.results || [];
    const pass = results.some((r: any) => r.type === 'return');
    this.assert(
      pass,
      'expected function to have returned',
      'expected function not to have returned'
    );
  }

  toHaveReturnedTimes(expected: number): void {
    const results = this.actual?.mock?.results || [];
    const actual = results.filter((r: any) => r.type === 'return').length;
    this.assert(
      actual === expected,
      `expected function to have returned ${expected} times`,
      `expected function not to have returned ${expected} times`
    );
  }

  toHaveReturnedWith(expected: any): void {
    const results = this.actual?.mock?.results || [];
    const pass = results.some((r: any) =>
      r.type === 'return' && this.deepEqual(r.value, expected)
    );
    this.assert(
      pass,
      `expected function to have returned ${this.format(expected)}`,
      `expected function not to have returned ${this.format(expected)}`
    );
  }

  // Snapshot matchers
  toMatchSnapshot(hint?: string): void {
    throw new Error('Snapshot testing not yet implemented');
  }

  toMatchInlineSnapshot(snapshot?: string): void {
    throw new Error('Inline snapshot testing not yet implemented');
  }

  toMatchFileSnapshot(filepath: string): void {
    throw new Error('File snapshot testing not yet implemented');
  }

  private assert(pass: boolean, positiveMessage: string, negativeMessage: string): void {
    const shouldPass = this.isNegated ? !pass : pass;

    if (!shouldPass) {
      const error = new ExpectationError(
        this.isNegated ? negativeMessage : positiveMessage
      );

      if (this.isSoft) {
        this.softErrors.push(error);
      } else {
        throw error;
      }
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

  private strictDeepEqual(a: any, b: any): boolean {
    if (!this.deepEqual(a, b)) return false;
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

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

  private format(value: any): string {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
}

export function expect<T = any>(actual: T): Matchers<void> {
  return new ExpectImpl(actual) as Matchers<void>;
}

expect.soft = function<T = any>(actual: T): Matchers<void> {
  return new ExpectImpl(actual, true) as Matchers<void>;
};

expect.unreachable = function(message?: string): never {
  throw new ExpectationError(message || 'Expected code to be unreachable');
};

expect.extend = function(matchers: any): void {
  // Add custom matchers
};

expect.assertions = function(count: number): void {
  // Track assertion count
};

expect.hasAssertions = function(): void {
  // Ensure assertions are called
};

expect.anything = function(): any {
  return { asymmetricMatch: (val: any) => val !== null && val !== undefined };
};

expect.any = function(constructor: any): any {
  return { asymmetricMatch: (val: any) => val instanceof constructor };
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
