/**
 * Elide Bluebird - Feature-Rich Promise Library
 *
 * Pure TypeScript implementation of Bluebird promise utilities.
 *
 * Features:
 * - Promise utilities and helpers
 * - Promisification of callback-based APIs
 * - Collection methods with concurrency control
 * - Error handling and recovery
 * - Promise inspection and monitoring
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 * - Tree-shakeable and optimized for modern bundlers
 * - Native Promise-compatible
 *
 * Original npm package: bluebird (~20M downloads/week)
 */

export interface Resolver<T> {
  resolve(value: T | PromiseLike<T>): void;
  reject(reason: any): void;
}

export interface Inspector<T> {
  isFulfilled(): boolean;
  isRejected(): boolean;
  isPending(): boolean;
  value(): T | undefined;
  reason(): any;
}

/**
 * Promisify a callback-based function
 */
export function promisify<T>(
  fn: (...args: any[]) => void,
  context?: any
): (...args: any[]) => Promise<T> {
  return function (...args: any[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const callback = (err: any, result: T) => {
        if (err) reject(err);
        else resolve(result);
      };
      fn.apply(context, [...args, callback]);
    });
  };
}

/**
 * Promisify all methods of an object
 */
export function promisifyAll<T extends object>(obj: T): T {
  const result = {} as T;
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'function') {
      (result as any)[key + 'Async'] = promisify(value, obj);
    }
    (result as any)[key] = value;
  }
  return result;
}

/**
 * Map over an array with a promise-returning function
 */
export async function map<T, R>(
  arr: T[],
  mapper: (item: T, index: number) => Promise<R>,
  options?: { concurrency?: number }
): Promise<R[]> {
  const concurrency = options?.concurrency ?? Infinity;

  if (concurrency === Infinity) {
    return Promise.all(arr.map(mapper));
  }

  const results: R[] = new Array(arr.length);
  const executing: Promise<void>[] = [];

  for (let i = 0; i < arr.length; i++) {
    const promise = mapper(arr[i], i).then(result => {
      results[i] = result;
    });

    const executing_promise = promise.then(() => {
      executing.splice(executing.indexOf(executing_promise), 1);
    });

    executing.push(executing_promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Map over an array in series
 */
export async function mapSeries<T, R>(
  arr: T[],
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < arr.length; i++) {
    results.push(await mapper(arr[i], i));
  }
  return results;
}

/**
 * Filter an array with a promise-returning predicate
 */
export async function filter<T>(
  arr: T[],
  predicate: (item: T, index: number) => Promise<boolean>,
  options?: { concurrency?: number }
): Promise<T[]> {
  const results = await map(arr, predicate, options);
  return arr.filter((_, index) => results[index]);
}

/**
 * Reduce an array with a promise-returning function
 */
export async function reduce<T, R>(
  arr: T[],
  reducer: (accumulator: R, item: T, index: number) => Promise<R>,
  initialValue: R
): Promise<R> {
  let accumulator = initialValue;
  for (let i = 0; i < arr.length; i++) {
    accumulator = await reducer(accumulator, arr[i], i);
  }
  return accumulator;
}

/**
 * Iterate over an array with a promise-returning function
 */
export async function each<T>(
  arr: T[],
  iterator: (item: T, index: number) => Promise<void>,
  options?: { concurrency?: number }
): Promise<void> {
  await map(arr, iterator, options);
}

/**
 * Execute promises with a delay between each
 */
export async function delay<T>(ms: number, value?: T): Promise<T | undefined> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

/**
 * Create a promise that resolves after a delay
 */
export function timeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T> {
  return Promise.race([
    promise,
    delay(ms).then(() => {
      throw new Error(message || `Operation timed out after ${ms}ms`);
    }),
  ]) as Promise<T>;
}

/**
 * Settle all promises (like Promise.allSettled)
 */
export async function settle<T>(promises: Array<Promise<T>>): Promise<Array<Inspector<T>>> {
  const results = await Promise.allSettled(promises);
  return results.map(result => ({
    isFulfilled: () => result.status === 'fulfilled',
    isRejected: () => result.status === 'rejected',
    isPending: () => false,
    value: () => result.status === 'fulfilled' ? result.value : undefined,
    reason: () => result.status === 'rejected' ? result.reason : undefined,
  }));
}

/**
 * Resolve a value to a promise
 */
export function resolve<T>(value: T | PromiseLike<T>): Promise<T> {
  return Promise.resolve(value);
}

/**
 * Reject with a reason
 */
export function reject(reason: any): Promise<never> {
  return Promise.reject(reason);
}

/**
 * Execute promises in props object
 */
export async function props<T extends Record<string, any>>(
  obj: { [K in keyof T]: Promise<T[K]> | T[K] }
): Promise<T> {
  const keys = Object.keys(obj);
  const values = await Promise.all(keys.map(key => obj[key]));
  const result = {} as T;
  keys.forEach((key, index) => {
    (result as any)[key] = values[index];
  });
  return result;
}

/**
 * Get the first promise that resolves
 */
export function any<T>(promises: Array<Promise<T>>): Promise<T> {
  return Promise.any(promises);
}

/**
 * Get some resolved promises
 */
export async function some<T>(promises: Array<Promise<T>>, count: number): Promise<T[]> {
  const results: T[] = [];
  const errors: any[] = [];

  return new Promise((resolve, reject) => {
    let completed = 0;

    promises.forEach(promise => {
      promise
        .then(value => {
          results.push(value);
          completed++;
          if (results.length >= count) {
            resolve(results.slice(0, count));
          } else if (completed === promises.length && results.length < count) {
            reject(new Error(`Not enough promises resolved. Expected ${count}, got ${results.length}`));
          }
        })
        .catch(error => {
          errors.push(error);
          completed++;
          if (completed === promises.length && results.length < count) {
            reject(new Error(`Not enough promises resolved. Expected ${count}, got ${results.length}`));
          }
        });
    });
  });
}

/**
 * Tap into a promise chain
 */
export function tap<T>(promise: Promise<T>, handler: (value: T) => void | Promise<void>): Promise<T> {
  return promise.then(async value => {
    await handler(value);
    return value;
  });
}

/**
 * Execute a finally handler
 */
export function finally_<T>(promise: Promise<T>, handler: () => void | Promise<void>): Promise<T> {
  return promise.finally(handler);
}

/**
 * Retry a function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { times?: number; interval?: number } = {}
): Promise<T> {
  const times = options.times ?? 3;
  const interval = options.interval ?? 0;

  let lastError: any;
  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < times - 1 && interval > 0) {
        await delay(interval);
      }
    }
  }
  throw lastError;
}

/**
 * Create a deferred promise
 */
export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason: any) => void;
}

export function defer<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Method chaining class
 */
export class BluebirdPromise<T> extends Promise<T> {
  static resolve<T>(value: T | PromiseLike<T>): BluebirdPromise<T> {
    return new BluebirdPromise((resolve) => resolve(value));
  }

  static reject(reason: any): BluebirdPromise<never> {
    return new BluebirdPromise((_, reject) => reject(reason));
  }

  delay(ms: number): BluebirdPromise<T> {
    return new BluebirdPromise((resolve, reject) => {
      this.then(
        value => setTimeout(() => resolve(value), ms),
        error => reject(error)
      );
    });
  }

  timeout(ms: number, message?: string): BluebirdPromise<T> {
    return new BluebirdPromise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(message || `Operation timed out after ${ms}ms`));
      }, ms);

      this.then(
        value => {
          clearTimeout(timer);
          resolve(value);
        },
        error => {
          clearTimeout(timer);
          reject(error);
        }
      );
    });
  }

  tap(handler: (value: T) => void | Promise<void>): BluebirdPromise<T> {
    return new BluebirdPromise((resolve, reject) => {
      this.then(
        async value => {
          await handler(value);
          resolve(value);
        },
        error => reject(error)
      );
    });
  }
}

// Default export
export default {
  promisify,
  promisifyAll,
  map,
  mapSeries,
  filter,
  reduce,
  each,
  delay,
  timeout,
  settle,
  resolve,
  reject,
  props,
  any,
  some,
  tap,
  finally: finally_,
  retry,
  defer,
  Promise: BluebirdPromise,
};
