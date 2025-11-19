/**
 * Performance Analytics - Comprehensive performance measurement
 *
 * Calculates returns, risk metrics, attribution, and generates tearsheets.
 * Uses Python libraries for advanced analytics and visualization.
 */

// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import empyrical from 'python:empyrical'
// @ts-ignore
import pyfolio from 'python:pyfolio'

import type {
  Portfolio,
  BacktestResult,
  PerformanceAnalytics as IPerformanceAnalytics,
  DrawdownAnalysis,
  DrawdownPeriod
} from '../types.ts'

/**
 * Performance Analytics Engine
 */
export class PerformanceAnalytics implements IPerformanceAnalytics {
  /**
   * Calculate returns from price series
   */
  calculateReturns(prices: number[]): number[] {
    if (prices.length < 2) return []

    const returns: number[] = []
    for (let i = 1; i < prices.length; i++) {
      const ret = (prices[i] - prices[i - 1]) / prices[i - 1]
      returns.push(ret)
    }

    return returns
  }

  /**
   * Calculate log returns
   */
  calculateLogReturns(prices: number[]): number[] {
    if (prices.length < 2) return []

    const returns: number[] = []
    for (let i = 1; i < prices.length; i++) {
      const ret = Math.log(prices[i] / prices[i - 1])
      returns.push(ret)
    }

    return returns
  }

  /**
   * Calculate Sharpe ratio
   */
  calculateSharpe(returns: number[], riskFreeRate: number = 0.02): number {
    if (returns.length === 0) return 0

    const returnsSeries = pandas.Series(returns)
    return empyrical.sharpe_ratio(returnsSeries, risk_free=riskFreeRate, period='daily')
  }

  /**
   * Calculate Sortino ratio
   */
  calculateSortino(returns: number[], riskFreeRate: number = 0.02): number {
    if (returns.length === 0) return 0

    const returnsSeries = pandas.Series(returns)
    return empyrical.sortino_ratio(returnsSeries, required_return=riskFreeRate, period='daily')
  }

  /**
   * Calculate maximum drawdown
   */
  calculateMaxDrawdown(equity: number[]): DrawdownAnalysis {
    if (equity.length === 0) {
      return {
        maxDrawdown: 0,
        maxDrawdownStart: 0,
        maxDrawdownEnd: 0,
        avgDrawdown: 0,
        drawdownPeriods: []
      }
    }

    const equitySeries = pandas.Series(equity)
    const maxDD = Math.abs(empyrical.max_drawdown(equitySeries))

    // Find drawdown periods
    const periods: DrawdownPeriod[] = []
    let peak = equity[0]
    let peakIndex = 0
    let inDrawdown = false
    let drawdownStart = 0

    for (let i = 0; i < equity.length; i++) {
      if (equity[i] > peak) {
        // New peak
        if (inDrawdown) {
          // End of drawdown period
          periods.push({
            start: drawdownStart,
            end: i - 1,
            recovery: i,
            depth: (peak - equity[i - 1]) / peak,
            duration: i - drawdownStart,
            recoveryDuration: i - (peakIndex + 1)
          })
          inDrawdown = false
        }
        peak = equity[i]
        peakIndex = i
      } else if (equity[i] < peak && !inDrawdown) {
        // Start of drawdown
        inDrawdown = true
        drawdownStart = i
      }
    }

    // Find max drawdown period
    let maxDrawdownStart = 0
    let maxDrawdownEnd = 0
    let maxDrawdownRecovery = undefined

    const maxPeriod = periods.reduce((max, period) =>
      period.depth > max.depth ? period : max
    , periods[0] || { depth: 0, start: 0, end: 0 })

    if (maxPeriod) {
      maxDrawdownStart = maxPeriod.start
      maxDrawdownEnd = maxPeriod.end
      maxDrawdownRecovery = maxPeriod.recovery
    }

    const avgDrawdown = periods.length > 0
      ? periods.reduce((sum, p) => sum + p.depth, 0) / periods.length
      : 0

    return {
      maxDrawdown: maxDD,
      maxDrawdownStart,
      maxDrawdownEnd,
      maxDrawdownRecovery,
      avgDrawdown,
      drawdownPeriods: periods
    }
  }

  /**
   * Calculate Value at Risk
   */
  calculateVaR(returns: number[], confidence: number = 0.95): number {
    if (returns.length === 0) return 0

    const percentile = (1 - confidence) * 100
    const var_value = numpy.percentile(returns, percentile)

    return Math.abs(var_value)
  }

  /**
   * Calculate Beta
   */
  calculateBeta(returns: number[], benchmarkReturns: number[]): number {
    if (returns.length === 0 || benchmarkReturns.length === 0) return 1.0

    const returnsSeries = pandas.Series(returns)
    const benchSeries = pandas.Series(benchmarkReturns)

    return empyrical.beta(returnsSeries, benchSeries)
  }

  /**
   * Calculate Alpha
   */
  calculateAlpha(
    returns: number[],
    benchmarkReturns: number[],
    riskFreeRate: number = 0.02
  ): number {
    if (returns.length === 0 || benchmarkReturns.length === 0) return 0

    const returnsSeries = pandas.Series(returns)
    const benchSeries = pandas.Series(benchmarkReturns)

    return empyrical.alpha(returnsSeries, benchSeries, risk_free=riskFreeRate)
  }

  /**
   * Calculate Calmar ratio
   */
  calculateCalmar(returns: number[], equity: number[]): number {
    if (returns.length === 0 || equity.length === 0) return 0

    const annualReturn = this.calculateAnnualizedReturn(returns)
    const maxDD = this.calculateMaxDrawdown(equity).maxDrawdown

    return maxDD > 0 ? annualReturn / maxDD : 0
  }

  /**
   * Calculate annualized return
   */
  calculateAnnualizedReturn(returns: number[], periods: number = 252): number {
    if (returns.length === 0) return 0

    const totalReturn = returns.reduce((prod, r) => prod * (1 + r), 1) - 1
    const years = returns.length / periods
    return Math.pow(1 + totalReturn, 1 / years) - 1
  }

  /**
   * Calculate annualized volatility
   */
  calculateAnnualizedVolatility(returns: number[], periods: number = 252): number {
    if (returns.length === 0) return 0

    const returnsSeries = pandas.Series(returns)
    return returnsSeries.std() * Math.sqrt(periods)
  }

  /**
   * Calculate Omega ratio
   */
  calculateOmega(returns: number[], threshold: number = 0): number {
    if (returns.length === 0) return 0

    const gains = returns.filter(r => r > threshold).reduce((sum, r) => sum + (r - threshold), 0)
    const losses = returns.filter(r => r < threshold).reduce((sum, r) => sum + (threshold - r), 0)

    return losses > 0 ? gains / losses : 0
  }

  /**
   * Calculate information ratio
   */
  calculateInformationRatio(returns: number[], benchmarkReturns: number[]): number {
    if (returns.length === 0 || benchmarkReturns.length === 0) return 0

    const activeReturns = returns.map((r, i) => r - (benchmarkReturns[i] || 0))
    const mean = activeReturns.reduce((sum, r) => sum + r, 0) / activeReturns.length
    const std = Math.sqrt(
      activeReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / activeReturns.length
    )

    return std > 0 ? mean / std * Math.sqrt(252) : 0
  }

  /**
   * Calculate Treynor ratio
   */
  calculateTreynor(returns: number[], benchmarkReturns: number[], riskFreeRate: number = 0.02): number {
    if (returns.length === 0 || benchmarkReturns.length === 0) return 0

    const annualReturn = this.calculateAnnualizedReturn(returns)
    const beta = this.calculateBeta(returns, benchmarkReturns)

    return beta > 0 ? (annualReturn - riskFreeRate) / beta : 0
  }

  /**
   * Calculate Ulcer Index
   */
  calculateUlcerIndex(equity: number[]): number {
    if (equity.length === 0) return 0

    const drawdowns: number[] = []
    let peak = equity[0]

    for (let i = 0; i < equity.length; i++) {
      if (equity[i] > peak) peak = equity[i]
      const dd = (equity[i] - peak) / peak * 100 // Percentage
      drawdowns.push(dd * dd) // Squared
    }

    const avgSquaredDD = drawdowns.reduce((sum, dd) => sum + dd, 0) / drawdowns.length
    return Math.sqrt(avgSquaredDD)
  }

  /**
   * Calculate tail ratio
   */
  calculateTailRatio(returns: number[]): number {
    if (returns.length === 0) return 0

    const p95 = numpy.percentile(returns, 95)
    const p5 = numpy.percentile(returns, 5)

    return p5 !== 0 ? Math.abs(p95 / p5) : 0
  }

  /**
   * Calculate value at risk using different methods
   */
  calculateVaRMethods(returns: number[], confidence: number = 0.95): {
    historical: number
    parametric: number
    cornishFisher: number
  } {
    if (returns.length === 0) {
      return { historical: 0, parametric: 0, cornishFisher: 0 }
    }

    const returnsSeries = pandas.Series(returns)

    // Historical VaR
    const historical = this.calculateVaR(returns, confidence)

    // Parametric VaR
    const mean = returnsSeries.mean()
    const std = returnsSeries.std()
    const z = scipy.stats.norm.ppf(1 - confidence)
    const parametric = Math.abs(mean + std * z)

    // Cornish-Fisher VaR
    const skew = returnsSeries.skew()
    const kurt = returnsSeries.kurt()
    const zCF = z +
      (z * z - 1) * skew / 6 +
      (z * z * z - 3 * z) * kurt / 24 -
      (2 * z * z * z - 5 * z) * skew * skew / 36
    const cornishFisher = Math.abs(mean + std * zCF)

    return { historical, parametric, cornishFisher }
  }

  /**
   * Calculate rolling Sharpe ratio
   */
  calculateRollingSharpe(
    returns: number[],
    window: number = 60,
    riskFreeRate: number = 0.02
  ): number[] {
    if (returns.length < window) return []

    const rollingSharpe: number[] = []
    const dailyRiskFree = riskFreeRate / 252

    for (let i = window; i < returns.length; i++) {
      const windowReturns = returns.slice(i - window, i)
      const excessReturns = windowReturns.map(r => r - dailyRiskFree)
      const mean = excessReturns.reduce((sum, r) => sum + r, 0) / window
      const std = Math.sqrt(
        excessReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / window
      )
      const sharpe = std > 0 ? mean / std * Math.sqrt(252) : 0
      rollingSharpe.push(sharpe)
    }

    return rollingSharpe
  }

  /**
   * Calculate rolling volatility
   */
  calculateRollingVolatility(returns: number[], window: number = 60): number[] {
    if (returns.length < window) return []

    const rollingVol: number[] = []

    for (let i = window; i < returns.length; i++) {
      const windowReturns = returns.slice(i - window, i)
      const returnsSeries = pandas.Series(windowReturns)
      const vol = returnsSeries.std() * Math.sqrt(252)
      rollingVol.push(vol)
    }

    return rollingVol
  }

  /**
   * Generate performance tearsheet
   */
  async generateTearsheet(result: BacktestResult): Promise<any> {
    const returns = pandas.Series(result.returns.dailyReturns)
    const positions = null // Would need positions data
    const transactions = null // Would need transaction data

    // Generate tearsheet using pyfolio
    try {
      // Create tearsheet with pyfolio
      const tearsheet = pyfolio.create_simple_tear_sheet(
        returns,
        positions,
        transactions,
        benchmark_rets=null
      )

      return {
        summary: result.metrics,
        returns: result.returns,
        drawdown: result.drawdown,
        rolling: this.calculateRollingMetrics(result.returns.dailyReturns),
        distributions: this.analyzeReturnsDistribution(result.returns.dailyReturns)
      }
    } catch (error) {
      console.error('Error generating tearsheet:', error)
      return null
    }
  }

  /**
   * Calculate rolling metrics
   */
  private calculateRollingMetrics(returns: number[]): any {
    const window = 60

    return {
      window,
      sharpe: this.calculateRollingSharpe(returns, window),
      volatility: this.calculateRollingVolatility(returns, window)
    }
  }

  /**
   * Analyze returns distribution
   */
  private analyzeReturnsDistribution(returns: number[]): any {
    if (returns.length === 0) {
      return {
        mean: 0,
        std: 0,
        skew: 0,
        kurtosis: 0,
        histogram: { bins: [], counts: [] }
      }
    }

    const returnsSeries = pandas.Series(returns)

    // Calculate histogram
    const hist = numpy.histogram(returns, bins=50)

    return {
      mean: returnsSeries.mean(),
      std: returnsSeries.std(),
      skew: returnsSeries.skew(),
      kurtosis: returnsSeries.kurt(),
      histogram: {
        bins: Array.from(hist[1]),
        counts: Array.from(hist[0])
      }
    }
  }

  /**
   * Compare multiple strategies
   */
  compareStrategies(results: BacktestResult[]): {
    comparison: any[]
    rankings: Map<string, number>
  } {
    const comparison = results.map(r => ({
      name: r.config.strategy.name,
      totalReturn: r.metrics.totalReturn,
      sharpeRatio: r.metrics.sharpeRatio,
      maxDrawdown: r.metrics.maxDrawdown,
      winRate: r.metrics.winRate,
      profitFactor: r.metrics.profitFactor
    }))

    // Rank by Sharpe ratio
    const ranked = [...comparison].sort((a, b) => b.sharpeRatio - a.sharpeRatio)
    const rankings = new Map<string, number>()
    ranked.forEach((r, i) => rankings.set(r.name, i + 1))

    return { comparison, rankings }
  }

  /**
   * Calculate win rate
   */
  calculateWinRate(trades: any[]): number {
    if (trades.length === 0) return 0

    const winners = trades.filter(t => (t.pnl || 0) > 0).length
    return winners / trades.length
  }

  /**
   * Calculate profit factor
   */
  calculateProfitFactor(trades: any[]): number {
    const grossProfit = trades
      .filter(t => (t.pnl || 0) > 0)
      .reduce((sum, t) => sum + t.pnl, 0)

    const grossLoss = Math.abs(
      trades
        .filter(t => (t.pnl || 0) < 0)
        .reduce((sum, t) => sum + t.pnl, 0)
    )

    return grossLoss > 0 ? grossProfit / grossLoss : 0
  }

  /**
   * Calculate expectancy
   */
  calculateExpectancy(trades: any[]): number {
    if (trades.length === 0) return 0

    const avgWin = trades
      .filter(t => (t.pnl || 0) > 0)
      .reduce((sum, t) => sum + t.pnl, 0) /
      trades.filter(t => (t.pnl || 0) > 0).length || 0

    const avgLoss = trades
      .filter(t => (t.pnl || 0) < 0)
      .reduce((sum, t) => sum + t.pnl, 0) /
      trades.filter(t => (t.pnl || 0) < 0).length || 0

    const winRate = this.calculateWinRate(trades)

    return winRate * avgWin + (1 - winRate) * avgLoss
  }

  /**
   * Generate monthly returns table
   */
  generateMonthlyReturns(returns: number[], timestamps: number[]): Map<string, number> {
    const monthlyReturns = new Map<string, number>()

    if (returns.length === 0 || timestamps.length === 0) return monthlyReturns

    const returnsByMonth = new Map<string, number[]>()

    for (let i = 0; i < returns.length; i++) {
      const date = new Date(timestamps[i])
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!returnsByMonth.has(key)) {
        returnsByMonth.set(key, [])
      }
      returnsByMonth.get(key)!.push(returns[i])
    }

    for (const [month, rets] of returnsByMonth.entries()) {
      const monthReturn = rets.reduce((prod, r) => prod * (1 + r), 1) - 1
      monthlyReturns.set(month, monthReturn)
    }

    return monthlyReturns
  }

  /**
   * Calculate risk-adjusted returns
   */
  calculateRiskAdjustedReturns(returns: number[], riskFreeRate: number = 0.02): {
    sharpe: number
    sortino: number
    calmar: number
    omega: number
  } {
    const sharpe = this.calculateSharpe(returns, riskFreeRate)
    const sortino = this.calculateSortino(returns, riskFreeRate)
    const equity = returns.reduce((acc, r, i) => {
      acc.push((acc[i - 1] || 1) * (1 + r))
      return acc
    }, [] as number[])
    const calmar = this.calculateCalmar(returns, equity)
    const omega = this.calculateOmega(returns, 0)

    return { sharpe, sortino, calmar, omega }
  }
}
