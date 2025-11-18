/**
 * Retry - Retry Operations
 *
 * Abstraction for exponential and custom retry strategies for failed operations.
 * **POLYGLOT SHOWCASE**: One retry library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/retry (~2M+ downloads/week)
 *
 * Features:
 * - Exponential backoff
 * - Custom retry strategies
 * - Configurable timeouts
 * - Max attempts
 * - Random jitter
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need retry logic
 * - ONE implementation works everywhere on Elide
 * - Consistent error handling across languages
 * - Share retry strategies across your stack
 *
 * Use cases:
 * - Network requests (HTTP, database)
 * - External API calls
 * - File system operations
 * - Distributed systems
 *
 * Package has ~2M+ downloads/week on npm - essential resilience utility!
 */

export interface RetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  randomize?: boolean;
}

export class RetryOperation {
  private options: Required<RetryOptions>;
  private attempts: number = 0;
  private timeouts: number[] = [];

  constructor(options: RetryOptions = {}) {
    this.options = {
      retries: options.retries ?? 10,
      factor: options.factor ?? 2,
      minTimeout: options.minTimeout ?? 1000,
      maxTimeout: options.maxTimeout ?? Infinity,
      randomize: options.randomize ?? false,
    };

    this.createTimeouts();
  }

  private createTimeouts(): void {
    const { retries, factor, minTimeout, maxTimeout, randomize } = this.options;

    for (let i = 0; i < retries; i++) {
      let timeout = minTimeout * Math.pow(factor, i);
      if (randomize) {
        timeout = timeout * (Math.random() + 1);
      }
      this.timeouts.push(Math.min(timeout, maxTimeout));
    }
  }

  attempt<T>(fn: (bail: (err: Error) => void) => Promise<T> | T): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const bail = (err: Error) => {
        reject(err);
      };

      const tryOnce = async (): Promise<void> => {
        try {
          const result = await fn(bail);
          resolve(result);
        } catch (err) {
          if (this.attempts >= this.options.retries) {
            reject(err);
            return;
          }

          const timeout = this.timeouts[this.attempts];
          this.attempts++;

          setTimeout(() => {
            tryOnce();
          }, timeout);
        }
      };

      tryOnce();
    });
  }

  retry(err?: Error): boolean {
    if (this.attempts >= this.options.retries) {
      return false;
    }
    this.attempts++;
    return true;
  }

  mainError(): Error | null {
    return null;
  }

  errors(): Error[] {
    return [];
  }

  reset(): void {
    this.attempts = 0;
  }

  stop(): void {
    this.attempts = this.options.retries;
  }
}

export function operation(options?: RetryOptions): RetryOperation {
  return new RetryOperation(options);
}

export function retry<T>(
  options: RetryOptions,
  fn: () => Promise<T> | T
): Promise<T> {
  const op = operation(options);
  return op.attempt(() => fn());
}

export default { operation, retry, RetryOperation };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 Retry - Retry Operations for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Retry ===");
  let attempt1 = 0;
  const op1 = operation({ retries: 3, minTimeout: 100, maxTimeout: 500 });

  op1.attempt(async (bail) => {
    attempt1++;
    console.log(`Attempt ${attempt1}`);
    if (attempt1 < 3) {
      throw new Error("Temporary failure");
    }
    console.log("Success!\n");
    return "done";
  }).catch(err => console.log("Failed:", err.message));

  setTimeout(async () => {
    console.log("=== Example 2: Exponential Backoff ===");
    let attempt2 = 0;
    const op2 = operation({
      retries: 5,
      factor: 2,
      minTimeout: 100,
      maxTimeout: 2000
    });

    const startTime = Date.now();
    try {
      await op2.attempt(async () => {
        attempt2++;
        const elapsed = Date.now() - startTime;
        console.log(`Attempt ${attempt2} at ${elapsed}ms`);
        if (attempt2 < 4) {
          throw new Error("Still failing");
        }
        return "success";
      });
      console.log("Operation succeeded!\n");
    } catch (err: any) {
      console.log("Operation failed:", err.message, "\n");
    }

    console.log("=== Example 3: Random Jitter ===");
    let attempt3 = 0;
    const op3 = operation({
      retries: 3,
      minTimeout: 100,
      maxTimeout: 500,
      randomize: true
    });

    const jitterStart = Date.now();
    try {
      await op3.attempt(async () => {
        attempt3++;
        const elapsed = Date.now() - jitterStart;
        console.log(`Attempt ${attempt3} at ${elapsed}ms (random jitter)`);
        if (attempt3 < 3) {
          throw new Error("Failing");
        }
        return "success";
      });
      console.log("Operation succeeded with jitter!\n");
    } catch (err: any) {
      console.log("Failed:", err.message, "\n");
    }

    console.log("=== Example 4: POLYGLOT Use Case ===");
    console.log("🌐 Same retry library works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
    console.log();
    console.log("Benefits:");
    console.log("  ✓ One retry strategy, all languages");
    console.log("  ✓ Consistent error handling everywhere");
    console.log("  ✓ Share retry config across your stack");
    console.log("  ✓ No need for language-specific retry libs");
  }, 100);
}
