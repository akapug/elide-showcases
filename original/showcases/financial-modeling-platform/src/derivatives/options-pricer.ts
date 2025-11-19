/**
 * Options Pricing Engine
 *
 * Advanced options pricing using multiple models:
 * - Black-Scholes closed-form solution
 * - Binomial tree method (Cox-Ross-Rubinstein)
 * - Monte Carlo simulation
 *
 * Leverages Elide's polyglot capabilities to use Python's numpy and scipy
 * for efficient numerical computations.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import { norm, stats } from 'python:scipy';

import type {
  OptionType,
  OptionPricingParams,
  OptionPricingResult,
  OptionGreeks,
  OptionContract,
} from '../types.js';

// ============================================================================
// Black-Scholes Model
// ============================================================================

/**
 * Calculate option price using Black-Scholes formula
 *
 * The Black-Scholes model provides a closed-form solution for European
 * option pricing under the assumptions of constant volatility, no dividends,
 * and log-normal price distribution.
 */
export class BlackScholesModel {
  /**
   * Price European option using Black-Scholes formula
   */
  static price(params: OptionPricingParams): number {
    const { spotPrice, strike, timeToMaturity, riskFreeRate, volatility, dividendYield = 0, optionType } = params;

    if (timeToMaturity <= 0) {
      return this.intrinsicValue(spotPrice, strike, optionType);
    }

    const d1 = this.calculateD1(spotPrice, strike, timeToMaturity, riskFreeRate, volatility, dividendYield);
    const d2 = this.calculateD2(d1, volatility, timeToMaturity);

    // Use scipy's cumulative normal distribution
    const normCdf = (x: number) => norm.cdf(x);

    if (optionType === 'call') {
      const callPrice =
        spotPrice * Math.exp(-dividendYield * timeToMaturity) * normCdf(d1) -
        strike * Math.exp(-riskFreeRate * timeToMaturity) * normCdf(d2);
      return callPrice;
    } else {
      const putPrice =
        strike * Math.exp(-riskFreeRate * timeToMaturity) * normCdf(-d2) -
        spotPrice * Math.exp(-dividendYield * timeToMaturity) * normCdf(-d1);
      return putPrice;
    }
  }

  /**
   * Calculate all Greeks for an option
   */
  static calculateGreeks(params: OptionPricingParams): OptionGreeks {
    const { spotPrice, strike, timeToMaturity, riskFreeRate, volatility, dividendYield = 0, optionType } = params;

    if (timeToMaturity <= 0) {
      return {
        delta: 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0,
      };
    }

    const d1 = this.calculateD1(spotPrice, strike, timeToMaturity, riskFreeRate, volatility, dividendYield);
    const d2 = this.calculateD2(d1, volatility, timeToMaturity);

    // Use scipy for probability density and cumulative distribution
    const normPdf = (x: number) => norm.pdf(x);
    const normCdf = (x: number) => norm.cdf(x);

    // Delta
    let delta: number;
    if (optionType === 'call') {
      delta = Math.exp(-dividendYield * timeToMaturity) * normCdf(d1);
    } else {
      delta = -Math.exp(-dividendYield * timeToMaturity) * normCdf(-d1);
    }

    // Gamma (same for call and put)
    const gamma =
      (Math.exp(-dividendYield * timeToMaturity) * normPdf(d1)) /
      (spotPrice * volatility * Math.sqrt(timeToMaturity));

    // Vega (same for call and put)
    const vega = spotPrice * Math.exp(-dividendYield * timeToMaturity) * normPdf(d1) * Math.sqrt(timeToMaturity) / 100;

    // Theta
    let theta: number;
    const term1 = -(spotPrice * normPdf(d1) * volatility * Math.exp(-dividendYield * timeToMaturity)) /
      (2 * Math.sqrt(timeToMaturity));

    if (optionType === 'call') {
      const term2 = riskFreeRate * strike * Math.exp(-riskFreeRate * timeToMaturity) * normCdf(d2);
      const term3 = dividendYield * spotPrice * Math.exp(-dividendYield * timeToMaturity) * normCdf(d1);
      theta = (term1 - term2 + term3) / 365;
    } else {
      const term2 = riskFreeRate * strike * Math.exp(-riskFreeRate * timeToMaturity) * normCdf(-d2);
      const term3 = dividendYield * spotPrice * Math.exp(-dividendYield * timeToMaturity) * normCdf(-d1);
      theta = (term1 + term2 - term3) / 365;
    }

    // Rho
    let rho: number;
    if (optionType === 'call') {
      rho = strike * timeToMaturity * Math.exp(-riskFreeRate * timeToMaturity) * normCdf(d2) / 100;
    } else {
      rho = -strike * timeToMaturity * Math.exp(-riskFreeRate * timeToMaturity) * normCdf(-d2) / 100;
    }

    return { delta, gamma, theta, vega, rho };
  }

  /**
   * Calculate implied volatility using Newton-Raphson method
   */
  static impliedVolatility(
    marketPrice: number,
    params: Omit<OptionPricingParams, 'volatility'>,
    initialGuess = 0.3,
    tolerance = 1e-6,
    maxIterations = 100
  ): number {
    let sigma = initialGuess;

    for (let i = 0; i < maxIterations; i++) {
      const fullParams = { ...params, volatility: sigma };
      const price = this.price(fullParams);
      const vega = this.calculateGreeks(fullParams).vega;

      const diff = price - marketPrice;

      if (Math.abs(diff) < tolerance) {
        return sigma;
      }

      if (Math.abs(vega) < 1e-10) {
        throw new Error('Vega too small, cannot converge');
      }

      // Newton-Raphson update
      sigma = sigma - diff / (vega * 100);

      // Keep volatility positive
      if (sigma <= 0) {
        sigma = initialGuess / 2;
      }
    }

    throw new Error('Implied volatility did not converge');
  }

  private static calculateD1(
    spot: number,
    strike: number,
    time: number,
    rate: number,
    vol: number,
    div: number
  ): number {
    return (Math.log(spot / strike) + (rate - div + 0.5 * vol * vol) * time) / (vol * Math.sqrt(time));
  }

  private static calculateD2(d1: number, vol: number, time: number): number {
    return d1 - vol * Math.sqrt(time);
  }

  private static intrinsicValue(spot: number, strike: number, type: OptionType): number {
    if (type === 'call') {
      return Math.max(0, spot - strike);
    } else {
      return Math.max(0, strike - spot);
    }
  }
}

// ============================================================================
// Binomial Tree Model (Cox-Ross-Rubinstein)
// ============================================================================

/**
 * Price options using binomial tree method
 *
 * The binomial tree model discretizes the time to maturity into steps
 * and models the underlying asset price as a recombining tree.
 * This method can handle American options with early exercise.
 */
export class BinomialTreeModel {
  /**
   * Price option using binomial tree
   */
  static price(
    params: OptionPricingParams,
    numSteps = 100,
    american = false
  ): number {
    const { spotPrice, strike, timeToMaturity, riskFreeRate, volatility, dividendYield = 0, optionType } = params;

    if (timeToMaturity <= 0) {
      return this.intrinsicValue(spotPrice, strike, optionType);
    }

    const dt = timeToMaturity / numSteps;
    const u = Math.exp(volatility * Math.sqrt(dt)); // up factor
    const d = 1 / u; // down factor
    const a = Math.exp((riskFreeRate - dividendYield) * dt);
    const p = (a - d) / (u - d); // risk-neutral probability
    const discount = Math.exp(-riskFreeRate * dt);

    // Build price tree using numpy for efficiency
    const spotPrices = numpy.zeros(numSteps + 1);

    for (let i = 0; i <= numSteps; i++) {
      const numUps = numSteps - i;
      const numDowns = i;
      spotPrices.itemset(i, spotPrice * Math.pow(u, numUps) * Math.pow(d, numDowns));
    }

    // Calculate option values at maturity
    const optionValues = numpy.zeros(numSteps + 1);

    for (let i = 0; i <= numSteps; i++) {
      const spot = spotPrices.item(i);
      optionValues.itemset(i, this.intrinsicValue(spot, strike, optionType));
    }

    // Backward induction through the tree
    for (let step = numSteps - 1; step >= 0; step--) {
      for (let i = 0; i <= step; i++) {
        // Expected value under risk-neutral measure
        const holdValue = discount * (p * optionValues.item(i) + (1 - p) * optionValues.item(i + 1));

        if (american) {
          // For American options, compare with early exercise value
          const spot = spotPrice * Math.pow(u, step - i) * Math.pow(d, i);
          const exerciseValue = this.intrinsicValue(spot, strike, optionType);
          optionValues.itemset(i, Math.max(holdValue, exerciseValue));
        } else {
          optionValues.itemset(i, holdValue);
        }
      }
    }

    return optionValues.item(0);
  }

  /**
   * Calculate Greeks using finite differences
   */
  static calculateGreeks(
    params: OptionPricingParams,
    numSteps = 100,
    american = false
  ): OptionGreeks {
    const basePrice = this.price(params, numSteps, american);
    const bump = 0.01; // 1% bump for numerical derivatives

    // Delta: dV/dS
    const upSpot = { ...params, spotPrice: params.spotPrice * (1 + bump) };
    const downSpot = { ...params, spotPrice: params.spotPrice * (1 - bump) };
    const delta = (this.price(upSpot, numSteps, american) - this.price(downSpot, numSteps, american)) /
      (2 * params.spotPrice * bump);

    // Gamma: d²V/dS²
    const gamma = (this.price(upSpot, numSteps, american) - 2 * basePrice + this.price(downSpot, numSteps, american)) /
      Math.pow(params.spotPrice * bump, 2);

    // Vega: dV/dσ
    const upVol = { ...params, volatility: params.volatility + 0.01 };
    const downVol = { ...params, volatility: params.volatility - 0.01 };
    const vega = (this.price(upVol, numSteps, american) - this.price(downVol, numSteps, american)) / 2;

    // Theta: dV/dt
    const upTime = { ...params, timeToMaturity: params.timeToMaturity + 1/365 };
    const downTime = { ...params, timeToMaturity: Math.max(0.001, params.timeToMaturity - 1/365) };
    const theta = -(this.price(upTime, numSteps, american) - this.price(downTime, numSteps, american)) /
      (2 / 365);

    // Rho: dV/dr
    const upRate = { ...params, riskFreeRate: params.riskFreeRate + 0.01 };
    const downRate = { ...params, riskFreeRate: params.riskFreeRate - 0.01 };
    const rho = (this.price(upRate, numSteps, american) - this.price(downRate, numSteps, american)) / 2;

    return { delta, gamma, theta, vega, rho };
  }

  private static intrinsicValue(spot: number, strike: number, type: OptionType): number {
    if (type === 'call') {
      return Math.max(0, spot - strike);
    } else {
      return Math.max(0, strike - spot);
    }
  }
}

// ============================================================================
// Monte Carlo Simulation
// ============================================================================

/**
 * Price options using Monte Carlo simulation
 *
 * Simulates many possible price paths for the underlying asset
 * and calculates the expected payoff. Works for both European
 * and path-dependent options.
 */
export class MonteCarloOptionPricer {
  /**
   * Price European option using Monte Carlo
   */
  static price(
    params: OptionPricingParams,
    numPaths = 100000,
    numSteps = 252,
    useAntithetic = true,
    seed?: number
  ): number {
    const { spotPrice, strike, timeToMaturity, riskFreeRate, volatility, dividendYield = 0, optionType } = params;

    if (timeToMaturity <= 0) {
      return this.intrinsicValue(spotPrice, strike, optionType);
    }

    // Set random seed for reproducibility
    if (seed !== undefined) {
      numpy.random.seed(seed);
    }

    const dt = timeToMaturity / numSteps;
    const drift = (riskFreeRate - dividendYield - 0.5 * volatility * volatility) * dt;
    const diffusion = volatility * Math.sqrt(dt);

    // Generate random paths
    const actualPaths = useAntithetic ? Math.floor(numPaths / 2) : numPaths;

    // Generate standard normal random numbers
    const randoms = numpy.random.standard_normal([actualPaths, numSteps]);

    // Initialize price paths
    let paths = numpy.ones([actualPaths, numSteps + 1]).multiply(spotPrice);

    // Simulate price paths using Geometric Brownian Motion
    for (let step = 0; step < numSteps; step++) {
      const randomSlice = randoms['__getitem__']([numpy.s_['::'], step]);
      const returns = numpy.exp(drift + diffusion * randomSlice);

      for (let path = 0; path < actualPaths; path++) {
        const currentPrice = paths.item([path, step]);
        const returnFactor = returns.item(path);
        paths.itemset([path, step + 1], currentPrice * returnFactor);
      }
    }

    // Calculate payoffs at maturity
    const finalPrices = paths['__getitem__']([numpy.s_['::'], -1]);
    let payoffs: any;

    if (optionType === 'call') {
      payoffs = numpy.maximum(finalPrices.subtract(strike), 0);
    } else {
      payoffs = numpy.maximum(strike - finalPrices, 0);
    }

    // Apply antithetic variates if enabled
    if (useAntithetic) {
      // Simulate antithetic paths (use -Z instead of Z)
      const antitheticRandoms = randoms.multiply(-1);
      let antitheticPaths = numpy.ones([actualPaths, numSteps + 1]).multiply(spotPrice);

      for (let step = 0; step < numSteps; step++) {
        const randomSlice = antitheticRandoms['__getitem__']([numpy.s_['::'], step]);
        const returns = numpy.exp(drift + diffusion * randomSlice);

        for (let path = 0; path < actualPaths; path++) {
          const currentPrice = antitheticPaths.item([path, step]);
          const returnFactor = returns.item(path);
          antitheticPaths.itemset([path, step + 1], currentPrice * returnFactor);
        }
      }

      const antitheticFinalPrices = antitheticPaths['__getitem__']([numpy.s_['::'], -1]);
      let antitheticPayoffs: any;

      if (optionType === 'call') {
        antitheticPayoffs = numpy.maximum(antitheticFinalPrices.subtract(strike), 0);
      } else {
        antitheticPayoffs = numpy.maximum(strike - antitheticFinalPrices, 0);
      }

      // Average the payoffs
      payoffs = payoffs.add(antitheticPayoffs).divide(2);
    }

    // Calculate discounted expected payoff
    const meanPayoff = numpy.mean(payoffs);
    const discountFactor = Math.exp(-riskFreeRate * timeToMaturity);

    return discountFactor * meanPayoff;
  }

  /**
   * Price Asian option (path-dependent)
   */
  static priceAsianOption(
    params: OptionPricingParams,
    averageType: 'arithmetic' | 'geometric',
    numPaths = 100000,
    numSteps = 252,
    seed?: number
  ): number {
    const { spotPrice, strike, timeToMaturity, riskFreeRate, volatility, dividendYield = 0, optionType } = params;

    if (seed !== undefined) {
      numpy.random.seed(seed);
    }

    const dt = timeToMaturity / numSteps;
    const drift = (riskFreeRate - dividendYield - 0.5 * volatility * volatility) * dt;
    const diffusion = volatility * Math.sqrt(dt);

    const randoms = numpy.random.standard_normal([numPaths, numSteps]);
    let paths = numpy.ones([numPaths, numSteps + 1]).multiply(spotPrice);

    // Simulate paths
    for (let step = 0; step < numSteps; step++) {
      const randomSlice = randoms['__getitem__']([numpy.s_['::'], step]);
      const returns = numpy.exp(drift + diffusion * randomSlice);

      for (let path = 0; path < numPaths; path++) {
        const currentPrice = paths.item([path, step]);
        const returnFactor = returns.item(path);
        paths.itemset([path, step + 1], currentPrice * returnFactor);
      }
    }

    // Calculate average price for each path
    let averagePrices: any;

    if (averageType === 'arithmetic') {
      averagePrices = numpy.mean(paths, 1);
    } else {
      // Geometric average
      const logPaths = numpy.log(paths);
      const meanLogPaths = numpy.mean(logPaths, 1);
      averagePrices = numpy.exp(meanLogPaths);
    }

    // Calculate payoffs based on average price
    let payoffs: any;
    if (optionType === 'call') {
      payoffs = numpy.maximum(averagePrices.subtract(strike), 0);
    } else {
      payoffs = numpy.maximum(strike - averagePrices, 0);
    }

    const meanPayoff = numpy.mean(payoffs);
    const discountFactor = Math.exp(-riskFreeRate * timeToMaturity);

    return discountFactor * meanPayoff;
  }

  /**
   * Price barrier option
   */
  static priceBarrierOption(
    params: OptionPricingParams,
    barrierLevel: number,
    barrierType: 'up-and-out' | 'up-and-in' | 'down-and-out' | 'down-and-in',
    numPaths = 100000,
    numSteps = 252,
    seed?: number
  ): number {
    const { spotPrice, strike, timeToMaturity, riskFreeRate, volatility, dividendYield = 0, optionType } = params;

    if (seed !== undefined) {
      numpy.random.seed(seed);
    }

    const dt = timeToMaturity / numSteps;
    const drift = (riskFreeRate - dividendYield - 0.5 * volatility * volatility) * dt;
    const diffusion = volatility * Math.sqrt(dt);

    const randoms = numpy.random.standard_normal([numPaths, numSteps]);
    let paths = numpy.ones([numPaths, numSteps + 1]).multiply(spotPrice);

    // Track barrier hits
    const barrierHit = new Array(numPaths).fill(false);

    // Simulate paths and check barrier
    for (let step = 0; step < numSteps; step++) {
      const randomSlice = randoms['__getitem__']([numpy.s_['::'], step]);
      const returns = numpy.exp(drift + diffusion * randomSlice);

      for (let path = 0; path < numPaths; path++) {
        const currentPrice = paths.item([path, step]);
        const returnFactor = returns.item(path);
        const nextPrice = currentPrice * returnFactor;
        paths.itemset([path, step + 1], nextPrice);

        // Check barrier condition
        if (barrierType.startsWith('up') && nextPrice >= barrierLevel) {
          barrierHit[path] = true;
        } else if (barrierType.startsWith('down') && nextPrice <= barrierLevel) {
          barrierHit[path] = true;
        }
      }
    }

    // Calculate payoffs
    const finalPrices = paths['__getitem__']([numpy.s_['::'], -1]);
    const payoffs = numpy.zeros(numPaths);

    for (let path = 0; path < numPaths; path++) {
      const finalPrice = finalPrices.item(path);
      let intrinsic = 0;

      if (optionType === 'call') {
        intrinsic = Math.max(0, finalPrice - strike);
      } else {
        intrinsic = Math.max(0, strike - finalPrice);
      }

      // Apply barrier logic
      const isKnockedOut = barrierType.endsWith('out') && barrierHit[path];
      const isKnockedIn = barrierType.endsWith('in') && barrierHit[path];
      const notKnockedIn = barrierType.endsWith('in') && !barrierHit[path];

      if (isKnockedOut || notKnockedIn) {
        payoffs.itemset(path, 0);
      } else {
        payoffs.itemset(path, intrinsic);
      }
    }

    const meanPayoff = numpy.mean(payoffs);
    const discountFactor = Math.exp(-riskFreeRate * timeToMaturity);

    return discountFactor * meanPayoff;
  }

  /**
   * Calculate Greeks using finite differences
   */
  static calculateGreeks(
    params: OptionPricingParams,
    numPaths = 100000,
    numSteps = 252,
    seed?: number
  ): OptionGreeks {
    const basePrice = this.price(params, numPaths, numSteps, true, seed);
    const bump = 0.01;

    // Use same seed for consistent comparison
    const upSpot = { ...params, spotPrice: params.spotPrice * (1 + bump) };
    const downSpot = { ...params, spotPrice: params.spotPrice * (1 - bump) };
    const delta = (this.price(upSpot, numPaths, numSteps, true, seed) -
                   this.price(downSpot, numPaths, numSteps, true, seed)) /
      (2 * params.spotPrice * bump);

    const gamma = (this.price(upSpot, numPaths, numSteps, true, seed) -
                   2 * basePrice +
                   this.price(downSpot, numPaths, numSteps, true, seed)) /
      Math.pow(params.spotPrice * bump, 2);

    const upVol = { ...params, volatility: params.volatility + 0.01 };
    const vega = (this.price(upVol, numPaths, numSteps, true, seed) - basePrice) / 0.01;

    const upTime = { ...params, timeToMaturity: params.timeToMaturity + 1/365 };
    const theta = -(this.price(upTime, numPaths, numSteps, true, seed) - basePrice) / (1/365);

    const upRate = { ...params, riskFreeRate: params.riskFreeRate + 0.01 };
    const rho = (this.price(upRate, numPaths, numSteps, true, seed) - basePrice) / 0.01;

    return { delta, gamma, theta, vega, rho };
  }

  private static intrinsicValue(spot: number, strike: number, type: OptionType): number {
    if (type === 'call') {
      return Math.max(0, spot - strike);
    } else {
      return Math.max(0, strike - spot);
    }
  }
}

// ============================================================================
// Unified Options Pricing Engine
// ============================================================================

/**
 * High-level options pricing engine that selects the appropriate model
 */
export class OptionsPricingEngine {
  /**
   * Price an option using the specified method
   */
  static async priceOption(
    contract: OptionContract,
    spotPrice: number,
    riskFreeRate: number,
    volatility: number,
    method: 'black-scholes' | 'binomial' | 'monte-carlo' = 'black-scholes',
    dividendYield = 0
  ): Promise<OptionPricingResult> {
    const startTime = performance.now();

    const timeToMaturity = this.calculateTimeToMaturity(contract.expiry);

    const params: OptionPricingParams = {
      spotPrice,
      strike: contract.strike,
      timeToMaturity,
      riskFreeRate,
      volatility,
      dividendYield,
      optionType: contract.type,
    };

    let price: number;
    let greeks: OptionGreeks;

    switch (method) {
      case 'black-scholes':
        if (contract.style !== 'european') {
          throw new Error('Black-Scholes only supports European options');
        }
        price = BlackScholesModel.price(params);
        greeks = BlackScholesModel.calculateGreeks(params);
        break;

      case 'binomial':
        const isAmerican = contract.style === 'american';
        price = BinomialTreeModel.price(params, 200, isAmerican);
        greeks = BinomialTreeModel.calculateGreeks(params, 200, isAmerican);
        break;

      case 'monte-carlo':
        if (contract.style !== 'european') {
          throw new Error('Basic Monte Carlo only supports European options');
        }
        price = MonteCarloOptionPricer.price(params, 100000, 252, true);
        greeks = MonteCarloOptionPricer.calculateGreeks(params, 100000, 252);
        break;

      default:
        throw new Error(`Unknown pricing method: ${method}`);
    }

    const computeTimeMs = performance.now() - startTime;

    return {
      price,
      greeks,
      method,
      computeTimeMs,
    };
  }

  /**
   * Calculate implied volatility from market price
   */
  static calculateImpliedVolatility(
    contract: OptionContract,
    marketPrice: number,
    spotPrice: number,
    riskFreeRate: number,
    dividendYield = 0
  ): number {
    const timeToMaturity = this.calculateTimeToMaturity(contract.expiry);

    const params = {
      spotPrice,
      strike: contract.strike,
      timeToMaturity,
      riskFreeRate,
      dividendYield,
      optionType: contract.type,
    };

    return BlackScholesModel.impliedVolatility(marketPrice, params);
  }

  /**
   * Batch price multiple options
   */
  static async batchPrice(
    contracts: OptionContract[],
    spotPrices: Map<string, number>,
    riskFreeRate: number,
    volatilities: Map<string, number>,
    method: 'black-scholes' | 'binomial' | 'monte-carlo' = 'black-scholes',
    dividendYields?: Map<string, number>
  ): Promise<OptionPricingResult[]> {
    const results: OptionPricingResult[] = [];

    for (const contract of contracts) {
      const spotPrice = spotPrices.get(contract.underlying);
      const volatility = volatilities.get(contract.underlying);

      if (spotPrice === undefined || volatility === undefined) {
        throw new Error(`Missing market data for ${contract.underlying}`);
      }

      const dividendYield = dividendYields?.get(contract.underlying) || 0;

      const result = await this.priceOption(
        contract,
        spotPrice,
        riskFreeRate,
        volatility,
        method,
        dividendYield
      );

      results.push(result);
    }

    return results;
  }

  private static calculateTimeToMaturity(expiry: Date): number {
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays / 365; // Convert to years
  }
}

// ============================================================================
// Export all models
// ============================================================================

export {
  BlackScholesModel,
  BinomialTreeModel,
  MonteCarloOptionPricer,
  OptionsPricingEngine,
};
