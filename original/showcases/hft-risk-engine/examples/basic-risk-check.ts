import { RiskEngine } from '../core/risk-engine.js';
import type { Order, RiskLimits } from '../core/types.js';

/**
 * Basic Risk Check Example
 * Demonstrates simple risk checking workflow
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

async function main() {
  console.log('🎯 Basic Risk Check Example\n');

  const engine = new RiskEngine(limits);

  // Example 1: Normal order (should pass)
  console.log('Example 1: Normal Order');
  console.log('-'.repeat(50));

  const order1: Order = {
    orderId: 'ORD-001',
    symbol: 'AAPL',
    side: 'BUY',
    quantity: 100,
    price: 150.50,
    orderType: 'LIMIT',
    timestamp: Date.now(),
    accountId: 'ACC-12345',
    strategyId: 'MOMENTUM-1',
  };

  const result1 = await engine.checkOrder(order1);

  console.log(`Order ID: ${order1.orderId}`);
  console.log(`Symbol: ${order1.symbol}`);
  console.log(`Side: ${order1.side} ${order1.quantity} @ $${order1.price}`);
  console.log(`\nResult: ${result1.approved ? '✅ APPROVED' : '❌ REJECTED'}`);
  console.log(`Risk Score: ${result1.riskScore.toFixed(2)}/100`);
  console.log(`Latency: ${result1.latencyUs.toFixed(2)}μs (${(result1.latencyUs / 1000).toFixed(3)}ms)`);
  console.log(`Violations: ${result1.violations.length}`);
  console.log();

  // Example 2: Large order (may violate limits)
  console.log('Example 2: Large Order');
  console.log('-'.repeat(50));

  const order2: Order = {
    orderId: 'ORD-002',
    symbol: 'TSLA',
    side: 'BUY',
    quantity: 10000,
    price: 250.00,
    orderType: 'MARKET',
    timestamp: Date.now(),
    accountId: 'ACC-12345',
    strategyId: 'BREAKOUT-2',
  };

  const result2 = await engine.checkOrder(order2);

  console.log(`Order ID: ${order2.orderId}`);
  console.log(`Symbol: ${order2.symbol}`);
  console.log(`Side: ${order2.side} ${order2.quantity} @ $${order2.price}`);
  console.log(`Order Value: $${(order2.quantity * order2.price).toLocaleString()}`);
  console.log(`\nResult: ${result2.approved ? '✅ APPROVED' : '❌ REJECTED'}`);
  console.log(`Risk Score: ${result2.riskScore.toFixed(2)}/100`);
  console.log(`Latency: ${result2.latencyUs.toFixed(2)}μs (${(result2.latencyUs / 1000).toFixed(3)}ms)`);

  if (result2.violations.length > 0) {
    console.log(`\nViolations:`);
    result2.violations.forEach((v, i) => {
      console.log(`  ${i + 1}. [${v.severity}] ${v.type}`);
      console.log(`     ${v.message}`);
    });
  }
  console.log();

  // Example 3: Set market data and check price deviation
  console.log('Example 3: Price Deviation Check');
  console.log('-'.repeat(50));

  engine.updateMarketData({
    symbol: 'GOOGL',
    price: 140.00,
    bid: 139.95,
    ask: 140.05,
    volume: 5000000,
    timestamp: Date.now(),
  });

  const order3: Order = {
    orderId: 'ORD-003',
    symbol: 'GOOGL',
    side: 'BUY',
    quantity: 500,
    price: 150.00, // 7% above market
    orderType: 'LIMIT',
    timestamp: Date.now(),
    accountId: 'ACC-12345',
  };

  const result3 = await engine.checkOrder(order3);

  console.log(`Order ID: ${order3.orderId}`);
  console.log(`Symbol: ${order3.symbol}`);
  console.log(`Order Price: $${order3.price}`);
  console.log(`Market Price: $140.00`);
  console.log(`Deviation: 7.14%`);
  console.log(`\nResult: ${result3.approved ? '✅ APPROVED' : '⚠️  WARNING'}`);
  console.log(`Risk Score: ${result3.riskScore.toFixed(2)}/100`);

  if (result3.violations.length > 0) {
    console.log(`\nViolations:`);
    result3.violations.forEach((v, i) => {
      console.log(`  ${i + 1}. [${v.severity}] ${v.type}`);
      console.log(`     ${v.message}`);
    });
  }
  console.log();

  // Performance summary
  console.log('Performance Summary');
  console.log('-'.repeat(50));
  const metrics = engine.getMetrics();
  console.log(`Total Checks: ${metrics.totalChecks}`);
  console.log(`Approved: ${metrics.approvedChecks}`);
  console.log(`Rejected: ${metrics.rejectedChecks}`);
  console.log(`Max Latency: ${metrics.maxLatencyUs.toFixed(2)}μs`);
  console.log();

  console.log('✅ Example complete!');
}

main().catch(console.error);
