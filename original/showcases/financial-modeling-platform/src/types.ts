/**
 * Financial Modeling Platform - Type Definitions
 *
 * Comprehensive type system for quantitative finance operations.
 * Supports derivatives pricing, portfolio management, risk analytics,
 * and time series analysis.
 */

// ============================================================================
// Market Data Types
// ============================================================================

/**
 * Time series data point
 */
export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  volume?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

/**
 * OHLCV bar data
 */
export interface OHLCVBar {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
}

/**
 * Market data for a security
 */
export interface MarketData {
  symbol: string;
  price: number;
  timestamp: Date;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
  volume?: number;
  vwap?: number;
}

/**
 * Yield curve point
 */
export interface YieldCurvePoint {
  maturity: number; // in years
  rate: number; // annual rate
  discount: number; // discount factor
}

/**
 * Complete yield curve
 */
export interface YieldCurve {
  date: Date;
  currency: string;
  points: YieldCurvePoint[];
  interpolationMethod: 'linear' | 'cubic' | 'nelson-siegel';
}

/**
 * Volatility surface point
 */
export interface VolatilitySurfacePoint {
  strike: number;
  maturity: number;
  impliedVol: number;
}

/**
 * Volatility surface
 */
export interface VolatilitySurface {
  underlying: string;
  timestamp: Date;
  points: VolatilitySurfacePoint[];
}

// ============================================================================
// Derivative Types
// ============================================================================

/**
 * Option types
 */
export type OptionType = 'call' | 'put';

/**
 * Option style
 */
export type OptionStyle = 'european' | 'american' | 'bermudan';

/**
 * Option contract specification
 */
export interface OptionContract {
  id: string;
  underlying: string;
  type: OptionType;
  style: OptionStyle;
  strike: number;
  expiry: Date;
  quantity: number;
  multiplier?: number;
}

/**
 * Option pricing parameters
 */
export interface OptionPricingParams {
  spotPrice: number;
  strike: number;
  timeToMaturity: number; // in years
  riskFreeRate: number;
  volatility: number;
  dividendYield?: number;
  optionType: OptionType;
}

/**
 * Option Greeks
 */
export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

/**
 * Option pricing result
 */
export interface OptionPricingResult {
  price: number;
  greeks: OptionGreeks;
  impliedVolatility?: number;
  method: 'black-scholes' | 'binomial' | 'monte-carlo';
  computeTimeMs: number;
}

/**
 * Bond types
 */
export type BondType = 'zero-coupon' | 'fixed-rate' | 'floating-rate' | 'callable' | 'puttable';

/**
 * Bond contract
 */
export interface BondContract {
  id: string;
  issuer: string;
  type: BondType;
  faceValue: number;
  couponRate: number; // annual rate
  couponFrequency: number; // payments per year
  issueDate: Date;
  maturityDate: Date;
  callDates?: Date[];
  putDates?: Date[];
}

/**
 * Bond pricing result
 */
export interface BondPricingResult {
  price: number;
  cleanPrice: number;
  dirtyPrice: number;
  accruedInterest: number;
  yieldToMaturity: number;
  duration: number;
  modifiedDuration: number;
  convexity: number;
  dv01: number;
}

/**
 * Future contract
 */
export interface FutureContract {
  id: string;
  underlying: string;
  expiry: Date;
  contractSize: number;
  tickSize: number;
  tickValue: number;
}

/**
 * Swap types
 */
export type SwapType = 'interest-rate' | 'currency' | 'equity' | 'variance';

/**
 * Interest rate swap
 */
export interface InterestRateSwap {
  id: string;
  type: SwapType;
  notional: number;
  fixedRate: number;
  floatingIndex: string;
  spread: number;
  startDate: Date;
  maturityDate: Date;
  paymentFrequency: number;
  dayCountConvention: string;
}

// ============================================================================
// Portfolio Types
// ============================================================================

/**
 * Asset class
 */
export type AssetClass = 'equity' | 'fixed-income' | 'commodity' | 'currency' | 'derivative' | 'alternative';

/**
 * Position in a portfolio
 */
export interface Position {
  symbol: string;
  assetClass: AssetClass;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  marketValue: number;
  weight: number;
  pnl: number;
  pnlPercent: number;
}

/**
 * Portfolio holdings
 */
export interface Portfolio {
  id: string;
  name: string;
  positions: Position[];
  cash: number;
  totalValue: number;
  currency: string;
  lastUpdate: Date;
}

/**
 * Portfolio optimization constraints
 */
export interface OptimizationConstraints {
  minWeight?: number;
  maxWeight?: number;
  sectorConstraints?: Map<string, { min: number; max: number }>;
  turnoverLimit?: number;
  maxLeverage?: number;
  minDiversification?: number;
}

/**
 * Portfolio optimization objective
 */
export type OptimizationObjective =
  | 'max-sharpe'
  | 'min-variance'
  | 'max-return'
  | 'risk-parity'
  | 'min-cvar';

/**
 * Portfolio optimization result
 */
export interface OptimizationResult {
  weights: number[];
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
  diversificationRatio?: number;
  turnover?: number;
  objective: OptimizationObjective;
  success: boolean;
  iterations: number;
  computeTimeMs: number;
}

/**
 * Efficient frontier point
 */
export interface EfficientFrontierPoint {
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  weights: number[];
}

/**
 * Efficient frontier
 */
export interface EfficientFrontier {
  points: EfficientFrontierPoint[];
  minVariancePoint: EfficientFrontierPoint;
  maxSharpePoint: EfficientFrontierPoint;
  targetReturn?: number;
}

// ============================================================================
// Risk Management Types
// ============================================================================

/**
 * Value at Risk (VaR) method
 */
export type VaRMethod = 'historical' | 'parametric' | 'monte-carlo';

/**
 * VaR calculation result
 */
export interface VaRResult {
  confidenceLevel: number;
  timeHorizon: number; // in days
  var: number;
  cvar: number; // Conditional VaR (Expected Shortfall)
  method: VaRMethod;
  historicalReturns?: number[];
  simulatedReturns?: number[];
}

/**
 * Risk metrics
 */
export interface RiskMetrics {
  var95: number;
  var99: number;
  cvar95: number;
  cvar99: number;
  volatility: number;
  beta: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
}

/**
 * Stress test scenario
 */
export interface StressScenario {
  name: string;
  description: string;
  shocks: Map<string, number>; // asset -> shock (e.g., -0.20 for -20%)
  probability?: number;
}

/**
 * Stress test result
 */
export interface StressTestResult {
  scenario: StressScenario;
  portfolioImpact: number;
  portfolioImpactPercent: number;
  positionImpacts: Map<string, number>;
  varImpact?: number;
  marginImpact?: number;
}

/**
 * Correlation matrix
 */
export interface CorrelationMatrix {
  assets: string[];
  matrix: number[][]; // correlation coefficients
  timestamp: Date;
}

/**
 * Covariance matrix
 */
export interface CovarianceMatrix {
  assets: string[];
  matrix: number[][];
  timestamp: Date;
}

// ============================================================================
// Time Series Analysis Types
// ============================================================================

/**
 * Time series model type
 */
export type TimeSeriesModelType =
  | 'arima'
  | 'arma'
  | 'garch'
  | 'egarch'
  | 'var'
  | 'vecm'
  | 'exponential-smoothing';

/**
 * ARIMA model parameters
 */
export interface ARIMAParams {
  p: number; // AR order
  d: number; // differencing order
  q: number; // MA order
  seasonal?: {
    P: number;
    D: number;
    Q: number;
    period: number;
  };
}

/**
 * GARCH model parameters
 */
export interface GARCHParams {
  p: number; // ARCH order
  q: number; // GARCH order
}

/**
 * Time series forecast
 */
export interface Forecast {
  model: TimeSeriesModelType;
  horizon: number;
  predictions: number[];
  lowerBound: number[];
  upperBound: number[];
  confidenceLevel: number;
  mse: number;
  mae: number;
  mape: number;
}

/**
 * Time series decomposition
 */
export interface TimeSeriesDecomposition {
  trend: number[];
  seasonal: number[];
  residual: number[];
  period: number;
}

/**
 * Autocorrelation result
 */
export interface AutocorrelationResult {
  lags: number[];
  acf: number[];
  pacf: number[];
  ljungBox: {
    statistic: number;
    pValue: number;
  };
}

// ============================================================================
// Monte Carlo Simulation Types
// ============================================================================

/**
 * Random process type
 */
export type ProcessType =
  | 'gbm' // Geometric Brownian Motion
  | 'jump-diffusion'
  | 'heston'
  | 'sabr'
  | 'mean-reverting';

/**
 * Geometric Brownian Motion parameters
 */
export interface GBMParams {
  mu: number; // drift
  sigma: number; // volatility
}

/**
 * Jump diffusion parameters
 */
export interface JumpDiffusionParams extends GBMParams {
  lambda: number; // jump intensity
  jumpMean: number;
  jumpStd: number;
}

/**
 * Heston model parameters
 */
export interface HestonParams {
  mu: number;
  kappa: number; // mean reversion speed
  theta: number; // long-term variance
  sigma: number; // vol of vol
  rho: number; // correlation
  v0: number; // initial variance
}

/**
 * Monte Carlo simulation parameters
 */
export interface MonteCarloParams {
  numPaths: number;
  numSteps: number;
  timeHorizon: number;
  process: ProcessType;
  processParams: GBMParams | JumpDiffusionParams | HestonParams;
  seed?: number;
  antitheticPaths?: boolean;
  controlVariate?: boolean;
}

/**
 * Monte Carlo simulation result
 */
export interface MonteCarloResult {
  paths: number[][];
  expectedValue: number;
  standardError: number;
  confidenceInterval: [number, number];
  numPaths: number;
  computeTimeMs: number;
}

// ============================================================================
// Performance Attribution Types
// ============================================================================

/**
 * Return attribution factors
 */
export interface AttributionFactors {
  market: number;
  sector: number;
  security: number;
  timing: number;
  interaction: number;
}

/**
 * Factor exposure
 */
export interface FactorExposure {
  factor: string;
  exposure: number;
  contribution: number;
  tStat: number;
}

/**
 * Performance attribution result
 */
export interface PerformanceAttribution {
  totalReturn: number;
  benchmarkReturn: number;
  activeReturn: number;
  attribution: AttributionFactors;
  factorExposures: FactorExposure[];
  rSquared: number;
  trackingError: number;
  informationRatio: number;
}

/**
 * Factor model type
 */
export type FactorModelType = 'capm' | 'fama-french-3' | 'fama-french-5' | 'carhart' | 'custom';

/**
 * Factor returns
 */
export interface FactorReturns {
  model: FactorModelType;
  factors: Map<string, number[]>; // factor name -> returns
  dates: Date[];
}

// ============================================================================
// Pricing Engine Types
// ============================================================================

/**
 * Pricing method
 */
export type PricingMethod =
  | 'closed-form'
  | 'numerical'
  | 'tree'
  | 'pde'
  | 'monte-carlo';

/**
 * Pricing request
 */
export interface PricingRequest {
  instrument: OptionContract | BondContract | FutureContract;
  marketData: MarketData;
  method: PricingMethod;
  numPaths?: number;
  numSteps?: number;
  accuracy?: number;
}

/**
 * Pricing response
 */
export interface PricingResponse {
  instrumentId: string;
  price: number;
  currency: string;
  timestamp: Date;
  method: PricingMethod;
  greeks?: OptionGreeks;
  additionalMetrics?: Record<string, number>;
  computeTimeMs: number;
}

/**
 * Batch pricing request
 */
export interface BatchPricingRequest {
  requests: PricingRequest[];
  parallel?: boolean;
  maxConcurrency?: number;
}

/**
 * Batch pricing response
 */
export interface BatchPricingResponse {
  responses: PricingResponse[];
  totalComputeTimeMs: number;
  successCount: number;
  errorCount: number;
  errors?: Array<{ instrumentId: string; error: string }>;
}

// ============================================================================
// Calibration Types
// ============================================================================

/**
 * Model calibration objective
 */
export type CalibrationObjective = 'mse' | 'rmse' | 'mae' | 'mape' | 'log-likelihood';

/**
 * Calibration constraints
 */
export interface CalibrationConstraints {
  parameterBounds: Map<string, [number, number]>;
  linearConstraints?: number[][];
}

/**
 * Calibration result
 */
export interface CalibrationResult {
  parameters: Map<string, number>;
  objectiveValue: number;
  iterations: number;
  convergence: boolean;
  standardErrors?: Map<string, number>;
  computeTimeMs: number;
}

// ============================================================================
// Statistical Types
// ============================================================================

/**
 * Distribution types
 */
export type DistributionType = 'normal' | 'log-normal' | 'student-t' | 'exponential' | 'poisson';

/**
 * Statistical summary
 */
export interface StatisticalSummary {
  count: number;
  mean: number;
  median: number;
  mode?: number;
  std: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  min: number;
  max: number;
  percentiles: Map<number, number>;
}

/**
 * Hypothesis test result
 */
export interface HypothesisTestResult {
  testName: string;
  statistic: number;
  pValue: number;
  criticalValue?: number;
  reject: boolean;
  confidenceLevel: number;
}

/**
 * Regression result
 */
export interface RegressionResult {
  coefficients: number[];
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  pValue: number;
  standardErrors: number[];
  tStats: number[];
  residuals: number[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Date range
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Calculation status
 */
export type CalculationStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Calculation job
 */
export interface CalculationJob<T> {
  id: string;
  status: CalculationStatus;
  progress: number;
  result?: T;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

/**
 * Currency pair
 */
export interface CurrencyPair {
  base: string;
  quote: string;
  rate: number;
  timestamp: Date;
}

/**
 * Day count convention
 */
export type DayCountConvention =
  | 'actual/actual'
  | 'actual/360'
  | 'actual/365'
  | '30/360'
  | '30e/360';

/**
 * Business day convention
 */
export type BusinessDayConvention =
  | 'following'
  | 'modified-following'
  | 'preceding'
  | 'modified-preceding';

/**
 * Calendar
 */
export interface Calendar {
  name: string;
  holidays: Date[];
  isBusinessDay(date: Date): boolean;
  addBusinessDays(date: Date, days: number): Date;
}

/**
 * Benchmark index
 */
export interface BenchmarkIndex {
  symbol: string;
  name: string;
  constituents: string[];
  weights: number[];
  lastRebalance: Date;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  alpha: number;
  beta: number;
  informationRatio: number;
  trackingError: number;
}

/**
 * Backtest result
 */
export interface BacktestResult {
  strategy: string;
  period: DateRange;
  initialCapital: number;
  finalCapital: number;
  metrics: PerformanceMetrics;
  equity: number[];
  returns: number[];
  trades: number;
  winRate: number;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  // Market data
  TimeSeriesPoint,
  OHLCVBar,
  MarketData,
  YieldCurvePoint,
  YieldCurve,
  VolatilitySurfacePoint,
  VolatilitySurface,

  // Derivatives
  OptionType,
  OptionStyle,
  OptionContract,
  OptionPricingParams,
  OptionGreeks,
  OptionPricingResult,
  BondType,
  BondContract,
  BondPricingResult,
  FutureContract,
  SwapType,
  InterestRateSwap,

  // Portfolio
  AssetClass,
  Position,
  Portfolio,
  OptimizationConstraints,
  OptimizationObjective,
  OptimizationResult,
  EfficientFrontierPoint,
  EfficientFrontier,

  // Risk
  VaRMethod,
  VaRResult,
  RiskMetrics,
  StressScenario,
  StressTestResult,
  CorrelationMatrix,
  CovarianceMatrix,

  // Time series
  TimeSeriesModelType,
  ARIMAParams,
  GARCHParams,
  Forecast,
  TimeSeriesDecomposition,
  AutocorrelationResult,

  // Monte Carlo
  ProcessType,
  GBMParams,
  JumpDiffusionParams,
  HestonParams,
  MonteCarloParams,
  MonteCarloResult,

  // Performance attribution
  AttributionFactors,
  FactorExposure,
  PerformanceAttribution,
  FactorModelType,
  FactorReturns,

  // Pricing
  PricingMethod,
  PricingRequest,
  PricingResponse,
  BatchPricingRequest,
  BatchPricingResponse,

  // Calibration
  CalibrationObjective,
  CalibrationConstraints,
  CalibrationResult,

  // Statistics
  DistributionType,
  StatisticalSummary,
  HypothesisTestResult,
  RegressionResult,

  // Utilities
  DateRange,
  CalculationStatus,
  CalculationJob,
  CurrencyPair,
  DayCountConvention,
  BusinessDayConvention,
  Calendar,
  BenchmarkIndex,
  PerformanceMetrics,
  BacktestResult,
};
