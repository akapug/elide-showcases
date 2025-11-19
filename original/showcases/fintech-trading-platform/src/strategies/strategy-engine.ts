/**
 * Strategy Engine - Core Strategy Management and Execution
 *
 * Manages trading strategies, signal generation, and strategy lifecycle.
 * Supports momentum, mean reversion, statistical arbitrage, and ML strategies.
 */

// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import talib from 'python:talib'
// @ts-ignore
import sklearn from 'python:sklearn'

import type {
  TradingStrategy,
  StrategyType,
  StrategyParameters,
  Signal,
  MarketData,
  Fill,
  Order,
  Bar,
  Quote
} from '../types.ts'

/**
 * Strategy Engine - Manages all trading strategies
 */
export class StrategyEngine {
  private strategies: Map<string, TradingStrategy> = new Map()
  private activeStrategies: Set<string> = new Set()
  private strategyStates: Map<string, any> = new Map()
  private signalHistory: Map<string, Signal[]> = new Map()

  constructor() {}

  /**
   * Register a new strategy
   */
  registerStrategy(strategy: TradingStrategy): void {
    this.strategies.set(strategy.name, strategy)
    this.strategyStates.set(strategy.name, {})
    this.signalHistory.set(strategy.name, [])
  }

  /**
   * Create a strategy from configuration
   */
  createStrategy(config: {
    name: string
    type: StrategyType
    parameters: StrategyParameters
    assets: string[]
    frequency?: string
  }): TradingStrategy {
    let strategy: TradingStrategy

    switch (config.type) {
      case 'momentum':
        strategy = new MomentumStrategy(config.name, config.parameters, config.assets)
        break
      case 'mean-reversion':
        strategy = new MeanReversionStrategy(config.name, config.parameters, config.assets)
        break
      case 'trend-following':
        strategy = new TrendFollowingStrategy(config.name, config.parameters, config.assets)
        break
      case 'statistical-arbitrage':
        strategy = new PairsStrategy(config.name, config.parameters, config.assets)
        break
      case 'machine-learning':
        strategy = new MLStrategy(config.name, config.parameters, config.assets)
        break
      default:
        throw new Error(`Unknown strategy type: ${config.type}`)
    }

    this.registerStrategy(strategy)
    return strategy
  }

  /**
   * Activate a strategy
   */
  async activateStrategy(name: string): Promise<void> {
    const strategy = this.strategies.get(name)
    if (!strategy) throw new Error(`Strategy not found: ${name}`)

    await strategy.initialize()
    this.activeStrategies.add(name)
  }

  /**
   * Deactivate a strategy
   */
  async deactivateStrategy(name: string): Promise<void> {
    const strategy = this.strategies.get(name)
    if (!strategy) throw new Error(`Strategy not found: ${name}`)

    await strategy.cleanup()
    this.activeStrategies.delete(name)
  }

  /**
   * Process market data through all active strategies
   */
  async processMarketData(data: MarketData): Promise<Map<string, Signal | Signal[]>> {
    const signals = new Map<string, Signal | Signal[]>()

    for (const name of this.activeStrategies) {
      const strategy = this.strategies.get(name)
      if (!strategy) continue

      // Check if strategy trades this asset
      if (!strategy.assets.includes(data.symbol)) continue

      try {
        const signal = await strategy.generateSignal(data)
        if (signal) {
          signals.set(name, signal)
          this.recordSignal(name, signal)
        }
      } catch (error) {
        console.error(`Strategy ${name} error:`, error)
      }
    }

    return signals
  }

  /**
   * Record signal in history
   */
  private recordSignal(strategyName: string, signal: Signal | Signal[]): void {
    const history = this.signalHistory.get(strategyName) || []
    if (Array.isArray(signal)) {
      history.push(...signal)
    } else {
      history.push(signal)
    }
    this.signalHistory.set(strategyName, history)
  }

  /**
   * Get signal history for a strategy
   */
  getSignalHistory(strategyName: string): Signal[] {
    return this.signalHistory.get(strategyName) || []
  }

  /**
   * Get all strategies
   */
  getAllStrategies(): TradingStrategy[] {
    return Array.from(this.strategies.values())
  }

  /**
   * Get active strategies
   */
  getActiveStrategies(): TradingStrategy[] {
    return Array.from(this.activeStrategies)
      .map(name => this.strategies.get(name)!)
      .filter(s => s !== undefined)
  }
}

/**
 * Momentum Strategy - Buy on upward momentum, sell on downward momentum
 */
export class MomentumStrategy implements TradingStrategy {
  name: string
  version = '1.0.0'
  type: StrategyType = 'momentum'
  parameters: StrategyParameters
  assets: string[]
  frequency = '1d' as const
  enabled = true

  private priceHistory: Map<string, number[]> = new Map()
  private positions: Map<string, 'LONG' | 'SHORT' | null> = new Map()

  constructor(name: string, parameters: StrategyParameters, assets: string[]) {
    this.name = name
    this.parameters = {
      lookback: 20,
      threshold: 0.02,
      exitThreshold: 0.01,
      stopLoss: 0.05,
      takeProfit: 0.15,
      ...parameters
    }
    this.assets = assets
  }

  async initialize(): Promise<void> {
    console.log(`Initializing ${this.name} strategy`)
    for (const asset of this.assets) {
      this.priceHistory.set(asset, [])
      this.positions.set(asset, null)
    }
  }

  async generateSignal(data: MarketData): Promise<Signal> {
    const symbol = data.symbol
    const price = data.bar?.close || data.quote?.last || 0

    // Update price history
    const history = this.priceHistory.get(symbol) || []
    history.push(price)
    if (history.length > (this.parameters.lookback as number) * 2) {
      history.shift()
    }
    this.priceHistory.set(symbol, history)

    // Need enough data
    if (history.length < this.parameters.lookback as number) {
      return { symbol, type: 'HOLD', strength: 0, timestamp: Date.now() }
    }

    // Calculate momentum using TA-Lib
    const series = pandas.Series(history)
    const momentum = talib.MOM(series, { timeperiod: this.parameters.lookback })
    const rsi = talib.RSI(series, { timeperiod: 14 })
    const macd = talib.MACD(series)

    const currentMomentum = momentum.iloc[-1] / price
    const currentRSI = rsi.iloc[-1]
    const macdValue = macd.macd.iloc[-1]
    const macdSignal = macd.macdsignal.iloc[-1]

    const position = this.positions.get(symbol)
    const threshold = this.parameters.threshold as number

    // Generate signals
    if (position === null) {
      // Entry signals
      if (
        currentMomentum > threshold &&
        currentRSI < 70 &&
        macdValue > macdSignal
      ) {
        return {
          symbol,
          type: 'BUY',
          strength: Math.min(Math.abs(currentMomentum) / threshold, 1),
          confidence: (currentRSI / 100 + 0.5) / 2,
          stopLoss: price * (1 - (this.parameters.stopLoss as number)),
          takeProfit: price * (1 + (this.parameters.takeProfit as number)),
          rationale: `Strong upward momentum: ${(currentMomentum * 100).toFixed(2)}%, RSI: ${currentRSI.toFixed(2)}`,
          timestamp: Date.now()
        }
      } else if (
        currentMomentum < -threshold &&
        currentRSI > 30 &&
        macdValue < macdSignal
      ) {
        return {
          symbol,
          type: 'SELL',
          strength: Math.min(Math.abs(currentMomentum) / threshold, 1),
          confidence: ((100 - currentRSI) / 100 + 0.5) / 2,
          stopLoss: price * (1 + (this.parameters.stopLoss as number)),
          takeProfit: price * (1 - (this.parameters.takeProfit as number)),
          rationale: `Strong downward momentum: ${(currentMomentum * 100).toFixed(2)}%, RSI: ${currentRSI.toFixed(2)}`,
          timestamp: Date.now()
        }
      }
    } else {
      // Exit signals
      const exitThreshold = this.parameters.exitThreshold as number
      if (position === 'LONG' && (currentMomentum < -exitThreshold || currentRSI > 75)) {
        return {
          symbol,
          type: 'CLOSE',
          strength: 1.0,
          rationale: 'Exit long: momentum reversal',
          timestamp: Date.now()
        }
      } else if (position === 'SHORT' && (currentMomentum > exitThreshold || currentRSI < 25)) {
        return {
          symbol,
          type: 'CLOSE',
          strength: 1.0,
          rationale: 'Exit short: momentum reversal',
          timestamp: Date.now()
        }
      }
    }

    return { symbol, type: 'HOLD', strength: 0, timestamp: Date.now() }
  }

  async onFill(fill: Fill): Promise<void> {
    if (fill.side === 'BUY') {
      this.positions.set(fill.symbol, 'LONG')
    } else if (fill.side === 'SELL') {
      this.positions.set(fill.symbol, 'SHORT')
    }
  }

  async onCancel(order: Order): Promise<void> {
    console.log(`Order canceled: ${order.id}`)
  }

  async onMarketData(data: MarketData): Promise<void> {
    // Process market data updates
  }

  async cleanup(): Promise<void> {
    console.log(`Cleaning up ${this.name} strategy`)
    this.priceHistory.clear()
    this.positions.clear()
  }
}

/**
 * Mean Reversion Strategy - Buy oversold, sell overbought
 */
export class MeanReversionStrategy implements TradingStrategy {
  name: string
  version = '1.0.0'
  type: StrategyType = 'mean-reversion'
  parameters: StrategyParameters
  assets: string[]
  frequency = '1d' as const
  enabled = true

  private priceHistory: Map<string, number[]> = new Map()
  private positions: Map<string, 'LONG' | 'SHORT' | null> = new Map()

  constructor(name: string, parameters: StrategyParameters, assets: string[]) {
    this.name = name
    this.parameters = {
      lookback: 20,
      entryThreshold: 2.0,    // Standard deviations
      exitThreshold: 0.5,
      stopLoss: 0.03,
      ...parameters
    }
    this.assets = assets
  }

  async initialize(): Promise<void> {
    console.log(`Initializing ${this.name} strategy`)
    for (const asset of this.assets) {
      this.priceHistory.set(asset, [])
      this.positions.set(asset, null)
    }
  }

  async generateSignal(data: MarketData): Promise<Signal> {
    const symbol = data.symbol
    const price = data.bar?.close || data.quote?.last || 0

    // Update price history
    const history = this.priceHistory.get(symbol) || []
    history.push(price)
    if (history.length > (this.parameters.lookback as number) * 3) {
      history.shift()
    }
    this.priceHistory.set(symbol, history)

    if (history.length < this.parameters.lookback as number) {
      return { symbol, type: 'HOLD', strength: 0, timestamp: Date.now() }
    }

    // Calculate Bollinger Bands
    const series = pandas.Series(history)
    const bbands = talib.BBANDS(series, {
      timeperiod: this.parameters.lookback,
      nbdevup: this.parameters.entryThreshold,
      nbdevdn: this.parameters.entryThreshold
    })

    const upperBand = bbands.upperband.iloc[-1]
    const lowerBand = bbands.lowerband.iloc[-1]
    const middleBand = bbands.middleband.iloc[-1]

    // Calculate Z-score
    const mean = series.tail(this.parameters.lookback).mean()
    const std = series.tail(this.parameters.lookback).std()
    const zScore = (price - mean) / std

    const position = this.positions.get(symbol)
    const entryThreshold = this.parameters.entryThreshold as number
    const exitThreshold = this.parameters.exitThreshold as number

    if (position === null) {
      // Entry signals - price at extremes
      if (price < lowerBand && zScore < -entryThreshold) {
        return {
          symbol,
          type: 'BUY',
          strength: Math.min(Math.abs(zScore) / entryThreshold, 1),
          confidence: Math.abs(zScore) / (entryThreshold + 1),
          stopLoss: price * (1 - (this.parameters.stopLoss as number)),
          rationale: `Price below lower band: Z-score ${zScore.toFixed(2)}`,
          timestamp: Date.now()
        }
      } else if (price > upperBand && zScore > entryThreshold) {
        return {
          symbol,
          type: 'SELL',
          strength: Math.min(Math.abs(zScore) / entryThreshold, 1),
          confidence: Math.abs(zScore) / (entryThreshold + 1),
          stopLoss: price * (1 + (this.parameters.stopLoss as number)),
          rationale: `Price above upper band: Z-score ${zScore.toFixed(2)}`,
          timestamp: Date.now()
        }
      }
    } else {
      // Exit signals - price reverts to mean
      if (Math.abs(price - middleBand) / middleBand < exitThreshold / 100) {
        return {
          symbol,
          type: 'CLOSE',
          strength: 1.0,
          rationale: 'Price reverted to mean',
          timestamp: Date.now()
        }
      }
    }

    return { symbol, type: 'HOLD', strength: 0, timestamp: Date.now() }
  }

  async onFill(fill: Fill): Promise<void> {
    if (fill.side === 'BUY') {
      this.positions.set(fill.symbol, 'LONG')
    } else if (fill.side === 'SELL') {
      this.positions.set(fill.symbol, 'SHORT')
    }
  }

  async onCancel(order: Order): Promise<void> {}
  async onMarketData(data: MarketData): Promise<void> {}

  async cleanup(): Promise<void> {
    this.priceHistory.clear()
    this.positions.clear()
  }
}

/**
 * Trend Following Strategy - Follow the trend using moving averages
 */
export class TrendFollowingStrategy implements TradingStrategy {
  name: string
  version = '1.0.0'
  type: StrategyType = 'trend-following'
  parameters: StrategyParameters
  assets: string[]
  frequency = '1d' as const
  enabled = true

  private priceHistory: Map<string, number[]> = new Map()
  private positions: Map<string, 'LONG' | 'SHORT' | null> = new Map()

  constructor(name: string, parameters: StrategyParameters, assets: string[]) {
    this.name = name
    this.parameters = {
      fastPeriod: 10,
      slowPeriod: 30,
      atrPeriod: 14,
      atrMultiplier: 2.0,
      ...parameters
    }
    this.assets = assets
  }

  async initialize(): Promise<void> {
    for (const asset of this.assets) {
      this.priceHistory.set(asset, [])
      this.positions.set(asset, null)
    }
  }

  async generateSignal(data: MarketData): Promise<Signal> {
    const symbol = data.symbol
    const price = data.bar?.close || data.quote?.last || 0

    const history = this.priceHistory.get(symbol) || []
    history.push(price)
    if (history.length > (this.parameters.slowPeriod as number) * 2) {
      history.shift()
    }
    this.priceHistory.set(symbol, history)

    if (history.length < this.parameters.slowPeriod as number) {
      return { symbol, type: 'HOLD', strength: 0, timestamp: Date.now() }
    }

    // Calculate moving averages
    const series = pandas.Series(history)
    const fastMA = talib.SMA(series, { timeperiod: this.parameters.fastPeriod })
    const slowMA = talib.SMA(series, { timeperiod: this.parameters.slowPeriod })
    const atr = talib.ATR(
      pandas.Series(history),
      pandas.Series(history),
      pandas.Series(history),
      { timeperiod: this.parameters.atrPeriod }
    )

    const fastValue = fastMA.iloc[-1]
    const slowValue = slowMA.iloc[-1]
    const atrValue = atr.iloc[-1]

    const position = this.positions.get(symbol)
    const atrMultiplier = this.parameters.atrMultiplier as number

    if (position === null) {
      // Golden cross - buy signal
      if (fastValue > slowValue && fastMA.iloc[-2] <= slowMA.iloc[-2]) {
        return {
          symbol,
          type: 'BUY',
          strength: (fastValue - slowValue) / slowValue,
          stopLoss: price - atrValue * atrMultiplier,
          rationale: 'Golden cross: fast MA crossed above slow MA',
          timestamp: Date.now()
        }
      }
      // Death cross - sell signal
      else if (fastValue < slowValue && fastMA.iloc[-2] >= slowMA.iloc[-2]) {
        return {
          symbol,
          type: 'SELL',
          strength: (slowValue - fastValue) / slowValue,
          stopLoss: price + atrValue * atrMultiplier,
          rationale: 'Death cross: fast MA crossed below slow MA',
          timestamp: Date.now()
        }
      }
    } else {
      // Exit on trend reversal
      if (position === 'LONG' && fastValue < slowValue) {
        return {
          symbol,
          type: 'CLOSE',
          strength: 1.0,
          rationale: 'Exit long: trend reversal',
          timestamp: Date.now()
        }
      } else if (position === 'SHORT' && fastValue > slowValue) {
        return {
          symbol,
          type: 'CLOSE',
          strength: 1.0,
          rationale: 'Exit short: trend reversal',
          timestamp: Date.now()
        }
      }
    }

    return { symbol, type: 'HOLD', strength: 0, timestamp: Date.now() }
  }

  async onFill(fill: Fill): Promise<void> {
    if (fill.side === 'BUY') {
      this.positions.set(fill.symbol, 'LONG')
    } else {
      this.positions.set(fill.symbol, 'SHORT')
    }
  }

  async onCancel(order: Order): Promise<void> {}
  async onMarketData(data: MarketData): Promise<void> {}

  async cleanup(): Promise<void> {
    this.priceHistory.clear()
    this.positions.clear()
  }
}

/**
 * Pairs Trading Strategy - Statistical arbitrage between correlated assets
 */
export class PairsStrategy implements TradingStrategy {
  name: string
  version = '1.0.0'
  type: StrategyType = 'statistical-arbitrage'
  parameters: StrategyParameters
  assets: string[]
  frequency = '1d' as const
  enabled = true

  private priceHistory: Map<string, number[]> = new Map()
  private hedgeRatio = 1.0
  private positions: Map<string, number> = new Map()

  constructor(name: string, parameters: StrategyParameters, assets: string[]) {
    this.name = name
    this.parameters = {
      lookback: 60,
      entryThreshold: 2.0,
      exitThreshold: 0.5,
      ...parameters
    }
    this.assets = assets

    if (assets.length !== 2) {
      throw new Error('Pairs strategy requires exactly 2 assets')
    }
  }

  async initialize(): Promise<void> {
    for (const asset of this.assets) {
      this.priceHistory.set(asset, [])
      this.positions.set(asset, 0)
    }
  }

  async generateSignal(data: MarketData): Promise<Signal[]> {
    const symbol = data.symbol
    const price = data.bar?.close || data.quote?.last || 0

    const history = this.priceHistory.get(symbol) || []
    history.push(price)
    if (history.length > (this.parameters.lookback as number) * 2) {
      history.shift()
    }
    this.priceHistory.set(symbol, history)

    // Need data for both assets
    const history1 = this.priceHistory.get(this.assets[0])!
    const history2 = this.priceHistory.get(this.assets[1])!

    if (
      history1.length < this.parameters.lookback as number ||
      history2.length < this.parameters.lookback as number
    ) {
      return []
    }

    // Calculate hedge ratio using linear regression
    const prices1 = pandas.Series(history1)
    const prices2 = pandas.Series(history2)

    const model = sklearn.linear_model.LinearRegression()
    const X = prices2.values.reshape(-1, 1)
    const y = prices1.values
    model.fit(X, y)
    this.hedgeRatio = model.coef_[0]

    // Calculate spread
    const spread = prices1.sub(prices2.mul(this.hedgeRatio))
    const spreadMean = spread.mean()
    const spreadStd = spread.std()
    const zScore = (spread.iloc[-1] - spreadMean) / spreadStd

    const signals: Signal[] = []
    const entryThreshold = this.parameters.entryThreshold as number
    const exitThreshold = this.parameters.exitThreshold as number

    const position1 = this.positions.get(this.assets[0]) || 0
    const position2 = this.positions.get(this.assets[1]) || 0

    if (position1 === 0 && position2 === 0) {
      // Entry signals
      if (zScore > entryThreshold) {
        // Spread too high: sell asset 1, buy asset 2
        signals.push({
          symbol: this.assets[0],
          type: 'SELL',
          strength: Math.min(Math.abs(zScore) / entryThreshold, 1),
          rationale: `Pairs trade: spread z-score ${zScore.toFixed(2)}`,
          timestamp: Date.now()
        })
        signals.push({
          symbol: this.assets[1],
          type: 'BUY',
          strength: Math.min(Math.abs(zScore) / entryThreshold, 1),
          size: this.hedgeRatio,
          rationale: `Pairs trade: spread z-score ${zScore.toFixed(2)}`,
          timestamp: Date.now()
        })
      } else if (zScore < -entryThreshold) {
        // Spread too low: buy asset 1, sell asset 2
        signals.push({
          symbol: this.assets[0],
          type: 'BUY',
          strength: Math.min(Math.abs(zScore) / entryThreshold, 1),
          rationale: `Pairs trade: spread z-score ${zScore.toFixed(2)}`,
          timestamp: Date.now()
        })
        signals.push({
          symbol: this.assets[1],
          type: 'SELL',
          strength: Math.min(Math.abs(zScore) / entryThreshold, 1),
          size: this.hedgeRatio,
          rationale: `Pairs trade: spread z-score ${zScore.toFixed(2)}`,
          timestamp: Date.now()
        })
      }
    } else if (Math.abs(zScore) < exitThreshold) {
      // Exit signals - spread converged
      signals.push({
        symbol: this.assets[0],
        type: 'CLOSE',
        strength: 1.0,
        rationale: 'Pairs trade exit: spread converged',
        timestamp: Date.now()
      })
      signals.push({
        symbol: this.assets[1],
        type: 'CLOSE',
        strength: 1.0,
        rationale: 'Pairs trade exit: spread converged',
        timestamp: Date.now()
      })
    }

    return signals
  }

  async onFill(fill: Fill): Promise<void> {
    const current = this.positions.get(fill.symbol) || 0
    if (fill.side === 'BUY') {
      this.positions.set(fill.symbol, current + fill.quantity)
    } else {
      this.positions.set(fill.symbol, current - fill.quantity)
    }
  }

  async onCancel(order: Order): Promise<void> {}
  async onMarketData(data: MarketData): Promise<void> {}

  async cleanup(): Promise<void> {
    this.priceHistory.clear()
    this.positions.clear()
  }
}

/**
 * Machine Learning Strategy - Use ML models for prediction
 */
export class MLStrategy implements TradingStrategy {
  name: string
  version = '1.0.0'
  type: StrategyType = 'machine-learning'
  parameters: StrategyParameters
  assets: string[]
  frequency = '1d' as const
  enabled = true

  private model: any
  private featureHistory: Map<string, any[]> = new Map()
  private priceHistory: Map<string, number[]> = new Map()

  constructor(name: string, parameters: StrategyParameters, assets: string[]) {
    this.name = name
    this.parameters = {
      modelType: 'random_forest',
      lookback: 30,
      retrainFrequency: 100,
      confidenceThreshold: 0.65,
      ...parameters
    }
    this.assets = assets
  }

  async initialize(): Promise<void> {
    // Initialize or load pre-trained model
    this.model = this.createModel()

    for (const asset of this.assets) {
      this.featureHistory.set(asset, [])
      this.priceHistory.set(asset, [])
    }
  }

  private createModel() {
    const modelType = this.parameters.modelType as string

    if (modelType === 'random_forest') {
      return sklearn.ensemble.RandomForestClassifier({
        n_estimators: 100,
        max_depth: 10,
        min_samples_split: 5,
        random_state: 42
      })
    } else if (modelType === 'gradient_boosting') {
      return sklearn.ensemble.GradientBoostingClassifier({
        n_estimators: 100,
        learning_rate: 0.1,
        max_depth: 5,
        random_state: 42
      })
    } else {
      return sklearn.ensemble.RandomForestClassifier()
    }
  }

  async generateSignal(data: MarketData): Promise<Signal> {
    const symbol = data.symbol
    const price = data.bar?.close || data.quote?.last || 0

    const history = this.priceHistory.get(symbol) || []
    history.push(price)
    if (history.length > (this.parameters.lookback as number) * 2) {
      history.shift()
    }
    this.priceHistory.set(symbol, history)

    if (history.length < this.parameters.lookback as number) {
      return { symbol, type: 'HOLD', strength: 0, timestamp: Date.now() }
    }

    // Extract features
    const features = this.extractFeatures(symbol, history)

    // Train model periodically
    const featureHistory = this.featureHistory.get(symbol) || []
    featureHistory.push(features)
    this.featureHistory.set(symbol, featureHistory)

    if (featureHistory.length % (this.parameters.retrainFrequency as number) === 0) {
      await this.trainModel(symbol)
    }

    // Make prediction
    if (!this.model.is_fitted) {
      return { symbol, type: 'HOLD', strength: 0, timestamp: Date.now() }
    }

    const featureArray = Object.values(features)
    const prediction = this.model.predict([featureArray])[0]
    const probabilities = this.model.predict_proba([featureArray])[0]

    const confidenceThreshold = this.parameters.confidenceThreshold as number

    if (prediction === 1 && probabilities[1] > confidenceThreshold) {
      return {
        symbol,
        type: 'BUY',
        strength: probabilities[1],
        confidence: probabilities[1],
        rationale: `ML prediction: BUY (confidence: ${(probabilities[1] * 100).toFixed(1)}%)`,
        timestamp: Date.now()
      }
    } else if (prediction === -1 && probabilities[0] > confidenceThreshold) {
      return {
        symbol,
        type: 'SELL',
        strength: probabilities[0],
        confidence: probabilities[0],
        rationale: `ML prediction: SELL (confidence: ${(probabilities[0] * 100).toFixed(1)}%)`,
        timestamp: Date.now()
      }
    }

    return { symbol, type: 'HOLD', strength: 0, timestamp: Date.now() }
  }

  private extractFeatures(symbol: string, history: number[]) {
    const series = pandas.Series(history)

    // Technical indicators as features
    const rsi = talib.RSI(series, { timeperiod: 14 })
    const macd = talib.MACD(series)
    const bbands = talib.BBANDS(series)
    const atr = talib.ATR(series, series, series, { timeperiod: 14 })

    // Returns at different horizons
    const returns1d = series.pct_change(1).iloc[-1] || 0
    const returns5d = series.pct_change(5).iloc[-1] || 0
    const returns20d = series.pct_change(20).iloc[-1] || 0

    // Volatility
    const volatility = series.pct_change().tail(20).std()

    // Volume ratio (if available)
    const volumeRatio = 1.0

    return {
      returns_1d: returns1d,
      returns_5d: returns5d,
      returns_20d: returns20d,
      rsi: rsi.iloc[-1],
      macd: macd.macd.iloc[-1],
      macd_signal: macd.macdsignal.iloc[-1],
      bb_upper: bbands.upperband.iloc[-1],
      bb_middle: bbands.middleband.iloc[-1],
      bb_lower: bbands.lowerband.iloc[-1],
      atr: atr.iloc[-1],
      volatility,
      volume_ratio: volumeRatio
    }
  }

  private async trainModel(symbol: string): Promise<void> {
    const featureHistory = this.featureHistory.get(symbol) || []
    if (featureHistory.length < 100) return

    // Prepare training data
    const X = featureHistory.slice(0, -1).map(f => Object.values(f))
    const priceHistory = this.priceHistory.get(symbol) || []
    const y = priceHistory.slice(1, featureHistory.length).map((price, i) => {
      const prevPrice = priceHistory[i]
      return price > prevPrice * 1.01 ? 1 : price < prevPrice * 0.99 ? -1 : 0
    })

    // Train model
    this.model.fit(X, y)
  }

  async onFill(fill: Fill): Promise<void> {}
  async onCancel(order: Order): Promise<void> {}
  async onMarketData(data: MarketData): Promise<void> {}

  async cleanup(): Promise<void> {
    this.featureHistory.clear()
    this.priceHistory.clear()
  }
}
