import { describe, it, expect, beforeEach } from 'vitest';
import { RiskEngine } from '../core/risk-engine.js';
import type { Order, RiskLimits } from '../core/types.js';

const testLimits: RiskLimits = {
  maxPositionSize: 10000,
  maxOrderValue: 50000,
  maxPortfolioValue: 500000,
  maxLeverage: 5,
  maxConcentration: 30,
  maxDailyLoss: 50000,
  maxOrdersPerSecond: 10,
  priceDeviationThreshold: 0.1,
};

describe('RiskEngine', () => {
  let engine: RiskEngine;

  beforeEach(() => {
    engine = new RiskEngine(testLimits);
  });

  describe('Order Size Checks', () => {
    it('should approve order within limits', async () => {
      const order: Order = {
        orderId: 'TEST-001',
        symbol: 'AAPL',
        side: 'BUY',
        quantity: 100,
        price: 150,
        orderType: 'LIMIT',
        timestamp: Date.now(),
        accountId: 'ACC-001',
      };

      const result = await engine.checkOrder(order);

      expect(result.approved).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.latencyUs).toBeLessThan(1000); // <1ms
    });

    it('should reject order exceeding value limit', async () => {
      const order: Order = {
        orderId: 'TEST-002',
        symbol: 'AAPL',
        side: 'BUY',
        quantity: 1000,
        price: 150, // 150k value
        orderType: 'LIMIT',
        timestamp: Date.now(),
        accountId: 'ACC-001',
      };

      const result = await engine.checkOrder(order);

      expect(result.approved).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].type).toBe('ORDER_SIZE');
    });

    it('should check order in <1ms', async () => {
      const order: Order = {
        orderId: 'TEST-003',
        symbol: 'AAPL',
        side: 'BUY',
        quantity: 100,
        price: 150,
        orderType: 'LIMIT',
        timestamp: Date.now(),
        accountId: 'ACC-001',
      };

      const result = await engine.checkOrder(order);

      expect(result.latencyUs).toBeLessThan(1000); // <1ms = <1000μs
    });
  });

  describe('Position Limits', () => {
    it('should track position accumulation', async () => {
      const accountId = 'ACC-002';

      // First order
      await engine.checkOrder({
        orderId: 'TEST-004',
        symbol: 'TSLA',
        side: 'BUY',
        quantity: 5000,
        price: 200,
        orderType: 'LIMIT',
        timestamp: Date.now(),
        accountId,
      });

      // Second order should trigger position limit
      const result = await engine.checkOrder({
        orderId: 'TEST-005',
        symbol: 'TSLA',
        side: 'BUY',
        quantity: 6000, // Total 11000 > limit
        price: 200,
        orderType: 'LIMIT',
        timestamp: Date.now(),
        accountId,
      });

      expect(result.violations.some(v => v.type === 'POSITION_LIMIT')).toBe(true);
    });
  });

  describe('Velocity Checks', () => {
    it('should detect high order velocity', async () => {
      const accountId = 'ACC-003';
      const results = [];

      // Submit many orders quickly
      for (let i = 0; i < 15; i++) {
        const result = await engine.checkOrder({
          orderId: `TEST-VELOCITY-${i}`,
          symbol: 'AAPL',
          side: 'BUY',
          quantity: 10,
          price: 150,
          orderType: 'LIMIT',
          timestamp: Date.now(),
          accountId,
        });
        results.push(result);
      }

      // Should have velocity violations
      const velocityViolations = results.filter(
        r => r.violations.some(v => v.type === 'VELOCITY')
      );

      expect(velocityViolations.length).toBeGreaterThan(0);
    });
  });

  describe('Batch Processing', () => {
    it('should process batch efficiently', async () => {
      const orders: Order[] = Array.from({ length: 100 }, (_, i) => ({
        orderId: `BATCH-${i}`,
        symbol: 'AAPL',
        side: i % 2 === 0 ? 'BUY' : 'SELL',
        quantity: 100,
        price: 150,
        orderType: 'LIMIT',
        timestamp: Date.now(),
        accountId: `ACC-${i % 5}`,
      }));

      const start = Date.now();
      const results = await engine.checkOrderBatch(orders);
      const duration = Date.now() - start;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(100); // <1ms per order average
    });
  });

  describe('Risk Scoring', () => {
    it('should calculate risk scores', async () => {
      const order: Order = {
        orderId: 'TEST-RISK',
        symbol: 'AAPL',
        side: 'BUY',
        quantity: 100,
        price: 150,
        orderType: 'LIMIT',
        timestamp: Date.now(),
        accountId: 'ACC-004',
      };

      const result = await engine.checkOrder(order);

      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Market Data Integration', () => {
    it('should check price deviations', async () => {
      // Set market data
      engine.updateMarketData({
        symbol: 'AAPL',
        price: 150,
        bid: 149.5,
        ask: 150.5,
        volume: 1000000,
        timestamp: Date.now(),
      });

      // Order with significant deviation
      const result = await engine.checkOrder({
        orderId: 'TEST-DEVIATION',
        symbol: 'AAPL',
        side: 'BUY',
        quantity: 100,
        price: 200, // 33% deviation
        orderType: 'LIMIT',
        timestamp: Date.now(),
        accountId: 'ACC-005',
      });

      expect(result.violations.some(v => v.type === 'PRICE_DEVIATION')).toBe(true);
    });
  });

  describe('Metrics', () => {
    it('should track performance metrics', async () => {
      // Run some checks
      for (let i = 0; i < 10; i++) {
        await engine.checkOrder({
          orderId: `METRIC-${i}`,
          symbol: 'AAPL',
          side: 'BUY',
          quantity: 100,
          price: 150,
          orderType: 'LIMIT',
          timestamp: Date.now(),
          accountId: 'ACC-006',
        });
      }

      const metrics = engine.getMetrics();

      expect(metrics.totalChecks).toBe(10);
      expect(metrics.approvedChecks + metrics.rejectedChecks).toBe(10);
      expect(metrics.maxLatencyUs).toBeGreaterThan(0);
    });
  });
});
