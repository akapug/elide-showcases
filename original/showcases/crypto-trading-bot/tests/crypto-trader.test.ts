import { describe, it, expect, beforeEach } from 'vitest';
import { CryptoTrader } from '../core/crypto-trader.js';
import type { MarketTick, TradingSignal } from '../core/types.js';

describe('CryptoTrader', () => {
  let trader: CryptoTrader;

  beforeEach(() => {
    trader = new CryptoTrader(1000, 0.02, 0.03, 0.05);
  });

  it('should process market ticks', async () => {
    const tick: MarketTick = {
      symbol: 'BTC/USDT',
      price: 50000,
      volume: 100,
      timestamp: Date.now(),
    };

    await trader.processMarketTick(tick);
    // Should complete without error
  });

  it('should execute trades', async () => {
    const signal: TradingSignal = {
      symbol: 'BTC/USDT',
      action: 'BUY',
      confidence: 0.8,
      strategyId: 'TEST',
    };

    const trade = await trader.executeTrade(signal, 50000);
    expect(trade).toBeDefined();
    expect(trade?.symbol).toBe('BTC/USDT');
  });

  it('should track positions', async () => {
    const signal: TradingSignal = {
      symbol: 'ETH/USDT',
      action: 'BUY',
      confidence: 0.9,
      strategyId: 'TEST',
    };

    await trader.executeTrade(signal, 3000);

    const position = trader.getPosition('ETH/USDT');
    expect(position).toBeDefined();
    expect(position?.size).toBeGreaterThan(0);
  });

  it('should calculate performance', () => {
    const perf = trader.getPerformance();
    expect(perf.totalTrades).toBeGreaterThanOrEqual(0);
    expect(perf.winRate).toBeGreaterThanOrEqual(0);
    expect(perf.winRate).toBeLessThanOrEqual(1);
  });
});
