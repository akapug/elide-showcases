/**
 * Value at Risk (VaR) Calculator
 *
 * Comprehensive VaR calculation using multiple methodologies:
 * - Historical simulation
 * - Parametric (variance-covariance)
 * - Monte Carlo simulation
 *
 * Also calculates Conditional VaR (CVaR/Expected Shortfall) and
 * other risk metrics.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import { stats, norm } from 'python:scipy';

import type {
  VaRMethod,
  VaRResult,
  RiskMetrics,
  Portfolio,
  Position,
} from '../types.js';

// ============================================================================
// Historical VaR
// ============================================================================

/**
 * Calculate VaR using historical simulation
 */
export class HistoricalVaR {
  /**
   * Calculate VaR from historical returns
   */
  static calculate(
    returns: number[],
    confidenceLevel = 0.95,
    timeHorizon = 1
  ): VaRResult {
    if (returns.length === 0) {
      throw new Error('Returns array cannot be empty');
    }

    const returnsArray = numpy.array(returns);

    // Sort returns
    const sortedReturns = numpy.sort(returnsArray);

    // Find the percentile corresponding to confidence level
    const alpha = 1 - confidenceLevel;
    const percentileIndex = Math.floor(alpha * returns.length);

    // VaR is the negative of the alpha percentile
    const varValue = -sortedReturns.item(percentileIndex);

    // Calculate CVaR (Expected Shortfall)
    const tailReturns = [];
    for (let i = 0; i <= percentileIndex; i++) {
      tailReturns.push(sortedReturns.item(i));
    }

    const cvarValue = -numpy.mean(numpy.array(tailReturns));

    // Scale to time horizon (assuming i.i.d. returns)
    const scalingFactor = Math.sqrt(timeHorizon);
    const scaledVar = varValue * scalingFactor;
    const scaledCVar = cvarValue * scalingFactor;

    return {
      confidenceLevel,
      timeHorizon,
      var: scaledVar,
      cvar: scaledCVar,
      method: 'historical',
      historicalReturns: returns,
    };
  }

  /**
   * Calculate portfolio VaR from position returns
   */
  static calculatePortfolioVaR(
    positions: Position[],
    historicalReturns: Map<string, number[]>,
    confidenceLevel = 0.95,
    timeHorizon = 1
  ): VaRResult {
    // Get number of observations
    const firstSymbol = positions[0].symbol;
    const firstReturns = historicalReturns.get(firstSymbol);

    if (!firstReturns) {
      throw new Error(`No historical returns for ${firstSymbol}`);
    }

    const numObs = firstReturns.length;

    // Calculate portfolio returns for each historical period
    const portfolioReturns: number[] = [];

    for (let t = 0; t < numObs; t++) {
      let portfolioReturn = 0;

      for (const position of positions) {
        const assetReturns = historicalReturns.get(position.symbol);

        if (!assetReturns || assetReturns.length !== numObs) {
          throw new Error(`Invalid returns for ${position.symbol}`);
        }

        portfolioReturn += position.weight * assetReturns[t];
      }

      portfolioReturns.push(portfolioReturn);
    }

    return this.calculate(portfolioReturns, confidenceLevel, timeHorizon);
  }

  /**
   * Calculate component VaR (contribution of each position)
   */
  static calculateComponentVaR(
    positions: Position[],
    historicalReturns: Map<string, number[]>,
    confidenceLevel = 0.95
  ): Map<string, number> {
    const portfolioVar = this.calculatePortfolioVaR(
      positions,
      historicalReturns,
      confidenceLevel,
      1
    );

    const componentVaRs = new Map<string, number>();

    // Calculate marginal VaR for each position
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];

      // Create portfolio without this position
      const reducedPositions = positions.filter((_, idx) => idx !== i);

      if (reducedPositions.length === 0) {
        componentVaRs.set(position.symbol, portfolioVar.var);
        continue;
      }

      // Renormalize weights
      const totalWeight = reducedPositions.reduce((sum, p) => sum + p.weight, 0);
      const normalizedPositions = reducedPositions.map(p => ({
        ...p,
        weight: p.weight / totalWeight,
      }));

      const reducedVar = this.calculatePortfolioVaR(
        normalizedPositions,
        historicalReturns,
        confidenceLevel,
        1
      );

      // Component VaR = Portfolio VaR - VaR without this position
      const componentVar = portfolioVar.var - reducedVar.var;
      componentVaRs.set(position.symbol, componentVar);
    }

    return componentVaRs;
  }
}

// ============================================================================
// Parametric VaR
// ============================================================================

/**
 * Calculate VaR using parametric (variance-covariance) method
 */
export class ParametricVaR {
  /**
   * Calculate VaR assuming normal distribution
   */
  static calculate(
    portfolioValue: number,
    expectedReturn: number,
    volatility: number,
    confidenceLevel = 0.95,
    timeHorizon = 1
  ): VaRResult {
    // Z-score for confidence level
    const alpha = 1 - confidenceLevel;
    const zScore = -norm.ppf(alpha);

    // VaR = -μ + σ * z * sqrt(t)
    const var95 = portfolioValue * (
      -expectedReturn * timeHorizon +
      volatility * zScore * Math.sqrt(timeHorizon)
    );

    // CVaR for normal distribution
    const cvar95 = portfolioValue * (
      -expectedReturn * timeHorizon +
      volatility * Math.sqrt(timeHorizon) * norm.pdf(zScore) / alpha
    );

    return {
      confidenceLevel,
      timeHorizon,
      var: var95,
      cvar: cvar95,
      method: 'parametric',
    };
  }

  /**
   * Calculate portfolio VaR from covariance matrix
   */
  static calculatePortfolioVaR(
    weights: number[],
    expectedReturns: number[],
    covarianceMatrix: number[][],
    portfolioValue: number,
    confidenceLevel = 0.95,
    timeHorizon = 1
  ): VaRResult {
    const weightsArray = numpy.array(weights);
    const returnsArray = numpy.array(expectedReturns);
    const covArray = numpy.array(covarianceMatrix);

    // Portfolio expected return
    const portfolioReturn = numpy.dot(weightsArray, returnsArray);

    // Portfolio variance: w^T * Σ * w
    const temp = numpy.dot(covArray, weightsArray);
    const portfolioVariance = numpy.dot(weightsArray, temp);
    const portfolioVol = Math.sqrt(portfolioVariance);

    return this.calculate(
      portfolioValue,
      portfolioReturn,
      portfolioVol,
      confidenceLevel,
      timeHorizon
    );
  }

  /**
   * Calculate VaR using Cornish-Fisher expansion (accounts for skewness and kurtosis)
   */
  static calculateCornishFisher(
    portfolioValue: number,
    expectedReturn: number,
    volatility: number,
    skewness: number,
    excessKurtosis: number,
    confidenceLevel = 0.95,
    timeHorizon = 1
  ): VaRResult {
    const alpha = 1 - confidenceLevel;
    const zScore = -norm.ppf(alpha);

    // Cornish-Fisher adjustment
    const adjustedZ = zScore +
      (zScore * zScore - 1) * skewness / 6 +
      (zScore * zScore * zScore - 3 * zScore) * excessKurtosis / 24 -
      (2 * zScore * zScore * zScore - 5 * zScore) * skewness * skewness / 36;

    const varValue = portfolioValue * (
      -expectedReturn * timeHorizon +
      volatility * adjustedZ * Math.sqrt(timeHorizon)
    );

    // CVaR approximation
    const cvarValue = varValue * 1.2; // Rough approximation

    return {
      confidenceLevel,
      timeHorizon,
      var: varValue,
      cvar: cvarValue,
      method: 'parametric',
    };
  }
}

// ============================================================================
// Monte Carlo VaR
// ============================================================================

/**
 * Calculate VaR using Monte Carlo simulation
 */
export class MonteCarloVaR {
  /**
   * Calculate VaR using geometric Brownian motion
   */
  static calculate(
    portfolioValue: number,
    expectedReturn: number,
    volatility: number,
    confidenceLevel = 0.95,
    timeHorizon = 1,
    numSimulations = 100000,
    seed?: number
  ): VaRResult {
    if (seed !== undefined) {
      numpy.random.seed(seed);
    }

    // Simulate portfolio returns
    const dt = 1 / 252; // Daily time step
    const numSteps = Math.ceil(timeHorizon * 252);

    // Generate random returns
    const drift = (expectedReturn - 0.5 * volatility * volatility) * dt;
    const diffusion = volatility * Math.sqrt(dt);

    // Simulate final portfolio values
    const finalValues = [];

    for (let i = 0; i < numSimulations; i++) {
      let value = portfolioValue;

      for (let step = 0; step < numSteps; step++) {
        const randomShock = numpy.random.standard_normal();
        const returnFactor = Math.exp(drift + diffusion * randomShock);
        value *= returnFactor;
      }

      finalValues.push(value);
    }

    // Calculate VaR and CVaR
    const finalValuesArray = numpy.array(finalValues);
    const losses = portfolioValue - finalValuesArray;

    const sortedLosses = numpy.sort(losses);
    const alpha = 1 - confidenceLevel;
    const varIndex = Math.floor((1 - alpha) * numSimulations);

    const varValue = sortedLosses.item(varIndex);

    // CVaR: average of losses beyond VaR
    const tailLosses = [];
    for (let i = varIndex; i < numSimulations; i++) {
      tailLosses.push(sortedLosses.item(i));
    }

    const cvarValue = numpy.mean(numpy.array(tailLosses));

    // Get simulated returns for analysis
    const simulatedReturns = [];
    for (let i = 0; i < numSimulations; i++) {
      simulatedReturns.push((finalValues[i] - portfolioValue) / portfolioValue);
    }

    return {
      confidenceLevel,
      timeHorizon,
      var: varValue,
      cvar: cvarValue,
      method: 'monte-carlo',
      simulatedReturns,
    };
  }

  /**
   * Calculate portfolio VaR with correlated assets
   */
  static calculatePortfolioVaR(
    weights: number[],
    expectedReturns: number[],
    covarianceMatrix: number[][],
    portfolioValue: number,
    confidenceLevel = 0.95,
    timeHorizon = 1,
    numSimulations = 100000,
    seed?: number
  ): VaRResult {
    if (seed !== undefined) {
      numpy.random.seed(seed);
    }

    const n = weights.length;
    const weightsArray = numpy.array(weights);
    const returnsArray = numpy.array(expectedReturns);
    const covArray = numpy.array(covarianceMatrix);

    // Cholesky decomposition for correlated random variables
    const L = numpy.linalg.cholesky(covArray);

    const dt = 1 / 252;
    const numSteps = Math.ceil(timeHorizon * 252);

    const finalValues = [];

    for (let sim = 0; sim < numSimulations; sim++) {
      // Initial asset values
      const assetValues = [];
      for (let i = 0; i < n; i++) {
        assetValues.push(portfolioValue * weights[i]);
      }

      // Simulate each time step
      for (let step = 0; step < numSteps; step++) {
        // Generate correlated random shocks
        const uncorrelated = [];
        for (let i = 0; i < n; i++) {
          uncorrelated.push(numpy.random.standard_normal());
        }

        const uncorrelatedArray = numpy.array(uncorrelated);
        const correlated = numpy.dot(L, uncorrelatedArray);

        // Update asset values
        for (let i = 0; i < n; i++) {
          const mu = expectedReturns[i];
          const sigma = Math.sqrt(covArray.item([i, i]));
          const drift = (mu - 0.5 * sigma * sigma) * dt;
          const diffusion = sigma * Math.sqrt(dt);

          const shock = correlated.item(i);
          const returnFactor = Math.exp(drift + diffusion * shock);
          assetValues[i] *= returnFactor;
        }
      }

      // Calculate final portfolio value
      const finalValue = assetValues.reduce((sum, val) => sum + val, 0);
      finalValues.push(finalValue);
    }

    // Calculate VaR and CVaR
    const finalValuesArray = numpy.array(finalValues);
    const losses = portfolioValue - finalValuesArray;

    const sortedLosses = numpy.sort(losses);
    const alpha = 1 - confidenceLevel;
    const varIndex = Math.floor((1 - alpha) * numSimulations);

    const varValue = sortedLosses.item(varIndex);

    const tailLosses = [];
    for (let i = varIndex; i < numSimulations; i++) {
      tailLosses.push(sortedLosses.item(i));
    }

    const cvarValue = numpy.mean(numpy.array(tailLosses));

    const simulatedReturns = [];
    for (let i = 0; i < numSimulations; i++) {
      simulatedReturns.push((finalValues[i] - portfolioValue) / portfolioValue);
    }

    return {
      confidenceLevel,
      timeHorizon,
      var: varValue,
      cvar: cvarValue,
      method: 'monte-carlo',
      simulatedReturns,
    };
  }

  /**
   * Calculate VaR with jump diffusion process
   */
  static calculateWithJumps(
    portfolioValue: number,
    expectedReturn: number,
    volatility: number,
    jumpIntensity: number,
    jumpMean: number,
    jumpStd: number,
    confidenceLevel = 0.95,
    timeHorizon = 1,
    numSimulations = 100000,
    seed?: number
  ): VaRResult {
    if (seed !== undefined) {
      numpy.random.seed(seed);
    }

    const dt = 1 / 252;
    const numSteps = Math.ceil(timeHorizon * 252);

    const drift = (expectedReturn - 0.5 * volatility * volatility) * dt;
    const diffusion = volatility * Math.sqrt(dt);

    const finalValues = [];

    for (let i = 0; i < numSimulations; i++) {
      let value = portfolioValue;

      for (let step = 0; step < numSteps; step++) {
        // Diffusion component
        const randomShock = numpy.random.standard_normal();
        const diffusionReturn = drift + diffusion * randomShock;

        // Jump component (Poisson process)
        const jumpOccurs = Math.random() < jumpIntensity * dt;
        let jumpReturn = 0;

        if (jumpOccurs) {
          const jumpSize = numpy.random.normal(jumpMean, jumpStd);
          jumpReturn = jumpSize;
        }

        const totalReturn = diffusionReturn + jumpReturn;
        value *= Math.exp(totalReturn);
      }

      finalValues.push(value);
    }

    const finalValuesArray = numpy.array(finalValues);
    const losses = portfolioValue - finalValuesArray;

    const sortedLosses = numpy.sort(losses);
    const alpha = 1 - confidenceLevel;
    const varIndex = Math.floor((1 - alpha) * numSimulations);

    const varValue = sortedLosses.item(varIndex);

    const tailLosses = [];
    for (let i = varIndex; i < numSimulations; i++) {
      tailLosses.push(sortedLosses.item(i));
    }

    const cvarValue = numpy.mean(numpy.array(tailLosses));

    const simulatedReturns = [];
    for (let i = 0; i < numSimulations; i++) {
      simulatedReturns.push((finalValues[i] - portfolioValue) / portfolioValue);
    }

    return {
      confidenceLevel,
      timeHorizon,
      var: varValue,
      cvar: cvarValue,
      method: 'monte-carlo',
      simulatedReturns,
    };
  }
}

// ============================================================================
// Risk Metrics Calculator
// ============================================================================

/**
 * Calculate comprehensive risk metrics
 */
export class RiskMetricsCalculator {
  /**
   * Calculate all risk metrics for a return series
   */
  static calculate(
    returns: number[],
    benchmarkReturns?: number[],
    riskFreeRate = 0.02
  ): RiskMetrics {
    const returnsArray = numpy.array(returns);

    // VaR metrics
    const var95Result = HistoricalVaR.calculate(returns, 0.95, 1);
    const var99Result = HistoricalVaR.calculate(returns, 0.99, 1);

    // Volatility (annualized)
    const volatility = numpy.std(returnsArray) * Math.sqrt(252);

    // Sharpe ratio
    const meanReturn = numpy.mean(returnsArray);
    const annualizedReturn = meanReturn * 252;
    const sharpeRatio = (annualizedReturn - riskFreeRate) / volatility;

    // Sortino ratio (downside deviation)
    const downsideReturns = returns.filter(r => r < 0);
    const downsideVolatility = downsideReturns.length > 0
      ? numpy.std(numpy.array(downsideReturns)) * Math.sqrt(252)
      : 0;
    const sortinoRatio = downsideVolatility > 0
      ? (annualizedReturn - riskFreeRate) / downsideVolatility
      : 0;

    // Maximum drawdown
    const cumReturns = numpy.cumprod(returnsArray.add(1));
    let maxDD = 0;
    let maxDDDuration = 0;
    let peak = cumReturns.item(0);
    let peakIndex = 0;

    for (let i = 0; i < cumReturns.size; i++) {
      const value = cumReturns.item(i);

      if (value > peak) {
        peak = value;
        peakIndex = i;
      }

      const drawdown = (peak - value) / peak;
      if (drawdown > maxDD) {
        maxDD = drawdown;
        maxDDDuration = i - peakIndex;
      }
    }

    // Beta (if benchmark provided)
    let beta = 1.0;
    if (benchmarkReturns && benchmarkReturns.length === returns.length) {
      const benchArray = numpy.array(benchmarkReturns);
      const covariance = numpy.cov(returnsArray, benchArray).item([0, 1]);
      const benchVariance = numpy.var(benchArray);
      beta = covariance / benchVariance;
    }

    return {
      var95: var95Result.var,
      var99: var99Result.var,
      cvar95: var95Result.cvar,
      cvar99: var99Result.cvar,
      volatility,
      beta,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown: maxDD,
      maxDrawdownDuration: maxDDDuration,
    };
  }

  /**
   * Calculate rolling VaR
   */
  static calculateRollingVaR(
    returns: number[],
    windowSize: number,
    confidenceLevel = 0.95
  ): number[] {
    const rollingVaRs: number[] = [];

    for (let i = windowSize; i <= returns.length; i++) {
      const window = returns.slice(i - windowSize, i);
      const varResult = HistoricalVaR.calculate(window, confidenceLevel, 1);
      rollingVaRs.push(varResult.var);
    }

    return rollingVaRs;
  }

  /**
   * Backtest VaR model
   */
  static backtestVaR(
    actualReturns: number[],
    varForecasts: number[],
    confidenceLevel = 0.95
  ): {
    violations: number;
    violationRate: number;
    expectedViolationRate: number;
    kupiecTest: { statistic: number; pValue: number; reject: boolean };
  } {
    if (actualReturns.length !== varForecasts.length) {
      throw new Error('Returns and forecasts must have same length');
    }

    // Count VaR violations (actual loss > VaR)
    let violations = 0;
    for (let i = 0; i < actualReturns.length; i++) {
      if (-actualReturns[i] > varForecasts[i]) {
        violations++;
      }
    }

    const violationRate = violations / actualReturns.length;
    const expectedViolationRate = 1 - confidenceLevel;

    // Kupiec test for unconditional coverage
    const n = actualReturns.length;
    const p = expectedViolationRate;

    let likelihood = 0;
    if (violations > 0 && violations < n) {
      const pHat = violations / n;
      likelihood = -2 * (
        violations * Math.log(p) +
        (n - violations) * Math.log(1 - p) -
        violations * Math.log(pHat) -
        (n - violations) * Math.log(1 - pHat)
      );
    }

    // Chi-squared test with 1 degree of freedom
    const pValue = 1 - stats.chi2.cdf(likelihood, 1);
    const reject = pValue < 0.05;

    return {
      violations,
      violationRate,
      expectedViolationRate,
      kupiecTest: {
        statistic: likelihood,
        pValue,
        reject,
      },
    };
  }
}

// ============================================================================
// Export all calculators
// ============================================================================

export {
  HistoricalVaR,
  ParametricVaR,
  MonteCarloVaR,
  RiskMetricsCalculator,
};
