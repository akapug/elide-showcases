/**
 * Elide P-Timeout - Timeout for Promises
 *
 * Pure TypeScript implementation of p-timeout for adding timeouts to promises.
 *
 * Features:
 * - Add timeout to any promise
 * - Custom timeout error messages
 * - Fallback values on timeout
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-timeout (~15M downloads/week)
 */

export class TimeoutError extends Error {
  constructor(message: string = 'Promise timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export interface PTimeoutOptions<T> {
  message?: string;
  fallback?: () => T | Promise<T>;
}

export default function pTimeout<T>(
  promise: Promise<T>,
  ms: number,
  options: PTimeoutOptions<T> = {}
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(async () => {
      if (options.fallback) {
        try {
          resolve(await options.fallback());
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new TimeoutError(options.message || `Promise timed out after ${ms}ms`));
      }
    }, ms);

    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export { pTimeout };
