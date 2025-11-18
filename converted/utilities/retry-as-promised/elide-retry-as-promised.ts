/**
 * Retry As Promised - Retry Promises with Backoff
 *
 * Retry promises with configurable backoff strategies.
 * **POLYGLOT SHOWCASE**: One promise retry library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/retry-as-promised (~200K+ downloads/week)
 *
 * Features:
 * - Promise retry support
 * - Configurable backoff
 * - Max retry attempts
 * - Error tracking
 * - Timeout support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Works across all Elide languages
 * - Consistent retry patterns
 * - Share retry config
 * - One implementation everywhere
 *
 * Use cases:
 * - Database operations
 * - API calls
 * - Network requests
 * - External services
 *
 * Package has ~200K+ downloads/week on npm!
 */

export interface RetryAsPromisedOptions {
  max?: number;
  timeout?: number;
  match?: Array<typeof Error | RegExp>;
  backoffBase?: number;
  backoffExponent?: number;
  report?: (message: string, options: any) => void;
  name?: string;
}

export default function retryAsPromised<T>(
  callback: () => Promise<T>,
  options: RetryAsPromisedOptions = {}
): Promise<T> {
  const {
    max = 5,
    timeout = undefined,
    match = [],
    backoffBase = 100,
    backoffExponent = 1.1,
    report,
    name = 'unknown'
  } = options;

  let tries = 0;

  const run = async (): Promise<T> => {
    tries++;

    try {
      if (timeout !== undefined) {
        return await Promise.race([
          callback(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
          )
        ]);
      }
      return await callback();
    } catch (err: any) {
      if (match.length > 0) {
        const matches = match.some(matcher => {
          if (matcher instanceof RegExp) {
            return matcher.test(err.message);
          }
          return err instanceof matcher;
        });

        if (!matches) {
          throw err;
        }
      }

      if (tries >= max) {
        if (report) {
          report(`Failed after ${tries} attempts`, { name, tries });
        }
        throw err;
      }

      const delay = Math.pow(backoffExponent, tries) * backoffBase;

      if (report) {
        report(`Retry ${tries}/${max} after ${delay}ms`, { name, tries, delay });
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      return run();
    }
  };

  return run();
}

export { retryAsPromised };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 Retry As Promised - Promise Retry (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Retry ===");
  let attempt1 = 0;

  retryAsPromised(async () => {
    attempt1++;
    console.log(`Attempt ${attempt1}`);
    if (attempt1 < 3) {
      throw new Error("Temporary failure");
    }
    return "Success!";
  }, { max: 5, backoffBase: 100 })
    .then(result => console.log(result, "\n"))
    .catch(err => console.log("Failed:", err.message));

  setTimeout(async () => {
    console.log("=== Example 2: With Reporting ===");
    let attempt2 = 0;

    try {
      await retryAsPromised(async () => {
        attempt2++;
        if (attempt2 < 3) {
          throw new Error("Error");
        }
        return "success";
      }, {
        max: 5,
        backoffBase: 100,
        name: 'api-call',
        report: (message, options) => {
          console.log(`[${options.name}] ${message}`);
        }
      });
      console.log("Operation succeeded!\n");
    } catch (err: any) {
      console.log("Failed:", err.message, "\n");
    }

    console.log("=== Example 3: POLYGLOT Use Case ===");
    console.log("🌐 Same retry-as-promised works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
  }, 500);
}
