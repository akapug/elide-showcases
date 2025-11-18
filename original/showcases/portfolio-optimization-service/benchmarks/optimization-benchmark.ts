import { PortfolioManager } from '../core/portfolio-manager.js';
import type { Asset } from '../core/types.js';

async function runBenchmark() {
  console.log('📊 Portfolio Optimization Benchmark\n');

  const manager = new PortfolioManager(0.03, 0.25);

  // Create test portfolio
  const assets: Asset[] = [
    { symbol: 'AAPL', quantity: 100, currentPrice: 150, value: 15000, expectedReturn: 0.12 },
    { symbol: 'GOOGL', quantity: 50, currentPrice: 140, value: 7000, expectedReturn: 0.15 },
    { symbol: 'MSFT', quantity: 80, currentPrice: 300, value: 24000, expectedReturn: 0.10 },
    { symbol: 'TSLA', quantity: 40, currentPrice: 200, value: 8000, expectedReturn: 0.18 },
  ];

  console.log('⚡ Portfolio Update Performance');
  console.log('-'.repeat(60));

  const portfolio = manager.createPortfolio('TEST-001', assets);

  const iterations = 10000;
  const prices = new Map([
    ['AAPL', 151],
    ['GOOGL', 142],
    ['MSFT', 302],
    ['TSLA', 198],
  ]);

  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    manager.updateAssetPrices('TEST-001', prices);
    manager.calculateMetrics(portfolio);
  }

  const duration = Date.now() - startTime;
  const updatesPerSecond = (iterations / duration) * 1000;

  console.log(`Updates: ${iterations.toLocaleString()}`);
  console.log(`Duration: ${duration}ms`);
  console.log(`Throughput: ${updatesPerSecond.toFixed(0)} updates/second`);
  console.log(`Avg per update: ${(duration / iterations).toFixed(3)}ms`);

  console.log('\n✅ Benchmark complete!');
}

runBenchmark().catch(console.error);
