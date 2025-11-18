/**
 * Elide Retry - Retry Library
 *
 * Pure TypeScript implementation of retry.
 *
 * Features:
 * - Retry failed operations
 * - Multiple retry strategies
 * - Exponential backoff
 * - Jitter support
 *
 * Polyglot Benefits:
 * - Zero dependencies - pure TypeScript
 * - Works in Browser, Node.js, Deno, Bun, and Elide
 * - Type-safe with full TypeScript support
 *
 * Original npm package: retry (~30M downloads/week)
 */

export interface RetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  randomize?: boolean;
}

export class RetryOperation {
  private attempts = 0;
  private options: Required<RetryOptions>;

  constructor(options: RetryOptions = {}) {
    this.options = {
      retries: options.retries ?? 3,
      factor: options.factor ?? 2,
      minTimeout: options.minTimeout ?? 1000,
      maxTimeout: options.maxTimeout ?? Infinity,
      randomize: options.randomize ?? false,
    };
  }

  async attempt<T>(fn: () => Promise<T>): Promise<T> {
    while (true) {
      try {
        return await fn();
      } catch (error) {
        this.attempts++;
        if (this.attempts > this.options.retries) {
          throw error;
        }

        const timeout = this.calculateTimeout();
        await new Promise(resolve => setTimeout(resolve, timeout));
      }
    }
  }

  private calculateTimeout(): number {
    let timeout = this.options.minTimeout * Math.pow(this.options.factor, this.attempts - 1);

    if (this.options.randomize) {
      timeout = Math.random() * timeout;
    }

    return Math.min(timeout, this.options.maxTimeout);
  }
}

export default function retry<T>(
  options: RetryOptions,
  fn: () => Promise<T>
): Promise<T> {
  const operation = new RetryOperation(options);
  return operation.attempt(fn);
}

export { retry };
