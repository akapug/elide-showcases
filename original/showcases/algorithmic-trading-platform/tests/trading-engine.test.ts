import { describe, it, expect, beforeEach } from 'vitest';
import { TradingEngine } from '../core/trading-engine.js';
import type { Strategy, MarketData, TradeSignal } from '../core/types.js';

class TestStrategy implements Strategy {
  name = 'test-strategy';

  async generateSignal(data: MarketData): Promise<TradeSignal | null> {
    if (data.close > data.open) {
      return {
        symbol: data.symbol,
        action: 'BUY',
        confidence: 0.8,
        strategyId: this.name,
      };
    }
    return null;
  }
}

describe('TradingEngine', () => {
  let engine: TradingEngine;

  beforeEach(() => {
    engine = new TradingEngine(10000, 0.01);
  });

  it('should register strategies', () => {
    engine.registerStrategy('test', new TestStrategy());
    expect(engine.getPositions()).toHaveLength(0);
  });

  it('should process market data', async () => {
    engine.registerStrategy('test', new TestStrategy());

    const data: MarketData = {
      symbol: 'AAPL',
      price: 150,
      open: 148,
      high: 152,
      low: 147,
      close: 151,
      volume: 1000000,
      timestamp: Date.now(),
    };

    await engine.processMarketData(data);
    // Processing should complete without error
  });

  it('should track performance', () => {
    const perf = engine.getPerformance();
    expect(perf.totalValue).toBeGreaterThan(0);
    expect(perf.totalPnL).toBeDefined();
  });
});
