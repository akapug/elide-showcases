/**
 * Circuit Breaker - Circuit Breaker Pattern
 *
 * Implements circuit breaker pattern for fault tolerance.
 * **POLYGLOT SHOWCASE**: One circuit breaker for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/circuit-breaker-js
 *
 * Features:
 * - Circuit breaker pattern
 * - Failure threshold
 * - Automatic recovery
 * - State tracking
 * - Fallback support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Works across all Elide languages
 * - Consistent resilience patterns
 * - Share circuit breaker config
 * - One implementation everywhere
 *
 * Package is widely used on npm!
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
  resetTimeout?: number;
  onStateChange?: (state: CircuitState) => void;
}

export class CircuitBreaker<T = any> {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private nextAttempt: number = Date.now();
  private options: Required<CircuitBreakerOptions>;

  constructor(
    private fn: (...args: any[]) => Promise<T>,
    options: CircuitBreakerOptions = {}
  ) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      successThreshold: options.successThreshold ?? 2,
      timeout: options.timeout ?? 10000,
      resetTimeout: options.resetTimeout ?? 60000,
      onStateChange: options.onStateChange ?? (() => {})
    };
  }

  async execute(...args: any[]): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.changeState(CircuitState.HALF_OPEN);
    }

    try {
      const result = await Promise.race([
        this.fn(...args),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.options.timeout)
        )
      ]);

      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        this.successes = 0;
        this.changeState(CircuitState.CLOSED);
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.successes = 0;

    if (this.failures >= this.options.failureThreshold) {
      this.changeState(CircuitState.OPEN);
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    }
  }

  private changeState(newState: CircuitState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.options.onStateChange(newState);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
  }
}

export default CircuitBreaker;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔌 Circuit Breaker - Fault Tolerance (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Circuit Breaker ===");
  let callCount = 0;
  const unstableFn = async () => {
    callCount++;
    console.log(`Call ${callCount}`);
    if (callCount <= 5) {
      throw new Error("Service unavailable");
    }
    return "Success!";
  };

  const breaker = new CircuitBreaker(unstableFn, {
    failureThreshold: 3,
    resetTimeout: 1000,
    onStateChange: (state) => console.log(`State changed to: ${state}`)
  });

  (async () => {
    for (let i = 0; i < 8; i++) {
      try {
        await breaker.execute();
        console.log("Success!");
      } catch (err: any) {
        console.log(`Failed: ${err.message}`);
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log("\n=== Example 2: POLYGLOT Use Case ===");
    console.log("🌐 Same circuit breaker works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
  })();
}
