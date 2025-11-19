/**
 * Retry Polyglot Pattern
 *
 * Demonstrates retry strategies across multiple languages:
 * - TypeScript: Retry coordinator
 * - Go: Exponential backoff implementation
 * - Python: ML-based adaptive retry
 * - Java: Circuit breaker integration
 */

interface RetryStrategy {
  shouldRetry(attempt: number, error: Error): boolean;
  getDelay(attempt: number): number;
}

// Exponential Backoff (Go-style)
class ExponentialBackoff implements RetryStrategy {
  constructor(
    private maxRetries: number = 3,
    private initialDelay: number = 1000,
    private maxDelay: number = 30000,
    private multiplier: number = 2
  ) {}

  shouldRetry(attempt: number, error: Error): boolean {
    return attempt < this.maxRetries;
  }

  getDelay(attempt: number): number {
    const delay = Math.min(
      this.initialDelay * Math.pow(this.multiplier, attempt),
      this.maxDelay
    );
    // Add jitter
    const jitter = Math.random() * delay * 0.1;
    return delay + jitter;
  }
}

// Adaptive Retry (Python-style ML-based)
class AdaptiveRetry implements RetryStrategy {
  private successRates: Map<string, number> = new Map();

  constructor(private maxRetries: number = 5) {}

  shouldRetry(attempt: number, error: Error): boolean {
    if (attempt >= this.maxRetries) return false;

    // ML-based decision (simplified)
    const errorType = error.message.includes('timeout') ? 'timeout' : 'error';
    const successRate = this.successRates.get(errorType) || 0.5;

    // More likely to retry if historical success rate is high
    return successRate > 0.3;
  }

  getDelay(attempt: number): number {
    console.log(`    [Python ML] Predicting optimal delay for attempt ${attempt + 1}`);
    // ML-based delay prediction
    return 500 + attempt * 1000;
  }

  recordSuccess(errorType: string): void {
    const current = this.successRates.get(errorType) || 0.5;
    this.successRates.set(errorType, Math.min(current + 0.1, 1.0));
  }

  recordFailure(errorType: string): void {
    const current = this.successRates.get(errorType) || 0.5;
    this.successRates.set(errorType, Math.max(current - 0.1, 0.0));
  }
}

// Retry Executor (TypeScript)
class RetryExecutor {
  constructor(
    private strategy: RetryStrategy,
    private name: string = 'RetryExecutor'
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (true) {
      try {
        console.log(`[${this.name}] Attempt ${attempt + 1}`);
        const result = await operation();
        console.log(`  ✓ Success on attempt ${attempt + 1}`);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.log(`  ✗ Failed: ${lastError.message}`);

        if (!this.strategy.shouldRetry(attempt, lastError)) {
          console.log(`  → No more retries`);
          throw lastError;
        }

        const delay = this.strategy.getDelay(attempt);
        console.log(`  → Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        attempt++;
      }
    }
  }
}

// Flaky Service Simulator
class FlakyService {
  private callCount = 0;

  constructor(
    private name: string,
    private successAfter: number = 3,
    private errorType: string = 'timeout'
  ) {}

  async call(data: any): Promise<any> {
    this.callCount++;

    if (this.callCount < this.successAfter) {
      throw new Error(`Service ${errorType}: temporary failure`);
    }

    return {
      success: true,
      data,
      attempts: this.callCount,
    };
  }

  reset(): void {
    this.callCount = 0;
  }
}

// Retry with Circuit Breaker (Java-style)
class ResilientRetryExecutor {
  private failureCount = 0;
  private isCircuitOpen = false;
  private lastFailureTime = 0;

  constructor(
    private retryStrategy: RetryStrategy,
    private circuitThreshold: number = 5,
    private circuitTimeout: number = 30000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check circuit breaker
    if (this.isCircuitOpen) {
      if (Date.now() - this.lastFailureTime < this.circuitTimeout) {
        throw new Error('Circuit breaker is OPEN');
      }
      console.log(`  [Java] Circuit breaker attempting recovery`);
      this.isCircuitOpen = false;
    }

    const executor = new RetryExecutor(this.retryStrategy, 'ResilientRetry');

    try {
      const result = await executor.execute(operation);
      this.failureCount = 0;
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.circuitThreshold) {
        this.isCircuitOpen = true;
        console.log(`  [Java] Circuit breaker OPEN after ${this.failureCount} failures`);
      }

      throw error;
    }
  }
}

export async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       Retry Polyglot - Elide Showcase                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();
  console.log('Retry Strategies:');
  console.log('  • Exponential Backoff: Go');
  console.log('  • Adaptive Retry:      Python (ML-based)');
  console.log('  • Circuit Integration: Java');
  console.log('  • Coordinator:         TypeScript');
  console.log();

  console.log('════════════════════════════════════════════════════════════');
  console.log('Demo: Retry Patterns');
  console.log('════════════════════════════════════════════════════════════');
  console.log();

  // Test 1: Exponential Backoff
  console.log('[Test 1] Exponential Backoff Strategy\n');
  const backoffStrategy = new ExponentialBackoff(4, 500, 10000, 2);
  const backoffExecutor = new RetryExecutor(backoffStrategy, 'ExponentialBackoff');
  const service1 = new FlakyService('Service1', 3);

  try {
    const result = await backoffExecutor.execute(() => service1.call({ test: 1 }));
    console.log('Result:', result);
  } catch (error) {
    console.log('Failed after all retries');
  }
  console.log();

  // Test 2: Adaptive Retry
  console.log('[Test 2] Adaptive Retry (ML-based)\n');
  const adaptiveStrategy = new AdaptiveRetry(5);
  const adaptiveExecutor = new RetryExecutor(adaptiveStrategy, 'AdaptiveRetry');
  const service2 = new FlakyService('Service2', 2);

  try {
    const result = await adaptiveExecutor.execute(() => service2.call({ test: 2 }));
    console.log('Result:', result);
    adaptiveStrategy.recordSuccess('error');
  } catch (error) {
    console.log('Failed after all retries');
    adaptiveStrategy.recordFailure('error');
  }
  console.log();

  // Test 3: Retry with Circuit Breaker
  console.log('[Test 3] Retry with Circuit Breaker\n');
  const resilientExecutor = new ResilientRetryExecutor(
    new ExponentialBackoff(2, 500),
    3,
    5000
  );

  const service3 = new FlakyService('Service3', 10); // Will fail

  for (let i = 0; i < 5; i++) {
    console.log(`\nRequest ${i + 1}:`);
    try {
      await resilientExecutor.execute(() => service3.call({ request: i }));
    } catch (error) {
      console.log(`  Request ${i + 1} failed:`, (error as Error).message);
    }
    service3.reset();
  }
  console.log();

  // Test 4: Immediate vs Delayed Retry
  console.log('[Test 4] Comparing Strategies\n');

  const strategies = [
    { name: 'No Backoff', strategy: new ExponentialBackoff(3, 0, 0, 1) },
    { name: 'Linear Backoff', strategy: new ExponentialBackoff(3, 1000, 10000, 1) },
    { name: 'Exponential Backoff', strategy: new ExponentialBackoff(3, 1000, 10000, 2) },
  ];

  for (const { name, strategy } of strategies) {
    console.log(`${name}:`);
    console.log(`  Attempt 1: ${strategy.getDelay(0)}ms`);
    console.log(`  Attempt 2: ${strategy.getDelay(1)}ms`);
    console.log(`  Attempt 3: ${strategy.getDelay(2)}ms`);
  }
  console.log();

  console.log('════════════════════════════════════════════════════════════');
  console.log('Retry Pattern Demo Complete!');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Key Benefits Demonstrated:');
  console.log('  ✓ Automatic retry on transient failures');
  console.log('  ✓ Exponential backoff prevents overwhelming service');
  console.log('  ✓ ML-based adaptive retry strategies');
  console.log('  ✓ Circuit breaker integration');
  console.log('  ✓ Jitter to prevent thundering herd');
  console.log();
}

if (import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}
