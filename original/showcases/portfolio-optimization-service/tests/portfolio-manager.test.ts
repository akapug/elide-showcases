import { describe, it, expect, beforeEach } from 'vitest';
import { PortfolioManager } from '../core/portfolio-manager.js';
import type { Asset } from '../core/types.js';

describe('PortfolioManager', () => {
  let manager: PortfolioManager;

  beforeEach(() => {
    manager = new PortfolioManager(0.03, 0.25);
  });

  it('should create portfolio', () => {
    const assets: Asset[] = [
      { symbol: 'AAPL', quantity: 100, currentPrice: 150, value: 15000 },
      { symbol: 'GOOGL', quantity: 50, currentPrice: 140, value: 7000 },
    ];

    const portfolio = manager.createPortfolio('TEST-001', assets);

    expect(portfolio.id).toBe('TEST-001');
    expect(portfolio.totalValue).toBe(22000);
    expect(portfolio.assets).toHaveLength(2);
  });

  it('should update asset prices', () => {
    const assets: Asset[] = [
      { symbol: 'AAPL', quantity: 100, currentPrice: 150, value: 15000 },
    ];

    manager.createPortfolio('TEST-002', assets);

    const prices = new Map([['AAPL', 160]]);
    const updated = manager.updateAssetPrices('TEST-002', prices);

    expect(updated.assets[0].currentPrice).toBe(160);
    expect(updated.assets[0].value).toBe(16000);
    expect(updated.totalValue).toBe(16000);
  });

  it('should calculate metrics', () => {
    const assets: Asset[] = [
      { symbol: 'AAPL', quantity: 100, currentPrice: 150, value: 15000, expectedReturn: 0.10 },
      { symbol: 'GOOGL', quantity: 50, currentPrice: 140, value: 7000, expectedReturn: 0.15 },
    ];

    const portfolio = manager.createPortfolio('TEST-003', assets);
    const metrics = manager.calculateMetrics(portfolio);

    expect(metrics.expectedReturn).toBeGreaterThan(0);
    expect(metrics.volatility).toBeGreaterThan(0);
    expect(metrics.sharpeRatio).toBeDefined();
  });
});
