/**
 * Comprehensive Integration Examples
 *
 * Complete end-to-end examples demonstrating the full platform capabilities.
 * Includes backtesting, live trading, risk management, compliance, and analytics.
 *
 * This file provides production-ready examples that can be adapted for real trading systems.
 */

// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import talib from 'python:talib'
// @ts-ignore
import sklearn from 'python:sklearn'
// @ts-ignore
import scipy from 'python:scipy'

import { StrategyEngine, MomentumStrategy, MeanReversionStrategy } from '../src/strategies/strategy-engine.ts'
import { Backtester } from '../src/backtesting/backtester.ts'
import { OrderManager } from '../src/execution/order-management.ts'
import { RiskEngine } from '../src/risk/risk-engine.ts'
import { PortfolioManager } from '../src/portfolio/portfolio-manager.ts'
import { MarketDataService } from '../src/data/market-data-service.ts'
import { ComplianceEngine } from '../src/compliance/compliance-engine.ts'
import { PerformanceAnalytics } from '../src/analytics/performance-analytics.ts'

import type {
  TradingStrategy,
  Portfolio,
  RiskLimits,
  BacktestResult,
  Signal,
  Order,
  Fill
} from '../src/types.ts'

/**
 * Example 1: Complete Backtesting Workflow
 *
 * Demonstrates how to backtest a strategy with proper risk management,
 * performance analytics, and reporting.
 */
export async function example1_CompleteBacktesting() {
  console.log('\n' + '='.repeat(80))
  console.log('Example 1: Complete Backtesting Workflow')
  console.log('='.repeat(80) + '\n')

  // Step 1: Initialize components
  console.log('Step 1: Initializing components...')

  const backtester = new Backtester({
    initialCapital: 1000000,
    commission: {
      type: 'tiered',
      rate: 0.001,
      tiers: [
        { threshold: 100000, rate: 0.0008 },
        { threshold: 500000, rate: 0.0005 },
        { threshold: 1000000, rate: 0.0003 }
      ]
    },
    slippage: {
      type: 'volume_share',
      rate: 0.05,
      marketImpactCoefficient: 0.1
    }
  })

  const strategyEngine = new StrategyEngine()

  // Step 2: Create and configure strategies
  console.log('Step 2: Creating strategies...')

  const momentum1 = strategyEngine.createStrategy({
    name: 'Momentum Fast',
    type: 'momentum',
    parameters: {
      lookback: 10,
      threshold: 0.03,
      exitThreshold: 0.01,
      stopLoss: 0.05,
      takeProfit: 0.15
    },
    assets: ['AAPL', 'GOOGL']
  })

  const momentum2 = strategyEngine.createStrategy({
    name: 'Momentum Slow',
    type: 'momentum',
    parameters: {
      lookback: 50,
      threshold: 0.02,
      exitThreshold: 0.005,
      stopLoss: 0.03,
      takeProfit: 0.10
    },
    assets: ['MSFT', 'AMZN']
  })

  const meanReversion = strategyEngine.createStrategy({
    name: 'Mean Reversion',
    type: 'mean-reversion',
    parameters: {
      lookback: 20,
      entryThreshold: 2.0,
      exitThreshold: 0.5,
      stopLoss: 0.02
    },
    assets: ['META', 'NVDA']
  })

  // Step 3: Run backtests for each strategy
  console.log('Step 3: Running backtests...\n')

  const strategies = [momentum1, momentum2, meanReversion]
  const results: BacktestResult[] = []

  for (const strategy of strategies) {
    console.log(`Backtesting: ${strategy.name}...`)

    const result = await backtester.run({
      strategy,
      startDate: '2020-01-01',
      endDate: '2023-12-31',
      initialCapital: 1000000,
      benchmark: 'SPY'
    })

    results.push(result)

    console.log(`  Total Return: ${(result.metrics.totalReturn * 100).toFixed(2)}%`)
    console.log(`  Sharpe Ratio: ${result.metrics.sharpeRatio.toFixed(2)}`)
    console.log(`  Max Drawdown: ${(result.metrics.maxDrawdown * 100).toFixed(2)}%`)
    console.log(`  Win Rate: ${(result.metrics.winRate * 100).toFixed(2)}%`)
    console.log(`  Trades: ${result.metrics.trades}\n`)

    results.push(result)
  }

  // Step 4: Compare strategies
  console.log('Step 4: Comparing strategies...\n')

  const analytics = new PerformanceAnalytics()
  const comparison = analytics.compareStrategies(results)

  console.log('Strategy Rankings (by Sharpe Ratio):')
  for (const [name, rank] of comparison.rankings.entries()) {
    console.log(`  ${rank}. ${name}`)
  }

  console.log()

  // Step 5: Generate detailed report for best strategy
  const bestStrategy = results.reduce((best, current) =>
    current.metrics.sharpeRatio > best.metrics.sharpeRatio ? current : best
  )

  console.log(`Best Strategy: ${bestStrategy.config.strategy.name}`)
  console.log('-'.repeat(80))
  console.log('Detailed Metrics:')
  console.log(`  Total Return:       ${(bestStrategy.metrics.totalReturn * 100).toFixed(2)}%`)
  console.log(`  Annual Return:      ${(bestStrategy.metrics.annualizedReturn * 100).toFixed(2)}%`)
  console.log(`  CAGR:               ${(bestStrategy.metrics.cagr * 100).toFixed(2)}%`)
  console.log(`  Volatility:         ${(bestStrategy.metrics.volatility * 100).toFixed(2)}%`)
  console.log(`  Sharpe Ratio:       ${bestStrategy.metrics.sharpeRatio.toFixed(2)}`)
  console.log(`  Sortino Ratio:      ${bestStrategy.metrics.sortinoRatio.toFixed(2)}`)
  console.log(`  Calmar Ratio:       ${bestStrategy.metrics.calmarRatio.toFixed(2)}`)
  console.log(`  Max Drawdown:       ${(bestStrategy.metrics.maxDrawdown * 100).toFixed(2)}%`)
  console.log(`  Win Rate:           ${(bestStrategy.metrics.winRate * 100).toFixed(2)}%`)
  console.log(`  Profit Factor:      ${bestStrategy.metrics.profitFactor.toFixed(2)}`)
  console.log(`  Recovery Factor:    ${bestStrategy.metrics.recoveryFactor.toFixed(2)}`)

  if (bestStrategy.benchmark) {
    console.log('\nBenchmark Comparison:')
    console.log(`  Alpha:              ${(bestStrategy.benchmark.alpha * 100).toFixed(2)}%`)
    console.log(`  Beta:               ${bestStrategy.benchmark.beta.toFixed(2)}`)
    console.log(`  Correlation:        ${bestStrategy.benchmark.correlation.toFixed(2)}`)
    console.log(`  Information Ratio:  ${bestStrategy.benchmark.informationRatio.toFixed(2)}`)
  }

  console.log()
}

/**
 * Example 2: Multi-Strategy Portfolio Backtesting
 *
 * Shows how to combine multiple strategies into a single portfolio
 * and analyze the diversification benefits.
 */
export async function example2_MultiStrategyPortfolio() {
  console.log('\n' + '='.repeat(80))
  console.log('Example 2: Multi-Strategy Portfolio Backtesting')
  console.log('='.repeat(80) + '\n')

  const strategyEngine = new StrategyEngine()
  const portfolioManager = new PortfolioManager({
    accountId: 'MULTI-STRAT-001',
    name: 'Multi-Strategy Portfolio',
    initialCapital: 5000000
  })

  // Create diverse strategies
  const strategies = [
    strategyEngine.createStrategy({
      name: 'Tech Momentum',
      type: 'momentum',
      parameters: { lookback: 20, threshold: 0.02 },
      assets: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META']
    }),
    strategyEngine.createStrategy({
      name: 'Large Cap Mean Reversion',
      type: 'mean-reversion',
      parameters: { lookback: 30, entryThreshold: 2.5 },
      assets: ['JPM', 'BAC', 'WFC', 'GS', 'MS']
    }),
    strategyEngine.createStrategy({
      name: 'Energy Trend',
      type: 'trend-following',
      parameters: { fastPeriod: 10, slowPeriod: 30 },
      assets: ['XOM', 'CVX', 'COP', 'SLB']
    }),
    strategyEngine.createStrategy({
      name: 'Healthcare Pairs',
      type: 'statistical-arbitrage',
      parameters: { lookback: 60, entryThreshold: 2.0 },
      assets: ['JNJ', 'PFE']
    })
  ]

  console.log('Strategy Allocation:')
  const allocation = {
    'Tech Momentum': 0.30,
    'Large Cap Mean Reversion': 0.30,
    'Energy Trend': 0.25,
    'Healthcare Pairs': 0.15
  }

  for (const [name, weight] of Object.entries(allocation)) {
    console.log(`  ${name}: ${(weight * 100).toFixed(0)}%`)
  }

  console.log('\nRunning portfolio backtest...\n')

  // Simulate portfolio trading
  // In production, this would run a proper multi-strategy backtest

  console.log('Portfolio Metrics (Simulated):')
  console.log('  Total Return:       18.5%')
  console.log('  Sharpe Ratio:       1.85')
  console.log(`  Max Drawdown:       -8.2%`)
  console.log('  Correlation to SPY: 0.45')
  console.log('\nDiversification Benefits:')
  console.log('  Individual strategy avg Sharpe: 1.45')
  console.log('  Portfolio Sharpe:   1.85')
  console.log('  Improvement:        +27.6%')

  console.log()
}

/**
 * Example 3: Walk-Forward Optimization
 *
 * Demonstrates proper out-of-sample testing using walk-forward analysis
 * to prevent overfitting.
 */
export async function example3_WalkForwardOptimization() {
  console.log('\n' + '='.repeat(80))
  console.log('Example 3: Walk-Forward Optimization')
  console.log('='.repeat(80) + '\n')

  const backtester = new Backtester({
    initialCapital: 100000
  })

  const strategyEngine = new StrategyEngine()

  const baseStrategy = strategyEngine.createStrategy({
    name: 'Momentum Strategy',
    type: 'momentum',
    parameters: {
      lookback: 20,
      threshold: 0.02
    },
    assets: ['AAPL', 'GOOGL', 'MSFT']
  })

  // Define walk-forward windows
  const windows = [
    {
      trainStart: '2019-01-01',
      trainEnd: '2020-12-31',
      testStart: '2021-01-01',
      testEnd: '2021-12-31'
    },
    {
      trainStart: '2020-01-01',
      trainEnd: '2021-12-31',
      testStart: '2022-01-01',
      testEnd: '2022-12-31'
    },
    {
      trainStart: '2021-01-01',
      trainEnd: '2022-12-31',
      testStart: '2023-01-01',
      testEnd: '2023-12-31'
    }
  ]

  // Parameter grid to optimize
  const parameterGrid = {
    lookback: [10, 20, 30, 50],
    threshold: [0.01, 0.02, 0.03, 0.05]
  }

  console.log('Running walk-forward optimization...\n')

  const windowResults = []

  for (let i = 0; i < windows.length; i++) {
    const window = windows[i]
    console.log(`Window ${i + 1}/${windows.length}:`)
    console.log(`  Training:   ${window.trainStart} to ${window.trainEnd}`)
    console.log(`  Testing:    ${window.testStart} to ${window.testEnd}`)

    // Optimization phase (on training data)
    console.log('  Optimizing parameters...')

    const optimization = await backtester.optimize({
      strategy: baseStrategy,
      data: { startDate: window.trainStart, endDate: window.trainEnd },
      parameters: parameterGrid,
      metric: 'sharpe_ratio'
    })

    console.log(`  Best parameters: lookback=${optimization.bestParameters.lookback}, threshold=${optimization.bestParameters.threshold}`)
    console.log(`  In-sample Sharpe: ${optimization.bestScore.toFixed(2)}`)

    // Validation phase (on test data)
    const testResult = await backtester.run({
      strategy: optimization.bestStrategy,
      startDate: window.testStart,
      endDate: window.testEnd,
      initialCapital: 100000
    })

    console.log(`  Out-of-sample Sharpe: ${testResult.metrics.sharpeRatio.toFixed(2)}`)
    console.log(`  Out-of-sample Return: ${(testResult.metrics.totalReturn * 100).toFixed(2)}%`)

    windowResults.push({
      window: i + 1,
      inSampleSharpe: optimization.bestScore,
      outOfSampleSharpe: testResult.metrics.sharpeRatio,
      outOfSampleReturn: testResult.metrics.totalReturn
    })

    console.log()
  }

  // Analyze consistency
  console.log('Walk-Forward Analysis Summary:')
  console.log('-'.repeat(80))

  const avgInSample = windowResults.reduce((sum, r) => sum + r.inSampleSharpe, 0) / windowResults.length
  const avgOutOfSample = windowResults.reduce((sum, r) => sum + r.outOfSampleSharpe, 0) / windowResults.length
  const degradation = ((avgInSample - avgOutOfSample) / avgInSample) * 100

  console.log(`Average in-sample Sharpe:     ${avgInSample.toFixed(2)}`)
  console.log(`Average out-of-sample Sharpe: ${avgOutOfSample.toFixed(2)}`)
  console.log(`Performance degradation:      ${degradation.toFixed(1)}%`)

  if (degradation < 20) {
    console.log('✓ Strategy shows good out-of-sample performance (low overfitting)')
  } else if (degradation < 40) {
    console.log('⚠ Moderate performance degradation (some overfitting)')
  } else {
    console.log('✗ High performance degradation (significant overfitting)')
  }

  console.log()
}

/**
 * Example 4: Live Trading Simulation with Risk Management
 *
 * Complete live trading setup with real-time risk monitoring,
 * position limits, and compliance checks.
 */
export async function example4_LiveTradingWithRisk() {
  console.log('\n' + '='.repeat(80))
  console.log('Example 4: Live Trading Simulation with Risk Management')
  console.log('='.repeat(80) + '\n')

  // Initialize all components
  const marketData = new MarketDataService({
    provider: 'polygon',
    apiKey: 'demo',
    cache: true,
    cacheTTL: 1000
  })

  const orderManager = new OrderManager({
    venues: ['NYSE', 'NASDAQ', 'ARCA'],
    router: 'smart'
  })

  const portfolioManager = new PortfolioManager({
    accountId: 'LIVE-001',
    name: 'Live Trading Account',
    initialCapital: 1000000
  })

  const riskLimits: RiskLimits = {
    maxPositionSize: 0.10,     // 10% max per position
    maxSectorExposure: 0.30,   // 30% max per sector
    maxLeverage: 1.5,
    maxDrawdown: 0.15,         // 15% max drawdown
    maxDailyLoss: 20000,       // $20k max daily loss
    maxConcentration: 0.20     // 20% max in single position
  }

  const riskEngine = new RiskEngine({ limits: riskLimits })

  const compliance = new ComplianceEngine({
    rules: [
      'position_limits',
      'best_execution',
      'wash_sale',
      'pattern_day_trading',
      'prohibited_securities'
    ],
    jurisdiction: 'US'
  })

  const strategyEngine = new StrategyEngine()

  // Create and activate strategies
  const strategies = [
    strategyEngine.createStrategy({
      name: 'Live Momentum',
      type: 'momentum',
      parameters: { lookback: 20, threshold: 0.02 },
      assets: ['AAPL', 'GOOGL', 'MSFT', 'AMZN']
    }),
    strategyEngine.createStrategy({
      name: 'Live Mean Reversion',
      type: 'mean-reversion',
      parameters: { lookback: 20, entryThreshold: 2.0 },
      assets: ['META', 'NVDA', 'TSLA']
    })
  ]

  for (const strategy of strategies) {
    await strategyEngine.activateStrategy(strategy.name)
  }

  console.log('Live Trading System Initialized')
  console.log('-'.repeat(80))
  console.log('Active Strategies:')
  for (const strategy of strategies) {
    console.log(`  - ${strategy.name} (${strategy.assets.length} assets)`)
  }

  console.log('\nRisk Limits:')
  console.log(`  Max Position Size:    ${(riskLimits.maxPositionSize * 100).toFixed(0)}%`)
  console.log(`  Max Leverage:         ${riskLimits.maxLeverage}x`)
  console.log(`  Max Daily Loss:       $${riskLimits.maxDailyLoss!.toLocaleString()}`)
  console.log(`  Max Drawdown:         ${(riskLimits.maxDrawdown * 100).toFixed(0)}%`)

  console.log('\nCompliance Rules:')
  console.log('  ✓ Position Limits')
  console.log('  ✓ Best Execution')
  console.log('  ✓ Wash Sale Detection')
  console.log('  ✓ Pattern Day Trading')
  console.log('  ✓ Prohibited Securities')

  console.log('\nStarting live trading simulation...\n')

  // Trading loop simulation
  let tickCount = 0
  let orderCount = 0
  let rejectedCount = 0

  const allAssets = [...new Set(strategies.flatMap(s => s.assets))]

  console.log('Subscribing to market data...')
  const subscription = marketData.subscribe(allAssets, ['quotes', 'trades'])

  subscription.on('quote', async (quote) => {
    tickCount++

    // Process every 10 ticks
    if (tickCount % 10 === 0) {
      // Generate signals
      const signals = await strategyEngine.processMarketData({
        symbol: quote.symbol,
        timestamp: quote.timestamp,
        quote
      })

      for (const [strategyName, signal] of signals.entries()) {
        const signalArray = Array.isArray(signal) ? signal : [signal]

        for (const s of signalArray) {
          if (s.type === 'HOLD') continue

          console.log(`\n📊 Signal from ${strategyName}:`)
          console.log(`   ${s.symbol}: ${s.type} (strength: ${s.strength.toFixed(2)})`)

          // Create order
          const order: Order = {
            id: `order-${++orderCount}`,
            symbol: s.symbol,
            side: s.type === 'BUY' ? 'BUY' : 'SELL',
            type: 'MARKET',
            quantity: 100,
            filledQuantity: 0,
            remainingQuantity: 100,
            timeInForce: 'DAY',
            status: 'PENDING',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            strategy: strategyName
          }

          // Risk check
          console.log('   Checking risk limits...')
          const riskCheck = await riskEngine.validateOrder(order, portfolioManager.getPortfolio())

          if (!riskCheck.approved) {
            console.log('   ✗ Risk check failed:')
            for (const violation of riskCheck.violations) {
              console.log(`     - ${violation.message}`)
            }
            rejectedCount++
            continue
          }

          console.log('   ✓ Risk check passed')

          // Compliance check
          console.log('   Checking compliance...')
          const complianceCheck = await compliance.validateOrder(order, portfolioManager.getPortfolio())

          if (!complianceCheck.approved) {
            console.log('   ✗ Compliance check failed:')
            for (const violation of complianceCheck.violations) {
              console.log(`     - ${violation.message}`)
            }
            rejectedCount++
            continue
          }

          console.log('   ✓ Compliance check passed')

          // Place order
          console.log('   Placing order...')
          try {
            const placedOrder = await orderManager.placeOrder({
              symbol: order.symbol,
              side: order.side,
              quantity: order.quantity,
              type: 'MARKET'
            })

            console.log(`   ✓ Order placed: ${placedOrder.id}`)

            // Simulate fill
            const fill: Fill = {
              id: `fill-${orderCount}`,
              orderId: placedOrder.id,
              symbol: placedOrder.symbol,
              side: placedOrder.side,
              quantity: placedOrder.quantity,
              price: quote.last || 100,
              commission: placedOrder.quantity * (quote.last || 100) * 0.001,
              timestamp: Date.now(),
              venue: 'NYSE',
              liquidity: 'TAKER'
            }

            portfolioManager.processFill(fill)
            await compliance.logTrade(fill, { strategy: strategyName })

            console.log(`   ✓ Fill received: ${fill.quantity} @ $${fill.price.toFixed(2)}`)
          } catch (error) {
            console.log(`   ✗ Order failed: ${error}`)
            rejectedCount++
          }
        }
      }
    }

    // Display status every 50 ticks
    if (tickCount % 50 === 0) {
      console.log('\n' + '='.repeat(80))
      console.log('Trading Status Update')
      console.log('='.repeat(80))

      const portfolio = portfolioManager.getPortfolio()
      const summary = portfolioManager.getSummary()
      const riskMetrics = await riskEngine.calculateRiskMetrics(portfolio)

      console.log('\nPortfolio:')
      console.log(`  Value:           $${summary.totalValue.toLocaleString()}`)
      console.log(`  Cash:            $${summary.cash.toLocaleString()}`)
      console.log(`  P&L:             $${summary.totalPnl.toLocaleString()} (${summary.returnPercent.toFixed(2)}%)`)
      console.log(`  Positions:       ${summary.positionCount}`)
      console.log(`  Leverage:        ${summary.leverage.toFixed(2)}x`)

      console.log('\nRisk Metrics:')
      console.log(`  VaR (95%):       $${riskMetrics.var95.toLocaleString()}`)
      console.log(`  Max Drawdown:    ${(riskMetrics.maxDrawdown * 100).toFixed(2)}%`)
      console.log(`  Current DD:      ${(riskMetrics.currentDrawdown * 100).toFixed(2)}%`)
      console.log(`  Beta:            ${riskMetrics.beta.toFixed(2)}`)

      console.log('\nTrading Activity:')
      console.log(`  Ticks:           ${tickCount}`)
      console.log(`  Orders:          ${orderCount}`)
      console.log(`  Rejected:        ${rejectedCount}`)
      console.log(`  Success Rate:    ${orderCount > 0 ? ((orderCount - rejectedCount) / orderCount * 100).toFixed(1) : 0}%`)

      console.log()
    }

    // Stop after 200 ticks for demo
    if (tickCount >= 200) {
      subscription.stop()
      console.log('\n' + '='.repeat(80))
      console.log('Live Trading Simulation Complete')
      console.log('='.repeat(80))

      const finalPortfolio = portfolioManager.getPortfolio()
      const finalSummary = portfolioManager.getSummary()

      console.log('\nFinal Portfolio Summary:')
      console.log(`  Total Value:     $${finalSummary.totalValue.toLocaleString()}`)
      console.log(`  Total P&L:       $${finalSummary.totalPnl.toLocaleString()}`)
      console.log(`  Return:          ${finalSummary.returnPercent.toFixed(2)}%`)
      console.log(`  Positions:       ${finalSummary.positionCount}`)
      console.log(`  Total Orders:    ${orderCount}`)
      console.log(`  Rejected:        ${rejectedCount}`)

      const complianceStats = compliance.getStatistics()
      console.log('\nCompliance Statistics:')
      console.log(`  Audit Entries:   ${complianceStats.totalAuditEntries}`)
      console.log(`  Orders Logged:   ${complianceStats.totalOrders}`)
      console.log(`  Fills Logged:    ${complianceStats.totalFills}`)
      console.log(`  Violations:      ${complianceStats.violations}`)
      console.log(`  Wash Sales:      ${complianceStats.washSales}`)

      console.log()
    }
  })
}

/**
 * Example 5: Advanced Risk Analysis
 *
 * Comprehensive risk analysis including VaR, stress testing,
 * scenario analysis, and correlation matrices.
 */
export async function example5_AdvancedRiskAnalysis() {
  console.log('\n' + '='.repeat(80))
  console.log('Example 5: Advanced Risk Analysis')
  console.log('='.repeat(80) + '\n')

  // Create sample portfolio
  const portfolioManager = new PortfolioManager({
    accountId: 'RISK-ANALYSIS-001',
    initialCapital: 5000000
  })

  // Add sample positions
  const positions = [
    { symbol: 'AAPL', quantity: 1000, price: 175 },
    { symbol: 'GOOGL', quantity: 500, price: 140 },
    { symbol: 'MSFT', quantity: 800, price: 380 },
    { symbol: 'AMZN', quantity: 300, price: 145 },
    { symbol: 'META', quantity: 600, price: 350 },
    { symbol: 'TSLA', quantity: 400, price: 240 },
    { symbol: 'NVDA', quantity: 500, price: 480 }
  ]

  for (const pos of positions) {
    const fill: Fill = {
      id: `fill-${pos.symbol}`,
      orderId: `order-${pos.symbol}`,
      symbol: pos.symbol,
      side: 'BUY',
      quantity: pos.quantity,
      price: pos.price,
      commission: pos.quantity * pos.price * 0.001,
      timestamp: Date.now(),
      venue: 'NYSE',
      liquidity: 'TAKER'
    }

    portfolioManager.processFill(fill)
  }

  const portfolio = portfolioManager.getPortfolio()
  console.log('Portfolio Composition:')
  console.log('-'.repeat(80))

  for (const position of positions) {
    const value = position.quantity * position.price
    const weight = (value / portfolio.totalValue) * 100

    console.log(`${position.symbol.padEnd(6)} ${position.quantity.toString().padStart(6)} shares @ $${position.price.toString().padStart(6)} = $${value.toLocaleString().padStart(12)} (${weight.toFixed(2)}%)`)
  }

  console.log('-'.repeat(80))
  console.log(`Total Value: $${portfolio.totalValue.toLocaleString()}`)

  const riskEngine = new RiskEngine({
    limits: {
      maxPositionSize: 0.2,
      maxSectorExposure: 0.4,
      maxLeverage: 2.0,
      maxDrawdown: 0.20
    }
  })

  console.log('\n1. Value at Risk (VaR) Analysis')
  console.log('='.repeat(80))

  // Calculate VaR using different methods
  const var95Historical = await riskEngine.calculateVaR(portfolio, 0.95, 'historical')
  const var95Parametric = await riskEngine.calculateVaR(portfolio, 0.95, 'parametric')
  const var95MonteCarlo = await riskEngine.calculateVaR(portfolio, 0.95, 'monte_carlo')
  const var99 = await riskEngine.calculateVaR(portfolio, 0.99, 'historical')

  console.log('Value at Risk (1-day, $):')
  console.log(`  Historical (95%):  $${(var95Historical * portfolio.totalValue).toLocaleString()}`)
  console.log(`  Parametric (95%):  $${(var95Parametric * portfolio.totalValue).toLocaleString()}`)
  console.log(`  Monte Carlo (95%): $${(var95MonteCarlo * portfolio.totalValue).toLocaleString()}`)
  console.log(`  Historical (99%):  $${(var99 * portfolio.totalValue).toLocaleString()}`)

  const cvar95 = await riskEngine.calculateCVaR(portfolio, 0.95)
  console.log(`\nConditional VaR (95%): $${(cvar95 * portfolio.totalValue).toLocaleString()}`)
  console.log('(Expected loss if VaR threshold is breached)')

  console.log('\n2. Stress Testing')
  console.log('='.repeat(80))

  const stressScenarios = [
    {
      name: '2008 Financial Crisis',
      description: 'Global financial meltdown',
      shocks: new Map([
        ['AAPL', -0.50],
        ['GOOGL', -0.45],
        ['MSFT', -0.40],
        ['AMZN', -0.48],
        ['META', -0.55],
        ['TSLA', -0.60],
        ['NVDA', -0.52]
      ])
    },
    {
      name: 'COVID-19 Crash',
      description: 'March 2020 pandemic sell-off',
      shocks: new Map([
        ['AAPL', -0.30],
        ['GOOGL', -0.25],
        ['MSFT', -0.28],
        ['AMZN', -0.15],
        ['META', -0.35],
        ['TSLA', -0.40],
        ['NVDA', -0.32]
      ])
    },
    {
      name: 'Tech Bubble Burst',
      description: 'Tech sector correction',
      shocks: new Map([
        ['AAPL', -0.35],
        ['GOOGL', -0.40],
        ['MSFT', -0.30],
        ['AMZN', -0.38],
        ['META', -0.45],
        ['TSLA', -0.50],
        ['NVDA', -0.55]
      ])
    },
    {
      name: 'Market Rally',
      description: 'Strong bull market',
      shocks: new Map([
        ['AAPL', 0.25],
        ['GOOGL', 0.28],
        ['MSFT', 0.22],
        ['AMZN', 0.30],
        ['META', 0.20],
        ['TSLA', 0.35],
        ['NVDA', 0.40]
      ])
    }
  ]

  const stressResults = await riskEngine.runStressTest(portfolio, stressScenarios)

  console.log('Stress Test Results:\n')

  for (const result of stressResults) {
    console.log(`${result.scenario.name}:`)
    console.log(`  Description:      ${result.scenario.description}`)
    console.log(`  Portfolio Impact: $${result.portfolioImpact.toLocaleString()} (${(result.drawdown * 100).toFixed(2)}%)`)
    console.log(`  New Value:        $${result.newPortfolioValue.toLocaleString()}`)
    console.log()
  }

  console.log('\n3. Portfolio Risk Metrics')
  console.log('='.repeat(80))

  const riskMetrics = await riskEngine.calculateRiskMetrics(portfolio)

  console.log('Current Risk Profile:')
  console.log(`  Total Exposure:     $${riskMetrics.totalExposure.toLocaleString()}`)
  console.log(`  Net Exposure:       $${riskMetrics.netExposure.toLocaleString()}`)
  console.log(`  Leverage:           ${riskMetrics.leverage.toFixed(2)}x`)
  console.log(`  Portfolio Beta:     ${riskMetrics.beta.toFixed(2)}`)
  console.log(`  Volatility:         ${(riskMetrics.volatility * 100).toFixed(2)}%`)
  console.log(`  Sharpe Ratio:       ${riskMetrics.sharpeRatio.toFixed(2)}`)

  console.log('\n4. Concentration Analysis')
  console.log('='.repeat(80))

  const positionValues = positions.map(p => ({
    symbol: p.symbol,
    value: p.quantity * p.price
  })).sort((a, b) => b.value - a.value)

  console.log('Top 5 Positions:')
  let cumulativeWeight = 0
  for (let i = 0; i < Math.min(5, positionValues.length); i++) {
    const weight = (positionValues[i].value / portfolio.totalValue) * 100
    cumulativeWeight += weight
    console.log(`  ${(i + 1)}. ${positionValues[i].symbol.padEnd(6)} $${positionValues[i].value.toLocaleString().padStart(12)} (${weight.toFixed(2)}%)`)
  }

  console.log(`\nTop 5 Concentration: ${cumulativeWeight.toFixed(2)}%`)

  console.log('\n5. Correlation Matrix Analysis')
  console.log('='.repeat(80))

  // Generate mock correlation matrix
  console.log('\nCorrelation Matrix (Mock):')
  console.log('        AAPL  GOOGL MSFT  AMZN  META  TSLA  NVDA')

  const symbols = positions.map(p => p.symbol)
  for (let i = 0; i < symbols.length; i++) {
    const row = [symbols[i].padEnd(6)]
    for (let j = 0; j < symbols.length; j++) {
      if (i === j) {
        row.push(' 1.00')
      } else {
        const corr = 0.3 + Math.random() * 0.6
        row.push(` ${corr.toFixed(2)}`)
      }
    }
    console.log(row.join(' '))
  }

  console.log('\nDiversification Potential:')
  console.log('  Average correlation: 0.62')
  console.log('  ⚠ High correlation suggests limited diversification')
  console.log('  💡 Consider adding uncorrelated assets')

  console.log()
}

/**
 * Example 6: Performance Attribution Analysis
 *
 * Detailed breakdown of where returns come from: alpha, beta,
 * sector allocation, stock selection, etc.
 */
export async function example6_PerformanceAttribution() {
  console.log('\n' + '='.repeat(80))
  console.log('Example 6: Performance Attribution Analysis')
  console.log('='.repeat(80) + '\n')

  // Simulate portfolio returns
  const portfolioReturns = [
    { date: '2023-01', return: 0.03, benchmark: 0.02 },
    { date: '2023-02', return: -0.01, benchmark: -0.02 },
    { date: '2023-03', return: 0.05, benchmark: 0.03 },
    { date: '2023-04', return: 0.02, benchmark: 0.01 },
    { date: '2023-05', return: 0.04, benchmark: 0.03 },
    { date: '2023-06', return: 0.06, benchmark: 0.04 },
    { date: '2023-07', return: 0.03, benchmark: 0.02 },
    { date: '2023-08', return: -0.02, benchmark: -0.03 },
    { date: '2023-09', return: 0.04, benchmark: 0.02 },
    { date: '2023-10', return: 0.05, benchmark: 0.03 },
    { date: '2023-11', return: 0.07, benchmark: 0.05 },
    { date: '2023-12', return: 0.06, benchmark: 0.04 }
  ]

  const totalPortfolioReturn = portfolioReturns.reduce((sum, m) => (1 + sum) * (1 + m.return) - 1, 0)
  const totalBenchmarkReturn = portfolioReturns.reduce((sum, m) => (1 + sum) * (1 + m.benchmark) - 1, 0)

  console.log('Annual Performance Summary:')
  console.log('-'.repeat(80))
  console.log(`Portfolio Return:    ${(totalPortfolioReturn * 100).toFixed(2)}%`)
  console.log(`Benchmark Return:    ${(totalBenchmarkReturn * 100).toFixed(2)}%`)
  console.log(`Outperformance:      ${((totalPortfolioReturn - totalBenchmarkReturn) * 100).toFixed(2)}%`)

  console.log('\n1. Monthly Returns Breakdown:')
  console.log('-'.repeat(80))
  console.log('Month      Portfolio  Benchmark  Alpha     Status')
  console.log('-'.repeat(80))

  for (const month of portfolioReturns) {
    const alpha = month.return - month.benchmark
    const status = alpha > 0 ? '✓' : '✗'
    console.log(
      `${month.date}     ${(month.return * 100).toFixed(2).padStart(6)}%   ` +
      `${(month.benchmark * 100).toFixed(2).padStart(6)}%   ` +
      `${(alpha * 100).toFixed(2).padStart(6)}%   ${status}`
    )
  }

  console.log('\n2. Attribution Analysis:')
  console.log('-'.repeat(80))

  // Sector attribution (mock data)
  const sectorAttribution = [
    { sector: 'Technology', weight: 0.40, portfolioReturn: 0.52, benchmarkReturn: 0.40, allocation: 0.02, selection: 0.10 },
    { sector: 'Financials', weight: 0.20, portfolioReturn: 0.28, benchmarkReturn: 0.25, allocation: 0.01, selection: 0.02 },
    { sector: 'Healthcare', weight: 0.15, portfolioReturn: 0.32, benchmarkReturn: 0.30, allocation: 0.00, selection: 0.01 },
    { sector: 'Consumer', weight: 0.15, portfolioReturn: 0.35, benchmarkReturn: 0.32, allocation: 0.01, selection: 0.02 },
    { sector: 'Energy', weight: 0.10, portfolioReturn: 0.18, benchmarkReturn: 0.15, allocation: -0.01, selection: 0.02 }
  ]

  console.log('Sector Attribution:\n')
  console.log('Sector        Weight  Portfolio  Benchmark  Allocation  Selection  Total')
  console.log('-'.repeat(80))

  let totalAllocation = 0
  let totalSelection = 0

  for (const sector of sectorAttribution) {
    const total = sector.allocation + sector.selection
    totalAllocation += sector.allocation
    totalSelection += sector.selection

    console.log(
      `${sector.sector.padEnd(12)} ${(sector.weight * 100).toFixed(0).padStart(4)}%   ` +
      `${(sector.portfolioReturn * 100).toFixed(2).padStart(7)}%  ` +
      `${(sector.benchmarkReturn * 100).toFixed(2).padStart(7)}%   ` +
      `${(sector.allocation * 100).toFixed(2).padStart(7)}%   ` +
      `${(sector.selection * 100).toFixed(2).padStart(7)}%  ` +
      `${(total * 100).toFixed(2).padStart(6)}%`
    )
  }

  console.log('-'.repeat(80))
  console.log(
    `${'Total'.padEnd(32)}` +
    `${(totalAllocation * 100).toFixed(2).padStart(7)}%   ` +
    `${(totalSelection * 100).toFixed(2).padStart(7)}%  ` +
    `${((totalAllocation + totalSelection) * 100).toFixed(2).padStart(6)}%`
  )

  console.log('\n3. Factor Attribution:')
  console.log('-'.repeat(80))

  const factorAttribution = {
    market: 0.28,      // Beta-driven return
    size: 0.02,        // Small cap exposure
    value: 0.03,       // Value tilt
    momentum: 0.05,    // Momentum exposure
    quality: 0.04,     // Quality factor
    lowVol: 0.01,      // Low volatility
    residual: 0.05     // Stock-specific
  }

  console.log('Factor Contributions:')
  for (const [factor, contribution] of Object.entries(factorAttribution)) {
    const percent = (contribution * 100).toFixed(2)
    const bar = '█'.repeat(Math.floor(contribution * 100))
    console.log(`  ${factor.padEnd(10)} ${percent.padStart(6)}%  ${bar}`)
  }

  const totalFactorReturn = Object.values(factorAttribution).reduce((a, b) => a + b, 0)
  console.log(`  ${'Total'.padEnd(10)} ${(totalFactorReturn * 100).toFixed(2).padStart(6)}%`)

  console.log('\n4. Security-Level Attribution:')
  console.log('-'.repeat(80))

  const securityAttribution = [
    { symbol: 'AAPL', weight: 0.15, contribution: 0.08, return: 0.53 },
    { symbol: 'GOOGL', weight: 0.12, contribution: 0.06, return: 0.50 },
    { symbol: 'MSFT', weight: 0.13, contribution: 0.07, return: 0.54 },
    { symbol: 'NVDA', weight: 0.10, contribution: 0.08, return: 0.80 },
    { symbol: 'TSLA', weight: 0.08, contribution: 0.05, return: 0.63 }
  ].sort((a, b) => b.contribution - a.contribution)

  console.log('Top 5 Contributors:\n')
  console.log('Symbol  Weight  Return   Contribution')
  console.log('-'.repeat(40))

  for (const security of securityAttribution) {
    console.log(
      `${security.symbol.padEnd(6)} ${(security.weight * 100).toFixed(1).padStart(5)}%  ` +
      `${(security.return * 100).toFixed(2).padStart(6)}%  ` +
      `${(security.contribution * 100).toFixed(2).padStart(6)}%`
    )
  }

  console.log('\n5. Risk-Adjusted Attribution:')
  console.log('-'.repeat(80))

  const riskMetrics = {
    portfolioSharpe: 1.85,
    benchmarkSharpe: 1.45,
    informationRatio: 0.65,
    treynorRatio: 0.18,
    jensenAlpha: 0.04
  }

  console.log('Risk-Adjusted Metrics:')
  console.log(`  Portfolio Sharpe:     ${riskMetrics.portfolioSharpe.toFixed(2)}`)
  console.log(`  Benchmark Sharpe:     ${riskMetrics.benchmarkSharpe.toFixed(2)}`)
  console.log(`  Information Ratio:    ${riskMetrics.informationRatio.toFixed(2)}`)
  console.log(`  Treynor Ratio:        ${riskMetrics.treynorRatio.toFixed(2)}`)
  console.log(`  Jensen's Alpha:       ${(riskMetrics.jensenAlpha * 100).toFixed(2)}%`)

  console.log('\nKey Insights:')
  console.log('  ✓ Strong stock selection in Technology sector (+10%)`)
  console.log('  ✓ Positive allocation effects across most sectors')
  console.log('  ✓ Momentum and quality factors driving outperformance')
  console.log('  ✓ Information ratio of 0.65 indicates consistent alpha generation')

  console.log()
}

// Run all examples
export async function runAllExamples() {
  await example1_CompleteBacktesting()
  await example2_MultiStrategyPortfolio()
  await example3_WalkForwardOptimization()
  await example4_LiveTradingWithRisk()
  await example5_AdvancedRiskAnalysis()
  await example6_PerformanceAttribution()

  console.log('\n' + '='.repeat(80))
  console.log('All Examples Complete!')
  console.log('='.repeat(80))
  console.log('\nThese examples demonstrate:')
  console.log('  ✓ Complete backtesting workflow')
  console.log('  ✓ Multi-strategy portfolio construction')
  console.log('  ✓ Walk-forward optimization')
  console.log('  ✓ Live trading with risk management')
  console.log('  ✓ Advanced risk analysis')
  console.log('  ✓ Performance attribution')
  console.log('\nFor production use, adapt these examples to your specific needs.')
  console.log()
}

// Export all examples
export const INTEGRATION_EXAMPLES = {
  example1_CompleteBacktesting,
  example2_MultiStrategyPortfolio,
  example3_WalkForwardOptimization,
  example4_LiveTradingWithRisk,
  example5_AdvancedRiskAnalysis,
  example6_PerformanceAttribution,
  runAllExamples
}
