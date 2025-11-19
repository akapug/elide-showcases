/**
 * Advanced Trading Strategies - Comprehensive examples
 *
 * Demonstrates advanced strategy implementations including:
 * - Market making
 * - Statistical arbitrage
 * - Options strategies
 * - Factor models
 * - Deep learning strategies
 */

// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import talib from 'python:talib'
// @ts-ignore
import sklearn from 'python:sklearn'
// @ts-ignore
import scipy from 'python:scipy'

import type {
  TradingStrategy,
  Signal,
  MarketData,
  Fill,
  Order,
  StrategyParameters
} from '../src/types.ts'

/**
 * Market Making Strategy - Provide liquidity and profit from spread
 */
export class MarketMakingStrategy implements TradingStrategy {
  name = 'Market Maker'
  version = '1.0.0'
  type = 'market-making' as const
  parameters: StrategyParameters
  assets: string[]
  frequency = '1s' as const
  enabled = true

  private inventory: Map<string, number> = new Map()
  private quotes: Map<string, { bid: number; ask: number }> = new Map()

  constructor(name: string, parameters: StrategyParameters, assets: string[]) {
    this.name = name
    this.parameters = {
      spread: 0.002,           // 20 bps spread
      inventory_limit: 1000,   // Max inventory
      skew_factor: 0.5,        // Inventory skew adjustment
      quote_size: 100,         // Size per quote
      ...parameters
    }
    this.assets = assets
  }

  async initialize(): Promise<void> {
    for (const asset of this.assets) {
      this.inventory.set(asset, 0)
    }
  }

  async generateSignal(data: MarketData): Promise<Signal[]> {
    const signals: Signal[] = []

    if (!data.quote) return signals

    const midPrice = (data.quote.bid + data.quote.ask) / 2
    const inventory = this.inventory.get(data.symbol) || 0
    const inventoryLimit = this.parameters.inventory_limit as number

    // Calculate inventory skew
    const inventoryRatio = inventory / inventoryLimit
    const skew = inventoryRatio * (this.parameters.skew_factor as number)

    // Adjust spread based on inventory
    const baseSpread = this.parameters.spread as number
    const bidSpread = baseSpread * (1 + skew)
    const askSpread = baseSpread * (1 - skew)

    // Generate quotes
    const bidPrice = midPrice * (1 - bidSpread)
    const askPrice = midPrice * (1 + askSpread)

    this.quotes.set(data.symbol, { bid: bidPrice, ask: askPrice })

    // Place buy orders if not at inventory limit
    if (inventory < inventoryLimit) {
      signals.push({
        symbol: data.symbol,
        type: 'BUY',
        strength: 1.0,
        size: this.parameters.quote_size as number,
        price: bidPrice,
        rationale: `MM quote: bid @ ${bidPrice.toFixed(2)}`,
        timestamp: Date.now()
      })
    }

    // Place sell orders if have inventory
    if (inventory > -inventoryLimit) {
      signals.push({
        symbol: data.symbol,
        type: 'SELL',
        strength: 1.0,
        size: this.parameters.quote_size as number,
        price: askPrice,
        rationale: `MM quote: ask @ ${askPrice.toFixed(2)}`,
        timestamp: Date.now()
      })
    }

    return signals
  }

  async onFill(fill: Fill): Promise<void> {
    const current = this.inventory.get(fill.symbol) || 0

    if (fill.side === 'BUY') {
      this.inventory.set(fill.symbol, current + fill.quantity)
    } else {
      this.inventory.set(fill.symbol, current - fill.quantity)
    }
  }

  async onCancel(): Promise<void> {}
  async onMarketData(): Promise<void> {}
  async cleanup(): Promise<void> {}
}

/**
 * Cointegration Strategy - Trade cointegrated pairs
 */
export class CointegrationStrategy implements TradingStrategy {
  name = 'Cointegration Pairs'
  version = '1.0.0'
  type = 'statistical-arbitrage' as const
  parameters: StrategyParameters
  assets: string[]
  frequency = '1d' as const
  enabled = true

  private priceHistory: Map<string, number[]> = new Map()
  private hedgeRatio = 1.0
  private cointegrationPValue = 1.0

  constructor(name: string, parameters: StrategyParameters, assets: string[]) {
    this.name = name
    this.parameters = {
      lookback: 252,
      pvalue_threshold: 0.05,
      entry_threshold: 2.0,
      exit_threshold: 0.5,
      ...parameters
    }
    this.assets = assets

    if (assets.length !== 2) {
      throw new Error('Cointegration strategy requires exactly 2 assets')
    }
  }

  async initialize(): Promise<void> {
    for (const asset of this.assets) {
      this.priceHistory.set(asset, [])
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

    // Need sufficient data for both assets
    const history1 = this.priceHistory.get(this.assets[0])!
    const history2 = this.priceHistory.get(this.assets[1])!

    if (
      history1.length < this.parameters.lookback as number ||
      history2.length < this.parameters.lookback as number
    ) {
      return []
    }

    // Test for cointegration
    const cointegrationResult = await this.testCointegration(history1, history2)

    if (cointegrationResult.pvalue > (this.parameters.pvalue_threshold as number)) {
      // Not cointegrated, don't trade
      return []
    }

    this.cointegrationPValue = cointegrationResult.pvalue
    this.hedgeRatio = cointegrationResult.hedgeRatio

    // Calculate spread
    const prices1 = pandas.Series(history1)
    const prices2 = pandas.Series(history2)
    const spread = prices1.sub(prices2.mul(this.hedgeRatio))

    // Calculate z-score
    const mean = spread.mean()
    const std = spread.std()
    const zScore = (spread.iloc[-1] - mean) / std

    const signals: Signal[] = []
    const entryThreshold = this.parameters.entry_threshold as number
    const exitThreshold = this.parameters.exit_threshold as number

    if (Math.abs(zScore) > entryThreshold) {
      if (zScore > 0) {
        // Spread too high: sell asset 1, buy asset 2
        signals.push({
          symbol: this.assets[0],
          type: 'SELL',
          strength: Math.abs(zScore) / entryThreshold,
          rationale: `Cointegration trade: z-score ${zScore.toFixed(2)}`,
          timestamp: Date.now()
        })
        signals.push({
          symbol: this.assets[1],
          type: 'BUY',
          strength: Math.abs(zScore) / entryThreshold,
          size: this.hedgeRatio,
          rationale: `Cointegration trade: z-score ${zScore.toFixed(2)}`,
          timestamp: Date.now()
        })
      } else {
        // Spread too low: buy asset 1, sell asset 2
        signals.push({
          symbol: this.assets[0],
          type: 'BUY',
          strength: Math.abs(zScore) / entryThreshold,
          rationale: `Cointegration trade: z-score ${zScore.toFixed(2)}`,
          timestamp: Date.now()
        })
        signals.push({
          symbol: this.assets[1],
          type: 'SELL',
          strength: Math.abs(zScore) / entryThreshold,
          size: this.hedgeRatio,
          rationale: `Cointegration trade: z-score ${zScore.toFixed(2)}`,
          timestamp: Date.now()
        })
      }
    } else if (Math.abs(zScore) < exitThreshold) {
      // Close positions
      signals.push({
        symbol: this.assets[0],
        type: 'CLOSE',
        strength: 1.0,
        rationale: 'Cointegration exit: spread converged',
        timestamp: Date.now()
      })
      signals.push({
        symbol: this.assets[1],
        type: 'CLOSE',
        strength: 1.0,
        rationale: 'Cointegration exit: spread converged',
        timestamp: Date.now()
      })
    }

    return signals
  }

  private async testCointegration(
    series1: number[],
    series2: number[]
  ): Promise<{ pvalue: number; hedgeRatio: number }> {
    // Engle-Granger cointegration test
    const y = pandas.Series(series1)
    const x = pandas.Series(series2)

    // Step 1: Estimate hedge ratio using OLS
    const model = sklearn.linear_model.LinearRegression()
    model.fit(x.values.reshape(-1, 1), y.values)
    const hedgeRatio = model.coef_[0]

    // Step 2: Calculate residuals
    const predicted = model.predict(x.values.reshape(-1, 1))
    const residuals = y.values - predicted

    // Step 3: Test residuals for stationarity (ADF test)
    // In production, use statsmodels.tsa.stattools.adfuller
    const pvalue = 0.03 // Mock p-value

    return { pvalue, hedgeRatio }
  }

  async onFill(): Promise<void> {}
  async onCancel(): Promise<void> {}
  async onMarketData(): Promise<void> {}
  async cleanup(): Promise<void> {}
}

/**
 * Volatility Arbitrage Strategy - Trade volatility vs realized vol
 */
export class VolatilityArbitrageStrategy implements TradingStrategy {
  name = 'Volatility Arbitrage'
  version = '1.0.0'
  type = 'statistical-arbitrage' as const
  parameters: StrategyParameters
  assets: string[]
  frequency = '1d' as const
  enabled = true

  private returns: Map<string, number[]> = new Map()

  constructor(name: string, parameters: StrategyParameters, assets: string[]) {
    this.name = name
    this.parameters = {
      vol_lookback: 30,
      entry_threshold: 0.2,    // 20% difference
      exit_threshold: 0.05,
      ...parameters
    }
    this.assets = assets
  }

  async initialize(): Promise<void> {
    for (const asset of this.assets) {
      this.returns.set(asset, [])
    }
  }

  async generateSignal(data: MarketData): Promise<Signal> {
    // Calculate realized volatility
    const returns = this.returns.get(data.symbol) || []

    if (data.bar) {
      const ret = Math.log(data.bar.close / data.bar.open)
      returns.push(ret)

      if (returns.length > (this.parameters.vol_lookback as number) * 2) {
        returns.shift()
      }

      this.returns.set(data.symbol, returns)
    }

    if (returns.length < this.parameters.vol_lookback as number) {
      return {
        symbol: data.symbol,
        type: 'HOLD',
        strength: 0,
        timestamp: Date.now()
      }
    }

    // Calculate realized volatility
    const returnsSeries = pandas.Series(returns)
    const realizedVol = returnsSeries.std() * Math.sqrt(252)

    // Get implied volatility (would come from options data)
    const impliedVol = await this.getImpliedVolatility(data.symbol)

    // Calculate vol spread
    const volSpread = (impliedVol - realizedVol) / realizedVol

    const entryThreshold = this.parameters.entry_threshold as number

    if (volSpread > entryThreshold) {
      // IV too high relative to RV: sell options, buy stock
      return {
        symbol: data.symbol,
        type: 'BUY',
        strength: Math.min(volSpread / entryThreshold, 1),
        rationale: `Vol arb: IV ${(impliedVol * 100).toFixed(1)}%, RV ${(realizedVol * 100).toFixed(1)}%`,
        timestamp: Date.now()
      }
    } else if (volSpread < -entryThreshold) {
      // IV too low relative to RV: buy options, sell stock
      return {
        symbol: data.symbol,
        type: 'SELL',
        strength: Math.min(Math.abs(volSpread) / entryThreshold, 1),
        rationale: `Vol arb: IV ${(impliedVol * 100).toFixed(1)}%, RV ${(realizedVol * 100).toFixed(1)}%`,
        timestamp: Date.now()
      }
    }

    return {
      symbol: data.symbol,
      type: 'HOLD',
      strength: 0,
      timestamp: Date.now()
    }
  }

  private async getImpliedVolatility(symbol: string): Promise<number> {
    // In production, fetch from options chain
    return 0.25 // Mock 25% IV
  }

  async onFill(): Promise<void> {}
  async onCancel(): Promise<void> {}
  async onMarketData(): Promise<void> {}
  async cleanup(): Promise<void> {}
}

/**
 * Sentiment-Based Strategy - Trade based on news and social sentiment
 */
export class SentimentStrategy implements TradingStrategy {
  name = 'Sentiment Trading'
  version = '1.0.0'
  type = 'machine-learning' as const
  parameters: StrategyParameters
  assets: string[]
  frequency = '1h' as const
  enabled = true

  private sentimentHistory: Map<string, number[]> = new Map()
  private sentimentModel: any

  constructor(name: string, parameters: StrategyParameters, assets: string[]) {
    this.name = name
    this.parameters = {
      sentiment_threshold: 0.6,
      lookback: 24,  // 24 hours
      smoothing: 4,  // 4-hour moving average
      ...parameters
    }
    this.assets = assets
  }

  async initialize(): Promise<void> {
    // Load pre-trained sentiment model
    await this.loadSentimentModel()

    for (const asset of this.assets) {
      this.sentimentHistory.set(asset, [])
    }
  }

  async generateSignal(data: MarketData): Promise<Signal> {
    // Fetch news and social media for symbol
    const sentiment = await this.analyzeSentiment(data.symbol)

    const history = this.sentimentHistory.get(data.symbol) || []
    history.push(sentiment)

    if (history.length > this.parameters.lookback as number) {
      history.shift()
    }

    this.sentimentHistory.set(data.symbol, history)

    if (history.length < this.parameters.smoothing as number) {
      return {
        symbol: data.symbol,
        type: 'HOLD',
        strength: 0,
        timestamp: Date.now()
      }
    }

    // Calculate smoothed sentiment
    const smoothing = this.parameters.smoothing as number
    const recentSentiment = history.slice(-smoothing)
    const avgSentiment =
      recentSentiment.reduce((a, b) => a + b, 0) / smoothing

    const threshold = this.parameters.sentiment_threshold as number

    if (avgSentiment > threshold) {
      return {
        symbol: data.symbol,
        type: 'BUY',
        strength: avgSentiment,
        confidence: avgSentiment,
        rationale: `Positive sentiment: ${(avgSentiment * 100).toFixed(1)}%`,
        timestamp: Date.now()
      }
    } else if (avgSentiment < -threshold) {
      return {
        symbol: data.symbol,
        type: 'SELL',
        strength: Math.abs(avgSentiment),
        confidence: Math.abs(avgSentiment),
        rationale: `Negative sentiment: ${(avgSentiment * 100).toFixed(1)}%`,
        timestamp: Date.now()
      }
    }

    return {
      symbol: data.symbol,
      type: 'HOLD',
      strength: 0,
      timestamp: Date.now()
    }
  }

  private async loadSentimentModel(): Promise<void> {
    // Load NLP model for sentiment analysis
    // In production, use transformers or similar
    this.sentimentModel = {
      analyze: (text: string) => {
        // Mock sentiment score
        return Math.random() * 2 - 1 // -1 to 1
      }
    }
  }

  private async analyzeSentiment(symbol: string): Promise<number> {
    // Fetch recent news and social media
    const news = await this.fetchNews(symbol)
    const social = await this.fetchSocialMedia(symbol)

    // Analyze sentiment
    const newsScores = news.map(n => this.sentimentModel.analyze(n.title))
    const socialScores = social.map(s => this.sentimentModel.analyze(s.text))

    // Combine scores
    const allScores = [...newsScores, ...socialScores]
    if (allScores.length === 0) return 0

    const avgScore = allScores.reduce((a, b) => a + b, 0) / allScores.length

    return avgScore
  }

  private async fetchNews(symbol: string): Promise<Array<{ title: string }>> {
    // In production, fetch from news API
    return [
      { title: 'Mock news article' }
    ]
  }

  private async fetchSocialMedia(symbol: string): Promise<Array<{ text: string }>> {
    // In production, fetch from Twitter, Reddit, etc.
    return [
      { text: 'Mock social media post' }
    ]
  }

  async onFill(): Promise<void> {}
  async onCancel(): Promise<void> {}
  async onMarketData(): Promise<void> {}
  async cleanup(): Promise<void> {}
}

/**
 * Deep Learning Strategy - LSTM-based price prediction
 */
export class DeepLearningStrategy implements TradingStrategy {
  name = 'Deep Learning LSTM'
  version = '1.0.0'
  type = 'machine-learning' as const
  parameters: StrategyParameters
  assets: string[]
  frequency = '1d' as const
  enabled = true

  private model: any
  private scaler: any
  private sequenceLength = 60
  private priceHistory: Map<string, number[]> = new Map()

  constructor(name: string, parameters: StrategyParameters, assets: string[]) {
    this.name = name
    this.parameters = {
      confidence_threshold: 0.7,
      prediction_horizon: 1,
      ...parameters
    }
    this.assets = assets
  }

  async initialize(): Promise<void> {
    // Load pre-trained LSTM model
    await this.loadModel()

    for (const asset of this.assets) {
      this.priceHistory.set(asset, [])
    }
  }

  async generateSignal(data: MarketData): Promise<Signal> {
    const price = data.bar?.close || data.quote?.last || 0

    const history = this.priceHistory.get(data.symbol) || []
    history.push(price)

    if (history.length > this.sequenceLength * 2) {
      history.shift()
    }

    this.priceHistory.set(data.symbol, history)

    if (history.length < this.sequenceLength) {
      return {
        symbol: data.symbol,
        type: 'HOLD',
        strength: 0,
        timestamp: Date.now()
      }
    }

    // Prepare sequence
    const sequence = history.slice(-this.sequenceLength)

    // Scale data
    const scaledSequence = this.scaler.transform(
      numpy.array(sequence).reshape(-1, 1)
    )

    // Make prediction
    const prediction = await this.predict(scaledSequence)

    const currentPrice = price
    const predictedPrice = prediction.price
    const confidence = prediction.confidence

    const threshold = this.parameters.confidence_threshold as number

    if (confidence > threshold) {
      const change = (predictedPrice - currentPrice) / currentPrice

      if (change > 0.01) {
        // Predicted to go up
        return {
          symbol: data.symbol,
          type: 'BUY',
          strength: confidence,
          confidence,
          rationale: `LSTM prediction: +${(change * 100).toFixed(2)}% (conf: ${(confidence * 100).toFixed(1)}%)`,
          timestamp: Date.now()
        }
      } else if (change < -0.01) {
        // Predicted to go down
        return {
          symbol: data.symbol,
          type: 'SELL',
          strength: confidence,
          confidence,
          rationale: `LSTM prediction: ${(change * 100).toFixed(2)}% (conf: ${(confidence * 100).toFixed(1)}%)`,
          timestamp: Date.now()
        }
      }
    }

    return {
      symbol: data.symbol,
      type: 'HOLD',
      strength: 0,
      timestamp: Date.now()
    }
  }

  private async loadModel(): Promise<void> {
    // In production, load actual LSTM model
    // Using TensorFlow.js or similar
    this.scaler = sklearn.preprocessing.MinMaxScaler()

    this.model = {
      predict: (sequence: any) => {
        // Mock prediction
        return numpy.array([100])
      }
    }
  }

  private async predict(sequence: any): Promise<{
    price: number
    confidence: number
  }> {
    // Make prediction
    const prediction = this.model.predict(sequence.reshape(1, -1, 1))

    // Inverse transform
    const price = this.scaler.inverse_transform(prediction)[0][0]

    // Calculate confidence (mock)
    const confidence = 0.75

    return { price, confidence }
  }

  async onFill(): Promise<void> {}
  async onCancel(): Promise<void> {}
  async onMarketData(): Promise<void> {}
  async cleanup(): Promise<void> {}
}

/**
 * Factor Model Strategy - Multi-factor equity selection
 */
export class FactorModelStrategy implements TradingStrategy {
  name = 'Multi-Factor Model'
  version = '1.0.0'
  type = 'multi-factor' as const
  parameters: StrategyParameters
  assets: string[]
  frequency = '1d' as const
  enabled = true

  private factorScores: Map<string, FactorScores> = new Map()
  private rankings: Map<string, number> = new Map()

  constructor(name: string, parameters: StrategyParameters, assets: string[]) {
    this.name = name
    this.parameters = {
      momentum_weight: 0.25,
      value_weight: 0.25,
      quality_weight: 0.25,
      low_vol_weight: 0.25,
      rebalance_days: 30,
      ...parameters
    }
    this.assets = assets
  }

  async initialize(): Promise<void> {
    for (const asset of this.assets) {
      this.factorScores.set(asset, {
        momentum: 0,
        value: 0,
        quality: 0,
        lowVol: 0,
        composite: 0
      })
    }
  }

  async generateSignal(data: MarketData): Promise<Signal> {
    // Calculate factor scores
    const scores = await this.calculateFactorScores(data.symbol, data)
    this.factorScores.set(data.symbol, scores)

    // Rank all assets
    await this.rankAssets()

    const rank = this.rankings.get(data.symbol) || 0
    const totalAssets = this.assets.length
    const quintile = rank / totalAssets

    if (quintile <= 0.2) {
      // Top quintile - strong buy
      return {
        symbol: data.symbol,
        type: 'BUY',
        strength: 1.0 - quintile * 5,
        rationale: `Top quintile (rank ${rank}/${totalAssets}): composite ${scores.composite.toFixed(2)}`,
        timestamp: Date.now()
      }
    } else if (quintile >= 0.8) {
      // Bottom quintile - sell
      return {
        symbol: data.symbol,
        type: 'SELL',
        strength: (quintile - 0.8) * 5,
        rationale: `Bottom quintile (rank ${rank}/${totalAssets}): composite ${scores.composite.toFixed(2)}`,
        timestamp: Date.now()
      }
    } else if (quintile > 0.4 && quintile < 0.6) {
      // Middle quintile - reduce
      return {
        symbol: data.symbol,
        type: 'REDUCE',
        strength: 0.5,
        rationale: `Middle quintile (rank ${rank}/${totalAssets})`,
        timestamp: Date.now()
      }
    }

    return {
      symbol: data.symbol,
      type: 'HOLD',
      strength: 0,
      timestamp: Date.now()
    }
  }

  private async calculateFactorScores(
    symbol: string,
    data: MarketData
  ): Promise<FactorScores> {
    // In production, fetch fundamental data
    const momentum = await this.calculateMomentumScore(symbol, data)
    const value = await this.calculateValueScore(symbol)
    const quality = await this.calculateQualityScore(symbol)
    const lowVol = await this.calculateLowVolScore(symbol, data)

    const composite =
      momentum * (this.parameters.momentum_weight as number) +
      value * (this.parameters.value_weight as number) +
      quality * (this.parameters.quality_weight as number) +
      lowVol * (this.parameters.low_vol_weight as number)

    return { momentum, value, quality, lowVol, composite }
  }

  private async calculateMomentumScore(symbol: string, data: MarketData): Promise<number> {
    // 12-month momentum
    return Math.random() // Mock score
  }

  private async calculateValueScore(symbol: string): Promise<number> {
    // P/E, P/B, EV/EBITDA ratios
    return Math.random() // Mock score
  }

  private async calculateQualityScore(symbol: string): Promise<number> {
    // ROE, debt ratios, earnings stability
    return Math.random() // Mock score
  }

  private async calculateLowVolScore(symbol: string, data: MarketData): Promise<number> {
    // Inverse volatility
    return Math.random() // Mock score
  }

  private async rankAssets(): Promise<void> {
    const scores = Array.from(this.factorScores.entries())
      .map(([symbol, scores]) => ({ symbol, score: scores.composite }))
      .sort((a, b) => b.score - a.score)

    scores.forEach(({ symbol }, index) => {
      this.rankings.set(symbol, index + 1)
    })
  }

  async onFill(): Promise<void> {}
  async onCancel(): Promise<void> {}
  async onMarketData(): Promise<void> {}
  async cleanup(): Promise<void> {}
}

interface FactorScores {
  momentum: number
  value: number
  quality: number
  lowVol: number
  composite: number
}

// Export all strategies
export const ADVANCED_STRATEGIES = {
  MarketMakingStrategy,
  CointegrationStrategy,
  VolatilityArbitrageStrategy,
  SentimentStrategy,
  DeepLearningStrategy,
  FactorModelStrategy
}
