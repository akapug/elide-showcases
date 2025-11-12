/**
 * Async - Utility module for async operations
 * Based on https://www.npmjs.com/package/async (~12M downloads/week)
 */

export async function series<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}

export async function parallel<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
  return Promise.all(tasks.map(task => task()));
}

export async function waterfall<T>(tasks: Array<(arg?: any) => Promise<any>>): Promise<T> {
  let result: any;
  for (const task of tasks) {
    result = await task(result);
  }
  return result;
}

export async function each<T>(arr: T[], iteratee: (item: T) => Promise<void>): Promise<void> {
  for (const item of arr) {
    await iteratee(item);
  }
}

export async function map<T, U>(arr: T[], iteratee: (item: T) => Promise<U>): Promise<U[]> {
  const results: U[] = [];
  for (const item of arr) {
    results.push(await iteratee(item));
  }
  return results;
}

export async function filter<T>(arr: T[], predicate: (item: T) => Promise<boolean>): Promise<T[]> {
  const results: T[] = [];
  for (const item of arr) {
    if (await predicate(item)) {
      results.push(item);
    }
  }
  return results;
}

export async function retry<T>(fn: () => Promise<T>, times: number = 3): Promise<T> {
  for (let i = 0; i < times; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === times - 1) throw error;
    }
  }
  throw new Error('Retry failed');
}

export default { series, parallel, waterfall, each, map, filter, retry };

if (import.meta.url.includes("async.ts")) {
  console.log("⚡ Async - Async utilities for Elide\n");
  console.log("Features: series, parallel, waterfall, each, map, filter, retry");
  console.log("~12M+ downloads/week on npm!");
}
