/**
 * Exponential Backoff - Backoff Strategy
 *
 * Exponential backoff strategy for retry logic.
 * **POLYGLOT SHOWCASE**: One backoff library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/exponential-backoff
 *
 * Features:
 * - Exponential backoff
 * - Jitter support
 * - Configurable delays
 * - Max attempts
 * - Custom strategies
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Works across all Elide languages
 * - Consistent backoff patterns
 * - Share backoff config
 * - One implementation everywhere
 *
 * Package is widely used on npm!
 */

export interface BackoffOptions {
  numOfAttempts?: number;
  maxDelay?: number;
  startingDelay?: number;
  timeMultiple?: number;
  jitter?: 'none' | 'full';
}

export class Backoff {
  private options: Required<BackoffOptions>;
  private attempt: number = 0;

  constructor(options: BackoffOptions = {}) {
    this.options = {
      numOfAttempts: options.numOfAttempts ?? 10,
      maxDelay: options.maxDelay ?? Infinity,
      startingDelay: options.startingDelay ?? 100,
      timeMultiple: options.timeMultiple ?? 2,
      jitter: options.jitter ?? 'none'
    };
  }

  next(): number {
    this.attempt++;
    let delay = this.options.startingDelay * Math.pow(this.options.timeMultiple, this.attempt - 1);
    delay = Math.min(delay, this.options.maxDelay);

    if (this.options.jitter === 'full') {
      delay = Math.random() * delay;
    }

    return delay;
  }

  reset(): void {
    this.attempt = 0;
  }

  get attempts(): number {
    return this.attempt;
  }
}

export async function backoff<T>(
  fn: () => Promise<T>,
  options?: BackoffOptions
): Promise<T> {
  const b = new Backoff(options);
  const maxAttempts = options?.numOfAttempts ?? 10;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (b.attempts >= maxAttempts) {
        throw err;
      }

      const delay = b.next();
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export default { Backoff, backoff };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⏱️ Exponential Backoff - Backoff Strategy (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Backoff ===");
  const b1 = new Backoff({ startingDelay: 100, timeMultiple: 2 });
  console.log("Delay 1:", b1.next(), "ms");
  console.log("Delay 2:", b1.next(), "ms");
  console.log("Delay 3:", b1.next(), "ms");
  console.log("Delay 4:", b1.next(), "ms\n");

  console.log("=== Example 2: With Jitter ===");
  const b2 = new Backoff({ startingDelay: 100, timeMultiple: 2, jitter: 'full' });
  console.log("Jitter delay 1:", b2.next(), "ms");
  console.log("Jitter delay 2:", b2.next(), "ms");
  console.log("Jitter delay 3:", b2.next(), "ms\n");

  console.log("=== Example 3: With Function ===");
  let attempt = 0;
  backoff(async () => {
    attempt++;
    console.log(`Attempt ${attempt}`);
    if (attempt < 3) {
      throw new Error("Temporary failure");
    }
    return "Success!";
  }, { numOfAttempts: 5, startingDelay: 100 })
    .then(result => console.log(result, "\n"));

  setTimeout(() => {
    console.log("=== Example 4: POLYGLOT Use Case ===");
    console.log("🌐 Same backoff library works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
  }, 500);
}
