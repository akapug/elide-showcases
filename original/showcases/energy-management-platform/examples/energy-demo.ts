/**
 * Energy Management Platform - Comprehensive Demo
 * Demonstrates all major features with realistic scenarios
 */

import { LoadForecaster } from '../src/forecasting/load-forecaster'
import { RenewableForecaster } from '../src/forecasting/renewable-forecaster'
import { BatteryOptimizer } from '../src/optimization/battery-optimizer'
import { DemandResponseManager } from '../src/optimization/demand-response'
import { GridBalancer } from '../src/grid/grid-balancer'
import { EnergyTrader } from '../src/market/energy-trading'
import { EnergyAnalytics } from '../src/analytics/energy-analytics'

/**
 * Demo 1: Load Forecasting
 */
async function demoLoadForecasting() {
  console.log('\n=== DEMO 1: Load Forecasting ===\n')

  const forecaster = new LoadForecaster({
    models: ['lstm', 'xgboost', 'prophet'],
    ensemble: true,
    horizon: 24,
    features: ['temperature', 'humidity', 'dayOfWeek', 'hour', 'isHoliday'],
  })

  // Generate synthetic historical data
  const historicalData = generateHistoricalLoad(365)

  console.log('Training load forecasting models...')
  const trainingResult = await forecaster.train(historicalData)

  console.log('\nTraining Results:')
  console.log(`- Training time: ${(trainingResult.trainingTime / 1000).toFixed(2)}s`)
  console.log(`- MAPE: ${(trainingResult.metrics.mape * 100).toFixed(2)}%`)
  console.log(`- RMSE: ${trainingResult.metrics.rmse.toFixed(2)} MW`)
  console.log(`- MAE: ${trainingResult.metrics.mae.toFixed(2)} MW`)
  console.log(`- R²: ${trainingResult.metrics.r2.toFixed(4)}`)

  if (trainingResult.featureImportance) {
    console.log('\nTop 5 Features:')
    trainingResult.featureImportance.slice(0, 5).forEach((f) => {
      console.log(`  ${f.rank}. ${f.feature}: ${(f.importance * 100).toFixed(2)}%`)
    })
  }

  // Forecast next 24 hours
  console.log('\nForecasting next 24 hours...')
  const forecast = await forecaster.forecast(24)

  console.log(`Peak load: ${forecast.peak?.toFixed(2)} MW at ${forecast.peakTime?.toLocaleTimeString()}`)
  console.log(`Valley load: ${forecast.valley?.toFixed(2)} MW at ${forecast.valleyTime?.toLocaleTimeString()}`)

  return forecast
}

/**
 * Demo 2: Renewable Energy Forecasting
 */
async function demoRenewableForecasting() {
  console.log('\n=== DEMO 2: Renewable Energy Forecasting ===\n')

  const forecaster = new RenewableForecaster({
    sources: ['solar', 'wind'],
    models: {
      solar: 'pvlib_ml_hybrid',
      wind: 'power_curve_ml',
    },
  })

  // Solar forecasting
  console.log('Forecasting solar generation...')
  const solarForecast = await forecaster.forecastSolar({
    location: { latitude: 37.7749, longitude: -122.4194, altitude: 100 },
    capacity: 50000, // 50 MW
    panelSpecs: {
      efficiency: 0.18,
      tilt: 30,
      azimuth: 180,
      temperatureCoefficient: -0.004,
      inverterEfficiency: 0.96,
    },
    weather: generateWeatherForecast(48),
    horizon: 48,
  })

  console.log('\nSolar Forecast (next 48 hours):')
  console.log(`- Capacity factor: ${(solarForecast.capacity_factor! * 100).toFixed(2)}%`)
  console.log(`- Peak output: ${Math.max(...solarForecast.predictions).toFixed(2)} kW`)
  console.log(`- Average output: ${(solarForecast.predictions.reduce((a, b) => a + b, 0) / solarForecast.predictions.length).toFixed(2)} kW`)

  // Wind forecasting
  console.log('\nForecasting wind generation...')
  const windForecast = await forecaster.forecastWind({
    location: { latitude: 40.7128, longitude: -74.0060, altitude: 50 },
    capacity: 100000, // 100 MW
    turbineSpecs: {
      hubHeight: 80,
      rotorDiameter: 90,
      ratedPower: 2000,
      cutInSpeed: 3,
      cutOutSpeed: 25,
      powerCurve: {
        windSpeeds: [3, 5, 7, 9, 11, 13, 15, 25],
        power: [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0, 1.0],
      },
      availability: 0.97,
    },
    weather: generateWeatherForecast(48),
    horizon: 48,
  })

  console.log('\nWind Forecast (next 48 hours):')
  console.log(`- Capacity factor: ${(windForecast.capacity_factor! * 100).toFixed(2)}%`)
  console.log(`- Peak output: ${Math.max(...windForecast.predictions).toFixed(2)} kW`)
  console.log(`- Average output: ${(windForecast.predictions.reduce((a, b) => a + b, 0) / windForecast.predictions.length).toFixed(2)} kW`)

  return { solar: solarForecast, wind: windForecast }
}

/**
 * Demo 3: Battery Optimization
 */
async function demoBatteryOptimization(loadForecast: any, renewableForecast: any) {
  console.log('\n=== DEMO 3: Battery Optimization ===\n')

  const optimizer = new BatteryOptimizer({
    capacity: 100000, // 100 MWh
    power: 25000, // 25 MW
    efficiency: 0.92,
    depthOfDischarge: 0.9,
    cycleLife: 5000,
    initialSOC: 0.5,
  })

  // Generate price forecast
  const prices = generatePriceForecast(24)

  console.log('Optimizing battery schedule for revenue maximization...')
  const schedule = await optimizer.optimize({
    loadForecast,
    renewableForecast: renewableForecast.solar,
    prices,
    horizon: 24,
    objective: 'maximize_revenue',
    constraints: {
      socMin: 0.1,
      socMax: 0.9,
      maxCycles: 1.5,
      reserveRequirement: 0.2,
    },
  })

  console.log('\nBattery Schedule:')
  console.log(`- Revenue: $${schedule.revenue?.toFixed(2)}`)
  console.log(`- Degradation cost: $${schedule.degradationCost?.toFixed(2)}`)
  console.log(`- Net revenue: $${schedule.netRevenue?.toFixed(2)}`)
  console.log(`- SOC range: ${(Math.min(...schedule.soc) * 100).toFixed(1)}% - ${(Math.max(...schedule.soc) * 100).toFixed(1)}%`)

  // Show hourly schedule (first 6 hours)
  console.log('\nHourly Schedule (first 6 hours):')
  for (let i = 0; i < 6; i++) {
    const action = schedule.power[i] > 0 ? 'Charge' : schedule.power[i] < 0 ? 'Discharge' : 'Idle'
    console.log(
      `  Hour ${i + 1}: ${action} ${Math.abs(schedule.power[i]).toFixed(1)} kW, ` +
        `SOC: ${(schedule.soc[i] * 100).toFixed(1)}%, Price: $${prices.prices[i].toFixed(2)}/MWh`
    )
  }

  return schedule
}

/**
 * Demo 4: Demand Response
 */
async function demoDemandResponse(loadForecast: any) {
  console.log('\n=== DEMO 4: Demand Response ===\n')

  const drManager = new DemandResponseManager({
    programs: [
      {
        type: 'direct_load_control',
        capacity: 5000,
        assets: generateDRAssets('hvac', 1000),
        curtailmentLimit: 4,
      },
      {
        type: 'price_based',
        capacity: 3000,
        customers: generateCustomers('commercial', 500),
      },
      {
        type: 'emergency',
        capacity: 20000,
        assets: generateDRAssets('industrial_process', 50),
      },
    ],
  })

  console.log('Optimizing demand response for price spike event...')
  const drSchedule = await drManager.optimize({
    loadForecast,
    gridConstraints: {
      frequencyLimits: { min: 59.9, max: 60.1 },
      voltageLimits: { min: 0.95, max: 1.05 },
    },
    eventTrigger: {
      type: 'price_spike',
      threshold: 150,
      duration: 4,
      priority: 'high',
    },
  })

  console.log('\nDemand Response Schedule:')
  console.log(`- Total events: ${drSchedule.events.length}`)
  console.log(`- Total reduction: ${drSchedule.totalReduction.toFixed(2)} kW`)
  console.log(`- Customer impacts: ${drSchedule.customerImpact.length}`)

  for (const event of drSchedule.events) {
    console.log(
      `\n  Event: ${event.start.toLocaleTimeString()} - ${event.end.toLocaleTimeString()}`
    )
    console.log(`  - Target reduction: ${event.targetReduction.toFixed(2)} kW`)
    console.log(`  - Assets: ${event.assets.length}`)
    console.log(`  - Compensation: $${event.compensation?.toFixed(2)}`)
  }

  // Dispatch DR events
  console.log('\nDispatching demand response...')
  await drManager.dispatch(drSchedule)

  // Monitor response
  console.log('\nMonitoring DR response...')
  const response = await drManager.monitor({
    interval: 60,
    metrics: ['load_reduction', 'customer_compliance', 'cost_savings'],
  })

  console.log('\nDR Response:')
  console.log(`- Achieved reduction: ${response.achievedReduction.toFixed(2)} kW`)
  console.log(`- Compliance rate: ${(response.complianceRate * 100).toFixed(1)}%`)
  console.log(`- Total incentives: $${response.totalIncentives.toFixed(2)}`)

  return response
}

/**
 * Demo 5: Grid Balancing
 */
async function demoGridBalancing() {
  console.log('\n=== DEMO 5: Grid Balancing ===\n')

  const balancer = new GridBalancer({
    nominalFrequency: 60,
    voltageLevel: 138,
    inertia: 3.5,
    droop: 0.05,
    topology: generateGridTopology(),
  })

  // AGC demonstration
  console.log('Computing AGC signal for frequency deviation...')
  const agcSignal = await balancer.computeAGC({
    frequencyError: 0.05, // 0.05 Hz deviation
    tieLineError: 50, // 50 MW tie line error
    beta: 1200, // MW/0.1Hz
  })

  console.log('\nAGC Signal:')
  console.log(`- Total power adjustment: ${agcSignal.power.toFixed(2)} MW`)
  console.log(`- Generators dispatched: ${Object.keys(agcSignal.generators).length}`)

  // Show generator allocations
  console.log('\nGenerator Allocations:')
  for (const [genId, power] of Object.entries(agcSignal.generators).slice(0, 5)) {
    console.log(`  ${genId}: ${power.toFixed(2)} MW`)
  }

  // VAR optimization
  console.log('\nOptimizing VAR dispatch for voltage control...')
  const varSchedule = await balancer.optimizeVAR({
    voltageLimits: { min: 0.95, max: 1.05 },
    reactivePowerSources: generateVARSources(20),
    objective: 'minimize_losses',
  })

  console.log('\nVAR Optimization Results:')
  console.log(`- Total losses: ${varSchedule.losses.toFixed(2)} MW`)
  console.log(`- Sources dispatched: ${Object.keys(varSchedule.sources).length}`)

  // Optimal power flow
  console.log('\nPerforming optimal power flow...')
  const opf = await balancer.optimalPowerFlow('minimize_cost')

  console.log('\nOptimal Power Flow:')
  console.log(`- Total cost: $${opf.totalCost.toFixed(2)}`)
  console.log(`- Total emissions: ${opf.totalEmissions.toFixed(2)} metric tons CO2`)
  console.log(`- Success: ${opf.success}`)

  return { agc: agcSignal, var: varSchedule, opf }
}

/**
 * Demo 6: Energy Trading
 */
async function demoEnergyTrading(loadForecast: any, renewableForecast: any) {
  console.log('\n=== DEMO 6: Energy Trading ===\n')

  const trader = new EnergyTrader({
    markets: ['day_ahead', 'real_time', 'ancillary_services'],
    bidStrategy: 'profit_maximizing',
    riskTolerance: 'moderate',
  })

  // Day-ahead bidding
  console.log('Generating day-ahead bids...')
  const dayAheadBids = await trader.generateDayAheadBids({
    loadForecast,
    renewableForecast: renewableForecast.solar,
    priceForecasts: generatePriceForecast(24),
    availableCapacity: {
      generation: 150000,
      storage: 50000,
      demandResponse: 20000,
    },
  })

  console.log('\nDay-Ahead Bids:')
  console.log(`- Total bids: ${dayAheadBids.length}`)
  console.log(
    `- Total quantity: ${dayAheadBids.reduce((sum, b) => sum + b.quantity, 0).toFixed(2)} MW`
  )
  console.log(
    `- Average price: $${(dayAheadBids.reduce((sum, b) => sum + b.price, 0) / dayAheadBids.length).toFixed(2)}/MWh`
  )

  // Submit bids
  const submission = await trader.submitBids('day_ahead', dayAheadBids)
  console.log(`\nBid submission: ${submission.accepted ? 'Accepted' : 'Rejected'}`)

  // Ancillary services
  console.log('\nGenerating ancillary services bids...')
  const ancillaryBids = await trader.generateAncillaryBids({
    services: ['regulation_up', 'regulation_down', 'spinning_reserve'],
    availableAssets: [
      { type: 'battery', capacity: 25000 },
      { type: 'hydro', capacity: 50000 },
    ],
  })

  console.log(`- Ancillary service bids: ${ancillaryBids.length}`)

  // Performance
  const performance = await trader.computePerformance()
  console.log('\nTrading Performance:')
  console.log(`- Total P&L: $${performance.totalPnL.toFixed(2)}`)
  console.log(`- Sharpe ratio: ${performance.sharpeRatio.toFixed(2)}`)

  return { dayAheadBids, ancillaryBids, performance }
}

/**
 * Demo 7: Analytics and Reporting
 */
async function demoAnalytics() {
  console.log('\n=== DEMO 7: Analytics and Reporting ===\n')

  const analytics = new EnergyAnalytics({
    dataWarehouse: {
      host: 'localhost',
      port: 5432,
      database: 'energy_db',
      user: 'admin',
      password: 'password',
    },
    metricsEngine: 'real_time',
    reporting: {
      frequency: 'hourly',
      aggregations: ['hourly', 'daily', 'monthly'],
    },
  })

  // Performance metrics
  console.log('Computing performance metrics...')
  const performance = await analytics.computePerformanceMetrics({
    period: { start: '2024-01-01', end: '2024-12-31' },
    metrics: [
      'forecast_accuracy',
      'renewable_capacity_factor',
      'battery_cycles',
      'demand_response_effectiveness',
      'grid_reliability',
    ],
  })

  console.log('\nPerformance Metrics:')
  if (performance.forecast_accuracy) {
    console.log('\nForecast Accuracy:')
    console.log(
      `  - Load: MAPE ${(performance.forecast_accuracy.load!.mape * 100).toFixed(2)}%`
    )
    console.log(
      `  - Solar: MAPE ${(performance.forecast_accuracy.solar!.mape * 100).toFixed(2)}%`
    )
    console.log(
      `  - Wind: MAPE ${(performance.forecast_accuracy.wind!.mape * 100).toFixed(2)}%`
    )
  }

  if (performance.renewable_capacity_factor) {
    console.log('\nCapacity Factors:')
    console.log(
      `  - Solar: ${(performance.renewable_capacity_factor.solar! * 100).toFixed(2)}%`
    )
    console.log(
      `  - Wind: ${(performance.renewable_capacity_factor.wind! * 100).toFixed(2)}%`
    )
    console.log(
      `  - Combined: ${(performance.renewable_capacity_factor.combined! * 100).toFixed(2)}%`
    )
  }

  console.log(`\nBattery Cycles: ${performance.battery_cycles}`)
  console.log(
    `DR Effectiveness: ${(performance.demand_response_effectiveness! * 100).toFixed(1)}%`
  )
  console.log(
    `Grid Reliability: ${(performance.grid_reliability! * 100).toFixed(4)}%`
  )

  // Cost analysis
  console.log('\nAnalyzing costs...')
  const costs = await analytics.analyzeCosts({
    components: [
      'generation',
      'transmission',
      'distribution',
      'storage',
      'demand_response',
      'market_operations',
    ],
    allocation: 'activity_based',
  })

  console.log('\nCost Breakdown:')
  console.log(`- Total: $${(costs.total / 1000000).toFixed(2)}M`)
  console.log(`- Per MWh: $${costs.perMWh.toFixed(2)}`)
  console.log(`- Per customer: $${costs.perCustomer.toFixed(2)}`)

  // Sustainability report
  console.log('\nGenerating sustainability report...')
  const sustainability = await analytics.generateSustainabilityReport({
    standards: ['GRI', 'CDP', 'TCFD'],
    metrics: ['renewable_penetration', 'carbon_intensity', 'avoided_emissions'],
  })

  console.log('\nSustainability Metrics:')
  console.log(
    `- Renewable penetration: ${(sustainability.renewable_penetration * 100).toFixed(2)}%`
  )
  console.log(`- Carbon intensity: ${sustainability.carbon_intensity.toFixed(2)} kg CO2/MWh`)
  console.log(
    `- Avoided emissions: ${(sustainability.avoided_emissions / 1000).toFixed(2)}k metric tons CO2`
  )
  console.log(`- Energy efficiency: ${(sustainability.energy_efficiency * 100).toFixed(2)}%`)

  return { performance, costs, sustainability }
}

/**
 * Run all demos
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║   Energy Management Platform - Comprehensive Demo            ║')
  console.log('║   Powered by Elide TypeScript + Python Integration          ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')

  try {
    // Demo 1: Load Forecasting
    const loadForecast = await demoLoadForecasting()

    // Demo 2: Renewable Forecasting
    const renewableForecast = await demoRenewableForecasting()

    // Demo 3: Battery Optimization
    const batterySchedule = await demoBatteryOptimization(loadForecast, renewableForecast)

    // Demo 4: Demand Response
    const drResponse = await demoDemandResponse(loadForecast)

    // Demo 5: Grid Balancing
    const gridControl = await demoGridBalancing()

    // Demo 6: Energy Trading
    const trading = await demoEnergyTrading(loadForecast, renewableForecast)

    // Demo 7: Analytics
    const analytics = await demoAnalytics()

    console.log('\n╔══════════════════════════════════════════════════════════════╗')
    console.log('║   All demos completed successfully!                          ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')
  } catch (error) {
    console.error('\nError running demos:', error)
    process.exit(1)
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateHistoricalLoad(days: number): any[] {
  const data = []
  const baseDate = new Date('2024-01-01')

  for (let d = 0; d < days; d++) {
    for (let h = 0; h < 24; h++) {
      const timestamp = new Date(baseDate.getTime() + d * 86400000 + h * 3600000)

      // Seasonal pattern
      const dayOfYear = Math.floor((timestamp.getTime() - baseDate.getTime()) / 86400000)
      const seasonal = 1 + 0.3 * Math.sin((2 * Math.PI * dayOfYear) / 365)

      // Weekly pattern
      const dayOfWeek = timestamp.getDay()
      const weekly = dayOfWeek === 0 || dayOfWeek === 6 ? 0.85 : 1.0

      // Daily pattern
      const hourly = 0.6 + 0.4 * Math.sin(((h - 6) * Math.PI) / 12)

      // Base load with patterns
      const load = 4000 * seasonal * weekly * hourly + (Math.random() - 0.5) * 200

      data.push({
        timestamp,
        load,
        temperature: 15 + 10 * Math.sin((2 * Math.PI * dayOfYear) / 365) + (Math.random() - 0.5) * 5,
        humidity: 0.5 + 0.2 * (Math.random() - 0.5),
        dayOfWeek,
        hour: h,
        isHoliday: false,
      })
    }
  }

  return data
}

function generateWeatherForecast(hours: number): any {
  const forecasts = []
  const now = new Date()

  for (let h = 0; h < hours; h++) {
    forecasts.push({
      timestamp: new Date(now.getTime() + h * 3600000),
      temperature: 20 + 5 * Math.sin((h * Math.PI) / 12) + (Math.random() - 0.5) * 3,
      humidity: 0.6 + 0.1 * (Math.random() - 0.5),
      pressure: 1013 + (Math.random() - 0.5) * 10,
      windSpeed: 5 + 3 * Math.random(),
      windDirection: Math.random() * 360,
      cloudCover: Math.random() * 0.5,
      ghi: Math.max(0, 800 * Math.sin((h * Math.PI) / 12) * (1 - Math.random() * 0.3)),
      dni: Math.max(0, 700 * Math.sin((h * Math.PI) / 12) * (1 - Math.random() * 0.4)),
      dhi: Math.max(0, 100 + Math.random() * 50),
    })
  }

  return {
    location: { latitude: 37.7749, longitude: -122.4194, altitude: 100 },
    forecasts,
    source: 'NOAA',
    issuedAt: now,
  }
}

function generatePriceForecast(hours: number): any {
  const prices = []
  const timestamps = []
  const now = new Date()

  for (let h = 0; h < hours; h++) {
    timestamps.push(new Date(now.getTime() + h * 3600000))

    // Price pattern: low at night, high during peak hours
    const basePrice = 40
    const peakMultiplier = h >= 16 && h <= 20 ? 1.8 : h >= 8 && h <= 16 ? 1.3 : 0.8

    prices.push(basePrice * peakMultiplier + (Math.random() - 0.5) * 10)
  }

  return { timestamps, prices }
}

function generateDRAssets(type: string, count: number): any[] {
  const assets = []

  for (let i = 0; i < count; i++) {
    assets.push({
      id: `${type}_${i}`,
      type,
      capacity: type === 'hvac' ? 5 : type === 'industrial_process' ? 500 : 50,
      flexibility: {
        minPower: 0,
        maxPower: type === 'hvac' ? 5 : 500,
        rampRate: 5,
        recoveryTime: 60,
        curtailmentDuration: 120,
      },
    })
  }

  return assets
}

function generateCustomers(segment: string, count: number): any[] {
  const customers = []

  for (let i = 0; i < count; i++) {
    customers.push({
      id: `${segment}_${i}`,
      segment,
      averageLoad: segment === 'commercial' ? 50 : 10,
      priceElasticity: -0.15,
      comfortPreferences: {
        temperatureRange: { min: 20, max: 26 },
        deferralTolerance: 2,
        participationWillingness: 0.7 + Math.random() * 0.3,
      },
    })
  }

  return customers
}

function generateGridTopology(): any {
  const buses = []
  const branches = []
  const generators = []

  // Generate buses
  for (let i = 0; i < 10; i++) {
    buses.push({
      id: `bus_${i}`,
      type: i === 0 ? 'slack' : 'pq',
      voltage: 1.0,
      angle: 0,
      load: 100 + Math.random() * 50,
    })
  }

  // Generate branches
  for (let i = 0; i < 9; i++) {
    branches.push({
      id: `line_${i}`,
      from: `bus_${i}`,
      to: `bus_${i + 1}`,
      resistance: 0.01 + Math.random() * 0.01,
      reactance: 0.05 + Math.random() * 0.05,
      susceptance: 0.001,
      ratingMVA: 100,
    })
  }

  // Generate generators
  const types = ['coal', 'natural_gas', 'hydro', 'wind', 'solar']
  for (let i = 0; i < 5; i++) {
    generators.push({
      id: `gen_${i}`,
      bus: `bus_${i}`,
      type: types[i],
      capacity: 200 + Math.random() * 100,
      minOutput: 50,
      rampRate: 50,
      cost: {
        fixed: 100,
        variable: 30 + Math.random() * 40,
        startup: 1000,
        shutdown: 500,
      },
    })
  }

  return { buses, branches, generators }
}

function generateVARSources(count: number): any[] {
  const sources = []

  for (let i = 0; i < count; i++) {
    sources.push({
      id: `var_source_${i}`,
      bus: `bus_${i % 10}`,
      type: i % 3 === 0 ? 'generator' : i % 3 === 1 ? 'capacitor' : 'reactor',
      qMin: -50,
      qMax: 50,
    })
  }

  return sources
}

// Run demos
main()
