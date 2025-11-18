/**
 * Elide P-Memoize - Memoize Promise-Returning Functions
 *
 * Pure TypeScript implementation of p-memoize.
 *
 * Features:
 * - Memoize async functions
 * - Custom cache key function
 * - TTL support
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-memoize (~5M downloads/week)
 */

export interface MemoizeOptions<T extends (...args: any[]) => any> {
  cacheKey?: (...args: Parameters<T>) => string;
  maxAge?: number;
}

export default function pMemoize<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: MemoizeOptions<T> = {}
): T {
  const cache = new Map<string, { value: any; timestamp: number }>();
  const { cacheKey = (...args) => JSON.stringify(args), maxAge } = options;

  return ((...args: any[]) => {
    const key = cacheKey(...args);
    const cached = cache.get(key);

    if (cached) {
      if (!maxAge || Date.now() - cached.timestamp < maxAge) {
        return Promise.resolve(cached.value);
      }
      cache.delete(key);
    }

    const promise = fn(...args);

    return promise.then(value => {
      cache.set(key, { value, timestamp: Date.now() });
      return value;
    });
  }) as T;
}

export { pMemoize };
