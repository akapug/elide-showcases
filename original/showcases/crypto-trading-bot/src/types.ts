/**
 * Core type definitions for the Cryptocurrency Trading Bot
 *
 * This file defines all the essential types, interfaces, and enums used throughout
 * the trading bot application, ensuring type safety across the polyglot codebase.
 */

// ============================================================================
// Exchange Types
// ============================================================================

/**
 * Supported cryptocurrency exchanges
 */
export type ExchangeId =
  | 'binance'
  | 'binanceus'
  | 'binanceusdm' // Binance USDT Futures
  | 'binancecoinm' // Binance Coin Futures
  | 'coinbase'
  | 'coinbasepro'
  | 'kraken'
  | 'krakenfutures'
  | 'bybit'
  | 'bybit_linear' // Bybit Linear Futures
  | 'bybit_inverse' // Bybit Inverse Futures
  | 'okx'
  | 'okx_swap' // OKX Perpetual Swaps
  | 'huobi'
  | 'htx'
  | 'kucoin'
  | 'gateio'
  | 'bitfinex'
  | 'bitstamp'
  | 'gemini'
  | 'ftx' // Historical
  | 'bitget'
  | 'mexc'
  | 'bitmex';

/**
 * Exchange API credentials
 */
export interface ExchangeCredentials {
  apiKey: string;
  secret: string;
  password?: string; // Required for some exchanges like OKX
  uid?: string; // User ID for some exchanges
}

/**
 * Exchange configuration options
 */
export interface ExchangeConfig {
  credentials?: ExchangeCredentials;
  sandbox?: boolean; // Use testnet/sandbox
  enableRateLimit?: boolean; // Respect exchange rate limits
  rateLimit?: number; // Custom rate limit in ms
  timeout?: number; // Request timeout in ms
  verbose?: boolean; // Enable debug logging
  proxy?: string; // HTTP proxy URL
  options?: Record<string, any>; // Exchange-specific options
}

/**
 * Exchange connection status
 */
export interface ExchangeStatus {
  id: ExchangeId;
  connected: boolean;
  authenticated: boolean;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
  lastUpdate: number;
  error?: string;
}

// ============================================================================
// Market Data Types
// ============================================================================

/**
 * Trading pair symbol (e.g., 'BTC/USDT', 'ETH/USD')
 */
export type Symbol = string;

/**
 * Timeframe for candlestick data
 */
export type Timeframe =
  | '1m' | '3m' | '5m' | '15m' | '30m' // Minutes
  | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' // Hours
  | '1d' | '3d' // Days
  | '1w' // Week
  | '1M'; // Month

/**
 * OHLCV (Open, High, Low, Close, Volume) candlestick data
 */
export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Real-time ticker data
 */
export interface Ticker {
  symbol: Symbol;
  timestamp: number;
  datetime: string;
  high: number;
  low: number;
  bid: number;
  bidVolume?: number;
  ask: number;
  askVolume?: number;
  vwap?: number; // Volume-weighted average price
  open: number;
  close: number;
  last: number;
  previousClose?: number;
  change?: number;
  percentage?: number;
  average?: number;
  baseVolume: number;
  quoteVolume: number;
  info?: any; // Raw exchange response
}

/**
 * Order book (depth of market)
 */
export interface OrderBook {
  symbol: Symbol;
  timestamp: number;
  datetime: string;
  nonce?: number;
  bids: [number, number][]; // [price, amount][]
  asks: [number, number][]; // [price, amount][]
}

/**
 * Public trade
 */
export interface Trade {
  id: string;
  timestamp: number;
  datetime: string;
  symbol: Symbol;
  type?: 'market' | 'limit';
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  cost?: number; // price * amount
  fee?: Fee;
  info?: any;
}

// ============================================================================
// Trading Types
// ============================================================================

/**
 * Order side
 */
export type OrderSide = 'buy' | 'sell';

/**
 * Order type
 */
export type OrderType =
  | 'market'
  | 'limit'
  | 'stop_market'
  | 'stop_limit'
  | 'take_profit_market'
  | 'take_profit_limit'
  | 'trailing_stop';

/**
 * Order status
 */
export type OrderStatus =
  | 'open'
  | 'closed'
  | 'canceled'
  | 'expired'
  | 'rejected'
  | 'pending';

/**
 * Time in force
 */
export type TimeInForce =
  | 'GTC' // Good Till Canceled
  | 'IOC' // Immediate Or Cancel
  | 'FOK' // Fill Or Kill
  | 'PO'; // Post Only

/**
 * Order request
 */
export interface OrderRequest {
  exchange: ExchangeId;
  symbol: Symbol;
  type: OrderType;
  side: OrderSide;
  amount: number;
  price?: number; // Required for limit orders
  stopPrice?: number; // For stop orders
  timeInForce?: TimeInForce;
  reduceOnly?: boolean; // For futures
  postOnly?: boolean; // For limit orders
  clientOrderId?: string;
  params?: Record<string, any>;
}

/**
 * Order response
 */
export interface Order {
  id: string;
  clientOrderId?: string;
  timestamp: number;
  datetime: string;
  lastTradeTimestamp?: number;
  symbol: Symbol;
  type: OrderType;
  side: OrderSide;
  price: number;
  amount: number;
  cost: number;
  average?: number; // Average fill price
  filled: number;
  remaining: number;
  status: OrderStatus;
  fee?: Fee;
  trades?: Trade[];
  info?: any;
}

/**
 * Fee structure
 */
export interface Fee {
  currency: string;
  cost: number;
  rate?: number;
}

// ============================================================================
// Account & Balance Types
// ============================================================================

/**
 * Account balance
 */
export interface Balance {
  currency: string;
  free: number; // Available for trading
  used: number; // Locked in orders
  total: number; // free + used
}

/**
 * Account balances
 */
export interface Balances {
  [currency: string]: Balance;
}

/**
 * Position (for futures/margin trading)
 */
export interface Position {
  id?: string;
  symbol: Symbol;
  side: 'long' | 'short';
  contracts: number; // Number of contracts
  contractSize: number;
  unrealizedPnl: number;
  realizedPnl?: number;
  percentage?: number;
  entryPrice: number;
  markPrice?: number;
  liquidationPrice?: number;
  collateral?: number;
  notional?: number;
  leverage?: number;
  timestamp: number;
  info?: any;
}

// ============================================================================
// Strategy Types
// ============================================================================

/**
 * Trading signal action
 */
export type SignalAction = 'BUY' | 'SELL' | 'HOLD';

/**
 * Trading signal
 */
export interface TradingSignal {
  action: SignalAction;
  symbol: Symbol;
  confidence: number; // 0-1
  price?: number;
  timestamp: number;
  reason: string;
  suggestedSize?: number;
  metadata?: Record<string, any>;
}

/**
 * Strategy configuration
 */
export interface StrategyConfig {
  name: string;
  enabled: boolean;
  symbols: Symbol[];
  timeframe: Timeframe;
  parameters: Record<string, any>;
}

/**
 * Strategy performance metrics
 */
export interface StrategyPerformance {
  strategyName: string;
  totalReturn: number; // Percentage
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  avgWin: number;
  avgLoss: number;
  avgHoldTime: number; // In seconds
}

// ============================================================================
// Technical Indicator Types
// ============================================================================

/**
 * RSI (Relative Strength Index) parameters
 */
export interface RSIParams {
  period: number;
  overbought?: number; // Default 70
  oversold?: number; // Default 30
}

/**
 * MACD (Moving Average Convergence Divergence) parameters
 */
export interface MACDParams {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
}

/**
 * MACD result
 */
export interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

/**
 * Bollinger Bands parameters
 */
export interface BollingerBandsParams {
  period: number;
  stdDev: number; // Number of standard deviations
}

/**
 * Bollinger Bands result
 */
export interface BollingerBandsResult {
  upper: number[];
  middle: number[];
  lower: number[];
}

/**
 * EMA (Exponential Moving Average) parameters
 */
export interface EMAParams {
  period: number;
}

/**
 * Stochastic Oscillator parameters
 */
export interface StochasticParams {
  kPeriod: number;
  dPeriod: number;
  smooth: number;
}

/**
 * Stochastic result
 */
export interface StochasticResult {
  k: number[];
  d: number[];
}

/**
 * ATR (Average True Range) parameters
 */
export interface ATRParams {
  period: number;
}

/**
 * Indicator configuration for composite signals
 */
export interface IndicatorConfig {
  rsi?: RSIParams;
  macd?: MACDParams;
  bollinger?: BollingerBandsParams;
  ema?: { periods: number[] };
  stochastic?: StochasticParams;
  atr?: ATRParams;
}

// ============================================================================
// Risk Management Types
// ============================================================================

/**
 * Risk management configuration
 */
export interface RiskConfig {
  maxPositionSize: number; // Percentage of portfolio (0-1)
  maxDailyDrawdown: number; // Percentage (0-1)
  maxTotalDrawdown: number; // Percentage (0-1)
  stopLossPercent: number; // Percentage (0-100)
  takeProfitPercent: number; // Percentage (0-100)
  maxOpenPositions: number;
  maxLeverageNumber;
  riskRewardRatio?: number; // Minimum risk/reward ratio
  useTrailingStop?: boolean;
  trailingStopPercent?: number;
}

/**
 * Position sizing request
 */
export interface PositionSizeRequest {
  symbol: Symbol;
  currentPrice: number;
  stopLossPrice?: number;
  winRate?: number; // For Kelly Criterion
  avgWin?: number;
  avgLoss?: number;
  riskPercent?: number; // Portfolio risk percentage
}

/**
 * Position sizing result
 */
export interface PositionSizeResult {
  size: number; // Amount to trade
  notional: number; // Total value
  riskAmount: number; // Amount at risk
  riskPercent: number;
  method: 'fixed' | 'kelly' | 'volatility' | 'custom';
}

/**
 * Risk metrics
 */
export interface RiskMetrics {
  portfolioValue: number;
  totalExposure: number;
  exposurePercent: number;
  dailyPnl: number;
  dailyPnlPercent: number;
  totalPnl: number;
  totalPnlPercent: number;
  currentDrawdown: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  var95: number; // Value at Risk (95% confidence)
  cvar95: number; // Conditional Value at Risk
  beta?: number;
  alpha?: number;
}

// ============================================================================
// Backtesting Types
// ============================================================================

/**
 * Backtest configuration
 */
export interface BacktestConfig {
  strategy: any; // Strategy instance
  symbol: Symbol;
  timeframe: Timeframe;
  startDate: string | Date;
  endDate: string | Date;
  initialCapital: number;
  commission: number; // Percentage (0.001 = 0.1%)
  slippage: number; // Percentage
  leverage?: number;
}

/**
 * Backtest trade
 */
export interface BacktestTrade {
  entryTime: number;
  exitTime: number;
  symbol: Symbol;
  side: OrderSide;
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  commission: number;
  slippage: number;
  holdTime: number; // In seconds
  reason: string;
}

/**
 * Backtest results
 */
export interface BacktestResults {
  strategyName: string;
  symbol: Symbol;
  timeframe: Timeframe;
  startDate: string;
  endDate: string;
  duration: number; // In days
  initialCapital: number;
  finalCapital: number;
  totalReturn: number; // Percentage
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number; // In days
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  avgWinPercent: number;
  avgLossPercent: number;
  largestWin: number;
  largestLoss: number;
  avgHoldTime: number; // In hours
  expectancy: number;
  trades: BacktestTrade[];
  equity: number[]; // Equity curve
  drawdown: number[]; // Drawdown curve
  returns: number[]; // Daily returns
}

// ============================================================================
// Execution Types
// ============================================================================

/**
 * TWAP (Time-Weighted Average Price) configuration
 */
export interface TWAPConfig {
  exchange: ExchangeId;
  symbol: Symbol;
  side: OrderSide;
  amount: number; // Total amount to execute
  duration: number; // Duration in seconds
  intervals: number; // Number of intervals
  limitPrice?: number; // Optional limit price
  variance?: number; // Randomize interval timing (0-1)
}

/**
 * VWAP (Volume-Weighted Average Price) configuration
 */
export interface VWAPConfig {
  exchange: ExchangeId;
  symbol: Symbol;
  side: OrderSide;
  amount: number;
  volumeProfile: 'historical' | 'uniform' | 'custom';
  customProfile?: number[]; // Custom volume distribution
  maxSlippage: number; // Maximum acceptable slippage
  duration?: number;
}

/**
 * Iceberg order configuration
 */
export interface IcebergConfig {
  exchange: ExchangeId;
  symbol: Symbol;
  side: OrderSide;
  totalAmount: number;
  visibleAmount: number; // Amount visible in order book
  price: number;
  variance?: number; // Randomize visible amount (0-1)
}

/**
 * Execution report
 */
export interface ExecutionReport {
  type: 'TWAP' | 'VWAP' | 'ICEBERG' | 'MARKET' | 'LIMIT';
  symbol: Symbol;
  side: OrderSide;
  requestedAmount: number;
  executedAmount: number;
  avgPrice: number;
  totalCost: number;
  totalCommission: number;
  slippage: number;
  orders: Order[];
  startTime: number;
  endTime: number;
  duration: number;
  status: 'completed' | 'partial' | 'failed' | 'canceled';
  error?: string;
}

// ============================================================================
// Machine Learning Types
// ============================================================================

/**
 * ML model type
 */
export type MLModelType =
  | 'random_forest'
  | 'xgboost'
  | 'lstm'
  | 'gru'
  | 'linear_regression'
  | 'svm';

/**
 * ML training configuration
 */
export interface MLTrainingConfig {
  symbol: Symbol;
  features: string[]; // Feature names
  targetHorizon: number; // Hours ahead to predict
  trainStartDate: string | Date;
  trainEndDate: string | Date;
  testSize?: number; // Percentage (0-1)
  model: MLModelType;
  hyperparameters?: Record<string, any>;
}

/**
 * ML prediction
 */
export interface MLPrediction {
  symbol: Symbol;
  timestamp: number;
  currentPrice: number;
  predictedPrice: number;
  confidence: number; // 0-1
  direction: 'up' | 'down' | 'neutral';
  changePercent: number;
  horizon: number; // Hours
  features?: Record<string, number>;
}

/**
 * Feature importance
 */
export interface FeatureImportance {
  [feature: string]: number; // Importance score (0-1)
}

/**
 * Model performance
 */
export interface ModelPerformance {
  modelType: MLModelType;
  symbol: Symbol;
  accuracy: number;
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Squared Error
  r2: number; // R-squared
  trainSize: number;
  testSize: number;
  trainDate: string;
  featureImportance: FeatureImportance;
}

// ============================================================================
// Arbitrage Types
// ============================================================================

/**
 * Arbitrage opportunity
 */
export interface ArbitrageOpportunity {
  symbol: Symbol;
  buyExchange: ExchangeId;
  sellExchange: ExchangeId;
  buyPrice: number;
  sellPrice: number;
  profitPercent: number;
  profitAmount: number;
  maxAmount: number; // Based on liquidity
  timestamp: number;
  estimatedExecution: number; // Estimated execution time in ms
}

/**
 * Arbitrage execution result
 */
export interface ArbitrageResult {
  opportunity: ArbitrageOpportunity;
  buyOrder: Order;
  sellOrder: Order;
  actualProfitPercent: number;
  actualProfitAmount: number;
  totalCommission: number;
  slippage: number;
  executionTime: number;
  status: 'success' | 'partial' | 'failed';
  error?: string;
}

// ============================================================================
// Monitoring Types
// ============================================================================

/**
 * Performance snapshot
 */
export interface PerformanceSnapshot {
  timestamp: number;
  portfolioValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  dailyPnl: number;
  dailyPnlPercent: number;
  openPositions: number;
  totalTrades: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

/**
 * Alert type
 */
export type AlertType =
  | 'DRAWDOWN'
  | 'LATENCY'
  | 'ERROR'
  | 'POSITION_LIMIT'
  | 'RISK_LIMIT'
  | 'EXCHANGE_ERROR';

/**
 * Alert
 */
export interface Alert {
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  data?: any;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Pagination
 */
export interface Pagination {
  limit?: number;
  since?: number;
  until?: number;
  offset?: number;
}

/**
 * API response wrapper
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * Error codes
 */
export enum ErrorCode {
  EXCHANGE_ERROR = 'EXCHANGE_ERROR',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_ORDER = 'INVALID_ORDER',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RISK_LIMIT_EXCEEDED = 'RISK_LIMIT_EXCEEDED',
  STRATEGY_ERROR = 'STRATEGY_ERROR',
  BACKTEST_ERROR = 'BACKTEST_ERROR',
  ML_ERROR = 'ML_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Trading bot error
 */
export class TradingBotError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'TradingBotError';
  }
}
