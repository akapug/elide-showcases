import { z } from 'zod';

// Order Types
export const OrderSchema = z.object({
  orderId: z.string(),
  symbol: z.string(),
  side: z.enum(['BUY', 'SELL']),
  quantity: z.number().positive(),
  price: z.number().positive(),
  orderType: z.enum(['MARKET', 'LIMIT', 'STOP']),
  timestamp: z.number(),
  accountId: z.string(),
  strategyId: z.string().optional(),
});

export type Order = z.infer<typeof OrderSchema>;

// Position Types
export interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  marketPrice: number;
  unrealizedPnL: number;
  accountId: string;
}

// Risk Check Result
export interface RiskCheckResult {
  approved: boolean;
  violations: RiskViolation[];
  latencyUs: number; // microseconds
  timestamp: number;
  orderId: string;
  riskScore: number; // 0-100
}

export interface RiskViolation {
  type: ViolationType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  currentValue: number;
  limit: number;
}

export enum ViolationType {
  POSITION_LIMIT = 'POSITION_LIMIT',
  ORDER_SIZE = 'ORDER_SIZE',
  PORTFOLIO_VALUE = 'PORTFOLIO_VALUE',
  LEVERAGE = 'LEVERAGE',
  CONCENTRATION = 'CONCENTRATION',
  CIRCUIT_BREAKER = 'CIRCUIT_BREAKER',
  PRICE_DEVIATION = 'PRICE_DEVIATION',
  VELOCITY = 'VELOCITY',
  CREDIT_LIMIT = 'CREDIT_LIMIT',
  REGULATORY = 'REGULATORY',
}

// Risk Limits
export interface RiskLimits {
  maxPositionSize: number;
  maxOrderValue: number;
  maxPortfolioValue: number;
  maxLeverage: number;
  maxConcentration: number; // percentage
  maxDailyLoss: number;
  maxOrdersPerSecond: number;
  priceDeviationThreshold: number; // percentage
}

// Account Risk Profile
export interface AccountRiskProfile {
  accountId: string;
  limits: RiskLimits;
  currentExposure: number;
  availableCapital: number;
  positions: Position[];
  dailyPnL: number;
  riskScore: number;
  lastUpdated: number;
}

// Performance Metrics
export interface PerformanceMetrics {
  totalChecks: number;
  approvedChecks: number;
  rejectedChecks: number;
  averageLatencyUs: number;
  p50LatencyUs: number;
  p95LatencyUs: number;
  p99LatencyUs: number;
  maxLatencyUs: number;
  checksPerSecond: number;
  violationsByType: Map<ViolationType, number>;
}

// Market Data
export interface MarketData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume: number;
  timestamp: number;
  volatility?: number;
}

// Risk Event for Audit Trail
export interface RiskEvent {
  eventId: string;
  orderId: string;
  accountId: string;
  result: RiskCheckResult;
  order: Order;
  timestamp: number;
}
