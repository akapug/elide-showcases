/**
 * Portfolio Risk Management Example
 *
 * Demonstrates portfolio-level risk checks and monitoring
 */

import { RiskEngine } from '../core/risk-engine';
import type { Order, RiskCheckResult } from '../core/types';

// ============================================================================
// Portfolio Position Management
// ============================================================================

interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  marketPrice: number;
  unrealizedPnL: number;
  marketValue: number;
}

interface Portfolio {
  accountId: string;
  positions: Map<string, Position>;
  cash: number;
  totalValue: number;
  leverage: number;
}

class PortfolioManager {
  private portfolios: Map<string, Portfolio> = new Map();

  constructor() {
    // Initialize demo portfolios
    this.initializeDemoPortfolios();
  }

  private initializeDemoPortfolios() {
    // Portfolio 1: Balanced
    this.portfolios.set('ACC-001', {
      accountId: 'ACC-001',
      positions: new Map([
        ['AAPL', { symbol: 'AAPL', quantity: 1000, avgPrice: 150.00, marketPrice: 155.50, unrealizedPnL: 5500, marketValue: 155500 }],
        ['GOOGL', { symbol: 'GOOGL', quantity: 100, avgPrice: 2800.00, marketPrice: 2850.00, unrealizedPnL: 5000, marketValue: 285000 }],
        ['MSFT', { symbol: 'MSFT', quantity: 500, avgPrice: 380.00, marketPrice: 385.00, unrealizedPnL: 2500, marketValue: 192500 }],
      ]),
      cash: 500000,
      totalValue: 1133000,
      leverage: 1.27,
    });

    // Portfolio 2: Concentrated (higher risk)
    this.portfolios.set('ACC-002', {
      accountId: 'ACC-002',
      positions: new Map([
        ['TSLA', { symbol: 'TSLA', quantity: 5000, avgPrice: 220.00, marketPrice: 235.00, unrealizedPnL: 75000, marketValue: 1175000 }],
        ['NVDA', { symbol: 'NVDA', quantity: 200, avgPrice: 450.00, marketPrice: 480.00, unrealizedPnL: 6000, marketValue: 96000 }],
      ]),
      cash: 100000,
      totalValue: 1371000,
      leverage: 2.85,
    });

    // Portfolio 3: High-frequency (low leverage)
    this.portfolios.set('ACC-003', {
      accountId: 'ACC-003',
      positions: new Map([
        ['SPY', { symbol: 'SPY', quantity: 2000, avgPrice: 450.00, marketPrice: 451.50, unrealizedPnL: 3000, marketValue: 903000 }],
        ['QQQ', { symbol: 'QQQ', quantity: 1000, avgPrice: 380.00, marketPrice: 382.00, unrealizedPnL: 2000, marketValue: 382000 }],
        ['IWM', { symbol: 'IWM', quantity: 3000, avgPrice: 190.00, marketPrice: 191.50, unrealizedPnL: 4500, marketValue: 574500 }],
      ]),
      cash: 2000000,
      totalValue: 3859500,
      leverage: 0.48,
    });
  }

  getPortfolio(accountId: string): Portfolio | undefined {
    return this.portfolios.get(accountId);
  }

  getPosition(accountId: string, symbol: string): Position | undefined {
    return this.portfolios.get(accountId)?.positions.get(symbol);
  }

  updatePosition(accountId: string, symbol: string, quantity: number, price: number) {
    const portfolio = this.portfolios.get(accountId);
    if (!portfolio) return;

    const existingPosition = portfolio.positions.get(symbol);

    if (existingPosition) {
      // Update existing position
      const newQuantity = existingPosition.quantity + quantity;
      const newAvgPrice = (existingPosition.avgPrice * existingPosition.quantity + price * quantity) / newQuantity;

      existingPosition.quantity = newQuantity;
      existingPosition.avgPrice = newAvgPrice;
      existingPosition.marketValue = newQuantity * existingPosition.marketPrice;
      existingPosition.unrealizedPnL = (existingPosition.marketPrice - newAvgPrice) * newQuantity;
    } else {
      // New position
      portfolio.positions.set(symbol, {
        symbol,
        quantity,
        avgPrice: price,
        marketPrice: price,
        unrealizedPnL: 0,
        marketValue: quantity * price,
      });
    }

    // Update portfolio totals
    this.recalculatePortfolio(accountId);
  }

  private recalculatePortfolio(accountId: string) {
    const portfolio = this.portfolios.get(accountId);
    if (!portfolio) return;

    let totalMarketValue = 0;
    let totalUnrealizedPnL = 0;

    for (const position of portfolio.positions.values()) {
      totalMarketValue += position.marketValue;
      totalUnrealizedPnL += position.unrealizedPnL;
    }

    portfolio.totalValue = portfolio.cash + totalMarketValue;
    portfolio.leverage = totalMarketValue / portfolio.totalValue;
  }

  getPortfolioSummary(accountId: string) {
    const portfolio = this.portfolios.get(accountId);
    if (!portfolio) return null;

    return {
      accountId: portfolio.accountId,
      cash: portfolio.cash,
      marketValue: portfolio.totalValue - portfolio.cash,
      totalValue: portfolio.totalValue,
      unrealizedPnL: Array.from(portfolio.positions.values()).reduce((sum, pos) => sum + pos.unrealizedPnL, 0),
      leverage: portfolio.leverage,
      positionCount: portfolio.positions.size,
    };
  }
}

// ============================================================================
// Portfolio Risk Checks
// ============================================================================

async function checkPortfolioConcentration(accountId: string, portfolioMgr: PortfolioManager, order: Order): Promise<{ approved: boolean; reason?: string }> {
  const portfolio = portfolioMgr.getPortfolio(accountId);
  if (!portfolio) {
    return { approved: false, reason: 'Portfolio not found' };
  }

  // Calculate order value
  const orderValue = order.quantity * order.price;

  // Get existing position
  const existingPosition = portfolioMgr.getPosition(accountId, order.symbol);
  const currentValue = existingPosition?.marketValue || 0;

  // Calculate new position value
  const newValue = currentValue + orderValue;

  // Check concentration limit (no more than 40% in single symbol)
  const concentration = newValue / portfolio.totalValue;

  if (concentration > 0.40) {
    return {
      approved: false,
      reason: `Concentration limit exceeded: ${(concentration * 100).toFixed(1)}% (max 40%)`,
    };
  }

  return { approved: true };
}

async function checkPortfolioLeverage(accountId: string, portfolioMgr: PortfolioManager, order: Order): Promise<{ approved: boolean; reason?: string }> {
  const portfolio = portfolioMgr.getPortfolio(accountId);
  if (!portfolio) {
    return { approved: false, reason: 'Portfolio not found' };
  }

  // Calculate new portfolio value after order
  const orderValue = order.quantity * order.price;
  const newMarketValue = portfolio.totalValue - portfolio.cash + orderValue;
  const newLeverage = newMarketValue / portfolio.totalValue;

  // Max leverage: 3x
  if (newLeverage > 3.0) {
    return {
      approved: false,
      reason: `Leverage limit exceeded: ${newLeverage.toFixed(2)}x (max 3x)`,
    };
  }

  return { approved: true };
}

// ============================================================================
// Example Scenarios
// ============================================================================

async function scenario1_BalancedPortfolio() {
  console.log('\n=== Scenario 1: Balanced Portfolio ===\n');

  const riskEngine = new RiskEngine();
  const portfolioMgr = new PortfolioManager();
  const accountId = 'ACC-001';

  // Show current portfolio
  const summary = portfolioMgr.getPortfolioSummary(accountId);
  console.log('Current Portfolio:');
  console.log(`  Total Value: $${summary!.totalValue.toLocaleString()}`);
  console.log(`  Cash: $${summary!.cash.toLocaleString()}`);
  console.log(`  Market Value: $${summary!.marketValue.toLocaleString()}`);
  console.log(`  Leverage: ${summary!.leverage.toFixed(2)}x`);
  console.log(`  Positions: ${summary!.positionCount}`);

  // Test order: Buy more AAPL
  const order: Order = {
    orderId: 'ORD-001',
    symbol: 'AAPL',
    side: 'BUY',
    quantity: 500,
    price: 155.50,
    orderType: 'LIMIT',
    timestamp: Date.now(),
    accountId,
  };

  console.log(`\nTesting Order: BUY 500 AAPL @ $155.50`);
  console.log(`  Order Value: $${(order.quantity * order.price).toLocaleString()}`);

  // Risk check
  const start = performance.now();
  const result = await riskEngine.checkOrder(order);
  const latency = performance.now() - start;

  // Portfolio-level checks
  const concentrationCheck = await checkPortfolioConcentration(accountId, portfolioMgr, order);
  const leverageCheck = await checkPortfolioLeverage(accountId, portfolioMgr, order);

  console.log(`\nRisk Check Results (${latency.toFixed(2)}ms):`);
  console.log(`  Basic Checks: ${result.approved ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Concentration: ${concentrationCheck.approved ? '✅ PASS' : '❌ FAIL'}`);
  if (!concentrationCheck.approved) console.log(`    Reason: ${concentrationCheck.reason}`);
  console.log(`  Leverage: ${leverageCheck.approved ? '✅ PASS' : '❌ FAIL'}`);
  if (!leverageCheck.approved) console.log(`    Reason: ${leverageCheck.reason}`);

  const finalApproval = result.approved && concentrationCheck.approved && leverageCheck.approved;
  console.log(`\n${finalApproval ? '✅ ORDER APPROVED' : '❌ ORDER REJECTED'}`);
}

async function scenario2_ConcentratedPortfolio() {
  console.log('\n=== Scenario 2: Concentrated Portfolio (High Risk) ===\n');

  const riskEngine = new RiskEngine();
  const portfolioMgr = new PortfolioManager();
  const accountId = 'ACC-002';

  // Show current portfolio
  const summary = portfolioMgr.getPortfolioSummary(accountId);
  console.log('Current Portfolio:');
  console.log(`  Total Value: $${summary!.totalValue.toLocaleString()}`);
  console.log(`  Leverage: ${summary!.leverage.toFixed(2)}x (⚠️ High)`);

  // Test order: Buy even more TSLA (will fail concentration check)
  const order: Order = {
    orderId: 'ORD-002',
    symbol: 'TSLA',
    side: 'BUY',
    quantity: 2000,
    price: 235.00,
    orderType: 'LIMIT',
    timestamp: Date.now(),
    accountId,
  };

  console.log(`\nTesting Order: BUY 2000 TSLA @ $235.00`);
  console.log(`  Order Value: $${(order.quantity * order.price).toLocaleString()}`);

  // Risk check
  const result = await riskEngine.checkOrder(order);
  const concentrationCheck = await checkPortfolioConcentration(accountId, portfolioMgr, order);
  const leverageCheck = await checkPortfolioLeverage(accountId, portfolioMgr, order);

  console.log('\nRisk Check Results:');
  console.log(`  Basic Checks: ${result.approved ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Concentration: ${concentrationCheck.approved ? '✅ PASS' : '❌ FAIL'}`);
  if (!concentrationCheck.approved) console.log(`    Reason: ${concentrationCheck.reason}`);
  console.log(`  Leverage: ${leverageCheck.approved ? '✅ PASS' : '❌ FAIL'}`);
  if (!leverageCheck.approved) console.log(`    Reason: ${leverageCheck.reason}`);

  const finalApproval = result.approved && concentrationCheck.approved && leverageCheck.approved;
  console.log(`\n${finalApproval ? '✅ ORDER APPROVED' : '❌ ORDER REJECTED'}`);
}

async function scenario3_HighFrequencyTrading() {
  console.log('\n=== Scenario 3: High-Frequency Trading (Multiple Orders) ===\n');

  const riskEngine = new RiskEngine();
  const portfolioMgr = new PortfolioManager();
  const accountId = 'ACC-003';

  // Show current portfolio
  const summary = portfolioMgr.getPortfolioSummary(accountId);
  console.log('Current Portfolio:');
  console.log(`  Total Value: $${summary!.totalValue.toLocaleString()}`);
  console.log(`  Leverage: ${summary!.leverage.toFixed(2)}x (Low - Good)`);

  // Simulate rapid order flow
  const orders: Order[] = [
    { orderId: 'ORD-101', symbol: 'SPY', side: 'BUY', quantity: 100, price: 451.50, orderType: 'MARKET', timestamp: Date.now(), accountId },
    { orderId: 'ORD-102', symbol: 'SPY', side: 'SELL', quantity: 100, price: 451.60, orderType: 'LIMIT', timestamp: Date.now() + 50, accountId },
    { orderId: 'ORD-103', symbol: 'QQQ', side: 'BUY', quantity: 50, price: 382.00, orderType: 'MARKET', timestamp: Date.now() + 100, accountId },
    { orderId: 'ORD-104', symbol: 'QQQ', side: 'SELL', quantity: 50, price: 382.10, orderType: 'LIMIT', timestamp: Date.now() + 150, accountId },
  ];

  console.log(`\nProcessing ${orders.length} orders rapidly...\n`);

  const results: { order: Order; result: RiskCheckResult; latency: number }[] = [];

  for (const order of orders) {
    const start = performance.now();
    const result = await riskEngine.checkOrder(order);
    const latency = performance.now() - start;

    results.push({ order, result, latency });

    console.log(`${order.orderId}: ${order.side} ${order.quantity} ${order.symbol} @ $${order.price} - ${result.approved ? '✅' : '❌'} (${latency.toFixed(2)}ms)`);
  }

  // Calculate statistics
  const latencies = results.map(r => r.latency);
  const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
  const maxLatency = Math.max(...latencies);
  const approvalRate = results.filter(r => r.result.approved).length / results.length;

  console.log('\n📊 Statistics:');
  console.log(`  Average Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`  Max Latency: ${maxLatency.toFixed(2)}ms`);
  console.log(`  Approval Rate: ${(approvalRate * 100).toFixed(1)}%`);
  console.log(`  Throughput: ${(1000 / avgLatency).toFixed(0)} orders/second`);
}

// ============================================================================
// Run All Scenarios
// ============================================================================

async function main() {
  console.log('🏦 Portfolio Risk Management Demo\n');
  console.log('='.repeat(70));

  await scenario1_BalancedPortfolio();
  await scenario2_ConcentratedPortfolio();
  await scenario3_HighFrequencyTrading();

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ All scenarios completed\n');
}

main().catch(console.error);
