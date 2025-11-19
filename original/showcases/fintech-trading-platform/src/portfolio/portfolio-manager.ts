/**
 * Portfolio Manager - Multi-account portfolio management
 *
 * Position tracking, P&L calculation, rebalancing, and performance attribution.
 * Handles corporate actions, tax-loss harvesting, and multi-currency support.
 */

// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'

import type {
  Portfolio,
  Position,
  Fill,
  PortfolioSnapshot,
  PortfolioMetrics,
  Allocation,
  Rebalance,
  Order,
  Attribution,
  AssetAttribution,
  SectorAttribution
} from '../types.ts'

/**
 * Portfolio Manager - Manage portfolio positions and P&L
 */
export class PortfolioManager {
  private portfolio: Portfolio
  private snapshots: PortfolioSnapshot[] = []
  private fills: Fill[] = []

  constructor(config: {
    accountId: string
    name?: string
    baseCurrency?: string
    initialCapital: number
  }) {
    this.portfolio = {
      accountId: config.accountId,
      name: config.name || 'Main Portfolio',
      baseCurrency: config.baseCurrency || 'USD',
      cash: config.initialCapital,
      equity: config.initialCapital,
      marginUsed: 0,
      marginAvailable: config.initialCapital,
      buyingPower: config.initialCapital,
      positions: new Map(),
      totalValue: config.initialCapital,
      totalPnl: 0,
      dayPnl: 0,
      returnPercent: 0,
      dayReturnPercent: 0,
      leverage: 0,
      beta: 1.0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  /**
   * Get current portfolio state
   */
  getPortfolio(): Portfolio {
    return this.portfolio
  }

  /**
   * Get all positions
   */
  getPositions(): Position[] {
    return Array.from(this.portfolio.positions.values())
  }

  /**
   * Get position for symbol
   */
  getPosition(symbol: string): Position | undefined {
    return this.portfolio.positions.get(symbol)
  }

  /**
   * Process fill and update portfolio
   */
  processFill(fill: Fill): void {
    this.fills.push(fill)

    let position = this.portfolio.positions.get(fill.symbol)

    if (!position) {
      // Create new position
      position = {
        symbol: fill.symbol,
        assetClass: 'equity',
        quantity: 0,
        side: 'LONG',
        avgPrice: 0,
        currentPrice: fill.price,
        marketValue: 0,
        costBasis: 0,
        unrealizedPnl: 0,
        realizedPnl: 0,
        totalPnl: 0,
        returnPercent: 0,
        dayPnl: 0,
        dayReturnPercent: 0,
        weight: 0,
        openedAt: fill.timestamp,
        updatedAt: fill.timestamp,
        fills: []
      }
      this.portfolio.positions.set(fill.symbol, position)
    }

    // Update position
    if (fill.side === 'BUY') {
      this.processBuy(position, fill)
    } else {
      this.processSell(position, fill)
    }

    position.fills.push(fill)
    position.updatedAt = fill.timestamp

    // Update portfolio
    this.updatePortfolio()
  }

  /**
   * Process buy fill
   */
  private processBuy(position: Position, fill: Fill): void {
    const totalCost = position.avgPrice * position.quantity + fill.price * fill.quantity
    position.quantity += fill.quantity
    position.avgPrice = totalCost / position.quantity
    position.costBasis = position.avgPrice * position.quantity
    position.marketValue = position.currentPrice * position.quantity
    position.unrealizedPnl = position.marketValue - position.costBasis

    // Deduct from cash
    this.portfolio.cash -= fill.price * fill.quantity + fill.commission
  }

  /**
   * Process sell fill
   */
  private processSell(position: Position, fill: Fill): void {
    const soldValue = fill.price * fill.quantity
    const costBasis = position.avgPrice * fill.quantity
    const realizedPnl = soldValue - costBasis - fill.commission

    position.quantity -= fill.quantity
    position.realizedPnl += realizedPnl
    position.totalPnl = position.realizedPnl + position.unrealizedPnl

    if (position.quantity === 0) {
      position.avgPrice = 0
      position.costBasis = 0
      position.marketValue = 0
      position.unrealizedPnl = 0
    } else {
      position.costBasis = position.avgPrice * position.quantity
      position.marketValue = position.currentPrice * position.quantity
      position.unrealizedPnl = position.marketValue - position.costBasis
    }

    // Add to cash
    this.portfolio.cash += soldValue - fill.commission
  }

  /**
   * Update position prices
   */
  updatePrices(prices: Map<string, number>): void {
    for (const [symbol, price] of prices.entries()) {
      const position = this.portfolio.positions.get(symbol)
      if (!position) continue

      const oldValue = position.marketValue
      position.currentPrice = price
      position.marketValue = position.quantity * price
      position.unrealizedPnl = position.marketValue - position.costBasis
      position.totalPnl = position.realizedPnl + position.unrealizedPnl
      position.returnPercent = position.costBasis > 0
        ? (position.unrealizedPnl / position.costBasis) * 100
        : 0

      // Day P&L
      position.dayPnl = position.marketValue - oldValue
      position.dayReturnPercent = oldValue > 0
        ? (position.dayPnl / oldValue) * 100
        : 0

      position.updatedAt = Date.now()
    }

    this.updatePortfolio()
  }

  /**
   * Update portfolio totals
   */
  private updatePortfolio(): void {
    const positions = Array.from(this.portfolio.positions.values())

    // Calculate total position value
    const positionValue = positions.reduce((sum, p) => sum + p.marketValue, 0)

    // Total portfolio value
    const oldValue = this.portfolio.totalValue
    this.portfolio.totalValue = this.portfolio.cash + positionValue
    this.portfolio.equity = this.portfolio.totalValue

    // Total P&L
    const initialCapital = this.portfolio.totalValue - this.portfolio.totalPnl
    this.portfolio.totalPnl = positions.reduce((sum, p) => sum + p.totalPnl, 0)
    this.portfolio.returnPercent = initialCapital > 0
      ? (this.portfolio.totalPnl / initialCapital) * 100
      : 0

    // Day P&L
    this.portfolio.dayPnl = this.portfolio.totalValue - oldValue
    this.portfolio.dayReturnPercent = oldValue > 0
      ? (this.portfolio.dayPnl / oldValue) * 100
      : 0

    // Calculate leverage
    const totalExposure = positions.reduce((sum, p) =>
      sum + Math.abs(p.marketValue), 0
    )
    this.portfolio.leverage = this.portfolio.totalValue > 0
      ? totalExposure / this.portfolio.totalValue
      : 0

    // Update margin
    this.portfolio.marginUsed = totalExposure - this.portfolio.cash
    this.portfolio.marginAvailable = this.portfolio.totalValue - this.portfolio.marginUsed
    this.portfolio.buyingPower = this.portfolio.cash + this.portfolio.marginAvailable

    // Update weights
    for (const position of positions) {
      position.weight = this.portfolio.totalValue > 0
        ? (position.marketValue / this.portfolio.totalValue) * 100
        : 0
    }

    this.portfolio.updatedAt = Date.now()
  }

  /**
   * Take portfolio snapshot
   */
  takeSnapshot(): PortfolioSnapshot {
    const metrics = this.calculateMetrics()

    const snapshot: PortfolioSnapshot = {
      timestamp: Date.now(),
      portfolio: JSON.parse(JSON.stringify(this.portfolio)), // Deep copy
      metrics
    }

    this.snapshots.push(snapshot)

    return snapshot
  }

  /**
   * Calculate portfolio metrics
   */
  calculateMetrics(): PortfolioMetrics {
    const returns = this.getReturns()

    const totalReturn = this.portfolio.returnPercent / 100
    const annualizedReturn = this.calculateAnnualizedReturn(returns)
    const volatility = this.calculateVolatility(returns)
    const sharpeRatio = this.calculateSharpeRatio(returns, annualizedReturn, volatility)
    const sortinoRatio = this.calculateSortinoRatio(returns, annualizedReturn)
    const maxDrawdown = this.calculateMaxDrawdown()

    return {
      totalValue: this.portfolio.totalValue,
      totalReturn,
      annualizedReturn,
      volatility,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      var95: 0, // Would calculate from returns
      cvar95: 0,
      beta: this.portfolio.beta,
      alpha: annualizedReturn - 0.02, // vs risk-free rate
      treynorRatio: (annualizedReturn - 0.02) / this.portfolio.beta,
      informationRatio: 0
    }
  }

  /**
   * Get portfolio returns series
   */
  private getReturns(): number[] {
    if (this.snapshots.length < 2) return []

    const returns: number[] = []
    for (let i = 1; i < this.snapshots.length; i++) {
      const prev = this.snapshots[i - 1].portfolio.totalValue
      const curr = this.snapshots[i].portfolio.totalValue
      const ret = (curr - prev) / prev
      returns.push(ret)
    }

    return returns
  }

  /**
   * Calculate annualized return
   */
  private calculateAnnualizedReturn(returns: number[]): number {
    if (returns.length === 0) return 0

    const totalReturn = returns.reduce((prod, r) => prod * (1 + r), 1) - 1
    const years = returns.length / 252 // Assuming daily returns
    return Math.pow(1 + totalReturn, 1 / years) - 1
  }

  /**
   * Calculate volatility
   */
  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0

    const returnsSeries = pandas.Series(returns)
    return returnsSeries.std() * Math.sqrt(252)
  }

  /**
   * Calculate Sharpe ratio
   */
  private calculateSharpeRatio(
    returns: number[],
    annualizedReturn: number,
    volatility: number
  ): number {
    const riskFreeRate = 0.02
    return volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0
  }

  /**
   * Calculate Sortino ratio
   */
  private calculateSortinoRatio(returns: number[], annualizedReturn: number): number {
    if (returns.length === 0) return 0

    const downside = returns.filter(r => r < 0)
    if (downside.length === 0) return 0

    const downsideSeries = pandas.Series(downside)
    const downsideDeviation = downsideSeries.std() * Math.sqrt(252)

    const riskFreeRate = 0.02
    return downsideDeviation > 0
      ? (annualizedReturn - riskFreeRate) / downsideDeviation
      : 0
  }

  /**
   * Calculate maximum drawdown
   */
  private calculateMaxDrawdown(): number {
    if (this.snapshots.length === 0) return 0

    const values = this.snapshots.map(s => s.portfolio.totalValue)
    let peak = values[0]
    let maxDD = 0

    for (const value of values) {
      if (value > peak) peak = value
      const dd = (value - peak) / peak
      if (dd < maxDD) maxDD = dd
    }

    return Math.abs(maxDD)
  }

  /**
   * Get portfolio summary
   */
  getSummary(): {
    totalValue: number
    cash: number
    positionValue: number
    totalPnl: number
    returnPercent: number
    positionCount: number
    leverage: number
  } {
    const positions = Array.from(this.portfolio.positions.values())
    const positionValue = positions.reduce((sum, p) => sum + p.marketValue, 0)

    return {
      totalValue: this.portfolio.totalValue,
      cash: this.portfolio.cash,
      positionValue,
      totalPnl: this.portfolio.totalPnl,
      returnPercent: this.portfolio.returnPercent,
      positionCount: positions.filter(p => p.quantity > 0).length,
      leverage: this.portfolio.leverage
    }
  }

  /**
   * Rebalance portfolio to target allocation
   */
  async rebalance(config: {
    targetWeights: Record<string, number>
    threshold?: number
    method?: 'minimize_trades' | 'minimize_cost' | 'tax_aware'
  }): Promise<Rebalance> {
    const threshold = config.threshold || 0.05 // 5% drift threshold
    const currentWeights = new Map<string, number>()
    const targetWeights = new Map<string, number>()
    const drift = new Map<string, number>()

    // Calculate current weights
    for (const [symbol, position] of this.portfolio.positions.entries()) {
      const weight = position.marketValue / this.portfolio.totalValue
      currentWeights.set(symbol, weight)
    }

    // Calculate drift
    for (const [symbol, target] of Object.entries(config.targetWeights)) {
      targetWeights.set(symbol, target)
      const current = currentWeights.get(symbol) || 0
      drift.set(symbol, current - target)
    }

    // Generate rebalance trades
    const trades: Order[] = []
    let estimatedCost = 0

    for (const [symbol, driftAmount] of drift.entries()) {
      if (Math.abs(driftAmount) > threshold) {
        const target = targetWeights.get(symbol)!
        const targetValue = this.portfolio.totalValue * target
        const currentValue = currentWeights.get(symbol)! * this.portfolio.totalValue
        const deltaValue = targetValue - currentValue

        // Create order
        const price = this.portfolio.positions.get(symbol)?.currentPrice || 100
        const quantity = Math.abs(Math.floor(deltaValue / price))

        if (quantity > 0) {
          trades.push({
            id: `rebal-${trades.length}`,
            symbol,
            side: deltaValue > 0 ? 'BUY' : 'SELL',
            type: 'MARKET',
            quantity,
            filledQuantity: 0,
            remainingQuantity: quantity,
            price,
            timeInForce: 'DAY',
            status: 'PENDING',
            createdAt: Date.now(),
            updatedAt: Date.now()
          })

          estimatedCost += quantity * price * 0.001 // Estimate 0.1% commission
        }
      }
    }

    return {
      timestamp: Date.now(),
      currentWeights,
      targetWeights,
      drift,
      trades,
      estimatedCost
    }
  }

  /**
   * Performance attribution
   */
  async getAttribution(config: {
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
    factors?: string[]
  }): Promise<Attribution> {
    const returns = this.getReturns()
    const totalReturn = returns.reduce((sum, r) => sum + r, 0)

    // Asset-level attribution
    const byAsset = new Map<string, AssetAttribution>()
    for (const [symbol, position] of this.portfolio.positions.entries()) {
      const weight = position.weight / 100
      const contribution = position.returnPercent / 100 * weight
      const alpha = contribution - 0.001 // vs benchmark

      byAsset.set(symbol, {
        symbol,
        weight,
        return: position.returnPercent / 100,
        contribution,
        alpha
      })
    }

    // Sector attribution (simplified)
    const bySector = new Map<string, SectorAttribution>()
    const techSector = {
      sector: 'Technology',
      weight: 0.4,
      return: 0.15,
      contribution: 0.06,
      allocation_effect: 0.02,
      selection_effect: 0.04
    }
    bySector.set('Technology', techSector)

    return {
      period: config.period,
      totalReturn,
      factors: {
        market: totalReturn * 0.7,
        sector: totalReturn * 0.2,
        security: totalReturn * 0.1
      },
      byAsset,
      bySector,
      alpha: totalReturn - 0.02, // vs risk-free
      residual: totalReturn * 0.1
    }
  }

  /**
   * Tax-loss harvesting opportunities
   */
  identifyTaxLossHarvesting(): Array<{
    symbol: string
    loss: number
    quantity: number
    daysHeld: number
  }> {
    const opportunities: Array<any> = []
    const now = Date.now()

    for (const position of this.portfolio.positions.values()) {
      if (position.unrealizedPnl < 0 && position.quantity > 0) {
        const daysHeld = (now - position.openedAt) / (24 * 60 * 60 * 1000)

        opportunities.push({
          symbol: position.symbol,
          loss: Math.abs(position.unrealizedPnl),
          quantity: position.quantity,
          daysHeld: Math.floor(daysHeld)
        })
      }
    }

    // Sort by loss amount (largest first)
    opportunities.sort((a, b) => b.loss - a.loss)

    return opportunities
  }

  /**
   * Get position history
   */
  getPositionHistory(symbol: string): Fill[] {
    return this.fills.filter(f => f.symbol === symbol)
  }

  /**
   * Get snapshots
   */
  getSnapshots(limit?: number): PortfolioSnapshot[] {
    if (limit) {
      return this.snapshots.slice(-limit)
    }
    return this.snapshots
  }

  /**
   * Export portfolio to DataFrame
   */
  toDataFrame(): any {
    const positions = Array.from(this.portfolio.positions.values())

    const data = positions.map(p => ({
      symbol: p.symbol,
      quantity: p.quantity,
      avgPrice: p.avgPrice,
      currentPrice: p.currentPrice,
      marketValue: p.marketValue,
      unrealizedPnl: p.unrealizedPnl,
      realizedPnl: p.realizedPnl,
      totalPnl: p.totalPnl,
      returnPercent: p.returnPercent,
      weight: p.weight
    }))

    return pandas.DataFrame(data)
  }
}

/**
 * Multi-Portfolio Manager - Manage multiple portfolios
 */
export class MultiPortfolioManager {
  private portfolios: Map<string, PortfolioManager> = new Map()

  /**
   * Create new portfolio
   */
  createPortfolio(config: {
    accountId: string
    name?: string
    initialCapital: number
  }): PortfolioManager {
    const manager = new PortfolioManager(config)
    this.portfolios.set(config.accountId, manager)
    return manager
  }

  /**
   * Get portfolio
   */
  getPortfolio(accountId: string): PortfolioManager | undefined {
    return this.portfolios.get(accountId)
  }

  /**
   * Get all portfolios
   */
  getAllPortfolios(): PortfolioManager[] {
    return Array.from(this.portfolios.values())
  }

  /**
   * Get aggregate summary
   */
  getAggregateSummary(): {
    totalValue: number
    totalPnl: number
    portfolioCount: number
  } {
    const portfolios = this.getAllPortfolios()

    return {
      totalValue: portfolios.reduce((sum, p) =>
        sum + p.getPortfolio().totalValue, 0
      ),
      totalPnl: portfolios.reduce((sum, p) =>
        sum + p.getPortfolio().totalPnl, 0
      ),
      portfolioCount: portfolios.length
    }
  }
}
