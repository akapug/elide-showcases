/**
 * Superagent retry - HTTP Retry Library
 *
 * Add retry logic to HTTP clients with exponential backoff.
 * **POLYGLOT SHOWCASE**: One retry library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/superagent-retry
 *
 * Features:
 * - HTTP retry support
 * - Exponential backoff
 * - Configurable retries
 * - Error handling
 * - Status code filtering
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Works across all Elide languages
 * - Consistent retry patterns
 * - Share retry config everywhere
 * - One implementation for all
 *
 * Package is widely used on npm!
 */

export interface RetryConfig {
  retries?: number;
  retryDelay?: (retryCount: number) => number;
  retryCondition?: (error: any) => boolean;
  shouldResetTimeout?: boolean;
}

export class RetryInterceptor {
  private config: Required<RetryConfig>;

  constructor(config: RetryConfig = {}) {
    this.config = {
      retries: config.retries ?? 3,
      retryDelay: config.retryDelay ?? ((retryCount) => retryCount * 1000),
      retryCondition: config.retryCondition ?? ((error) => true),
      shouldResetTimeout: config.shouldResetTimeout ?? false
    };
  }

  async retry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        if (attempt >= this.config.retries || !this.config.retryCondition(error)) {
          throw error;
        }

        const delay = this.config.retryDelay(attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

export function exponentialDelay(retryNumber: number, delay: number = 100): number {
  const calculatedDelay = Math.pow(2, retryNumber) * delay;
  const randomSum = calculatedDelay * 0.2 * Math.random();
  return calculatedDelay + randomSum;
}

export default { RetryInterceptor, exponentialDelay };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 Superagent retry - HTTP Retry (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Retry ===");
  const interceptor = new RetryInterceptor({ retries: 3 });
  let attempt = 0;

  interceptor.retry(async () => {
    attempt++;
    console.log(`Attempt ${attempt}`);
    if (attempt < 3) {
      throw new Error("Temporary failure");
    }
    return "Success!";
  }).then(result => console.log(result, "\n"));

  setTimeout(() => {
    console.log("=== Example 2: POLYGLOT Use Case ===");
    console.log("🌐 Same superagent-retry works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
  }, 500);
}
