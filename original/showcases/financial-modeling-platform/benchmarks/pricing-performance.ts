/**
 * Financial Modeling Platform - Performance Benchmarks
 *
 * Comprehensive performance benchmarks demonstrating:
 * - High-throughput options pricing (100K+ options/second)
 * - Large-scale Monte Carlo simulations
 * - Portfolio optimization speed
 * - Risk calculation performance
 */

import { OptionsPricingEngine, BlackScholesModel } from '../src/derivatives/options-pricer.js';
import { MonteCarloEngine } from '../src/pricing/monte-carlo.js';
import { MeanVarianceOptimizer } from '../src/portfolio/optimizer.js';
import { HistoricalVaR, MonteCarloVaR } from '../src/risk/var-calculator.js';

import type { OptionContract, MonteCarloParams, GBMParams } from '../src/types.js';

// ============================================================================
// Benchmark Configuration
// ============================================================================

interface BenchmarkResult {
  name: string;
  operations: number;
  totalTimeMs: number;
  opsPerSecond: number;
  avgTimePerOp: number;
}

class BenchmarkRunner {
  static run(
    name: string,
    operation: () => void,
    iterations: number
  ): BenchmarkResult {
    console.log(`Running benchmark: ${name}`);
    console.log(`  Iterations: ${iterations.toLocaleString()}`);

    // Warm-up
    for (let i = 0; i < Math.min(10, iterations); i++) {
      operation();
    }

    // Actual benchmark
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      operation();
    }

    const endTime = performance.now();
    const totalTimeMs = endTime - startTime;
    const opsPerSecond = (iterations / totalTimeMs) * 1000;
    const avgTimePerOp = totalTimeMs / iterations;

    const result: BenchmarkResult = {
      name,
      operations: iterations,
      totalTimeMs,
      opsPerSecond,
      avgTimePerOp,
    };

    console.log(`  Total Time: ${totalTimeMs.toFixed(2)}ms`);
    console.log(`  Operations/second: ${opsPerSecond.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
    console.log(`  Avg Time/operation: ${avgTimePerOp.toFixed(4)}ms`);
    console.log();

    return result;
  }

  static async runAsync(
    name: string,
    operation: () => Promise<void>,
    iterations: number
  ): Promise<BenchmarkResult> {
    console.log(`Running benchmark: ${name}`);
    console.log(`  Iterations: ${iterations.toLocaleString()}`);

    // Warm-up
    for (let i = 0; i < Math.min(3, iterations); i++) {
      await operation();
    }

    // Actual benchmark
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      await operation();
    }

    const endTime = performance.now();
    const totalTimeMs = endTime - startTime;
    const opsPerSecond = (iterations / totalTimeMs) * 1000;
    const avgTimePerOp = totalTimeMs / iterations;

    const result: BenchmarkResult = {
      name,
      operations: iterations,
      totalTimeMs,
      opsPerSecond,
      avgTimePerOp,
    };

    console.log(`  Total Time: ${totalTimeMs.toFixed(2)}ms`);
    console.log(`  Operations/second: ${opsPerSecond.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
    console.log(`  Avg Time/operation: ${avgTimePerOp.toFixed(4)}ms`);
    console.log();

    return result;
  }
}

// ============================================================================
// Options Pricing Benchmarks
// ============================================================================

async function benchmarkOptionsPricing() {
  console.log('\n=== Options Pricing Benchmarks ===\n');

  const optionParams = {
    spotPrice: 100,
    strike: 100,
    timeToMaturity: 1.0,
    riskFreeRate: 0.05,
    volatility: 0.25,
    optionType: 'call' as const,
  };

  // Black-Scholes pricing
  const bsResult = BenchmarkRunner.run(
    'Black-Scholes Pricing',
    () => {
      BlackScholesModel.price(optionParams);
    },
    100000
  );

  // Greeks calculation
  const greeksResult = BenchmarkRunner.run(
    'Black-Scholes Greeks',
    () => {
      BlackScholesModel.calculateGreeks(optionParams);
    },
    50000
  );

  // Implied volatility
  const ivResult = BenchmarkRunner.run(
    'Implied Volatility',
    () => {
      BlackScholesModel.impliedVolatility(
        10.5,
        optionParams,
        0.3
      );
    },
    10000
  );

  // Batch pricing
  const optionContract: OptionContract = {
    id: 'TEST-CALL',
    underlying: 'SPY',
    type: 'call',
    style: 'european',
    strike: 100,
    expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    quantity: 1,
  };

  const spotPrices = new Map([['SPY', 100]]);
  const volatilities = new Map([['SPY', 0.25]]);

  const batchResult = await BenchmarkRunner.runAsync(
    'Batch Options Pricing (1000 options)',
    async () => {
      const contracts = Array(1000).fill(optionContract);
      await OptionsPricingEngine.batchPrice(
        contracts,
        spotPrices,
        0.05,
        volatilities,
        'black-scholes'
      );
    },
    10
  );

  return [bsResult, greeksResult, ivResult, batchResult];
}

// ============================================================================
// Monte Carlo Benchmarks
// ============================================================================

async function benchmarkMonteCarlo() {
  console.log('\n=== Monte Carlo Simulation Benchmarks ===\n');

  const gbmParams: GBMParams = {
    mu: 0.10,
    sigma: 0.20,
  };

  // 10K paths
  const mc10kResult = BenchmarkRunner.run(
    'Monte Carlo GBM (10K paths, 252 steps)',
    () => {
      MonteCarloEngine.simulate({
        numPaths: 10000,
        numSteps: 252,
        timeHorizon: 1.0,
        process: 'gbm',
        processParams: gbmParams,
        seed: 42,
      });
    },
    100
  );

  // 100K paths
  const mc100kResult = BenchmarkRunner.run(
    'Monte Carlo GBM (100K paths, 252 steps)',
    () => {
      MonteCarloEngine.simulate({
        numPaths: 100000,
        numSteps: 252,
        timeHorizon: 1.0,
        process: 'gbm',
        processParams: gbmParams,
        seed: 42,
      });
    },
    10
  );

  // 1M paths
  const mc1mResult = BenchmarkRunner.run(
    'Monte Carlo GBM (1M paths, 252 steps)',
    () => {
      MonteCarloEngine.simulate({
        numPaths: 1000000,
        numSteps: 252,
        timeHorizon: 1.0,
        process: 'gbm',
        processParams: gbmParams,
        seed: 42,
      });
    },
    3
  );

  // Antithetic variates
  const mcAntitheticResult = BenchmarkRunner.run(
    'Monte Carlo with Antithetic Variates (100K paths)',
    () => {
      MonteCarloEngine.simulate({
        numPaths: 100000,
        numSteps: 252,
        timeHorizon: 1.0,
        process: 'gbm',
        processParams: gbmParams,
        seed: 42,
        antitheticPaths: true,
      });
    },
    10
  );

  return [mc10kResult, mc100kResult, mc1mResult, mcAntitheticResult];
}

// ============================================================================
// Portfolio Optimization Benchmarks
// ============================================================================

async function benchmarkPortfolioOptimization() {
  console.log('\n=== Portfolio Optimization Benchmarks ===\n');

  // Generate random data
  const generateData = (n: number) => {
    const expectedReturns: number[] = [];
    const covarianceMatrix: number[][] = [];

    for (let i = 0; i < n; i++) {
      expectedReturns.push(0.05 + Math.random() * 0.15);
    }

    // Generate positive semi-definite covariance matrix
    const temp: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        row.push((Math.random() - 0.5) * 0.1);
      }
      temp.push(row);
    }

    // Make it symmetric and positive definite
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        let value = 0;
        for (let k = 0; k < n; k++) {
          value += temp[i][k] * temp[j][k];
        }
        row.push(value);
      }
      covarianceMatrix.push(row);
    }

    return { expectedReturns, covarianceMatrix };
  };

  // 5 assets
  const data5 = generateData(5);
  const opt5Result = BenchmarkRunner.run(
    'Portfolio Optimization (5 assets)',
    () => {
      MeanVarianceOptimizer.maximizeSharpe(
        data5.expectedReturns,
        data5.covarianceMatrix,
        0.03
      );
    },
    1000
  );

  // 10 assets
  const data10 = generateData(10);
  const opt10Result = BenchmarkRunner.run(
    'Portfolio Optimization (10 assets)',
    () => {
      MeanVarianceOptimizer.maximizeSharpe(
        data10.expectedReturns,
        data10.covarianceMatrix,
        0.03
      );
    },
    500
  );

  // 20 assets
  const data20 = generateData(20);
  const opt20Result = BenchmarkRunner.run(
    'Portfolio Optimization (20 assets)',
    () => {
      MeanVarianceOptimizer.maximizeSharpe(
        data20.expectedReturns,
        data20.covarianceMatrix,
        0.03
      );
    },
    200
  );

  // 50 assets
  const data50 = generateData(50);
  const opt50Result = BenchmarkRunner.run(
    'Portfolio Optimization (50 assets)',
    () => {
      MeanVarianceOptimizer.maximizeSharpe(
        data50.expectedReturns,
        data50.covarianceMatrix,
        0.03
      );
    },
    50
  );

  return [opt5Result, opt10Result, opt20Result, opt50Result];
}

// ============================================================================
// Risk Calculation Benchmarks
// ============================================================================

async function benchmarkRiskCalculations() {
  console.log('\n=== Risk Calculation Benchmarks ===\n');

  // Generate sample returns
  const generateReturns = (n: number) => {
    const returns: number[] = [];
    for (let i = 0; i < n; i++) {
      returns.push((Math.random() - 0.5) * 0.04);
    }
    return returns;
  };

  const returns252 = generateReturns(252);
  const returns1000 = generateReturns(1000);
  const returns5000 = generateReturns(5000);

  // Historical VaR
  const histVar252Result = BenchmarkRunner.run(
    'Historical VaR (252 returns)',
    () => {
      HistoricalVaR.calculate(returns252, 0.95);
    },
    10000
  );

  const histVar1000Result = BenchmarkRunner.run(
    'Historical VaR (1000 returns)',
    () => {
      HistoricalVaR.calculate(returns1000, 0.95);
    },
    5000
  );

  const histVar5000Result = BenchmarkRunner.run(
    'Historical VaR (5000 returns)',
    () => {
      HistoricalVaR.calculate(returns5000, 0.95);
    },
    1000
  );

  // Monte Carlo VaR
  const mcVar10kResult = BenchmarkRunner.run(
    'Monte Carlo VaR (10K simulations)',
    () => {
      MonteCarloVaR.calculate(
        1000000,
        0.10 / 252,
        0.20 / Math.sqrt(252),
        0.95,
        1,
        10000,
        42
      );
    },
    100
  );

  const mcVar100kResult = BenchmarkRunner.run(
    'Monte Carlo VaR (100K simulations)',
    () => {
      MonteCarloVaR.calculate(
        1000000,
        0.10 / 252,
        0.20 / Math.sqrt(252),
        0.95,
        1,
        100000,
        42
      );
    },
    10
  );

  return [
    histVar252Result,
    histVar1000Result,
    histVar5000Result,
    mcVar10kResult,
    mcVar100kResult,
  ];
}

// ============================================================================
// Summary and Report
// ============================================================================

function generateReport(allResults: BenchmarkResult[][]) {
  console.log('\n' + '═'.repeat(80));
  console.log('   BENCHMARK SUMMARY');
  console.log('═'.repeat(80));
  console.log();

  const flatResults = allResults.flat();

  // Find fastest operations
  const sortedByOps = [...flatResults].sort((a, b) => b.opsPerSecond - a.opsPerSecond);

  console.log('Top 5 Fastest Operations:');
  for (let i = 0; i < Math.min(5, sortedByOps.length); i++) {
    const result = sortedByOps[i];
    console.log(
      `  ${i + 1}. ${result.name}: ` +
      `${result.opsPerSecond.toLocaleString(undefined, { maximumFractionDigits: 0 })} ops/sec`
    );
  }
  console.log();

  // Calculate total operations
  const totalOps = flatResults.reduce((sum, r) => sum + r.operations, 0);
  const totalTime = flatResults.reduce((sum, r) => sum + r.totalTimeMs, 0);

  console.log('Overall Statistics:');
  console.log(`  Total Operations: ${totalOps.toLocaleString()}`);
  console.log(`  Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(
    `  Average Throughput: ${((totalOps / totalTime) * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} ops/sec`
  );
  console.log();

  // Highlight key achievements
  console.log('Key Achievements:');

  const bsResult = flatResults.find(r => r.name === 'Black-Scholes Pricing');
  if (bsResult && bsResult.opsPerSecond > 100000) {
    console.log(
      `  ✓ Options pricing: ${Math.floor(bsResult.opsPerSecond / 1000)}K+ options/second`
    );
  }

  const mc100k = flatResults.find(r => r.name.includes('100K paths'));
  if (mc100k) {
    console.log(
      `  ✓ Monte Carlo: 100K paths in ${mc100k.avgTimePerOp.toFixed(2)}ms`
    );
  }

  const opt50 = flatResults.find(r => r.name.includes('50 assets'));
  if (opt50) {
    console.log(
      `  ✓ Portfolio optimization: 50-asset portfolio in ${opt50.avgTimePerOp.toFixed(2)}ms`
    );
  }

  console.log();
  console.log('═'.repeat(80));
}

// ============================================================================
// Main Benchmark Runner
// ============================================================================

async function runAllBenchmarks() {
  console.log('━'.repeat(80));
  console.log('   FINANCIAL MODELING PLATFORM - PERFORMANCE BENCHMARKS');
  console.log('   Demonstrating High-Performance Polyglot Computing');
  console.log('━'.repeat(80));

  const startTime = performance.now();

  try {
    const optionsResults = await benchmarkOptionsPricing();
    const mcResults = await benchmarkMonteCarlo();
    const portfolioResults = await benchmarkPortfolioOptimization();
    const riskResults = await benchmarkRiskCalculations();

    const totalTime = performance.now() - startTime;

    generateReport([optionsResults, mcResults, portfolioResults, riskResults]);

    console.log(`Total Benchmark Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log('━'.repeat(80));

    return {
      optionsResults,
      mcResults,
      portfolioResults,
      riskResults,
      totalTime,
    };
  } catch (error) {
    console.error('Error running benchmarks:', error);
    throw error;
  }
}

// Run benchmarks
runAllBenchmarks().catch(console.error);
