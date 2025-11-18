/**
 * Elide P-Throttle - Throttle Promise-Returning Functions
 *
 * Pure TypeScript implementation of p-throttle.
 *
 * Features:
 * - Throttle async functions
 * - Rate limiting
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-throttle (~3M downloads/week)
 */

export interface ThrottleOptions {
  limit: number;
  interval: number;
}

export default function pThrottle(options: ThrottleOptions) {
  const { limit, interval } = options;
  const queue: Array<() => void> = [];
  let activeCount = 0;

  const processQueue = () => {
    if (activeCount < limit && queue.length > 0) {
      const fn = queue.shift()!;
      activeCount++;
      fn();

      setTimeout(() => {
        activeCount--;
        processQueue();
      }, interval);
    }
  };

  return <T extends (...args: any[]) => Promise<any>>(fn: T): T => {
    return ((...args: any[]) => {
      return new Promise((resolve, reject) => {
        queue.push(async () => {
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
        processQueue();
      });
    }) as T;
  };
}

export { pThrottle };
