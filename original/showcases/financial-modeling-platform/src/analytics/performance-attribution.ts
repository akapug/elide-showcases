/**
 * Performance Attribution Analysis
 *
 * Analyze portfolio performance and attribute returns to various factors:
 * - Brinson attribution (allocation, selection, interaction)
 * - Factor-based attribution (CAPM, Fama-French, etc.)
 * - Risk-adjusted performance metrics
 *
 * Uses numpy and pandas for statistical analysis.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import { stats } from 'python:scipy';

import type {
  PerformanceAttribution,
  AttributionFactors,
  FactorExposure,
  FactorModelType,
  FactorReturns,
  Portfolio,
  Position,
  PerformanceMetrics,
} from '../types.js';

// ============================================================================
// Brinson Attribution
// ============================================================================

/**
 * Brinson-Fachler attribution analysis
 */
export class BrinsonAttribution {
  /**
   * Calculate attribution effects
   */
  static analyze(
    portfolioWeights: Map<string, number>,
    benchmarkWeights: Map<string, number>,
    portfolioReturns: Map<string, number>,
    benchmarkReturns: Map<string, number>
  ): AttributionFactors {
    const assets = Array.from(portfolioWeights.keys());

    let allocationEffect = 0;
    let selectionEffect = 0;
    let interactionEffect = 0;

    for (const asset of assets) {
      const wp = portfolioWeights.get(asset) || 0;
      const wb = benchmarkWeights.get(asset) || 0;
      const rp = portfolioReturns.get(asset) || 0;
      const rb = benchmarkReturns.get(asset) || 0;

      // Allocation effect: (wp - wb) * rb
      allocationEffect += (wp - wb) * rb;

      // Selection effect: wb * (rp - rb)
      selectionEffect += wb * (rp - rb);

      // Interaction effect: (wp - wb) * (rp - rb)
      interactionEffect += (wp - wb) * (rp - rb);
    }

    // Calculate market effect (benchmark return)
    const benchmarkReturn = Array.from(benchmarkWeights.entries())
      .reduce((sum, [asset, weight]) => {
        const ret = benchmarkReturns.get(asset) || 0;
        return sum + weight * ret;
      }, 0);

    return {
      market: benchmarkReturn,
      sector: allocationEffect,
      security: selectionEffect,
      timing: 0, // Simplified - timing requires time series analysis
      interaction: interactionEffect,
    };
  }

  /**
   * Multi-period attribution
   */
  static multiPeriodAttribution(
    portfolioWeightsSeries: Array<Map<string, number>>,
    benchmarkWeightsSeries: Array<Map<string, number>>,
    portfolioReturnsSeries: Array<Map<string, number>>,
    benchmarkReturnsSeries: Array<Map<string, number>>
  ): AttributionFactors[] {
    const periods = portfolioWeightsSeries.length;
    const attributions: AttributionFactors[] = [];

    for (let t = 0; t < periods; t++) {
      const attribution = this.analyze(
        portfolioWeightsSeries[t],
        benchmarkWeightsSeries[t],
        portfolioReturnsSeries[t],
        benchmarkReturnsSeries[t]
      );
      attributions.push(attribution);
    }

    return attributions;
  }

  /**
   * Sector attribution
   */
  static sectorAttribution(
    portfolioWeightsBySector: Map<string, number>,
    benchmarkWeightsBySector: Map<string, number>,
    portfolioReturnsBySector: Map<string, number>,
    benchmarkReturnsBySector: Map<string, number>
  ): Map<string, { allocation: number; selection: number; total: number }> {
    const sectors = Array.from(portfolioWeightsBySector.keys());
    const results = new Map<string, { allocation: number; selection: number; total: number }>();

    for (const sector of sectors) {
      const wp = portfolioWeightsBySector.get(sector) || 0;
      const wb = benchmarkWeightsBySector.get(sector) || 0;
      const rp = portfolioReturnsBySector.get(sector) || 0;
      const rb = benchmarkReturnsBySector.get(sector) || 0;

      const benchmarkReturn = Array.from(benchmarkWeightsBySector.entries())
        .reduce((sum, [s, weight]) => {
          const ret = benchmarkReturnsBySector.get(s) || 0;
          return sum + weight * ret;
        }, 0);

      const allocation = (wp - wb) * (rb - benchmarkReturn);
      const selection = wb * (rp - rb);
      const total = allocation + selection;

      results.set(sector, { allocation, selection, total });
    }

    return results;
  }
}

// ============================================================================
// Factor-Based Attribution
// ============================================================================

/**
 * Factor attribution using regression analysis
 */
export class FactorAttribution {
  /**
   * Perform factor attribution using linear regression
   */
  static analyze(
    portfolioReturns: number[],
    factorReturns: FactorReturns,
    riskFreeRate = 0.02
  ): PerformanceAttribution {
    const excessReturns = portfolioReturns.map(r => r - riskFreeRate / 252);
    const y = numpy.array(excessReturns);

    // Build factor matrix
    const factors = Array.from(factorReturns.factors.keys());
    const n = portfolioReturns.length;
    const k = factors.length;

    const X: number[][] = [];

    for (let t = 0; t < n; t++) {
      const row: number[] = [1]; // Intercept

      for (const factor of factors) {
        const factorData = factorReturns.factors.get(factor);
        if (factorData && factorData[t] !== undefined) {
          row.push(factorData[t]);
        } else {
          row.push(0);
        }
      }

      X.push(row);
    }

    const XArray = numpy.array(X);

    // Perform regression: y = Xβ + ε
    const result = numpy.linalg.lstsq(XArray, y, null);
    const beta = result[0];

    // Extract coefficients
    const alpha = beta.item(0);
    const factorCoeffs: number[] = [];

    for (let i = 1; i <= k; i++) {
      factorCoeffs.push(beta.item(i));
    }

    // Calculate fitted values and residuals
    const fitted = numpy.dot(XArray, beta);
    const residuals = y.subtract(fitted);

    // Calculate R-squared
    const tss = numpy.sum(numpy.power(y.subtract(numpy.mean(y)), 2));
    const rss = numpy.sum(numpy.power(residuals, 2));
    const rSquared = 1 - rss / tss;

    // Calculate factor exposures
    const factorExposures: FactorExposure[] = [];

    for (let i = 0; i < factors.length; i++) {
      const factor = factors[i];
      const exposure = factorCoeffs[i];

      // Calculate contribution
      const factorData = factorReturns.factors.get(factor);
      if (factorData) {
        const factorArray = numpy.array(factorData);
        const contribution = exposure * numpy.mean(factorArray) * 252; // Annualized
        factorExposures.push({
          factor,
          exposure,
          contribution,
          tStat: 0, // Simplified
        });
      }
    }

    // Calculate attribution
    const totalReturn = numpy.mean(y) * 252; // Annualized
    const benchmarkReturn = 0; // Simplified

    const attribution: AttributionFactors = {
      market: factorExposures[0]?.contribution || 0,
      sector: 0,
      security: alpha * 252, // Alpha represents security selection
      timing: 0,
      interaction: 0,
    };

    // Tracking error and information ratio
    const trackingError = numpy.std(residuals) * Math.sqrt(252);
    const informationRatio = (alpha * 252) / trackingError;

    return {
      totalReturn,
      benchmarkReturn,
      activeReturn: totalReturn - benchmarkReturn,
      attribution,
      factorExposures,
      rSquared,
      trackingError,
      informationRatio,
    };
  }

  /**
   * CAPM attribution (single factor)
   */
  static capmAttribution(
    portfolioReturns: number[],
    marketReturns: number[],
    riskFreeRate = 0.02
  ): PerformanceAttribution {
    const factorReturns: FactorReturns = {
      model: 'capm',
      factors: new Map([['market', marketReturns]]),
      dates: [],
    };

    return this.analyze(portfolioReturns, factorReturns, riskFreeRate);
  }

  /**
   * Fama-French 3-factor attribution
   */
  static famaFrench3Attribution(
    portfolioReturns: number[],
    marketReturns: number[],
    smbReturns: number[], // Small Minus Big
    hmlReturns: number[], // High Minus Low
    riskFreeRate = 0.02
  ): PerformanceAttribution {
    const factorReturns: FactorReturns = {
      model: 'fama-french-3',
      factors: new Map([
        ['market', marketReturns],
        ['smb', smbReturns],
        ['hml', hmlReturns],
      ]),
      dates: [],
    };

    return this.analyze(portfolioReturns, factorReturns, riskFreeRate);
  }

  /**
   * Fama-French 5-factor attribution
   */
  static famaFrench5Attribution(
    portfolioReturns: number[],
    marketReturns: number[],
    smbReturns: number[],
    hmlReturns: number[],
    rmwReturns: number[], // Robust Minus Weak
    cmaReturns: number[], // Conservative Minus Aggressive
    riskFreeRate = 0.02
  ): PerformanceAttribution {
    const factorReturns: FactorReturns = {
      model: 'fama-french-5',
      factors: new Map([
        ['market', marketReturns],
        ['smb', smbReturns],
        ['hml', hmlReturns],
        ['rmw', rmwReturns],
        ['cma', cmaReturns],
      ]),
      dates: [],
    };

    return this.analyze(portfolioReturns, factorReturns, riskFreeRate);
  }

  /**
   * Rolling factor attribution
   */
  static rollingAttribution(
    portfolioReturns: number[],
    factorReturns: FactorReturns,
    windowSize: number,
    riskFreeRate = 0.02
  ): Array<{ date: number; alpha: number; beta: number; rSquared: number }> {
    const results: Array<{ date: number; alpha: number; beta: number; rSquared: number }> = [];

    for (let i = windowSize; i <= portfolioReturns.length; i++) {
      const windowReturns = portfolioReturns.slice(i - windowSize, i);

      // Extract factor windows
      const windowFactorReturns: FactorReturns = {
        model: factorReturns.model,
        factors: new Map(),
        dates: [],
      };

      for (const [factor, data] of factorReturns.factors) {
        windowFactorReturns.factors.set(factor, data.slice(i - windowSize, i));
      }

      const attribution = this.analyze(windowReturns, windowFactorReturns, riskFreeRate);

      const alpha = attribution.factorExposures.find(f => f.factor === 'alpha')?.contribution || 0;
      const beta = attribution.factorExposures[0]?.exposure || 1;

      results.push({
        date: i,
        alpha,
        beta,
        rSquared: attribution.rSquared,
      });
    }

    return results;
  }
}

// ============================================================================
// Performance Metrics Calculator
// ============================================================================

/**
 * Calculate comprehensive performance metrics
 */
export class PerformanceMetricsCalculator {
  /**
   * Calculate all performance metrics
   */
  static calculate(
    returns: number[],
    benchmarkReturns?: number[],
    riskFreeRate = 0.02
  ): PerformanceMetrics {
    const returnsArray = numpy.array(returns);
    const n = returns.length;

    // Cumulative return
    const cumReturns = numpy.cumprod(returnsArray.add(1));
    const totalReturn = cumReturns.item(-1) - 1;

    // Annualized return (assuming daily returns)
    const yearsElapsed = n / 252;
    const annualizedReturn = Math.pow(1 + totalReturn, 1 / yearsElapsed) - 1;

    // Volatility (annualized)
    const volatility = numpy.std(returnsArray) * Math.sqrt(252);

    // Sharpe ratio
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
    const { maxDD, duration } = this.calculateMaxDrawdown(returns);

    // Calmar ratio
    const calmarRatio = maxDD > 0 ? annualizedReturn / maxDD : 0;

    // Beta and alpha (if benchmark provided)
    let beta = 1.0;
    let alpha = 0.0;
    let trackingError = 0.0;
    let informationRatio = 0.0;

    if (benchmarkReturns && benchmarkReturns.length === returns.length) {
      const benchArray = numpy.array(benchmarkReturns);

      // Beta calculation
      const covariance = numpy.cov(returnsArray, benchArray).item([0, 1]);
      const benchVariance = numpy.var(benchArray);
      beta = covariance / benchVariance;

      // Alpha calculation
      const benchMean = numpy.mean(benchArray);
      const portMean = numpy.mean(returnsArray);
      alpha = (portMean - riskFreeRate / 252) - beta * (benchMean - riskFreeRate / 252);
      alpha *= 252; // Annualize

      // Tracking error
      const activReturns = returnsArray.subtract(benchArray);
      trackingError = numpy.std(activeReturns) * Math.sqrt(252);

      // Information ratio
      const activeReturn = portMean * 252 - benchMean * 252;
      informationRatio = trackingError > 0 ? activeReturn / trackingError : 0;
    }

    return {
      totalReturn,
      annualizedReturn,
      volatility,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      maxDrawdown: maxDD,
      alpha,
      beta,
      informationRatio,
      trackingError,
    };
  }

  /**
   * Calculate maximum drawdown
   */
  private static calculateMaxDrawdown(
    returns: number[]
  ): { maxDD: number; duration: number } {
    const cumReturns = numpy.cumprod(numpy.array(returns).add(1));

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

  /**
   * Calculate rolling metrics
   */
  static rollingMetrics(
    returns: number[],
    windowSize: number,
    riskFreeRate = 0.02
  ): Array<{
    date: number;
    return: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
  }> {
    const results: Array<{
      date: number;
      return: number;
      volatility: number;
      sharpeRatio: number;
      maxDrawdown: number;
    }> = [];

    for (let i = windowSize; i <= returns.length; i++) {
      const window = returns.slice(i - windowSize, i);
      const windowArray = numpy.array(window);

      // Calculate metrics
      const meanReturn = numpy.mean(windowArray) * 252;
      const vol = numpy.std(windowArray) * Math.sqrt(252);
      const sharpe = vol > 0 ? (meanReturn - riskFreeRate) / vol : 0;
      const { maxDD } = this.calculateMaxDrawdown(window);

      results.push({
        date: i,
        return: meanReturn,
        volatility: vol,
        sharpeRatio: sharpe,
        maxDrawdown: maxDD,
      });
    }

    return results;
  }

  /**
   * Compare multiple strategies
   */
  static compareStrategies(
    strategies: Map<string, number[]>,
    benchmarkReturns?: number[],
    riskFreeRate = 0.02
  ): Map<string, PerformanceMetrics> {
    const results = new Map<string, PerformanceMetrics>();

    for (const [name, returns] of strategies) {
      const metrics = this.calculate(returns, benchmarkReturns, riskFreeRate);
      results.set(name, metrics);
    }

    return results;
  }
}

// ============================================================================
// Risk-Adjusted Returns
// ============================================================================

/**
 * Calculate various risk-adjusted return measures
 */
export class RiskAdjustedReturns {
  /**
   * Jensen's Alpha
   */
  static jensensAlpha(
    portfolioReturn: number,
    marketReturn: number,
    beta: number,
    riskFreeRate: number
  ): number {
    return portfolioReturn - (riskFreeRate + beta * (marketReturn - riskFreeRate));
  }

  /**
   * Treynor Ratio
   */
  static treynorRatio(
    portfolioReturn: number,
    beta: number,
    riskFreeRate: number
  ): number {
    return (portfolioReturn - riskFreeRate) / beta;
  }

  /**
   * M² (Modigliani-Modigliani measure)
   */
  static mSquared(
    portfolioReturn: number,
    portfolioVolatility: number,
    marketReturn: number,
    marketVolatility: number,
    riskFreeRate: number
  ): number {
    const sharpeRatio = (portfolioReturn - riskFreeRate) / portfolioVolatility;
    return riskFreeRate + sharpeRatio * marketVolatility - marketReturn;
  }

  /**
   * Omega Ratio
   */
  static omegaRatio(
    returns: number[],
    threshold = 0
  ): number {
    let gainsSum = 0;
    let lossesSum = 0;

    for (const ret of returns) {
      if (ret > threshold) {
        gainsSum += ret - threshold;
      } else {
        lossesSum += threshold - ret;
      }
    }

    return lossesSum > 0 ? gainsSum / lossesSum : Infinity;
  }

  /**
   * Upside/Downside Capture Ratios
   */
  static captureRatios(
    portfolioReturns: number[],
    benchmarkReturns: number[]
  ): { upside: number; downside: number } {
    if (portfolioReturns.length !== benchmarkReturns.length) {
      throw new Error('Returns arrays must have same length');
    }

    let upsidePortfolio = 0;
    let upsideBenchmark = 0;
    let downsidePortfolio = 0;
    let downsideBenchmark = 0;
    let upsideCount = 0;
    let downsideCount = 0;

    for (let i = 0; i < benchmarkReturns.length; i++) {
      if (benchmarkReturns[i] > 0) {
        upsidePortfolio += portfolioReturns[i];
        upsideBenchmark += benchmarkReturns[i];
        upsideCount++;
      } else if (benchmarkReturns[i] < 0) {
        downsidePortfolio += portfolioReturns[i];
        downsideBenchmark += benchmarkReturns[i];
        downsideCount++;
      }
    }

    const upsideCapture = upsideBenchmark !== 0
      ? (upsidePortfolio / upsideCount) / (upsideBenchmark / upsideCount)
      : 1;

    const downsideCapture = downsideBenchmark !== 0
      ? (downsidePortfolio / downsideCount) / (downsideBenchmark / downsideCount)
      : 1;

    return {
      upside: upsideCapture,
      downside: downsideCapture,
    };
  }

  /**
   * Sterling Ratio
   */
  static sterlingRatio(
    annualizedReturn: number,
    averageDrawdown: number
  ): number {
    return averageDrawdown > 0 ? annualizedReturn / averageDrawdown : 0;
  }

  /**
   * Burke Ratio
   */
  static burkeRatio(
    annualizedReturn: number,
    drawdowns: number[],
    riskFreeRate: number
  ): number {
    const drawdownsArray = numpy.array(drawdowns);
    const sumSquaredDrawdowns = numpy.sum(numpy.power(drawdownsArray, 2));
    const rmsDrawdown = Math.sqrt(sumSquaredDrawdowns / drawdowns.length);

    return rmsDrawdown > 0 ? (annualizedReturn - riskFreeRate) / rmsDrawdown : 0;
  }
}

// ============================================================================
// Export all classes
// ============================================================================

export {
  BrinsonAttribution,
  FactorAttribution,
  PerformanceMetricsCalculator,
  RiskAdjustedReturns,
};
