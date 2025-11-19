/**
 * Risk Engine - Comprehensive risk management and monitoring
 *
 * Real-time risk monitoring, VaR calculation, stress testing, and limit enforcement.
 * Uses Python libraries for advanced risk analytics.
 */

// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import scipy from 'python:scipy'

import type {
  Portfolio,
  Position,
  Order,
  RiskLimits,
  RiskMetrics,
  RiskViolation,
  VaRCalculation,
  StressScenario,
  StressTestResult,
  AssetClass
} from '../types.ts'

/**
 * Risk Engine - Monitor and enforce risk limits
 */
export class RiskEngine {
  private limits: RiskLimits
  private violations: RiskViolation[] = []
  private metricsHistory: RiskMetrics[] = []

  constructor(config: { limits: RiskLimits }) {
    this.limits = config.limits
  }

  /**
   * Validate order against risk limits
   */
  async validateOrder(order: Order, portfolio: Portfolio): Promise<{
    approved: boolean
    violations: RiskViolation[]
    warnings: string[]
  }> {
    const violations: RiskViolation[] = []
    const warnings: string[] = []

    // Simulate position after order execution
    const simulatedPortfolio = this.simulateOrder(order, portfolio)

    // Check position size limit
    const positionSizeViolation = this.checkPositionSize(order.symbol, simulatedPortfolio)
    if (positionSizeViolation) violations.push(positionSizeViolation)

    // Check leverage limit
    const leverageViolation = this.checkLeverage(simulatedPortfolio)
    if (leverageViolation) violations.push(leverageViolation)

    // Check sector exposure
    const sectorViolation = await this.checkSectorExposure(simulatedPortfolio)
    if (sectorViolation) violations.push(sectorViolation)

    // Check concentration
    const concentrationViolation = this.checkConcentration(simulatedPortfolio)
    if (concentrationViolation) violations.push(concentrationViolation)

    // Check buying power
    if (order.side === 'BUY') {
      const buyingPowerCheck = this.checkBuyingPower(order, portfolio)
      if (!buyingPowerCheck.sufficient) {
        violations.push({
          type: 'limit_breach',
          rule: 'buying_power',
          current: buyingPowerCheck.required,
          limit: portfolio.buyingPower,
          severity: 'critical',
          message: 'Insufficient buying power',
          timestamp: Date.now()
        })
      }
    }

    const approved = violations.length === 0

    // Record violations
    if (!approved) {
      this.violations.push(...violations)
    }

    return { approved, violations, warnings }
  }

  /**
   * Calculate comprehensive risk metrics
   */
  async calculateRiskMetrics(portfolio: Portfolio): Promise<RiskMetrics> {
    const positions = Array.from(portfolio.positions.values())

    // Calculate exposures
    const totalExposure = positions.reduce((sum, p) => sum + Math.abs(p.marketValue), 0)
    const netExposure = positions.reduce((sum, p) =>
      sum + (p.side === 'LONG' ? p.marketValue : -p.marketValue), 0
    )

    const leverage = totalExposure / portfolio.totalValue
    const beta = await this.calculatePortfolioBeta(positions)

    // Calculate VaR
    const var95 = await this.calculateVaR(portfolio, 0.95, 'historical')
    const var99 = await this.calculateVaR(portfolio, 0.99, 'historical')
    const cvar95 = await this.calculateCVaR(portfolio, 0.95)

    // Calculate expected shortfall
    const expectedShortfall = await this.calculateExpectedShortfall(portfolio, 0.95)

    // Stress test
    const stressTestLoss = await this.runStressTest(portfolio)

    // Drawdown metrics
    const drawdownMetrics = this.calculateDrawdownMetrics(portfolio)

    // Volatility
    const volatility = await this.calculatePortfolioVolatility(positions)

    // Sharpe ratio
    const sharpeRatio = await this.calculateSharpeRatio(portfolio)

    // Exposures by category
    const exposures = {
      byAssetClass: this.calculateAssetClassExposure(positions),
      bySector: new Map<string, number>(),
      byRegion: new Map<string, number>()
    }

    const metrics: RiskMetrics = {
      timestamp: Date.now(),
      portfolioValue: portfolio.totalValue,
      totalExposure,
      netExposure,
      leverage,
      beta,
      var95,
      var99,
      cvar95,
      expectedShortfall,
      stressTestLoss,
      maxDrawdown: drawdownMetrics.maxDrawdown,
      currentDrawdown: drawdownMetrics.currentDrawdown,
      volatility,
      sharpeRatio,
      exposures
    }

    this.metricsHistory.push(metrics)

    // Check for violations
    await this.checkRiskLimits(metrics)

    return metrics
  }

  /**
   * Calculate Value at Risk
   */
  async calculateVaR(
    portfolio: Portfolio,
    confidence: number,
    method: 'historical' | 'parametric' | 'monte_carlo' = 'historical',
    horizon: number = 1
  ): Promise<number> {
    const returns = await this.getPortfolioReturns(portfolio)

    if (method === 'historical') {
      return this.historicalVaR(returns, confidence)
    } else if (method === 'parametric') {
      return this.parametricVaR(returns, confidence, horizon)
    } else {
      return this.monteCarloVaR(portfolio, confidence, horizon)
    }
  }

  /**
   * Historical VaR
   */
  private historicalVaR(returns: number[], confidence: number): number {
    if (returns.length === 0) return 0

    const returnsSeries = pandas.Series(returns)
    const percentile = (1 - confidence) * 100
    const var_value = numpy.percentile(returnsSeries.values, percentile)

    return Math.abs(var_value)
  }

  /**
   * Parametric VaR
   */
  private parametricVaR(returns: number[], confidence: number, horizon: number): number {
    if (returns.length === 0) return 0

    const returnsSeries = pandas.Series(returns)
    const mean = returnsSeries.mean()
    const std = returnsSeries.std()

    // Z-score for confidence level
    const z = scipy.stats.norm.ppf(1 - confidence)

    // VaR = |μ - σ * z * √horizon|
    const var_value = mean - std * z * Math.sqrt(horizon)

    return Math.abs(var_value)
  }

  /**
   * Monte Carlo VaR
   */
  private async monteCarloVaR(
    portfolio: Portfolio,
    confidence: number,
    horizon: number,
    simulations: number = 10000
  ): Promise<number> {
    const returns = await this.getPortfolioReturns(portfolio)
    if (returns.length === 0) return 0

    const returnsSeries = pandas.Series(returns)
    const mean = returnsSeries.mean()
    const std = returnsSeries.std()

    // Run Monte Carlo simulations
    const simulatedReturns: number[] = []
    for (let i = 0; i < simulations; i++) {
      const randomReturn = numpy.random.normal(mean, std)
      simulatedReturns.push(randomReturn * Math.sqrt(horizon))
    }

    const percentile = (1 - confidence) * 100
    const var_value = numpy.percentile(simulatedReturns, percentile)

    return Math.abs(var_value)
  }

  /**
   * Calculate Conditional VaR (Expected Shortfall)
   */
  async calculateCVaR(portfolio: Portfolio, confidence: number): Promise<number> {
    const returns = await this.getPortfolioReturns(portfolio)
    if (returns.length === 0) return 0

    const returnsSeries = pandas.Series(returns)
    const percentile = (1 - confidence) * 100
    const var_threshold = numpy.percentile(returnsSeries.values, percentile)

    // CVaR = average of returns below VaR threshold
    const tailReturns = returns.filter(r => r <= var_threshold)
    const cvar = tailReturns.length > 0
      ? Math.abs(tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length)
      : 0

    return cvar
  }

  /**
   * Calculate Expected Shortfall
   */
  async calculateExpectedShortfall(portfolio: Portfolio, confidence: number): Promise<number> {
    // Expected Shortfall is the same as CVaR
    return this.calculateCVaR(portfolio, confidence)
  }

  /**
   * Run stress tests
   */
  async runStressTest(
    portfolio: Portfolio,
    scenarios?: StressScenario[]
  ): Promise<number> {
    const defaultScenarios: StressScenario[] = [
      {
        name: '2008 Financial Crisis',
        description: 'Market crash scenario',
        shocks: new Map([
          ['SPY', -0.40],
          ['TLT', 0.15],
          ['GLD', 0.10]
        ])
      },
      {
        name: 'Flash Crash',
        description: 'Rapid market decline',
        shocks: new Map([
          ['SPY', -0.10],
          ['VIX', 1.50]
        ])
      },
      {
        name: 'Interest Rate Shock',
        description: 'Sudden rate increase',
        shocks: new Map([
          ['TLT', -0.20],
          ['SPY', -0.05]
        ])
      }
    ]

    const testScenarios = scenarios || defaultScenarios
    const results: StressTestResult[] = []

    for (const scenario of testScenarios) {
      const result = await this.applyStressScenario(portfolio, scenario)
      results.push(result)
    }

    // Return worst-case loss
    const worstLoss = Math.min(...results.map(r => r.portfolioImpact))
    return worstLoss
  }

  /**
   * Apply stress scenario
   */
  private async applyStressScenario(
    portfolio: Portfolio,
    scenario: StressScenario
  ): Promise<StressTestResult> {
    const positions = Array.from(portfolio.positions.values())
    const positionImpacts = new Map<string, number>()

    let totalImpact = 0

    for (const position of positions) {
      const shock = scenario.shocks.get(position.symbol) || -0.10 // Default -10%
      const impact = position.marketValue * shock
      positionImpacts.set(position.symbol, impact)
      totalImpact += impact
    }

    const newPortfolioValue = portfolio.totalValue + totalImpact
    const drawdown = totalImpact / portfolio.totalValue

    return {
      scenario,
      portfolioImpact: totalImpact,
      positionImpacts,
      newPortfolioValue,
      drawdown
    }
  }

  /**
   * Calculate portfolio beta
   */
  private async calculatePortfolioBeta(positions: Position[]): Promise<number> {
    // In production, calculate actual beta vs market
    // For now, estimate based on asset classes
    let totalBeta = 0
    let totalWeight = 0

    for (const position of positions) {
      const weight = position.marketValue
      const beta = this.getAssetBeta(position.assetClass)
      totalBeta += beta * weight
      totalWeight += weight
    }

    return totalWeight > 0 ? totalBeta / totalWeight : 1.0
  }

  /**
   * Get asset class beta
   */
  private getAssetBeta(assetClass: AssetClass): number {
    const betas: Record<AssetClass, number> = {
      equity: 1.0,
      option: 1.5,
      future: 1.2,
      forex: 0.5,
      crypto: 2.0,
      bond: 0.3,
      commodity: 0.8
    }
    return betas[assetClass] || 1.0
  }

  /**
   * Calculate portfolio volatility
   */
  private async calculatePortfolioVolatility(positions: Position[]): Promise<number> {
    // Simplified - in production, use covariance matrix
    const returns = positions.map(() => Math.random() * 0.02 - 0.01)
    const returnsSeries = pandas.Series(returns)
    return returnsSeries.std() * Math.sqrt(252) // Annualized
  }

  /**
   * Calculate Sharpe ratio
   */
  private async calculateSharpeRatio(portfolio: Portfolio): Promise<number> {
    const returns = await this.getPortfolioReturns(portfolio)
    if (returns.length === 0) return 0

    const returnsSeries = pandas.Series(returns)
    const avgReturn = returnsSeries.mean()
    const stdReturn = returnsSeries.std()
    const riskFreeRate = 0.02 / 252 // Daily risk-free rate

    return stdReturn > 0
      ? (avgReturn - riskFreeRate) / stdReturn * Math.sqrt(252)
      : 0
  }

  /**
   * Get portfolio returns
   */
  private async getPortfolioReturns(portfolio: Portfolio): Promise<number[]> {
    // In production, fetch actual historical returns
    // For now, generate synthetic returns
    const returns: number[] = []
    for (let i = 0; i < 252; i++) {
      returns.push(numpy.random.normal(0.001, 0.02))
    }
    return returns
  }

  /**
   * Check position size limit
   */
  private checkPositionSize(symbol: string, portfolio: Portfolio): RiskViolation | null {
    const position = portfolio.positions.get(symbol)
    if (!position) return null

    const positionWeight = position.marketValue / portfolio.totalValue

    if (positionWeight > this.limits.maxPositionSize) {
      return {
        type: 'limit_breach',
        rule: 'max_position_size',
        current: positionWeight,
        limit: this.limits.maxPositionSize,
        severity: 'high',
        message: `Position size ${(positionWeight * 100).toFixed(2)}% exceeds limit ${(this.limits.maxPositionSize * 100).toFixed(2)}%`,
        timestamp: Date.now()
      }
    }

    return null
  }

  /**
   * Check leverage limit
   */
  private checkLeverage(portfolio: Portfolio): RiskViolation | null {
    if (portfolio.leverage > this.limits.maxLeverage) {
      return {
        type: 'limit_breach',
        rule: 'max_leverage',
        current: portfolio.leverage,
        limit: this.limits.maxLeverage,
        severity: 'critical',
        message: `Leverage ${portfolio.leverage.toFixed(2)}x exceeds limit ${this.limits.maxLeverage}x`,
        timestamp: Date.now()
      }
    }

    return null
  }

  /**
   * Check sector exposure
   */
  private async checkSectorExposure(portfolio: Portfolio): Promise<RiskViolation | null> {
    // In production, calculate actual sector exposures
    return null
  }

  /**
   * Check concentration
   */
  private checkConcentration(portfolio: Portfolio): RiskViolation | null {
    if (!this.limits.maxConcentration) return null

    const positions = Array.from(portfolio.positions.values())
    const maxPosition = Math.max(...positions.map(p => p.marketValue))
    const concentration = maxPosition / portfolio.totalValue

    if (concentration > this.limits.maxConcentration) {
      return {
        type: 'limit_breach',
        rule: 'max_concentration',
        current: concentration,
        limit: this.limits.maxConcentration,
        severity: 'medium',
        message: `Concentration ${(concentration * 100).toFixed(2)}% exceeds limit`,
        timestamp: Date.now()
      }
    }

    return null
  }

  /**
   * Check buying power
   */
  private checkBuyingPower(order: Order, portfolio: Portfolio): {
    sufficient: boolean
    required: number
  } {
    const price = order.price || 100 // Mock price
    const required = order.quantity * price

    return {
      sufficient: required <= portfolio.buyingPower,
      required
    }
  }

  /**
   * Simulate order execution
   */
  private simulateOrder(order: Order, portfolio: Portfolio): Portfolio {
    // Create copy of portfolio
    const simulated: Portfolio = {
      ...portfolio,
      positions: new Map(portfolio.positions)
    }

    const price = order.price || 100
    const value = order.quantity * price

    if (order.side === 'BUY') {
      simulated.cash -= value
      // Add or update position
      const existing = simulated.positions.get(order.symbol)
      if (existing) {
        existing.quantity += order.quantity
        existing.marketValue += value
      }
    } else {
      simulated.cash += value
      // Reduce position
      const existing = simulated.positions.get(order.symbol)
      if (existing) {
        existing.quantity -= order.quantity
        existing.marketValue -= value
      }
    }

    // Recalculate portfolio value
    simulated.totalValue = simulated.cash +
      Array.from(simulated.positions.values())
        .reduce((sum, p) => sum + p.marketValue, 0)

    // Recalculate leverage
    const totalExposure = Array.from(simulated.positions.values())
      .reduce((sum, p) => sum + Math.abs(p.marketValue), 0)
    simulated.leverage = totalExposure / simulated.totalValue

    return simulated
  }

  /**
   * Calculate asset class exposures
   */
  private calculateAssetClassExposure(positions: Position[]): Map<AssetClass, number> {
    const exposures = new Map<AssetClass, number>()

    for (const position of positions) {
      const current = exposures.get(position.assetClass) || 0
      exposures.set(position.assetClass, current + position.marketValue)
    }

    return exposures
  }

  /**
   * Calculate drawdown metrics
   */
  private calculateDrawdownMetrics(portfolio: Portfolio): {
    maxDrawdown: number
    currentDrawdown: number
  } {
    // In production, track equity curve history
    return {
      maxDrawdown: 0.15,
      currentDrawdown: 0.05
    }
  }

  /**
   * Check all risk limits
   */
  private async checkRiskLimits(metrics: RiskMetrics): Promise<void> {
    const violations: RiskViolation[] = []

    // Check max drawdown
    if (metrics.maxDrawdown > this.limits.maxDrawdown) {
      violations.push({
        type: 'limit_breach',
        rule: 'max_drawdown',
        current: metrics.maxDrawdown,
        limit: this.limits.maxDrawdown,
        severity: 'critical',
        message: `Max drawdown ${(metrics.maxDrawdown * 100).toFixed(2)}% exceeds limit`,
        timestamp: Date.now()
      })
    }

    // Check leverage
    if (metrics.leverage > this.limits.maxLeverage) {
      violations.push({
        type: 'limit_breach',
        rule: 'max_leverage',
        current: metrics.leverage,
        limit: this.limits.maxLeverage,
        severity: 'critical',
        message: `Leverage ${metrics.leverage.toFixed(2)}x exceeds limit`,
        timestamp: Date.now()
      })
    }

    // Check VaR
    if (this.limits.maxDailyVaR && metrics.var95 > this.limits.maxDailyVaR) {
      violations.push({
        type: 'limit_breach',
        rule: 'max_var',
        current: metrics.var95,
        limit: this.limits.maxDailyVaR,
        severity: 'high',
        message: `VaR exceeds daily limit`,
        timestamp: Date.now()
      })
    }

    this.violations.push(...violations)
  }

  /**
   * Get all violations
   */
  getViolations(): RiskViolation[] {
    return this.violations
  }

  /**
   * Get recent violations
   */
  getRecentViolations(hours: number = 24): RiskViolation[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000
    return this.violations.filter(v => v.timestamp >= cutoff)
  }

  /**
   * Clear violations
   */
  clearViolations(): void {
    this.violations = []
  }
}
