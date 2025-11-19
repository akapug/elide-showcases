/**
 * Stress Testing Framework
 *
 * Comprehensive stress testing for financial portfolios including:
 * - Historical scenarios (e.g., 2008 crisis, COVID-19)
 * - Hypothetical scenarios
 * - Sensitivity analysis
 * - Reverse stress testing
 *
 * Uses pandas for efficient data manipulation and analysis.
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import { stats } from 'python:scipy';

import type {
  StressScenario,
  StressTestResult,
  Portfolio,
  Position,
  RiskMetrics,
} from '../types.js';

// ============================================================================
// Predefined Historical Scenarios
// ============================================================================

/**
 * Historical stress scenarios
 */
export const HISTORICAL_SCENARIOS: StressScenario[] = [
  {
    name: 'Global Financial Crisis (2008)',
    description: 'October 2008 market crash',
    shocks: new Map([
      ['SPY', -0.38],    // S&P 500: -38%
      ['DIA', -0.35],    // Dow Jones: -35%
      ['QQQ', -0.42],    // NASDAQ: -42%
      ['IWM', -0.41],    // Russell 2000: -41%
      ['EFA', -0.45],    // EAFE: -45%
      ['EEM', -0.53],    // Emerging markets: -53%
      ['TLT', 0.25],     // Long-term bonds: +25%
      ['GLD', 0.05],     // Gold: +5%
      ['DBC', -0.50],    // Commodities: -50%
    ]),
    probability: 0.01,
  },
  {
    name: 'COVID-19 Crash (March 2020)',
    description: 'COVID-19 pandemic market crash',
    shocks: new Map([
      ['SPY', -0.34],
      ['DIA', -0.37],
      ['QQQ', -0.27],
      ['IWM', -0.42],
      ['EFA', -0.31],
      ['EEM', -0.32],
      ['TLT', 0.21],
      ['GLD', 0.04],
      ['DBC', -0.35],
    ]),
    probability: 0.015,
  },
  {
    name: 'Dot-com Bubble Burst (2000-2002)',
    description: 'Technology bubble collapse',
    shocks: new Map([
      ['SPY', -0.49],
      ['DIA', -0.38],
      ['QQQ', -0.78],    // NASDAQ: -78%
      ['IWM', -0.29],
      ['EFA', -0.50],
      ['TLT', 0.42],
      ['GLD', 0.12],
    ]),
    probability: 0.008,
  },
  {
    name: 'Black Monday (1987)',
    description: 'October 19, 1987 market crash',
    shocks: new Map([
      ['SPY', -0.22],    // Single day: -22%
      ['DIA', -0.23],
      ['TLT', 0.02],
    ]),
    probability: 0.005,
  },
  {
    name: 'European Debt Crisis (2011)',
    description: 'European sovereign debt crisis',
    shocks: new Map([
      ['SPY', -0.19],
      ['DIA', -0.16],
      ['QQQ', -0.19],
      ['EFA', -0.29],    // Europe hit harder
      ['EEM', -0.27],
      ['TLT', 0.16],
      ['GLD', 0.10],
    ]),
    probability: 0.012,
  },
];

// ============================================================================
// Stress Test Engine
// ============================================================================

/**
 * Run stress tests on portfolios
 */
export class StressTestEngine {
  /**
   * Run single stress scenario
   */
  static runScenario(
    portfolio: Portfolio,
    scenario: StressScenario
  ): StressTestResult {
    let portfolioImpact = 0;
    const positionImpacts = new Map<string, number>();

    for (const position of portfolio.positions) {
      const shock = scenario.shocks.get(position.symbol) || 0;
      const impact = position.marketValue * shock;

      portfolioImpact += impact;
      positionImpacts.set(position.symbol, impact);
    }

    const portfolioImpactPercent = portfolioImpact / portfolio.totalValue;

    return {
      scenario,
      portfolioImpact,
      portfolioImpactPercent,
      positionImpacts,
    };
  }

  /**
   * Run multiple stress scenarios
   */
  static runMultipleScenarios(
    portfolio: Portfolio,
    scenarios: StressScenario[]
  ): StressTestResult[] {
    return scenarios.map(scenario => this.runScenario(portfolio, scenario));
  }

  /**
   * Run all historical scenarios
   */
  static runHistoricalScenarios(portfolio: Portfolio): StressTestResult[] {
    return this.runMultipleScenarios(portfolio, HISTORICAL_SCENARIOS);
  }

  /**
   * Find worst-case scenario
   */
  static findWorstCase(results: StressTestResult[]): StressTestResult {
    return results.reduce((worst, current) =>
      current.portfolioImpact < worst.portfolioImpact ? current : worst
    );
  }

  /**
   * Find best-case scenario
   */
  static findBestCase(results: StressTestResult[]): StressTestResult {
    return results.reduce((best, current) =>
      current.portfolioImpact > best.portfolioImpact ? current : best
    );
  }

  /**
   * Calculate probability-weighted impact
   */
  static expectedImpact(results: StressTestResult[]): number {
    let weightedSum = 0;
    let totalProbability = 0;

    for (const result of results) {
      if (result.scenario.probability) {
        weightedSum += result.portfolioImpact * result.scenario.probability;
        totalProbability += result.scenario.probability;
      }
    }

    return totalProbability > 0 ? weightedSum / totalProbability : 0;
  }
}

// ============================================================================
// Sensitivity Analysis
// ============================================================================

/**
 * Perform sensitivity analysis on portfolio
 */
export class SensitivityAnalyzer {
  /**
   * Calculate portfolio sensitivity to single factor
   */
  static singleFactorSensitivity(
    portfolio: Portfolio,
    factor: string,
    shockRange: number[] = [-0.5, -0.3, -0.1, 0, 0.1, 0.3, 0.5]
  ): Array<{ shock: number; impact: number; impactPercent: number }> {
    const results: Array<{ shock: number; impact: number; impactPercent: number }> = [];

    for (const shock of shockRange) {
      const scenario: StressScenario = {
        name: `${factor} ${(shock * 100).toFixed(0)}%`,
        description: `Sensitivity to ${factor}`,
        shocks: new Map([[factor, shock]]),
      };

      const result = StressTestEngine.runScenario(portfolio, scenario);

      results.push({
        shock,
        impact: result.portfolioImpact,
        impactPercent: result.portfolioImpactPercent,
      });
    }

    return results;
  }

  /**
   * Calculate portfolio delta (first derivative)
   */
  static calculateDelta(
    portfolio: Portfolio,
    factor: string,
    shockSize = 0.01
  ): number {
    const upScenario: StressScenario = {
      name: 'Up',
      description: 'Up scenario',
      shocks: new Map([[factor, shockSize]]),
    };

    const downScenario: StressScenario = {
      name: 'Down',
      description: 'Down scenario',
      shocks: new Map([[factor, -shockSize]]),
    };

    const upResult = StressTestEngine.runScenario(portfolio, upScenario);
    const downResult = StressTestEngine.runScenario(portfolio, downScenario);

    return (upResult.portfolioImpact - downResult.portfolioImpact) / (2 * shockSize);
  }

  /**
   * Calculate portfolio gamma (second derivative)
   */
  static calculateGamma(
    portfolio: Portfolio,
    factor: string,
    shockSize = 0.01
  ): number {
    const upScenario: StressScenario = {
      name: 'Up',
      description: 'Up scenario',
      shocks: new Map([[factor, shockSize]]),
    };

    const downScenario: StressScenario = {
      name: 'Down',
      description: 'Down scenario',
      shocks: new Map([[factor, -shockSize]]),
    };

    const baseScenario: StressScenario = {
      name: 'Base',
      description: 'Base scenario',
      shocks: new Map([[factor, 0]]),
    };

    const upResult = StressTestEngine.runScenario(portfolio, upScenario);
    const downResult = StressTestEngine.runScenario(portfolio, downScenario);
    const baseResult = StressTestEngine.runScenario(portfolio, baseScenario);

    return (upResult.portfolioImpact - 2 * baseResult.portfolioImpact + downResult.portfolioImpact) /
      (shockSize * shockSize);
  }

  /**
   * Multi-factor sensitivity analysis
   */
  static multiFactorSensitivity(
    portfolio: Portfolio,
    factors: string[],
    shockSize = 0.1
  ): Map<string, number> {
    const sensitivities = new Map<string, number>();

    for (const factor of factors) {
      const delta = this.calculateDelta(portfolio, factor, shockSize);
      sensitivities.set(factor, delta);
    }

    return sensitivities;
  }

  /**
   * Generate sensitivity heatmap data
   */
  static generateHeatmap(
    portfolio: Portfolio,
    factor1: string,
    factor2: string,
    shockRange1: number[],
    shockRange2: number[]
  ): number[][] {
    const heatmap: number[][] = [];

    for (const shock1 of shockRange1) {
      const row: number[] = [];

      for (const shock2 of shockRange2) {
        const scenario: StressScenario = {
          name: `${factor1} ${shock1}, ${factor2} ${shock2}`,
          description: 'Combined scenario',
          shocks: new Map([
            [factor1, shock1],
            [factor2, shock2],
          ]),
        };

        const result = StressTestEngine.runScenario(portfolio, scenario);
        row.push(result.portfolioImpactPercent);
      }

      heatmap.push(row);
    }

    return heatmap;
  }
}

// ============================================================================
// Reverse Stress Testing
// ============================================================================

/**
 * Reverse stress testing: find scenarios that cause specific losses
 */
export class ReverseStressTest {
  /**
   * Find shock magnitude needed to cause target loss
   */
  static findTargetLoss(
    portfolio: Portfolio,
    factor: string,
    targetLoss: number,
    maxIterations = 100,
    tolerance = 0.001
  ): number | null {
    let lowerBound = -1.0;
    let upperBound = 0.0;

    // Binary search for shock magnitude
    for (let i = 0; i < maxIterations; i++) {
      const midPoint = (lowerBound + upperBound) / 2;

      const scenario: StressScenario = {
        name: 'Test',
        description: 'Test scenario',
        shocks: new Map([[factor, midPoint]]),
      };

      const result = StressTestEngine.runScenario(portfolio, scenario);
      const loss = -result.portfolioImpact;

      if (Math.abs(loss - targetLoss) < tolerance) {
        return midPoint;
      }

      if (loss < targetLoss) {
        lowerBound = midPoint;
      } else {
        upperBound = midPoint;
      }
    }

    return null; // Did not converge
  }

  /**
   * Find combination of shocks that cause target loss
   */
  static findMultiFactorShocks(
    portfolio: Portfolio,
    factors: string[],
    targetLoss: number,
    correlations?: number[][]
  ): Map<string, number> | null {
    // Use optimization to find shock combination
    const n = factors.length;

    // Objective: minimize distance to target loss
    const objective = (shocks: number[]): number => {
      const shockMap = new Map<string, number>();
      for (let i = 0; i < n; i++) {
        shockMap.set(factors[i], shocks[i]);
      }

      const scenario: StressScenario = {
        name: 'Test',
        description: 'Test scenario',
        shocks: shockMap,
      };

      const result = StressTestEngine.runScenario(portfolio, scenario);
      const loss = -result.portfolioImpact;

      return Math.pow(loss - targetLoss, 2);
    };

    // Simple gradient descent
    let shocks = new Array(n).fill(-0.1);
    const learningRate = 0.01;
    const maxIterations = 1000;

    for (let iter = 0; iter < maxIterations; iter++) {
      const currentError = objective(shocks);

      if (currentError < 0.001) {
        const result = new Map<string, number>();
        for (let i = 0; i < n; i++) {
          result.set(factors[i], shocks[i]);
        }
        return result;
      }

      // Compute gradient
      const gradient: number[] = [];
      for (let i = 0; i < n; i++) {
        const h = 0.001;
        const shocksUp = [...shocks];
        shocksUp[i] += h;

        const grad = (objective(shocksUp) - currentError) / h;
        gradient.push(grad);
      }

      // Update shocks
      for (let i = 0; i < n; i++) {
        shocks[i] -= learningRate * gradient[i];

        // Keep shocks in reasonable range
        shocks[i] = Math.max(-1.0, Math.min(0.5, shocks[i]));
      }
    }

    return null; // Did not converge
  }

  /**
   * Find scenarios causing portfolio loss greater than threshold
   */
  static findBreakingPoints(
    portfolio: Portfolio,
    factors: string[],
    lossThreshold: number,
    numScenarios = 1000,
    seed?: number
  ): StressScenario[] {
    if (seed !== undefined) {
      numpy.random.seed(seed);
    }

    const breakingScenarios: StressScenario[] = [];

    for (let i = 0; i < numScenarios; i++) {
      // Generate random shocks
      const shocks = new Map<string, number>();

      for (const factor of factors) {
        // Random shock between -50% and +50%
        const shock = numpy.random.uniform(-0.5, 0.5);
        shocks.set(factor, shock);
      }

      const scenario: StressScenario = {
        name: `Random Scenario ${i + 1}`,
        description: 'Randomly generated scenario',
        shocks,
      };

      const result = StressTestEngine.runScenario(portfolio, scenario);
      const loss = -result.portfolioImpact;

      if (loss > lossThreshold) {
        breakingScenarios.push(scenario);
      }
    }

    return breakingScenarios;
  }
}

// ============================================================================
// Correlation Breakdown Scenarios
// ============================================================================

/**
 * Test scenarios where correlations break down
 */
export class CorrelationBreakdownAnalyzer {
  /**
   * Generate scenario where all assets move together
   */
  static fullCorrelationCrisis(
    portfolio: Portfolio,
    magnitude = -0.3
  ): StressTestResult {
    const shocks = new Map<string, number>();

    for (const position of portfolio.positions) {
      shocks.set(position.symbol, magnitude);
    }

    const scenario: StressScenario = {
      name: 'Full Correlation Crisis',
      description: 'All assets decline together',
      shocks,
      probability: 0.005,
    };

    return StressTestEngine.runScenario(portfolio, scenario);
  }

  /**
   * Generate scenario where diversification fails
   */
  static diversificationFailure(
    portfolio: Portfolio,
    safeAssets: string[],
    riskMagnitude = -0.4
  ): StressTestResult {
    const shocks = new Map<string, number>();

    for (const position of portfolio.positions) {
      if (safeAssets.includes(position.symbol)) {
        // Safe assets also decline (flight to quality fails)
        shocks.set(position.symbol, -0.1);
      } else {
        shocks.set(position.symbol, riskMagnitude);
      }
    }

    const scenario: StressScenario = {
      name: 'Diversification Failure',
      description: 'Traditional safe havens also decline',
      shocks,
      probability: 0.008,
    };

    return StressTestEngine.runScenario(portfolio, scenario);
  }

  /**
   * Simulate correlation matrix under stress
   */
  static stressedCorrelations(
    normalCorrelations: number[][],
    stressFactor = 1.5
  ): number[][] {
    const n = normalCorrelations.length;
    const stressedCorr: number[][] = [];

    for (let i = 0; i < n; i++) {
      const row: number[] = [];

      for (let j = 0; j < n; j++) {
        if (i === j) {
          row.push(1.0);
        } else {
          // Increase correlations under stress (but keep in [-1, 1])
          let stressed = normalCorrelations[i][j] * stressFactor;
          stressed = Math.max(-1, Math.min(1, stressed));
          row.push(stressed);
        }
      }

      stressedCorr.push(row);
    }

    return stressedCorr;
  }
}

// ============================================================================
// Scenario Generation
// ============================================================================

/**
 * Generate custom stress scenarios
 */
export class ScenarioGenerator {
  /**
   * Generate scenarios from historical data
   */
  static fromHistoricalData(
    returns: Map<string, number[]>,
    windowSize: number,
    numScenarios: number
  ): StressScenario[] {
    const scenarios: StressScenario[] = [];
    const assets = Array.from(returns.keys());

    if (assets.length === 0) {
      return scenarios;
    }

    const firstAsset = assets[0];
    const data = returns.get(firstAsset);

    if (!data || data.length < windowSize) {
      return scenarios;
    }

    const numWindows = data.length - windowSize + 1;

    // Find worst performing windows for each asset
    const worstWindows: Array<{ start: number; cumulativeReturn: number }> = [];

    for (let start = 0; start < numWindows; start++) {
      let cumulativeReturn = 0;

      for (const asset of assets) {
        const assetReturns = returns.get(asset);
        if (!assetReturns) continue;

        let assetCumReturn = 1;
        for (let i = start; i < start + windowSize; i++) {
          assetCumReturn *= 1 + assetReturns[i];
        }

        cumulativeReturn += assetCumReturn - 1;
      }

      worstWindows.push({ start, cumulativeReturn });
    }

    // Sort by worst performance
    worstWindows.sort((a, b) => a.cumulativeReturn - b.cumulativeReturn);

    // Take worst scenarios
    for (let i = 0; i < Math.min(numScenarios, worstWindows.length); i++) {
      const window = worstWindows[i];
      const shocks = new Map<string, number>();

      for (const asset of assets) {
        const assetReturns = returns.get(asset);
        if (!assetReturns) continue;

        let cumulativeReturn = 1;
        for (let j = window.start; j < window.start + windowSize; j++) {
          cumulativeReturn *= 1 + assetReturns[j];
        }

        shocks.set(asset, cumulativeReturn - 1);
      }

      scenarios.push({
        name: `Historical Scenario ${i + 1}`,
        description: `Based on ${windowSize}-day window starting at index ${window.start}`,
        shocks,
      });
    }

    return scenarios;
  }

  /**
   * Generate Monte Carlo scenarios
   */
  static monteCarlo(
    assets: string[],
    expectedReturns: Map<string, number>,
    volatilities: Map<string, number>,
    correlations: number[][],
    numScenarios = 1000,
    timeHorizon = 1,
    seed?: number
  ): StressScenario[] {
    if (seed !== undefined) {
      numpy.random.seed(seed);
    }

    const n = assets.length;
    const scenarios: StressScenario[] = [];

    // Cholesky decomposition for correlated scenarios
    const corrArray = numpy.array(correlations);
    const L = numpy.linalg.cholesky(corrArray);

    for (let i = 0; i < numScenarios; i++) {
      // Generate correlated random shocks
      const uncorrelated = [];
      for (let j = 0; j < n; j++) {
        uncorrelated.push(numpy.random.standard_normal());
      }

      const uncorrelatedArray = numpy.array(uncorrelated);
      const correlated = numpy.dot(L, uncorrelatedArray);

      const shocks = new Map<string, number>();

      for (let j = 0; j < n; j++) {
        const asset = assets[j];
        const mu = expectedReturns.get(asset) || 0;
        const sigma = volatilities.get(asset) || 0.2;

        // Generate return using geometric Brownian motion
        const z = correlated.item(j);
        const ret = (mu - 0.5 * sigma * sigma) * timeHorizon +
                    sigma * Math.sqrt(timeHorizon) * z;

        shocks.set(asset, Math.exp(ret) - 1);
      }

      scenarios.push({
        name: `Monte Carlo Scenario ${i + 1}`,
        description: 'Generated from Monte Carlo simulation',
        shocks,
      });
    }

    return scenarios;
  }

  /**
   * Generate extreme tail scenarios
   */
  static extremeTail(
    assets: string[],
    volatilities: Map<string, number>,
    tailProbability = 0.01,
    numScenarios = 100,
    seed?: number
  ): StressScenario[] {
    if (seed !== undefined) {
      numpy.random.seed(seed);
    }

    const scenarios: StressScenario[] = [];

    // Use Student's t-distribution for fat tails
    const df = 4; // degrees of freedom (lower = fatter tails)

    for (let i = 0; i < numScenarios; i++) {
      const shocks = new Map<string, number>();

      for (const asset of assets) {
        const sigma = volatilities.get(asset) || 0.2;

        // Generate shock from t-distribution
        const tShock = stats.t.rvs(df);
        const shock = sigma * tShock * Math.sqrt((df - 2) / df);

        shocks.set(asset, shock);
      }

      scenarios.push({
        name: `Extreme Tail Scenario ${i + 1}`,
        description: 'Based on fat-tailed distribution',
        shocks,
        probability: tailProbability,
      });
    }

    return scenarios;
  }
}

// ============================================================================
// Export all classes
// ============================================================================

export {
  StressTestEngine,
  SensitivityAnalyzer,
  ReverseStressTest,
  CorrelationBreakdownAnalyzer,
  ScenarioGenerator,
  HISTORICAL_SCENARIOS,
};
