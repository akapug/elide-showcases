/**
 * Elide P-Limit - Promise Concurrency Limiter
 *
 * Pure TypeScript implementation of p-limit for controlling promise concurrency.
 *
 * Features:
 * - Limit concurrent promise execution
 * - Queue management
 * - Active count tracking
 * - Pending count tracking
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 * - Tree-shakeable and optimized for modern bundlers
 * - Simple and focused API
 *
 * Original npm package: p-limit (~80M downloads/week)
 */

export interface LimitFunction {
  <T>(fn: () => Promise<T>): Promise<T>;
  activeCount: number;
  pendingCount: number;
  clearQueue(): void;
}

/**
 * Create a promise concurrency limiter
 */
export default function pLimit(concurrency: number): LimitFunction {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new TypeError('Expected `concurrency` to be a number from 1 and up');
  }

  const queue: Array<{
    fn: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;

    if (queue.length > 0) {
      const item = queue.shift()!;
      run(item.fn, item.resolve, item.reject);
    }
  };

  const run = async (
    fn: () => Promise<any>,
    resolve: (value: any) => void,
    reject: (error: any) => void
  ) => {
    activeCount++;

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      next();
    }
  };

  const enqueue = <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      queue.push({ fn, resolve, reject });
    });
  };

  const limit = <T>(fn: () => Promise<T>): Promise<T> => {
    if (activeCount < concurrency) {
      return new Promise((resolve, reject) => {
        run(fn, resolve, reject);
      });
    }

    return enqueue(fn);
  };

  Object.defineProperties(limit, {
    activeCount: {
      get: () => activeCount,
    },
    pendingCount: {
      get: () => queue.length,
    },
  });

  (limit as LimitFunction).clearQueue = () => {
    queue.length = 0;
  };

  return limit as LimitFunction;
}

export { pLimit };
