/**
 * Battery Optimizer - Energy storage optimization for grid services
 * Demonstrates Elide's TypeScript + Python integration for optimization problems
 */

// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import scipy from 'python:scipy'
// @ts-ignore
import pandas from 'python:pandas'

import type {
  BatterySpecs,
  BatteryState,
  BatteryOptimizationParams,
  BatterySchedule,
  BatteryConstraints,
  Forecast,
  PriceForecast,
} from '../types'

/**
 * BatteryOptimizer - Advanced battery energy storage system optimization
 *
 * Optimization objectives:
 * - Revenue maximization through arbitrage
 * - Cost minimization through peak shaving
 * - Self-consumption maximization for solar+storage
 * - Frequency regulation services
 *
 * Algorithms:
 * - Linear Programming (LP)
 * - Mixed-Integer Linear Programming (MILP)
 * - Dynamic Programming (DP)
 * - Model Predictive Control (MPC)
 */
export class BatteryOptimizer {
  private specs: BatterySpecs
  private currentState: BatteryState
  private optimizationHistory: BatterySchedule[] = []

  constructor(specs: BatterySpecs) {
    this.specs = {
      initialSOC: 0.5,
      ...specs,
    }

    this.currentState = {
      soc: this.specs.initialSOC!,
      power: 0,
      cycles: 0,
      health: 1.0,
    }
  }

  /**
   * Optimize battery schedule
   */
  async optimize(params: BatteryOptimizationParams): Promise<BatterySchedule> {
    const { loadForecast, renewableForecast, prices, horizon, objective, constraints } = params

    console.log(`Optimizing battery schedule for ${horizon} hours...`)
    console.log(`Objective: ${objective}`)

    let schedule: BatterySchedule

    switch (objective) {
      case 'maximize_revenue':
        schedule = await this.optimizeRevenue(prices, horizon, constraints)
        break

      case 'minimize_cost':
        schedule = await this.minimizeCost(loadForecast, prices, horizon, constraints)
        break

      case 'maximize_self_consumption':
        schedule = await this.maximizeSelfConsumption(
          loadForecast,
          renewableForecast!,
          horizon,
          constraints
        )
        break

      case 'minimize_peak_demand':
        schedule = await this.minimizePeakDemand(loadForecast, horizon, constraints)
        break

      case 'minimize_emissions':
        schedule = await this.minimizeEmissions(loadForecast, horizon, constraints)
        break

      default:
        throw new Error(`Unknown objective: ${objective}`)
    }

    // Calculate financials
    if (prices) {
      schedule.revenue = this.calculateRevenue(schedule, prices)
      schedule.degradationCost = this.calculateDegradationCost(schedule)
      schedule.netRevenue = schedule.revenue - schedule.degradationCost
    }

    this.optimizationHistory.push(schedule)

    return schedule
  }

  /**
   * Optimize for revenue maximization (arbitrage)
   */
  private async optimizeRevenue(
    prices: PriceForecast,
    horizon: number,
    constraints?: BatteryConstraints
  ): Promise<BatterySchedule> {
    // Linear Programming formulation
    // maximize: Σ(P_discharge(t) * price(t) - P_charge(t) * price(t))
    // subject to:
    //   SOC(t+1) = SOC(t) + η_charge * P_charge(t) - P_discharge(t) / η_discharge
    //   SOC_min <= SOC(t) <= SOC_max
    //   -P_max <= P(t) <= P_max
    //   Cumulative cycles <= max_cycles

    const n = horizon
    const η_charge = this.specs.efficiency
    const η_discharge = this.specs.efficiency

    // Decision variables: [P_charge(0), ..., P_charge(n-1), P_discharge(0), ..., P_discharge(n-1)]
    const numVars = 2 * n

    // Objective coefficients (negative because we maximize, scipy minimizes)
    const c = numpy.zeros(numVars)
    for (let t = 0; t < n; t++) {
      c[t] = prices.prices[t] // Charge cost (minimize)
      c[n + t] = -prices.prices[t] // Discharge revenue (maximize)
    }

    // Inequality constraints: A_ub * x <= b_ub
    const A_ub = []
    const b_ub = []

    // Power limits
    for (let t = 0; t < n; t++) {
      // P_charge(t) <= P_max
      const row1 = numpy.zeros(numVars)
      row1[t] = 1
      A_ub.push(Array.from(row1))
      b_ub.push(this.specs.power)

      // P_discharge(t) <= P_max
      const row2 = numpy.zeros(numVars)
      row2[n + t] = 1
      A_ub.push(Array.from(row2))
      b_ub.push(this.specs.power)
    }

    // SOC constraints
    const socMin = constraints?.socMin || 0.1
    const socMax = constraints?.socMax || 0.9

    for (let t = 0; t < n; t++) {
      // SOC(t) >= SOC_min
      const row1 = numpy.zeros(numVars)
      for (let i = 0; i <= t; i++) {
        row1[i] = -η_charge / this.specs.capacity
        row1[n + i] = 1 / (η_discharge * this.specs.capacity)
      }
      A_ub.push(Array.from(row1))
      b_ub.push(-socMin + this.currentState.soc)

      // SOC(t) <= SOC_max
      const row2 = numpy.zeros(numVars)
      for (let i = 0; i <= t; i++) {
        row2[i] = η_charge / this.specs.capacity
        row2[n + i] = -1 / (η_discharge * this.specs.capacity)
      }
      A_ub.push(Array.from(row2))
      b_ub.push(socMax - this.currentState.soc)
    }

    // Bounds: 0 <= P_charge, P_discharge <= P_max
    const bounds = []
    for (let i = 0; i < numVars; i++) {
      bounds.push([0, this.specs.power])
    }

    // Solve LP
    const result = scipy.optimize.linprog({
      c: c,
      A_ub: numpy.array(A_ub),
      b_ub: numpy.array(b_ub),
      bounds: bounds,
      method: 'highs',
    })

    if (!result.success) {
      console.warn('Optimization failed:', result.message)
    }

    // Extract solution
    const P_charge = result.x.slice(0, n)
    const P_discharge = result.x.slice(n, 2 * n)

    // Net power (negative = discharge, positive = charge)
    const power = Array.from(P_charge.map((pc: number, i: number) => pc - P_discharge[i]))

    // Calculate SOC trajectory
    const soc = [this.currentState.soc]
    for (let t = 0; t < n; t++) {
      const socChange =
        (P_charge[t] * η_charge - P_discharge[t] / η_discharge) / this.specs.capacity
      soc.push(soc[soc.length - 1] + socChange)
    }

    // Generate timestamps
    const timestamps = this.generateTimestamps(horizon)

    return {
      timestamps,
      soc: soc.slice(0, n),
      power,
    }
  }

  /**
   * Optimize for cost minimization (peak shaving)
   */
  private async minimizeCost(
    loadForecast: Forecast,
    prices: PriceForecast,
    horizon: number,
    constraints?: BatteryConstraints
  ): Promise<BatterySchedule> {
    // Similar to revenue maximization but considers load
    // Objective: minimize total energy cost

    const n = horizon
    const load = loadForecast.predictions.slice(0, n)

    // Use dynamic programming for peak shaving
    const schedule = await this.dynamicProgramming(
      load,
      prices.prices.slice(0, n),
      'minimize_cost',
      constraints
    )

    return schedule
  }

  /**
   * Optimize for self-consumption maximization
   */
  private async maximizeSelfConsumption(
    loadForecast: Forecast,
    renewableForecast: Forecast,
    horizon: number,
    constraints?: BatteryConstraints
  ): Promise<BatterySchedule> {
    // Maximize use of renewable generation to meet load
    // Store excess solar, discharge during high load

    const n = horizon
    const load = loadForecast.predictions.slice(0, n)
    const renewable = renewableForecast.predictions.slice(0, n)

    const power: number[] = []
    const soc: number[] = [this.currentState.soc]

    const socMin = constraints?.socMin || 0.1
    const socMax = constraints?.socMax || 0.9

    for (let t = 0; t < n; t++) {
      const netLoad = load[t] - renewable[t]

      let p = 0

      if (netLoad < 0) {
        // Excess renewable, charge battery
        p = Math.min(
          -netLoad,
          this.specs.power,
          ((socMax - soc[t]) * this.specs.capacity) / this.specs.efficiency
        )
      } else {
        // Load exceeds renewable, discharge battery
        p = -Math.min(
          netLoad,
          this.specs.power,
          ((soc[t] - socMin) * this.specs.capacity) * this.specs.efficiency
        )
      }

      power.push(p)

      // Update SOC
      const socChange = (p * this.specs.efficiency) / this.specs.capacity
      soc.push(Math.max(socMin, Math.min(socMax, soc[t] + socChange)))
    }

    const timestamps = this.generateTimestamps(horizon)

    return {
      timestamps,
      soc: soc.slice(0, n),
      power,
    }
  }

  /**
   * Optimize to minimize peak demand
   */
  private async minimizePeakDemand(
    loadForecast: Forecast,
    horizon: number,
    constraints?: BatteryConstraints
  ): Promise<BatterySchedule> {
    // Minimize maximum grid import
    // Discharge during peaks, charge during valleys

    const n = horizon
    const load = loadForecast.predictions.slice(0, n)

    // Identify peak hours
    const avgLoad = load.reduce((sum: number, l: number) => sum + l, 0) / n
    const peakThreshold = avgLoad * 1.2

    const power: number[] = []
    const soc: number[] = [this.currentState.soc]

    const socMin = constraints?.socMin || 0.1
    const socMax = constraints?.socMax || 0.9

    for (let t = 0; t < n; t++) {
      let p = 0

      if (load[t] > peakThreshold && soc[t] > socMin) {
        // Peak hour, discharge
        const targetReduction = load[t] - avgLoad
        p = -Math.min(
          targetReduction,
          this.specs.power,
          ((soc[t] - socMin) * this.specs.capacity) * this.specs.efficiency
        )
      } else if (load[t] < avgLoad && soc[t] < socMax) {
        // Valley hour, charge
        p = Math.min(
          this.specs.power,
          ((socMax - soc[t]) * this.specs.capacity) / this.specs.efficiency
        )
      }

      power.push(p)

      // Update SOC
      const socChange = (p * this.specs.efficiency) / this.specs.capacity
      soc.push(Math.max(socMin, Math.min(socMax, soc[t] + socChange)))
    }

    const timestamps = this.generateTimestamps(horizon)

    return {
      timestamps,
      soc: soc.slice(0, n),
      power,
    }
  }

  /**
   * Optimize to minimize emissions
   */
  private async minimizeEmissions(
    loadForecast: Forecast,
    horizon: number,
    constraints?: BatteryConstraints
  ): Promise<BatterySchedule> {
    // Charge during low-carbon hours, discharge during high-carbon hours
    // Simplified: assume carbon intensity is correlated with load

    const n = horizon
    const load = loadForecast.predictions.slice(0, n)

    // Carbon intensity proxy (higher load = higher carbon)
    const carbonIntensity = load.map((l: number) => l / Math.max(...load))

    const schedule = await this.dynamicProgramming(
      load,
      carbonIntensity,
      'minimize_emissions',
      constraints
    )

    return schedule
  }

  /**
   * Dynamic Programming optimization
   */
  private async dynamicProgramming(
    load: number[],
    costs: number[],
    objective: string,
    constraints?: BatteryConstraints
  ): Promise<BatterySchedule> {
    const n = load.length
    const socMin = constraints?.socMin || 0.1
    const socMax = constraints?.socMax || 0.9

    // Discretize SOC space
    const socLevels = 21 // Discrete SOC levels
    const socGrid = numpy.linspace(socMin, socMax, socLevels)

    // Discretize power levels
    const powerLevels = 21
    const powerGrid = numpy.linspace(-this.specs.power, this.specs.power, powerLevels)

    // DP tables
    const value = numpy.zeros([n + 1, socLevels])
    const policy: number[][] = Array(n)
      .fill(null)
      .map(() => Array(socLevels).fill(0))

    // Backward induction
    for (let t = n - 1; t >= 0; t--) {
      for (let s = 0; s < socLevels; s++) {
        let bestValue = Infinity
        let bestAction = 0

        for (let a = 0; a < powerLevels; a++) {
          const power = powerGrid[a]
          const soc = socGrid[s]

          // Next SOC
          const socChange = (power * this.specs.efficiency) / this.specs.capacity
          const nextSOC = soc + socChange

          if (nextSOC < socMin || nextSOC > socMax) continue

          // Find nearest SOC in grid
          const nextIndex = this.findNearestIndex(socGrid, nextSOC)

          // Stage cost
          let stageCost = 0
          if (objective === 'minimize_cost') {
            stageCost = costs[t] * Math.abs(power)
          } else if (objective === 'minimize_emissions') {
            stageCost = costs[t] * power
          }

          // Total cost
          const totalCost = stageCost + value[t + 1][nextIndex]

          if (totalCost < bestValue) {
            bestValue = totalCost
            bestAction = a
          }
        }

        value[t][s] = bestValue
        policy[t][s] = bestAction
      }
    }

    // Forward simulation
    const soc: number[] = [this.currentState.soc]
    const power: number[] = []

    let currentSOCIndex = this.findNearestIndex(socGrid, this.currentState.soc)

    for (let t = 0; t < n; t++) {
      const action = policy[t][currentSOCIndex]
      const p = powerGrid[action]

      power.push(p)

      const socChange = (p * this.specs.efficiency) / this.specs.capacity
      const nextSOC = soc[t] + socChange
      soc.push(Math.max(socMin, Math.min(socMax, nextSOC)))

      currentSOCIndex = this.findNearestIndex(socGrid, nextSOC)
    }

    const timestamps = this.generateTimestamps(n)

    return {
      timestamps,
      soc: soc.slice(0, n),
      power,
    }
  }

  /**
   * Find nearest index in array
   */
  private findNearestIndex(array: any, value: number): number {
    let minDist = Infinity
    let index = 0

    for (let i = 0; i < array.length; i++) {
      const dist = Math.abs(array[i] - value)
      if (dist < minDist) {
        minDist = dist
        index = i
      }
    }

    return index
  }

  /**
   * Simulate battery degradation
   */
  async simulateDegradation(schedule: BatterySchedule): Promise<number> {
    // Count cycles using rainflow counting
    const cycles = this.rainflowCounting(schedule.soc)

    // Calendar aging
    const calendarAging = 0.02 // 2% per year

    // Cycle aging
    const cycleAging = cycles * (1.0 / this.specs.cycleLife)

    // Total degradation
    const totalDegradation = calendarAging + cycleAging

    return totalDegradation
  }

  /**
   * Rainflow counting for cycle counting
   */
  private rainflowCounting(soc: number[]): number {
    // Simplified cycle counting
    // In production, use full rainflow algorithm

    let cycles = 0
    let lastPeak = soc[0]
    let lastValley = soc[0]
    let direction = 0 // 1 = up, -1 = down

    for (let i = 1; i < soc.length; i++) {
      if (soc[i] > lastPeak) {
        if (direction === -1) {
          // Valley to peak
          const depth = (lastPeak - lastValley) / (1.0 - 0.0)
          cycles += depth
        }
        lastPeak = soc[i]
        direction = 1
      } else if (soc[i] < lastValley) {
        if (direction === 1) {
          // Peak to valley
          const depth = (lastPeak - lastValley) / (1.0 - 0.0)
          cycles += depth
        }
        lastValley = soc[i]
        direction = -1
      }
    }

    return cycles
  }

  /**
   * Calculate revenue from schedule
   */
  calculateRevenue(schedule: BatterySchedule, prices: PriceForecast): number {
    let revenue = 0

    for (let t = 0; t < schedule.power.length; t++) {
      const power = schedule.power[t]
      const price = prices.prices[t]

      if (power < 0) {
        // Discharge = revenue
        revenue += -power * price
      } else {
        // Charge = cost
        revenue -= power * price
      }
    }

    return revenue
  }

  /**
   * Calculate degradation cost
   */
  calculateDegradationCost(schedule: BatterySchedule): number {
    const cycles = this.rainflowCounting(schedule.soc)

    // Battery replacement cost
    const batteryCost = 300 // $/kWh
    const totalCost = batteryCost * this.specs.capacity

    // Cost per cycle
    const costPerCycle = totalCost / this.specs.cycleLife

    return cycles * costPerCycle
  }

  /**
   * Update battery state
   */
  updateState(newState: Partial<BatteryState>): void {
    this.currentState = { ...this.currentState, ...newState }
  }

  /**
   * Get current battery state
   */
  getState(): BatteryState {
    return { ...this.currentState }
  }

  /**
   * Compute state of health
   */
  computeStateOfHealth(): number {
    // Simple linear degradation model
    const cycleHealth = 1.0 - this.currentState.cycles / this.specs.cycleLife
    const calendarHealth = 0.98 // Assume some calendar aging

    return Math.min(cycleHealth, calendarHealth)
  }

  /**
   * Generate future timestamps
   */
  private generateTimestamps(hours: number): Date[] {
    const timestamps: Date[] = []
    const now = new Date()

    for (let h = 1; h <= hours; h++) {
      timestamps.push(new Date(now.getTime() + h * 3600000))
    }

    return timestamps
  }

  /**
   * Estimate payback period
   */
  async estimatePayback(
    averageRevenue: number,
    capitalCost: number,
    operatingCost: number
  ): Promise<number> {
    const annualRevenue = averageRevenue * 365
    const annualProfit = annualRevenue - operatingCost

    if (annualProfit <= 0) {
      return Infinity
    }

    return capitalCost / annualProfit
  }

  /**
   * Perform sensitivity analysis
   */
  async sensitivityAnalysis(baseParams: BatteryOptimizationParams): Promise<any> {
    const results: any = {
      priceVariation: [],
      capacityVariation: [],
      efficiencyVariation: [],
    }

    // Price sensitivity
    for (const factor of [0.5, 0.75, 1.0, 1.25, 1.5]) {
      const params = { ...baseParams }
      params.prices = {
        ...params.prices,
        prices: params.prices.prices.map((p: number) => p * factor),
      }

      const schedule = await this.optimize(params)
      results.priceVariation.push({
        factor,
        revenue: schedule.revenue,
        netRevenue: schedule.netRevenue,
      })
    }

    // Capacity sensitivity
    const originalCapacity = this.specs.capacity
    for (const factor of [0.5, 0.75, 1.0, 1.25, 1.5]) {
      this.specs.capacity = originalCapacity * factor
      const schedule = await this.optimize(baseParams)
      results.capacityVariation.push({
        factor,
        revenue: schedule.revenue,
        netRevenue: schedule.netRevenue,
      })
    }
    this.specs.capacity = originalCapacity

    // Efficiency sensitivity
    const originalEfficiency = this.specs.efficiency
    for (const factor of [0.85, 0.90, 0.95, 1.0]) {
      this.specs.efficiency = originalEfficiency * factor
      const schedule = await this.optimize(baseParams)
      results.efficiencyVariation.push({
        factor,
        revenue: schedule.revenue,
        netRevenue: schedule.netRevenue,
      })
    }
    this.specs.efficiency = originalEfficiency

    return results
  }

  /**
   * Get optimization summary
   */
  getSummary(): any {
    return {
      specs: this.specs,
      currentState: this.currentState,
      optimizationRuns: this.optimizationHistory.length,
      totalRevenue: this.optimizationHistory.reduce((sum, s) => sum + (s.revenue || 0), 0),
      averageSOC:
        this.optimizationHistory.reduce(
          (sum, s) => sum + s.soc.reduce((a, b) => a + b, 0) / s.soc.length,
          0
        ) / this.optimizationHistory.length,
    }
  }
}
