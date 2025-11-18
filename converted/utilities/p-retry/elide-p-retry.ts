/**
 * P-Retry - Promise Retry with Exponential Backoff
 *
 * Retry a promise-returning or async function with exponential backoff.
 * **POLYGLOT SHOWCASE**: One promise retry library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/p-retry (~1M+ downloads/week)
 *
 * Features:
 * - Exponential backoff
 * - Retry promises
 * - Abort retries
 * - Custom retry logic
 * - Timeout support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need promise retry
 * - ONE implementation works everywhere on Elide
 * - Consistent async patterns across languages
 * - Share retry logic across your stack
 *
 * Use cases:
 * - HTTP requests
 * - Database queries
 * - External API calls
 * - Network operations
 *
 * Package has ~1M+ downloads/week on npm!
 */

export class AbortError extends Error {
  readonly name = 'AbortError';
  readonly originalError: Error;

  constructor(message: string | Error) {
    super();
    if (message instanceof Error) {
      this.originalError = message;
      ({message} = message);
    } else {
      this.originalError = new Error(message);
      this.originalError.stack = this.stack;
    }
    this.message = message;
  }
}

export interface Options {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  randomize?: boolean;
  onFailedAttempt?: (error: FailedAttemptError) => void | Promise<void>;
}

export interface FailedAttemptError extends Error {
  attemptNumber: number;
  retriesLeft: number;
}

export default async function pRetry<T>(
  input: (attemptCount: number) => PromiseLike<T> | T,
  options?: Options
): Promise<T> {
  const {
    retries = 10,
    factor = 2,
    minTimeout = 1000,
    maxTimeout = Infinity,
    randomize = false,
    onFailedAttempt
  } = options || {};

  let attemptNumber = 0;

  while (attemptNumber < retries + 1) {
    try {
      attemptNumber++;
      return await input(attemptNumber);
    } catch (error: any) {
      if (error instanceof AbortError) {
        throw error.originalError;
      }

      const retriesLeft = retries - attemptNumber;

      if (retriesLeft === 0) {
        throw error;
      }

      const failedError = Object.assign(error, {
        attemptNumber,
        retriesLeft
      }) as FailedAttemptError;

      if (onFailedAttempt) {
        await onFailedAttempt(failedError);
      }

      let timeout = minTimeout * Math.pow(factor, attemptNumber - 1);
      if (randomize) {
        timeout = timeout * (Math.random() + 1);
      }
      timeout = Math.min(timeout, maxTimeout);

      await new Promise(resolve => setTimeout(resolve, timeout));
    }
  }

  throw new Error('Retry limit exceeded');
}

export { pRetry };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 P-Retry - Promise Retry (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Promise Retry ===");
  let attempt1 = 0;

  pRetry(async (attemptCount) => {
    attempt1++;
    console.log(`Attempt ${attemptCount}`);
    if (attempt1 < 3) {
      throw new Error("Temporary failure");
    }
    console.log("Success!\n");
    return "done";
  }, {
    retries: 5,
    minTimeout: 100
  }).catch(err => console.log("Failed:", err.message));

  setTimeout(async () => {
    console.log("=== Example 2: With onFailedAttempt ===");
    let attempt2 = 0;

    try {
      await pRetry(async (attemptCount) => {
        attempt2++;
        if (attempt2 < 3) {
          throw new Error(`Failed attempt ${attempt2}`);
        }
        return "success";
      }, {
        retries: 5,
        minTimeout: 100,
        onFailedAttempt: (error) => {
          console.log(`Attempt ${error.attemptNumber} failed, ${error.retriesLeft} retries left`);
        }
      });
      console.log("Operation succeeded!\n");
    } catch (err: any) {
      console.log("Failed:", err.message, "\n");
    }

    console.log("=== Example 3: Abort Error ===");
    let attempt3 = 0;

    try {
      await pRetry(async (attemptCount) => {
        attempt3++;
        console.log(`Attempt ${attemptCount}`);
        if (attempt3 === 2) {
          console.log("Fatal error - aborting");
          throw new AbortError("Fatal error");
        }
        throw new Error("Temporary error");
      }, { retries: 5, minTimeout: 100 });
    } catch (err: any) {
      console.log("Aborted:", err.message, "\n");
    }

    console.log("=== Example 4: POLYGLOT Use Case ===");
    console.log("🌐 Same p-retry library works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
  }, 200);
}
