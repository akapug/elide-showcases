/**
 * AV Simulator Module
 *
 * Physics-based simulation for autonomous vehicle testing
 * Supports multi-agent scenarios, sensor simulation, and weather conditions
 */

import type {
  VehicleState,
  ControlInput,
  DetectedObject,
  SimulationConfig,
  SimulationState,
  TrafficAgent,
  VehicleParameters,
  Collision,
  SensorData,
  ImageData,
  PointCloud,
  Vector2D,
  Pose2D
} from '../types'

export class Simulator {
  private config: SimulationConfig
  private state: SimulationState
  private egoVehicleParams: VehicleParameters
  private trafficAgentStates: Map<string, VehicleState> = new Map()
  private collisions: Collision[] = []
  private currentStep: number = 0

  constructor(config: SimulationConfig) {
    this.config = config
    this.egoVehicleParams = this.getDefaultVehicleParams()

    // Initialize simulation state
    this.state = {
      timestamp: Date.now(),
      step: 0,
      egoVehicle: this.initializeEgoVehicle(config.startPose),
      trafficAgents: new Map(),
      collisions: [],
      reachedGoal: false
    }

    // Initialize traffic agents
    this.initializeTrafficAgents(config.traffic)
  }

  /**
   * Initialize ego vehicle state
   */
  private initializeEgoVehicle(pose: Pose2D): VehicleState {
    return {
      x: pose.x,
      y: pose.y,
      z: 0,
      roll: 0,
      pitch: 0,
      yaw: pose.heading,
      vx: 0,
      vy: 0,
      vz: 0,
      wx: 0,
      wy: 0,
      wz: 0,
      ax: 0,
      ay: 0,
      az: 0,
      speed: 0,
      heading: pose.heading,
      steeringAngle: 0,
      steeringRate: 0,
      timestamp: Date.now()
    }
  }

  /**
   * Initialize traffic agents
   */
  private initializeTrafficAgents(agents: TrafficAgent[]): void {
    for (const agent of agents) {
      const state: VehicleState = {
        x: agent.initialPose.x,
        y: agent.initialPose.y,
        z: 0,
        roll: 0,
        pitch: 0,
        yaw: agent.initialPose.heading,
        vx: agent.initialVelocity * Math.cos(agent.initialPose.heading),
        vy: agent.initialVelocity * Math.sin(agent.initialPose.heading),
        vz: 0,
        wx: 0,
        wy: 0,
        wz: 0,
        ax: 0,
        ay: 0,
        az: 0,
        speed: agent.initialVelocity,
        heading: agent.initialPose.heading,
        steeringAngle: 0,
        steeringRate: 0,
        timestamp: Date.now()
      }

      this.trafficAgentStates.set(agent.id, state)
      this.state.trafficAgents.set(agent.id, state)
    }
  }

  /**
   * Step simulation forward
   */
  step(control: ControlInput): SimulationState {
    const dt = this.config.dt || 0.1

    // Update ego vehicle
    this.updateEgoVehicle(control, dt)

    // Update traffic agents
    this.updateTrafficAgents(dt)

    // Check collisions
    this.checkCollisions()

    // Check goal
    this.checkGoalReached()

    // Update state
    this.state.timestamp = Date.now()
    this.state.step = ++this.currentStep

    return { ...this.state }
  }

  /**
   * Update ego vehicle dynamics
   */
  private updateEgoVehicle(control: ControlInput, dt: number): void {
    const state = this.state.egoVehicle

    // Apply control limits
    const steering = this.clampSteering(control.steering)
    const throttle = Math.max(0, Math.min(1, control.throttle))
    const brake = Math.max(0, Math.min(1, control.brake))

    // Bicycle model dynamics
    const L = this.egoVehicleParams.wheelbase

    // Longitudinal dynamics
    let acceleration = 0
    if (throttle > 0) {
      acceleration = throttle * this.egoVehicleParams.maxAcceleration
    } else if (brake > 0) {
      acceleration = -brake * this.egoVehicleParams.maxDeceleration
    }

    // Update speed
    state.speed = Math.max(0, state.speed + acceleration * dt)
    state.speed = Math.min(state.speed, this.egoVehicleParams.maxSpeed)

    // Update velocities
    state.vx = state.speed * Math.cos(state.yaw)
    state.vy = state.speed * Math.sin(state.yaw)

    // Update position
    state.x += state.vx * dt
    state.y += state.vy * dt

    // Update heading
    state.yaw += (state.speed / L) * Math.tan(steering) * dt
    state.yaw = this.normalizeAngle(state.yaw)

    // Update steering
    state.steeringAngle = steering

    // Update accelerations
    state.ax = acceleration * Math.cos(state.yaw)
    state.ay = acceleration * Math.sin(state.yaw)

    state.timestamp = Date.now()
  }

  /**
   * Update traffic agents
   */
  private updateTrafficAgents(dt: number): void {
    for (const [id, state] of this.trafficAgentStates) {
      const agent = this.config.traffic.find(a => a.id === id)
      if (!agent) continue

      switch (agent.behavior) {
        case 'static':
          // Do nothing
          break

        case 'constant_velocity':
          state.x += state.vx * dt
          state.y += state.vy * dt
          break

        case 'follow_lane':
          // Simple lane following
          if (agent.route && agent.route.length > 0) {
            const target = this.findClosestRoutePoint(state, agent.route)
            const heading = Math.atan2(target.y - state.y, target.x - state.x)

            state.yaw = heading
            state.vx = state.speed * Math.cos(heading)
            state.vy = state.speed * Math.sin(heading)
            state.x += state.vx * dt
            state.y += state.vy * dt
          }
          break

        case 'aggressive':
          // Higher speed and more lane changes
          state.speed = Math.min(state.speed * 1.1, 30.0)
          state.x += state.vx * dt
          state.y += state.vy * dt
          break

        case 'defensive':
          // Lower speed and cautious
          state.speed = Math.min(state.speed, 12.0)
          state.x += state.vx * dt
          state.y += state.vy * dt
          break
      }

      state.timestamp = Date.now()
      this.state.trafficAgents.set(id, state)
    }
  }

  /**
   * Check for collisions
   */
  private checkCollisions(): void {
    const egoState = this.state.egoVehicle
    const safetyRadius = 2.5  // meters

    // Check collision with traffic agents
    for (const [id, agentState] of this.trafficAgentStates) {
      const dx = egoState.x - agentState.x
      const dy = egoState.y - agentState.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < safetyRadius) {
        const collision: Collision = {
          timestamp: Date.now(),
          egoVehicle: true,
          objectId: id,
          position: { x: egoState.x, y: egoState.y },
          severity: distance < 1.0 ? 'critical' : distance < 2.0 ? 'major' : 'minor'
        }

        this.collisions.push(collision)
        this.state.collisions.push(collision)
      }
    }
  }

  /**
   * Check if goal is reached
   */
  private checkGoalReached(): void {
    const egoState = this.state.egoVehicle
    const goal = this.config.goalPose

    const dx = egoState.x - goal.x
    const dy = egoState.y - goal.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < 2.0) {  // 2m threshold
      this.state.reachedGoal = true
    }
  }

  /**
   * Get sensor data
   */
  getSensorData(): any {
    return {
      camera: this.simulateCamera(),
      lidar: this.simulateLidar(),
      radar: this.simulateRadar(),
      gps: this.simulateGPS(),
      imu: this.simulateIMU()
    }
  }

  /**
   * Simulate camera sensor
   */
  private simulateCamera(): ImageData[] {
    // Simulate camera images (simplified)
    const cameras: ImageData[] = []

    const egoState = this.state.egoVehicle

    // Front camera
    cameras.push({
      type: 'camera' as any,
      timestamp: Date.now(),
      frameId: 'camera_front',
      width: 1920,
      height: 1080,
      channels: 3,
      data: new Uint8Array(1920 * 1080 * 3),  // Empty for showcase
      encoding: 'rgb',
      cameraId: 'front'
    })

    return cameras
  }

  /**
   * Simulate LiDAR sensor
   */
  private simulateLidar(): PointCloud {
    const points: any[] = []

    // Generate point cloud from traffic agents
    for (const [id, agentState] of this.trafficAgentStates) {
      const dx = agentState.x - this.state.egoVehicle.x
      const dy = agentState.y - this.state.egoVehicle.y
      const dz = 0

      // Transform to ego frame
      const x = dx * Math.cos(-this.state.egoVehicle.yaw) - dy * Math.sin(-this.state.egoVehicle.yaw)
      const y = dx * Math.sin(-this.state.egoVehicle.yaw) + dy * Math.cos(-this.state.egoVehicle.yaw)

      // Add points around object
      for (let i = 0; i < 10; i++) {
        points.push({
          x: x + (Math.random() - 0.5) * 2,
          y: y + (Math.random() - 0.5) * 2,
          z: Math.random() * 2,
          intensity: Math.random()
        })
      }
    }

    return {
      type: 'lidar' as any,
      timestamp: Date.now(),
      frameId: 'lidar',
      points
    }
  }

  /**
   * Simulate radar sensor
   */
  private simulateRadar(): any {
    const targets: any[] = []

    for (const [id, agentState] of this.trafficAgentStates) {
      const dx = agentState.x - this.state.egoVehicle.x
      const dy = agentState.y - this.state.egoVehicle.y

      const range = Math.sqrt(dx * dx + dy * dy)
      const azimuth = Math.atan2(dy, dx) - this.state.egoVehicle.yaw

      // Relative velocity
      const relVx = agentState.vx - this.state.egoVehicle.vx
      const relVy = agentState.vy - this.state.egoVehicle.vy
      const rangeRate = (relVx * dx + relVy * dy) / range

      targets.push({
        range,
        azimuth,
        elevation: 0,
        rangeRate,
        rcs: 10.0,
        snr: 20.0
      })
    }

    return {
      type: 'radar',
      timestamp: Date.now(),
      frameId: 'radar',
      targets,
      radarId: 'front'
    }
  }

  /**
   * Simulate GPS sensor
   */
  private simulateGPS(): any {
    const state = this.state.egoVehicle

    // Convert to lat/lon (simplified)
    const lat = 37.7749 + state.y / 111000
    const lon = -122.4194 + state.x / (111000 * Math.cos(37.7749 * Math.PI / 180))

    return {
      type: 'gps',
      timestamp: Date.now(),
      frameId: 'gps',
      latitude: lat,
      longitude: lon,
      altitude: 0,
      heading: state.yaw * 180 / Math.PI,
      speed: state.speed,
      accuracy: 0.5,
      numSatellites: 12
    }
  }

  /**
   * Simulate IMU sensor
   */
  private simulateIMU(): any {
    const state = this.state.egoVehicle

    return {
      type: 'imu',
      timestamp: Date.now(),
      frameId: 'imu',
      linearAcceleration: {
        x: state.ax,
        y: state.ay,
        z: 0
      },
      angularVelocity: {
        x: 0,
        y: 0,
        z: state.wz
      },
      orientation: {
        w: Math.cos(state.yaw / 2),
        x: 0,
        y: 0,
        z: Math.sin(state.yaw / 2)
      }
    }
  }

  /**
   * Apply control to vehicle
   */
  applyControl(control: ControlInput): SimulationState {
    return this.step(control)
  }

  /**
   * Get ego vehicle state
   */
  getEgoState(): VehicleState {
    return { ...this.state.egoVehicle }
  }

  /**
   * Get traffic agent states
   */
  getTrafficStates(): Map<string, VehicleState> {
    return new Map(this.state.trafficAgents)
  }

  /**
   * Get all objects as detections
   */
  getDetectedObjects(): DetectedObject[] {
    const objects: DetectedObject[] = []

    let id = 0
    for (const [agentId, agentState] of this.trafficAgentStates) {
      const dx = agentState.x - this.state.egoVehicle.x
      const dy = agentState.y - this.state.egoVehicle.y

      // Transform to ego frame
      const x = dx * Math.cos(-this.state.egoVehicle.yaw) - dy * Math.sin(-this.state.egoVehicle.yaw)
      const y = dx * Math.sin(-this.state.egoVehicle.yaw) + dy * Math.cos(-this.state.egoVehicle.yaw)

      const distance = Math.sqrt(x * x + y * y)

      objects.push({
        id: id++,
        class: 'car' as any,
        confidence: 0.95,
        bbox: {
          x: x * 100,  // Convert to pixels (simplified)
          y: y * 100,
          width: 50,
          height: 30
        },
        position: { x, y, z: 0 },
        velocity: {
          x: agentState.vx - this.state.egoVehicle.vx,
          y: agentState.vy - this.state.egoVehicle.vy,
          z: 0
        },
        distance,
        speed: agentState.speed,
        timestamp: Date.now()
      })
    }

    return objects
  }

  /**
   * Check if simulation is complete
   */
  isComplete(): boolean {
    return (
      this.state.reachedGoal ||
      this.state.collisions.length > 0 ||
      this.currentStep >= this.config.maxSteps
    )
  }

  /**
   * Get simulation statistics
   */
  getStatistics(): any {
    return {
      steps: this.currentStep,
      time: this.currentStep * (this.config.dt || 0.1),
      distance: this.computeDistanceTraveled(),
      averageSpeed: this.computeAverageSpeed(),
      collisions: this.collisions.length,
      reachedGoal: this.state.reachedGoal
    }
  }

  /**
   * Compute distance traveled
   */
  private computeDistanceTraveled(): number {
    const dx = this.state.egoVehicle.x - this.config.startPose.x
    const dy = this.state.egoVehicle.y - this.config.startPose.y

    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Compute average speed
   */
  private computeAverageSpeed(): number {
    const distance = this.computeDistanceTraveled()
    const time = this.currentStep * (this.config.dt || 0.1)

    return time > 0 ? distance / time : 0
  }

  /**
   * Reset simulation
   */
  reset(): void {
    this.currentStep = 0
    this.collisions = []

    this.state = {
      timestamp: Date.now(),
      step: 0,
      egoVehicle: this.initializeEgoVehicle(this.config.startPose),
      trafficAgents: new Map(),
      collisions: [],
      reachedGoal: false
    }

    this.trafficAgentStates.clear()
    this.initializeTrafficAgents(this.config.traffic)
  }

  /**
   * Utility functions
   */

  private clampSteering(steering: number): number {
    const maxSteering = this.egoVehicleParams.maxSteeringAngle || Math.PI / 6
    return Math.max(-maxSteering, Math.min(maxSteering, steering))
  }

  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) angle -= 2 * Math.PI
    while (angle < -Math.PI) angle += 2 * Math.PI
    return angle
  }

  private findClosestRoutePoint(state: VehicleState, route: Vector2D[]): Vector2D {
    let closest = route[0]
    let minDist = Infinity

    for (const point of route) {
      const dx = point.x - state.x
      const dy = point.y - state.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < minDist) {
        minDist = dist
        closest = point
      }
    }

    return closest
  }

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
}

export default Simulator
