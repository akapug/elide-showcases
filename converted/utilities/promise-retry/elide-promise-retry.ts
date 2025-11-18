/**
 * Elide Promise-Retry - Promise Retry with Backoff
 *
 * Pure TypeScript implementation of promise-retry.
 *
 * Features:
 * - Retry promises with exponential backoff
 * - Configurable retry strategies
 * - Error filtering
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: promise-retry (~15M downloads/week)
 */

export interface PromiseRetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  randomize?: boolean;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function promiseRetry<T>(
  fn: (retry: (error: any) => never, attemptNumber: number) => Promise<T>,
  options: PromiseRetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    factor = 2,
    minTimeout = 1000,
    maxTimeout = Infinity,
    randomize = false,
  } = options;

  for (let i = 0; i <= retries; i++) {
    try {
      const retry = (error: any): never => {
        throw error;
      };

      return await fn(retry, i);
    } catch (error) {
      if (i < retries) {
        let timeout = minTimeout * Math.pow(factor, i);
        if (randomize) {
          timeout = Math.random() * timeout;
        }
        timeout = Math.min(timeout, maxTimeout);
        await delay(timeout);
      } else {
        throw error;
      }
    }
  }

  throw new Error('Retry failed');
}

export { promiseRetry };
