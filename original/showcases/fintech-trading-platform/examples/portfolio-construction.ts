/**
 * Portfolio Construction - Advanced portfolio building and optimization
 *
 * Demonstrates modern portfolio theory, factor models, and risk parity.
 * Uses Python optimization libraries for efficient frontier and allocation.
 */

// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import scipy from 'python:scipy'
// @ts-ignore
import sklearn from 'python:sklearn'

/**
 * Modern Portfolio Theory Optimizer
 */
export class MPTOptimizer {
  /**
   * Calculate efficient frontier
   */
  async calculateEfficientFrontier(params: {
    assets: string[]
    returns: number[]
    covarianceMatrix: number[][]
    numPoints?: number
    riskFreeRate?: number
  }): Promise<EfficientFrontier> {
    const numPoints = params.numPoints || 100
    const riskFreeRate = params.riskFreeRate || 0.02

    const minReturn = Math.min(...params.returns)
    const maxReturn = Math.max(...params.returns)

    const targetReturns = numpy.linspace(minReturn, maxReturn, numPoints)

    const portfolios: Portfolio[] = []

    for (const targetReturn of targetReturns) {
      try {
        const portfolio = await this.optimizeForReturn({
          assets: params.assets,
          returns: params.returns,
          covarianceMatrix: params.covarianceMatrix,
          targetReturn,
          riskFreeRate
        })

        portfolios.push(portfolio)
      } catch (error) {
        // Skip infeasible points
        continue
      }
    }

    // Find tangency portfolio (max Sharpe ratio)
    const tangencyPortfolio = portfolios.reduce((max, p) =>
      p.sharpeRatio > max.sharpeRatio ? p : max
    )

    // Find minimum variance portfolio
    const minVariancePortfolio = portfolios.reduce((min, p) =>
      p.volatility < min.volatility ? p : min
    )

    return {
      portfolios,
      tangencyPortfolio,
      minVariancePortfolio,
      assets: params.assets
    }
  }

  /**
   * Optimize portfolio for target return
   */
  private async optimizeForReturn(params: {
    assets: string[]
    returns: number[]
    covarianceMatrix: number[][]
    targetReturn: number
    riskFreeRate: number
  }): Promise<Portfolio> {
    const n = params.assets.length

    // Objective: minimize variance
    const objective = (weights: number[]) => {
      const cov = numpy.array(params.covarianceMatrix)
      const w = numpy.array(weights)
      return numpy.dot(numpy.dot(w, cov), w)
    }

    // Constraints
    const constraints = [
      {
        type: 'eq',
        fun: (w: number[]) => numpy.sum(w) - 1
      },
      {
        type: 'eq',
        fun: (w: number[]) => numpy.dot(w, params.returns) - params.targetReturn
      }
    ]

    // Bounds: 0 <= weight <= 1 (long-only)
    const bounds = Array(n).fill([0, 1])

    // Initial guess
    const initialWeights = Array(n).fill(1 / n)

    // Optimize
    const result = scipy.optimize.minimize(
      objective,
      initialWeights,
      {
        method: 'SLSQP',
        bounds: bounds,
        constraints: constraints
      }
    )

    const weights = result.x
    const expectedReturn = numpy.dot(weights, params.returns)
    const variance = objective(weights)
    const volatility = Math.sqrt(variance)
    const sharpeRatio = (expectedReturn - params.riskFreeRate) / volatility

    return {
      weights: Object.fromEntries(
        params.assets.map((asset, i) => [asset, weights[i]])
      ),
      expectedReturn,
      volatility,
      sharpeRatio,
      variance
    }
  }

  /**
   * Maximum Sharpe ratio portfolio
   */
  async maximizeSharpe(params: {
    assets: string[]
    returns: number[]
    covarianceMatrix: number[][]
    riskFreeRate?: number
    constraints?: PortfolioConstraints
  }): Promise<Portfolio> {
    const riskFreeRate = params.riskFreeRate || 0.02
    const n = params.assets.length

    // Objective: maximize Sharpe ratio (minimize negative Sharpe)
    const objective = (weights: number[]) => {
      const ret = numpy.dot(weights, params.returns)
      const cov = numpy.array(params.covarianceMatrix)
      const w = numpy.array(weights)
      const vol = Math.sqrt(numpy.dot(numpy.dot(w, cov), w))
      return -(ret - riskFreeRate) / vol
    }

    // Constraints
    const constraints = [
      {
        type: 'eq',
        fun: (w: number[]) => numpy.sum(w) - 1
      }
    ]

    // Add custom constraints if provided
    if (params.constraints) {
      if (params.constraints.minWeight !== undefined) {
        constraints.push({
          type: 'ineq',
          fun: (w: number[]) => numpy.min(w) - params.constraints!.minWeight!
        })
      }
    }

    // Bounds
    const minWeight = params.constraints?.minWeight || 0
    const maxWeight = params.constraints?.maxWeight || 1
    const bounds = Array(n).fill([minWeight, maxWeight])

    // Optimize
    const initialWeights = Array(n).fill(1 / n)
    const result = scipy.optimize.minimize(
      objective,
      initialWeights,
      {
        method: 'SLSQP',
        bounds: bounds,
        constraints: constraints
      }
    )

    const weights = result.x
    const expectedReturn = numpy.dot(weights, params.returns)
    const cov = numpy.array(params.covarianceMatrix)
    const w = numpy.array(weights)
    const volatility = Math.sqrt(numpy.dot(numpy.dot(w, cov), w))
    const sharpeRatio = (expectedReturn - riskFreeRate) / volatility

    return {
      weights: Object.fromEntries(
        params.assets.map((asset, i) => [asset, weights[i]])
      ),
      expectedReturn,
      volatility,
      sharpeRatio,
      variance: volatility * volatility
    }
  }

  /**
   * Minimum variance portfolio
   */
  async minimizeVariance(params: {
    assets: string[]
    covarianceMatrix: number[][]
    constraints?: PortfolioConstraints
  }): Promise<Portfolio> {
    const n = params.assets.length

    // Objective: minimize variance
    const objective = (weights: number[]) => {
      const cov = numpy.array(params.covarianceMatrix)
      const w = numpy.array(weights)
      return numpy.dot(numpy.dot(w, cov), w)
    }

    // Constraint: weights sum to 1
    const constraints = [
      {
        type: 'eq',
        fun: (w: number[]) => numpy.sum(w) - 1
      }
    ]

    // Bounds
    const minWeight = params.constraints?.minWeight || 0
    const maxWeight = params.constraints?.maxWeight || 1
    const bounds = Array(n).fill([minWeight, maxWeight])

    // Optimize
    const initialWeights = Array(n).fill(1 / n)
    const result = scipy.optimize.minimize(
      objective,
      initialWeights,
      {
        method: 'SLSQP',
        bounds: bounds,
        constraints: constraints
      }
    )

    const weights = result.x
    const volatility = Math.sqrt(objective(weights))

    return {
      weights: Object.fromEntries(
        params.assets.map((asset, i) => [asset, weights[i]])
      ),
      expectedReturn: 0, // Not optimized for return
      volatility,
      sharpeRatio: 0,
      variance: volatility * volatility
    }
  }
}

/**
 * Risk Parity Portfolio
 */
export class RiskParityOptimizer {
  /**
   * Build equal risk contribution portfolio
   */
  async optimize(params: {
    assets: string[]
    covarianceMatrix: number[][]
    targetRisk?: number
  }): Promise<Portfolio> {
    const n = params.assets.length
    const targetRiskContrib = 1 / n

    // Objective: minimize deviation from equal risk contribution
    const objective = (weights: number[]) => {
      const cov = numpy.array(params.covarianceMatrix)
      const w = numpy.array(weights)

      // Portfolio variance
      const portfolioVar = numpy.dot(numpy.dot(w, cov), w)
      const portfolioVol = Math.sqrt(portfolioVar)

      // Risk contributions
      const marginalContrib = numpy.dot(cov, w)
      const riskContrib = numpy.multiply(w, marginalContrib) / portfolioVol

      // Squared deviations from target
      const deviations = riskContrib.map((rc: number) =>
        Math.pow(rc - targetRiskContrib, 2)
      )

      return numpy.sum(deviations)
    }

    // Constraints
    const constraints = [
      {
        type: 'eq',
        fun: (w: number[]) => numpy.sum(w) - 1
      }
    ]

    // Bounds: positive weights only
    const bounds = Array(n).fill([0.001, 1])

    // Initial guess: equal weights
    const initialWeights = Array(n).fill(1 / n)

    // Optimize
    const result = scipy.optimize.minimize(
      objective,
      initialWeights,
      {
        method: 'SLSQP',
        bounds: bounds,
        constraints: constraints,
        options: { maxiter: 1000 }
      }
    )

    const weights = result.x
    const cov = numpy.array(params.covarianceMatrix)
    const w = numpy.array(weights)
    const volatility = Math.sqrt(numpy.dot(numpy.dot(w, cov), w))

    // Calculate risk contributions
    const marginalContrib = numpy.dot(cov, w)
    const riskContributions = numpy.multiply(weights, marginalContrib) / volatility

    return {
      weights: Object.fromEntries(
        params.assets.map((asset, i) => [asset, weights[i]])
      ),
      expectedReturn: 0,
      volatility,
      sharpeRatio: 0,
      variance: volatility * volatility,
      riskContributions: Object.fromEntries(
        params.assets.map((asset, i) => [asset, riskContributions[i]])
      )
    }
  }
}

/**
 * Black-Litterman Model
 */
export class BlackLittermanOptimizer {
  /**
   * Combine market equilibrium with investor views
   */
  async optimize(params: {
    assets: string[]
    marketCaps: number[]
    covarianceMatrix: number[][]
    views: View[]
    tau?: number
    riskAversion?: number
  }): Promise<Portfolio> {
    const tau = params.tau || 0.05
    const delta = params.riskAversion || 2.5

    // Market equilibrium weights
    const totalMarketCap = params.marketCaps.reduce((a, b) => a + b, 0)
    const marketWeights = params.marketCaps.map(cap => cap / totalMarketCap)

    // Market-implied equilibrium returns
    const cov = numpy.array(params.covarianceMatrix)
    const w = numpy.array(marketWeights)
    const piReturns = numpy.dot(cov, w).mul(delta)

    // Process views
    const { P, Q, omega } = this.processViews(params.views, params.assets.length)

    // Black-Litterman formula
    // Posterior expected returns = [(tau * Sigma)^-1 + P' * Omega^-1 * P]^-1 *
    //                             [(tau * Sigma)^-1 * Pi + P' * Omega^-1 * Q]

    const tauCov = cov.mul(tau)
    const tauCovInv = numpy.linalg.inv(tauCov)

    const omegaInv = numpy.linalg.inv(omega)

    const part1 = numpy.linalg.inv(
      numpy.add(
        tauCovInv,
        numpy.dot(numpy.dot(P.T, omegaInv), P)
      )
    )

    const part2 = numpy.add(
      numpy.dot(tauCovInv, piReturns),
      numpy.dot(numpy.dot(P.T, omegaInv), Q)
    )

    const posteriorReturns = numpy.dot(part1, part2)

    // Optimize using posterior returns
    const mpt = new MPTOptimizer()
    const portfolio = await mpt.maximizeSharpe({
      assets: params.assets,
      returns: Array.from(posteriorReturns),
      covarianceMatrix: params.covarianceMatrix
    })

    return {
      ...portfolio,
      posteriorReturns: Object.fromEntries(
        params.assets.map((asset, i) => [asset, posteriorReturns[i]])
      )
    }
  }

  private processViews(views: View[], numAssets: number): {
    P: any
    Q: any
    omega: any
  } {
    const numViews = views.length

    // P matrix: view pick matrix
    const P = numpy.zeros([numViews, numAssets])
    for (let i = 0; i < numViews; i++) {
      for (const [assetIndex, weight] of Object.entries(views[i].assets)) {
        P[i][parseInt(assetIndex)] = weight
      }
    }

    // Q vector: view returns
    const Q = numpy.array(views.map(v => v.expectedReturn))

    // Omega matrix: view uncertainty (diagonal)
    const omega = numpy.diag(views.map(v => v.confidence))

    return { P, Q, omega }
  }
}

/**
 * Hierarchical Risk Parity
 */
export class HierarchicalRiskParity {
  /**
   * Build HRP portfolio using machine learning clustering
   */
  async optimize(params: {
    assets: string[]
    returns: number[][]
    method?: 'single' | 'complete' | 'average'
  }): Promise<Portfolio> {
    const method = params.method || 'single'

    // Calculate correlation matrix
    const returnsDF = pandas.DataFrame(params.returns, {
      columns: params.assets
    })
    const corrMatrix = returnsDF.corr()

    // Calculate distance matrix
    const distMatrix = numpy.sqrt(0.5 * (1 - corrMatrix))

    // Hierarchical clustering
    const linkageMatrix = scipy.cluster.hierarchy.linkage(
      distMatrix,
      method=method
    )

    // Get quasi-diagonalization order
    const order = scipy.cluster.hierarchy.leaves_list(linkageMatrix)

    // Calculate covariance matrix
    const covMatrix = returnsDF.cov()

    // Recursive bisection
    const weights = this.recursiveBisection(
      order,
      covMatrix.values,
      params.assets.length
    )

    // Reorder weights according to original asset order
    const orderedWeights = new Array(params.assets.length)
    for (let i = 0; i < order.length; i++) {
      orderedWeights[order[i]] = weights[i]
    }

    const cov = numpy.array(covMatrix.values)
    const w = numpy.array(orderedWeights)
    const volatility = Math.sqrt(numpy.dot(numpy.dot(w, cov), w))

    return {
      weights: Object.fromEntries(
        params.assets.map((asset, i) => [asset, orderedWeights[i]])
      ),
      expectedReturn: 0,
      volatility,
      sharpeRatio: 0,
      variance: volatility * volatility
    }
  }

  private recursiveBisection(
    sortedIndices: number[],
    cov: number[][],
    n: number
  ): number[] {
    const weights = new Array(n).fill(0)

    this.bisect(sortedIndices, cov, weights, 1.0)

    return weights
  }

  private bisect(
    indices: number[],
    cov: number[][],
    weights: number[],
    weight: number
  ): void {
    if (indices.length === 1) {
      weights[indices[0]] = weight
      return
    }

    // Split into two clusters
    const mid = Math.floor(indices.length / 2)
    const left = indices.slice(0, mid)
    const right = indices.slice(mid)

    // Calculate cluster variances
    const leftVar = this.clusterVariance(left, cov)
    const rightVar = this.clusterVariance(right, cov)

    // Allocate weight inversely proportional to variance
    const totalInvVar = 1 / leftVar + 1 / rightVar
    const leftWeight = (1 / leftVar) / totalInvVar
    const rightWeight = (1 / rightVar) / totalInvVar

    // Recursively bisect
    this.bisect(left, cov, weights, weight * leftWeight)
    this.bisect(right, cov, weights, weight * rightWeight)
  }

  private clusterVariance(indices: number[], cov: number[][]): number {
    const n = indices.length
    const equalWeights = 1 / n

    let variance = 0
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        variance += equalWeights * equalWeights * cov[indices[i]][indices[j]]
      }
    }

    return variance
  }
}

/**
 * Factor-Based Portfolio Construction
 */
export class FactorPortfolioBuilder {
  /**
   * Build portfolio based on factor exposures
   */
  async optimize(params: {
    assets: string[]
    factorExposures: number[][]  // assets x factors
    factorReturns: number[]
    targetExposures?: number[]
    constraints?: PortfolioConstraints
  }): Promise<Portfolio> {
    const numAssets = params.assets.length
    const numFactors = params.factorReturns.length

    // Objective: maximize factor-based returns
    const objective = (weights: number[]) => {
      const exposure = numpy.dot(
        numpy.array(params.factorExposures).T,
        numpy.array(weights)
      )
      const returns = numpy.dot(exposure, params.factorReturns)
      return -returns  // Minimize negative returns
    }

    // Constraints
    const constraints = [
      {
        type: 'eq',
        fun: (w: number[]) => numpy.sum(w) - 1
      }
    ]

    // Target factor exposures (if specified)
    if (params.targetExposures) {
      for (let f = 0; f < numFactors; f++) {
        constraints.push({
          type: 'eq',
          fun: (w: number[]) => {
            const exposure = numpy.dot(
              numpy.array(params.factorExposures).T[f],
              numpy.array(w)
            )
            return exposure - params.targetExposures![f]
          }
        })
      }
    }

    // Bounds
    const minWeight = params.constraints?.minWeight || 0
    const maxWeight = params.constraints?.maxWeight || 1
    const bounds = Array(numAssets).fill([minWeight, maxWeight])

    // Optimize
    const initialWeights = Array(numAssets).fill(1 / numAssets)
    const result = scipy.optimize.minimize(
      objective,
      initialWeights,
      {
        method: 'SLSQP',
        bounds: bounds,
        constraints: constraints
      }
    )

    const weights = result.x

    // Calculate portfolio factor exposures
    const portfolioExposures = numpy.dot(
      numpy.array(params.factorExposures).T,
      numpy.array(weights)
    )

    return {
      weights: Object.fromEntries(
        params.assets.map((asset, i) => [asset, weights[i]])
      ),
      expectedReturn: -result.fun,
      volatility: 0,
      sharpeRatio: 0,
      variance: 0,
      factorExposures: Object.fromEntries(
        Array.from({ length: numFactors }, (_, i) => [`factor_${i}`, portfolioExposures[i]])
      )
    }
  }

  /**
   * Build factor-neutral portfolio
   */
  async buildFactorNeutral(params: {
    assets: string[]
    factorExposures: number[][]
    expectedReturns: number[]
    constraints?: PortfolioConstraints
  }): Promise<Portfolio> {
    const numAssets = params.assets.length
    const numFactors = params.factorExposures[0].length

    // Objective: maximize expected returns
    const objective = (weights: number[]) => {
      return -numpy.dot(weights, params.expectedReturns)
    }

    // Constraints
    const constraints = [
      {
        type: 'eq',
        fun: (w: number[]) => numpy.sum(w) - 1
      }
    ]

    // Factor neutrality constraints
    for (let f = 0; f < numFactors; f++) {
      constraints.push({
        type: 'eq',
        fun: (w: number[]) => {
          const factorColumn = params.factorExposures.map(exposures => exposures[f])
          return numpy.dot(w, factorColumn)
        }
      })
    }

    // Bounds
    const minWeight = params.constraints?.minWeight || -0.5  // Allow shorting
    const maxWeight = params.constraints?.maxWeight || 0.5
    const bounds = Array(numAssets).fill([minWeight, maxWeight])

    // Optimize
    const initialWeights = Array(numAssets).fill(0)
    const result = scipy.optimize.minimize(
      objective,
      initialWeights,
      {
        method: 'SLSQP',
        bounds: bounds,
        constraints: constraints
      }
    )

    const weights = result.x

    return {
      weights: Object.fromEntries(
        params.assets.map((asset, i) => [asset, weights[i]])
      ),
      expectedReturn: -result.fun,
      volatility: 0,
      sharpeRatio: 0,
      variance: 0
    }
  }
}

/**
 * Portfolio Rebalancing Engine
 */
export class PortfolioRebalancer {
  /**
   * Calculate rebalancing trades
   */
  calculateRebalance(params: {
    currentWeights: Record<string, number>
    targetWeights: Record<string, number>
    portfolioValue: number
    tradingCosts?: number
    threshold?: number
  }): RebalanceResult {
    const threshold = params.threshold || 0.05
    const tradingCosts = params.tradingCosts || 0.001

    const trades: Trade[] = []
    let totalCost = 0
    let maxDrift = 0

    for (const [asset, targetWeight] of Object.entries(params.targetWeights)) {
      const currentWeight = params.currentWeights[asset] || 0
      const drift = targetWeight - currentWeight

      maxDrift = Math.max(maxDrift, Math.abs(drift))

      if (Math.abs(drift) > threshold) {
        const targetValue = params.portfolioValue * targetWeight
        const currentValue = params.portfolioValue * currentWeight
        const deltaValue = targetValue - currentValue

        const trade: Trade = {
          asset,
          action: deltaValue > 0 ? 'BUY' : 'SELL',
          value: Math.abs(deltaValue),
          currentWeight,
          targetWeight,
          drift
        }

        trades.push(trade)
        totalCost += Math.abs(deltaValue) * tradingCosts
      }
    }

    return {
      trades,
      totalCost,
      maxDrift,
      needsRebalancing: maxDrift > threshold
    }
  }

  /**
   * Tax-aware rebalancing
   */
  taxAwareRebalance(params: {
    currentWeights: Record<string, number>
    targetWeights: Record<string, number>
    unrealizedGains: Record<string, number>
    portfolioValue: number
    taxRate: number
    tradingCosts: number
  }): RebalanceResult {
    const trades: Trade[] = []
    let totalCost = 0
    let totalTax = 0

    for (const [asset, targetWeight] of Object.entries(params.targetWeights)) {
      const currentWeight = params.currentWeights[asset] || 0
      const drift = targetWeight - currentWeight

      if (drift < 0) {
        // Need to sell
        const sellValue = Math.abs(drift) * params.portfolioValue
        const gain = params.unrealizedGains[asset] || 0

        if (gain > 0) {
          // Taxable gain
          const tax = gain * params.taxRate
          const netCost = sellValue * params.tradingCosts + tax

          trades.push({
            asset,
            action: 'SELL',
            value: sellValue,
            currentWeight,
            targetWeight,
            drift,
            tax
          })

          totalTax += tax
          totalCost += netCost
        }
      } else if (drift > 0) {
        // Need to buy
        const buyValue = drift * params.portfolioValue
        const cost = buyValue * params.tradingCosts

        trades.push({
          asset,
          action: 'BUY',
          value: buyValue,
          currentWeight,
          targetWeight,
          drift
        })

        totalCost += cost
      }
    }

    return {
      trades,
      totalCost,
      totalTax,
      maxDrift: Math.max(...trades.map(t => Math.abs(t.drift))),
      needsRebalancing: trades.length > 0
    }
  }
}

// Type definitions
interface Portfolio {
  weights: Record<string, number>
  expectedReturn: number
  volatility: number
  sharpeRatio: number
  variance: number
  riskContributions?: Record<string, number>
  posteriorReturns?: Record<string, number>
  factorExposures?: Record<string, number>
}

interface EfficientFrontier {
  portfolios: Portfolio[]
  tangencyPortfolio: Portfolio
  minVariancePortfolio: Portfolio
  assets: string[]
}

interface PortfolioConstraints {
  minWeight?: number
  maxWeight?: number
  maxTurnover?: number
  sectorLimits?: Record<string, number>
}

interface View {
  assets: Record<number, number>  // asset index -> weight
  expectedReturn: number
  confidence: number
}

interface Trade {
  asset: string
  action: 'BUY' | 'SELL'
  value: number
  currentWeight: number
  targetWeight: number
  drift: number
  tax?: number
}

interface RebalanceResult {
  trades: Trade[]
  totalCost: number
  totalTax?: number
  maxDrift: number
  needsRebalancing: boolean
}

// Export all classes
export const PORTFOLIO_TOOLS = {
  MPTOptimizer,
  RiskParityOptimizer,
  BlackLittermanOptimizer,
  HierarchicalRiskParity,
  FactorPortfolioBuilder,
  PortfolioRebalancer
}
