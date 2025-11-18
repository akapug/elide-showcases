import { CryptoTrader } from '../core/crypto-trader.js';
import type { MarketTick, TradingSignal } from '../core/types.js';

async function runBenchmark() {
  console.log('₿ Crypto Trading Bot Benchmark\n');

  const trader = new CryptoTrader(1000, 0.02, 0.03, 0.05);

  console.log('⚡ Order Execution Performance');
  console.log('-'.repeat(60));

  const iterations = 10000;
  const latencies: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const tick: MarketTick = {
      symbol: 'BTC/USDT',
      price: 50000 + Math.random() * 1000,
      volume: 100,
      timestamp: Date.now(),
    };

    const start = process.hrtime.bigint();
    await trader.processMarketTick(tick);
    const end = process.hrtime.bigint();

    const latencyMs = Number(end - start) / 1_000_000;
    latencies.push(latencyMs);
  }

  latencies.sort((a, b) => a - b);
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.50)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];

  console.log(`Iterations: ${iterations.toLocaleString()}`);
  console.log(`Average:    ${avg.toFixed(3)}ms`);
  console.log(`Median:     ${p50.toFixed(3)}ms`);
  console.log(`P95:        ${p95.toFixed(3)}ms`);
  console.log(`P99:        ${p99.toFixed(3)}ms`);

  const sub50ms = latencies.filter(l => l < 50).length;
  console.log(`\n✅ Sub-50ms Success Rate: ${((sub50ms / iterations) * 100).toFixed(2)}%`);

  if (avg < 10) {
    console.log('🏆 EXCELLENT: Average <10ms!');
  } else if (avg < 50) {
    console.log('✅ GOOD: Average <50ms');
  }

  console.log('\n✅ Benchmark complete!');
}

runBenchmark().catch(console.error);
