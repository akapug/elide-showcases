/**
 * Demand Response Manager - Load flexibility and curtailment optimization
 * Demonstrates Elide's TypeScript + Python integration for demand response programs
 */

// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import scipy from 'python:scipy'
// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import sklearn from 'python:sklearn'

import type {
  DemandResponseProgram,
  DROptimizationParams,
  DRSchedule,
  DREvent,
  DRResponse,
  DRAsset,
  Customer,
  AssetPerformance,
  CustomerImpact,
  Forecast,
  GridConstraints,
  EventTrigger,
} from '../types'

/**
 * DemandResponseManager - Optimize and manage demand response programs
 *
 * Programs:
 * - Direct Load Control (DLC): HVAC, water heaters, pool pumps
 * - Price-Based: Time-of-use, critical peak pricing
 * - Emergency: Load shedding for grid emergencies
 * - Ancillary Services: Frequency regulation, reserves
 *
 * Optimization:
 * - Customer comfort constraints
 * - Load recovery modeling
 * - Incentive optimization
 * - Fairness and equity
 */
export class DemandResponseManager {
  private programs: DemandResponseProgram[]
  private eventHistory: DREvent[] = []
  private responseHistory: DRResponse[] = []
  private customerModels: Map<string, any> = new Map()

  constructor(options: { programs: DemandResponseProgram[] }) {
    this.programs = options.programs

    this.initializeCustomerModels()
  }

  /**
   * Initialize customer behavior models
   */
  private initializeCustomerModels(): void {
    // Build ML models to predict customer response
    for (const program of this.programs) {
      if (program.customers) {
        for (const customer of program.customers) {
          this.customerModels.set(customer.id, {
            elasticity: customer.priceElasticity || -0.15,
            participation: customer.comfortPreferences?.participationWillingness || 0.8,
            baseline: customer.averageLoad,
          })
        }
      }
    }
  }

  /**
   * Optimize demand response schedule
   */
  async optimize(params: DROptimizationParams): Promise<DRSchedule> {
    const { loadForecast, gridConstraints, eventTrigger, programs } = params

    console.log('Optimizing demand response schedule...')
    console.log(`Event type: ${eventTrigger.type}`)

    const activePrograms = programs || this.programs

    // Determine event timing
    const eventWindow = this.determineEventWindow(loadForecast, eventTrigger)

    if (!eventWindow) {
      console.log('No DR event needed')
      return { events: [], totalReduction: 0, customerImpact: [] }
    }

    // Calculate required load reduction
    const targetReduction = this.calculateTargetReduction(
      loadForecast,
      gridConstraints,
      eventTrigger,
      eventWindow
    )

    // Optimize asset dispatch
    const assetSchedule = await this.optimizeAssetDispatch(
      activePrograms,
      targetReduction,
      eventWindow
    )

    // Create DR events
    const events = this.createEvents(assetSchedule, eventWindow, targetReduction)

    // Compute customer impacts
    const customerImpact = this.computeCustomerImpact(events, activePrograms)

    const totalReduction = events.reduce((sum, e) => sum + e.targetReduction, 0)

    return {
      events,
      totalReduction,
      customerImpact,
    }
  }

  /**
   * Determine when DR event should occur
   */
  private determineEventWindow(
    loadForecast: Forecast,
    eventTrigger: EventTrigger
  ): { start: Date; end: Date } | null {
    const load = loadForecast.predictions
    const timestamps = loadForecast.timestamps

    if (eventTrigger.type === 'price_spike') {
      // Find hours where price/load is above threshold
      const peakHours: number[] = []
      for (let i = 0; i < load.length; i++) {
        if (load[i] > eventTrigger.threshold!) {
          peakHours.push(i)
        }
      }

      if (peakHours.length === 0) return null

      const start = timestamps[peakHours[0]]
      const end = new Date(start.getTime() + (eventTrigger.duration || 4) * 3600000)

      return { start, end }
    } else if (eventTrigger.type === 'capacity_shortage') {
      // Find peak load period
      const peakIdx = load.indexOf(Math.max(...load))
      const start = timestamps[peakIdx]
      const end = new Date(start.getTime() + (eventTrigger.duration || 2) * 3600000)

      return { start, end }
    } else if (eventTrigger.type === 'scheduled') {
      // Pre-scheduled event
      const start = new Date()
      const end = new Date(start.getTime() + (eventTrigger.duration || 4) * 3600000)

      return { start, end }
    }

    return null
  }

  /**
   * Calculate target load reduction
   */
  private calculateTargetReduction(
    loadForecast: Forecast,
    gridConstraints: GridConstraints,
    eventTrigger: EventTrigger,
    eventWindow: { start: Date; end: Date }
  ): number {
    if (eventTrigger.type === 'capacity_shortage') {
      // Reduce to available capacity
      const peakLoad = Math.max(...loadForecast.predictions)
      const availableCapacity = 10000 // MW (from grid constraints)
      return Math.max(0, peakLoad - availableCapacity)
    } else if (eventTrigger.type === 'price_spike') {
      // Reduce by percentage
      const avgLoad =
        loadForecast.predictions.reduce((a: number, b: number) => a + b, 0) /
        loadForecast.predictions.length
      return avgLoad * 0.15 // 15% reduction
    }

    return 1000 // Default 1 MW
  }

  /**
   * Optimize asset dispatch for DR event
   */
  private async optimizeAssetDispatch(
    programs: DemandResponseProgram[],
    targetReduction: number,
    eventWindow: { start: Date; end: Date }
  ): Promise<Map<string, number>> {
    // Linear programming to minimize discomfort while meeting target
    // minimize: Σ(discomfort_i * reduction_i)
    // subject to: Σ(reduction_i) >= targetReduction

    const assets: DRAsset[] = []
    for (const program of programs) {
      if (program.assets) {
        assets.push(...program.assets)
      }
    }

    const n = assets.length

    if (n === 0) {
      console.warn('No DR assets available')
      return new Map()
    }

    // Objective: minimize discomfort (use capacity as proxy)
    const c = assets.map((a) => 1.0 / a.capacity) // Prefer large capacity assets

    // Constraint: sum of reductions >= target
    const A_ub = [assets.map(() => -1)]
    const b_ub = [-targetReduction]

    // Bounds: 0 <= reduction_i <= capacity_i
    const bounds = assets.map((a) => [0, a.capacity])

    // Solve
    const result = scipy.optimize.linprog({
      c: numpy.array(c),
      A_ub: numpy.array(A_ub),
      b_ub: numpy.array(b_ub),
      bounds: bounds,
      method: 'highs',
    })

    // Extract solution
    const schedule = new Map<string, number>()

    if (result.success) {
      for (let i = 0; i < n; i++) {
        const reduction = result.x[i]
        if (reduction > 0.1) {
          // Only include meaningful reductions
          schedule.set(assets[i].id, reduction)
        }
      }
    } else {
      console.warn('Asset dispatch optimization failed')
      // Fallback: proportional allocation
      for (const asset of assets) {
        const proportion = asset.capacity / assets.reduce((sum, a) => sum + a.capacity, 0)
        schedule.set(asset.id, targetReduction * proportion)
      }
    }

    return schedule
  }

  /**
   * Create DR events from optimized schedule
   */
  private createEvents(
    assetSchedule: Map<string, number>,
    eventWindow: { start: Date; end: Date },
    targetReduction: number
  ): DREvent[] {
    const events: DREvent[] = []

    // Group assets by program type
    const assetGroups = new Map<string, string[]>()

    for (const [assetId, reduction] of assetSchedule) {
      // Find asset's program
      let programType = 'general'
      for (const program of this.programs) {
        if (program.assets?.some((a) => a.id === assetId)) {
          programType = program.type
          break
        }
      }

      if (!assetGroups.has(programType)) {
        assetGroups.set(programType, [])
      }
      assetGroups.get(programType)!.push(assetId)
    }

    // Create event for each program type
    for (const [programType, assetIds] of assetGroups) {
      const eventReduction = assetIds.reduce(
        (sum, id) => sum + (assetSchedule.get(id) || 0),
        0
      )

      // Calculate compensation
      const compensation = this.calculateCompensation(programType, eventReduction, eventWindow)

      events.push({
        start: eventWindow.start,
        end: eventWindow.end,
        targetReduction: eventReduction,
        assets: assetIds,
        compensation,
      })
    }

    return events
  }

  /**
   * Calculate customer compensation
   */
  private calculateCompensation(
    programType: string,
    reduction: number,
    eventWindow: { start: Date; end: Date }
  ): number {
    const duration = (eventWindow.end.getTime() - eventWindow.start.getTime()) / 3600000 // hours

    if (programType === 'incentive_based') {
      // Pay per kW curtailed
      return reduction * duration * 0.5 // $0.50/kWh
    } else if (programType === 'direct_load_control') {
      // Fixed monthly credit
      return 10.0
    } else if (programType === 'emergency') {
      // Higher payment for emergency events
      return reduction * duration * 1.0 // $1.00/kWh
    }

    return 0
  }

  /**
   * Compute customer impacts
   */
  private computeCustomerImpact(
    events: DREvent[],
    programs: DemandResponseProgram[]
  ): CustomerImpact[] {
    const impacts: CustomerImpact[] = []

    for (const event of events) {
      for (const assetId of event.assets) {
        // Find customer owning this asset
        const customer = this.findCustomerByAsset(assetId, programs)

        if (customer) {
          const reduction = event.targetReduction / event.assets.length

          // Model discomfort based on customer preferences
          const discomfort = this.modelDiscomfort(customer, reduction, event)

          impacts.push({
            customerId: customer.id,
            reduction,
            discomfort,
            compensation: event.compensation! / event.assets.length,
          })
        }
      }
    }

    return impacts
  }

  /**
   * Find customer by asset ID
   */
  private findCustomerByAsset(assetId: string, programs: DemandResponseProgram[]): Customer | null {
    // Simplified: assume first customer in program
    for (const program of programs) {
      if (program.assets?.some((a) => a.id === assetId)) {
        return program.customers?.[0] || null
      }
    }
    return null
  }

  /**
   * Model customer discomfort from load curtailment
   */
  private modelDiscomfort(customer: Customer, reduction: number, event: DREvent): number {
    const duration = (event.end.getTime() - event.start.getTime()) / 3600000
    const reductionRatio = reduction / customer.averageLoad

    // Base discomfort from reduction
    let discomfort = reductionRatio * 0.5

    // Increase with duration
    discomfort *= 1 + duration / 24

    // Adjust for customer preferences
    const preferences = customer.comfortPreferences
    if (preferences) {
      const tolerance = preferences.deferralTolerance / 24
      discomfort *= 1 / (1 + tolerance)
    }

    return Math.min(1.0, discomfort)
  }

  /**
   * Dispatch DR event
   */
  async dispatch(schedule: DRSchedule): Promise<any> {
    console.log(`Dispatching ${schedule.events.length} DR events...`)

    const results = []

    for (const event of schedule.events) {
      console.log(
        `Event: ${event.start.toISOString()} - ${event.end.toISOString()}, ` +
          `Target: ${event.targetReduction.toFixed(1)} kW, Assets: ${event.assets.length}`
      )

      // Send control signals to assets
      for (const assetId of event.assets) {
        await this.sendControlSignal(assetId, event)
      }

      this.eventHistory.push(event)
      results.push({ event, status: 'dispatched' })
    }

    return results
  }

  /**
   * Send control signal to asset
   */
  private async sendControlSignal(assetId: string, event: DREvent): Promise<void> {
    // In production, this would send actual control signals
    // via communication protocol (e.g., OpenADR, IEEE 2030.5)
    console.log(`Sending control signal to asset ${assetId}`)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  /**
   * Monitor DR event response
   */
  async monitor(options: { interval: number; metrics: string[] }): Promise<DRResponse> {
    if (this.eventHistory.length === 0) {
      throw new Error('No active DR events to monitor')
    }

    const event = this.eventHistory[this.eventHistory.length - 1]
    const eventId = `event_${this.eventHistory.length}`

    // Simulate monitoring
    const achievedReduction = event.targetReduction * (0.85 + Math.random() * 0.15) // 85-100% compliance
    const complianceRate = achievedReduction / event.targetReduction

    // Asset-level performance
    const assetPerformance: AssetPerformance[] = []

    for (const assetId of event.assets) {
      const targetReduction = event.targetReduction / event.assets.length
      const actualReduction = targetReduction * (0.8 + Math.random() * 0.2)
      const availability = Math.random() > 0.05 ? 1.0 : 0.0 // 95% availability

      assetPerformance.push({
        assetId,
        targetReduction,
        actualReduction,
        availability,
      })
    }

    const totalIncentives = event.compensation || 0

    const response: DRResponse = {
      eventId,
      achievedReduction,
      complianceRate,
      totalIncentives,
      assetPerformance,
    }

    this.responseHistory.push(response)

    return response
  }

  /**
   * Predict customer response using ML
   */
  async predictResponse(
    customer: Customer,
    event: DREvent,
    historicalData: any[]
  ): Promise<number> {
    // Train simple prediction model
    const RandomForestRegressor = sklearn.ensemble.RandomForestRegressor

    const model = new RandomForestRegressor({
      n_estimators: 100,
      max_depth: 5,
      random_state: 42,
    })

    // Features: hour, temperature, day of week, event magnitude
    const X = historicalData.map((d) => [d.hour, d.temperature, d.dayOfWeek, d.eventMagnitude])

    // Target: actual reduction / target reduction
    const y = historicalData.map((d) => d.actualReduction / d.targetReduction)

    model.fit(numpy.array(X), numpy.array(y))

    // Predict for current event
    const eventHour = event.start.getHours()
    const eventDay = event.start.getDay()
    const eventMagnitude = event.targetReduction / customer.averageLoad

    const prediction = model.predict([[eventHour, 25, eventDay, eventMagnitude]])

    return prediction[0]
  }

  /**
   * Analyze DR program performance
   */
  async analyzePerformance(): Promise<any> {
    if (this.responseHistory.length === 0) {
      return { message: 'No DR events to analyze' }
    }

    const responses = this.responseHistory

    const avgCompliance =
      responses.reduce((sum, r) => sum + r.complianceRate, 0) / responses.length

    const totalReduction = responses.reduce((sum, r) => sum + r.achievedReduction, 0)

    const totalIncentives = responses.reduce((sum, r) => sum + r.totalIncentives, 0)

    const costPerKW = totalReduction > 0 ? totalIncentives / totalReduction : 0

    // Asset reliability
    const allAssets = responses.flatMap((r) => r.assetPerformance)
    const avgAvailability =
      allAssets.reduce((sum, a) => sum + a.availability, 0) / allAssets.length

    return {
      totalEvents: responses.length,
      averageCompliance: avgCompliance,
      totalReduction,
      totalIncentives,
      costPerKW,
      assetAvailability: avgAvailability,
    }
  }

  /**
   * Optimize incentive levels
   */
  async optimizeIncentives(
    targetParticipation: number,
    historicalData: any[]
  ): Promise<number> {
    // Model participation as function of incentive level
    // participation = f(incentive)

    const incentives = historicalData.map((d) => d.incentive)
    const participation = historicalData.map((d) => d.participation)

    // Fit polynomial regression
    const degree = 2
    const coeffs = numpy.polyfit(incentives, participation, degree)

    // Find incentive level that achieves target participation
    // Solve: f(x) = target
    const roots = numpy.roots([coeffs[0], coeffs[1], coeffs[2] - targetParticipation])

    // Return positive real root
    for (const root of roots) {
      if (root > 0 && Math.abs(root.imag || 0) < 0.001) {
        return root.real || root
      }
    }

    // Default to current average
    return incentives.reduce((sum: number, i: number) => sum + i, 0) / incentives.length
  }

  /**
   * Simulate load recovery after DR event
   */
  async simulateLoadRecovery(event: DREvent, baseLoad: number[]): Promise<number[]> {
    // Model load rebound after curtailment ends
    const duration = (event.end.getTime() - event.start.getTime()) / 3600000
    const recoveryPeriod = duration * 1.5 // Recovery takes 1.5x event duration

    const recovery: number[] = [...baseLoad]
    const eventEndIdx = Math.floor(event.end.getHours())

    for (let i = 0; i < recoveryPeriod; i++) {
      const idx = eventEndIdx + i
      if (idx >= recovery.length) break

      // Exponential recovery
      const recoveryFraction = 1 - Math.exp(-i / (recoveryPeriod / 3))
      const reboundLoad = event.targetReduction * recoveryFraction

      recovery[idx] += reboundLoad
    }

    return recovery
  }

  /**
   * Assess DR potential for customer/asset
   */
  async assessPotential(assetOrCustomer: DRAsset | Customer): Promise<any> {
    if ('capacity' in assetOrCustomer) {
      // Asset
      const asset = assetOrCustomer as DRAsset
      return {
        capacity: asset.capacity,
        flexibility: asset.flexibility,
        maxReduction: asset.capacity,
        maxDuration: asset.flexibility.curtailmentDuration,
        recoveryTime: asset.flexibility.recoveryTime,
        rampRate: asset.flexibility.rampRate,
      }
    } else {
      // Customer
      const customer = assetOrCustomer as Customer
      const elasticity = customer.priceElasticity || -0.15

      // Estimate potential reduction based on elasticity
      const potentialReduction = Math.abs(elasticity) * customer.averageLoad

      return {
        averageLoad: customer.averageLoad,
        segment: customer.segment,
        elasticity,
        potentialReduction,
        participation: customer.comfortPreferences?.participationWillingness || 0.5,
      }
    }
  }

  /**
   * Get DR program summary
   */
  getSummary(): any {
    return {
      programs: this.programs.map((p) => ({
        type: p.type,
        capacity: p.capacity,
        assets: p.assets?.length || 0,
        customers: p.customers?.length || 0,
      })),
      totalCapacity: this.programs.reduce((sum, p) => sum + p.capacity, 0),
      eventHistory: this.eventHistory.length,
      responseHistory: this.responseHistory.length,
      performance: this.responseHistory.length > 0 ? this.analyzePerformance() : null,
    }
  }
}
