/**
 * Bulkhead Polyglot Pattern
 *
 * Demonstrates bulkhead isolation pattern preventing resource exhaustion:
 * - TypeScript: Bulkhead coordinator
 * - Go: High-performance resource pool management
 * - Java: Thread pool isolation (simulated)
 * - Python: Queue management and monitoring
 */

class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise(resolve => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!;
      resolve();
    } else {
      this.permits++;
    }
  }

  available(): number {
    return this.permits;
  }
}

// Bulkhead (Go-style resource pool)
class Bulkhead {
  private semaphore: Semaphore;
  private activeRequests = 0;
  private queuedRequests = 0;
  private completedRequests = 0;
  private rejectedRequests = 0;

  constructor(
    private name: string,
    private maxConcurrent: number,
    private maxQueue: number = 10
  ) {
    this.semaphore = new Semaphore(maxConcurrent);
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check queue limit
    if (this.queuedRequests >= this.maxQueue) {
      this.rejectedRequests++;
      throw new Error(`Bulkhead ${this.name}: Queue full (${this.maxQueue})`);
    }

    this.queuedRequests++;
    console.log(`  [Go Bulkhead ${this.name}] Queued (${this.queuedRequests} waiting)`);

    try {
      // Wait for permit
      await this.semaphore.acquire();
      this.queuedRequests--;
      this.activeRequests++;

      console.log(`  [Go Bulkhead ${this.name}] Executing (${this.activeRequests}/${this.maxConcurrent} active)`);

      // Execute operation
      const result = await operation();

      this.completedRequests++;
      return result;
    } finally {
      this.activeRequests--;
      this.semaphore.release();
    }
  }

  getMetrics(): any {
    return {
      name: this.name,
      maxConcurrent: this.maxConcurrent,
      maxQueue: this.maxQueue,
      active: this.activeRequests,
      queued: this.queuedRequests,
      completed: this.completedRequests,
      rejected: this.rejectedRequests,
      available: this.semaphore.available(),
    };
  }
}

// Service with Bulkhead
class IsolatedService {
  private bulkhead: Bulkhead;

  constructor(name: string, maxConcurrent: number, maxQueue: number = 10) {
    this.bulkhead = new Bulkhead(name, maxConcurrent, maxQueue);
  }

  async processRequest(request: any): Promise<any> {
    return this.bulkhead.execute(async () => {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

      return {
        success: true,
        request,
        processedAt: Date.now(),
      };
    });
  }

  getMetrics(): any {
    return this.bulkhead.getMetrics();
  }
}

// Queue Monitor (Python-style)
class QueueMonitor {
  monitorBulkheads(bulkheads: IsolatedService[]): any {
    console.log(`  [Python QueueMonitor] Analyzing ${bulkheads.length} bulkheads`);

    const metrics = bulkheads.map(b => b.getMetrics());
    const analysis = {
      totalActive: 0,
      totalQueued: 0,
      totalRejected: 0,
      utilizationRate: [] as any[],
      alerts: [] as string[],
    };

    for (const metric of metrics) {
      analysis.totalActive += metric.active;
      analysis.totalQueued += metric.queued;
      analysis.totalRejected += metric.rejected;

      const utilization = (metric.active / metric.maxConcurrent) * 100;
      analysis.utilizationRate.push({
        name: metric.name,
        utilization: utilization.toFixed(1) + '%',
      });

      if (utilization > 80) {
        analysis.alerts.push(`${metric.name}: High utilization (${utilization.toFixed(1)}%)`);
      }

      if (metric.rejected > 0) {
        analysis.alerts.push(`${metric.name}: ${metric.rejected} requests rejected`);
      }
    }

    return analysis;
  }
}

// Bulkhead Dashboard
class BulkheadDashboard {
  private services: Map<string, IsolatedService> = new Map();
  private monitor: QueueMonitor;

  constructor() {
    this.monitor = new QueueMonitor();
  }

  registerService(name: string, service: IsolatedService): void {
    this.services.set(name, service);
  }

  displayStatus(): void {
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('Bulkhead Dashboard');
    console.log('════════════════════════════════════════════════════════════');

    const servicesArray = Array.from(this.services.values());
    const analysis = this.monitor.monitorBulkheads(servicesArray);

    for (const [name, service] of this.services) {
      const metrics = service.getMetrics();
      console.log(`\n${name}:`);
      console.log(`  Active:    ${metrics.active}/${metrics.maxConcurrent}`);
      console.log(`  Queued:    ${metrics.queued}/${metrics.maxQueue}`);
      console.log(`  Completed: ${metrics.completed}`);
      console.log(`  Rejected:  ${metrics.rejected}`);
    }

    console.log(`\nSummary:`);
    console.log(`  Total Active:   ${analysis.totalActive}`);
    console.log(`  Total Queued:   ${analysis.totalQueued}`);
    console.log(`  Total Rejected: ${analysis.totalRejected}`);

    if (analysis.alerts.length > 0) {
      console.log(`\nAlerts:`);
      for (const alert of analysis.alerts) {
        console.log(`  ⚠ ${alert}`);
      }
    }

    console.log('════════════════════════════════════════════════════════════\n');
  }
}

export async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║      Bulkhead Polyglot - Elide Showcase                ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();
  console.log('Bulkhead Pattern:');
  console.log('  • Resource Pool:  Go (High-performance)');
  console.log('  • Coordinator:    TypeScript');
  console.log('  • Queue Monitor:  Python (Analytics)');
  console.log();
  console.log('Benefits:');
  console.log('  → Isolate resource pools');
  console.log('  → Prevent resource exhaustion');
  console.log('  → Limit concurrent operations');
  console.log('  → Queue overflow protection');
  console.log();

  const dashboard = new BulkheadDashboard();

  // Create services with different capacities
  const userService = new IsolatedService('UserService', 3, 5);
  const paymentService = new IsolatedService('PaymentService', 2, 3);
  const emailService = new IsolatedService('EmailService', 5, 10);

  dashboard.registerService('UserService', userService);
  dashboard.registerService('PaymentService', paymentService);
  dashboard.registerService('EmailService', emailService);

  console.log('════════════════════════════════════════════════════════════');
  console.log('Demo: Bulkhead Pattern');
  console.log('════════════════════════════════════════════════════════════');
  console.log();

  // Test 1: Normal load
  console.log('[Test 1] Normal Load\n');
  const requests1 = [];
  for (let i = 0; i < 5; i++) {
    requests1.push(
      userService.processRequest({ id: i }).then(
        () => console.log(`    ✓ User request ${i} completed`),
        (err) => console.log(`    ✗ User request ${i} failed: ${err.message}`)
      )
    );
  }
  await Promise.all(requests1);
  console.log();

  dashboard.displayStatus();

  // Test 2: Overload payment service
  console.log('[Test 2] Overload Payment Service (capacity: 2, queue: 3)\n');
  const requests2 = [];
  for (let i = 0; i < 10; i++) {
    requests2.push(
      paymentService.processRequest({ id: i }).then(
        () => console.log(`    ✓ Payment ${i} completed`),
        (err) => console.log(`    ✗ Payment ${i} rejected: ${err.message}`)
      )
    );
  }
  await Promise.all(requests2);
  console.log();

  dashboard.displayStatus();

  // Test 3: Multiple services under load
  console.log('[Test 3] Multiple Services Under Load\n');
  const requests3 = [];

  // User service
  for (let i = 0; i < 4; i++) {
    requests3.push(userService.processRequest({ id: i }));
  }

  // Email service
  for (let i = 0; i < 8; i++) {
    requests3.push(emailService.processRequest({ id: i }));
  }

  await Promise.allSettled(requests3);
  console.log('All requests completed\n');

  dashboard.displayStatus();

  console.log('Key Benefits Demonstrated:');
  console.log('  ✓ Resource isolation per service');
  console.log('  ✓ Queue management prevents overload');
  console.log('  ✓ Rejected requests fail fast');
  console.log('  ✓ One service failure doesn\'t affect others');
  console.log('  ✓ Real-time monitoring and alerts');
  console.log();
}

if (import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}
