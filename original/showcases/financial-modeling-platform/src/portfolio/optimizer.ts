/**
 * Portfolio Optimization Engine
 *
 * Modern portfolio theory implementation using mean-variance optimization,
 * efficient frontier calculation, and risk parity strategies.
 *
 * Leverages scipy.optimize for constrained optimization and numpy for
 * efficient matrix operations.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import { optimize } from 'python:scipy';
// @ts-ignore
import pandas from 'python:pandas';

import type {
  Portfolio,
  OptimizationConstraints,
  OptimizationObjective,
  OptimizationResult,
  EfficientFrontier,
  EfficientFrontierPoint,
  CovarianceMatrix,
} from '../types.js';

// ============================================================================
// Return and Risk Calculation
// ============================================================================

/**
 * Calculate portfolio statistics
 */
export class PortfolioStatistics {
  /**
   * Calculate expected return of portfolio
   */
  static expectedReturn(weights: number[], expectedReturns: number[]): number {
    const weightsArray = numpy.array(weights);
    const returnsArray = numpy.array(expectedReturns);

    return numpy.dot(weightsArray, returnsArray);
  }

  /**
   * Calculate portfolio variance
   */
  static variance(weights: number[], covarianceMatrix: number[][]): number {
    const weightsArray = numpy.array(weights);
    const covArray = numpy.array(covarianceMatrix);

    // σ²_p = w^T * Σ * w
    const temp = numpy.dot(covArray, weightsArray);
    const variance = numpy.dot(weightsArray, temp);

    return variance;
  }

  /**
   * Calculate portfolio volatility (standard deviation)
   */
  static volatility(weights: number[], covarianceMatrix: number[][]): number {
    const variance = this.variance(weights, covarianceMatrix);
    return Math.sqrt(variance);
  }

  /**
   * Calculate Sharpe ratio
   */
  static sharpeRatio(
    weights: number[],
    expectedReturns: number[],
    covarianceMatrix: number[][],
    riskFreeRate: number
  ): number {
    const expectedReturn = this.expectedReturn(weights, expectedReturns);
    const vol = this.volatility(weights, covarianceMatrix);

    if (vol === 0) return 0;

    return (expectedReturn - riskFreeRate) / vol;
  }

  /**
   * Calculate diversification ratio
   */
  static diversificationRatio(
    weights: number[],
    volatilities: number[],
    portfolioVolatility: number
  ): number {
    const weightsArray = numpy.array(weights);
    const volsArray = numpy.array(volatilities);

    const weightedVol = numpy.dot(weightsArray, volsArray);

    return weightedVol / portfolioVolatility;
  }

  /**
   * Calculate tracking error
   */
  static trackingError(
    portfolioReturns: number[],
    benchmarkReturns: number[]
  ): number {
    const portArray = numpy.array(portfolioReturns);
    const benchArray = numpy.array(benchmarkReturns);

    const diff = portArray.subtract(benchArray);
    return numpy.std(diff);
  }

  /**
   * Calculate maximum drawdown
   */
  static maxDrawdown(returns: number[]): { maxDD: number; duration: number } {
    const returnsArray = numpy.array(returns);
    const cumReturns = numpy.cumprod(returnsArray.add(1));

    let maxDD = 0;
    let peak = cumReturns.item(0);
    let peakIndex = 0;
    let maxDuration = 0;

    for (let i = 0; i < cumReturns.size; i++) {
      const value = cumReturns.item(i);

      if (value > peak) {
        peak = value;
        peakIndex = i;
      }

      const drawdown = (peak - value) / peak;
      if (drawdown > maxDD) {
        maxDD = drawdown;
        maxDuration = i - peakIndex;
      }
    }

    return { maxDD, duration: maxDuration };
  }
}

// ============================================================================
// Mean-Variance Optimization
// ============================================================================

/**
 * Mean-variance optimizer using quadratic programming
 */
export class MeanVarianceOptimizer {
  /**
   * Optimize portfolio to maximize Sharpe ratio
   */
  static maximizeSharpe(
    expectedReturns: number[],
    covarianceMatrix: number[][],
    riskFreeRate: number,
    constraints?: OptimizationConstraints
  ): OptimizationResult {
    const startTime = performance.now();
    const n = expectedReturns.length;

    // Objective: minimize negative Sharpe ratio
    const objective = (weights: any) => {
      const w = [];
      for (let i = 0; i < n; i++) {
        w.push(weights.item(i));
      }

      const ret = PortfolioStatistics.expectedReturn(w, expectedReturns);
      const vol = PortfolioStatistics.volatility(w, covarianceMatrix);

      if (vol === 0) return 1e10;

      const sharpe = (ret - riskFreeRate) / vol;
      return -sharpe; // Minimize negative Sharpe
    };

    // Initial guess: equal weights
    const x0 = numpy.ones(n).divide(n);

    // Constraints
    const scipyConstraints = this.buildConstraints(n, constraints);

    // Bounds: weights between 0 and 1 (or custom bounds)
    const bounds = [];
    for (let i = 0; i < n; i++) {
      const lower = constraints?.minWeight ?? 0;
      const upper = constraints?.maxWeight ?? 1;
      bounds.push([lower, upper]);
    }

    // Optimize using scipy
    const result = optimize.minimize(
      objective,
      x0,
      {
        method: 'SLSQP',
        bounds: numpy.array(bounds),
        constraints: scipyConstraints,
        options: { maxiter: 1000, ftol: 1e-9 },
      }
    );

    const weights = [];
    for (let i = 0; i < n; i++) {
      weights.push(result.x.item(i));
    }

    const expectedReturn = PortfolioStatistics.expectedReturn(weights, expectedReturns);
    const expectedVolatility = PortfolioStatistics.volatility(weights, covarianceMatrix);
    const sharpeRatio = PortfolioStatistics.sharpeRatio(weights, expectedReturns, covarianceMatrix, riskFreeRate);

    const computeTimeMs = performance.now() - startTime;

    return {
      weights,
      expectedReturn,
      expectedVolatility,
      sharpeRatio,
      objective: 'max-sharpe',
      success: result.success,
      iterations: result.nit,
      computeTimeMs,
    };
  }

  /**
   * Optimize portfolio to minimize variance
   */
  static minimizeVariance(
    expectedReturns: number[],
    covarianceMatrix: number[][],
    targetReturn?: number,
    constraints?: OptimizationConstraints
  ): OptimizationResult {
    const startTime = performance.now();
    const n = expectedReturns.length;

    // Objective: minimize variance
    const objective = (weights: any) => {
      const w = [];
      for (let i = 0; i < n; i++) {
        w.push(weights.item(i));
      }

      return PortfolioStatistics.variance(w, covarianceMatrix);
    };

    const x0 = numpy.ones(n).divide(n);

    // Build constraints
    const scipyConstraints = this.buildConstraints(n, constraints, targetReturn, expectedReturns);

    const bounds = [];
    for (let i = 0; i < n; i++) {
      const lower = constraints?.minWeight ?? 0;
      const upper = constraints?.maxWeight ?? 1;
      bounds.push([lower, upper]);
    }

    const result = optimize.minimize(
      objective,
      x0,
      {
        method: 'SLSQP',
        bounds: numpy.array(bounds),
        constraints: scipyConstraints,
        options: { maxiter: 1000, ftol: 1e-9 },
      }
    );

    const weights = [];
    for (let i = 0; i < n; i++) {
      weights.push(result.x.item(i));
    }

    const expectedReturn = PortfolioStatistics.expectedReturn(weights, expectedReturns);
    const expectedVolatility = PortfolioStatistics.volatility(weights, covarianceMatrix);
    const riskFreeRate = 0.02; // Assume 2% risk-free rate
    const sharpeRatio = PortfolioStatistics.sharpeRatio(weights, expectedReturns, covarianceMatrix, riskFreeRate);

    const computeTimeMs = performance.now() - startTime;

    return {
      weights,
      expectedReturn,
      expectedVolatility,
      sharpeRatio,
      objective: 'min-variance',
      success: result.success,
      iterations: result.nit,
      computeTimeMs,
    };
  }

  /**
   * Optimize portfolio to maximize return
   */
  static maximizeReturn(
    expectedReturns: number[],
    covarianceMatrix: number[][],
    targetVolatility: number,
    constraints?: OptimizationConstraints
  ): OptimizationResult {
    const startTime = performance.now();
    const n = expectedReturns.length;

    // Objective: minimize negative return
    const objective = (weights: any) => {
      const w = [];
      for (let i = 0; i < n; i++) {
        w.push(weights.item(i));
      }

      const ret = PortfolioStatistics.expectedReturn(w, expectedReturns);
      return -ret;
    };

    const x0 = numpy.ones(n).divide(n);

    // Add volatility constraint
    const volatilityConstraint = {
      type: 'ineq',
      fun: (weights: any) => {
        const w = [];
        for (let i = 0; i < n; i++) {
          w.push(weights.item(i));
        }
        const vol = PortfolioStatistics.volatility(w, covarianceMatrix);
        return targetVolatility - vol; // vol <= targetVolatility
      },
    };

    const scipyConstraints = [
      ...this.buildConstraints(n, constraints),
      volatilityConstraint,
    ];

    const bounds = [];
    for (let i = 0; i < n; i++) {
      const lower = constraints?.minWeight ?? 0;
      const upper = constraints?.maxWeight ?? 1;
      bounds.push([lower, upper]);
    }

    const result = optimize.minimize(
      objective,
      x0,
      {
        method: 'SLSQP',
        bounds: numpy.array(bounds),
        constraints: scipyConstraints,
        options: { maxiter: 1000, ftol: 1e-9 },
      }
    );

    const weights = [];
    for (let i = 0; i < n; i++) {
      weights.push(result.x.item(i));
    }

    const expectedReturn = PortfolioStatistics.expectedReturn(weights, expectedReturns);
    const expectedVolatility = PortfolioStatistics.volatility(weights, covarianceMatrix);
    const riskFreeRate = 0.02;
    const sharpeRatio = PortfolioStatistics.sharpeRatio(weights, expectedReturns, covarianceMatrix, riskFreeRate);

    const computeTimeMs = performance.now() - startTime;

    return {
      weights,
      expectedReturn,
      expectedVolatility,
      sharpeRatio,
      objective: 'max-return',
      success: result.success,
      iterations: result.nit,
      computeTimeMs,
    };
  }

  /**
   * Build optimization constraints
   */
  private static buildConstraints(
    n: number,
    constraints?: OptimizationConstraints,
    targetReturn?: number,
    expectedReturns?: number[]
  ): any[] {
    const scipyConstraints = [];

    // Weights must sum to 1
    scipyConstraints.push({
      type: 'eq',
      fun: (weights: any) => {
        let sum = 0;
        for (let i = 0; i < n; i++) {
          sum += weights.item(i);
        }
        return sum - 1;
      },
    });

    // Target return constraint
    if (targetReturn !== undefined && expectedReturns !== undefined) {
      scipyConstraints.push({
        type: 'eq',
        fun: (weights: any) => {
          const w = [];
          for (let i = 0; i < n; i++) {
            w.push(weights.item(i));
          }
          const ret = PortfolioStatistics.expectedReturn(w, expectedReturns);
          return ret - targetReturn;
        },
      });
    }

    // Additional constraints
    if (constraints?.maxLeverage !== undefined) {
      scipyConstraints.push({
        type: 'ineq',
        fun: (weights: any) => {
          let sum = 0;
          for (let i = 0; i < n; i++) {
            sum += Math.abs(weights.item(i));
          }
          return constraints.maxLeverage! - sum;
        },
      });
    }

    return scipyConstraints;
  }
}

// ============================================================================
// Efficient Frontier
// ============================================================================

/**
 * Calculate efficient frontier
 */
export class EfficientFrontierCalculator {
  /**
   * Generate efficient frontier points
   */
  static calculate(
    expectedReturns: number[],
    covarianceMatrix: number[][],
    riskFreeRate: number,
    numPoints = 50,
    constraints?: OptimizationConstraints
  ): EfficientFrontier {
    const startTime = performance.now();

    // Find minimum variance portfolio
    const minVarResult = MeanVarianceOptimizer.minimizeVariance(
      expectedReturns,
      covarianceMatrix,
      undefined,
      constraints
    );

    const minVariancePoint: EfficientFrontierPoint = {
      expectedReturn: minVarResult.expectedReturn,
      volatility: minVarResult.expectedVolatility,
      sharpeRatio: minVarResult.sharpeRatio,
      weights: minVarResult.weights,
    };

    // Find maximum Sharpe ratio portfolio
    const maxSharpeResult = MeanVarianceOptimizer.maximizeSharpe(
      expectedReturns,
      covarianceMatrix,
      riskFreeRate,
      constraints
    );

    const maxSharpePoint: EfficientFrontierPoint = {
      expectedReturn: maxSharpeResult.expectedReturn,
      volatility: maxSharpeResult.expectedVolatility,
      sharpeRatio: maxSharpeResult.sharpeRatio,
      weights: maxSharpeResult.weights,
    };

    // Generate points along efficient frontier
    const minReturn = minVarResult.expectedReturn;
    const maxReturn = Math.max(...expectedReturns);

    const targetReturns = [];
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      targetReturns.push(minReturn + t * (maxReturn - minReturn));
    }

    const points: EfficientFrontierPoint[] = [];

    for (const targetReturn of targetReturns) {
      try {
        const result = MeanVarianceOptimizer.minimizeVariance(
          expectedReturns,
          covarianceMatrix,
          targetReturn,
          constraints
        );

        if (result.success) {
          points.push({
            expectedReturn: result.expectedReturn,
            volatility: result.expectedVolatility,
            sharpeRatio: result.sharpeRatio,
            weights: result.weights,
          });
        }
      } catch (error) {
        // Skip points that don't converge
        continue;
      }
    }

    console.log(`Efficient frontier calculated in ${performance.now() - startTime}ms`);

    return {
      points,
      minVariancePoint,
      maxSharpePoint,
    };
  }

  /**
   * Find portfolio on efficient frontier with target risk
   */
  static findByRisk(
    frontier: EfficientFrontier,
    targetVolatility: number
  ): EfficientFrontierPoint | null {
    let closest: EfficientFrontierPoint | null = null;
    let minDiff = Infinity;

    for (const point of frontier.points) {
      const diff = Math.abs(point.volatility - targetVolatility);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }

    return closest;
  }

  /**
   * Find portfolio on efficient frontier with target return
   */
  static findByReturn(
    frontier: EfficientFrontier,
    targetReturn: number
  ): EfficientFrontierPoint | null {
    let closest: EfficientFrontierPoint | null = null;
    let minDiff = Infinity;

    for (const point of frontier.points) {
      const diff = Math.abs(point.expectedReturn - targetReturn);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }

    return closest;
  }
}

// ============================================================================
// Risk Parity Optimization
// ============================================================================

/**
 * Risk parity portfolio optimization
 */
export class RiskParityOptimizer {
  /**
   * Optimize portfolio for equal risk contribution
   */
  static optimize(
    covarianceMatrix: number[][],
    constraints?: OptimizationConstraints
  ): OptimizationResult {
    const startTime = performance.now();
    const n = covarianceMatrix.length;

    // Objective: minimize difference in risk contributions
    const objective = (weights: any) => {
      const w = [];
      for (let i = 0; i < n; i++) {
        w.push(weights.item(i));
      }

      const riskContributions = this.calculateRiskContributions(w, covarianceMatrix);

      // Target: equal risk contribution (1/n each)
      const target = 1 / n;
      let sumSquaredDiff = 0;

      for (const rc of riskContributions) {
        sumSquaredDiff += Math.pow(rc - target, 2);
      }

      return sumSquaredDiff;
    };

    const x0 = numpy.ones(n).divide(n);

    const scipyConstraints = [{
      type: 'eq',
      fun: (weights: any) => {
        let sum = 0;
        for (let i = 0; i < n; i++) {
          sum += weights.item(i);
        }
        return sum - 1;
      },
    }];

    const bounds = [];
    for (let i = 0; i < n; i++) {
      const lower = constraints?.minWeight ?? 0;
      const upper = constraints?.maxWeight ?? 1;
      bounds.push([lower, upper]);
    }

    const result = optimize.minimize(
      objective,
      x0,
      {
        method: 'SLSQP',
        bounds: numpy.array(bounds),
        constraints: scipyConstraints,
        options: { maxiter: 1000, ftol: 1e-9 },
      }
    );

    const weights = [];
    for (let i = 0; i < n; i++) {
      weights.push(result.x.item(i));
    }

    const expectedVolatility = PortfolioStatistics.volatility(weights, covarianceMatrix);

    // Calculate dummy expected return (not relevant for risk parity)
    const expectedReturn = 0;
    const sharpeRatio = 0;

    const computeTimeMs = performance.now() - startTime;

    return {
      weights,
      expectedReturn,
      expectedVolatility,
      sharpeRatio,
      objective: 'risk-parity',
      success: result.success,
      iterations: result.nit,
      computeTimeMs,
    };
  }

  /**
   * Calculate risk contribution of each asset
   */
  private static calculateRiskContributions(
    weights: number[],
    covarianceMatrix: number[][]
  ): number[] {
    const n = weights.length;
    const portfolioVar = PortfolioStatistics.variance(weights, covarianceMatrix);

    if (portfolioVar === 0) {
      return new Array(n).fill(0);
    }

    const weightsArray = numpy.array(weights);
    const covArray = numpy.array(covarianceMatrix);

    // Marginal risk contribution: (Σ * w) / σ_p
    const marginalContrib = numpy.dot(covArray, weightsArray);
    const portfolioVol = Math.sqrt(portfolioVar);

    const riskContributions: number[] = [];
    for (let i = 0; i < n; i++) {
      const mc = marginalContrib.item(i);
      const rc = (weights[i] * mc) / portfolioVar;
      riskContributions.push(rc);
    }

    return riskContributions;
  }
}

// ============================================================================
// Black-Litterman Model
// ============================================================================

/**
 * Black-Litterman portfolio optimization
 */
export class BlackLittermanOptimizer {
  /**
   * Calculate posterior returns using Black-Litterman model
   */
  static calculatePosteriorReturns(
    priorReturns: number[],
    priorCovariance: number[][],
    views: Array<{ assets: number[]; expectedReturn: number; confidence: number }>,
    marketCapWeights: number[],
    tau = 0.025
  ): { posteriorReturns: number[]; posteriorCovariance: number[][] } {
    const n = priorReturns.length;
    const k = views.length;

    // Build view matrix P (k × n)
    const P: number[][] = [];
    const Q: number[] = [];
    const omega: number[][] = [];

    for (let i = 0; i < k; i++) {
      const row = new Array(n).fill(0);
      for (const assetIdx of views[i].assets) {
        row[assetIdx] = 1 / views[i].assets.length;
      }
      P.push(row);
      Q.push(views[i].expectedReturn);

      // Omega: diagonal matrix of view uncertainties
      const omegaRow = new Array(k).fill(0);
      omegaRow[i] = 1 / views[i].confidence;
      omega.push(omegaRow);
    }

    const PArray = numpy.array(P);
    const QArray = numpy.array(Q);
    const OmegaArray = numpy.array(omega);

    const priorReturnsArray = numpy.array(priorReturns);
    const priorCovArray = numpy.array(priorCovariance);

    // Black-Litterman formula:
    // E[R] = [(τΣ)^-1 + P^T Ω^-1 P]^-1 [(τΣ)^-1 π + P^T Ω^-1 Q]

    const tauSigma = priorCovArray.multiply(tau);
    const tauSigmaInv = numpy.linalg.inv(tauSigma);

    const PT = numpy.transpose(PArray);
    const OmegaInv = numpy.linalg.inv(OmegaArray);

    const term1 = numpy.dot(numpy.dot(PT, OmegaInv), PArray);
    const A = tauSigmaInv.add(term1);
    const AInv = numpy.linalg.inv(A);

    const term2 = numpy.dot(tauSigmaInv, priorReturnsArray);
    const term3 = numpy.dot(numpy.dot(PT, OmegaInv), QArray);
    const B = term2.add(term3);

    const posteriorReturnsArray = numpy.dot(AInv, B);

    // Posterior covariance: Σ_post = Σ + [(τΣ)^-1 + P^T Ω^-1 P]^-1
    const posteriorCovArray = priorCovArray.add(AInv);

    const posteriorReturns: number[] = [];
    for (let i = 0; i < n; i++) {
      posteriorReturns.push(posteriorReturnsArray.item(i));
    }

    const posteriorCovariance: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        row.push(posteriorCovArray.item([i, j]));
      }
      posteriorCovariance.push(row);
    }

    return { posteriorReturns, posteriorCovariance };
  }

  /**
   * Optimize portfolio using Black-Litterman posterior returns
   */
  static optimize(
    priorReturns: number[],
    priorCovariance: number[][],
    views: Array<{ assets: number[]; expectedReturn: number; confidence: number }>,
    marketCapWeights: number[],
    riskFreeRate: number,
    constraints?: OptimizationConstraints
  ): OptimizationResult {
    const { posteriorReturns, posteriorCovariance } = this.calculatePosteriorReturns(
      priorReturns,
      priorCovariance,
      views,
      marketCapWeights
    );

    return MeanVarianceOptimizer.maximizeSharpe(
      posteriorReturns,
      posteriorCovariance,
      riskFreeRate,
      constraints
    );
  }
}

// ============================================================================
// Export all optimizers
// ============================================================================

export {
  PortfolioStatistics,
  MeanVarianceOptimizer,
  EfficientFrontierCalculator,
  RiskParityOptimizer,
  BlackLittermanOptimizer,
};
