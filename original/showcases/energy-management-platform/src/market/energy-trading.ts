/**
 * Energy Trader - Market participation and price optimization
 * Demonstrates Elide's TypeScript + Python integration for energy markets
 */

// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import sklearn from 'python:sklearn'
// @ts-ignore
import scipy from 'python:scipy'
// @ts-ignore
import tensorflow from 'python:tensorflow'

import type {
  EnergyTraderOptions,
  Bid,
  BidParams,
  SubmissionResult,
  TradingDecision,
  Position,
  PriceForecast,
  Forecast,
  AvailableCapacity,
  AncillaryService,
} from '../types'

/**
 * EnergyTrader - Automated trading in wholesale electricity markets
 *
 * Markets:
 * - Day-Ahead: 24-hour forward market
 * - Real-Time: 5-minute spot market
 * - Ancillary Services: Frequency regulation, reserves
 * - Capacity: Long-term capacity commitments
 * - RECs: Renewable Energy Credits
 *
 * Strategies:
 * - Profit maximization through arbitrage
 * - Risk management with CVaR
 * - Portfolio optimization
 * - Market making
 */
export class EnergyTrader {
  private options: EnergyTraderOptions
  private positions: Map<string, Position> = new Map()
  private bidHistory: Bid[] = []
  private priceModel: any
  private eventHandlers: Map<string, Function[]> = new Map()

  constructor(options: EnergyTraderOptions) {
    this.options = {
      markets: ['day_ahead', 'real_time'],
      bidStrategy: 'profit_maximizing',
      riskTolerance: 'moderate',
      ...options,
    }

    this.initializePriceModel()
  }

  /**
   * Initialize price forecasting model
   */
  private initializePriceModel(): void {
    // LSTM model for price forecasting
    const Sequential = tensorflow.keras.models.Sequential
    const LSTM = tensorflow.keras.layers.LSTM
    const Dense = tensorflow.keras.layers.Dense
    const Dropout = tensorflow.keras.layers.Dropout

    const model = new Sequential()

    model.add(new LSTM({ units: 64, return_sequences: true, input_shape: [24, 5] }))
    model.add(new Dropout({ rate: 0.2 }))

    model.add(new LSTM({ units: 32, return_sequences: false }))
    model.add(new Dropout({ rate: 0.2 }))

    model.add(new Dense({ units: 24 }))

    model.compile({
      optimizer: tensorflow.keras.optimizers.Adam({ learning_rate: 0.001 }),
      loss: 'mse',
    })

    this.priceModel = model
  }

  /**
   * Generate day-ahead market bids
   */
  async generateDayAheadBids(params: BidParams): Promise<Bid[]> {
    const { loadForecast, renewableForecast, priceForecasts, availableCapacity } = params

    console.log('Generating day-ahead bids...')

    const bids: Bid[] = []

    // Forecast prices for next day
    const pricePredictions = await this.forecastPrices(priceForecasts, 24)

    for (let hour = 0; hour < 24; hour++) {
      const load = loadForecast.predictions[hour]
      const renewable = renewableForecast?.predictions[hour] || 0
      const price = pricePredictions[hour]

      // Net position (positive = need to buy, negative = can sell)
      const netPosition = load - renewable

      // Determine bid quantity and price based on strategy
      const bid = this.computeBid(
        hour,
        netPosition,
        price,
        availableCapacity,
        'day_ahead',
        this.options.bidStrategy
      )

      if (bid) {
        bids.push(bid)
      }
    }

    console.log(`Generated ${bids.length} day-ahead bids`)

    return bids
  }

  /**
   * Compute bid for specific hour
   */
  private computeBid(
    hour: number,
    netPosition: number,
    forecastPrice: number,
    capacity: AvailableCapacity,
    market: string,
    strategy: string
  ): Bid | null {
    let quantity = 0
    let price = 0

    if (strategy === 'profit_maximizing') {
      // Buy when price is low, sell when price is high
      const priceThreshold = 50 // $/MWh

      if (netPosition > 0) {
        // Need to buy
        quantity = Math.min(netPosition, capacity.generation)

        // Bid at forecast price with margin
        price = forecastPrice * 1.05 // 5% margin
      } else if (netPosition < 0 && forecastPrice > priceThreshold) {
        // Can sell excess
        quantity = Math.min(-netPosition, capacity.generation)

        // Offer at forecast price minus margin
        price = forecastPrice * 0.95
      }
    } else if (strategy === 'risk_averse') {
      // Always match position at market price
      quantity = Math.abs(netPosition)
      price = forecastPrice * 1.1 // Higher bid to ensure acceptance
    } else if (strategy === 'market_making') {
      // Provide liquidity on both sides
      const spread = forecastPrice * 0.02 // 2% spread

      // Dual-sided bid (simplified)
      quantity = capacity.generation * 0.5
      price = forecastPrice
    }

    if (quantity < 0.1) return null // Don't bid tiny quantities

    return {
      hour,
      quantity,
      price,
      type: 'energy',
    }
  }

  /**
   * Submit bids to market
   */
  async submitBids(market: string, bids: Bid[]): Promise<SubmissionResult> {
    console.log(`Submitting ${bids.length} bids to ${market} market...`)

    // In production, this would use market API (e.g., OASIS, EMIS)
    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 200))

    // Record bids
    this.bidHistory.push(...bids)

    // Simulate acceptance
    const accepted = Math.random() > 0.1 // 90% acceptance rate

    return {
      market,
      accepted,
      bids,
      timestamp: new Date(),
      confirmationId: `CNF-${Date.now()}`,
    }
  }

  /**
   * Optimize real-time trading decisions
   */
  async optimizeRealTime(params: {
    currentPrice: number
    position: Position
    constraints: any
  }): Promise<TradingDecision> {
    const { currentPrice, position, constraints } = params

    // Compute optimal action based on current state
    const meanPrice = 50 // Historical average
    const priceDeviation = (currentPrice - meanPrice) / meanPrice

    let action: 'buy' | 'sell' | 'hold'
    let quantity = 0

    if (this.options.riskTolerance === 'aggressive') {
      if (priceDeviation < -0.1) {
        // Price is 10% below average, buy
        action = 'buy'
        quantity = 100
      } else if (priceDeviation > 0.1) {
        // Price is 10% above average, sell
        action = 'sell'
        quantity = Math.min(100, position.quantity)
      } else {
        action = 'hold'
      }
    } else if (this.options.riskTolerance === 'moderate') {
      if (priceDeviation < -0.2) {
        action = 'buy'
        quantity = 50
      } else if (priceDeviation > 0.2) {
        action = 'sell'
        quantity = Math.min(50, position.quantity)
      } else {
        action = 'hold'
      }
    } else {
      // Conservative
      action = 'hold'
    }

    return {
      action,
      quantity,
      price: currentPrice,
      reasoning: `Price deviation: ${(priceDeviation * 100).toFixed(1)}%`,
    }
  }

  /**
   * Generate ancillary services bids
   */
  async generateAncillaryBids(params: {
    services: string[]
    availableAssets: any[]
  }): Promise<Bid[]> {
    const { services, availableAssets } = params

    console.log(`Generating ancillary services bids for: ${services.join(', ')}`)

    const bids: Bid[] = []

    for (const service of services) {
      // Determine available capacity for this service
      const capacity = this.computeServiceCapacity(service, availableAssets)

      if (capacity < 1) continue

      // Estimate service price
      const price = this.estimateServicePrice(service)

      // Create bid
      for (let hour = 0; hour < 24; hour++) {
        bids.push({
          hour,
          quantity: capacity,
          price,
          type: service === 'regulation_up' || service === 'regulation_down' ? 'regulation' : 'reserve',
        })
      }
    }

    console.log(`Generated ${bids.length} ancillary service bids`)

    return bids
  }

  /**
   * Compute available capacity for ancillary service
   */
  private computeServiceCapacity(service: string, assets: any[]): number {
    let capacity = 0

    for (const asset of assets) {
      if (service === 'regulation_up' || service === 'regulation_down') {
        // Fast-responding assets (batteries, hydro)
        if (asset.type === 'battery' || asset.type === 'hydro') {
          capacity += asset.capacity * 0.5 // Reserve 50% for regulation
        }
      } else if (service.includes('reserve')) {
        // Any dispatchable asset
        capacity += asset.capacity * 0.3 // Reserve 30% for reserves
      }
    }

    return capacity
  }

  /**
   * Estimate ancillary service price
   */
  private estimateServicePrice(service: string): number {
    // Historical average prices ($/MW)
    const prices: Record<string, number> = {
      regulation_up: 15,
      regulation_down: 10,
      spinning_reserve: 8,
      non_spinning_reserve: 5,
      black_start: 20,
    }

    return prices[service] || 10
  }

  /**
   * Execute trade in real-time market
   */
  async executeTrade(trade: { type: 'buy' | 'sell'; quantity: number }): Promise<any> {
    console.log(`Executing ${trade.type} for ${trade.quantity} MW`)

    // Update position
    const position = this.positions.get('real_time') || {
      market: 'real_time',
      quantity: 0,
      averagePrice: 0,
      pnl: 0,
    }

    const currentPrice = 50 // Get from market

    if (trade.type === 'buy') {
      const totalCost = position.quantity * position.averagePrice + trade.quantity * currentPrice
      position.quantity += trade.quantity
      position.averagePrice = totalCost / position.quantity
    } else {
      // Sell
      const revenue = trade.quantity * currentPrice
      const cost = trade.quantity * position.averagePrice
      position.pnl += revenue - cost
      position.quantity -= trade.quantity
    }

    this.positions.set('real_time', position)

    this.emit('trade_executed', { trade, position })

    return { success: true, position }
  }

  /**
   * Forecast prices using LSTM model
   */
  async forecastPrices(historical: PriceForecast, horizon: number): Promise<number[]> {
    // In production, this would use trained LSTM model
    // For now, return simple forecast

    const avgPrice = historical.prices.reduce((a, b) => a + b, 0) / historical.prices.length

    // Add some variability
    return Array(horizon)
      .fill(0)
      .map(() => avgPrice * (0.9 + Math.random() * 0.2))
  }

  /**
   * Train price forecasting model
   */
  async trainPriceModel(historicalData: any[]): Promise<void> {
    console.log('Training price forecasting model...')

    // Prepare training data
    const sequenceLength = 24
    const X_sequences = []
    const y_sequences = []

    for (let i = sequenceLength; i < historicalData.length; i++) {
      const sequence = historicalData.slice(i - sequenceLength, i)

      X_sequences.push(
        sequence.map((d: any) => [d.price, d.load, d.renewable, d.temperature, d.hour])
      )

      y_sequences.push(historicalData[i].price)
    }

    const X = numpy.array(X_sequences)
    const y = numpy.array(y_sequences)

    // Train model
    await this.priceModel.fit(X, y, {
      epochs: 50,
      batch_size: 32,
      validation_split: 0.2,
      verbose: 0,
    })

    console.log('Price model trained successfully')
  }

  /**
   * Compute portfolio value at risk (VaR)
   */
  async computeVaR(confidence: number = 0.95): Promise<number> {
    // Value at Risk: maximum expected loss at given confidence level

    const positions = Array.from(this.positions.values())
    const totalValue = positions.reduce((sum, p) => sum + p.quantity * p.averagePrice, 0)

    // Simulate price changes
    const simulations = 1000
    const returns = []

    for (let i = 0; i < simulations; i++) {
      // Monte Carlo simulation
      const priceChange = numpy.random.normal(0, 0.1) // 10% volatility
      const newValue = totalValue * (1 + priceChange)
      returns.push(newValue - totalValue)
    }

    returns.sort((a, b) => a - b)

    // VaR is the (1 - confidence) quantile
    const varIndex = Math.floor((1 - confidence) * simulations)
    const var95 = -returns[varIndex]

    return var95
  }

  /**
   * Optimize portfolio using mean-variance
   */
  async optimizePortfolio(assets: any[], expectedReturns: number[], covMatrix: number[][]): Promise<any> {
    // Mean-variance portfolio optimization
    // minimize: risk (variance)
    // subject to: expected return >= target

    const n = assets.length

    // Quadratic objective: 0.5 * w^T * Sigma * w
    const Sigma = numpy.array(covMatrix)

    // Constraints: sum(w) = 1, w >= 0
    const A_eq = [Array(n).fill(1)]
    const b_eq = [1]

    const bounds = Array(n).fill([0, 1])

    // Target return
    const targetReturn = 0.08 // 8%

    // Add return constraint
    const A_ub = [expectedReturns.map((r) => -r)]
    const b_ub = [-targetReturn]

    // Solve QP
    const result = scipy.optimize.minimize({
      fun: (w: any) => 0.5 * numpy.dot(numpy.dot(w, Sigma), w),
      x0: numpy.ones(n) / n,
      constraints: [
        { type: 'eq', fun: (w: any) => numpy.sum(w) - 1 },
        { type: 'ineq', fun: (w: any) => numpy.dot(w, expectedReturns) - targetReturn },
      ],
      bounds: bounds,
      method: 'SLSQP',
    })

    const weights = result.x
    const portfolioReturn = numpy.dot(weights, expectedReturns)
    const portfolioRisk = Math.sqrt(numpy.dot(numpy.dot(weights, Sigma), weights))

    return {
      weights: Array.from(weights),
      expectedReturn: portfolioReturn,
      risk: portfolioRisk,
      sharpeRatio: portfolioReturn / portfolioRisk,
    }
  }

  /**
   * Arbitrage detection between markets
   */
  async detectArbitrage(dayAheadPrices: number[], realTimePrices: number[]): Promise<any> {
    const opportunities = []

    for (let hour = 0; hour < Math.min(dayAheadPrices.length, realTimePrices.length); hour++) {
      const daPrice = dayAheadPrices[hour]
      const rtPrice = realTimePrices[hour]

      const spread = rtPrice - daPrice
      const spreadPercent = spread / daPrice

      // Arbitrage if spread > transaction costs
      const transactionCost = 2 // $/MWh
      if (Math.abs(spread) > transactionCost) {
        opportunities.push({
          hour,
          daPrice,
          rtPrice,
          spread,
          spreadPercent,
          action: spread > 0 ? 'buy_da_sell_rt' : 'sell_da_buy_rt',
          profit: Math.abs(spread) - transactionCost,
        })
      }
    }

    return {
      opportunities,
      totalProfit: opportunities.reduce((sum, o) => sum + o.profit, 0),
    }
  }

  /**
   * Get current position
   */
  getCurrentPosition(): Position {
    // Return aggregate position
    const positions = Array.from(this.positions.values())

    if (positions.length === 0) {
      return {
        market: 'none',
        quantity: 0,
        averagePrice: 0,
        pnl: 0,
      }
    }

    const totalQuantity = positions.reduce((sum, p) => sum + p.quantity, 0)
    const totalValue = positions.reduce((sum, p) => sum + p.quantity * p.averagePrice, 0)
    const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0)

    return {
      market: 'aggregate',
      quantity: totalQuantity,
      averagePrice: totalQuantity > 0 ? totalValue / totalQuantity : 0,
      pnl: totalPnL,
    }
  }

  /**
   * Event handling
   */
  on(event: string, callback: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(callback)
  }

  /**
   * Emit event
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || []
    for (const handler of handlers) {
      handler(data)
    }
  }

  /**
   * Compute trading performance metrics
   */
  async computePerformance(): Promise<any> {
    const positions = Array.from(this.positions.values())

    const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0)
    const totalVolume = this.bidHistory.reduce((sum, b) => sum + b.quantity, 0)

    // Sharpe ratio
    const returns = positions.map((p) => p.pnl / (p.quantity * p.averagePrice || 1))
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const stdReturn = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    )
    const sharpeRatio = stdReturn > 0 ? avgReturn / stdReturn : 0

    return {
      totalPnL,
      totalVolume,
      numTrades: this.bidHistory.length,
      sharpeRatio,
      averageReturn: avgReturn,
    }
  }

  /**
   * Get trader summary
   */
  getSummary(): any {
    return {
      options: this.options,
      positions: Array.from(this.positions.values()),
      bidHistory: this.bidHistory.length,
      currentPosition: this.getCurrentPosition(),
      performance: this.computePerformance(),
    }
  }
}
