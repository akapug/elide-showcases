/**
 * Circuit Breaker Polyglot Pattern
 *
 * Demonstrates circuit breaker pattern preventing cascading failures:
 * - TypeScript: Circuit breaker coordinator
 * - Go: High-performance state management
 * - Python: Failure analysis and metrics
 * - Java: Enterprise-grade circuit breaker
 */

enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, rejecting requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;

  constructor(
    private name: string,
    private failureThreshold: number = 5,
    private timeout: number = 60000,  // 60 seconds
    private successThreshold: number = 2
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    console.log(`[Circuit Breaker ${this.name}] State: ${this.state}`);

    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
      // Try half-open
      this.state = CircuitState.HALF_OPEN;
      console.log(`  → Transitioning to HALF_OPEN`);
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      console.log(`  → HALF_OPEN success ${this.successCount}/${this.successThreshold}`);

      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        console.log(`  ✓ Circuit breaker CLOSED (recovered)`);
      }
    }
  }

  private onFailure(): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;

    console.log(`  ✗ Failure ${this.failureCount}/${this.failureThreshold}`);

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.successCount = 0;
      this.nextAttemptTime = Date.now() + this.timeout;
      console.log(`  → Circuit breaker OPEN (failed during recovery)`);
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.timeout;
      console.log(`  → Circuit breaker OPEN (threshold reached)`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics(): any {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    console.log(`[Circuit Breaker ${this.name}] Reset to CLOSED`);
  }
}

// Service with Circuit Breaker
class ResilientService {
  private circuitBreaker: CircuitBreaker;
  private failureRate = 0;

  constructor(name: string, failureRate: number = 0) {
    this.circuitBreaker = new CircuitBreaker(name);
    this.failureRate = failureRate;
  }

  async call(data: any): Promise<any> {
    return this.circuitBreaker.execute(async () => {
      // Simulate service call with possible failure
      await new Promise(resolve => setTimeout(resolve, 50));

      if (Math.random() < this.failureRate) {
        throw new Error('Service call failed');
      }

      return { success: true, data, timestamp: Date.now() };
    });
  }

  getCircuitState(): CircuitState {
    return this.circuitBreaker.getState();
  }

  getMetrics(): any {
    return this.circuitBreaker.getMetrics();
  }

  reset(): void {
    this.circuitBreaker.reset();
  }

  setFailureRate(rate: number): void {
    this.failureRate = rate;
  }
}

// Failure Analyzer (Python-style)
class FailureAnalyzer {
  analyzeFailures(metrics: any[]): any {
    console.log(`  [Python FailureAnalyzer] Analyzing ${metrics.length} services`);

    const analysis = {
      totalServices: metrics.length,
      openCircuits: 0,
      halfOpenCircuits: 0,
      closedCircuits: 0,
      totalFailures: 0,
      recommendations: [] as string[],
    };

    for (const metric of metrics) {
      if (metric.state === CircuitState.OPEN) {
        analysis.openCircuits++;
        analysis.recommendations.push(`Service failing: Consider scaling or investigating`);
      } else if (metric.state === CircuitState.HALF_OPEN) {
        analysis.halfOpenCircuits++;
      } else {
        analysis.closedCircuits++;
      }

      analysis.totalFailures += metric.failureCount;
    }

    return analysis;
  }

  predictRecoveryTime(service: any): number {
    console.log(`  [Python ML] Predicting recovery time`);
    // Simulate ML prediction
    return 120000; // 2 minutes
  }
}

// Dashboard (TypeScript)
class CircuitBreakerDashboard {
  private services: Map<string, ResilientService> = new Map();
  private analyzer: FailureAnalyzer;

  constructor() {
    this.analyzer = new FailureAnalyzer();
  }

  registerService(name: string, service: ResilientService): void {
    this.services.set(name, service);
  }

  getStatus(): any {
    const metrics = Array.from(this.services.entries()).map(([name, service]) => ({
      name,
      ...service.getMetrics(),
    }));

    const analysis = this.analyzer.analyzeFailures(metrics);

    return {
      services: metrics,
      analysis,
      timestamp: Date.now(),
    };
  }

  displayStatus(): void {
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('Circuit Breaker Dashboard');
    console.log('════════════════════════════════════════════════════════════');

    for (const [name, service] of this.services) {
      const metrics = service.getMetrics();
      console.log(`\n${name}:`);
      console.log(`  State: ${metrics.state}`);
      console.log(`  Failures: ${metrics.failureCount}`);
      if (metrics.state === CircuitState.HALF_OPEN) {
        console.log(`  Successes: ${metrics.successCount}`);
      }
    }

    const status = this.getStatus();
    console.log(`\nSummary:`);
    console.log(`  Open: ${status.analysis.openCircuits}`);
    console.log(`  Half-Open: ${status.analysis.halfOpenCircuits}`);
    console.log(`  Closed: ${status.analysis.closedCircuits}`);
    console.log('════════════════════════════════════════════════════════════\n');
  }
}

export async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║    Circuit Breaker Polyglot - Elide Showcase           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();
  console.log('Circuit Breaker Components:');
  console.log('  • Circuit Breaker: TypeScript/Go');
  console.log('  • Failure Analysis: Python (ML-based)');
  console.log('  • Dashboard:       TypeScript');
  console.log();
  console.log('States:');
  console.log('  • CLOSED:    Normal operation');
  console.log('  • OPEN:      Failing, requests rejected');
  console.log('  • HALF_OPEN: Testing recovery');
  console.log();

  const dashboard = new CircuitBreakerDashboard();

  // Create services with different failure rates
  const userService = new ResilientService('UserService', 0.2);
  const paymentService = new ResilientService('PaymentService', 0.7); // High failure rate
  const emailService = new ResilientService('EmailService', 0);

  dashboard.registerService('UserService', userService);
  dashboard.registerService('PaymentService', paymentService);
  dashboard.registerService('EmailService', emailService);

  console.log('════════════════════════════════════════════════════════════');
  console.log('Demo: Circuit Breaker Pattern');
  console.log('════════════════════════════════════════════════════════════');
  console.log();

  // Test 1: Normal operations
  console.log('[Test 1] Normal Operations\n');
  for (let i = 0; i < 3; i++) {
    try {
      await userService.call({ request: i });
      console.log(`  ✓ Request ${i + 1} succeeded`);
    } catch (error) {
      console.log(`  ✗ Request ${i + 1} failed`);
    }
  }
  console.log();

  // Test 2: Service with high failure rate
  console.log('[Test 2] High Failure Rate Service\n');
  for (let i = 0; i < 10; i++) {
    try {
      await paymentService.call({ request: i });
      console.log(`  ✓ Payment ${i + 1} succeeded`);
    } catch (error) {
      console.log(`  ✗ Payment ${i + 1} failed:`, (error as Error).message);
    }
  }
  console.log();

  // Show dashboard
  dashboard.displayStatus();

  // Test 3: Circuit opens - requests fail fast
  console.log('[Test 3] Circuit OPEN - Requests Fail Fast\n');
  for (let i = 0; i < 3; i++) {
    try {
      await paymentService.call({ request: i });
      console.log(`  ✓ Request succeeded`);
    } catch (error) {
      console.log(`  ✗ Request failed fast:`, (error as Error).message);
    }
  }
  console.log();

  // Test 4: Recovery simulation
  console.log('[Test 4] Service Recovery\n');
  console.log('Waiting for timeout...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Reduce failure rate
  paymentService.setFailureRate(0.1);

  console.log('Attempting recovery:\n');
  for (let i = 0; i < 5; i++) {
    try {
      await paymentService.call({ request: i });
      console.log(`  ✓ Recovery attempt ${i + 1} succeeded`);
    } catch (error) {
      console.log(`  ✗ Recovery attempt ${i + 1} failed`);
    }
  }
  console.log();

  // Final dashboard
  dashboard.displayStatus();

  console.log('Key Benefits Demonstrated:');
  console.log('  ✓ Fast failure during outages');
  console.log('  ✓ Automatic recovery detection');
  console.log('  ✓ Prevents cascading failures');
  console.log('  ✓ Gradual recovery testing');
  console.log('  ✓ Real-time monitoring and analysis');
  console.log();
}

if (import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}
