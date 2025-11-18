import type { Portfolio, Asset, OptimizationRequest, OptimizationResult } from './types.js';

/**
 * Real-Time Portfolio Manager
 * Fast portfolio calculations and rebalancing decisions
 */
export class PortfolioManager {
  private portfolios: Map<string, Portfolio> = new Map();

  constructor(
    private riskFreeRate: number = 0.03,
    private maxPositionWeight: number = 0.25
  ) {}

  createPortfolio(id: string, assets: Asset[]): Portfolio {
    const totalValue = assets.reduce((sum, a) => sum + a.value, 0);

    const portfolio: Portfolio = {
      id,
      assets,
      totalValue,
      expectedReturn: 0,
      volatility: 0,
      sharpeRatio: 0,
      lastRebalance: Date.now(),
    };

    this.portfolios.set(id, portfolio);
    return portfolio;
  }

  updateAssetPrices(portfolioId: string, prices: Map<string, number>): Portfolio {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) throw new Error('Portfolio not found');

    // Update asset values
    portfolio.assets.forEach(asset => {
      const newPrice = prices.get(asset.symbol);
      if (newPrice) {
        asset.currentPrice = newPrice;
        asset.value = asset.quantity * newPrice;
      }
    });

    portfolio.totalValue = portfolio.assets.reduce((sum, a) => sum + a.value, 0);

    return portfolio;
  }

  calculateMetrics(portfolio: Portfolio): {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
  } {
    // Simplified metrics (would use historical covariance in production)
    const weights = portfolio.assets.map(a => a.value / portfolio.totalValue);
    const returns = portfolio.assets.map(a => a.expectedReturn || 0.08);

    const expectedReturn = weights.reduce((sum, w, i) => sum + w * returns[i], 0);

    // Simplified volatility calculation
    const volatility = Math.sqrt(
      weights.reduce((sum, w) => sum + w * w * 0.15 * 0.15, 0)
    );

    const sharpeRatio = (expectedReturn - this.riskFreeRate) / volatility;

    return { expectedReturn, volatility, sharpeRatio };
  }

  needsRebalancing(
    portfolio: Portfolio,
    targetWeights: Map<string, number>,
    threshold: number = 0.05
  ): boolean {
    const currentWeights = new Map(
      portfolio.assets.map(a => [a.symbol, a.value / portfolio.totalValue])
    );

    for (const [symbol, targetWeight] of targetWeights) {
      const currentWeight = currentWeights.get(symbol) || 0;
      if (Math.abs(currentWeight - targetWeight) > threshold) {
        return true;
      }
    }

    return false;
  }

  generateRebalancingOrders(
    portfolio: Portfolio,
    targetWeights: Map<string, number>
  ): Array<{ symbol: string; action: 'BUY' | 'SELL'; quantity: number; value: number }> {
    const orders: Array<{ symbol: string; action: 'BUY' | 'SELL'; quantity: number; value: number }> = [];

    for (const asset of portfolio.assets) {
      const currentWeight = asset.value / portfolio.totalValue;
      const targetWeight = targetWeights.get(asset.symbol) || 0;
      const weightDiff = targetWeight - currentWeight;

      if (Math.abs(weightDiff) > 0.01) {
        // 1% threshold
        const valueDiff = weightDiff * portfolio.totalValue;
        const quantityDiff = Math.floor(valueDiff / asset.currentPrice);

        if (quantityDiff !== 0) {
          orders.push({
            symbol: asset.symbol,
            action: quantityDiff > 0 ? 'BUY' : 'SELL',
            quantity: Math.abs(quantityDiff),
            value: Math.abs(valueDiff),
          });
        }
      }
    }

    return orders;
  }

  getPortfolio(id: string): Portfolio | undefined {
    return this.portfolios.get(id);
  }

  getAllPortfolios(): Portfolio[] {
    return Array.from(this.portfolios.values());
  }
}
