/**
 * Vehicle Controller Module
 *
 * Implements multiple control strategies:
 * - Pure Pursuit
 * - Stanley Controller
 * - Model Predictive Control (MPC)
 * - PID Control
 */

// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import scipy from 'python:scipy'

import type {
  VehicleState,
  Trajectory,
  ControlInput,
  ControllerOutput,
  ControllerConfig,
  ControllerType,
  TrackingError,
  VehicleParameters
} from '../types'

export class VehicleController {
  private config: ControllerConfig
  private vehicleParams: VehicleParameters
  private previousError: number = 0
  private integralError: number = 0

  constructor(config: ControllerConfig, vehicleParams?: VehicleParameters) {
    this.config = config
    this.vehicleParams = vehicleParams || this.getDefaultVehicleParams()
  }

  /**
   * Compute control output
   */
  async compute(
    state: VehicleState,
    trajectory: Trajectory,
    targetSpeed?: number
  ): Promise<ControllerOutput> {
    let control: ControlInput

    switch (this.config.type) {
      case ControllerType.PURE_PURSUIT:
        control = await this.purePursuit(state, trajectory, targetSpeed)
        break

      case ControllerType.STANLEY:
        control = await this.stanley(state, trajectory, targetSpeed)
        break

      case ControllerType.MPC:
        control = await this.mpc(state, trajectory, targetSpeed)
        break

      case ControllerType.PID:
        control = await this.pid(state, trajectory, targetSpeed)
        break

      case ControllerType.LQR:
        control = await this.lqr(state, trajectory, targetSpeed)
        break

      default:
        throw new Error(`Unknown controller type: ${this.config.type}`)
    }

    // Compute tracking error
    const trackingError = this.computeTrackingError(state, trajectory)

    return {
      control,
      trackingError,
      timestamp: Date.now()
    }
  }

  /**
   * Pure Pursuit controller
   */
  private async purePursuit(
    state: VehicleState,
    trajectory: Trajectory,
    targetSpeed?: number
  ): Promise<ControlInput> {
    const lookahead = this.config.lookahead || 10.0

    // Find lookahead point
    const lookaheadPoint = this.findLookaheadPoint(state, trajectory, lookahead)

    if (!lookaheadPoint) {
      return this.createStopControl()
    }

    // Calculate steering angle
    const dx = lookaheadPoint.position.x - state.x
    const dy = lookaheadPoint.position.y - state.y

    // Transform to vehicle frame
    const alpha = Math.atan2(dy, dx) - state.yaw

    // Pure pursuit formula
    const steering = Math.atan2(2.0 * this.vehicleParams.wheelbase * Math.sin(alpha), lookahead)

    // Speed control
    const speed = targetSpeed || lookaheadPoint.velocity || 15.0
    const { throttle, brake } = this.speedControl(state.speed, speed)

    return {
      steering: this.clampSteering(steering),
      throttle,
      brake,
      gear: 'D',
      timestamp: Date.now()
    }
  }

  /**
   * Stanley controller
   */
  private async stanley(
    state: VehicleState,
    trajectory: Trajectory,
    targetSpeed?: number
  ): Promise<ControlInput> {
    // Find nearest point on trajectory
    const nearestPoint = this.findNearestPoint(state, trajectory)

    if (!nearestPoint) {
      return this.createStopControl()
    }

    // Heading error
    const headingError = this.normalizeAngle(nearestPoint.heading - state.yaw)

    // Cross-track error
    const crossTrackError = this.computeCrossTrackError(state, nearestPoint)

    // Stanley gain
    const k = 2.5

    // Stanley formula
    const steering = headingError + Math.atan2(k * crossTrackError, state.speed + 0.1)

    // Speed control
    const speed = targetSpeed || nearestPoint.velocity || 15.0
    const { throttle, brake } = this.speedControl(state.speed, speed)

    return {
      steering: this.clampSteering(steering),
      throttle,
      brake,
      gear: 'D',
      timestamp: Date.now()
    }
  }

  /**
   * Model Predictive Control (MPC)
   */
  private async mpc(
    state: VehicleState,
    trajectory: Trajectory,
    targetSpeed?: number
  ): Promise<ControlInput> {
    const horizon = this.config.horizon || 20
    const dt = this.config.dt || 0.1

    // Extract reference trajectory
    const reference = this.extractReferenceTrajectory(state, trajectory, horizon, dt)

    // Define optimization problem
    const x0 = [state.x, state.y, state.yaw, state.speed]

    // Cost matrices
    const Q = this.config.Q || [
      [10, 0, 0, 0],
      [0, 10, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ]

    const R = this.config.R || [
      [1, 0],
      [0, 1]
    ]

    // Solve MPC problem
    const solution = await this.solveMPC(x0, reference, Q, R, horizon, dt)

    // Extract first control input
    const steering = solution.u[0]
    const acceleration = solution.u[1]

    // Convert acceleration to throttle/brake
    const { throttle, brake } = this.accelerationToControl(acceleration)

    return {
      steering: this.clampSteering(steering),
      throttle,
      brake,
      gear: 'D',
      timestamp: Date.now()
    }
  }

  /**
   * PID controller
   */
  private async pid(
    state: VehicleState,
    trajectory: Trajectory,
    targetSpeed?: number
  ): Promise<ControlInput> {
    // Find nearest point
    const nearestPoint = this.findNearestPoint(state, trajectory)

    if (!nearestPoint) {
      return this.createStopControl()
    }

    // Cross-track error
    const error = this.computeCrossTrackError(state, nearestPoint)

    // PID gains
    const kp = this.config.kp || 1.0
    const ki = this.config.ki || 0.1
    const kd = this.config.kd || 0.5

    // Update integral
    this.integralError += error * (this.config.dt || 0.1)

    // Compute derivative
    const derivative = (error - this.previousError) / (this.config.dt || 0.1)
    this.previousError = error

    // PID formula
    const steering = kp * error + ki * this.integralError + kd * derivative

    // Speed control
    const speed = targetSpeed || nearestPoint.velocity || 15.0
    const { throttle, brake } = this.speedControl(state.speed, speed)

    return {
      steering: this.clampSteering(steering),
      throttle,
      brake,
      gear: 'D',
      timestamp: Date.now()
    }
  }

  /**
   * Linear Quadratic Regulator (LQR)
   */
  private async lqr(
    state: VehicleState,
    trajectory: Trajectory,
    targetSpeed?: number
  ): Promise<ControlInput> {
    // Linearize system around current state
    const A = this.linearizeSystemMatrix(state)
    const B = this.linearizeInputMatrix(state)

    // LQR gains
    const Q = this.config.Q || [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ]

    const R = this.config.R || [
      [1, 0],
      [0, 1]
    ]

    // Solve Riccati equation (simplified)
    const K = this.solveLQR(A, B, Q, R)

    // Find reference state
    const nearestPoint = this.findNearestPoint(state, trajectory)
    if (!nearestPoint) {
      return this.createStopControl()
    }

    const xRef = [
      nearestPoint.position.x,
      nearestPoint.position.y,
      nearestPoint.heading,
      nearestPoint.velocity || 15.0
    ]

    const x = [state.x, state.y, state.yaw, state.speed]

    // Compute error
    const error = x.map((val, i) => val - xRef[i])

    // LQR control law: u = -K * error
    const u = this.matrixVectorMultiply(K, error).map(val => -val)

    const steering = u[0]
    const acceleration = u[1]

    const { throttle, brake } = this.accelerationToControl(acceleration)

    return {
      steering: this.clampSteering(steering),
      throttle,
      brake,
      gear: 'D',
      timestamp: Date.now()
    }
  }

  /**
   * Solve MPC optimization problem
   */
  private async solveMPC(
    x0: number[],
    reference: any[],
    Q: number[][],
    R: number[][],
    horizon: number,
    dt: number
  ): Promise<{ u: number[] }> {
    // Simplified MPC solution
    // In production, use cvxpy or scipy.optimize

    // For this showcase, use simple feedforward + feedback
    const nearestRef = reference[0]

    const headingError = this.normalizeAngle(nearestRef.heading - x0[2])
    const speedError = nearestRef.velocity - x0[3]

    const steering = headingError * 1.0
    const acceleration = speedError * 0.5

    return {
      u: [steering, acceleration]
    }
  }

  /**
   * Speed control (longitudinal)
   */
  private speedControl(currentSpeed: number, targetSpeed: number): {
    throttle: number
    brake: number
  } {
    const speedError = targetSpeed - currentSpeed

    const kp = 0.5
    const acceleration = kp * speedError

    if (acceleration > 0) {
      return {
        throttle: Math.min(acceleration / 5.0, 1.0),
        brake: 0
      }
    } else {
      return {
        throttle: 0,
        brake: Math.min(-acceleration / 8.0, 1.0)
      }
    }
  }

  /**
   * Convert acceleration to throttle/brake
   */
  private accelerationToControl(acceleration: number): {
    throttle: number
    brake: number
  } {
    if (acceleration > 0) {
      return {
        throttle: Math.min(acceleration / 5.0, 1.0),
        brake: 0
      }
    } else {
      return {
        throttle: 0,
        brake: Math.min(-acceleration / 8.0, 1.0)
      }
    }
  }

  /**
   * Find lookahead point on trajectory
   */
  private findLookaheadPoint(
    state: VehicleState,
    trajectory: Trajectory,
    lookahead: number
  ): any | null {
    let minDiff = Infinity
    let lookaheadPoint = null

    for (const waypoint of trajectory.waypoints) {
      const dx = waypoint.position.x - state.x
      const dy = waypoint.position.y - state.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      const diff = Math.abs(distance - lookahead)

      if (diff < minDiff && distance >= lookahead * 0.8) {
        minDiff = diff
        lookaheadPoint = waypoint
      }
    }

    return lookaheadPoint
  }

  /**
   * Find nearest point on trajectory
   */
  private findNearestPoint(
    state: VehicleState,
    trajectory: Trajectory
  ): any | null {
    let minDistance = Infinity
    let nearestPoint = null

    for (const waypoint of trajectory.waypoints) {
      const dx = waypoint.position.x - state.x
      const dy = waypoint.position.y - state.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < minDistance) {
        minDistance = distance
        nearestPoint = waypoint
      }
    }

    return nearestPoint
  }

  /**
   * Compute cross-track error
   */
  private computeCrossTrackError(state: VehicleState, reference: any): number {
    const dx = state.x - reference.position.x
    const dy = state.y - reference.position.y

    // Project onto path normal
    const error = -dx * Math.sin(reference.heading) + dy * Math.cos(reference.heading)

    return error
  }

  /**
   * Extract reference trajectory for MPC
   */
  private extractReferenceTrajectory(
    state: VehicleState,
    trajectory: Trajectory,
    horizon: number,
    dt: number
  ): any[] {
    const reference: any[] = []

    // Find nearest point
    let startIdx = 0
    let minDistance = Infinity

    for (let i = 0; i < trajectory.waypoints.length; i++) {
      const waypoint = trajectory.waypoints[i]
      const dx = waypoint.position.x - state.x
      const dy = waypoint.position.y - state.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < minDistance) {
        minDistance = distance
        startIdx = i
      }
    }

    // Extract horizon points
    for (let i = 0; i < horizon; i++) {
      const idx = Math.min(startIdx + i, trajectory.waypoints.length - 1)
      reference.push(trajectory.waypoints[idx])
    }

    return reference
  }

  /**
   * Linearize system dynamics
   */
  private linearizeSystemMatrix(state: VehicleState): number[][] {
    const dt = this.config.dt || 0.1

    // Linearized state transition matrix
    // x_{k+1} = A*x_k + B*u_k
    const A = [
      [1, 0, -state.speed * Math.sin(state.yaw) * dt, Math.cos(state.yaw) * dt],
      [0, 1, state.speed * Math.cos(state.yaw) * dt, Math.sin(state.yaw) * dt],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ]

    return A
  }

  /**
   * Linearize input matrix
   */
  private linearizeInputMatrix(state: VehicleState): number[][] {
    const dt = this.config.dt || 0.1

    const B = [
      [0, 0],
      [0, 0],
      [state.speed / this.vehicleParams.wheelbase * dt, 0],
      [0, dt]
    ]

    return B
  }

  /**
   * Solve LQR (simplified)
   */
  private solveLQR(A: number[][], B: number[][], Q: number[][], R: number[][]): number[][] {
    // Simplified LQR gain
    // In production, solve Algebraic Riccati Equation

    const K = [
      [1.0, 0, 0.5, 0],
      [0, 0, 0, 1.0]
    ]

    return K
  }

  /**
   * Compute tracking error
   */
  private computeTrackingError(state: VehicleState, trajectory: Trajectory): TrackingError {
    const nearestPoint = this.findNearestPoint(state, trajectory)

    if (!nearestPoint) {
      return {
        lateralError: 0,
        headingError: 0,
        velocityError: 0,
        timestamp: Date.now()
      }
    }

    const lateralError = this.computeCrossTrackError(state, nearestPoint)
    const headingError = this.normalizeAngle(nearestPoint.heading - state.yaw)
    const velocityError = (nearestPoint.velocity || 15.0) - state.speed

    return {
      lateralError,
      headingError,
      velocityError,
      timestamp: Date.now()
    }
  }

  /**
   * Clamp steering angle
   */
  private clampSteering(steering: number): number {
    const maxSteering = this.vehicleParams.maxSteeringAngle || Math.PI / 6
    return Math.max(-maxSteering, Math.min(maxSteering, steering))
  }

  /**
   * Normalize angle to [-pi, pi]
   */
  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI
    while (angle < -Math.PI) angle += 2 * Math.PI
    return angle
  }

  /**
   * Create stop control
   */
  private createStopControl(): ControlInput {
    return {
      steering: 0,
      throttle: 0,
      brake: 1.0,
      gear: 'D',
      timestamp: Date.now()
    }
  }

  /**
   * Matrix-vector multiplication
   */
  private matrixVectorMultiply(A: number[][], x: number[]): number[] {
    const result: number[] = []

    for (let i = 0; i < A.length; i++) {
      let sum = 0
      for (let j = 0; j < x.length; j++) {
        sum += A[i][j] * x[j]
      }
      result.push(sum)
    }

    return result
  }

  /**
   * Get default vehicle parameters
   */
  private getDefaultVehicleParams(): VehicleParameters {
    return {
      length: 4.5,
      width: 1.8,
      height: 1.5,
      wheelbase: 2.7,
      trackWidth: 1.6,
      frontOverhang: 0.9,
      rearOverhang: 0.9,
      distanceToFrontAxle: 1.4,
      distanceToRearAxle: 1.3,
      mass: 1500,
      inertia: 2000,
      maxSpeed: 50.0,
      maxAcceleration: 3.0,
      maxDeceleration: 8.0,
      maxSteeringAngle: Math.PI / 6,
      maxSteeringRate: Math.PI / 4,
      maxLateralAcceleration: 0.4 * 9.81,
      maxThrottle: 1.0,
      maxBrake: 1.0
    }
  }

  /**
   * Reset controller state
   */
  reset(): void {
    this.previousError = 0
    this.integralError = 0
  }
}

export default VehicleController
