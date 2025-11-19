/**
 * Options Trading Strategies - Comprehensive examples
 *
 * Demonstrates options strategies using Black-Scholes,
 * Greeks calculation, and various option strategies.
 */

// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import scipy from 'python:scipy'

/**
 * Black-Scholes Option Pricing Model
 */
export class BlackScholesModel {
  /**
   * Calculate option price using Black-Scholes formula
   */
  calculateOptionPrice(params: {
    spotPrice: number
    strikePrice: number
    timeToExpiry: number  // years
    riskFreeRate: number
    volatility: number
    optionType: 'call' | 'put'
  }): number {
    const { spotPrice: S, strikePrice: K, timeToExpiry: T, riskFreeRate: r, volatility: sigma } = params

    const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T))
    const d2 = d1 - sigma * Math.sqrt(T)

    const norm = scipy.stats.norm

    if (params.optionType === 'call') {
      return S * norm.cdf(d1) - K * Math.exp(-r * T) * norm.cdf(d2)
    } else {
      return K * Math.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
    }
  }

  /**
   * Calculate option Greeks
   */
  calculateGreeks(params: {
    spotPrice: number
    strikePrice: number
    timeToExpiry: number
    riskFreeRate: number
    volatility: number
    optionType: 'call' | 'put'
  }): Greeks {
    const { spotPrice: S, strikePrice: K, timeToExpiry: T, riskFreeRate: r, volatility: sigma } = params

    const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T))
    const d2 = d1 - sigma * Math.sqrt(T)

    const norm = scipy.stats.norm

    // Delta
    const delta = params.optionType === 'call'
      ? norm.cdf(d1)
      : norm.cdf(d1) - 1

    // Gamma
    const gamma = norm.pdf(d1) / (S * sigma * Math.sqrt(T))

    // Vega
    const vega = S * norm.pdf(d1) * Math.sqrt(T) / 100

    // Theta
    const theta1 = -(S * norm.pdf(d1) * sigma) / (2 * Math.sqrt(T))
    const theta = params.optionType === 'call'
      ? (theta1 - r * K * Math.exp(-r * T) * norm.cdf(d2)) / 365
      : (theta1 + r * K * Math.exp(-r * T) * norm.cdf(-d2)) / 365

    // Rho
    const rho = params.optionType === 'call'
      ? K * T * Math.exp(-r * T) * norm.cdf(d2) / 100
      : -K * T * Math.exp(-r * T) * norm.cdf(-d2) / 100

    return { delta, gamma, vega, theta, rho }
  }

  /**
   * Calculate implied volatility using Newton-Raphson
   */
  calculateImpliedVolatility(params: {
    optionPrice: number
    spotPrice: number
    strikePrice: number
    timeToExpiry: number
    riskFreeRate: number
    optionType: 'call' | 'put'
  }): number {
    const maxIterations = 100
    const tolerance = 0.0001

    let volatility = 0.3 // Initial guess

    for (let i = 0; i < maxIterations; i++) {
      const price = this.calculateOptionPrice({ ...params, volatility })
      const vega = this.calculateGreeks({ ...params, volatility }).vega * 100

      const diff = price - params.optionPrice

      if (Math.abs(diff) < tolerance) {
        return volatility
      }

      volatility = volatility - diff / vega
    }

    return volatility
  }
}

/**
 * Covered Call Strategy
 */
export class CoveredCallStrategy {
  private bs = new BlackScholesModel()

  /**
   * Evaluate covered call opportunity
   */
  evaluate(params: {
    stockPrice: number
    stockPosition: number
    strikePrice: number
    premium: number
    daysToExpiry: number
    targetReturn: number
  }): CoveredCallAnalysis {
    const maxGain = (params.strikePrice - params.stockPrice) * params.stockPosition + params.premium
    const maxLoss = (params.stockPrice * params.stockPosition) - params.premium

    const returnIfCalled = maxGain / (params.stockPrice * params.stockPosition)
    const returnIfNotCalled = params.premium / (params.stockPrice * params.stockPosition)

    const breakeven = params.stockPrice - (params.premium / params.stockPosition)

    return {
      maxGain,
      maxLoss,
      returnIfCalled,
      returnIfNotCalled,
      breakeven,
      annualizedReturn: returnIfCalled * (365 / params.daysToExpiry),
      recommended: returnIfCalled >= params.targetReturn
    }
  }

  /**
   * Find optimal strike price
   */
  findOptimalStrike(params: {
    stockPrice: number
    volatility: number
    riskFreeRate: number
    daysToExpiry: number
    targetReturn: number
  }): number {
    const strikes = []
    const returns = []

    // Test strikes from 95% to 105% of stock price
    for (let strike = params.stockPrice * 0.95; strike <= params.stockPrice * 1.05; strike += params.stockPrice * 0.01) {
      const premium = this.bs.calculateOptionPrice({
        spotPrice: params.stockPrice,
        strikePrice: strike,
        timeToExpiry: params.daysToExpiry / 365,
        riskFreeRate: params.riskFreeRate,
        volatility: params.volatility,
        optionType: 'call'
      })

      const totalReturn = (strike - params.stockPrice + premium) / params.stockPrice

      strikes.push(strike)
      returns.push(totalReturn)
    }

    // Find strike with return closest to target
    const differences = returns.map(r => Math.abs(r - params.targetReturn))
    const minIndex = differences.indexOf(Math.min(...differences))

    return strikes[minIndex]
  }
}

/**
 * Iron Condor Strategy
 */
export class IronCondorStrategy {
  private bs = new BlackScholesModel()

  /**
   * Evaluate iron condor setup
   */
  evaluate(params: {
    stockPrice: number
    putLongStrike: number
    putShortStrike: number
    callShortStrike: number
    callLongStrike: number
    putLongPremium: number
    putShortPremium: number
    callShortPremium: number
    callLongPremium: number
    daysToExpiry: number
  }): IronCondorAnalysis {
    const netCredit =
      params.putShortPremium +
      params.callShortPremium -
      params.putLongPremium -
      params.callLongPremium

    const maxGain = netCredit
    const maxLoss = (params.putShortStrike - params.putLongStrike) - netCredit

    const upperBreakeven = params.callShortStrike + netCredit
    const lowerBreakeven = params.putShortStrike - netCredit

    const probabilityOfProfit = this.calculateProbabilityOfProfit(params)

    const returnOnRisk = maxGain / maxLoss

    return {
      netCredit,
      maxGain,
      maxLoss,
      upperBreakeven,
      lowerBreakeven,
      probabilityOfProfit,
      returnOnRisk,
      recommended: returnOnRisk >= 0.2 && probabilityOfProfit >= 0.6
    }
  }

  private calculateProbabilityOfProfit(params: any): number {
    // Simplified probability calculation
    // In production, use more sophisticated models

    const stockPrice = params.stockPrice
    const lowerBreakeven = params.putShortStrike - params.netCredit
    const upperBreakeven = params.callShortStrike + params.netCredit

    // Assume normal distribution
    const range = upperBreakeven - lowerBreakeven
    const distanceFromMean = stockPrice - (upperBreakeven + lowerBreakeven) / 2

    // Mock probability
    return 0.65
  }
}

/**
 * Butterfly Spread Strategy
 */
export class ButterflySpreadStrategy {
  private bs = new BlackScholesModel()

  /**
   * Evaluate butterfly spread
   */
  evaluate(params: {
    stockPrice: number
    lowerStrike: number
    middleStrike: number
    upperStrike: number
    lowerPremium: number
    middlePremium: number
    upperPremium: number
    optionType: 'call' | 'put'
    contracts: number
  }): ButterflyAnalysis {
    const netDebit = params.lowerPremium + params.upperPremium - 2 * params.middlePremium

    const maxGain = (params.middleStrike - params.lowerStrike) - netDebit
    const maxLoss = netDebit

    const lowerBreakeven = params.lowerStrike + netDebit
    const upperBreakeven = params.upperStrike - netDebit

    const optimalProfit = params.stockPrice === params.middleStrike

    return {
      netDebit,
      maxGain,
      maxLoss,
      lowerBreakeven,
      upperBreakeven,
      riskRewardRatio: maxGain / maxLoss,
      optimalProfit,
      totalCost: netDebit * params.contracts * 100
    }
  }
}

/**
 * Straddle/Strangle Strategy
 */
export class StraddleStrategy {
  private bs = new BlackScholesModel()

  /**
   * Evaluate long straddle
   */
  evaluateStraddle(params: {
    stockPrice: number
    strikePrice: number
    callPremium: number
    putPremium: number
    volatility: number
    daysToExpiry: number
  }): StraddleAnalysis {
    const totalCost = params.callPremium + params.putPremium

    const upperBreakeven = params.strikePrice + totalCost
    const lowerBreakeven = params.strikePrice - totalCost

    // Expected move based on volatility
    const expectedMove = params.stockPrice * params.volatility * Math.sqrt(params.daysToExpiry / 365)

    const profitableIfMove = expectedMove > totalCost

    return {
      totalCost,
      upperBreakeven,
      lowerBreakeven,
      expectedMove,
      profitableIfMove,
      impliedVolatility: params.volatility,
      breakevenMove: (totalCost / params.stockPrice) * 100
    }
  }

  /**
   * Evaluate long strangle
   */
  evaluateStrangle(params: {
    stockPrice: number
    putStrike: number
    callStrike: number
    putPremium: number
    callPremium: number
    volatility: number
    daysToExpiry: number
  }): StrangleAnalysis {
    const totalCost = params.putPremium + params.callPremium

    const upperBreakeven = params.callStrike + totalCost
    const lowerBreakeven = params.putStrike - totalCost

    const expectedMove = params.stockPrice * params.volatility * Math.sqrt(params.daysToExpiry / 365)

    return {
      totalCost,
      upperBreakeven,
      lowerBreakeven,
      expectedMove,
      cheaper_than_straddle: true,
      breakevenMove: Math.max(
        (params.callStrike + totalCost - params.stockPrice) / params.stockPrice,
        (params.stockPrice - (params.putStrike - totalCost)) / params.stockPrice
      ) * 100
    }
  }
}

/**
 * Calendar Spread Strategy
 */
export class CalendarSpreadStrategy {
  private bs = new BlackScholesModel()

  /**
   * Evaluate calendar spread
   */
  evaluate(params: {
    stockPrice: number
    strikePrice: number
    nearTermPremium: number
    farTermPremium: number
    nearTermDays: number
    farTermDays: number
    volatility: number
  }): CalendarSpreadAnalysis {
    const netDebit = params.farTermPremium - params.nearTermPremium

    // Max gain occurs when stock = strike at near-term expiry
    const estimatedMaxGain = netDebit * 0.3 // Simplified estimate

    const maxLoss = netDebit

    const profitable = params.stockPrice >= params.strikePrice * 0.98 &&
                      params.stockPrice <= params.strikePrice * 1.02

    return {
      netDebit,
      estimatedMaxGain,
      maxLoss,
      profitable,
      theta_advantage: true,
      vega_positive: true
    }
  }
}

/**
 * Options Portfolio Manager
 */
export class OptionsPortfolioManager {
  private positions: Map<string, OptionPosition> = new Map()
  private bs = new BlackScholesModel()

  /**
   * Add option position
   */
  addPosition(position: OptionPosition): void {
    this.positions.set(position.id, position)
  }

  /**
   * Calculate portfolio Greeks
   */
  calculatePortfolioGreeks(params: {
    stockPrice: number
    volatility: number
    riskFreeRate: number
  }): PortfolioGreeks {
    let totalDelta = 0
    let totalGamma = 0
    let totalVega = 0
    let totalTheta = 0
    let totalRho = 0

    for (const position of this.positions.values()) {
      const greeks = this.bs.calculateGreeks({
        spotPrice: params.stockPrice,
        strikePrice: position.strikePrice,
        timeToExpiry: position.daysToExpiry / 365,
        riskFreeRate: params.riskFreeRate,
        volatility: params.volatility,
        optionType: position.optionType
      })

      const multiplier = position.contracts * position.side

      totalDelta += greeks.delta * multiplier
      totalGamma += greeks.gamma * multiplier
      totalVega += greeks.vega * multiplier
      totalTheta += greeks.theta * multiplier
      totalRho += greeks.rho * multiplier
    }

    return {
      delta: totalDelta,
      gamma: totalGamma,
      vega: totalVega,
      theta: totalTheta,
      rho: totalRho
    }
  }

  /**
   * Calculate portfolio P&L
   */
  calculatePnL(params: {
    stockPrice: number
    volatility: number
    riskFreeRate: number
  }): number {
    let totalPnL = 0

    for (const position of this.positions.values()) {
      const currentPrice = this.bs.calculateOptionPrice({
        spotPrice: params.stockPrice,
        strikePrice: position.strikePrice,
        timeToExpiry: position.daysToExpiry / 365,
        riskFreeRate: params.riskFreeRate,
        volatility: params.volatility,
        optionType: position.optionType
      })

      const positionPnL = (currentPrice - position.entryPrice) *
                         position.contracts *
                         position.side *
                         100

      totalPnL += positionPnL
    }

    return totalPnL
  }

  /**
   * Analyze risk scenarios
   */
  analyzeScenarios(scenarios: PriceScenario[]): ScenarioAnalysis[] {
    return scenarios.map(scenario => {
      const pnl = this.calculatePnL({
        stockPrice: scenario.price,
        volatility: scenario.volatility,
        riskFreeRate: scenario.riskFreeRate
      })

      const greeks = this.calculatePortfolioGreeks({
        stockPrice: scenario.price,
        volatility: scenario.volatility,
        riskFreeRate: scenario.riskFreeRate
      })

      return {
        scenario: scenario.name,
        price: scenario.price,
        pnl,
        greeks
      }
    })
  }
}

/**
 * Volatility Surface Builder
 */
export class VolatilitySurface {
  private impliedVols: Map<string, number> = new Map()

  /**
   * Add implied volatility point
   */
  addPoint(strike: number, expiry: number, iv: number): void {
    const key = `${strike}-${expiry}`
    this.impliedVols.set(key, iv)
  }

  /**
   * Interpolate IV for given strike and expiry
   */
  interpolate(strike: number, expiry: number): number {
    // Simplified interpolation
    // In production, use SABR or other volatility models

    const nearestKey = this.findNearestPoint(strike, expiry)
    return this.impliedVols.get(nearestKey) || 0.25
  }

  /**
   * Calculate volatility skew
   */
  calculateSkew(expiry: number): number {
    // ATM vs OTM volatility difference
    return 0.05 // Mock skew
  }

  /**
   * Calculate volatility smile
   */
  calculateSmile(expiry: number): Array<{ strike: number; iv: number }> {
    // Generate smile curve
    const atmStrike = 100
    const smile = []

    for (let moneyness = 0.8; moneyness <= 1.2; moneyness += 0.05) {
      const strike = atmStrike * moneyness
      const iv = this.interpolate(strike, expiry)
      smile.push({ strike, iv })
    }

    return smile
  }

  private findNearestPoint(strike: number, expiry: number): string {
    // Find nearest point in surface
    return Array.from(this.impliedVols.keys())[0] || '100-30'
  }
}

// Type definitions
interface Greeks {
  delta: number
  gamma: number
  vega: number
  theta: number
  rho: number
}

interface CoveredCallAnalysis {
  maxGain: number
  maxLoss: number
  returnIfCalled: number
  returnIfNotCalled: number
  breakeven: number
  annualizedReturn: number
  recommended: boolean
}

interface IronCondorAnalysis {
  netCredit: number
  maxGain: number
  maxLoss: number
  upperBreakeven: number
  lowerBreakeven: number
  probabilityOfProfit: number
  returnOnRisk: number
  recommended: boolean
}

interface ButterflyAnalysis {
  netDebit: number
  maxGain: number
  maxLoss: number
  lowerBreakeven: number
  upperBreakeven: number
  riskRewardRatio: number
  optimalProfit: boolean
  totalCost: number
}

interface StraddleAnalysis {
  totalCost: number
  upperBreakeven: number
  lowerBreakeven: number
  expectedMove: number
  profitableIfMove: boolean
  impliedVolatility: number
  breakevenMove: number
}

interface StrangleAnalysis {
  totalCost: number
  upperBreakeven: number
  lowerBreakeven: number
  expectedMove: number
  cheaper_than_straddle: boolean
  breakevenMove: number
}

interface CalendarSpreadAnalysis {
  netDebit: number
  estimatedMaxGain: number
  maxLoss: number
  profitable: boolean
  theta_advantage: boolean
  vega_positive: boolean
}

interface OptionPosition {
  id: string
  symbol: string
  optionType: 'call' | 'put'
  strikePrice: number
  daysToExpiry: number
  contracts: number
  side: number  // 1 for long, -1 for short
  entryPrice: number
}

interface PortfolioGreeks {
  delta: number
  gamma: number
  vega: number
  theta: number
  rho: number
}

interface PriceScenario {
  name: string
  price: number
  volatility: number
  riskFreeRate: number
}

interface ScenarioAnalysis {
  scenario: string
  price: number
  pnl: number
  greeks: PortfolioGreeks
}

// Export all classes
export const OPTIONS_TOOLS = {
  BlackScholesModel,
  CoveredCallStrategy,
  IronCondorStrategy,
  ButterflySpreadStrategy,
  StraddleStrategy,
  CalendarSpreadStrategy,
  OptionsPortfolioManager,
  VolatilitySurface
}
