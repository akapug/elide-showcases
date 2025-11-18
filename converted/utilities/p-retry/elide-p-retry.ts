/**
 * Elide P-Retry - Promise Retry with Backoff
 *
 * Pure TypeScript implementation of p-retry for retrying promises.
 *
 * Features:
 * - Retry failed promises
 * - Configurable retry count
 * - Exponential backoff support
 * - Custom retry conditions
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: p-retry (~15M downloads/week)
 */

export interface PRetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  randomize?: boolean;
  onFailedAttempt?: (error: any) => void | Promise<void>;
}

export class AbortError extends Error {
  readonly originalError: Error;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'AbortError';
    this.originalError = originalError || this;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateDelay(
  attemptNumber: number,
  options: PRetryOptions
): number {
  const {
    factor = 2,
    minTimeout = 1000,
    maxTimeout = Infinity,
    randomize = false,
  } = options;

  let timeout = minTimeout * Math.pow(factor, attemptNumber);

  if (randomize) {
    timeout = Math.random() * timeout;
  }

  return Math.min(timeout, maxTimeout);
}

export default async function pRetry<T>(
  fn: (attemptNumber: number) => Promise<T>,
  options: PRetryOptions = {}
): Promise<T> {
  const { retries = 3, onFailedAttempt } = options;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn(i);
    } catch (error) {
      if (error instanceof AbortError) {
        throw error.originalError;
      }

      if (i < retries) {
        if (onFailedAttempt) {
          await onFailedAttempt(error);
        }

        const delayTime = calculateDelay(i, options);
        await delay(delayTime);
      } else {
        throw error;
      }
    }
  }

  throw new Error('Retry failed');
}

export { pRetry };
