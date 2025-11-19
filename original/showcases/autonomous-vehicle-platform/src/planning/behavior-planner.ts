/**
 * Behavior Planning Module
 *
 * High-level decision making for autonomous driving
 * Implements finite state machine for driving behaviors
 */

import type {
  BehaviorState,
  BehaviorOutput,
  VehicleState,
  DetectedObject,
  LaneDetection,
  TrackedObject,
  TrafficLight,
  TrafficLightState,
  Vector2D
} from '../types'

export interface BehaviorContext {
  egoState: VehicleState
  objects: TrackedObject[]
  lanes: LaneDetection
  trafficLights: TrafficLight[]
  map: any
  destination: Vector2D
}

export interface BehaviorPlannerConfig {
  mode: 'fsm' | 'learning'
  safetyMargin: number
  minLaneChangeGap: number
  maxLaneChangeSpeed: number
  stopDistance: number
  yieldDistance: number
}

export class BehaviorPlanner {
  private config: BehaviorPlannerConfig
  private currentState: BehaviorState = BehaviorState.IDLE
  private previousState: BehaviorState = BehaviorState.IDLE
  private stateStartTime: number = Date.now()
  private laneChangeStartTime?: number

  constructor(config: BehaviorPlannerConfig) {
    this.config = {
      minLaneChangeGap: 30.0,
      maxLaneChangeSpeed: 25.0,
      stopDistance: 5.0,
      yieldDistance: 20.0,
      ...config
    }
  }

  /**
   * Plan driving behavior
   */
  plan(context: BehaviorContext): BehaviorOutput {
    // Evaluate situation
    const situation = this.evaluateSituation(context)

    // Determine next state
    const nextState = this.selectBehavior(context, situation)

    // Transition state
    if (nextState !== this.currentState) {
      this.previousState = this.currentState
      this.currentState = nextState
      this.stateStartTime = Date.now()
    }

    // Execute behavior
    const output = this.executeBehavior(context, situation)

    return output
  }

  /**
   * Evaluate current situation
   */
  private evaluateSituation(context: BehaviorContext): SituationAssessment {
    const assessment: SituationAssessment = {
      leadVehicle: undefined,
      leftLaneVehicles: [],
      rightLaneVehicles: [],
      trafficLight: undefined,
      pedestrians: [],
      obstacles: [],
      laneKeepError: 0,
      distanceToGoal: this.distanceToDestination(context),
      safeToChangeLaneLeft: false,
      safeToChangeLaneRight: false,
      needsLaneChange: false,
      atIntersection: false,
      emergencyStop: false
    }

    // Find lead vehicle
    assessment.leadVehicle = this.findLeadVehicle(context)

    // Find vehicles in adjacent lanes
    const { left, right } = this.findAdjacentLaneVehicles(context)
    assessment.leftLaneVehicles = left
    assessment.rightLaneVehicles = right

    // Check traffic lights
    assessment.trafficLight = this.checkTrafficLights(context)

    // Find pedestrians
    assessment.pedestrians = this.findPedestrians(context)

    // Check lane keeping
    assessment.laneKeepError = this.computeLaneKeepingError(context)

    // Check lane change feasibility
    assessment.safeToChangeLaneLeft = this.isLaneChangeSafe(context, 'left')
    assessment.safeToChangeLaneRight = this.isLaneChangeSafe(context, 'right')

    // Check if lane change is needed
    assessment.needsLaneChange = this.needsLaneChange(context, assessment)

    // Check intersection
    assessment.atIntersection = this.atIntersection(context)

    // Check emergency
    assessment.emergencyStop = this.checkEmergency(context, assessment)

    return assessment
  }

  /**
   * Select behavior based on situation
   */
  private selectBehavior(
    context: BehaviorContext,
    situation: SituationAssessment
  ): BehaviorState {
    // Emergency takes highest priority
    if (situation.emergencyStop) {
      return BehaviorState.EMERGENCY
    }

    // Check traffic light
    if (situation.trafficLight) {
      if (situation.trafficLight.state === TrafficLightState.RED) {
        return BehaviorState.STOP
      }
    }

    // Check pedestrians
    if (situation.pedestrians.length > 0) {
      const closestPedestrian = this.findClosestObject(context.egoState, situation.pedestrians)
      if (closestPedestrian && closestPedestrian.distance! < this.config.yieldDistance) {
        return BehaviorState.STOP
      }
    }

    // Check intersection
    if (situation.atIntersection) {
      return BehaviorState.INTERSECTION
    }

    // Lane change logic
    if (this.currentState === BehaviorState.LANE_CHANGE_LEFT) {
      if (this.isLaneChangeComplete(context)) {
        return BehaviorState.LANE_KEEP
      }
      return BehaviorState.LANE_CHANGE_LEFT
    }

    if (this.currentState === BehaviorState.LANE_CHANGE_RIGHT) {
      if (this.isLaneChangeComplete(context)) {
        return BehaviorState.LANE_KEEP
      }
      return BehaviorState.LANE_CHANGE_RIGHT
    }

    // Decide on lane change
    if (situation.needsLaneChange) {
      if (situation.safeToChangeLaneLeft) {
        return BehaviorState.LANE_CHANGE_LEFT
      } else if (situation.safeToChangeLaneRight) {
        return BehaviorState.LANE_CHANGE_RIGHT
      }
    }

    // Default: lane keeping
    return BehaviorState.LANE_KEEP
  }

  /**
   * Execute behavior
   */
  private executeBehavior(
    context: BehaviorContext,
    situation: SituationAssessment
  ): BehaviorOutput {
    const timestamp = Date.now()

    switch (this.currentState) {
      case BehaviorState.IDLE:
        return {
          state: BehaviorState.IDLE,
          targetSpeed: 0,
          targetLane: 0,
          reason: 'Idle',
          priority: 0,
          timestamp
        }

      case BehaviorState.LANE_KEEP:
        return this.executeLaneKeep(context, situation)

      case BehaviorState.LANE_CHANGE_LEFT:
        return this.executeLaneChange(context, 'left')

      case BehaviorState.LANE_CHANGE_RIGHT:
        return this.executeLaneChange(context, 'right')

      case BehaviorState.OVERTAKE:
        return this.executeOvertake(context, situation)

      case BehaviorState.MERGE:
        return this.executeMerge(context, situation)

      case BehaviorState.INTERSECTION:
        return this.executeIntersection(context, situation)

      case BehaviorState.STOP:
        return this.executeStop(context, situation)

      case BehaviorState.PARKING:
        return this.executeParking(context, situation)

      case BehaviorState.EMERGENCY:
        return this.executeEmergency(context, situation)

      default:
        return {
          state: this.currentState,
          targetSpeed: 0,
          targetLane: 0,
          reason: 'Unknown state',
          priority: 0,
          timestamp
        }
    }
  }

  /**
   * Execute lane keeping behavior
   */
  private executeLaneKeep(
    context: BehaviorContext,
    situation: SituationAssessment
  ): BehaviorOutput {
    let targetSpeed = 15.0  // Default speed (m/s)

    // Adaptive cruise control
    if (situation.leadVehicle) {
      const leadSpeed = situation.leadVehicle.speed || 0
      const leadDistance = situation.leadVehicle.distance || Infinity

      // Time headway: 2 seconds
      const desiredDistance = 2.0 * context.egoState.speed + this.config.safetyMargin

      if (leadDistance < desiredDistance) {
        targetSpeed = Math.max(0, leadSpeed - 2.0)
      } else {
        targetSpeed = Math.min(targetSpeed, leadSpeed)
      }
    }

    return {
      state: BehaviorState.LANE_KEEP,
      targetSpeed,
      targetLane: 0,
      reason: 'Lane keeping with cruise control',
      priority: 1,
      timestamp: Date.now()
    }
  }

  /**
   * Execute lane change behavior
   */
  private executeLaneChange(
    context: BehaviorContext,
    direction: 'left' | 'right'
  ): BehaviorOutput {
    if (!this.laneChangeStartTime) {
      this.laneChangeStartTime = Date.now()
    }

    const targetLane = direction === 'left' ? -1 : 1
    const targetSpeed = Math.min(context.egoState.speed, this.config.maxLaneChangeSpeed)

    return {
      state: direction === 'left' ? BehaviorState.LANE_CHANGE_LEFT : BehaviorState.LANE_CHANGE_RIGHT,
      targetSpeed,
      targetLane,
      reason: `Changing lane ${direction}`,
      priority: 3,
      timestamp: Date.now()
    }
  }

  /**
   * Execute overtake behavior
   */
  private executeOvertake(
    context: BehaviorContext,
    situation: SituationAssessment
  ): BehaviorOutput {
    return {
      state: BehaviorState.OVERTAKE,
      targetSpeed: 20.0,
      targetLane: -1,
      reason: 'Overtaking slow vehicle',
      priority: 3,
      timestamp: Date.now()
    }
  }

  /**
   * Execute merge behavior
   */
  private executeMerge(
    context: BehaviorContext,
    situation: SituationAssessment
  ): BehaviorOutput {
    return {
      state: BehaviorState.MERGE,
      targetSpeed: 15.0,
      targetLane: 1,
      reason: 'Merging into traffic',
      priority: 4,
      timestamp: Date.now()
    }
  }

  /**
   * Execute intersection behavior
   */
  private executeIntersection(
    context: BehaviorContext,
    situation: SituationAssessment
  ): BehaviorOutput {
    let targetSpeed = 10.0

    // Check traffic light
    if (situation.trafficLight) {
      if (situation.trafficLight.state === TrafficLightState.RED) {
        targetSpeed = 0
      } else if (situation.trafficLight.state === TrafficLightState.YELLOW) {
        targetSpeed = 5.0
      }
    }

    return {
      state: BehaviorState.INTERSECTION,
      targetSpeed,
      targetLane: 0,
      reason: 'Navigating intersection',
      priority: 5,
      timestamp: Date.now()
    }
  }

  /**
   * Execute stop behavior
   */
  private executeStop(
    context: BehaviorContext,
    situation: SituationAssessment
  ): BehaviorOutput {
    let reason = 'Stopping'

    if (situation.trafficLight?.state === TrafficLightState.RED) {
      reason = 'Stopping for red light'
    } else if (situation.pedestrians.length > 0) {
      reason = 'Stopping for pedestrian'
    }

    return {
      state: BehaviorState.STOP,
      targetSpeed: 0,
      targetLane: 0,
      reason,
      priority: 6,
      timestamp: Date.now()
    }
  }

  /**
   * Execute parking behavior
   */
  private executeParking(
    context: BehaviorContext,
    situation: SituationAssessment
  ): BehaviorOutput {
    return {
      state: BehaviorState.PARKING,
      targetSpeed: 2.0,
      targetLane: 0,
      targetPosition: context.destination,
      reason: 'Parking',
      priority: 7,
      timestamp: Date.now()
    }
  }

  /**
   * Execute emergency behavior
   */
  private executeEmergency(
    context: BehaviorContext,
    situation: SituationAssessment
  ): BehaviorOutput {
    return {
      state: BehaviorState.EMERGENCY,
      targetSpeed: 0,
      targetLane: 0,
      reason: 'Emergency stop - collision imminent',
      priority: 10,
      timestamp: Date.now()
    }
  }

  /**
   * Find lead vehicle
   */
  private findLeadVehicle(context: BehaviorContext): TrackedObject | undefined {
    const { egoState, objects } = context

    // Filter vehicles in front
    const vehiclesAhead = objects.filter(obj => {
      if (!obj.position) return false

      // Check if in front
      const dx = obj.position.x - egoState.x
      const dy = obj.position.y - egoState.y

      // Transform to vehicle frame
      const forward = dx * Math.cos(egoState.yaw) + dy * Math.sin(egoState.yaw)
      const lateral = -dx * Math.sin(egoState.yaw) + dy * Math.cos(egoState.yaw)

      // In front and in same lane
      return forward > 0 && Math.abs(lateral) < 2.0
    })

    if (vehiclesAhead.length === 0) return undefined

    // Return closest
    return vehiclesAhead.reduce((closest, obj) =>
      obj.distance! < closest.distance! ? obj : closest
    )
  }

  /**
   * Find vehicles in adjacent lanes
   */
  private findAdjacentLaneVehicles(context: BehaviorContext): {
    left: TrackedObject[]
    right: TrackedObject[]
  } {
    const left: TrackedObject[] = []
    const right: TrackedObject[] = []

    for (const obj of context.objects) {
      if (!obj.position) continue

      const dx = obj.position.x - context.egoState.x
      const dy = obj.position.y - context.egoState.y

      const lateral = -dx * Math.sin(context.egoState.yaw) + dy * Math.cos(context.egoState.yaw)

      // Left lane: 3-5m to the left
      if (lateral > 3.0 && lateral < 5.0) {
        left.push(obj)
      }
      // Right lane: 3-5m to the right
      else if (lateral < -3.0 && lateral > -5.0) {
        right.push(obj)
      }
    }

    return { left, right }
  }

  /**
   * Check traffic lights
   */
  private checkTrafficLights(context: BehaviorContext): TrafficLight | undefined {
    if (!context.trafficLights || context.trafficLights.length === 0) {
      return undefined
    }

    // Find closest traffic light in front
    const lightsAhead = context.trafficLights.filter(light => {
      const dx = light.position.x - context.egoState.x
      const dy = light.position.y - context.egoState.y

      const forward = dx * Math.cos(context.egoState.yaw) + dy * Math.sin(context.egoState.yaw)

      return forward > 0 && forward < 50.0
    })

    if (lightsAhead.length === 0) return undefined

    return lightsAhead[0]
  }

  /**
   * Find pedestrians
   */
  private findPedestrians(context: BehaviorContext): TrackedObject[] {
    return context.objects.filter(obj => obj.class === 'pedestrian')
  }

  /**
   * Compute lane keeping error
   */
  private computeLaneKeepingError(context: BehaviorContext): number {
    const { lanes } = context

    if (!lanes.left || !lanes.right) return 0

    const laneCenter = context.lanes.laneWidth / 2

    // Ego vehicle position (assume center)
    const egoLateralPosition = 0  // Simplified

    return Math.abs(egoLateralPosition - laneCenter)
  }

  /**
   * Check if lane change is safe
   */
  private isLaneChangeSafe(context: BehaviorContext, direction: 'left' | 'right'): boolean {
    const { egoState } = context
    const adjacentVehicles = direction === 'left'
      ? this.findAdjacentLaneVehicles(context).left
      : this.findAdjacentLaneVehicles(context).right

    // Check speed
    if (egoState.speed > this.config.maxLaneChangeSpeed) {
      return false
    }

    // Check gap
    for (const vehicle of adjacentVehicles) {
      if (!vehicle.distance) continue

      if (vehicle.distance < this.config.minLaneChangeGap) {
        return false
      }
    }

    return true
  }

  /**
   * Check if needs lane change
   */
  private needsLaneChange(context: BehaviorContext, situation: SituationAssessment): boolean {
    // Check if lead vehicle is too slow
    if (situation.leadVehicle) {
      const leadSpeed = situation.leadVehicle.speed || 0
      const speedDiff = context.egoState.speed - leadSpeed

      if (speedDiff > 5.0 && situation.leadVehicle.distance! < 30.0) {
        return true
      }
    }

    // Check route planning (simplified)
    const distanceToGoal = situation.distanceToGoal
    if (distanceToGoal < 100.0) {
      // Approaching destination, may need to change lanes
      return false
    }

    return false
  }

  /**
   * Check if lane change is complete
   */
  private isLaneChangeComplete(context: BehaviorContext): boolean {
    if (!this.laneChangeStartTime) return true

    const duration = Date.now() - this.laneChangeStartTime

    // Lane change should complete in ~5 seconds
    if (duration > 5000) {
      this.laneChangeStartTime = undefined
      return true
    }

    return false
  }

  /**
   * Check if at intersection
   */
  private atIntersection(context: BehaviorContext): boolean {
    // Simplified - would check map data
    return false
  }

  /**
   * Check for emergency
   */
  private checkEmergency(context: BehaviorContext, situation: SituationAssessment): boolean {
    // Check time-to-collision with lead vehicle
    if (situation.leadVehicle) {
      const relativeSpeed = context.egoState.speed - (situation.leadVehicle.speed || 0)
      const distance = situation.leadVehicle.distance || Infinity

      if (relativeSpeed > 0) {
        const ttc = distance / relativeSpeed

        if (ttc < 2.0) {  // Less than 2 seconds to collision
          return true
        }
      }
    }

    // Check pedestrians
    for (const ped of situation.pedestrians) {
      if (ped.distance! < 5.0) {
        return true
      }
    }

    return false
  }

  /**
   * Find closest object
   */
  private findClosestObject(state: VehicleState, objects: TrackedObject[]): TrackedObject | undefined {
    if (objects.length === 0) return undefined

    return objects.reduce((closest, obj) =>
      obj.distance! < closest.distance! ? obj : closest
    )
  }

  /**
   * Calculate distance to destination
   */
  private distanceToDestination(context: BehaviorContext): number {
    const dx = context.destination.x - context.egoState.x
    const dy = context.destination.y - context.egoState.y

    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Get current state
   */
  getCurrentState(): BehaviorState {
    return this.currentState
  }

  /**
   * Get state duration
   */
  getStateDuration(): number {
    return Date.now() - this.stateStartTime
  }

  /**
   * Reset planner
   */
  reset(): void {
    this.currentState = BehaviorState.IDLE
    this.previousState = BehaviorState.IDLE
    this.stateStartTime = Date.now()
    this.laneChangeStartTime = undefined
  }
}

interface SituationAssessment {
  leadVehicle?: TrackedObject
  leftLaneVehicles: TrackedObject[]
  rightLaneVehicles: TrackedObject[]
  trafficLight?: TrafficLight
  pedestrians: TrackedObject[]
  obstacles: TrackedObject[]
  laneKeepError: number
  distanceToGoal: number
  safeToChangeLaneLeft: boolean
  safeToChangeLaneRight: boolean
  needsLaneChange: boolean
  atIntersection: boolean
  emergencyStop: boolean
}

export default BehaviorPlanner
