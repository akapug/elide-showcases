/**
 * Trading Platform Performance Benchmarks
 *
 * Measure performance of key operations: backtesting, order processing,
 * risk calculations, and Python interop overhead.
 */

// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import talib from 'python:talib'

import { Backtester } from '../src/backtesting/backtester.ts'
import { OrderManager } from '../src/execution/order-management.ts'
import { RiskEngine } from '../src/risk/risk-engine.ts'
import { PortfolioManager } from '../src/portfolio/portfolio-manager.ts'
import { PerformanceAnalytics } from '../src/analytics/performance-analytics.ts'
import { MomentumStrategy } from '../src/strategies/strategy-engine.ts'

import type { Portfolio, RiskLimits } from '../src/types.ts'

/**
 * Benchmark suite
 */
class BenchmarkSuite {
  private results: Map<string, BenchmarkResult> = new Map()

  async run() {
    console.log('='.repeat(80))
    console.log('Trading Platform Performance Benchmarks')
    console.log('='.repeat(80))
    console.log()

    // Run all benchmarks
    await this.benchmarkBacktesting()
    await this.benchmarkOrderProcessing()
    await this.benchmarkRiskCalculations()
    await this.benchmarkPortfolioOperations()
    await this.benchmarkPythonInterop()
    await this.benchmarkIndicatorCalculation()
    await this.benchmarkMarketDataProcessing()

    // Display summary
    this.displaySummary()
  }

  /**
   * Benchmark backtesting performance
   */
  async benchmarkBacktesting() {
    console.log('📊 Backtesting Performance\n')

    const backtester = new Backtester({
      initialCapital: 100000,
      commission: { type: 'percentage', rate: 0.001 }
    })

    const strategy = new MomentumStrategy('Test Strategy', {
      lookback: 20,
      threshold: 0.02
    }, ['AAPL', 'GOOGL', 'MSFT'])

    // Benchmark different time periods
    const periods = [
      { name: '1 Year Daily', start: '2023-01-01', end: '2023-12-31', bars: 252 },
      { name: '5 Years Daily', start: '2019-01-01', end: '2023-12-31', bars: 1260 },
      { name: '1 Year Minute', start: '2023-01-01', end: '2023-12-31', bars: 98280 }
    ]

    for (const period of periods) {
      const start = Date.now()

      try {
        await backtester.run({
          strategy,
          startDate: period.start,
          endDate: period.end,
          initialCapital: 100000,
          assets: ['AAPL', 'GOOGL', 'MSFT']
        })

        const duration = Date.now() - start
        const barsPerSecond = (period.bars / (duration / 1000)).toFixed(0)

        console.log(`${period.name}:`)
        console.log(`  Duration:         ${duration}ms`)
        console.log(`  Bars processed:   ${period.bars.toLocaleString()}`)
        console.log(`  Throughput:       ${barsPerSecond} bars/sec`)
        console.log()

        this.recordResult(`backtest_${period.name}`, {
          duration,
          throughput: parseInt(barsPerSecond),
          operations: period.bars
        })
      } catch (error) {
        console.log(`${period.name}: Skipped (demo mode)`)
        console.log()
      }
    }
  }

  /**
   * Benchmark order processing
   */
  async benchmarkOrderProcessing() {
    console.log('📝 Order Processing Performance\n')

    const orderManager = new OrderManager()
    const iterations = [100, 1000, 10000]

    for (const count of iterations) {
      const orders: any[] = []

      // Place orders
      const startPlace = Date.now()

      for (let i = 0; i < count; i++) {
        const order = await orderManager.placeOrder({
          symbol: 'AAPL',
          side: i % 2 === 0 ? 'BUY' : 'SELL',
          quantity: 100,
          type: 'MARKET'
        })
        orders.push(order)
      }

      const placeDuration = Date.now() - startPlace

      // Get orders
      const startGet = Date.now()
      for (const order of orders) {
        orderManager.getOrder(order.id)
      }
      const getDuration = Date.now() - startGet

      const placeOpsPerSec = (count / (placeDuration / 1000)).toFixed(0)
      const getOpsPerSec = (count / (getDuration / 1000)).toFixed(0)

      console.log(`${count.toLocaleString()} orders:`)
      console.log(`  Place orders:     ${placeDuration}ms (${placeOpsPerSec} ops/sec)`)
      console.log(`  Retrieve orders:  ${getDuration}ms (${getOpsPerSec} ops/sec)`)
      console.log()

      this.recordResult(`order_place_${count}`, {
        duration: placeDuration,
        throughput: parseInt(placeOpsPerSec),
        operations: count
      })
    }
  }

  /**
   * Benchmark risk calculations
   */
  async benchmarkRiskCalculations() {
    console.log('⚠️  Risk Calculation Performance\n')

    const riskLimits: RiskLimits = {
      maxPositionSize: 0.1,
      maxSectorExposure: 0.3,
      maxLeverage: 2.0,
      maxDrawdown: 0.15
    }

    const riskEngine = new RiskEngine({ limits: riskLimits })

    // Create test portfolio
    const portfolio: Portfolio = {
      accountId: 'BENCH-001',
      name: 'Benchmark Portfolio',
      baseCurrency: 'USD',
      cash: 500000,
      equity: 1000000,
      marginUsed: 0,
      marginAvailable: 500000,
      buyingPower: 1000000,
      positions: new Map(),
      totalValue: 1000000,
      totalPnl: 0,
      dayPnl: 0,
      returnPercent: 0,
      dayReturnPercent: 0,
      leverage: 0.5,
      beta: 1.0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    // Add positions
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'NVDA', 'AMD']
    for (const symbol of symbols) {
      portfolio.positions.set(symbol, {
        symbol,
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
        weight: 1.6,
        openedAt: Date.now(),
        updatedAt: Date.now(),
        fills: []
      })
    }

    // Benchmark VaR calculation
    const varIterations = [100, 1000, 10000]

    for (const iterations of varIterations) {
      const start = Date.now()

      for (let i = 0; i < iterations; i++) {
        await riskEngine.calculateVaR(portfolio, 0.95, 'historical')
      }

      const duration = Date.now() - start
      const opsPerSec = (iterations / (duration / 1000)).toFixed(0)

      console.log(`VaR calculation (${iterations} iterations):`)
      console.log(`  Duration:         ${duration}ms`)
      console.log(`  Throughput:       ${opsPerSec} calc/sec`)
      console.log()

      this.recordResult(`var_${iterations}`, {
        duration,
        throughput: parseInt(opsPerSec),
        operations: iterations
      })
    }

    // Benchmark full risk metrics
    const start = Date.now()
    const iterations = 100

    for (let i = 0; i < iterations; i++) {
      await riskEngine.calculateRiskMetrics(portfolio)
    }

    const duration = Date.now() - start
    const opsPerSec = (iterations / (duration / 1000)).toFixed(0)

    console.log(`Full risk metrics (${iterations} iterations):`)
    console.log(`  Duration:         ${duration}ms`)
    console.log(`  Throughput:       ${opsPerSec} calc/sec`)
    console.log()

    this.recordResult('risk_metrics', {
      duration,
      throughput: parseInt(opsPerSec),
      operations: iterations
    })
  }

  /**
   * Benchmark portfolio operations
   */
  async benchmarkPortfolioOperations() {
    console.log('💼 Portfolio Operations Performance\n')

    const portfolioManager = new PortfolioManager({
      accountId: 'BENCH-001',
      initialCapital: 100000
    })

    // Benchmark fill processing
    const fillCounts = [100, 1000, 10000]

    for (const count of fillCounts) {
      const start = Date.now()

      for (let i = 0; i < count; i++) {
        const fill = {
          id: `fill-${i}`,
          orderId: `order-${i}`,
          symbol: i % 2 === 0 ? 'AAPL' : 'GOOGL',
          side: i % 4 < 2 ? 'BUY' : 'SELL',
          quantity: 10,
          price: 100 + Math.random() * 10,
          commission: 0.1,
          timestamp: Date.now(),
          venue: 'NYSE',
          liquidity: 'TAKER'
        } as any

        portfolioManager.processFill(fill)
      }

      const duration = Date.now() - start
      const opsPerSec = (count / (duration / 1000)).toFixed(0)

      console.log(`Process ${count.toLocaleString()} fills:`)
      console.log(`  Duration:         ${duration}ms`)
      console.log(`  Throughput:       ${opsPerSec} fills/sec`)
      console.log()

      this.recordResult(`portfolio_fills_${count}`, {
        duration,
        throughput: parseInt(opsPerSec),
        operations: count
      })
    }

    // Benchmark price updates
    const updateCounts = [100, 1000, 10000]
    const prices = new Map([
      ['AAPL', 150],
      ['GOOGL', 140]
    ])

    for (const count of updateCounts) {
      const start = Date.now()

      for (let i = 0; i < count; i++) {
        prices.set('AAPL', 150 + Math.random() * 10)
        prices.set('GOOGL', 140 + Math.random() * 10)
        portfolioManager.updatePrices(prices)
      }

      const duration = Date.now() - start
      const opsPerSec = (count / (duration / 1000)).toFixed(0)

      console.log(`Price updates (${count.toLocaleString()} updates):`)
      console.log(`  Duration:         ${duration}ms`)
      console.log(`  Throughput:       ${opsPerSec} updates/sec`)
      console.log()

      this.recordResult(`price_updates_${count}`, {
        duration,
        throughput: parseInt(opsPerSec),
        operations: count
      })
    }
  }

  /**
   * Benchmark Python interop
   */
  async benchmarkPythonInterop() {
    console.log('🐍 Python Interop Performance\n')

    // Benchmark pandas operations
    const dataSizes = [100, 1000, 10000]

    for (const size of dataSizes) {
      const data = Array.from({ length: size }, () => Math.random() * 100)

      const start = Date.now()

      const series = pandas.Series(data)
      const mean = series.mean()
      const std = series.std()
      const max = series.max()
      const min = series.min()

      const duration = Date.now() - start
      const opsPerSec = (size / (duration / 1000)).toFixed(0)

      console.log(`Pandas operations (${size.toLocaleString()} elements):`)
      console.log(`  Duration:         ${duration}ms`)
      console.log(`  Throughput:       ${opsPerSec} ops/sec`)
      console.log(`  Results:          mean=${mean.toFixed(2)}, std=${std.toFixed(2)}`)
      console.log()

      this.recordResult(`pandas_${size}`, {
        duration,
        throughput: parseInt(opsPerSec),
        operations: size
      })
    }

    // Benchmark NumPy operations
    for (const size of dataSizes) {
      const data = Array.from({ length: size }, () => Math.random() * 100)

      const start = Date.now()

      const arr = numpy.array(data)
      const mean = numpy.mean(arr)
      const std = numpy.std(arr)
      const percentile95 = numpy.percentile(arr, 95)

      const duration = Date.now() - start
      const opsPerSec = (size / (duration / 1000)).toFixed(0)

      console.log(`NumPy operations (${size.toLocaleString()} elements):`)
      console.log(`  Duration:         ${duration}ms`)
      console.log(`  Throughput:       ${opsPerSec} ops/sec`)
      console.log()

      this.recordResult(`numpy_${size}`, {
        duration,
        throughput: parseInt(opsPerSec),
        operations: size
      })
    }
  }

  /**
   * Benchmark indicator calculations
   */
  async benchmarkIndicatorCalculation() {
    console.log('📈 Indicator Calculation Performance\n')

    const dataSizes = [100, 1000, 10000]

    for (const size of dataSizes) {
      const prices = Array.from({ length: size }, () => 100 + Math.random() * 10)
      const series = pandas.Series(prices)

      // Benchmark TA-Lib indicators
      const start = Date.now()

      const sma = talib.SMA(series, { timeperiod: 20 })
      const ema = talib.EMA(series, { timeperiod: 20 })
      const rsi = talib.RSI(series, { timeperiod: 14 })
      const macd = talib.MACD(series)
      const bbands = talib.BBANDS(series)

      const duration = Date.now() - start
      const opsPerSec = (size / (duration / 1000)).toFixed(0)

      console.log(`TA-Lib indicators (${size.toLocaleString()} bars):`)
      console.log(`  Duration:         ${duration}ms`)
      console.log(`  Throughput:       ${opsPerSec} bars/sec`)
      console.log(`  Indicators:       SMA, EMA, RSI, MACD, BBands`)
      console.log()

      this.recordResult(`talib_${size}`, {
        duration,
        throughput: parseInt(opsPerSec),
        operations: size
      })
    }
  }

  /**
   * Benchmark market data processing
   */
  async benchmarkMarketDataProcessing() {
    console.log('📊 Market Data Processing Performance\n')

    const analytics = new PerformanceAnalytics()

    // Benchmark returns calculation
    const priceSizes = [252, 1260, 12600] // 1yr, 5yr, 50yr daily

    for (const size of priceSizes) {
      const prices = Array.from({ length: size }, (_, i) => 100 * Math.pow(1.0002, i))

      const start = Date.now()

      const returns = analytics.calculateReturns(prices)
      const logReturns = analytics.calculateLogReturns(prices)

      const duration = Date.now() - start
      const opsPerSec = (size / (duration / 1000)).toFixed(0)

      console.log(`Returns calculation (${size.toLocaleString()} prices):`)
      console.log(`  Duration:         ${duration}ms`)
      console.log(`  Throughput:       ${opsPerSec} prices/sec`)
      console.log()

      this.recordResult(`returns_${size}`, {
        duration,
        throughput: parseInt(opsPerSec),
        operations: size
      })
    }

    // Benchmark performance metrics
    const returns = Array.from({ length: 252 }, () => Math.random() * 0.04 - 0.02)
    const equity = returns.reduce((acc, r, i) => {
      acc.push((acc[i - 1] || 10000) * (1 + r))
      return acc
    }, [] as number[])

    const start = Date.now()
    const iterations = 1000

    for (let i = 0; i < iterations; i++) {
      const sharpe = analytics.calculateSharpe(returns, 0.02)
      const sortino = analytics.calculateSortino(returns, 0.02)
      const maxDD = analytics.calculateMaxDrawdown(equity)
    }

    const duration = Date.now() - start
    const opsPerSec = (iterations / (duration / 1000)).toFixed(0)

    console.log(`Performance metrics (${iterations} iterations):`)
    console.log(`  Duration:         ${duration}ms`)
    console.log(`  Throughput:       ${opsPerSec} calc/sec`)
    console.log()

    this.recordResult('perf_metrics', {
      duration,
      throughput: parseInt(opsPerSec),
      operations: iterations
    })
  }

  /**
   * Record benchmark result
   */
  private recordResult(name: string, result: BenchmarkResult) {
    this.results.set(name, result)
  }

  /**
   * Display summary
   */
  private displaySummary() {
    console.log()
    console.log('='.repeat(80))
    console.log('Benchmark Summary')
    console.log('='.repeat(80))
    console.log()

    // Group by category
    const categories = {
      'Backtesting': Array.from(this.results.entries()).filter(([k]) => k.startsWith('backtest_')),
      'Order Processing': Array.from(this.results.entries()).filter(([k]) => k.startsWith('order_')),
      'Risk Management': Array.from(this.results.entries()).filter(([k]) => k.startsWith('var_') || k.startsWith('risk_')),
      'Portfolio Ops': Array.from(this.results.entries()).filter(([k]) => k.startsWith('portfolio_') || k.startsWith('price_')),
      'Python Interop': Array.from(this.results.entries()).filter(([k]) => k.startsWith('pandas_') || k.startsWith('numpy_')),
      'Indicators': Array.from(this.results.entries()).filter(([k]) => k.startsWith('talib_')),
      'Analytics': Array.from(this.results.entries()).filter(([k]) => k.startsWith('returns_') || k.startsWith('perf_'))
    }

    for (const [category, entries] of Object.entries(categories)) {
      if (entries.length === 0) continue

      console.log(`${category}:`)
      console.log('-'.repeat(50))

      for (const [name, result] of entries) {
        const cleanName = name.replace(/^[a-z_]+_/, '')
        console.log(`  ${cleanName}:`)
        console.log(`    Duration:     ${result.duration}ms`)
        console.log(`    Throughput:   ${result.throughput.toLocaleString()} ops/sec`)
      }
      console.log()
    }

    console.log('Platform: Elide Runtime (TypeScript + Python)')
    console.log('Environment: Development')
    console.log()
  }
}

interface BenchmarkResult {
  duration: number
  throughput: number
  operations: number
}

// Run benchmarks
const suite = new BenchmarkSuite()
suite.run().catch(console.error)
