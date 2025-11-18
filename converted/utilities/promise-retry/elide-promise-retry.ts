/**
 * Promise Retry - Retry Promise-Based Operations
 *
 * Retries promise-based operations with various backoff strategies.
 * **POLYGLOT SHOWCASE**: One promise retry library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/promise-retry (~1M+ downloads/week)
 *
 * Features:
 * - Promise retry support
 * - Multiple backoff strategies
 * - Error handling
 * - Configurable attempts
 * - Retry tracking
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Works across all Elide languages
 * - Consistent retry patterns
 * - Share retry config
 * - One implementation everywhere
 *
 * Package has ~1M+ downloads/week on npm!
 */

export interface PromiseRetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  randomize?: boolean;
}

export default function promiseRetry<T>(
  fn: (retry: (err?: Error) => never, attempt: number) => Promise<T>,
  options: PromiseRetryOptions = {}
): Promise<T> {
  const {
    retries = 10,
    factor = 2,
    minTimeout = 1000,
    maxTimeout = Infinity,
    randomize = false
  } = options;

  let attempt = 0;

  const run = async (): Promise<T> => {
    attempt++;

    const retry = (err?: Error): never => {
      throw err || new Error('Retry');
    };

    try {
      return await fn(retry, attempt);
    } catch (err: any) {
      if (attempt >= retries) {
        throw err;
      }

      let timeout = minTimeout * Math.pow(factor, attempt - 1);
      if (randomize) {
        timeout = timeout * (Math.random() + 1);
      }
      timeout = Math.min(timeout, maxTimeout);

      await new Promise(resolve => setTimeout(resolve, timeout));
      return run();
    }
  };

  return run();
}

export { promiseRetry };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 Promise Retry - Promise-Based Retry (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Promise Retry ===");
  let attempt1 = 0;

  promiseRetry(async (retry, attempt) => {
    attempt1++;
    console.log(`Attempt ${attempt}`);
    if (attempt1 < 3) {
      retry(new Error("Temporary failure"));
    }
    return "Success!";
  }, { retries: 5, minTimeout: 100 })
    .then(result => console.log(result, "\n"));

  setTimeout(() => {
    console.log("=== Example 2: POLYGLOT Use Case ===");
    console.log("🌐 Same promise-retry works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
  }, 500);
}
