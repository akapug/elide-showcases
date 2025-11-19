/**
 * Supply Chain Platform - Comprehensive Demo
 *
 * Demonstrates all major features of the platform:
 * - Demand forecasting
 * - Route optimization
 * - Inventory optimization
 * - Warehouse management
 * - Supplier management
 * - Network design
 * - Risk management
 * - Analytics
 */

import { DemandForecaster } from '../src/forecasting/demand-forecaster'
import { RouteOptimizer } from '../src/optimization/route-optimizer'
import { InventoryOptimizer } from '../src/optimization/inventory-optimizer'
import { WarehouseManager } from '../src/warehouse/warehouse-management'
import { SupplierManager } from '../src/procurement/supplier-management'
import { SupplyChainAnalytics } from '../src/analytics/supply-chain-analytics'
import { NetworkDesigner } from '../src/network/network-design'
import { RiskManager } from '../src/risk/risk-management'

/**
 * Main demo function
 */
async function runSupplyChainDemo() {
  console.log('='.repeat(80))
  console.log('SUPPLY CHAIN PLATFORM - COMPREHENSIVE DEMO')
  console.log('='.repeat(80))
  console.log()

  // Demo 1: Demand Forecasting
  await demoDemandForecasting()

  // Demo 2: Route Optimization
  await demoRouteOptimization()

  // Demo 3: Inventory Optimization
  await demoInventoryOptimization()

  // Demo 4: Warehouse Management
  await demoWarehouseManagement()

  // Demo 5: Supplier Management
  await demoSupplierManagement()

  // Demo 6: Network Design
  await demoNetworkDesign()

  // Demo 7: Risk Management
  await demoRiskManagement()

  // Demo 8: Supply Chain Analytics
  await demoAnalytics()

  console.log()
  console.log('='.repeat(80))
  console.log('DEMO COMPLETE')
  console.log('='.repeat(80))
}

/**
 * Demo 1: Demand Forecasting with ML
 */
async function demoDemandForecasting() {
  console.log('\n' + '-'.repeat(80))
  console.log('DEMO 1: DEMAND FORECASTING')
  console.log('-'.repeat(80))

  const forecaster = new DemandForecaster({
    models: ['arima', 'randomforest', 'xgboost'],
    horizon: 90,
    confidenceLevel: 0.95,
    seasonality: 'auto',
  })

  // Generate sample historical demand
  const historicalDemand = generateHistoricalDemand(365)

  console.log(`\nTraining forecaster on ${historicalDemand.length} days of historical data...`)

  // Train models
  await forecaster.train({
    productId: 'SKU-12345',
    historicalDemand,
  })

  // Generate forecast
  const forecast = await forecaster.forecast({
    productId: 'SKU-12345',
    horizon: 90,
    includePredictionIntervals: true,
  })

  console.log(`\nForecast Results:`)
  console.log(`  Model: ${forecast.model}`)
  console.log(`  Horizon: ${forecast.horizon} days`)
  console.log(`  Average daily demand: ${(forecast.pointForecast.reduce((a, b) => a + b, 0) / forecast.pointForecast.length).toFixed(1)}`)
  console.log(`  Confidence level: ${(forecast.confidenceLevel! * 100).toFixed(0)}%`)
  console.log(`  Forecast accuracy (MAE): ${forecast.metrics.mae.toFixed(2)}`)
  console.log(`  MAPE: ${forecast.metrics.mape.toFixed(2)}%`)

  // ABC/XYZ Analysis
  const products = [
    { id: 'SKU-001', revenue: 500000, demand: generateHistoricalDemand(365) },
    { id: 'SKU-002', revenue: 300000, demand: generateHistoricalDemand(365) },
    { id: 'SKU-003', revenue: 200000, demand: generateHistoricalDemand(365) },
    { id: 'SKU-004', revenue: 100000, demand: generateHistoricalDemand(365) },
    { id: 'SKU-005', revenue: 50000, demand: generateHistoricalDemand(365) },
  ]

  console.log(`\nPerforming ABC/XYZ classification for ${products.length} products...`)

  const classification = await forecaster.classifyProducts({ products })

  console.log(`\nProduct Classification:`)
  for (const [productId, classif] of classification) {
    console.log(`  ${productId}: ${classif.abc}${classif.xyz} (${classif.velocity}, ${classif.variability} variability)`)
  }

  console.log('\n✓ Demand forecasting demo complete')
}

/**
 * Demo 2: Vehicle Routing Optimization
 */
async function demoRouteOptimization() {
  console.log('\n' + '-'.repeat(80))
  console.log('DEMO 2: VEHICLE ROUTING OPTIMIZATION')
  console.log('-'.repeat(80))

  const optimizer = new RouteOptimizer({
    algorithm: 'clarke-wright',
    timeLimit: 60,
    numThreads: 4,
  })

  // Define routing problem
  const problem = {
    depots: [
      {
        id: 'DC1',
        name: 'Distribution Center 1',
        location: { lat: 40.7128, lng: -74.0060 },
        openTime: '06:00',
        closeTime: '20:00',
      },
    ],
    deliveries: generateDeliveries(50),
    vehicles: generateVehicles(10),
    constraints: {
      capacityConstraints: true,
      timeWindowConstraints: true,
      maxRouteTime: 480,
      skillConstraints: false,
    },
    objectives: ['minimize-cost', 'minimize-distance'],
    options: {
      algorithm: 'clarke-wright' as const,
      timeLimit: 60,
    },
  }

  console.log(`\nOptimizing routes for ${problem.deliveries.length} deliveries using ${problem.vehicles.length} vehicles...`)

  const solution = await optimizer.optimize(problem)

  console.log(`\nRouting Solution:`)
  console.log(`  Routes created: ${solution.routes.length}`)
  console.log(`  Total distance: ${solution.totalDistance.toFixed(1)} km`)
  console.log(`  Total cost: $${solution.totalCost.toFixed(2)}`)
  console.log(`  Unassigned deliveries: ${solution.unassigned.length}`)
  console.log(`  Average load factor: ${(solution.metrics.averageLoadFactor * 100).toFixed(1)}%`)
  console.log(`  Computation time: ${solution.computationTime}ms`)

  console.log(`\nTop 3 Routes:`)
  for (let i = 0; i < Math.min(3, solution.routes.length); i++) {
    const route = solution.routes[i]
    console.log(`  Route ${i + 1} (${route.vehicleId}):`)
    console.log(`    Stops: ${route.stops.length}`)
    console.log(`    Distance: ${route.distance.toFixed(1)} km`)
    console.log(`    Load: ${route.load}/${route.capacity} (${((route.load / route.capacity) * 100).toFixed(1)}%)`)
    console.log(`    Duration: ${route.duration.toFixed(0)} minutes`)
    console.log(`    Cost: $${route.cost.toFixed(2)}`)
  }

  console.log('\n✓ Route optimization demo complete')
}

/**
 * Demo 3: Inventory Optimization
 */
async function demoInventoryOptimization() {
  console.log('\n' + '-'.repeat(80))
  console.log('DEMO 3: INVENTORY OPTIMIZATION')
  console.log('-'.repeat(80))

  const optimizer = new InventoryOptimizer({
    policy: 'continuous-review',
    serviceLevel: 0.95,
    holdingCostRate: 0.25,
  })

  console.log('\nOptimizing reorder point and order quantity...')

  // Single-SKU optimization
  const result = await optimizer.optimizeReorderPoint({
    productId: 'SKU-12345',
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
    serviceLevel: 0.95,
  })

  console.log(`\nInventory Optimization Results:`)
  console.log(`  Product: ${result.productId}`)
  console.log(`  Policy: ${result.policy.type}`)
  console.log(`  Reorder Point: ${result.policy.reorderPoint.toFixed(0)} units`)
  console.log(`  Order Quantity: ${result.policy.minOrderQuantity.toFixed(0)} units`)
  console.log(`  Safety Stock: ${result.policy.safetyStock.toFixed(0)} units`)
  console.log(`  Expected Annual Cost: $${result.expectedAnnualCost.toFixed(2)}`)
  console.log(`  Expected Service Level: ${(result.expectedServiceLevel * 100).toFixed(1)}%`)
  console.log(`  Expected Fill Rate: ${(result.expectedFillRate * 100).toFixed(1)}%`)
  console.log(`  Inventory Turnover: ${result.turnoverRate.toFixed(2)}x`)

  // ABC Analysis
  const items = [
    { id: 'SKU-001', annualValue: 500000 },
    { id: 'SKU-002', annualValue: 300000 },
    { id: 'SKU-003', annualValue: 200000 },
    { id: 'SKU-004', annualValue: 150000 },
    { id: 'SKU-005', annualValue: 100000 },
    { id: 'SKU-006', annualValue: 80000 },
    { id: 'SKU-007', annualValue: 60000 },
    { id: 'SKU-008', annualValue: 40000 },
    { id: 'SKU-009', annualValue: 20000 },
    { id: 'SKU-010', annualValue: 10000 },
  ]

  console.log(`\nPerforming ABC analysis for ${items.length} items...`)

  const abcResults = optimizer.performABCAnalysis({ items })

  console.log(`\nABC Classification:`)
  const aItems = Array.from(abcResults.values()).filter(r => r.class === 'A')
  const bItems = Array.from(abcResults.values()).filter(r => r.class === 'B')
  const cItems = Array.from(abcResults.values()).filter(r => r.class === 'C')

  console.log(`  A items: ${aItems.length} (${((aItems.length / items.length) * 100).toFixed(1)}%)`)
  console.log(`  B items: ${bItems.length} (${((bItems.length / items.length) * 100).toFixed(1)}%)`)
  console.log(`  C items: ${cItems.length} (${((cItems.length / items.length) * 100).toFixed(1)}%)`)

  console.log('\n✓ Inventory optimization demo complete')
}

/**
 * Demo 4: Warehouse Management
 */
async function demoWarehouseManagement() {
  console.log('\n' + '-'.repeat(80))
  console.log('DEMO 4: WAREHOUSE MANAGEMENT')
  console.log('-'.repeat(80))

  const warehouse = new WarehouseManager({
    warehouseId: 'WH-001',
    layout: generateWarehouseLayout(),
    strategy: 'velocity-based',
  })

  console.log('\nOptimizing warehouse slotting...')

  const products = generateWarehouseProducts(100)
  const pickFrequency = new Map(products.map(p => [p.id, p.pickFrequency]))

  const slottingResult = await warehouse.optimizeSlotting({
    products,
    pickFrequency,
  })

  console.log(`\nSlotting Optimization Results:`)
  console.log(`  Products slotted: ${slottingResult.assignments.length}`)
  console.log(`  Average pick distance before: ${slottingResult.improvements.beforeDistance.toFixed(1)}m`)
  console.log(`  Average pick distance after: ${slottingResult.improvements.afterDistance.toFixed(1)}m`)
  console.log(`  Improvement: ${(slottingResult.improvements.improvement * 100).toFixed(1)}%`)
  console.log(`  Estimated annual time savings: ${slottingResult.improvements.estimatedTimeSavings.toFixed(0)} hours`)
  console.log(`  Estimated annual cost savings: $${slottingResult.improvements.estimatedCostSavings.toFixed(2)}`)

  // Wave planning
  console.log('\nPlanning wave picking for today\'s orders...')

  const orders = generateOrders(200)
  const wavePlan = await warehouse.planWavePicking({
    orders,
    cutoffTime: '14:00',
    waveSize: 50,
    zones: ['A', 'B', 'C'],
  })

  console.log(`\nWave Plan:`)
  console.log(`  Total orders: ${wavePlan.metrics.totalOrders}`)
  console.log(`  Total lines: ${wavePlan.metrics.totalLines}`)
  console.log(`  Waves created: ${wavePlan.waves.length}`)
  console.log(`  Average wave size: ${wavePlan.metrics.averageWaveSize.toFixed(1)} lines`)

  for (let i = 0; i < Math.min(3, wavePlan.waves.length); i++) {
    const wave = wavePlan.waves[i]
    console.log(`  Wave ${wave.waveId}: ${wave.orders.length} orders, ${wave.lines} lines, ${wave.estimatedTime} min`)
  }

  console.log('\n✓ Warehouse management demo complete')
}

/**
 * Demo 5: Supplier Management
 */
async function demoSupplierManagement() {
  console.log('\n' + '-'.repeat(80))
  console.log('DEMO 5: SUPPLIER MANAGEMENT')
  console.log('-'.repeat(80))

  const supplierMgr = new SupplierManager()

  console.log('\nScoring suppliers using multi-criteria evaluation...')

  const suppliers = generateSuppliers(10)

  const scoringResult = await supplierMgr.scoreSuppliers({
    suppliers,
    criteria: {
      quality: { weight: 0.3, metric: 'quality', direction: 'higher-better' },
      cost: { weight: 0.3, metric: 'cost', direction: 'lower-better' },
      delivery: { weight: 0.2, metric: 'on-time-delivery', direction: 'higher-better' },
      flexibility: { weight: 0.1, metric: 'response-time', direction: 'lower-better' },
      innovation: { weight: 0.1, metric: 'innovation', direction: 'higher-better' },
    },
    method: 'weighted-sum',
  })

  console.log(`\nSupplier Scoring Results:`)
  console.log(`  Top 5 Suppliers:`)
  for (let i = 0; i < Math.min(5, scoringResult.rankings.length); i++) {
    const score = scoringResult.rankings[i]
    const supplier = suppliers.find(s => s.id === score.supplierId)
    console.log(`    ${i + 1}. ${supplier!.name}: ${score.totalScore.toFixed(2)} (${score.recommendation})`)
  }

  console.log(`\nAnalysis:`)
  console.log(`  Top performers: ${scoringResult.analysis.topPerformers.length}`)
  console.log(`  Underperformers: ${scoringResult.analysis.underperformers.length}`)
  console.log(`  Risk suppliers: ${scoringResult.analysis.riskSuppliers.length}`)

  console.log('\n✓ Supplier management demo complete')
}

/**
 * Demo 6: Network Design
 */
async function demoNetworkDesign() {
  console.log('\n' + '-'.repeat(80))
  console.log('DEMO 6: NETWORK DESIGN')
  console.log('-'.repeat(80))

  const designer = new NetworkDesigner()

  console.log('\nOptimizing facility locations...')

  const customers = generateCustomers(100)
  const candidateSites = generateCandidateSites(20)

  const networkDesign = await designer.optimizeFacilityLocations({
    customers,
    candidateSites,
    constraints: {
      maxFacilities: 5,
      minCapacity: 5000,
      maxCapacity: 20000,
      serviceTimeLimit: 48,
    },
    costs: {},
    objective: 'minimize-total-cost',
  })

  console.log(`\nNetwork Design Results:`)
  console.log(`  Facilities to open: ${networkDesign.facilities.length}`)
  console.log(`  Total annual cost: $${networkDesign.totalCost.toFixed(2)}`)
  console.log(`  Average service time: ${networkDesign.metrics.avgServiceTime.toFixed(1)} hours`)
  console.log(`  Coverage: ${(networkDesign.metrics.coverage * 100).toFixed(1)}%`)

  console.log(`\nSelected Facilities:`)
  for (const facility of networkDesign.facilities) {
    console.log(`  ${facility.siteId}:`)
    console.log(`    Capacity: ${facility.capacity}`)
    console.log(`    Throughput: ${facility.throughput.toFixed(0)}`)
    console.log(`    Utilization: ${(facility.utilization * 100).toFixed(1)}%`)
    console.log(`    Customers served: ${facility.customers.length}`)
  }

  console.log('\n✓ Network design demo complete')
}

/**
 * Demo 7: Risk Management
 */
async function demoRiskManagement() {
  console.log('\n' + '-'.repeat(80))
  console.log('DEMO 7: RISK MANAGEMENT')
  console.log('-'.repeat(80))

  const riskMgr = new RiskManager()

  console.log('\nAssessing supply chain risks...')

  const riskAssessment = await riskMgr.assessRisks({
    scope: 'end-to-end',
    categories: ['supply', 'demand', 'operational', 'financial', 'strategic', 'external'],
    data: {
      suppliers: generateSuppliers(10),
      facilities: [],
      inventory: [],
      demand: [],
    },
  })

  console.log(`\nRisk Assessment Results:`)
  console.log(`  Total risks identified: ${riskAssessment.risks.length}`)
  console.log(`  Critical risks: ${riskAssessment.critical.length}`)
  console.log(`  High risks: ${riskAssessment.high.length}`)
  console.log(`  Overall risk score: ${riskAssessment.overallScore.toFixed(0)}/100`)

  console.log(`\nTop 5 Risks:`)
  for (let i = 0; i < Math.min(5, riskAssessment.topRisks.length); i++) {
    const risk = riskAssessment.topRisks[i]
    console.log(`  ${i + 1}. ${risk.description}`)
    console.log(`     Category: ${risk.category}, Score: ${risk.score.toFixed(0)}, Severity: ${risk.severity}`)
  }

  console.log('\n✓ Risk management demo complete')
}

/**
 * Demo 8: Supply Chain Analytics
 */
async function demoAnalytics() {
  console.log('\n' + '-'.repeat(80))
  console.log('DEMO 8: SUPPLY CHAIN ANALYTICS')
  console.log('-'.repeat(80))

  const analytics = new SupplyChainAnalytics()

  console.log('\nCalculating comprehensive KPIs...')

  const kpis = await analytics.calculateKPIs({
    period: { start: '2024-01-01', end: '2024-12-31' },
    data: {
      sales: generateSalesData(365),
      inventory: generateInventoryData(12),
      purchases: generatePurchaseData(365),
      deliveries: generateDeliveryData(1000),
    },
  })

  console.log(`\nSupply Chain KPIs:`)
  console.log(`\nFinancial Metrics:`)
  console.log(`  Total Revenue: $${kpis.financialMetrics.totalRevenue.toLocaleString()}`)
  console.log(`  Gross Margin: ${(kpis.financialMetrics.grossMargin * 100).toFixed(1)}%`)
  console.log(`  Cash-to-Cash Cycle: ${kpis.financialMetrics.cashToCashCycle.toFixed(0)} days`)
  console.log(`    DIO: ${kpis.financialMetrics.dio.toFixed(0)} days`)
  console.log(`    DSO: ${kpis.financialMetrics.dso.toFixed(0)} days`)
  console.log(`    DPO: ${kpis.financialMetrics.dpo.toFixed(0)} days`)

  console.log(`\nOperational Metrics:`)
  console.log(`  Inventory Turnover: ${kpis.operationalMetrics.inventoryTurnover.toFixed(2)}x`)
  console.log(`  Fill Rate: ${(kpis.operationalMetrics.fillRate * 100).toFixed(1)}%`)
  console.log(`  Stockout Rate: ${(kpis.operationalMetrics.stockoutRate * 100).toFixed(1)}%`)

  console.log(`\nService Metrics:`)
  console.log(`  Perfect Order Rate: ${(kpis.serviceMetrics.perfectOrderRate * 100).toFixed(1)}%`)
  console.log(`  On-Time Delivery: ${(kpis.serviceMetrics.onTimeDelivery * 100).toFixed(1)}%`)
  console.log(`  Customer Satisfaction: ${kpis.serviceMetrics.customerSatisfaction.toFixed(1)}/10`)

  // Benchmarking
  console.log('\nComparing against industry benchmarks...')

  const benchmarks = await analytics.benchmarkAnalysis({
    kpis,
    industry: 'retail',
    region: 'North America',
  })

  console.log(`\nBenchmark Comparison:`)
  for (const benchmark of benchmarks) {
    const delta = benchmark.value - benchmark.industryAverage
    const symbol = delta > 0 ? '▲' : '▼'
    const status = benchmark.percentile >= 75 ? 'Top Quartile' :
                   benchmark.percentile >= 50 ? 'Above Average' :
                   benchmark.percentile >= 25 ? 'Below Average' : 'Bottom Quartile'

    console.log(`  ${benchmark.metric}: ${benchmark.value.toFixed(1)} (${status})`)
    console.log(`    Industry avg: ${benchmark.industryAverage.toFixed(1)} ${symbol} ${Math.abs(delta).toFixed(1)}`)
  }

  console.log('\n✓ Analytics demo complete')
}

// ============================================================================
// Helper Functions to Generate Sample Data
// ============================================================================

function generateHistoricalDemand(days: number) {
  const data = []
  const baselineDemand = 100
  const seasonalityPeriod = 7

  for (let i = 0; i < days; i++) {
    const date = new Date(2024, 0, 1)
    date.setDate(date.getDate() + i)

    const seasonalFactor = 1 + 0.2 * Math.sin((2 * Math.PI * i) / seasonalityPeriod)
    const noise = 0.9 + Math.random() * 0.2
    const demand = Math.round(baselineDemand * seasonalFactor * noise)

    data.push({
      date: date.toISOString(),
      demand,
      sales: demand,
      stockout: Math.random() < 0.05,
      promotion: Math.random() < 0.1,
      price: 50 + Math.random() * 10,
    })
  }

  return data
}

function generateDeliveries(count: number) {
  const deliveries = []

  for (let i = 0; i < count; i++) {
    deliveries.push({
      id: `DEL-${String(i + 1).padStart(3, '0')}`,
      customerId: `CUST-${String(i + 1).padStart(3, '0')}`,
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
      priority: Math.floor(Math.random() * 3) + 1,
    })
  }

  return deliveries
}

function generateVehicles(count: number) {
  const vehicles = []

  for (let i = 0; i < count; i++) {
    vehicles.push({
      id: `VEH-${String(i + 1).padStart(3, '0')}`,
      type: 'truck',
      capacity: 1000,
      maxVolume: 50,
      maxWeight: 5000,
      costPerKm: 2.5,
      costPerHour: 40,
      fixedCost: 100,
      maxRouteTime: 480,
      startLocation: { lat: 40.7128, lng: -74.0060 },
      availableTimeWindow: {
        start: '06:00',
        end: '20:00',
      },
    })
  }

  return vehicles
}

function generateWarehouseLayout() {
  return {
    aisles: [
      {
        id: 'A',
        zone: 'picking',
        length: 100,
        width: 3,
        locations: Array.from({ length: 50 }, (_, i) => ({
          id: `A-${i + 1}`,
          aisle: 'A',
          zone: 'picking',
          level: Math.floor(i / 10) + 1,
          position: i % 10,
          coordinates: { x: i * 2, y: 0, z: Math.floor(i / 10) },
          type: 'pick' as const,
          capacity: 100,
          occupied: Math.random() < 0.7,
        })),
      },
    ],
  }
}

function generateWarehouseProducts(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `PROD-${String(i + 1).padStart(3, '0')}`,
    dimensions: {
      length: Math.random() * 50 + 10,
      width: Math.random() * 50 + 10,
      height: Math.random() * 50 + 10,
    },
    pickFrequency: Math.floor(Math.random() * 1000),
    velocity: Math.random() * 100,
  }))
}

function generateOrders(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `ORD-${String(i + 1).padStart(4, '0')}`,
    items: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, j) => ({
      productId: `PROD-${String(j + 1).padStart(3, '0')}`,
      quantity: Math.floor(Math.random() * 10) + 1,
      location: `A-${Math.floor(Math.random() * 50) + 1}`,
    })),
    priority: Math.floor(Math.random() * 3) + 1,
    dueTime: '17:00',
  }))
}

function generateSuppliers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `SUP-${String(i + 1).padStart(3, '0')}`,
    name: `Supplier ${i + 1}`,
    location: {
      lat: 40 + Math.random() * 10,
      lng: -100 + Math.random() * 20,
      country: 'USA',
    },
    tier: 'approved' as const,
    categories: ['electronics'],
    products: [],
    capabilities: {
      capacity: 10000,
      flexibility: Math.random(),
      qualitySystem: ['ISO9001'],
      certifications: [],
      technology: [],
      innovation: Math.random(),
    },
    performance: {
      onTimeDelivery: 0.85 + Math.random() * 0.15,
      qualityRating: 0.85 + Math.random() * 0.15,
      responseTime: Math.random() * 5 + 1,
      fillRate: 0.9 + Math.random() * 0.1,
      defectRate: Math.random() * 0.05,
      costCompetitiveness: 0.7 + Math.random() * 0.3,
      innovation: Math.random(),
      sustainability: Math.random(),
      reliability: 0.8 + Math.random() * 0.2,
    },
    risks: [],
    contracts: [],
    contacts: [],
  }))
}

function generateCustomers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `CUST-${String(i + 1).padStart(3, '0')}`,
    location: {
      lat: 40 + Math.random() * 5,
      lng: -75 + Math.random() * 5,
    },
    demand: Math.floor(Math.random() * 1000) + 100,
    revenue: Math.floor(Math.random() * 100000) + 10000,
    serviceTimeRequired: Math.random() * 48,
  }))
}

function generateCandidateSites(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `SITE-${String(i + 1).padStart(2, '0')}`,
    location: {
      lat: 40 + Math.random() * 5,
      lng: -75 + Math.random() * 5,
    },
    capacity: 10000 + Math.floor(Math.random() * 10000),
    fixedCost: 500000 + Math.floor(Math.random() * 500000),
    variableCost: 5 + Math.random() * 10,
    operatingCost: 200000 + Math.floor(Math.random() * 300000),
    status: 'available' as const,
  }))
}

function generateSalesData(days: number) {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(2024, 0, i + 1),
    revenue: 50000 + Math.random() * 50000,
    quantity: Math.floor(Math.random() * 1000),
  }))
}

function generateInventoryData(months: number) {
  return Array.from({ length: months }, (_, i) => ({
    month: i + 1,
    value: 500000 + Math.random() * 200000,
    quantity: 5000 + Math.floor(Math.random() * 2000),
  }))
}

function generatePurchaseData(days: number) {
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(2024, 0, i + 1),
    cost: 30000 + Math.random() * 30000,
  }))
}

function generateDeliveryData(count: number) {
  return Array.from({ length: count }, () => ({
    onTime: Math.random() > 0.1,
    complete: Math.random() > 0.05,
    damaged: Math.random() < 0.02,
  }))
}

// Run the demo
runSupplyChainDemo().catch(console.error)
