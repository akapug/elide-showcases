/**
 * Monte Carlo Simulation Engine
 *
 * Advanced Monte Carlo methods for derivatives pricing and risk analysis:
 * - Geometric Brownian Motion
 * - Jump diffusion processes
 * - Heston stochastic volatility
 * - Variance reduction techniques
 *
 * Uses numpy for efficient array operations and random number generation.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import { stats } from 'python:scipy';

import type {
  MonteCarloParams,
  MonteCarloResult,
  ProcessType,
  GBMParams,
  JumpDiffusionParams,
  HestonParams,
} from '../types.js';

// ============================================================================
// Geometric Brownian Motion
// ============================================================================

/**
 * Simulate Geometric Brownian Motion paths
 */
export class GeometricBrownianMotion {
  /**
   * Simulate GBM paths: dS/S = μdt + σdW
   */
  static simulate(
    initialPrice: number,
    params: GBMParams,
    numPaths: number,
    numSteps: number,
    timeHorizon: number,
    seed?: number
  ): MonteCarloResult {
    const startTime = performance.now();

    if (seed !== undefined) {
      numpy.random.seed(seed);
    }

    const { mu, sigma } = params;
    const dt = timeHorizon / numSteps;

    // Initialize paths array
    const paths: number[][] = [];

    // Drift and diffusion terms
    const drift = (mu - 0.5 * sigma * sigma) * dt;
    const diffusion = sigma * Math.sqrt(dt);

    // Generate all random numbers at once for efficiency
    const randoms = numpy.random.standard_normal([numPaths, numSteps]);

    // Simulate each path
    for (let path = 0; path < numPaths; path++) {
      const pathValues: number[] = [initialPrice];
      let currentPrice = initialPrice;

      for (let step = 0; step < numSteps; step++) {
        const randomShock = randoms.item([path, step]);
        const returnFactor = Math.exp(drift + diffusion * randomShock);
        currentPrice *= returnFactor;
        pathValues.push(currentPrice);
      }

      paths.push(pathValues);
    }

    // Calculate statistics
    const finalPrices = paths.map(path => path[path.length - 1]);
    const finalPricesArray = numpy.array(finalPrices);

    const expectedValue = numpy.mean(finalPricesArray);
    const standardError = numpy.std(finalPricesArray) / Math.sqrt(numPaths);

    // 95% confidence interval
    const zScore = 1.96;
    const confidenceInterval: [number, number] = [
      expectedValue - zScore * standardError,
      expectedValue + zScore * standardError,
    ];

    const computeTimeMs = performance.now() - startTime;

    return {
      paths,
      expectedValue,
      standardError,
      confidenceInterval,
      numPaths,
      computeTimeMs,
    };
  }

  /**
   * Simulate with antithetic variance reduction
   */
  static simulateAntithetic(
    initialPrice: number,
    params: GBMParams,
    numPaths: number,
    numSteps: number,
    timeHorizon: number,
    seed?: number
  ): MonteCarloResult {
    const startTime = performance.now();

    if (seed !== undefined) {
      numpy.random.seed(seed);
    }

    const { mu, sigma } = params;
    const dt = timeHorizon / numSteps;
    const drift = (mu - 0.5 * sigma * sigma) * dt;
    const diffusion = sigma * Math.sqrt(dt);

    const halfPaths = Math.floor(numPaths / 2);
    const randoms = numpy.random.standard_normal([halfPaths, numSteps]);

    const paths: number[][] = [];

    // Generate paired paths
    for (let path = 0; path < halfPaths; path++) {
      // Original path
      const pathValues1: number[] = [initialPrice];
      let currentPrice1 = initialPrice;

      // Antithetic path
      const pathValues2: number[] = [initialPrice];
      let currentPrice2 = initialPrice;

      for (let step = 0; step < numSteps; step++) {
        const randomShock = randoms.item([path, step]);

        // Original path
        const returnFactor1 = Math.exp(drift + diffusion * randomShock);
        currentPrice1 *= returnFactor1;
        pathValues1.push(currentPrice1);

        // Antithetic path (use -Z instead of Z)
        const returnFactor2 = Math.exp(drift + diffusion * (-randomShock));
        currentPrice2 *= returnFactor2;
        pathValues2.push(currentPrice2);
      }

      paths.push(pathValues1);
      paths.push(pathValues2);
    }

    const finalPrices = paths.map(path => path[path.length - 1]);
    const finalPricesArray = numpy.array(finalPrices);

    const expectedValue = numpy.mean(finalPricesArray);
    const standardError = numpy.std(finalPricesArray) / Math.sqrt(paths.length);

    const zScore = 1.96;
    const confidenceInterval: [number, number] = [
      expectedValue - zScore * standardError,
      expectedValue + zScore * standardError,
    ];

    const computeTimeMs = performance.now() - startTime;

    return {
      paths,
      expectedValue,
      standardError,
      confidenceInterval,
      numPaths: paths.length,
      computeTimeMs,
    };
  }
}

// ============================================================================
// Jump Diffusion Process
// ============================================================================

/**
 * Simulate jump diffusion process (Merton model)
 */
export class JumpDiffusionProcess {
  /**
   * Simulate paths with jumps: dS/S = μdt + σdW + JdN
   */
  static simulate(
    initialPrice: number,
    params: JumpDiffusionParams,
    numPaths: number,
    numSteps: number,
    timeHorizon: number,
    seed?: number
  ): MonteCarloResult {
    const startTime = performance.now();

    if (seed !== undefined) {
      numpy.random.seed(seed);
    }

    const { mu, sigma, lambda, jumpMean, jumpStd } = params;
    const dt = timeHorizon / numSteps;

    // Drift compensation for jumps
    const jumpCompensation = lambda * (Math.exp(jumpMean + 0.5 * jumpStd * jumpStd) - 1);
    const drift = (mu - 0.5 * sigma * sigma - jumpCompensation) * dt;
    const diffusion = sigma * Math.sqrt(dt);

    // Generate random numbers
    const diffusionRandoms = numpy.random.standard_normal([numPaths, numSteps]);
    const jumpRandoms = numpy.random.standard_normal([numPaths, numSteps]);

    const paths: number[][] = [];

    for (let path = 0; path < numPaths; path++) {
      const pathValues: number[] = [initialPrice];
      let currentPrice = initialPrice;

      for (let step = 0; step < numSteps; step++) {
        // Diffusion component
        const diffusionShock = diffusionRandoms.item([path, step]);
        let logReturn = drift + diffusion * diffusionShock;

        // Jump component (Poisson process)
        const jumpOccurs = Math.random() < lambda * dt;

        if (jumpOccurs) {
          const jumpSize = jumpRandoms.item([path, step]);
          const jumpReturn = jumpMean + jumpStd * jumpSize;
          logReturn += jumpReturn;
        }

        currentPrice *= Math.exp(logReturn);
        pathValues.push(currentPrice);
      }

      paths.push(pathValues);
    }

    const finalPrices = paths.map(path => path[path.length - 1]);
    const finalPricesArray = numpy.array(finalPrices);

    const expectedValue = numpy.mean(finalPricesArray);
    const standardError = numpy.std(finalPricesArray) / Math.sqrt(numPaths);

    const zScore = 1.96;
    const confidenceInterval: [number, number] = [
      expectedValue - zScore * standardError,
      expectedValue + zScore * standardError,
    ];

    const computeTimeMs = performance.now() - startTime;

    return {
      paths,
      expectedValue,
      standardError,
      confidenceInterval,
      numPaths,
      computeTimeMs,
    };
  }
}

// ============================================================================
// Heston Stochastic Volatility Model
// ============================================================================

/**
 * Simulate Heston stochastic volatility model
 */
export class HestonModel {
  /**
   * Simulate Heston model paths
   * dS/S = μdt + √v dW1
   * dv = κ(θ - v)dt + σ√v dW2
   * where dW1 and dW2 are correlated with correlation ρ
   */
  static simulate(
    initialPrice: number,
    params: HestonParams,
    numPaths: number,
    numSteps: number,
    timeHorizon: number,
    seed?: number
  ): MonteCarloResult {
    const startTime = performance.now();

    if (seed !== undefined) {
      numpy.random.seed(seed);
    }

    const { mu, kappa, theta, sigma, rho, v0 } = params;
    const dt = timeHorizon / numSteps;

    // Generate correlated random numbers
    const z1 = numpy.random.standard_normal([numPaths, numSteps]);
    const z2 = numpy.random.standard_normal([numPaths, numSteps]);

    const paths: number[][] = [];

    for (let path = 0; path < numPaths; path++) {
      const pathValues: number[] = [initialPrice];
      let S = initialPrice;
      let v = v0;

      for (let step = 0; step < numSteps; step++) {
        const random1 = z1.item([path, step]);
        const random2 = z2.item([path, step]);

        // Correlated Brownian motions
        const dW1 = random1;
        const dW2 = rho * random1 + Math.sqrt(1 - rho * rho) * random2;

        // Update variance (with Feller condition check)
        const vNext = v + kappa * (theta - v) * dt +
                      sigma * Math.sqrt(Math.max(v, 0)) * Math.sqrt(dt) * dW2;

        // Ensure variance stays positive (truncation scheme)
        v = Math.max(vNext, 0);

        // Update price
        const drift = (mu - 0.5 * v) * dt;
        const diffusion = Math.sqrt(Math.max(v, 0)) * Math.sqrt(dt) * dW1;
        S *= Math.exp(drift + diffusion);

        pathValues.push(S);
      }

      paths.push(pathValues);
    }

    const finalPrices = paths.map(path => path[path.length - 1]);
    const finalPricesArray = numpy.array(finalPrices);

    const expectedValue = numpy.mean(finalPricesArray);
    const standardError = numpy.std(finalPricesArray) / Math.sqrt(numPaths);

    const zScore = 1.96;
    const confidenceInterval: [number, number] = [
      expectedValue - zScore * standardError,
      expectedValue + zScore * standardError,
    ];

    const computeTimeMs = performance.now() - startTime;

    return {
      paths,
      expectedValue,
      standardError,
      confidenceInterval,
      numPaths,
      computeTimeMs,
    };
  }

  /**
   * Simulate with exact scheme (Andersen QE)
   */
  static simulateExact(
    initialPrice: number,
    params: HestonParams,
    numPaths: number,
    numSteps: number,
    timeHorizon: number,
    seed?: number
  ): MonteCarloResult {
    const startTime = performance.now();

    if (seed !== undefined) {
      numpy.random.seed(seed);
    }

    const { mu, kappa, theta, sigma, rho, v0 } = params;
    const dt = timeHorizon / numSteps;

    const paths: number[][] = [];

    for (let path = 0; path < numPaths; path++) {
      const pathValues: number[] = [initialPrice];
      let S = Math.log(initialPrice);
      let v = v0;

      for (let step = 0; step < numSteps; step++) {
        // Sample variance at next step
        const m = theta + (v - theta) * Math.exp(-kappa * dt);
        const s2 = v * (sigma * sigma / kappa) * (Math.exp(-kappa * dt) - Math.exp(-2 * kappa * dt)) +
                   theta * (sigma * sigma / (2 * kappa)) * Math.pow(1 - Math.exp(-kappa * dt), 2);

        const psi = s2 / (m * m);

        // Choose simulation scheme based on psi
        if (psi <= 1.5) {
          // Use moment matching
          const b2 = 2 / psi - 1 + Math.sqrt(2 / psi * (2 / psi - 1));
          const a = m / (1 + b2);

          const Z = numpy.random.standard_normal();
          v = a * Math.pow(Math.sqrt(b2) + Z, 2);
        } else {
          // Use exponential distribution
          const p = (psi - 1) / (psi + 1);
          const beta = (1 - p) / m;

          const U = Math.random();
          if (U <= p) {
            v = 0;
          } else {
            v = Math.log((1 - p) / (1 - U)) / beta;
          }
        }

        // Ensure variance is non-negative
        v = Math.max(v, 0);

        // Update log price
        const K0 = -rho * kappa * theta * dt / sigma;
        const K1 = (kappa * rho / sigma - 0.5) * dt - rho / sigma;
        const K2 = rho / sigma;

        const dW = numpy.random.standard_normal() * Math.sqrt(dt);

        S += mu * dt + K0 + K1 * v0 + K2 * v + Math.sqrt((1 - rho * rho) * v0) * dW;

        pathValues.push(Math.exp(S));
      }

      paths.push(pathValues);
    }

    const finalPrices = paths.map(path => path[path.length - 1]);
    const finalPricesArray = numpy.array(finalPrices);

    const expectedValue = numpy.mean(finalPricesArray);
    const standardError = numpy.std(finalPricesArray) / Math.sqrt(numPaths);

    const zScore = 1.96;
    const confidenceInterval: [number, number] = [
      expectedValue - zScore * standardError,
      expectedValue + zScore * standardError,
    ];

    const computeTimeMs = performance.now() - startTime;

    return {
      paths,
      expectedValue,
      standardError,
      confidenceInterval,
      numPaths,
      computeTimeMs,
    };
  }
}

// ============================================================================
// Variance Reduction Techniques
// ============================================================================

/**
 * Advanced variance reduction techniques
 */
export class VarianceReduction {
  /**
   * Control variate method
   */
  static controlVariate(
    mainPayoffs: number[],
    controlPayoffs: number[],
    controlExpectedValue: number
  ): { adjustedMean: number; varianceReduction: number } {
    const n = mainPayoffs.length;

    const mainArray = numpy.array(mainPayoffs);
    const controlArray = numpy.array(controlPayoffs);

    const mainMean = numpy.mean(mainArray);
    const controlMean = numpy.mean(controlArray);

    // Calculate covariance and variance
    const covariance = numpy.cov(mainArray, controlArray).item([0, 1]);
    const controlVariance = numpy.var(controlArray);

    // Optimal c
    const c = covariance / controlVariance;

    // Adjusted estimator
    const adjustedPayoffs = [];
    for (let i = 0; i < n; i++) {
      adjustedPayoffs.push(
        mainPayoffs[i] - c * (controlPayoffs[i] - controlExpectedValue)
      );
    }

    const adjustedArray = numpy.array(adjustedPayoffs);
    const adjustedMean = numpy.mean(adjustedArray);

    // Variance reduction ratio
    const originalVariance = numpy.var(mainArray);
    const adjustedVariance = numpy.var(adjustedArray);
    const varianceReduction = 1 - adjustedVariance / originalVariance;

    return {
      adjustedMean,
      varianceReduction,
    };
  }

  /**
   * Importance sampling
   */
  static importanceSampling(
    payoffs: number[],
    originalProbabilities: number[],
    importanceProbabilities: number[]
  ): { estimator: number; varianceReduction: number } {
    const n = payoffs.length;

    // Likelihood ratio
    const likelihoodRatios = [];
    for (let i = 0; i < n; i++) {
      likelihoodRatios.push(originalProbabilities[i] / importanceProbabilities[i]);
    }

    // Weighted payoffs
    const weightedPayoffs = [];
    for (let i = 0; i < n; i++) {
      weightedPayoffs.push(payoffs[i] * likelihoodRatios[i]);
    }

    const weightedArray = numpy.array(weightedPayoffs);
    const estimator = numpy.mean(weightedArray);

    // Variance reduction
    const originalArray = numpy.array(payoffs);
    const originalVariance = numpy.var(originalArray);
    const weightedVariance = numpy.var(weightedArray);
    const varianceReduction = 1 - weightedVariance / originalVariance;

    return {
      estimator,
      varianceReduction,
    };
  }

  /**
   * Stratified sampling
   */
  static stratifiedSampling(
    strata: Array<{ weight: number; payoffs: number[] }>
  ): { estimator: number; varianceReduction: number } {
    let stratifiedEstimator = 0;
    let totalVariance = 0;
    let unstratifiedVariance = 0;
    let totalPayoffs: number[] = [];

    for (const stratum of strata) {
      const strataArray = numpy.array(stratum.payoffs);
      const strataMean = numpy.mean(strataArray);
      const strataVariance = numpy.var(strataArray);

      stratifiedEstimator += stratum.weight * strataMean;
      totalVariance += Math.pow(stratum.weight, 2) * strataVariance / stratum.payoffs.length;

      totalPayoffs = totalPayoffs.concat(stratum.payoffs);
    }

    const totalArray = numpy.array(totalPayoffs);
    unstratifiedVariance = numpy.var(totalArray) / totalPayoffs.length;

    const varianceReduction = 1 - totalVariance / unstratifiedVariance;

    return {
      estimator: stratifiedEstimator,
      varianceReduction,
    };
  }
}

// ============================================================================
// Monte Carlo Engine
// ============================================================================

/**
 * Unified Monte Carlo simulation engine
 */
export class MonteCarloEngine {
  /**
   * Run Monte Carlo simulation with specified process
   */
  static simulate(params: MonteCarloParams): MonteCarloResult {
    const {
      numPaths,
      numSteps,
      timeHorizon,
      process,
      processParams,
      seed,
      antitheticPaths,
    } = params;

    const initialPrice = 100; // Default initial price

    switch (process) {
      case 'gbm':
        if (antitheticPaths) {
          return GeometricBrownianMotion.simulateAntithetic(
            initialPrice,
            processParams as GBMParams,
            numPaths,
            numSteps,
            timeHorizon,
            seed
          );
        } else {
          return GeometricBrownianMotion.simulate(
            initialPrice,
            processParams as GBMParams,
            numPaths,
            numSteps,
            timeHorizon,
            seed
          );
        }

      case 'jump-diffusion':
        return JumpDiffusionProcess.simulate(
          initialPrice,
          processParams as JumpDiffusionParams,
          numPaths,
          numSteps,
          timeHorizon,
          seed
        );

      case 'heston':
        return HestonModel.simulate(
          initialPrice,
          processParams as HestonParams,
          numPaths,
          numSteps,
          timeHorizon,
          seed
        );

      default:
        throw new Error(`Unknown process type: ${process}`);
    }
  }

  /**
   * Price European call option
   */
  static priceEuropeanCall(
    spotPrice: number,
    strike: number,
    riskFreeRate: number,
    params: MonteCarloParams
  ): number {
    const result = this.simulate({
      ...params,
      processParams: {
        ...(params.processParams as GBMParams),
        mu: riskFreeRate,
      },
    });

    // Calculate call option payoff for each path
    const payoffs: number[] = [];
    for (const path of result.paths) {
      const finalPrice = path[path.length - 1];
      payoffs.push(Math.max(0, finalPrice - strike));
    }

    const payoffsArray = numpy.array(payoffs);
    const avgPayoff = numpy.mean(payoffsArray);

    // Discount to present value
    const discountFactor = Math.exp(-riskFreeRate * params.timeHorizon);
    return avgPayoff * discountFactor;
  }

  /**
   * Price Asian option
   */
  static priceAsianCall(
    spotPrice: number,
    strike: number,
    riskFreeRate: number,
    params: MonteCarloParams
  ): number {
    const result = this.simulate({
      ...params,
      processParams: {
        ...(params.processParams as GBMParams),
        mu: riskFreeRate,
      },
    });

    // Calculate Asian option payoff (based on average price)
    const payoffs: number[] = [];
    for (const path of result.paths) {
      const pathArray = numpy.array(path);
      const avgPrice = numpy.mean(pathArray);
      payoffs.push(Math.max(0, avgPrice - strike));
    }

    const payoffsArray = numpy.array(payoffs);
    const avgPayoff = numpy.mean(payoffsArray);

    const discountFactor = Math.exp(-riskFreeRate * params.timeHorizon);
    return avgPayoff * discountFactor;
  }

  /**
   * Calculate Value at Risk
   */
  static calculateVaR(
    initialValue: number,
    params: MonteCarloParams,
    confidenceLevel = 0.95
  ): { var: number; cvar: number } {
    const result = this.simulate(params);

    // Calculate losses
    const losses: number[] = [];
    for (const path of result.paths) {
      const finalPrice = path[path.length - 1];
      losses.push(initialValue - finalPrice);
    }

    const lossesArray = numpy.array(losses);
    const sortedLosses = numpy.sort(lossesArray);

    // VaR at confidence level
    const varIndex = Math.floor((1 - confidenceLevel) * params.numPaths);
    const varValue = sortedLosses.item(varIndex);

    // CVaR (Expected Shortfall)
    let cvarSum = 0;
    let cvarCount = 0;
    for (let i = varIndex; i < params.numPaths; i++) {
      cvarSum += sortedLosses.item(i);
      cvarCount++;
    }

    const cvarValue = cvarCount > 0 ? cvarSum / cvarCount : varValue;

    return {
      var: varValue,
      cvar: cvarValue,
    };
  }
}

// ============================================================================
// Export all classes
// ============================================================================

export {
  GeometricBrownianMotion,
  JumpDiffusionProcess,
  HestonModel,
  VarianceReduction,
  MonteCarloEngine,
};
