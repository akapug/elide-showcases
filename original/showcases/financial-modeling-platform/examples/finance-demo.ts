/**
 * Financial Modeling Platform - Comprehensive Demo
 *
 * Demonstrates the full capabilities of the financial modeling platform,
 * showcasing Elide's polyglot power with Python scientific libraries.
 */

import { OptionsPricingEngine, BlackScholesModel } from '../src/derivatives/options-pricer.js';
import { BondPricer, YieldCurveBuilder } from '../src/derivatives/bonds.js';
import {
  MeanVarianceOptimizer,
  EfficientFrontierCalculator,
  RiskParityOptimizer,
} from '../src/portfolio/optimizer.js';
import {
  HistoricalVaR,
  ParametricVaR,
  MonteCarloVaR,
  RiskMetricsCalculator,
} from '../src/risk/var-calculator.js';
import {
  StressTestEngine,
  SensitivityAnalyzer,
  HISTORICAL_SCENARIOS,
} from '../src/risk/stress-testing.js';
import { ARIMAForecaster, GARCHModel } from '../src/timeseries/forecast.js';
import { MonteCarloEngine } from '../src/pricing/monte-carlo.js';
import {
  BrinsonAttribution,
  FactorAttribution,
  PerformanceMetricsCalculator,
} from '../src/analytics/performance-attribution.js';
import {
  MarketDataHandler,
  TechnicalIndicators,
  MarketStatistics,
} from '../src/data/market-data.js';

import type {
  OptionContract,
  BondContract,
  Portfolio,
  Position,
  ARIMAParams,
  GARCHParams,
} from '../src/types.js';

// ============================================================================
// Demo 1: Options Pricing
// ============================================================================

async function demoOptionsPricing() {
  console.log('\n=== Options Pricing Demo ===\n');

  const optionContract: OptionContract = {
    id: 'AAPL-CALL-170-2024-12-20',
    underlying: 'AAPL',
    type: 'call',
    style: 'european',
    strike: 170,
    expiry: new Date('2024-12-20'),
    quantity: 100,
  };

  const spotPrice = 175;
  const riskFreeRate = 0.05;
  const volatility = 0.25;

  console.log('Option Details:');
  console.log(`- Underlying: ${optionContract.underlying}`);
  console.log(`- Type: ${optionContract.type}`);
  console.log(`- Strike: $${optionContract.strike}`);
  console.log(`- Spot Price: $${spotPrice}`);
  console.log(`- Volatility: ${(volatility * 100).toFixed(2)}%`);
  console.log();

  // Black-Scholes pricing
  console.log('1. Black-Scholes Model:');
  const bsResult = await OptionsPricingEngine.priceOption(
    optionContract,
    spotPrice,
    riskFreeRate,
    volatility,
    'black-scholes'
  );
  console.log(`   Price: $${bsResult.price.toFixed(2)}`);
  console.log(`   Greeks:`);
  console.log(`     Delta: ${bsResult.greeks.delta.toFixed(4)}`);
  console.log(`     Gamma: ${bsResult.greeks.gamma.toFixed(4)}`);
  console.log(`     Theta: ${bsResult.greeks.theta.toFixed(4)}`);
  console.log(`     Vega: ${bsResult.greeks.vega.toFixed(4)}`);
  console.log(`     Rho: ${bsResult.greeks.rho.toFixed(4)}`);
  console.log(`   Compute Time: ${bsResult.computeTimeMs.toFixed(2)}ms`);
  console.log();

  // Binomial tree pricing
  console.log('2. Binomial Tree Model:');
  const binomialResult = await OptionsPricingEngine.priceOption(
    optionContract,
    spotPrice,
    riskFreeRate,
    volatility,
    'binomial'
  );
  console.log(`   Price: $${binomialResult.price.toFixed(2)}`);
  console.log(`   Compute Time: ${binomialResult.computeTimeMs.toFixed(2)}ms`);
  console.log();

  // Monte Carlo pricing
  console.log('3. Monte Carlo Simulation:');
  const mcResult = await OptionsPricingEngine.priceOption(
    optionContract,
    spotPrice,
    riskFreeRate,
    volatility,
    'monte-carlo'
  );
  console.log(`   Price: $${mcResult.price.toFixed(2)}`);
  console.log(`   Compute Time: ${mcResult.computeTimeMs.toFixed(2)}ms`);
  console.log();

  // Implied volatility
  console.log('4. Implied Volatility:');
  const marketPrice = 12.50;
  const impliedVol = BlackScholesModel.impliedVolatility(
    marketPrice,
    {
      spotPrice,
      strike: optionContract.strike,
      timeToMaturity: 0.5,
      riskFreeRate,
      optionType: optionContract.type,
    },
    0.3
  );
  console.log(`   Market Price: $${marketPrice.toFixed(2)}`);
  console.log(`   Implied Volatility: ${(impliedVol * 100).toFixed(2)}%`);
  console.log();
}

// ============================================================================
// Demo 2: Bond Pricing
// ============================================================================

async function demoBondPricing() {
  console.log('\n=== Bond Pricing Demo ===\n');

  // Build yield curve
  const maturities = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 20, 30];
  const rates = [0.045, 0.048, 0.050, 0.052, 0.053, 0.055, 0.056, 0.057, 0.058, 0.058];

  const yieldCurve = YieldCurveBuilder.buildCurve(maturities, rates, 'cubic');

  console.log('Yield Curve:');
  console.log('Maturity | Rate');
  console.log('---------|------');
  for (let i = 0; i < maturities.length; i++) {
    console.log(`${maturities[i].toString().padEnd(8)} | ${(rates[i] * 100).toFixed(2)}%`);
  }
  console.log();

  // Price a bond
  const bond: BondContract = {
    id: 'BOND-001',
    issuer: 'US Treasury',
    type: 'fixed-rate',
    faceValue: 1000,
    couponRate: 0.05,
    couponFrequency: 2,
    issueDate: new Date('2020-01-01'),
    maturityDate: new Date('2030-01-01'),
  };

  const settlementDate = new Date('2024-01-01');
  const bondResult = BondPricer.price(bond, yieldCurve, settlementDate);

  console.log('Bond Details:');
  console.log(`- Face Value: $${bond.faceValue}`);
  console.log(`- Coupon Rate: ${(bond.couponRate * 100).toFixed(2)}%`);
  console.log(`- Maturity: ${bond.maturityDate.toDateString()}`);
  console.log();

  console.log('Pricing Results:');
  console.log(`- Clean Price: $${bondResult.cleanPrice.toFixed(2)}`);
  console.log(`- Accrued Interest: $${bondResult.accruedInterest.toFixed(2)}`);
  console.log(`- Dirty Price: $${bondResult.dirtyPrice.toFixed(2)}`);
  console.log(`- Yield to Maturity: ${(bondResult.yieldToMaturity * 100).toFixed(2)}%`);
  console.log(`- Duration: ${bondResult.duration.toFixed(2)} years`);
  console.log(`- Modified Duration: ${bondResult.modifiedDuration.toFixed(2)}`);
  console.log(`- Convexity: ${bondResult.convexity.toFixed(2)}`);
  console.log(`- DV01: $${bondResult.dv01.toFixed(4)}`);
  console.log();
}

// ============================================================================
// Demo 3: Portfolio Optimization
// ============================================================================

async function demoPortfolioOptimization() {
  console.log('\n=== Portfolio Optimization Demo ===\n');

  // Sample expected returns and covariance matrix
  const assets = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
  const expectedReturns = [0.12, 0.10, 0.11, 0.13, 0.15];

  const covarianceMatrix = [
    [0.04, 0.01, 0.02, 0.015, 0.025],
    [0.01, 0.03, 0.015, 0.01, 0.02],
    [0.02, 0.015, 0.035, 0.018, 0.022],
    [0.015, 0.01, 0.018, 0.045, 0.028],
    [0.025, 0.02, 0.022, 0.028, 0.06],
  ];

  const riskFreeRate = 0.03;

  console.log('Assets:', assets.join(', '));
  console.log('Expected Returns:', expectedReturns.map(r => `${(r * 100).toFixed(1)}%`).join(', '));
  console.log();

  // Maximum Sharpe ratio
  console.log('1. Maximum Sharpe Ratio Portfolio:');
  const maxSharpeResult = MeanVarianceOptimizer.maximizeSharpe(
    expectedReturns,
    covarianceMatrix,
    riskFreeRate
  );

  console.log('   Optimal Weights:');
  for (let i = 0; i < assets.length; i++) {
    console.log(`     ${assets[i]}: ${(maxSharpeResult.weights[i] * 100).toFixed(2)}%`);
  }
  console.log(`   Expected Return: ${(maxSharpeResult.expectedReturn * 100).toFixed(2)}%`);
  console.log(`   Expected Volatility: ${(maxSharpeResult.expectedVolatility * 100).toFixed(2)}%`);
  console.log(`   Sharpe Ratio: ${maxSharpeResult.sharpeRatio.toFixed(3)}`);
  console.log(`   Compute Time: ${maxSharpeResult.computeTimeMs.toFixed(2)}ms`);
  console.log();

  // Minimum variance
  console.log('2. Minimum Variance Portfolio:');
  const minVarResult = MeanVarianceOptimizer.minimizeVariance(
    expectedReturns,
    covarianceMatrix
  );

  console.log('   Optimal Weights:');
  for (let i = 0; i < assets.length; i++) {
    console.log(`     ${assets[i]}: ${(minVarResult.weights[i] * 100).toFixed(2)}%`);
  }
  console.log(`   Expected Return: ${(minVarResult.expectedReturn * 100).toFixed(2)}%`);
  console.log(`   Expected Volatility: ${(minVarResult.expectedVolatility * 100).toFixed(2)}%`);
  console.log();

  // Efficient frontier
  console.log('3. Efficient Frontier:');
  const frontier = EfficientFrontierCalculator.calculate(
    expectedReturns,
    covarianceMatrix,
    riskFreeRate,
    20
  );

  console.log(`   Generated ${frontier.points.length} points`);
  console.log('   Sample points:');
  for (let i = 0; i < Math.min(5, frontier.points.length); i++) {
    const point = frontier.points[i];
    console.log(
      `     Return: ${(point.expectedReturn * 100).toFixed(2)}%, ` +
      `Volatility: ${(point.volatility * 100).toFixed(2)}%, ` +
      `Sharpe: ${point.sharpeRatio.toFixed(3)}`
    );
  }
  console.log();

  // Risk parity
  console.log('4. Risk Parity Portfolio:');
  const riskParityResult = RiskParityOptimizer.optimize(covarianceMatrix);

  console.log('   Optimal Weights:');
  for (let i = 0; i < assets.length; i++) {
    console.log(`     ${assets[i]}: ${(riskParityResult.weights[i] * 100).toFixed(2)}%`);
  }
  console.log(`   Expected Volatility: ${(riskParityResult.expectedVolatility * 100).toFixed(2)}%`);
  console.log();
}

// ============================================================================
// Demo 4: Risk Management
// ============================================================================

async function demoRiskManagement() {
  console.log('\n=== Risk Management Demo ===\n');

  // Generate sample returns
  const returns: number[] = [];
  for (let i = 0; i < 252; i++) {
    returns.push((Math.random() - 0.5) * 0.04);
  }

  // Historical VaR
  console.log('1. Historical Value at Risk:');
  const historicalVar95 = HistoricalVaR.calculate(returns, 0.95);
  const historicalVar99 = HistoricalVaR.calculate(returns, 0.99);

  console.log(`   VaR (95%): ${(historicalVar95.var * 100).toFixed(2)}%`);
  console.log(`   CVaR (95%): ${(historicalVar95.cvar * 100).toFixed(2)}%`);
  console.log(`   VaR (99%): ${(historicalVar99.var * 100).toFixed(2)}%`);
  console.log(`   CVaR (99%): ${(historicalVar99.cvar * 100).toFixed(2)}%`);
  console.log();

  // Parametric VaR
  console.log('2. Parametric Value at Risk:');
  const portfolioValue = 1000000;
  const expectedReturn = 0.10;
  const volatility = 0.20;

  const parametricVar = ParametricVaR.calculate(
    portfolioValue,
    expectedReturn / 252,
    volatility / Math.sqrt(252),
    0.95,
    1
  );

  console.log(`   Portfolio Value: $${portfolioValue.toLocaleString()}`);
  console.log(`   VaR (95%, 1-day): $${parametricVar.var.toFixed(2)}`);
  console.log(`   CVaR (95%, 1-day): $${parametricVar.cvar.toFixed(2)}`);
  console.log();

  // Monte Carlo VaR
  console.log('3. Monte Carlo Value at Risk:');
  const mcVar = MonteCarloVaR.calculate(
    portfolioValue,
    expectedReturn / 252,
    volatility / Math.sqrt(252),
    0.95,
    1,
    10000,
    42
  );

  console.log(`   VaR (95%, 1-day): $${mcVar.var.toFixed(2)}`);
  console.log(`   CVaR (95%, 1-day): $${mcVar.cvar.toFixed(2)}`);
  console.log();

  // Risk metrics
  console.log('4. Comprehensive Risk Metrics:');
  const riskMetrics = RiskMetricsCalculator.calculate(returns);

  console.log(`   Volatility: ${(riskMetrics.volatility * 100).toFixed(2)}%`);
  console.log(`   Sharpe Ratio: ${riskMetrics.sharpeRatio.toFixed(3)}`);
  console.log(`   Sortino Ratio: ${riskMetrics.sortinoRatio.toFixed(3)}`);
  console.log(`   Max Drawdown: ${(riskMetrics.maxDrawdown * 100).toFixed(2)}%`);
  console.log(`   Max DD Duration: ${riskMetrics.maxDrawdownDuration} days`);
  console.log();
}

// ============================================================================
// Demo 5: Stress Testing
// ============================================================================

async function demoStressTesting() {
  console.log('\n=== Stress Testing Demo ===\n');

  const portfolio: Portfolio = {
    id: 'PORTFOLIO-001',
    name: 'Sample Portfolio',
    positions: [
      {
        symbol: 'SPY',
        assetClass: 'equity',
        quantity: 100,
        entryPrice: 400,
        currentPrice: 420,
        marketValue: 42000,
        weight: 0.42,
        pnl: 2000,
        pnlPercent: 0.05,
      },
      {
        symbol: 'QQQ',
        assetClass: 'equity',
        quantity: 50,
        entryPrice: 350,
        currentPrice: 370,
        marketValue: 18500,
        weight: 0.185,
        pnl: 1000,
        pnlPercent: 0.057,
      },
      {
        symbol: 'TLT',
        assetClass: 'fixed-income',
        quantity: 200,
        entryPrice: 95,
        currentPrice: 98,
        marketValue: 19600,
        weight: 0.196,
        pnl: 600,
        pnlPercent: 0.032,
      },
      {
        symbol: 'GLD',
        assetClass: 'commodity',
        quantity: 100,
        entryPrice: 180,
        currentPrice: 190,
        marketValue: 19000,
        weight: 0.19,
        pnl: 1000,
        pnlPercent: 0.056,
      },
    ],
    cash: 900,
    totalValue: 100000,
    currency: 'USD',
    lastUpdate: new Date(),
  };

  console.log('Portfolio Composition:');
  for (const pos of portfolio.positions) {
    console.log(`  ${pos.symbol}: ${(pos.weight * 100).toFixed(1)}% ($${pos.marketValue.toLocaleString()})`);
  }
  console.log();

  console.log('Historical Stress Scenarios:');
  const stressResults = StressTestEngine.runHistoricalScenarios(portfolio);

  for (const result of stressResults.slice(0, 3)) {
    console.log(`\n${result.scenario.name}:`);
    console.log(`  Portfolio Impact: $${result.portfolioImpact.toFixed(0)} (${(result.portfolioImpactPercent * 100).toFixed(2)}%)`);
    console.log('  Top 3 position impacts:');

    const sortedImpacts = Array.from(result.positionImpacts.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3);

    for (const [symbol, impact] of sortedImpacts) {
      console.log(`    ${symbol}: $${impact.toFixed(0)}`);
    }
  }
  console.log();

  // Sensitivity analysis
  console.log('Sensitivity Analysis (SPY):');
  const sensitivity = SensitivityAnalyzer.singleFactorSensitivity(
    portfolio,
    'SPY',
    [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3]
  );

  for (const point of sensitivity) {
    console.log(
      `  Shock: ${(point.shock * 100).toFixed(0)}% -> ` +
      `Impact: $${point.impact.toFixed(0)} (${(point.impactPercent * 100).toFixed(2)}%)`
    );
  }
  console.log();
}

// ============================================================================
// Demo 6: Time Series Forecasting
// ============================================================================

async function demoTimeSeriesForecasting() {
  console.log('\n=== Time Series Forecasting Demo ===\n');

  // Generate sample price data
  const prices: number[] = [100];
  for (let i = 1; i < 252; i++) {
    const return_ = (Math.random() - 0.48) * 0.02;
    prices.push(prices[i - 1] * (1 + return_));
  }

  console.log('Price Series:');
  console.log(`  Start Price: $${prices[0].toFixed(2)}`);
  console.log(`  End Price: $${prices[prices.length - 1].toFixed(2)}`);
  console.log(`  Total Return: ${(((prices[prices.length - 1] / prices[0]) - 1) * 100).toFixed(2)}%`);
  console.log();

  // ARIMA forecast
  console.log('1. ARIMA Forecast:');
  const arimaParams: ARIMAParams = { p: 2, d: 1, q: 2 };
  const arimaForecast = ARIMAForecaster.forecast(prices, arimaParams, 10);

  console.log(`  Model: ARIMA(${arimaParams.p}, ${arimaParams.d}, ${arimaParams.q})`);
  console.log(`  Forecast horizon: ${arimaForecast.horizon} days`);
  console.log('  Predictions:');
  for (let i = 0; i < Math.min(5, arimaForecast.predictions.length); i++) {
    console.log(
      `    Day ${i + 1}: $${arimaForecast.predictions[i].toFixed(2)} ` +
      `[${arimaForecast.lowerBound[i].toFixed(2)}, ${arimaForecast.upperBound[i].toFixed(2)}]`
    );
  }
  console.log(`  MSE: ${arimaForecast.mse.toFixed(4)}`);
  console.log(`  MAE: ${arimaForecast.mae.toFixed(4)}`);
  console.log();

  // GARCH volatility forecast
  console.log('2. GARCH Volatility Forecast:');
  const returns = MarketDataHandler.calculateReturns(prices);
  const garchParams: GARCHParams = { p: 1, q: 1 };
  const garchForecast = GARCHModel.forecast(returns, garchParams, 10);

  console.log(`  Model: GARCH(${garchParams.p}, ${garchParams.q})`);
  console.log(`  Forecast horizon: ${garchForecast.horizon} days`);
  console.log('  Volatility predictions (annualized):');
  for (let i = 0; i < Math.min(5, garchForecast.predictions.length); i++) {
    console.log(`    Day ${i + 1}: ${(garchForecast.predictions[i] * 100).toFixed(2)}%`);
  }
  console.log();
}

// ============================================================================
// Demo 7: Performance Attribution
// ============================================================================

async function demoPerformanceAttribution() {
  console.log('\n=== Performance Attribution Demo ===\n');

  // Generate sample portfolio and benchmark returns
  const portfolioReturns: number[] = [];
  const benchmarkReturns: number[] = [];

  for (let i = 0; i < 252; i++) {
    portfolioReturns.push((Math.random() - 0.45) * 0.03);
    benchmarkReturns.push((Math.random() - 0.48) * 0.025);
  }

  console.log('1. Performance Metrics:');
  const metrics = PerformanceMetricsCalculator.calculate(
    portfolioReturns,
    benchmarkReturns
  );

  console.log(`   Total Return: ${(metrics.totalReturn * 100).toFixed(2)}%`);
  console.log(`   Annualized Return: ${(metrics.annualizedReturn * 100).toFixed(2)}%`);
  console.log(`   Volatility: ${(metrics.volatility * 100).toFixed(2)}%`);
  console.log(`   Sharpe Ratio: ${metrics.sharpeRatio.toFixed(3)}`);
  console.log(`   Sortino Ratio: ${metrics.sortinoRatio.toFixed(3)}`);
  console.log(`   Max Drawdown: ${(metrics.maxDrawdown * 100).toFixed(2)}%`);
  console.log(`   Alpha: ${(metrics.alpha * 100).toFixed(2)}%`);
  console.log(`   Beta: ${metrics.beta.toFixed(3)}`);
  console.log(`   Information Ratio: ${metrics.informationRatio.toFixed(3)}`);
  console.log(`   Tracking Error: ${(metrics.trackingError * 100).toFixed(2)}%`);
  console.log();

  // Brinson attribution
  console.log('2. Brinson Attribution:');
  const portfolioWeights = new Map([
    ['Tech', 0.40],
    ['Finance', 0.30],
    ['Healthcare', 0.20],
    ['Energy', 0.10],
  ]);

  const benchmarkWeights = new Map([
    ['Tech', 0.35],
    ['Finance', 0.25],
    ['Healthcare', 0.25],
    ['Energy', 0.15],
  ]);

  const portSectorReturns = new Map([
    ['Tech', 0.15],
    ['Finance', 0.08],
    ['Healthcare', 0.12],
    ['Energy', -0.05],
  ]);

  const benchSectorReturns = new Map([
    ['Tech', 0.12],
    ['Finance', 0.10],
    ['Healthcare', 0.09],
    ['Energy', -0.02],
  ]);

  const attribution = BrinsonAttribution.analyze(
    portfolioWeights,
    benchmarkWeights,
    portSectorReturns,
    benchSectorReturns
  );

  console.log(`   Sector Allocation Effect: ${(attribution.sector * 100).toFixed(2)}%`);
  console.log(`   Security Selection Effect: ${(attribution.security * 100).toFixed(2)}%`);
  console.log(`   Interaction Effect: ${(attribution.interaction * 100).toFixed(2)}%`);
  console.log(
    `   Total Active Return: ${((attribution.sector + attribution.security + attribution.interaction) * 100).toFixed(2)}%`
  );
  console.log();
}

// ============================================================================
// Main Demo Runner
// ============================================================================

async function runAllDemos() {
  console.log('━'.repeat(80));
  console.log('   FINANCIAL MODELING PLATFORM - COMPREHENSIVE DEMO');
  console.log('   Powered by Elide Polyglot Runtime');
  console.log('━'.repeat(80));

  const startTime = performance.now();

  try {
    await demoOptionsPricing();
    await demoBondPricing();
    await demoPortfolioOptimization();
    await demoRiskManagement();
    await demoStressTesting();
    await demoTimeSeriesForecasting();
    await demoPerformanceAttribution();

    const totalTime = performance.now() - startTime;

    console.log('━'.repeat(80));
    console.log(`   ALL DEMOS COMPLETED IN ${totalTime.toFixed(2)}ms`);
    console.log('━'.repeat(80));
  } catch (error) {
    console.error('Error running demos:', error);
    throw error;
  }
}

// Run demos
runAllDemos().catch(console.error);
