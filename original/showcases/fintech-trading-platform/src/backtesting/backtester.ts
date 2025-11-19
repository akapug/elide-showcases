/**
 * Backtesting Engine - Event-driven backtesting with realistic simulation
 *
 * Supports multiple strategies, commission models, slippage simulation,
 * and comprehensive performance analytics using Python libraries.
 */

// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import zipline from 'python:zipline'
// @ts-ignore
import empyrical from 'python:empyrical'

import type {
  TradingStrategy,
  BacktestConfig,
  BacktestResult,
  BacktestMetrics,
  Bar,
  Order,
  Fill,
  Position,
  CommissionModel,
  SlippageModel,
  EquityCurve,
  DrawdownCurve,
  ReturnsSeries,
  BenchmarkComparison,
  PositionHistory
} from '../types.ts'

/**
 * Backtester - Event-driven backtesting engine
 */
export class Backtester {
  private config: Partial<BacktestConfig>
  private currentTime = 0
  private cash = 0
  private positions: Map<string, Position> = new Map()
  private orders: Order[] = []
  private fills: Fill[] = []
  private equity: number[] = []
  private timestamps: number[] = []
  private orderIdCounter = 0

  constructor(config: Partial<BacktestConfig> = {}) {
    this.config = {
      initialCapital: 100000,
      commission: { type: 'percentage', rate: 0.001 },
      slippage: { type: 'percentage', rate: 0.0005 },
      ...config
    }
  }

  /**
   * Run backtest
   */
  async run(config: BacktestConfig): Promise<BacktestResult> {
    console.log('Starting backtest...')
    const startTime = Date.now()

    // Initialize
    this.initialize(config)

    // Load historical data
    const data = await this.loadHistoricalData(config)

    // Initialize strategy
    await config.strategy.initialize()

    // Run simulation
    await this.simulate(config.strategy, data)

    // Calculate performance metrics
    const metrics = this.calculateMetrics()
    const positionHistory = this.buildPositionHistory()
    const equityCurve = this.buildEquityCurve()
    const drawdownCurve = this.calculateDrawdown(equityCurve)
    const returnsSeries = this.calculateReturns(equityCurve)

    // Benchmark comparison (if specified)
    let benchmark: BenchmarkComparison | undefined
    if (config.benchmark) {
      benchmark = await this.compareToBenchmark(config.benchmark, data, returnsSeries)
    }

    const result: BacktestResult = {
      config,
      performance: {
        strategyName: config.strategy.name,
        totalReturn: metrics.totalReturn,
        annualizedReturn: metrics.annualizedReturn,
        sharpeRatio: metrics.sharpeRatio,
        sortinoRatio: metrics.sortinoRatio,
        maxDrawdown: metrics.maxDrawdown,
        volatility: metrics.volatility,
        winRate: metrics.winRate,
        profitFactor: metrics.profitFactor,
        trades: metrics.trades,
        avgWin: metrics.avgWin,
        avgLoss: metrics.avgLoss,
        largestWin: metrics.largestWin,
        largestLoss: metrics.largestLoss,
        avgHoldingPeriod: metrics.avgHoldingPeriod
      },
      metrics,
      trades: this.fills,
      positions: positionHistory,
      equity: equityCurve,
      drawdown: drawdownCurve,
      returns: returnsSeries,
      benchmark
    }

    const duration = Date.now() - startTime
    console.log(`Backtest completed in ${duration}ms`)
    console.log(`Total Return: ${(metrics.totalReturn * 100).toFixed(2)}%`)
    console.log(`Sharpe Ratio: ${metrics.sharpeRatio.toFixed(2)}`)
    console.log(`Max Drawdown: ${(metrics.maxDrawdown * 100).toFixed(2)}%`)

    return result
  }

  /**
   * Initialize backtest
   */
  private initialize(config: BacktestConfig): void {
    this.cash = config.initialCapital
    this.positions.clear()
    this.orders = []
    this.fills = []
    this.equity = []
    this.timestamps = []
    this.orderIdCounter = 0
    this.currentTime = typeof config.startDate === 'string'
      ? new Date(config.startDate).getTime()
      : config.startDate
  }

  /**
   * Load historical data (simulate - in production, load from data provider)
   */
  private async loadHistoricalData(config: BacktestConfig): Promise<Map<string, Bar[]>> {
    const data = new Map<string, Bar[]>()

    // In production, this would fetch real data
    // For now, generate synthetic data for demonstration
    const assets = config.assets || config.strategy.assets
    const startTime = typeof config.startDate === 'string'
      ? new Date(config.startDate).getTime()
      : config.startDate
    const endTime = typeof config.endDate === 'string'
      ? new Date(config.endDate).getTime()
      : config.endDate

    for (const symbol of assets) {
      const bars = this.generateSyntheticData(symbol, startTime, endTime)
      data.set(symbol, bars)
    }

    return data
  }

  /**
   * Generate synthetic price data for backtesting
   */
  private generateSyntheticData(symbol: string, start: number, end: number): Bar[] {
    const bars: Bar[] = []
    const dayMs = 24 * 60 * 60 * 1000
    let currentTime = start
    let price = 100 + Math.random() * 50

    while (currentTime <= end) {
      // Geometric Brownian Motion
      const drift = 0.0005
      const volatility = 0.02
      const dt = 1
      const shock = numpy.random.normal(0, 1)
      const change = drift * dt + volatility * shock * Math.sqrt(dt)

      price = price * (1 + change)

      const open = price * (1 + (Math.random() - 0.5) * 0.01)
      const close = price * (1 + (Math.random() - 0.5) * 0.01)
      const high = Math.max(open, close) * (1 + Math.random() * 0.01)
      const low = Math.min(open, close) * (1 - Math.random() * 0.01)
      const volume = Math.floor(1000000 + Math.random() * 5000000)

      bars.push({
        symbol,
        timestamp: currentTime,
        open,
        high,
        low,
        close,
        volume
      })

      currentTime += dayMs
    }

    return bars
  }

  /**
   * Run simulation
   */
  private async simulate(strategy: TradingStrategy, data: Map<string, Bar[]>): Promise<void> {
    // Get all timestamps across all assets
    const allBars: Array<{ timestamp: number; symbol: string; bar: Bar }> = []

    for (const [symbol, bars] of data.entries()) {
      for (const bar of bars) {
        allBars.push({ timestamp: bar.timestamp, symbol, bar })
      }
    }

    // Sort by timestamp
    allBars.sort((a, b) => a.timestamp - b.timestamp)

    // Process each bar
    for (const { timestamp, symbol, bar } of allBars) {
      this.currentTime = timestamp

      // Update positions with current prices
      this.updatePositions(symbol, bar.close)

      // Generate signal
      const signal = await strategy.generateSignal({
        symbol,
        timestamp,
        bar
      })

      // Process signal
      if (Array.isArray(signal)) {
        for (const s of signal) {
          await this.processSignal(s, bar)
        }
      } else if (signal && signal.type !== 'HOLD') {
        await this.processSignal(signal, bar)
      }

      // Record equity
      this.recordEquity()
    }
  }

  /**
   * Process trading signal
   */
  private async processSignal(signal: any, bar: Bar): Promise<void> {
    if (signal.type === 'BUY') {
      await this.executeBuy(signal, bar)
    } else if (signal.type === 'SELL') {
      await this.executeSell(signal, bar)
    } else if (signal.type === 'CLOSE') {
      await this.closePosition(signal.symbol, bar)
    }
  }

  /**
   * Execute buy order
   */
  private async executeBuy(signal: any, bar: Bar): Promise<void> {
    // Calculate position size
    const price = this.applySlippage(bar.close, 'BUY')
    const maxSize = this.cash / price
    const targetSize = signal.size || maxSize * 0.1 // 10% of buying power
    const quantity = Math.min(targetSize, maxSize)

    if (quantity < 1) return

    // Calculate commission
    const commission = this.calculateCommission(quantity, price)
    const totalCost = quantity * price + commission

    if (totalCost > this.cash) return

    // Create and fill order
    const order = this.createOrder(signal.symbol, 'BUY', quantity, price)
    const fill = this.createFill(order, quantity, price, commission)

    this.fills.push(fill)
    this.cash -= totalCost

    // Update position
    this.updatePosition(signal.symbol, quantity, price)
  }

  /**
   * Execute sell order
   */
  private async executeSell(signal: any, bar: Bar): Promise<void> {
    const position = this.positions.get(signal.symbol)
    if (!position || position.quantity === 0) return

    const price = this.applySlippage(bar.close, 'SELL')
    const quantity = signal.size || position.quantity

    // Calculate commission
    const commission = this.calculateCommission(quantity, price)
    const proceeds = quantity * price - commission

    // Create and fill order
    const order = this.createOrder(signal.symbol, 'SELL', quantity, price)
    const fill = this.createFill(order, quantity, price, commission)

    this.fills.push(fill)
    this.cash += proceeds

    // Update position
    this.updatePosition(signal.symbol, -quantity, price)
  }

  /**
   * Close position
   */
  private async closePosition(symbol: string, bar: Bar): Promise<void> {
    const position = this.positions.get(symbol)
    if (!position || position.quantity === 0) return

    const price = this.applySlippage(bar.close, 'SELL')
    const quantity = position.quantity

    const commission = this.calculateCommission(quantity, price)
    const proceeds = quantity * price - commission

    const order = this.createOrder(symbol, 'SELL', quantity, price)
    const fill = this.createFill(order, quantity, price, commission)

    this.fills.push(fill)
    this.cash += proceeds

    // Close position
    position.quantity = 0
    position.marketValue = 0
  }

  /**
   * Update position
   */
  private updatePosition(symbol: string, quantity: number, price: number): void {
    let position = this.positions.get(symbol)

    if (!position) {
      position = {
        symbol,
        assetClass: 'equity',
        quantity: 0,
        side: 'LONG',
        avgPrice: 0,
        currentPrice: price,
        marketValue: 0,
        costBasis: 0,
        unrealizedPnl: 0,
        realizedPnl: 0,
        totalPnl: 0,
        returnPercent: 0,
        dayPnl: 0,
        dayReturnPercent: 0,
        weight: 0,
        openedAt: this.currentTime,
        updatedAt: this.currentTime,
        fills: []
      }
      this.positions.set(symbol, position)
    }

    // Update position
    if (quantity > 0) {
      // Adding to position
      const totalCost = position.avgPrice * position.quantity + price * quantity
      position.quantity += quantity
      position.avgPrice = totalCost / position.quantity
    } else {
      // Reducing position
      position.quantity += quantity // quantity is negative
      if (position.quantity <= 0) {
        position.quantity = 0
        position.avgPrice = 0
      }
    }

    position.currentPrice = price
    position.marketValue = position.quantity * price
    position.costBasis = position.quantity * position.avgPrice
    position.unrealizedPnl = position.marketValue - position.costBasis
    position.returnPercent = position.costBasis > 0
      ? (position.unrealizedPnl / position.costBasis) * 100
      : 0
    position.updatedAt = this.currentTime
  }

  /**
   * Update all positions with current prices
   */
  private updatePositions(symbol: string, price: number): void {
    const position = this.positions.get(symbol)
    if (!position) return

    position.currentPrice = price
    position.marketValue = position.quantity * price
    position.unrealizedPnl = position.marketValue - position.costBasis
    position.returnPercent = position.costBasis > 0
      ? (position.unrealizedPnl / position.costBasis) * 100
      : 0
  }

  /**
   * Apply slippage to price
   */
  private applySlippage(price: number, side: 'BUY' | 'SELL'): number {
    const slippage = this.config.slippage!

    if (slippage.type === 'fixed') {
      return side === 'BUY' ? price + slippage.rate : price - slippage.rate
    } else if (slippage.type === 'percentage') {
      const adjustment = price * slippage.rate
      return side === 'BUY' ? price + adjustment : price - adjustment
    }

    return price
  }

  /**
   * Calculate commission
   */
  private calculateCommission(quantity: number, price: number): number {
    const commission = this.config.commission!
    const value = quantity * price

    if (commission.type === 'fixed') {
      return commission.rate
    } else if (commission.type === 'percentage') {
      const comm = value * commission.rate
      return commission.minimum ? Math.max(comm, commission.minimum) : comm
    } else if (commission.type === 'per_share') {
      return quantity * commission.rate
    }

    return 0
  }

  /**
   * Create order
   */
  private createOrder(symbol: string, side: 'BUY' | 'SELL', quantity: number, price: number): Order {
    return {
      id: `backtest-${++this.orderIdCounter}`,
      symbol,
      side,
      type: 'MARKET',
      quantity,
      filledQuantity: quantity,
      remainingQuantity: 0,
      price,
      timeInForce: 'DAY',
      status: 'FILLED',
      createdAt: this.currentTime,
      updatedAt: this.currentTime,
      filledAt: this.currentTime
    }
  }

  /**
   * Create fill
   */
  private createFill(order: Order, quantity: number, price: number, commission: number): Fill {
    return {
      id: `fill-${this.fills.length + 1}`,
      orderId: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity,
      price,
      commission,
      timestamp: this.currentTime,
      venue: 'BACKTEST',
      liquidity: 'TAKER'
    }
  }

  /**
   * Record equity snapshot
   */
  private recordEquity(): void {
    const positionValue = Array.from(this.positions.values())
      .reduce((sum, pos) => sum + pos.marketValue, 0)

    this.equity.push(this.cash + positionValue)
    this.timestamps.push(this.currentTime)
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(): BacktestMetrics {
    const initialCapital = this.config.initialCapital!
    const finalEquity = this.equity[this.equity.length - 1] || initialCapital
    const totalReturn = (finalEquity - initialCapital) / initialCapital

    // Calculate returns
    const returns = this.equity.slice(1).map((val, i) =>
      (val - this.equity[i]) / this.equity[i]
    )

    const returnsSeries = pandas.Series(returns)

    // Calculate metrics using empyrical (Python library)
    const annualizedReturn = empyrical.annual_return(returnsSeries, period='daily')
    const volatility = empyrical.annual_volatility(returnsSeries, period='daily')
    const sharpeRatio = empyrical.sharpe_ratio(returnsSeries, risk_free=0.02, period='daily')
    const sortinoRatio = empyrical.sortino_ratio(returnsSeries, required_return=0, period='daily')
    const maxDrawdown = Math.abs(empyrical.max_drawdown(returnsSeries))
    const calmarRatio = annualizedReturn / maxDrawdown

    // Trade statistics
    const trades = this.fills.length
    const winners = this.fills.filter(f => {
      const position = this.positions.get(f.symbol)
      return position && position.unrealizedPnl > 0
    }).length
    const losers = trades - winners
    const winRate = trades > 0 ? winners / trades : 0

    // P&L statistics
    const profits = this.fills
      .filter(f => f.side === 'SELL')
      .map(f => {
        const buyFill = this.fills.find(bf =>
          bf.symbol === f.symbol && bf.side === 'BUY' && bf.timestamp < f.timestamp
        )
        return buyFill ? (f.price - buyFill.price) * f.quantity : 0
      })

    const avgWin = profits.filter(p => p > 0).reduce((a, b) => a + b, 0) / (winners || 1)
    const avgLoss = Math.abs(profits.filter(p => p < 0).reduce((a, b) => a + b, 0) / (losers || 1))
    const largestWin = Math.max(...profits, 0)
    const largestLoss = Math.abs(Math.min(...profits, 0))
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0

    const duration = this.timestamps[this.timestamps.length - 1] - this.timestamps[0]
    const totalCommissions = this.fills.reduce((sum, f) => sum + f.commission, 0)

    return {
      totalReturn,
      annualizedReturn,
      cagr: annualizedReturn,
      volatility,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      maxDrawdown,
      maxDrawdownDuration: 0, // Would need to calculate
      winRate,
      profitFactor,
      payoffRatio: avgWin / (avgLoss || 1),
      recoveryFactor: totalReturn / maxDrawdown,
      ulcerIndex: 0, // Would need to calculate
      trades,
      winners,
      losers,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      avgHoldingPeriod: 0, // Would need to calculate
      turnover: 0, // Would need to calculate
      commissions: totalCommissions,
      slippage: 0, // Would need to track
      startDate: this.timestamps[0],
      endDate: this.timestamps[this.timestamps.length - 1],
      duration
    }
  }

  /**
   * Build position history
   */
  private buildPositionHistory(): PositionHistory[] {
    const history: PositionHistory[] = []

    // Group fills by symbol to build position history
    const symbolFills = new Map<string, Fill[]>()
    for (const fill of this.fills) {
      const fills = symbolFills.get(fill.symbol) || []
      fills.push(fill)
      symbolFills.set(fill.symbol, fills)
    }

    for (const [symbol, fills] of symbolFills.entries()) {
      let entryFill: Fill | null = null

      for (const fill of fills) {
        if (fill.side === 'BUY' && !entryFill) {
          entryFill = fill
        } else if (fill.side === 'SELL' && entryFill) {
          const pnl = (fill.price - entryFill.price) * fill.quantity - fill.commission - entryFill.commission
          const returnPct = (pnl / (entryFill.price * entryFill.quantity)) * 100

          history.push({
            symbol,
            entryDate: entryFill.timestamp,
            exitDate: fill.timestamp,
            entryPrice: entryFill.price,
            exitPrice: fill.price,
            quantity: fill.quantity,
            side: 'LONG',
            pnl,
            return: returnPct,
            duration: fill.timestamp - entryFill.timestamp
          })

          entryFill = null
        }
      }
    }

    return history
  }

  /**
   * Build equity curve
   */
  private buildEquityCurve(): EquityCurve {
    const returns = this.equity.slice(1).map((val, i) =>
      (val - this.equity[i]) / this.equity[i]
    )

    return {
      timestamps: this.timestamps,
      values: this.equity,
      returns
    }
  }

  /**
   * Calculate drawdown curve
   */
  private calculateDrawdown(equityCurve: EquityCurve): DrawdownCurve {
    const equity = equityCurve.values
    const drawdowns: number[] = []
    let peak = equity[0]
    let maxDrawdown = 0
    let maxDrawdownStart = 0
    let maxDrawdownEnd = 0

    for (let i = 0; i < equity.length; i++) {
      if (equity[i] > peak) {
        peak = equity[i]
      }

      const dd = (equity[i] - peak) / peak
      drawdowns.push(dd)

      if (dd < maxDrawdown) {
        maxDrawdown = dd
        maxDrawdownEnd = i
        // Find start of this drawdown
        for (let j = i; j >= 0; j--) {
          if (equity[j] >= peak) {
            maxDrawdownStart = j
            break
          }
        }
      }
    }

    return {
      timestamps: equityCurve.timestamps,
      drawdowns,
      maxDrawdown,
      maxDrawdownStart: equityCurve.timestamps[maxDrawdownStart],
      maxDrawdownEnd: equityCurve.timestamps[maxDrawdownEnd],
      underwater: drawdowns.map(dd => dd < -0.01 ? 1 : 0)
    }
  }

  /**
   * Calculate returns series
   */
  private calculateReturns(equityCurve: EquityCurve): ReturnsSeries {
    const dailyReturns = equityCurve.returns
    const cumulativeReturns: number[] = []

    let cumulative = 1
    for (const ret of dailyReturns) {
      cumulative *= (1 + ret)
      cumulativeReturns.push(cumulative - 1)
    }

    return {
      timestamps: equityCurve.timestamps.slice(1),
      dailyReturns,
      cumulativeReturns
    }
  }

  /**
   * Compare to benchmark
   */
  private async compareToBenchmark(
    benchmarkSymbol: string,
    data: Map<string, Bar[]>,
    returns: ReturnsSeries
  ): Promise<BenchmarkComparison> {
    // In production, fetch actual benchmark data
    // For now, use synthetic benchmark
    const benchmarkData = data.values().next().value as Bar[]
    const benchmarkPrices = benchmarkData.map(b => b.close)

    const benchmarkReturns = benchmarkPrices.slice(1).map((price, i) =>
      (price - benchmarkPrices[i]) / benchmarkPrices[i]
    )

    const strategyReturns = pandas.Series(returns.dailyReturns)
    const benchReturns = pandas.Series(benchmarkReturns)

    // Calculate metrics
    const correlation = numpy.corrcoef([strategyReturns.values, benchReturns.values])[0][1]
    const beta = empyrical.beta(strategyReturns, benchReturns)
    const alpha = empyrical.alpha(strategyReturns, benchReturns, risk_free=0.02)

    const strategyMean = strategyReturns.mean()
    const benchmarkMean = benchReturns.mean()
    const trackingError = strategyReturns.sub(benchReturns).std()
    const informationRatio = (strategyMean - benchmarkMean) / trackingError
    const outperformance = strategyMean - benchmarkMean

    return {
      benchmark: benchmarkSymbol,
      correlation,
      beta,
      alpha,
      trackingError,
      informationRatio,
      outperformance
    }
  }

  /**
   * Optimize strategy parameters
   */
  async optimize(config: {
    strategy: TradingStrategy
    data: any
    parameters: Record<string, number[]>
    metric: string
  }): Promise<any> {
    const results = []

    // Grid search
    const paramCombinations = this.generateParameterGrid(config.parameters)

    for (const params of paramCombinations) {
      // Update strategy parameters
      Object.assign(config.strategy.parameters, params)

      // Run backtest
      const result = await this.run({
        strategy: config.strategy,
        startDate: config.data.startDate,
        endDate: config.data.endDate,
        initialCapital: this.config.initialCapital!
      })

      results.push({
        parameters: { ...params },
        metrics: result.metrics,
        score: this.getMetricValue(result.metrics, config.metric)
      })
    }

    // Find best parameters
    results.sort((a, b) => b.score - a.score)

    return {
      bestStrategy: config.strategy,
      bestParameters: results[0].parameters,
      bestScore: results[0].score,
      allResults: results
    }
  }

  /**
   * Generate parameter grid
   */
  private generateParameterGrid(params: Record<string, number[]>): Array<Record<string, number>> {
    const keys = Object.keys(params)
    const combinations: Array<Record<string, number>> = []

    const generate = (index: number, current: Record<string, number>) => {
      if (index === keys.length) {
        combinations.push({ ...current })
        return
      }

      const key = keys[index]
      for (const value of params[key]) {
        current[key] = value
        generate(index + 1, current)
      }
    }

    generate(0, {})
    return combinations
  }

  /**
   * Get metric value
   */
  private getMetricValue(metrics: BacktestMetrics, metric: string): number {
    switch (metric) {
      case 'total_return': return metrics.totalReturn
      case 'sharpe_ratio': return metrics.sharpeRatio
      case 'sortino_ratio': return metrics.sortinoRatio
      case 'calmar_ratio': return metrics.calmarRatio
      case 'profit_factor': return metrics.profitFactor
      default: return metrics.totalReturn
    }
  }
}
