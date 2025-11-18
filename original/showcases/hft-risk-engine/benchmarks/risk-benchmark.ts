import { RiskEngine } from '../core/risk-engine.js';
import type { Order, RiskLimits } from '../core/types.js';

/**
 * Comprehensive Risk Engine Benchmark
 * Target: <1ms per check (ideally <500μs)
 */

const limits: RiskLimits = {
  maxPositionSize: 1000000,
  maxOrderValue: 100000,
  maxPortfolioValue: 10000000,
  maxLeverage: 10,
  maxConcentration: 30,
  maxDailyLoss: 100000,
  maxOrdersPerSecond: 100,
  priceDeviationThreshold: 0.05,
};

function generateRandomOrder(index: number): Order {
  return {
    orderId: `ORD-${Date.now()}-${index}`,
    symbol: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'][Math.floor(Math.random() * 5)],
    side: Math.random() > 0.5 ? 'BUY' : 'SELL',
    quantity: Math.floor(Math.random() * 1000) + 100,
    price: Math.random() * 500 + 50,
    orderType: 'LIMIT',
    timestamp: Date.now(),
    accountId: `ACC-${Math.floor(Math.random() * 10) + 1}`,
    strategyId: `STRAT-${Math.floor(Math.random() * 5) + 1}`,
  };
}

async function runBenchmark() {
  console.log('🚀 HFT Risk Engine Benchmark');
  console.log('=' .repeat(60));
  console.log();

  const engine = new RiskEngine(limits);

  // Warm up
  console.log('Warming up...');
  for (let i = 0; i < 100; i++) {
    await engine.checkOrder(generateRandomOrder(i));
  }
  engine.reset();

  // Single order benchmark
  console.log('📊 Single Order Performance');
  console.log('-'.repeat(60));

  const latencies: number[] = [];
  const iterations = 10000;

  for (let i = 0; i < iterations; i++) {
    const order = generateRandomOrder(i);
    const result = await engine.checkOrder(order);
    latencies.push(result.latencyUs);
  }

  // Calculate statistics
  latencies.sort((a, b) => a - b);
  const sum = latencies.reduce((a, b) => a + b, 0);
  const avg = sum / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.50)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const max = latencies[latencies.length - 1];
  const min = latencies[0];

  console.log(`Iterations: ${iterations.toLocaleString()}`);
  console.log(`Average:    ${avg.toFixed(2)}μs (${(avg / 1000).toFixed(3)}ms)`);
  console.log(`Median:     ${p50.toFixed(2)}μs (${(p50 / 1000).toFixed(3)}ms)`);
  console.log(`P95:        ${p95.toFixed(2)}μs (${(p95 / 1000).toFixed(3)}ms)`);
  console.log(`P99:        ${p99.toFixed(2)}μs (${(p99 / 1000).toFixed(3)}ms)`);
  console.log(`Min:        ${min.toFixed(2)}μs (${(min / 1000).toFixed(3)}ms)`);
  console.log(`Max:        ${max.toFixed(2)}μs (${(max / 1000).toFixed(3)}ms)`);
  console.log();

  // Target check
  const targetUs = 1000; // 1ms target
  const successRate = (latencies.filter(l => l < targetUs).length / latencies.length) * 100;
  console.log(`✅ Sub-1ms Success Rate: ${successRate.toFixed(2)}%`);

  if (avg < 500) {
    console.log('🏆 EXCELLENT: Average <500μs!');
  } else if (avg < 1000) {
    console.log('✅ GOOD: Average <1ms');
  } else {
    console.log('⚠️  NEEDS OPTIMIZATION: Average >1ms');
  }
  console.log();

  // Throughput benchmark
  console.log('📈 Throughput Performance');
  console.log('-'.repeat(60));

  const duration = 5000; // 5 seconds
  const startTime = Date.now();
  let count = 0;

  while (Date.now() - startTime < duration) {
    await engine.checkOrder(generateRandomOrder(count));
    count++;
  }

  const actualDuration = Date.now() - startTime;
  const throughput = (count / actualDuration) * 1000;

  console.log(`Duration:   ${actualDuration}ms`);
  console.log(`Total:      ${count.toLocaleString()} checks`);
  console.log(`Throughput: ${throughput.toLocaleString()} checks/second`);
  console.log();

  // Batch benchmark
  console.log('📦 Batch Processing Performance');
  console.log('-'.repeat(60));

  const batchSizes = [10, 50, 100, 500];

  for (const batchSize of batchSizes) {
    const orders = Array.from({ length: batchSize }, (_, i) => generateRandomOrder(i));

    const batchStart = Date.now();
    await engine.checkOrderBatch(orders);
    const batchDuration = Date.now() - batchStart;

    const perOrderMs = batchDuration / batchSize;

    console.log(`Batch Size: ${batchSize.toString().padStart(3)}`);
    console.log(`  Total:    ${batchDuration}ms`);
    console.log(`  Per Order: ${perOrderMs.toFixed(3)}ms`);
    console.log();
  }

  // Metrics summary
  console.log('📊 Final Metrics');
  console.log('-'.repeat(60));
  const metrics = engine.getMetrics();
  console.log(`Total Checks:    ${metrics.totalChecks.toLocaleString()}`);
  console.log(`Approved:        ${metrics.approvedChecks.toLocaleString()} (${((metrics.approvedChecks / metrics.totalChecks) * 100).toFixed(2)}%)`);
  console.log(`Rejected:        ${metrics.rejectedChecks.toLocaleString()} (${((metrics.rejectedChecks / metrics.totalChecks) * 100).toFixed(2)}%)`);
  console.log();

  console.log('✅ Benchmark complete!');
}

runBenchmark().catch(console.error);
