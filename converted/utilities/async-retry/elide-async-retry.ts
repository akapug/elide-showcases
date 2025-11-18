/**
 * Async Retry - Async Retry with Exponential Backoff
 *
 * Retry async functions with exponential backoff and full error recovery.
 * **POLYGLOT SHOWCASE**: One async retry library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/async-retry (~1M+ downloads/week)
 *
 * Features:
 * - Exponential backoff
 * - Retry failed async operations
 * - Configurable retry attempts
 * - Custom retry strategies
 * - Error tracking
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need async retry
 * - ONE implementation works everywhere on Elide
 * - Consistent error handling across languages
 * - Share retry config across your stack
 *
 * Use cases:
 * - API calls with retry
 * - Database operations
 * - Network requests
 * - Microservice communication
 *
 * Package has ~1M+ downloads/week on npm - essential async utility!
 */

export interface AsyncRetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  randomize?: boolean;
  onRetry?: (err: Error, attempt: number) => void;
}

export class AsyncRetryError extends Error {
  constructor(message: string, public attempts: number) {
    super(message);
    this.name = 'AsyncRetryError';
  }
}

export default async function asyncRetry<T>(
  fn: (bail: (err: Error) => void, attempt: number) => Promise<T>,
  options: AsyncRetryOptions = {}
): Promise<T> {
  const {
    retries = 10,
    factor = 2,
    minTimeout = 1000,
    maxTimeout = Infinity,
    randomize = false,
    onRetry
  } = options;

  let attempt = 0;
  let bailError: Error | null = null;

  const bail = (err: Error) => {
    bailError = err;
    throw err;
  };

  while (attempt < retries) {
    try {
      attempt++;
      return await fn(bail, attempt);
    } catch (err: any) {
      if (bailError) {
        throw bailError;
      }

      if (attempt >= retries) {
        throw new AsyncRetryError(
          `Failed after ${attempt} attempts: ${err.message}`,
          attempt
        );
      }

      if (onRetry) {
        onRetry(err, attempt);
      }

      let timeout = minTimeout * Math.pow(factor, attempt - 1);
      if (randomize) {
        timeout = timeout * (Math.random() + 1);
      }
      timeout = Math.min(timeout, maxTimeout);

      await new Promise(resolve => setTimeout(resolve, timeout));
    }
  }

  throw new Error('Retry limit exceeded');
}

export { asyncRetry };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 Async Retry - Retry with Exponential Backoff (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Async Retry ===");
  let attempt1 = 0;

  asyncRetry(async (bail, attempt) => {
    attempt1++;
    console.log(`Attempt ${attempt}`);
    if (attempt1 < 3) {
      throw new Error("Temporary failure");
    }
    console.log("Success!\n");
    return "done";
  }, {
    retries: 5,
    minTimeout: 100,
    maxTimeout: 1000
  }).catch(err => console.log("Failed:", err.message));

  setTimeout(async () => {
    console.log("=== Example 2: With onRetry Callback ===");
    let attempt2 = 0;

    try {
      await asyncRetry(async (bail, attempt) => {
        attempt2++;
        if (attempt2 < 3) {
          throw new Error(`Error on attempt ${attempt2}`);
        }
        return "success";
      }, {
        retries: 5,
        minTimeout: 100,
        onRetry: (err, attempt) => {
          console.log(`Retry ${attempt}: ${err.message}`);
        }
      });
      console.log("Operation succeeded!\n");
    } catch (err: any) {
      console.log("Failed:", err.message, "\n");
    }

    console.log("=== Example 3: Bail on Fatal Error ===");
    let attempt3 = 0;

    try {
      await asyncRetry(async (bail, attempt) => {
        attempt3++;
        console.log(`Attempt ${attempt3}`);
        if (attempt3 === 2) {
          console.log("Fatal error - bailing");
          bail(new Error("Fatal error"));
          return;
        }
        throw new Error("Temporary error");
      }, { retries: 5, minTimeout: 100 });
    } catch (err: any) {
      console.log("Bailed:", err.message, "\n");
    }

    console.log("=== Example 4: POLYGLOT Use Case ===");
    console.log("🌐 Same async-retry library works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
  }, 200);
}
