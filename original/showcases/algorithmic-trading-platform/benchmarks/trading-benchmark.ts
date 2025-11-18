import { TradingEngine } from '../core/trading-engine.js';
import type { MarketData, Strategy, TradeSignal } from '../core/types.js';

class SimpleStrategy implements Strategy {
  name = 'benchmark-strategy';

  async generateSignal(data: MarketData): Promise<TradeSignal | null> {
    // Simple momentum signal
    if (data.close > data.open * 1.02) {
      return {
        symbol: data.symbol,
        action: 'BUY',
        confidence: 0.75,
        strategyId: this.name,
      };
    }
    return null;
  }
}

async function runBenchmark() {
  console.log('📈 Trading Platform Benchmark\n');

  const engine = new TradingEngine(10000, 0.01);
  engine.registerStrategy('benchmark', new SimpleStrategy());

  // Backtest speed
  console.log('⚡ Backtest Performance');
  console.log('-'.repeat(60));

  const bars = 10000;
  const startTime = Date.now();

  for (let i = 0; i < bars; i++) {
    const data: MarketData = {
      symbol: 'AAPL',
      price: 150 + Math.random() * 10,
      open: 150,
      high: 155,
      low: 145,
      close: 152,
      volume: 1000000,
      timestamp: Date.now() + i * 60000,
    };

    await engine.processMarketData(data);
  }

  const duration = Date.now() - startTime;
  const barsPerSecond = (bars / duration) * 1000;

  console.log(`Bars Processed: ${bars.toLocaleString()}`);
  console.log(`Duration: ${duration}ms`);
  console.log(`Throughput: ${barsPerSecond.toFixed(0)} bars/second`);
  console.log(`Avg per bar: ${(duration / bars).toFixed(3)}ms`);

  console.log('\n✅ Benchmark complete!');
}

runBenchmark().catch(console.error);
