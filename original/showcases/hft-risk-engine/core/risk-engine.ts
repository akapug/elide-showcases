import Decimal from 'decimal.js';
import type {
  Order,
  RiskCheckResult,
  RiskViolation,
  ViolationType,
  RiskLimits,
  Position,
  AccountRiskProfile,
  MarketData,
  PerformanceMetrics,
} from './types.js';

/**
 * Ultra-Low Latency Risk Engine
 * Target: <1ms (ideally <500μs) per risk check
 *
 * Optimizations:
 * - In-memory calculations
 * - Pre-computed position aggregates
 * - Minimal allocations
 * - Early exit on violations
 * - Parallel checks where possible
 */
export class RiskEngine {
  private accountProfiles: Map<string, AccountRiskProfile> = new Map();
  private marketData: Map<string, MarketData> = new Map();
  private velocityTracking: Map<string, number[]> = new Map();
  private performanceMetrics: PerformanceMetrics;

  constructor(private defaultLimits: RiskLimits) {
    this.performanceMetrics = this.initMetrics();
  }

  /**
   * Main risk check - optimized for <1ms latency
   */
  async checkOrder(order: Order): Promise<RiskCheckResult> {
    const startTime = process.hrtime.bigint();

    const violations: RiskViolation[] = [];
    let riskScore = 0;

    // Get or create account profile (cached)
    const profile = this.getAccountProfile(order.accountId);

    // Fast path: Pre-checks that can early exit
    const orderValue = order.quantity * order.price;

    // 1. Order Size Check (fastest)
    if (orderValue > profile.limits.maxOrderValue) {
      violations.push({
        type: 'ORDER_SIZE' as ViolationType,
        severity: 'CRITICAL',
        message: `Order value ${orderValue} exceeds limit ${profile.limits.maxOrderValue}`,
        currentValue: orderValue,
        limit: profile.limits.maxOrderValue,
      });
      riskScore += 40;
    }

    // 2. Position Limit Check
    const existingPosition = profile.positions.find(p => p.symbol === order.symbol);
    const newQuantity = this.calculateNewPosition(existingPosition, order);

    if (Math.abs(newQuantity) > profile.limits.maxPositionSize) {
      violations.push({
        type: 'POSITION_LIMIT' as ViolationType,
        severity: 'HIGH',
        message: `Position size ${newQuantity} exceeds limit ${profile.limits.maxPositionSize}`,
        currentValue: Math.abs(newQuantity),
        limit: profile.limits.maxPositionSize,
      });
      riskScore += 35;
    }

    // 3. Portfolio Value Check
    const newExposure = profile.currentExposure + orderValue;
    if (newExposure > profile.limits.maxPortfolioValue) {
      violations.push({
        type: 'PORTFOLIO_VALUE' as ViolationType,
        severity: 'HIGH',
        message: `Portfolio exposure ${newExposure} exceeds limit ${profile.limits.maxPortfolioValue}`,
        currentValue: newExposure,
        limit: profile.limits.maxPortfolioValue,
      });
      riskScore += 30;
    }

    // 4. Leverage Check
    const leverage = newExposure / profile.availableCapital;
    if (leverage > profile.limits.maxLeverage) {
      violations.push({
        type: 'LEVERAGE' as ViolationType,
        severity: 'CRITICAL',
        message: `Leverage ${leverage.toFixed(2)}x exceeds limit ${profile.limits.maxLeverage}x`,
        currentValue: leverage,
        limit: profile.limits.maxLeverage,
      });
      riskScore += 40;
    }

    // 5. Velocity Check (orders per second)
    const velocityViolation = this.checkVelocity(order.accountId, profile.limits);
    if (velocityViolation) {
      violations.push(velocityViolation);
      riskScore += 25;
    }

    // 6. Price Deviation Check (detect potential errors)
    const priceViolation = this.checkPriceDeviation(order, profile.limits);
    if (priceViolation) {
      violations.push(priceViolation);
      riskScore += 20;
    }

    // 7. Concentration Check
    const concentrationViolation = this.checkConcentration(order, profile);
    if (concentrationViolation) {
      violations.push(concentrationViolation);
      riskScore += 15;
    }

    // Calculate latency in microseconds
    const endTime = process.hrtime.bigint();
    const latencyUs = Number(endTime - startTime) / 1000; // Convert nanoseconds to microseconds

    const result: RiskCheckResult = {
      approved: violations.length === 0 || !violations.some(v => v.severity === 'CRITICAL'),
      violations,
      latencyUs,
      timestamp: Date.now(),
      orderId: order.orderId,
      riskScore: Math.min(riskScore, 100),
    };

    // Update metrics
    this.updateMetrics(result);

    return result;
  }

  /**
   * Batch risk check for multiple orders (more efficient)
   */
  async checkOrderBatch(orders: Order[]): Promise<RiskCheckResult[]> {
    // Process in parallel for different accounts
    return Promise.all(orders.map(order => this.checkOrder(order)));
  }

  private calculateNewPosition(existing: Position | undefined, order: Order): number {
    const currentQty = existing?.quantity || 0;
    const orderQty = order.side === 'BUY' ? order.quantity : -order.quantity;
    return currentQty + orderQty;
  }

  private checkVelocity(accountId: string, limits: RiskLimits): RiskViolation | null {
    const now = Date.now();
    const timestamps = this.velocityTracking.get(accountId) || [];

    // Keep only last second
    const recentOrders = timestamps.filter(t => now - t < 1000);
    recentOrders.push(now);
    this.velocityTracking.set(accountId, recentOrders);

    if (recentOrders.length > limits.maxOrdersPerSecond) {
      return {
        type: 'VELOCITY' as ViolationType,
        severity: 'HIGH',
        message: `Order velocity ${recentOrders.length}/s exceeds limit ${limits.maxOrdersPerSecond}/s`,
        currentValue: recentOrders.length,
        limit: limits.maxOrdersPerSecond,
      };
    }

    return null;
  }

  private checkPriceDeviation(order: Order, limits: RiskLimits): RiskViolation | null {
    const marketData = this.marketData.get(order.symbol);
    if (!marketData) return null;

    const deviation = Math.abs(order.price - marketData.price) / marketData.price;
    if (deviation > limits.priceDeviationThreshold) {
      return {
        type: 'PRICE_DEVIATION' as ViolationType,
        severity: 'MEDIUM',
        message: `Price deviation ${(deviation * 100).toFixed(2)}% exceeds threshold`,
        currentValue: deviation * 100,
        limit: limits.priceDeviationThreshold * 100,
      };
    }

    return null;
  }

  private checkConcentration(order: Order, profile: AccountRiskProfile): RiskViolation | null {
    const orderValue = order.quantity * order.price;
    const totalValue = profile.currentExposure + orderValue;
    const symbolExposure = profile.positions
      .filter(p => p.symbol === order.symbol)
      .reduce((sum, p) => sum + Math.abs(p.quantity * p.marketPrice), 0) + orderValue;

    const concentration = (symbolExposure / totalValue) * 100;

    if (concentration > profile.limits.maxConcentration) {
      return {
        type: 'CONCENTRATION' as ViolationType,
        severity: 'MEDIUM',
        message: `Symbol concentration ${concentration.toFixed(2)}% exceeds limit ${profile.limits.maxConcentration}%`,
        currentValue: concentration,
        limit: profile.limits.maxConcentration,
      };
    }

    return null;
  }

  private getAccountProfile(accountId: string): AccountRiskProfile {
    if (!this.accountProfiles.has(accountId)) {
      this.accountProfiles.set(accountId, {
        accountId,
        limits: { ...this.defaultLimits },
        currentExposure: 0,
        availableCapital: 1000000, // Default $1M
        positions: [],
        dailyPnL: 0,
        riskScore: 0,
        lastUpdated: Date.now(),
      });
    }
    return this.accountProfiles.get(accountId)!;
  }

  // Update market data for price checks
  updateMarketData(data: MarketData): void {
    this.marketData.set(data.symbol, data);
  }

  // Update account profile
  updateAccountProfile(profile: AccountRiskProfile): void {
    this.accountProfiles.set(profile.accountId, profile);
  }

  private initMetrics(): PerformanceMetrics {
    return {
      totalChecks: 0,
      approvedChecks: 0,
      rejectedChecks: 0,
      averageLatencyUs: 0,
      p50LatencyUs: 0,
      p95LatencyUs: 0,
      p99LatencyUs: 0,
      maxLatencyUs: 0,
      checksPerSecond: 0,
      violationsByType: new Map(),
    };
  }

  private updateMetrics(result: RiskCheckResult): void {
    this.performanceMetrics.totalChecks++;

    if (result.approved) {
      this.performanceMetrics.approvedChecks++;
    } else {
      this.performanceMetrics.rejectedChecks++;
    }

    // Update latency stats (simplified - would use histogram in production)
    this.performanceMetrics.maxLatencyUs = Math.max(
      this.performanceMetrics.maxLatencyUs,
      result.latencyUs
    );

    // Track violations
    result.violations.forEach(v => {
      const count = this.performanceMetrics.violationsByType.get(v.type) || 0;
      this.performanceMetrics.violationsByType.set(v.type, count + 1);
    });
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  reset(): void {
    this.accountProfiles.clear();
    this.velocityTracking.clear();
    this.performanceMetrics = this.initMetrics();
  }
}
