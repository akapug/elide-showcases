/**
 * Supply Chain Platform - Performance Benchmarks
 *
 * Benchmark all major optimization algorithms to measure:
 * - Execution time
 * - Solution quality
 * - Scalability
 * - Memory usage
 */

import { DemandForecaster } from '../src/forecasting/demand-forecaster'
import { RouteOptimizer } from '../src/optimization/route-optimizer'
import { InventoryOptimizer } from '../src/optimization/inventory-optimizer'
import { NetworkDesigner } from '../src/network/network-design'

interface BenchmarkResult {
  name: string
  operations: number
  totalTime: number
  avgTime: number
  minTime: number
  maxTime: number
  opsPerSecond: number
  quality?: number
}

/**
 * Main benchmark runner
 */
async function runBenchmarks() {
  console.log('='.repeat(80))
  console.log('SUPPLY CHAIN PLATFORM - PERFORMANCE BENCHMARKS')
  console.log('='.repeat(80))
  console.log()

  const results: BenchmarkResult[] = []

  // Benchmark 1: Demand Forecasting
  results.push(...await benchmarkForecasting())

  // Benchmark 2: Route Optimization
  results.push(...await benchmarkRouting())

  // Benchmark 3: Inventory Optimization
  results.push(...await benchmarkInventory())

  // Benchmark 4: Network Design
  results.push(...await benchmarkNetworkDesign())

  // Print summary
  printSummary(results)
}

/**
 * Benchmark demand forecasting performance
 */
async function benchmarkForecasting(): Promise<BenchmarkResult[]> {
  console.log('\n' + '-'.repeat(80))
  console.log('BENCHMARK: DEMAND FORECASTING')
  console.log('-'.repeat(80))

  const results: BenchmarkResult[] = []

  // Test different data sizes
  const dataSizes = [30, 90, 180, 365]

  for (const size of dataSizes) {
    console.log(`\nTesting with ${size} days of historical data...`)

    const forecaster = new DemandForecaster({
      models: ['arima'],
      horizon: 30,
      confidenceLevel: 0.95,
    })

    const historicalData = generateDemandData(size)

    const times: number[] = []
    const iterations = 5

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()

      await forecaster.train({
        productId: 'TEST-SKU',
        historicalDemand: historicalData,
      })

      await forecaster.forecast({
        productId: 'TEST-SKU',
        horizon: 30,
      })

      const end = performance.now()
      times.push(end - start)
    }

    results.push({
      name: `Forecast (${size} days)`,
      operations: iterations,
      totalTime: times.reduce((a, b) => a + b, 0),
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      opsPerSecond: 1000 / (times.reduce((a, b) => a + b, 0) / times.length),
    })

    console.log(`  Average time: ${results[results.length - 1].avgTime.toFixed(2)}ms`)
  }

  // Test different model ensembles
  const modelCombinations = [
    ['arima'],
    ['arima', 'randomforest'],
    ['arima', 'randomforest', 'xgboost'],
  ]

  for (const models of modelCombinations) {
    console.log(`\nTesting with models: ${models.join(', ')}...`)

    const forecaster = new DemandForecaster({
      models: models as any,
      horizon: 30,
      confidenceLevel: 0.95,
    })

    const historicalData = generateDemandData(365)

    const start = performance.now()

    await forecaster.train({
      productId: 'TEST-SKU',
      historicalDemand: historicalData,
    })

    await forecaster.forecast({
      productId: 'TEST-SKU',
      horizon: 30,
    })

    const end = performance.now()
    const time = end - start

    results.push({
      name: `Forecast (${models.length} models)`,
      operations: 1,
      totalTime: time,
      avgTime: time,
      minTime: time,
      maxTime: time,
      opsPerSecond: 1000 / time,
    })

    console.log(`  Time: ${time.toFixed(2)}ms`)
  }

  return results
}

/**
 * Benchmark route optimization performance
 */
async function benchmarkRouting(): Promise<BenchmarkResult[]> {
  console.log('\n' + '-'.repeat(80))
  console.log('BENCHMARK: ROUTE OPTIMIZATION')
  console.log('-'.repeat(80))

  const results: BenchmarkResult[] = []

  // Test different problem sizes
  const problemSizes = [
    { deliveries: 20, vehicles: 3 },
    { deliveries: 50, vehicles: 5 },
    { deliveries: 100, vehicles: 10 },
    { deliveries: 200, vehicles: 20 },
  ]

  const algorithms = ['clarke-wright', 'sweep', 'nearest-neighbor'] as const

  for (const algorithm of algorithms) {
    console.log(`\nTesting ${algorithm} algorithm...`)

    for (const { deliveries: numDeliveries, vehicles: numVehicles } of problemSizes) {
      console.log(`  Problem size: ${numDeliveries} deliveries, ${numVehicles} vehicles`)

      const optimizer = new RouteOptimizer({
        algorithm,
        timeLimit: 60,
      })

      const problem = generateRoutingProblem(numDeliveries, numVehicles)

      const start = performance.now()
      const solution = await optimizer.optimize(problem)
      const end = performance.now()

      const time = end - start

      results.push({
        name: `${algorithm} (${numDeliveries}d, ${numVehicles}v)`,
        operations: 1,
        totalTime: time,
        avgTime: time,
        minTime: time,
        maxTime: time,
        opsPerSecond: 1000 / time,
        quality: calculateRoutingQuality(solution),
      })

      console.log(`    Time: ${time.toFixed(2)}ms`)
      console.log(`    Total distance: ${solution.totalDistance.toFixed(1)} km`)
      console.log(`    Routes: ${solution.routes.length}`)
    }
  }

  return results
}

/**
 * Benchmark inventory optimization performance
 */
async function benchmarkInventory(): Promise<BenchmarkResult[]> {
  console.log('\n' + '-'.repeat(80))
  console.log('BENCHMARK: INVENTORY OPTIMIZATION')
  console.log('-'.repeat(80))

  const results: BenchmarkResult[] = []

  // Single SKU optimization
  console.log('\nTesting single SKU optimization...')

  const optimizer = new InventoryOptimizer()

  const iterations = 100
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()

    await optimizer.optimizeReorderPoint({
      productId: 'TEST-SKU',
      demand: {
        mean: 100,
        standardDeviation: 25,
        distribution: 'normal',
      },
      leadTime: {
        mean: 7,
        standardDeviation: 2,
        distribution: 'normal',
      },
      costs: {
        unitCost: 50,
        orderingCost: 100,
        holdingCostRate: 0.25,
        backorderCost: 500,
      },
    })

    const end = performance.now()
    times.push(end - start)
  }

  results.push({
    name: 'Single SKU Optimization',
    operations: iterations,
    totalTime: times.reduce((a, b) => a + b, 0),
    avgTime: times.reduce((a, b) => a + b, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    opsPerSecond: 1000 / (times.reduce((a, b) => a + b, 0) / times.length),
  })

  console.log(`  Average time: ${results[results.length - 1].avgTime.toFixed(2)}ms`)

  // ABC Analysis
  const itemCounts = [100, 500, 1000, 5000]

  for (const count of itemCounts) {
    console.log(`\nTesting ABC analysis with ${count} items...`)

    const items = generateItems(count)

    const start = performance.now()
    optimizer.performABCAnalysis({ items })
    const end = performance.now()

    const time = end - start

    results.push({
      name: `ABC Analysis (${count} items)`,
      operations: 1,
      totalTime: time,
      avgTime: time,
      minTime: time,
      maxTime: time,
      opsPerSecond: 1000 / time,
    })

    console.log(`  Time: ${time.toFixed(2)}ms`)
  }

  return results
}

/**
 * Benchmark network design performance
 */
async function benchmarkNetworkDesign(): Promise<BenchmarkResult[]> {
  console.log('\n' + '-'.repeat(80))
  console.log('BENCHMARK: NETWORK DESIGN')
  console.log('-'.repeat(80))

  const results: BenchmarkResult[] = []

  // Test different network sizes
  const networkSizes = [
    { customers: 50, sites: 10 },
    { customers: 100, sites: 20 },
    { customers: 200, sites: 30 },
    { customers: 500, sites: 50 },
  ]

  for (const { customers: numCustomers, sites: numSites } of networkSizes) {
    console.log(`\nTesting with ${numCustomers} customers, ${numSites} sites...`)

    const designer = new NetworkDesigner()

    const customers = generateCustomerDemand(numCustomers)
    const sites = generateFacilitySites(numSites)

    const start = performance.now()

    await designer.optimizeFacilityLocations({
      customers,
      candidateSites: sites,
      constraints: {
        maxFacilities: Math.floor(numSites * 0.3),
        minCapacity: 5000,
        maxCapacity: 20000,
      },
      costs: {},
      objective: 'minimize-total-cost',
    })

    const end = performance.now()
    const time = end - start

    results.push({
      name: `Network Design (${numCustomers}c, ${numSites}s)`,
      operations: 1,
      totalTime: time,
      avgTime: time,
      minTime: time,
      maxTime: time,
      opsPerSecond: 1000 / time,
    })

    console.log(`  Time: ${time.toFixed(2)}ms`)
  }

  return results
}

/**
 * Print benchmark summary
 */
function printSummary(results: BenchmarkResult[]) {
  console.log('\n' + '='.repeat(80))
  console.log('BENCHMARK SUMMARY')
  console.log('='.repeat(80))
  console.log()

  console.log('Performance Results:')
  console.log('-'.repeat(80))
  console.log(
    'Benchmark'.padEnd(40) +
    'Avg Time'.padEnd(15) +
    'Min Time'.padEnd(15) +
    'Max Time'
  )
  console.log('-'.repeat(80))

  for (const result of results) {
    console.log(
      result.name.padEnd(40) +
      `${result.avgTime.toFixed(2)}ms`.padEnd(15) +
      `${result.minTime.toFixed(2)}ms`.padEnd(15) +
      `${result.maxTime.toFixed(2)}ms`
    )
  }

  console.log('-'.repeat(80))
  console.log()

  // Performance categories
  console.log('Performance Categories:')
  console.log('-'.repeat(80))

  const categories = {
    'Very Fast (< 100ms)': results.filter(r => r.avgTime < 100),
    'Fast (100-500ms)': results.filter(r => r.avgTime >= 100 && r.avgTime < 500),
    'Medium (500-2000ms)': results.filter(r => r.avgTime >= 500 && r.avgTime < 2000),
    'Slow (> 2000ms)': results.filter(r => r.avgTime >= 2000),
  }

  for (const [category, items] of Object.entries(categories)) {
    console.log(`${category}: ${items.length} benchmarks`)
    for (const item of items.slice(0, 5)) {
      console.log(`  - ${item.name}: ${item.avgTime.toFixed(2)}ms`)
    }
  }

  console.log('-'.repeat(80))
  console.log()

  // Scalability analysis
  console.log('Scalability Analysis:')
  console.log('-'.repeat(80))

  const routingResults = results.filter(r => r.name.includes('clarke-wright'))
  if (routingResults.length >= 2) {
    const small = routingResults[0]
    const large = routingResults[routingResults.length - 1]
    const scalingFactor = large.avgTime / small.avgTime

    console.log(`Routing optimization scaling factor: ${scalingFactor.toFixed(2)}x`)
  }

  const abcResults = results.filter(r => r.name.includes('ABC Analysis'))
  if (abcResults.length >= 2) {
    const small = abcResults[0]
    const large = abcResults[abcResults.length - 1]
    const scalingFactor = large.avgTime / small.avgTime

    console.log(`ABC analysis scaling factor: ${scalingFactor.toFixed(2)}x`)
  }

  console.log('-'.repeat(80))
  console.log()

  console.log('Benchmark completed successfully!')
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateDemandData(days: number) {
  const data = []
  for (let i = 0; i < days; i++) {
    const date = new Date(2024, 0, 1)
    date.setDate(date.getDate() + i)

    data.push({
      date: date.toISOString(),
      demand: Math.floor(Math.random() * 50 + 75),
      sales: Math.floor(Math.random() * 50 + 75),
    })
  }
  return data
}

function generateRoutingProblem(numDeliveries: number, numVehicles: number) {
  return {
    depots: [
      {
        id: 'DC1',
        name: 'Distribution Center',
        location: { lat: 40.7128, lng: -74.0060 },
        openTime: '06:00',
        closeTime: '20:00',
      },
    ],
    deliveries: Array.from({ length: numDeliveries }, (_, i) => ({
      id: `DEL-${i}`,
      customerId: `CUST-${i}`,
      location: {
        lat: 40.7128 + (Math.random() - 0.5) * 0.5,
        lng: -74.0060 + (Math.random() - 0.5) * 0.5,
      },
      demand: Math.floor(Math.random() * 100) + 10,
      timeWindow: {
        start: '08:00',
        end: '17:00',
      },
      serviceTime: 15,
      priority: 1,
    })),
    vehicles: Array.from({ length: numVehicles }, (_, i) => ({
      id: `VEH-${i}`,
      type: 'truck',
      capacity: 1000,
      costPerKm: 2.5,
      costPerHour: 40,
      fixedCost: 100,
      maxRouteTime: 480,
      startLocation: { lat: 40.7128, lng: -74.0060 },
      availableTimeWindow: {
        start: '06:00',
        end: '20:00',
      },
    })),
    constraints: {
      capacityConstraints: true,
      timeWindowConstraints: false,
    },
    objectives: ['minimize-cost'] as const,
    options: {
      algorithm: 'clarke-wright' as const,
      timeLimit: 60,
    },
  }
}

function calculateRoutingQuality(solution: any): number {
  // Quality score based on utilization and cost
  const avgUtilization = solution.metrics.averageLoadFactor || 0
  const costPerKm = solution.totalCost / solution.totalDistance

  // Lower cost per km and higher utilization = better quality
  return avgUtilization * 100 - costPerKm * 10
}

function generateItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `ITEM-${i}`,
    annualValue: Math.floor(Math.random() * 1000000),
  }))
}

function generateCustomerDemand(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `CUST-${i}`,
    location: {
      lat: 40 + Math.random() * 5,
      lng: -75 + Math.random() * 5,
    },
    demand: Math.floor(Math.random() * 1000) + 100,
    revenue: Math.floor(Math.random() * 100000) + 10000,
    serviceTimeRequired: Math.random() * 48,
  }))
}

function generateFacilitySites(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `SITE-${i}`,
    location: {
      lat: 40 + Math.random() * 5,
      lng: -75 + Math.random() * 5,
    },
    capacity: 10000,
    fixedCost: 1000000,
    variableCost: 10,
    operatingCost: 500000,
    status: 'available' as const,
  }))
}

// Run benchmarks
runBenchmarks().catch(console.error)
