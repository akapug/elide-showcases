/**
 * Fintech Trading Platform - Core Type Definitions
 *
 * Comprehensive type system for institutional-grade algorithmic trading.
 * Supports multi-asset trading, risk management, compliance, and analytics.
 */

// =============================================================================
// Asset & Market Data Types
// =============================================================================

export type AssetClass =
  | 'equity'
  | 'option'
  | 'future'
  | 'forex'
  | 'crypto'
  | 'bond'
  | 'commodity'

export type Exchange =
  | 'NYSE'
  | 'NASDAQ'
  | 'ARCA'
  | 'BATS'
  | 'IEX'
  | 'CME'
  | 'CBOE'
  | 'BINANCE'
  | 'COINBASE'

export interface Asset {
  symbol: string
  name: string
  assetClass: AssetClass
  exchange: Exchange
  currency: string
  tickSize: number
  lotSize: number
  tradable: boolean
  shortable: boolean
  marginable: boolean
  metadata?: Record<string, any>
}

export interface Quote {
  symbol: string
  timestamp: number
  bid: number
  ask: number
  bidSize: number
  askSize: number
  last?: number
  lastSize?: number
  volume?: number
}

export interface Trade {
  symbol: string
  timestamp: number
  price: number
  size: number
  side: 'BUY' | 'SELL'
  conditions?: string[]
}

export interface Bar {
  symbol: string
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  vwap?: number
  trades?: number
}

export interface OrderBook {
  symbol: string
  timestamp: number
  bids: Array<[number, number]> // [price, size]
  asks: Array<[number, number]>
  sequence?: number
}

export interface MarketData {
  symbol: string
  timestamp: number
  quote?: Quote
  trade?: Trade
  bar?: Bar
  orderBook?: OrderBook
}

export interface HistoricalData {
  symbol: string
  bars: Bar[]
  adjusted: boolean
  splits?: Split[]
  dividends?: Dividend[]
}

export interface Split {
  date: string
  ratio: number
}

export interface Dividend {
  date: string
  amount: number
  type: 'ordinary' | 'qualified' | 'special'
}

// =============================================================================
// Order & Execution Types
// =============================================================================

export type OrderSide = 'BUY' | 'SELL'

export type OrderType =
  | 'MARKET'
  | 'LIMIT'
  | 'STOP'
  | 'STOP_LIMIT'
  | 'TRAILING_STOP'
  | 'ICEBERG'
  | 'TWAP'
  | 'VWAP'

export type TimeInForce =
  | 'DAY'     // Good for day
  | 'GTC'     // Good till canceled
  | 'IOC'     // Immediate or cancel
  | 'FOK'     // Fill or kill
  | 'GTD'     // Good till date
  | 'OPG'     // At the open
  | 'CLS'     // At the close

export type OrderStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'PARTIAL_FILL'
  | 'FILLED'
  | 'CANCELED'
  | 'REJECTED'
  | 'EXPIRED'

export interface Order {
  id: string
  clientOrderId?: string
  symbol: string
  side: OrderSide
  type: OrderType
  quantity: number
  filledQuantity: number
  remainingQuantity: number
  price?: number
  stopPrice?: number
  trailingAmount?: number
  trailingPercent?: number
  timeInForce: TimeInForce
  status: OrderStatus
  createdAt: number
  updatedAt: number
  submittedAt?: number
  filledAt?: number
  canceledAt?: number
  expiresAt?: number
  venue?: Exchange
  strategy?: string
  metadata?: Record<string, any>
}

export interface Fill {
  id: string
  orderId: string
  symbol: string
  side: OrderSide
  quantity: number
  price: number
  commission: number
  timestamp: number
  venue: Exchange
  liquidity: 'MAKER' | 'TAKER'
  metadata?: Record<string, any>
}

export interface ExecutionReport {
  order: Order
  fills: Fill[]
  avgFillPrice: number
  totalFilled: number
  totalCommission: number
  slippage: number
  implementation_shortfall: number
  duration: number
  vwap?: number
  participation?: number
}

export interface ExecutionAlgorithm {
  type: 'TWAP' | 'VWAP' | 'IS' | 'POV' | 'ADAPTIVE'
  parameters: Record<string, any>
}

export interface TWAPParams {
  duration: number        // milliseconds
  interval: number        // milliseconds
  priceLimit?: number
  limitPriceOffset?: number
  wouldPrice?: number
}

export interface VWAPParams {
  duration: number
  participationRate: number  // 0-1
  priceLimit?: 'no_limit' | 'arrival' | 'no_worse_than_arrival'
  maxParticipation?: number
}

// =============================================================================
// Strategy Types
// =============================================================================

export type StrategyType =
  | 'momentum'
  | 'mean-reversion'
  | 'trend-following'
  | 'statistical-arbitrage'
  | 'market-making'
  | 'pairs-trading'
  | 'machine-learning'
  | 'multi-factor'

export type SignalType =
  | 'BUY'
  | 'SELL'
  | 'HOLD'
  | 'CLOSE'
  | 'REDUCE'
  | 'INCREASE'

export interface Signal {
  symbol: string
  type: SignalType
  strength: number  // 0-1
  confidence?: number
  size?: number
  price?: number
  stopLoss?: number
  takeProfit?: number
  rationale?: string
  timestamp: number
  metadata?: Record<string, any>
}

export interface StrategyParameters {
  [key: string]: number | string | boolean | number[] | string[]
}

export interface TradingStrategy {
  name: string
  version: string
  type: StrategyType
  parameters: StrategyParameters
  assets: string[]
  frequency: '1s' | '1m' | '5m' | '15m' | '1h' | '1d'
  enabled: boolean

  initialize(): Promise<void>
  generateSignal(data: MarketData): Promise<Signal | Signal[]>
  onFill(fill: Fill): Promise<void>
  onCancel(order: Order): Promise<void>
  onMarketData(data: MarketData): Promise<void>
  cleanup(): Promise<void>
}

export interface StrategyPerformance {
  strategyName: string
  totalReturn: number
  annualizedReturn: number
  sharpeRatio: number
  sortinoRatio: number
  maxDrawdown: number
  volatility: number
  winRate: number
  profitFactor: number
  trades: number
  avgWin: number
  avgLoss: number
  largestWin: number
  largestLoss: number
  avgHoldingPeriod: number
}

// =============================================================================
// Portfolio Types
// =============================================================================

export interface Position {
  symbol: string
  assetClass: AssetClass
  quantity: number
  side: 'LONG' | 'SHORT'
  avgPrice: number
  currentPrice: number
  marketValue: number
  costBasis: number
  unrealizedPnl: number
  realizedPnl: number
  totalPnl: number
  returnPercent: number
  dayPnl: number
  dayReturnPercent: number
  weight: number  // % of portfolio
  openedAt: number
  updatedAt: number
  fills: Fill[]
  metadata?: Record<string, any>
}

export interface Portfolio {
  accountId: string
  name: string
  baseCurrency: string
  cash: number
  equity: number
  marginUsed: number
  marginAvailable: number
  buyingPower: number
  positions: Map<string, Position>
  totalValue: number
  totalPnl: number
  dayPnl: number
  returnPercent: number
  dayReturnPercent: number
  leverage: number
  beta: number
  createdAt: number
  updatedAt: number
}

export interface PortfolioSnapshot {
  timestamp: number
  portfolio: Portfolio
  metrics: PortfolioMetrics
}

export interface PortfolioMetrics {
  totalValue: number
  totalReturn: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  sortinoRatio: number
  maxDrawdown: number
  var95: number
  cvar95: number
  beta: number
  alpha: number
  treynorRatio: number
  informationRatio: number
}

export interface Allocation {
  type: 'weight' | 'dollar' | 'risk'
  targets: Map<string, number>
}

export interface Rebalance {
  timestamp: number
  currentWeights: Map<string, number>
  targetWeights: Map<string, number>
  drift: Map<string, number>
  trades: Order[]
  estimatedCost: number
}

// =============================================================================
// Risk Management Types
// =============================================================================

export interface RiskLimits {
  maxPositionSize: number          // % of portfolio
  maxPositionValue?: number        // $ amount
  maxSectorExposure: number        // % of portfolio
  maxAssetClassExposure?: number   // % of portfolio
  maxLeverage: number
  maxDrawdown: number              // % drawdown
  maxDailyLoss?: number            // $ amount
  maxDailyVaR?: number             // $ amount
  maxBeta?: number
  maxConcentration?: number        // % in single position
}

export interface RiskMetrics {
  timestamp: number
  portfolioValue: number
  totalExposure: number
  netExposure: number
  leverage: number
  beta: number
  var95: number
  var99: number
  cvar95: number
  expectedShortfall: number
  stressTestLoss: number
  maxDrawdown: number
  currentDrawdown: number
  volatility: number
  sharpeRatio: number
  exposures: {
    byAssetClass: Map<AssetClass, number>
    bySector: Map<string, number>
    byRegion: Map<string, number>
  }
}

export interface VaRCalculation {
  method: 'historical' | 'parametric' | 'monte_carlo'
  confidence: number
  horizon: number  // days
  var: number
  cvar: number
  expectedShortfall: number
}

export interface StressScenario {
  name: string
  description: string
  shocks: Map<string, number>  // symbol -> % change
  historicalDate?: string
}

export interface StressTestResult {
  scenario: StressScenario
  portfolioImpact: number
  positionImpacts: Map<string, number>
  newPortfolioValue: number
  drawdown: number
}

export interface RiskViolation {
  type: 'limit_breach' | 'threshold_warning'
  rule: string
  current: number
  limit: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: number
}

// =============================================================================
// Compliance Types
// =============================================================================

export type ComplianceRule =
  | 'position_limits'
  | 'best_execution'
  | 'wash_sale'
  | 'pattern_day_trading'
  | 'insider_trading_prevention'
  | 'market_manipulation'
  | 'prohibited_securities'
  | 'concentration_limits'

export interface ComplianceCheck {
  rule: ComplianceRule
  approved: boolean
  violations: ComplianceViolation[]
  warnings: ComplianceWarning[]
  timestamp: number
}

export interface ComplianceViolation {
  rule: ComplianceRule
  severity: 'minor' | 'major' | 'critical'
  message: string
  details: Record<string, any>
  action: 'block' | 'warn' | 'report'
}

export interface ComplianceWarning {
  rule: ComplianceRule
  message: string
  recommendation?: string
}

export interface AuditEntry {
  id: string
  timestamp: number
  eventType: 'order' | 'fill' | 'cancel' | 'modification' | 'compliance_check'
  userId: string
  accountId: string
  symbol?: string
  order?: Order
  fill?: Fill
  complianceCheck?: ComplianceCheck
  strategyName?: string
  rationale?: string
  metadata?: Record<string, any>
}

export interface WashSaleEvent {
  symbol: string
  sellDate: number
  sellQuantity: number
  sellPrice: number
  loss: number
  buyDate: number
  buyQuantity: number
  buyPrice: number
  disallowedLoss: number
}

// =============================================================================
// Backtesting Types
// =============================================================================

export interface BacktestConfig {
  strategy: TradingStrategy
  startDate: string | number
  endDate: string | number
  initialCapital: number
  assets?: string[]
  frequency?: '1s' | '1m' | '5m' | '15m' | '1h' | '1d'
  commission?: CommissionModel
  slippage?: SlippageModel
  benchmark?: string
  cashInterest?: number
  marginInterest?: number
  allowShort?: boolean
  maxLeverage?: number
}

export interface CommissionModel {
  type: 'fixed' | 'percentage' | 'tiered' | 'per_share'
  rate: number
  minimum?: number
  maximum?: number
  tiers?: Array<{ threshold: number; rate: number }>
}

export interface SlippageModel {
  type: 'fixed' | 'percentage' | 'volume_share' | 'market_impact'
  rate: number
  marketImpactCoefficient?: number
}

export interface BacktestResult {
  config: BacktestConfig
  performance: StrategyPerformance
  metrics: BacktestMetrics
  trades: Trade[]
  positions: PositionHistory[]
  equity: EquityCurve
  drawdown: DrawdownCurve
  returns: ReturnsSeries
  benchmark?: BenchmarkComparison
  tearsheet?: TearsheetData
}

export interface BacktestMetrics {
  totalReturn: number
  annualizedReturn: number
  cagr: number
  volatility: number
  sharpeRatio: number
  sortinoRatio: number
  calmarRatio: number
  maxDrawdown: number
  maxDrawdownDuration: number
  winRate: number
  profitFactor: number
  payoffRatio: number
  recoveryFactor: number
  ulcerIndex: number
  trades: number
  winners: number
  losers: number
  avgWin: number
  avgLoss: number
  largestWin: number
  largestLoss: number
  avgHoldingPeriod: number
  turnover: number
  commissions: number
  slippage: number
  startDate: number
  endDate: number
  duration: number
}

export interface PositionHistory {
  symbol: string
  entryDate: number
  exitDate?: number
  entryPrice: number
  exitPrice?: number
  quantity: number
  side: 'LONG' | 'SHORT'
  pnl?: number
  return?: number
  duration?: number
  mae?: number  // Maximum Adverse Excursion
  mfe?: number  // Maximum Favorable Excursion
}

export interface EquityCurve {
  timestamps: number[]
  values: number[]
  returns: number[]
}

export interface DrawdownCurve {
  timestamps: number[]
  drawdowns: number[]
  maxDrawdown: number
  maxDrawdownStart: number
  maxDrawdownEnd: number
  maxDrawdownRecovery?: number
  underwater: number[]
}

export interface ReturnsSeries {
  timestamps: number[]
  dailyReturns: number[]
  cumulativeReturns: number[]
  monthlyReturns?: number[]
  annualReturns?: number[]
}

export interface BenchmarkComparison {
  benchmark: string
  correlation: number
  beta: number
  alpha: number
  trackingError: number
  informationRatio: number
  outperformance: number
}

export interface TearsheetData {
  summary: BacktestMetrics
  returns: ReturnsSeries
  drawdown: DrawdownCurve
  rolling: RollingMetrics
  distributions: ReturnsDistribution
  trades: TradeAnalysis
  positions: PositionAnalysis
}

export interface RollingMetrics {
  window: number
  sharpe: number[]
  volatility: number[]
  beta?: number[]
  alpha?: number[]
}

export interface ReturnsDistribution {
  mean: number
  std: number
  skew: number
  kurtosis: number
  histogram: { bins: number[]; counts: number[] }
  qq_plot?: { theoretical: number[]; actual: number[] }
}

export interface TradeAnalysis {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  avgWin: number
  avgLoss: number
  largestWin: number
  largestLoss: number
  avgHoldingPeriod: number
  byHour?: Map<number, TradeStats>
  byDay?: Map<string, TradeStats>
  byMonth?: Map<string, TradeStats>
}

export interface TradeStats {
  count: number
  winners: number
  losers: number
  avgReturn: number
  totalPnl: number
}

export interface PositionAnalysis {
  avgPositions: number
  maxPositions: number
  avgExposure: number
  maxExposure: number
  concentration: Map<string, number>
  holding_periods: number[]
}

// =============================================================================
// Optimization Types
// =============================================================================

export interface OptimizationConfig {
  strategy: TradingStrategy
  parameters: ParameterGrid
  data: HistoricalData[]
  metric: OptimizationMetric
  method: 'grid_search' | 'random_search' | 'genetic_algorithm' | 'bayesian'
  numIterations?: number
  parallelism?: number
  crossValidation?: CrossValidationConfig
}

export interface ParameterGrid {
  [parameter: string]: number[] | string[] | boolean[]
}

export type OptimizationMetric =
  | 'total_return'
  | 'sharpe_ratio'
  | 'sortino_ratio'
  | 'calmar_ratio'
  | 'profit_factor'
  | 'omega_ratio'
  | 'custom'

export interface OptimizationResult {
  bestParameters: StrategyParameters
  bestScore: number
  allResults: OptimizationRun[]
  convergence: number[]
  method: string
  iterations: number
  duration: number
}

export interface OptimizationRun {
  parameters: StrategyParameters
  score: number
  metrics: BacktestMetrics
  rank: number
}

export interface CrossValidationConfig {
  method: 'k_fold' | 'walk_forward' | 'purged_k_fold'
  folds: number
  purge?: number  // days to purge between folds
}

export interface WalkForwardConfig {
  windows: WalkForwardWindow[]
  optimizationMetric: OptimizationMetric
  reoptimizeFrequency: 'monthly' | 'quarterly' | 'annually'
}

export interface WalkForwardWindow {
  trainStart: number
  trainEnd: number
  testStart: number
  testEnd: number
}

// =============================================================================
// Analytics Types
// =============================================================================

export interface PerformanceAnalytics {
  calculateReturns(prices: number[]): number[]
  calculateSharpe(returns: number[], riskFreeRate: number): number
  calculateSortino(returns: number[], riskFreeRate: number): number
  calculateMaxDrawdown(equity: number[]): DrawdownAnalysis
  calculateVaR(returns: number[], confidence: number): number
  calculateBeta(returns: number[], benchmarkReturns: number[]): number
  calculateAlpha(
    returns: number[],
    benchmarkReturns: number[],
    riskFreeRate: number
  ): number
}

export interface DrawdownAnalysis {
  maxDrawdown: number
  maxDrawdownStart: number
  maxDrawdownEnd: number
  maxDrawdownRecovery?: number
  avgDrawdown: number
  drawdownPeriods: DrawdownPeriod[]
}

export interface DrawdownPeriod {
  start: number
  end: number
  recovery?: number
  depth: number
  duration: number
  recoveryDuration?: number
}

export interface Attribution {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  totalReturn: number
  factors: {
    market: number
    sector: number
    security: number
    currency?: number
  }
  byAsset: Map<string, AssetAttribution>
  bySector: Map<string, SectorAttribution>
  alpha: number
  residual: number
}

export interface AssetAttribution {
  symbol: string
  weight: number
  return: number
  contribution: number
  alpha: number
}

export interface SectorAttribution {
  sector: string
  weight: number
  return: number
  contribution: number
  allocation_effect: number
  selection_effect: number
}

// =============================================================================
// Data Provider Types
// =============================================================================

export type DataProvider =
  | 'polygon'
  | 'alpaca'
  | 'alpha_vantage'
  | 'yahoo'
  | 'iex'
  | 'tradier'
  | 'binance'

export interface DataProviderConfig {
  provider: DataProvider
  apiKey?: string
  secretKey?: string
  baseUrl?: string
  rateLimit?: number
  cache?: boolean
  cacheTTL?: number
}

export interface DataSubscription {
  symbols: string[]
  channels: ('quotes' | 'trades' | 'bars' | 'orderbook')[]
  onData: (data: MarketData) => void
  onError: (error: Error) => void
}

// =============================================================================
// Broker Types
// =============================================================================

export type Broker =
  | 'alpaca'
  | 'interactive_brokers'
  | 'td_ameritrade'
  | 'tradier'
  | 'binance'
  | 'coinbase'
  | 'kraken'

export interface BrokerConfig {
  broker: Broker
  apiKey: string
  secretKey?: string
  accountId?: string
  paper?: boolean
  baseUrl?: string
}

export interface BrokerAccount {
  accountId: string
  accountType: 'cash' | 'margin' | 'portfolio_margin'
  currency: string
  equity: number
  cash: number
  buyingPower: number
  marginUsed: number
  maintenanceMargin: number
  dayTradingBuyingPower?: number
  regtBuyingPower?: number
  status: 'active' | 'inactive' | 'frozen'
  tradingBlocked: boolean
  transfersBlocked: boolean
}

// =============================================================================
// Event Types
// =============================================================================

export type EventType =
  | 'market_data'
  | 'signal'
  | 'order_submitted'
  | 'order_accepted'
  | 'order_filled'
  | 'order_canceled'
  | 'order_rejected'
  | 'position_opened'
  | 'position_closed'
  | 'risk_violation'
  | 'compliance_violation'
  | 'error'

export interface TradingEvent {
  type: EventType
  timestamp: number
  data: any
  metadata?: Record<string, any>
}

// =============================================================================
// Configuration Types
// =============================================================================

export interface TradingSystemConfig {
  mode: 'backtest' | 'paper' | 'live'
  account: BrokerConfig
  marketData: DataProviderConfig
  strategies: TradingStrategy[]
  risk: RiskLimits
  compliance: ComplianceRule[]
  execution: ExecutionConfig
  logging: LoggingConfig
  monitoring?: MonitoringConfig
}

export interface ExecutionConfig {
  defaultAlgorithm?: 'MARKET' | 'TWAP' | 'VWAP'
  slippage?: SlippageModel
  commission?: CommissionModel
  venues?: Exchange[]
  router?: 'smart' | 'direct'
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  console: boolean
  file?: string
  format: 'json' | 'text'
}

export interface MonitoringConfig {
  enabled: boolean
  sentry?: { dsn: string }
  datadog?: { apiKey: string }
  metrics: string[]
}

// =============================================================================
// Utility Types
// =============================================================================

export interface TimeRange {
  start: number | string
  end: number | string
}

export interface Pagination {
  page: number
  pageSize: number
  total?: number
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

export interface Cache<T> {
  get(key: string): T | undefined
  set(key: string, value: T, ttl?: number): void
  has(key: string): boolean
  delete(key: string): void
  clear(): void
}

// =============================================================================
// Type Guards
// =============================================================================

export function isOrder(obj: any): obj is Order {
  return obj && typeof obj.id === 'string' && typeof obj.symbol === 'string'
}

export function isFill(obj: any): obj is Fill {
  return obj && typeof obj.id === 'string' && typeof obj.orderId === 'string'
}

export function isSignal(obj: any): obj is Signal {
  return obj && typeof obj.symbol === 'string' && typeof obj.type === 'string'
}

export function isPosition(obj: any): obj is Position {
  return obj && typeof obj.symbol === 'string' && typeof obj.quantity === 'number'
}
