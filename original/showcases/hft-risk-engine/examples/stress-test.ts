/**
 * Stress Test for HFT Risk Engine
 *
 * Tests performance under high load to validate sub-millisecond targets
 */

import { RiskEngine } from '../core/risk-engine';
import type { Order, RiskCheckResult } from '../core/types';

// ============================================================================
// Test Configuration
// ============================================================================

interface StressTestConfig {
  duration: number; // milliseconds
  concurrency: number; // concurrent workers
  orderRate: number; // orders per second target
  symbols: string[];
}

interface StressTestResult {
  totalOrders: number;
  duration: number;
  throughput: number;
  latencies: {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  approvalRate: number;
  errors: number;
}

// ============================================================================
// Order Generator
// ============================================================================

class OrderGenerator {
  private orderIdCounter = 0;
  private symbols: string[];
  private accountIds: string[] = ['ACC-001', 'ACC-002', 'ACC-003', 'ACC-004', 'ACC-005'];

  constructor(symbols: string[]) {
    this.symbols = symbols;
  }

  generateOrder(): Order {
    const symbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
    const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const quantity = Math.floor(Math.random() * 1000) + 100;
    const price = 100 + Math.random() * 400; // $100-$500
    const accountId = this.accountIds[Math.floor(Math.random() * this.accountIds.length)];

    return {
      orderId: `ORD-${++this.orderIdCounter}`,
      symbol,
      side,
      quantity,
      price,
      orderType: Math.random() > 0.3 ? 'LIMIT' : 'MARKET',
      timestamp: Date.now(),
      accountId,
    };
  }
}

// ============================================================================
// Latency Tracker
// ============================================================================

class LatencyTracker {
  private latencies: number[] = [];
  private approved = 0;
  private rejected = 0;
  private errors = 0;

  recordLatency(latencyMs: number) {
    this.latencies.push(latencyMs);
  }

  recordApproval(approved: boolean) {
    if (approved) {
      this.approved++;
    } else {
      this.rejected++;
    }
  }

  recordError() {
    this.errors++;
  }

  getStats(): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    approvalRate: number;
    errors: number;
  } {
    if (this.latencies.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        approvalRate: 0,
        errors: 0,
      };
    }

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const count = sorted.length;

    return {
      count,
      min: sorted[0],
      max: sorted[count - 1],
      avg: sorted.reduce((sum, l) => sum + l, 0) / count,
      p50: sorted[Math.floor(count * 0.50)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
      approvalRate: this.approved / (this.approved + this.rejected),
      errors: this.errors,
    };
  }
}

// ============================================================================
// Worker Pool
// ============================================================================

class WorkerPool {
  private riskEngine: RiskEngine;
  private generator: OrderGenerator;
  private tracker: LatencyTracker;
  private running = false;

  constructor(riskEngine: RiskEngine, generator: OrderGenerator, tracker: LatencyTracker) {
    this.riskEngine = riskEngine;
    this.generator = generator;
    this.tracker = tracker;
  }

  async processOrder(): Promise<void> {
    const order = this.generator.generateOrder();
    const start = performance.now();

    try {
      const result = await this.riskEngine.checkOrder(order);
      const latency = performance.now() - start;

      this.tracker.recordLatency(latency);
      this.tracker.recordApproval(result.approved);
    } catch (error) {
      this.tracker.recordError();
      const latency = performance.now() - start;
      this.tracker.recordLatency(latency);
    }
  }

  async start(config: StressTestConfig): Promise<void> {
    this.running = true;
    const startTime = Date.now();
    const endTime = startTime + config.duration;

    const workers: Promise<void>[] = [];

    // Start concurrent workers
    for (let i = 0; i < config.concurrency; i++) {
      workers.push(this.worker(endTime));
    }

    await Promise.all(workers);
    this.running = false;
  }

  private async worker(endTime: number): Promise<void> {
    while (Date.now() < endTime && this.running) {
      await this.processOrder();

      // Small delay to control rate
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  stop() {
    this.running = false;
  }
}

// ============================================================================
// Stress Test Runner
// ============================================================================

async function runStressTest(config: StressTestConfig): Promise<StressTestResult> {
  console.log(`\n🔥 Starting Stress Test`);
  console.log(`   Duration: ${config.duration}ms`);
  console.log(`   Concurrency: ${config.concurrency} workers`);
  console.log(`   Target Rate: ${config.orderRate} orders/sec`);
  console.log(`   Symbols: ${config.symbols.join(', ')}\n`);

  const riskEngine = new RiskEngine();
  const generator = new OrderGenerator(config.symbols);
  const tracker = new LatencyTracker();
  const pool = new WorkerPool(riskEngine, generator, tracker);

  // Run test
  const startTime = Date.now();
  await pool.start(config);
  const actualDuration = Date.now() - startTime;

  // Get results
  const stats = tracker.getStats();

  const result: StressTestResult = {
    totalOrders: stats.count,
    duration: actualDuration,
    throughput: (stats.count / actualDuration) * 1000,
    latencies: {
      min: stats.min,
      max: stats.max,
      avg: stats.avg,
      p50: stats.p50,
      p95: stats.p95,
      p99: stats.p99,
    },
    approvalRate: stats.approvalRate,
    errors: stats.errors,
  };

  return result;
}

// ============================================================================
// Test Scenarios
// ============================================================================

async function scenario1_LowLoad() {
  console.log('\n' + '='.repeat(70));
  console.log('Scenario 1: Low Load (Baseline)');
  console.log('='.repeat(70));

  const config: StressTestConfig = {
    duration: 5000, // 5 seconds
    concurrency: 2,
    orderRate: 100,
    symbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA'],
  };

  const result = await runStressTest(config);
  printResults(result);
  validateResults(result, { maxP99: 1.0, minThroughput: 50 });
}

async function scenario2_ModerateLoad() {
  console.log('\n' + '='.repeat(70));
  console.log('Scenario 2: Moderate Load');
  console.log('='.repeat(70));

  const config: StressTestConfig = {
    duration: 10000, // 10 seconds
    concurrency: 10,
    orderRate: 1000,
    symbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMD', 'META', 'AMZN'],
  };

  const result = await runStressTest(config);
  printResults(result);
  validateResults(result, { maxP99: 2.0, minThroughput: 500 });
}

async function scenario3_HighLoad() {
  console.log('\n' + '='.repeat(70));
  console.log('Scenario 3: High Load (Stress)');
  console.log('='.repeat(70));

  const config: StressTestConfig = {
    duration: 10000, // 10 seconds
    concurrency: 50,
    orderRate: 5000,
    symbols: [
      'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMD', 'META', 'AMZN',
      'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS',
      'XOM', 'CVX', 'COP', 'SLB',
    ],
  };

  const result = await runStressTest(config);
  printResults(result);
  validateResults(result, { maxP99: 5.0, minThroughput: 2000 });
}

async function scenario4_Extreme() {
  console.log('\n' + '='.repeat(70));
  console.log('Scenario 4: Extreme Load (Maximum Throughput)');
  console.log('='.repeat(70));

  const config: StressTestConfig = {
    duration: 5000, // 5 seconds
    concurrency: 100,
    orderRate: 10000,
    symbols: generateSymbols(50),
  };

  const result = await runStressTest(config);
  printResults(result);
  console.log('\n⚠️  Note: Extreme load may exceed performance targets');
}

// ============================================================================
// Utilities
// ============================================================================

function generateSymbols(count: number): string[] {
  const symbols: string[] = [];
  for (let i = 1; i <= count; i++) {
    symbols.push(`SYM${i.toString().padStart(3, '0')}`);
  }
  return symbols;
}

function printResults(result: StressTestResult) {
  console.log('\n📊 Results:');
  console.log(`   Total Orders: ${result.totalOrders.toLocaleString()}`);
  console.log(`   Duration: ${result.duration}ms`);
  console.log(`   Throughput: ${result.throughput.toFixed(0)} orders/sec`);
  console.log(`   Approval Rate: ${(result.approvalRate * 100).toFixed(1)}%`);
  console.log(`   Errors: ${result.errors}`);

  console.log('\n⏱️  Latency Distribution:');
  console.log(`   Min:  ${result.latencies.min.toFixed(2)}ms`);
  console.log(`   P50:  ${result.latencies.p50.toFixed(2)}ms`);
  console.log(`   Avg:  ${result.latencies.avg.toFixed(2)}ms`);
  console.log(`   P95:  ${result.latencies.p95.toFixed(2)}ms`);
  console.log(`   P99:  ${result.latencies.p99.toFixed(2)}ms`);
  console.log(`   Max:  ${result.latencies.max.toFixed(2)}ms`);
}

function validateResults(result: StressTestResult, targets: { maxP99: number; minThroughput: number }) {
  console.log('\n✅ Validation:');

  // P99 latency check
  if (result.latencies.p99 <= targets.maxP99) {
    console.log(`   ✅ P99 latency: ${result.latencies.p99.toFixed(2)}ms (target: <${targets.maxP99}ms)`);
  } else {
    console.log(`   ❌ P99 latency: ${result.latencies.p99.toFixed(2)}ms (target: <${targets.maxP99}ms)`);
  }

  // Throughput check
  if (result.throughput >= targets.minThroughput) {
    console.log(`   ✅ Throughput: ${result.throughput.toFixed(0)} orders/sec (target: >${targets.minThroughput})`);
  } else {
    console.log(`   ❌ Throughput: ${result.throughput.toFixed(0)} orders/sec (target: >${targets.minThroughput})`);
  }

  // Error rate check (should be 0%)
  const errorRate = result.errors / result.totalOrders;
  if (errorRate === 0) {
    console.log(`   ✅ Error rate: 0%`);
  } else {
    console.log(`   ⚠️  Error rate: ${(errorRate * 100).toFixed(2)}%`);
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('🚀 HFT Risk Engine - Stress Test Suite\n');

  await scenario1_LowLoad();
  await scenario2_ModerateLoad();
  await scenario3_HighLoad();
  await scenario4_Extreme();

  console.log('\n' + '='.repeat(70));
  console.log('\n🏁 All stress tests completed\n');
}

main().catch(console.error);
