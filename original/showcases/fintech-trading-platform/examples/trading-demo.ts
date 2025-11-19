/**
 * Trading Platform Demo - Comprehensive example
 *
 * Demonstrates backtesting, live trading simulation, risk management,
 * and performance analytics using the full platform capabilities.
 */

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
  RiskLimits
} from '../src/types.ts'

/**
 * Main trading demo
 */
async function main() {
  console.log('='.repeat(80))
  console.log('Elide Fintech Trading Platform Demo')
  console.log('Institutional-grade algorithmic trading with TypeScript + Python')
  console.log('='.repeat(80))
  console.log()

  // Run backtest demo
  await backtestDemo()

  // Run live trading demo
  await liveTradingDemo()

  // Run risk management demo
  await riskManagementDemo()

  // Run performance analytics demo
  await performanceAnalyticsDemo()

  // Run multi-strategy demo
  await multiStrategyDemo()

  console.log()
  console.log('='.repeat(80))
  console.log('Demo completed successfully!')
  console.log('='.repeat(80))
}

/**
 * Backtest Demo - Test strategy on historical data
 */
async function backtestDemo() {
  console.log('\n📊 BACKTEST DEMO\n')

  // Initialize backtester
  const backtester = new Backtester({
    initialCapital: 100000,
    commission: { type: 'percentage', rate: 0.001 },
    slippage: { type: 'percentage', rate: 0.0005 }
  })

  // Create momentum strategy
  const strategy = new MomentumStrategy('Momentum 20/50', {
    lookback: 20,
    threshold: 0.02,
    exitThreshold: 0.01,
    stopLoss: 0.05,
    takeProfit: 0.15
  }, ['AAPL', 'GOOGL', 'MSFT'])

  console.log(`Testing strategy: ${strategy.name}`)
  console.log(`Parameters:`, strategy.parameters)
  console.log(`Assets:`, strategy.assets.join(', '))
  console.log()

  // Run backtest
  console.log('Running backtest...')
  const startTime = Date.now()

  const result = await backtester.run({
    strategy,
    startDate: '2020-01-01',
    endDate: '2023-12-31',
    initialCapital: 100000,
    assets: ['AAPL', 'GOOGL', 'MSFT']
  })

  const duration = Date.now() - startTime

  // Display results
  console.log(`✓ Backtest completed in ${duration}ms\n`)
  console.log('Performance Metrics:')
  console.log('-'.repeat(50))
  console.log(`Total Return:       ${(result.metrics.totalReturn * 100).toFixed(2)}%`)
  console.log(`Annual Return:      ${(result.metrics.annualizedReturn * 100).toFixed(2)}%`)
  console.log(`Sharpe Ratio:       ${result.metrics.sharpeRatio.toFixed(2)}`)
  console.log(`Sortino Ratio:      ${result.metrics.sortinoRatio.toFixed(2)}`)
  console.log(`Max Drawdown:       ${(result.metrics.maxDrawdown * 100).toFixed(2)}%`)
  console.log(`Volatility:         ${(result.metrics.volatility * 100).toFixed(2)}%`)
  console.log(`Win Rate:           ${(result.metrics.winRate * 100).toFixed(2)}%`)
  console.log(`Profit Factor:      ${result.metrics.profitFactor.toFixed(2)}`)
  console.log(`Total Trades:       ${result.metrics.trades}`)
  console.log(`Winners:            ${result.metrics.winners}`)
  console.log(`Losers:             ${result.metrics.losers}`)
  console.log(`Avg Win:            $${result.metrics.avgWin.toFixed(2)}`)
  console.log(`Avg Loss:           $${result.metrics.avgLoss.toFixed(2)}`)
  console.log(`Largest Win:        $${result.metrics.largestWin.toFixed(2)}`)
  console.log(`Largest Loss:       $${result.metrics.largestLoss.toFixed(2)}`)
  console.log()

  if (result.benchmark) {
    console.log('Benchmark Comparison (vs SPY):')
    console.log('-'.repeat(50))
    console.log(`Alpha:              ${(result.benchmark.alpha * 100).toFixed(2)}%`)
    console.log(`Beta:               ${result.benchmark.beta.toFixed(2)}`)
    console.log(`Correlation:        ${result.benchmark.correlation.toFixed(2)}`)
    console.log(`Information Ratio:  ${result.benchmark.informationRatio.toFixed(2)}`)
    console.log()
  }
}

/**
 * Live Trading Demo - Simulate real-time trading
 */
async function liveTradingDemo() {
  console.log('\n🔴 LIVE TRADING DEMO (Paper Trading)\n')

  // Initialize components
  const marketData = new MarketDataService({
    provider: 'polygon',
    apiKey: 'demo',
    cache: true,
    cacheTTL: 1000
  })

  const orderManager = new OrderManager({
    venues: ['NYSE', 'NASDAQ'],
    router: 'smart'
  })

  const portfolioManager = new PortfolioManager({
    accountId: 'DEMO-001',
    name: 'Demo Portfolio',
    initialCapital: 100000
  })

  const strategyEngine = new StrategyEngine()

  // Create and register strategy
  const strategy = strategyEngine.createStrategy({
    name: 'Mean Reversion Live',
    type: 'mean-reversion',
    parameters: {
      lookback: 20,
      entryThreshold: 2.0,
      exitThreshold: 0.5
    },
    assets: ['AAPL', 'MSFT']
  })

  await strategyEngine.activateStrategy(strategy.name)

  console.log(`✓ Strategy activated: ${strategy.name}`)
  console.log(`✓ Trading assets: ${strategy.assets.join(', ')}`)
  console.log()

  // Subscribe to market data
  console.log('Subscribing to real-time market data...')
  const subscription = marketData.subscribe(strategy.assets, ['quotes', 'trades'])

  let tickCount = 0
  let signalCount = 0
  let orderCount = 0

  subscription.on('quote', async (quote) => {
    tickCount++

    if (tickCount % 10 === 0) {
      // Process signal every 10 ticks
      const signals = await strategyEngine.processMarketData({
        symbol: quote.symbol,
        timestamp: quote.timestamp,
        quote
      })

      for (const [strategyName, signal] of signals.entries()) {
        if (Array.isArray(signal)) {
          for (const s of signal) {
            if (s.type !== 'HOLD') {
              signalCount++
              console.log(`\n📈 Signal #${signalCount}:`, {
                strategy: strategyName,
                symbol: s.symbol,
                type: s.type,
                strength: s.strength.toFixed(2),
                rationale: s.rationale
              })

              // Place order
              if (s.type === 'BUY' || s.type === 'SELL') {
                const order = await orderManager.placeOrder({
                  symbol: s.symbol,
                  side: s.type === 'BUY' ? 'BUY' : 'SELL',
                  quantity: 10,
                  type: 'MARKET'
                })

                orderCount++
                console.log(`✓ Order placed:`, {
                  id: order.id,
                  symbol: order.symbol,
                  side: order.side,
                  quantity: order.quantity,
                  status: order.status
                })

                // Simulate fill
                const fill = {
                  id: `fill-${orderCount}`,
                  orderId: order.id,
                  symbol: order.symbol,
                  side: order.side,
                  quantity: order.quantity,
                  price: quote.last || 100,
                  commission: order.quantity * (quote.last || 100) * 0.001,
                  timestamp: Date.now(),
                  venue: 'NYSE',
                  liquidity: 'TAKER'
                } as any

                portfolioManager.processFill(fill)

                console.log(`✓ Order filled:`, {
                  price: fill.price.toFixed(2),
                  value: (fill.price * fill.quantity).toFixed(2)
                })
              }
            }
          }
        } else if (signal.type !== 'HOLD') {
          signalCount++
          console.log(`\n📈 Signal #${signalCount}:`, {
            strategy: strategyName,
            symbol: signal.symbol,
            type: signal.type,
            strength: signal.strength.toFixed(2),
            rationale: signal.rationale
          })
        }
      }
    }

    // Display progress
    if (tickCount % 50 === 0) {
      const summary = portfolioManager.getSummary()
      console.log(`\n📊 Portfolio Update (${tickCount} ticks):`)
      console.log(`   Value: $${summary.totalValue.toFixed(2)}`)
      console.log(`   P&L: $${summary.totalPnl.toFixed(2)} (${summary.returnPercent.toFixed(2)}%)`)
      console.log(`   Positions: ${summary.positionCount}`)
      console.log(`   Signals: ${signalCount}, Orders: ${orderCount}`)
    }

    // Stop after 100 ticks for demo
    if (tickCount >= 100) {
      subscription.stop()
      console.log('\n✓ Live trading demo completed')
      console.log()
      displayPortfolioSummary(portfolioManager.getPortfolio())
    }
  })
}

/**
 * Risk Management Demo
 */
async function riskManagementDemo() {
  console.log('\n⚠️  RISK MANAGEMENT DEMO\n')

  // Initialize risk engine
  const riskLimits: RiskLimits = {
    maxPositionSize: 0.1,      // 10% per position
    maxSectorExposure: 0.3,    // 30% per sector
    maxLeverage: 2.0,
    maxDrawdown: 0.15,         // 15% max drawdown
    maxDailyLoss: 5000,
    maxConcentration: 0.25     // 25% max in single position
  }

  const riskEngine = new RiskEngine({ limits: riskLimits })

  // Create demo portfolio
  const portfolio: Portfolio = {
    accountId: 'DEMO-001',
    name: 'Test Portfolio',
    baseCurrency: 'USD',
    cash: 50000,
    equity: 100000,
    marginUsed: 0,
    marginAvailable: 50000,
    buyingPower: 100000,
    positions: new Map([
      ['AAPL', {
        symbol: 'AAPL',
        assetClass: 'equity',
        quantity: 100,
        side: 'LONG',
        avgPrice: 150,
        currentPrice: 160,
        marketValue: 16000,
        costBasis: 15000,
        unrealizedPnl: 1000,
        realizedPnl: 0,
        totalPnl: 1000,
        returnPercent: 6.67,
        dayPnl: 500,
        dayReturnPercent: 3.23,
        weight: 16,
        openedAt: Date.now() - 86400000,
        updatedAt: Date.now(),
        fills: []
      }]
    ]),
    totalValue: 100000,
    totalPnl: 1000,
    dayPnl: 500,
    returnPercent: 1.0,
    dayReturnPercent: 0.5,
    leverage: 0.5,
    beta: 1.1,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  console.log('Risk Limits:')
  console.log('-'.repeat(50))
  console.log(`Max Position Size:      ${(riskLimits.maxPositionSize * 100).toFixed(0)}%`)
  console.log(`Max Leverage:           ${riskLimits.maxLeverage}x`)
  console.log(`Max Drawdown:           ${(riskLimits.maxDrawdown * 100).toFixed(0)}%`)
  console.log(`Max Concentration:      ${((riskLimits.maxConcentration || 0) * 100).toFixed(0)}%`)
  console.log()

  // Calculate risk metrics
  console.log('Calculating risk metrics...')
  const metrics = await riskEngine.calculateRiskMetrics(portfolio)

  console.log('\nRisk Metrics:')
  console.log('-'.repeat(50))
  console.log(`Portfolio Value:        $${metrics.portfolioValue.toFixed(2)}`)
  console.log(`Total Exposure:         $${metrics.totalExposure.toFixed(2)}`)
  console.log(`Net Exposure:           $${metrics.netExposure.toFixed(2)}`)
  console.log(`Leverage:               ${metrics.leverage.toFixed(2)}x`)
  console.log(`Beta:                   ${metrics.beta.toFixed(2)}`)
  console.log(`VaR (95%):              $${metrics.var95.toFixed(2)}`)
  console.log(`VaR (99%):              $${metrics.var99.toFixed(2)}`)
  console.log(`CVaR (95%):             $${metrics.cvar95.toFixed(2)}`)
  console.log(`Max Drawdown:           ${(metrics.maxDrawdown * 100).toFixed(2)}%`)
  console.log(`Current Drawdown:       ${(metrics.currentDrawdown * 100).toFixed(2)}%`)
  console.log(`Volatility:             ${(metrics.volatility * 100).toFixed(2)}%`)
  console.log(`Sharpe Ratio:           ${metrics.sharpeRatio.toFixed(2)}`)
  console.log()

  // Test order validation
  console.log('Testing order validation...\n')

  const testOrders = [
    {
      id: 'test-1',
      symbol: 'TSLA',
      side: 'BUY' as const,
      type: 'MARKET' as const,
      quantity: 500,
      filledQuantity: 0,
      remainingQuantity: 500,
      price: 200,
      timeInForce: 'DAY' as const,
      status: 'PENDING' as const,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'test-2',
      symbol: 'AAPL',
      side: 'BUY' as const,
      type: 'MARKET' as const,
      quantity: 100,
      filledQuantity: 0,
      remainingQuantity: 100,
      price: 160,
      timeInForce: 'DAY' as const,
      status: 'PENDING' as const,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ]

  for (const order of testOrders) {
    console.log(`Validating order: ${order.side} ${order.quantity} ${order.symbol} @ $${order.price}`)

    const validation = await riskEngine.validateOrder(order, portfolio)

    if (validation.approved) {
      console.log('✓ Order approved')
    } else {
      console.log('✗ Order rejected')
      for (const violation of validation.violations) {
        console.log(`  - ${violation.message}`)
      }
    }

    for (const warning of validation.warnings) {
      console.log(`  ⚠️  ${warning}`)
    }

    console.log()
  }
}

/**
 * Performance Analytics Demo
 */
async function performanceAnalyticsDemo() {
  console.log('\n📈 PERFORMANCE ANALYTICS DEMO\n')

  const analytics = new PerformanceAnalytics()

  // Generate sample returns
  const returns = Array.from({ length: 252 }, () =>
    Math.random() * 0.04 - 0.02 // Random returns between -2% and +2%
  )

  console.log('Analyzing 1 year of returns...\n')

  // Calculate metrics
  const sharpe = analytics.calculateSharpe(returns, 0.02)
  const sortino = analytics.calculateSortino(returns, 0.02)
  const annualReturn = analytics.calculateAnnualizedReturn(returns)
  const volatility = analytics.calculateAnnualizedVolatility(returns)

  const equity = returns.reduce((acc, r, i) => {
    acc.push((acc[i - 1] || 10000) * (1 + r))
    return acc
  }, [] as number[])

  const drawdown = analytics.calculateMaxDrawdown(equity)
  const calmar = analytics.calculateCalmar(returns, equity)
  const omega = analytics.calculateOmega(returns, 0)
  const varMetrics = analytics.calculateVaRMethods(returns, 0.95)

  console.log('Performance Metrics:')
  console.log('-'.repeat(50))
  console.log(`Annual Return:          ${(annualReturn * 100).toFixed(2)}%`)
  console.log(`Volatility:             ${(volatility * 100).toFixed(2)}%`)
  console.log(`Sharpe Ratio:           ${sharpe.toFixed(2)}`)
  console.log(`Sortino Ratio:          ${sortino.toFixed(2)}`)
  console.log(`Calmar Ratio:           ${calmar.toFixed(2)}`)
  console.log(`Omega Ratio:            ${omega.toFixed(2)}`)
  console.log()

  console.log('Risk Metrics:')
  console.log('-'.repeat(50))
  console.log(`Max Drawdown:           ${(drawdown.maxDrawdown * 100).toFixed(2)}%`)
  console.log(`Avg Drawdown:           ${(drawdown.avgDrawdown * 100).toFixed(2)}%`)
  console.log(`Drawdown Periods:       ${drawdown.drawdownPeriods.length}`)
  console.log(`VaR (Historical):       ${(varMetrics.historical * 100).toFixed(2)}%`)
  console.log(`VaR (Parametric):       ${(varMetrics.parametric * 100).toFixed(2)}%`)
  console.log(`VaR (Cornish-Fisher):   ${(varMetrics.cornishFisher * 100).toFixed(2)}%`)
  console.log()

  // Rolling metrics
  const rollingSharpe = analytics.calculateRollingSharpe(returns, 60)
  const rollingVol = analytics.calculateRollingVolatility(returns, 60)

  console.log('Rolling Metrics (60-day window):')
  console.log('-'.repeat(50))
  console.log(`Avg Rolling Sharpe:     ${(rollingSharpe.reduce((a, b) => a + b, 0) / rollingSharpe.length).toFixed(2)}`)
  console.log(`Avg Rolling Volatility: ${(rollingVol.reduce((a, b) => a + b, 0) / rollingVol.length * 100).toFixed(2)}%`)
  console.log()
}

/**
 * Multi-Strategy Demo
 */
async function multiStrategyDemo() {
  console.log('\n🎯 MULTI-STRATEGY DEMO\n')

  const strategyEngine = new StrategyEngine()

  // Create multiple strategies
  const strategies = [
    strategyEngine.createStrategy({
      name: 'Momentum Fast',
      type: 'momentum',
      parameters: { lookback: 10, threshold: 0.03 },
      assets: ['AAPL', 'MSFT']
    }),
    strategyEngine.createStrategy({
      name: 'Momentum Slow',
      type: 'momentum',
      parameters: { lookback: 50, threshold: 0.02 },
      assets: ['GOOGL', 'AMZN']
    }),
    strategyEngine.createStrategy({
      name: 'Mean Reversion',
      type: 'mean-reversion',
      parameters: { lookback: 20, entryThreshold: 2.0 },
      assets: ['META', 'TSLA']
    })
  ]

  console.log(`Created ${strategies.length} strategies:\n`)

  for (const strategy of strategies) {
    console.log(`- ${strategy.name} (${strategy.type})`)
    console.log(`  Assets: ${strategy.assets.join(', ')}`)
    console.log(`  Parameters:`, strategy.parameters)
    console.log()

    await strategyEngine.activateStrategy(strategy.name)
  }

  console.log(`✓ All strategies activated`)
  console.log(`✓ Total assets covered: ${new Set(strategies.flatMap(s => s.assets)).size}`)
  console.log()

  const compliance = new ComplianceEngine({
    rules: ['best_execution', 'position_limits', 'wash_sale'],
    jurisdiction: 'US'
  })

  console.log('Compliance rules enabled:')
  console.log('- Best execution monitoring')
  console.log('- Position limit enforcement')
  console.log('- Wash sale tracking')
  console.log()

  const stats = compliance.getStatistics()
  console.log('Compliance Statistics:')
  console.log(`- Total audit entries: ${stats.totalAuditEntries}`)
  console.log(`- Compliance checks: ${stats.complianceChecks}`)
  console.log(`- Violations: ${stats.violations}`)
  console.log()
}

/**
 * Display portfolio summary
 */
function displayPortfolioSummary(portfolio: Portfolio) {
  console.log('Final Portfolio Summary:')
  console.log('='.repeat(50))
  console.log(`Total Value:        $${portfolio.totalValue.toFixed(2)}`)
  console.log(`Cash:               $${portfolio.cash.toFixed(2)}`)
  console.log(`Total P&L:          $${portfolio.totalPnl.toFixed(2)}`)
  console.log(`Return:             ${portfolio.returnPercent.toFixed(2)}%`)
  console.log(`Leverage:           ${portfolio.leverage.toFixed(2)}x`)
  console.log()

  if (portfolio.positions.size > 0) {
    console.log('Positions:')
    console.log('-'.repeat(50))
    for (const position of portfolio.positions.values()) {
      if (position.quantity > 0) {
        console.log(`${position.symbol}:`)
        console.log(`  Quantity:         ${position.quantity}`)
        console.log(`  Avg Price:        $${position.avgPrice.toFixed(2)}`)
        console.log(`  Current Price:    $${position.currentPrice.toFixed(2)}`)
        console.log(`  Market Value:     $${position.marketValue.toFixed(2)}`)
        console.log(`  P&L:              $${position.unrealizedPnl.toFixed(2)} (${position.returnPercent.toFixed(2)}%)`)
        console.log()
      }
    }
  }
}

// Run demo
main().catch(console.error)
