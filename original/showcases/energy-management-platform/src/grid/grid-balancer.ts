/**
 * Grid Balancer - Real-time grid frequency and voltage control
 * Demonstrates Elide's TypeScript + Python integration for power system control
 */

// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import scipy from 'python:scipy'
// @ts-ignore
import pandas from 'python:pandas'

import type {
  GridConfig,
  GridConstraints,
  AGCParams,
  AGCSignal,
  VAROptimizationParams,
  VARSchedule,
  ControlAction,
  GridTopology,
  Bus,
  Branch,
  Generator,
  ReactivePowerSource,
} from '../types'

/**
 * GridBalancer - Real-time grid control and optimization
 *
 * Control functions:
 * - AGC (Automatic Generation Control): Frequency regulation
 * - LFC (Load Frequency Control): Area control error correction
 * - VAR Optimization: Voltage control and loss minimization
 * - Congestion Management: Line flow limits
 * - Emergency Control: Under-frequency load shedding
 *
 * Algorithms:
 * - PI/PID controllers
 * - Optimal power flow (OPF)
 * - State estimation
 * - Security-constrained dispatch
 */
export class GridBalancer {
  private config: GridConfig
  private topology?: GridTopology
  private measurements: Map<string, any> = new Map()
  private controlHistory: ControlAction[] = []
  private eventHandlers: Map<string, Function[]> = new Map()

  // PI controller state for AGC
  private agcIntegralError: number = 0
  private lastFrequencyError: number = 0

  constructor(config: GridConfig) {
    this.config = config
    this.topology = config.topology

    this.initializeControllers()
  }

  /**
   * Initialize control systems
   */
  private initializeControllers(): void {
    console.log('Initializing grid control systems...')
    console.log(`Nominal frequency: ${this.config.nominalFrequency} Hz`)
    console.log(`Voltage level: ${this.config.voltageLevel} kV`)
    console.log(`System inertia: ${this.config.inertia} seconds`)
  }

  /**
   * Compute Automatic Generation Control signal
   */
  async computeAGC(params: AGCParams): Promise<AGCSignal> {
    const { frequencyError, tieLineError, beta } = params

    // Area Control Error (ACE)
    const ace = tieLineError + beta * frequencyError

    // PI controller gains
    const Kp = 100 // Proportional gain
    const Ki = 10 // Integral gain

    // Update integral error with anti-windup
    this.agcIntegralError += ace
    this.agcIntegralError = Math.max(-1000, Math.min(1000, this.agcIntegralError))

    // Compute control signal
    const controlSignal = Kp * ace + Ki * this.agcIntegralError

    // Clip to reasonable range
    const power = Math.max(-5000, Math.min(5000, controlSignal))

    // Allocate power to generators based on participation factors
    const generators = this.allocateAGCPower(power)

    const timestamp = new Date()

    this.lastFrequencyError = frequencyError

    return {
      power,
      generators,
      timestamp,
    }
  }

  /**
   * Allocate AGC power to participating generators
   */
  private allocateAGCPower(totalPower: number): Record<string, number> {
    const generators: Record<string, number> = {}

    if (!this.topology?.generators) {
      return generators
    }

    // Allocate based on participation factors (proportional to capacity)
    const agcGenerators = this.topology.generators.filter(
      (g) => g.type === 'natural_gas' || g.type === 'hydro'
    )

    const totalCapacity = agcGenerators.reduce((sum, g) => sum + g.capacity, 0)

    for (const gen of agcGenerators) {
      const participationFactor = gen.capacity / totalCapacity
      generators[gen.id] = totalPower * participationFactor
    }

    return generators
  }

  /**
   * Optimize VAR (reactive power) dispatch for voltage control
   */
  async optimizeVAR(params: VAROptimizationParams): Promise<VARSchedule> {
    const { voltageLimits, reactivePowerSources, objective } = params

    console.log('Optimizing VAR dispatch...')
    console.log(`Objective: ${objective}`)

    if (!this.topology) {
      throw new Error('Grid topology not defined')
    }

    // Formulate as quadratic programming problem
    // minimize: losses (or maximize voltage stability)
    // subject to: voltage limits, VAR limits, power flow equations

    const n = reactivePowerSources.length

    // Build optimization problem
    let result: VARSchedule

    if (objective === 'minimize_losses') {
      result = await this.minimizeLosses(reactivePowerSources, voltageLimits)
    } else {
      result = await this.maximizeVoltageStability(reactivePowerSources, voltageLimits)
    }

    return result
  }

  /**
   * Minimize transmission losses through VAR optimization
   */
  private async minimizeLosses(
    sources: ReactivePowerSource[],
    voltageLimits: { min: number; max: number }
  ): Promise<VARSchedule> {
    const n = sources.length

    // Simplified loss model: Loss ≈ Σ(Q_i^2 / V_i^2)
    // This is a quadratic objective

    // Build quadratic cost matrix (diagonal for simplicity)
    const Q = numpy.zeros([n, n])
    for (let i = 0; i < n; i++) {
      Q[i][i] = 0.001 // Loss coefficient
    }

    // Linear cost (minimize total VAR)
    const c = numpy.ones(n) * 0.1

    // Constraints: qMin <= q <= qMax
    const bounds = sources.map((s) => [s.qMin, s.qMax])

    // Solve QP
    const result = scipy.optimize.minimize({
      fun: (x: any) => {
        const quad = 0.5 * numpy.dot(numpy.dot(x, Q), x)
        const lin = numpy.dot(c, x)
        return quad + lin
      },
      x0: numpy.zeros(n),
      bounds: bounds,
      method: 'SLSQP',
    })

    // Extract solution
    const varSchedule: Record<string, number> = {}
    for (let i = 0; i < n; i++) {
      varSchedule[sources[i].id] = result.x[i]
    }

    // Compute resulting voltages (simplified)
    const voltages = this.computeVoltages(varSchedule)

    // Estimate losses
    const losses = this.estimateLosses(varSchedule, voltages)

    return {
      sources: varSchedule,
      voltages,
      losses,
    }
  }

  /**
   * Maximize voltage stability margin
   */
  private async maximizeVoltageStability(
    sources: ReactivePowerSource[],
    voltageLimits: { min: number; max: number }
  ): Promise<VARSchedule> {
    // Simplified: maintain voltages close to 1.0 per unit
    const varSchedule: Record<string, number> = {}

    for (const source of sources) {
      // Heuristic: set VAR to midpoint for stability
      varSchedule[source.id] = (source.qMin + source.qMax) / 2
    }

    const voltages = this.computeVoltages(varSchedule)
    const losses = this.estimateLosses(varSchedule, voltages)

    return {
      sources: varSchedule,
      voltages,
      losses,
    }
  }

  /**
   * Compute bus voltages from VAR schedule
   */
  private computeVoltages(varSchedule: Record<string, number>): Record<string, number> {
    // Simplified voltage calculation
    // In production, use power flow analysis (Newton-Raphson)

    const voltages: Record<string, number> = {}

    if (!this.topology?.buses) {
      return voltages
    }

    for (const bus of this.topology.buses) {
      // Start with nominal voltage
      let v = 1.0

      // Adjust based on VAR injection at this bus
      const varInjection = Object.entries(varSchedule)
        .filter(([id]) => id.includes(bus.id))
        .reduce((sum, [, q]) => sum + q, 0)

      // Simple voltage adjustment (actual would use impedance matrix)
      v += varInjection * 0.001

      voltages[bus.id] = Math.max(0.95, Math.min(1.05, v))
    }

    return voltages
  }

  /**
   * Estimate transmission losses
   */
  private estimateLosses(
    varSchedule: Record<string, number>,
    voltages: Record<string, number>
  ): number {
    // Simplified loss calculation
    // Losses ≈ I^2 * R ≈ (P^2 + Q^2) / V^2 * R

    let totalLosses = 0

    for (const [id, q] of Object.entries(varSchedule)) {
      const v = voltages[id] || 1.0
      const loss = (q * q) / (v * v) * 0.01 // Simplified
      totalLosses += loss
    }

    return totalLosses
  }

  /**
   * Dispatch control action
   */
  async dispatch(action: ControlAction): Promise<void> {
    console.log(`Dispatching ${action.type} control action`)
    console.log(`Priority: ${action.priority}`)

    if (action.power) {
      console.log(`Power adjustment: ${action.power.toFixed(1)} MW`)
    }

    if (action.assets) {
      console.log(`Affected assets: ${action.assets.join(', ')}`)
    }

    // Send control signals
    await this.sendControlSignals(action)

    // Record in history
    this.controlHistory.push(action)

    // Emit event
    this.emit('control_dispatched', action)
  }

  /**
   * Send control signals to field devices
   */
  private async sendControlSignals(action: ControlAction): Promise<void> {
    // In production, this would communicate with RTUs/IEDs via SCADA
    // Protocols: DNP3, IEC 61850, Modbus, etc.

    console.log('Sending control signals to field devices...')

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  /**
   * Perform optimal power flow (OPF)
   */
  async optimalPowerFlow(objective: 'minimize_cost' | 'minimize_emissions'): Promise<any> {
    console.log(`Performing OPF with objective: ${objective}`)

    if (!this.topology) {
      throw new Error('Grid topology not defined')
    }

    const generators = this.topology.generators

    // Decision variables: generator outputs
    const n = generators.length

    // Objective: minimize generation cost or emissions
    const c = generators.map((g) => {
      if (objective === 'minimize_cost') {
        return g.cost?.variable || 50
      } else {
        return g.emissionRate || 0.5
      }
    })

    // Constraints
    const A_eq = [generators.map(() => 1)] // Power balance
    const b_eq = [5000] // Total load (MW)

    const bounds = generators.map((g) => [g.minOutput, g.capacity])

    // Solve LP
    const result = scipy.optimize.linprog({
      c: numpy.array(c),
      A_eq: numpy.array(A_eq),
      b_eq: numpy.array(b_eq),
      bounds: bounds,
      method: 'highs',
    })

    // Extract solution
    const dispatch: Record<string, number> = {}
    let totalCost = 0
    let totalEmissions = 0

    for (let i = 0; i < n; i++) {
      dispatch[generators[i].id] = result.x[i]
      totalCost += result.x[i] * (generators[i].cost?.variable || 50)
      totalEmissions += result.x[i] * (generators[i].emissionRate || 0.5)
    }

    return {
      dispatch,
      objective: result.fun,
      totalCost,
      totalEmissions,
      success: result.success,
    }
  }

  /**
   * Security-constrained economic dispatch
   */
  async securityConstrainedDispatch(
    totalLoad: number,
    constraints: GridConstraints
  ): Promise<any> {
    console.log('Performing security-constrained economic dispatch...')

    if (!this.topology) {
      throw new Error('Grid topology not defined')
    }

    // Include contingency constraints (N-1 security)
    // For each line outage, ensure remaining lines can carry load

    const generators = this.topology.generators
    const branches = this.topology.branches || []

    // Base case OPF
    const baseCase = await this.optimalPowerFlow('minimize_cost')

    // Check N-1 contingencies
    const contingencies = []

    for (const branch of branches) {
      // Simulate branch outage
      const viable = this.checkContingency(branch.id, baseCase.dispatch, totalLoad)

      contingencies.push({
        branch: branch.id,
        viable,
      })
    }

    const allContingenciesViable = contingencies.every((c) => c.viable)

    return {
      ...baseCase,
      securityStatus: allContingenciesViable ? 'secure' : 'insecure',
      contingencies,
    }
  }

  /**
   * Check if contingency is viable
   */
  private checkContingency(
    outBranch: string,
    dispatch: Record<string, number>,
    load: number
  ): boolean {
    // Simplified contingency check
    // In production, run full power flow with branch out

    // Check if remaining capacity can handle load
    const totalGen = Object.values(dispatch).reduce((sum, p) => sum + p, 0)

    return totalGen >= load * 1.05 // 5% margin
  }

  /**
   * State estimation using weighted least squares
   */
  async stateEstimation(measurements: any[]): Promise<any> {
    console.log('Performing state estimation...')

    // Weighted Least Squares (WLS) state estimation
    // minimize: Σ(w_i * (z_i - h_i(x))^2)
    // where z = measurements, h = measurement functions, x = state variables

    // For simplicity, assume state is bus voltages
    const nBuses = this.topology?.buses.length || 10

    // Measurement matrix H
    const nMeasurements = measurements.length
    const H = numpy.random.rand(nMeasurements, nBuses)

    // Measurements
    const z = numpy.array(measurements.map((m) => m.value))

    // Weights (inverse of variance)
    const W = numpy.diag(measurements.map((m) => 1.0 / (m.variance || 0.01)))

    // Solve: x = (H^T W H)^(-1) H^T W z
    const HtW = numpy.dot(H.T, W)
    const HtWH = numpy.dot(HtW, H)
    const HtWz = numpy.dot(HtW, z)

    const x = numpy.linalg.solve(HtWH, HtWz)

    // Residuals
    const estimated = numpy.dot(H, x)
    const residuals = z - estimated

    // Chi-square test for bad data detection
    const chiSquare = numpy.dot(residuals, numpy.dot(W, residuals))

    return {
      states: Array.from(x),
      residuals: Array.from(residuals),
      chiSquare,
      badDataDetected: chiSquare > 30, // Threshold
    }
  }

  /**
   * Under-frequency load shedding (UFLS)
   */
  async underFrequencyLoadShedding(frequency: number): Promise<any> {
    const nominalFreq = this.config.nominalFrequency
    const deviation = frequency - nominalFreq

    console.log(`Frequency: ${frequency.toFixed(3)} Hz (${deviation.toFixed(3)} Hz deviation)`)

    const steps = [
      { threshold: -0.5, load: 0.1 }, // Shed 10% at 59.5 Hz
      { threshold: -0.7, load: 0.15 }, // Shed 15% at 59.3 Hz
      { threshold: -1.0, load: 0.25 }, // Shed 25% at 59.0 Hz
    ]

    let totalShed = 0

    for (const step of steps) {
      if (deviation <= step.threshold) {
        totalShed = step.load
        break
      }
    }

    if (totalShed > 0) {
      console.log(`UFLS triggered: shedding ${(totalShed * 100).toFixed(1)}% of load`)

      await this.dispatch({
        type: 'emergency_control',
        power: -totalShed * 10000, // Assume 10 GW total
        priority: 'critical',
        timestamp: new Date(),
      })
    }

    return {
      frequency,
      deviation,
      loadShed: totalShed,
      triggered: totalShed > 0,
    }
  }

  /**
   * Congestion management
   */
  async manageCongestion(lineLimits: Record<string, number>): Promise<any> {
    console.log('Checking for transmission congestion...')

    const congested: string[] = []
    const actions: any[] = []

    // Check each line
    for (const [lineId, limit] of Object.entries(lineLimits)) {
      const flow = this.measurements.get(`flow_${lineId}`) || 0

      if (Math.abs(flow) > limit * 0.95) {
        // Line is congested
        congested.push(lineId)

        // Compute relief action
        const relief = await this.computeCongestionRelief(lineId, flow, limit)
        actions.push(relief)
      }
    }

    return {
      congestedLines: congested,
      reliefActions: actions,
    }
  }

  /**
   * Compute congestion relief action
   */
  private async computeCongestionRelief(
    lineId: string,
    flow: number,
    limit: number
  ): Promise<any> {
    const overload = Math.abs(flow) - limit
    const direction = flow > 0 ? 'forward' : 'reverse'

    // Relief strategy: redispatch generators or curtail load
    return {
      lineId,
      overload,
      direction,
      action: 'redispatch',
      magnitude: overload,
    }
  }

  /**
   * Event handling
   */
  on(event: string, callback: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(callback)
  }

  /**
   * Emit event
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || []
    for (const handler of handlers) {
      handler(data)
    }
  }

  /**
   * Update measurement
   */
  updateMeasurement(id: string, value: any): void {
    this.measurements.set(id, value)
  }

  /**
   * Get grid status
   */
  getStatus(): any {
    return {
      config: this.config,
      measurements: Object.fromEntries(this.measurements),
      controlHistory: this.controlHistory.length,
      recentControls: this.controlHistory.slice(-10),
    }
  }

  /**
   * Compute grid reliability metrics
   */
  async computeReliability(): Promise<any> {
    // SAIDI: System Average Interruption Duration Index
    // SAIFI: System Average Interruption Frequency Index
    // CAIDI: Customer Average Interruption Duration Index

    const totalCustomers = 100000
    const interruptionEvents = this.controlHistory.filter((c) => c.type === 'emergency_control')

    const saifi = interruptionEvents.length / totalCustomers
    const saidi = interruptionEvents.reduce((sum) => sum + 60, 0) / totalCustomers // 60 min per event
    const caidi = saifi > 0 ? saidi / saifi : 0

    return {
      saifi, // Interruptions per customer
      saidi, // Minutes per customer
      caidi, // Minutes per interruption
      availability: 1 - saidi / (365 * 24 * 60), // Fraction
    }
  }

  /**
   * Get grid balancer summary
   */
  getSummary(): any {
    return {
      config: this.config,
      topology: this.topology
        ? {
            buses: this.topology.buses?.length || 0,
            branches: this.topology.branches?.length || 0,
            generators: this.topology.generators?.length || 0,
          }
        : null,
      measurements: this.measurements.size,
      controlHistory: this.controlHistory.length,
      agcState: {
        integralError: this.agcIntegralError,
        lastFrequencyError: this.lastFrequencyError,
      },
    }
  }
}
