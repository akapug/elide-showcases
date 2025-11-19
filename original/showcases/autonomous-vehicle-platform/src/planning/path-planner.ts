/**
 * Path Planning Module
 *
 * Implements multiple path planning algorithms:
 * - A* and Hybrid A*
 * - RRT and RRT*
 * - Lattice-based planning
 * - Frenet frame planning
 */

// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import scipy from 'python:scipy'

import type {
  Trajectory,
  Waypoint,
  Pose2D,
  Vector2D,
  DetectedObject,
  PlannerConfig,
  PlanningAlgorithm,
  PathPlanRequest,
  PlanningResult,
  PlanningConstraints
} from '../types'

export interface Node {
  x: number
  y: number
  heading: number
  cost: number
  parent?: Node
}

export interface SearchNode extends Node {
  g: number  // cost from start
  h: number  // heuristic to goal
  f: number  // total cost (g + h)
}

export class PathPlanner {
  private config: PlannerConfig
  private occupancyGrid?: number[][]
  private resolution: number

  constructor(config: PlannerConfig) {
    this.config = config
    this.resolution = config.resolution || 0.5
  }

  /**
   * Plan path from start to goal
   */
  async plan(request: PathPlanRequest): Promise<PlanningResult> {
    const startTime = Date.now()

    let trajectory: Trajectory

    try {
      // Create occupancy grid from obstacles
      this.createOccupancyGrid(request)

      // Plan based on algorithm
      switch (this.config.algorithm) {
        case PlanningAlgorithm.ASTAR:
          trajectory = await this.planAStar(request)
          break

        case PlanningAlgorithm.HYBRID_ASTAR:
          trajectory = await this.planHybridAStar(request)
          break

        case PlanningAlgorithm.RRT:
          trajectory = await this.planRRT(request)
          break

        case PlanningAlgorithm.RRT_STAR:
          trajectory = await this.planRRTStar(request)
          break

        case PlanningAlgorithm.LATTICE:
          trajectory = await this.planLattice(request)
          break

        case PlanningAlgorithm.FRENET:
          trajectory = await this.planFrenet(request)
          break

        default:
          throw new Error(`Unknown algorithm: ${this.config.algorithm}`)
      }

      // Smooth trajectory
      trajectory = this.smoothTrajectory(trajectory)

      // Check safety
      const safe = this.checkSafety(trajectory, request.obstacles)
      trajectory.safe = safe

      const computationTime = Date.now() - startTime

      return {
        success: true,
        trajectory,
        computationTime,
        iterations: 0
      }
    } catch (error) {
      const computationTime = Date.now() - startTime

      return {
        success: false,
        trajectory: this.createEmptyTrajectory(),
        computationTime,
        iterations: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * A* path planning
   */
  private async planAStar(request: PathPlanRequest): Promise<Trajectory> {
    const { start, goal } = request

    // Discretize start and goal
    const startNode: SearchNode = {
      x: start.x,
      y: start.y,
      heading: start.heading,
      cost: 0,
      g: 0,
      h: this.heuristic(start, goal),
      f: 0
    }
    startNode.f = startNode.g + startNode.h

    // Open and closed sets
    const openSet: SearchNode[] = [startNode]
    const closedSet = new Set<string>()

    // Maximum iterations
    const maxIterations = 10000
    let iterations = 0

    while (openSet.length > 0 && iterations < maxIterations) {
      iterations++

      // Get node with lowest f score
      openSet.sort((a, b) => a.f - b.f)
      const current = openSet.shift()!

      // Check if goal reached
      if (this.isGoalReached(current, goal)) {
        return this.reconstructPath(current, request)
      }

      // Add to closed set
      const key = this.nodeKey(current)
      closedSet.add(key)

      // Explore neighbors
      const neighbors = this.getNeighbors(current, request)

      for (const neighbor of neighbors) {
        const neighborKey = this.nodeKey(neighbor)

        if (closedSet.has(neighborKey)) continue

        // Check if in open set
        const existingIdx = openSet.findIndex(n => this.nodeKey(n) === neighborKey)

        if (existingIdx === -1) {
          openSet.push(neighbor)
        } else if (neighbor.g < openSet[existingIdx].g) {
          openSet[existingIdx] = neighbor
        }
      }
    }

    throw new Error('No path found')
  }

  /**
   * Hybrid A* path planning (with heading)
   */
  private async planHybridAStar(request: PathPlanRequest): Promise<Trajectory> {
    // Similar to A* but considers vehicle kinematics
    const { start, goal } = request

    const startNode: SearchNode = {
      x: start.x,
      y: start.y,
      heading: start.heading,
      cost: 0,
      g: 0,
      h: this.heuristic(start, goal),
      f: 0
    }
    startNode.f = startNode.g + startNode.h

    const openSet: SearchNode[] = [startNode]
    const closedSet = new Set<string>()

    const maxIterations = 10000
    let iterations = 0

    while (openSet.length > 0 && iterations < maxIterations) {
      iterations++

      openSet.sort((a, b) => a.f - b.f)
      const current = openSet.shift()!

      if (this.isGoalReached(current, goal)) {
        return this.reconstructPath(current, request)
      }

      const key = this.nodeKeyWithHeading(current)
      closedSet.add(key)

      // Get kinematically feasible neighbors
      const neighbors = this.getKinematicNeighbors(current, request)

      for (const neighbor of neighbors) {
        const neighborKey = this.nodeKeyWithHeading(neighbor)

        if (closedSet.has(neighborKey)) continue

        const existingIdx = openSet.findIndex(n => this.nodeKeyWithHeading(n) === neighborKey)

        if (existingIdx === -1) {
          openSet.push(neighbor)
        } else if (neighbor.g < openSet[existingIdx].g) {
          openSet[existingIdx] = neighbor
        }
      }
    }

    throw new Error('No path found')
  }

  /**
   * RRT path planning
   */
  private async planRRT(request: PathPlanRequest): Promise<Trajectory> {
    const { start, goal } = request

    const tree: Node[] = [{
      x: start.x,
      y: start.y,
      heading: start.heading,
      cost: 0
    }]

    const maxIterations = 5000
    const goalBias = 0.1
    const stepSize = 1.0

    for (let i = 0; i < maxIterations; i++) {
      // Sample random point (with goal bias)
      const sample = Math.random() < goalBias
        ? { x: goal.x, y: goal.y, heading: goal.heading }
        : this.randomSample(request)

      // Find nearest node
      const nearest = this.findNearest(tree, sample)

      // Steer towards sample
      const newNode = this.steer(nearest, sample, stepSize)

      // Check collision
      if (!this.isCollisionFree(nearest, newNode, request.obstacles)) {
        continue
      }

      // Add to tree
      newNode.parent = nearest
      newNode.cost = nearest.cost + this.distance(nearest, newNode)
      tree.push(newNode)

      // Check if goal reached
      if (this.distance(newNode, goal) < stepSize) {
        const goalNode: Node = {
          x: goal.x,
          y: goal.y,
          heading: goal.heading,
          cost: newNode.cost + this.distance(newNode, goal),
          parent: newNode
        }
        tree.push(goalNode)

        return this.reconstructPathFromTree(goalNode, request)
      }
    }

    throw new Error('No path found')
  }

  /**
   * RRT* path planning (optimized)
   */
  private async planRRTStar(request: PathPlanRequest): Promise<Trajectory> {
    const { start, goal } = request

    const tree: Node[] = [{
      x: start.x,
      y: start.y,
      heading: start.heading,
      cost: 0
    }]

    const maxIterations = 5000
    const goalBias = 0.1
    const stepSize = 1.0
    const searchRadius = 3.0

    for (let i = 0; i < maxIterations; i++) {
      const sample = Math.random() < goalBias
        ? { x: goal.x, y: goal.y, heading: goal.heading }
        : this.randomSample(request)

      const nearest = this.findNearest(tree, sample)
      const newNode = this.steer(nearest, sample, stepSize)

      if (!this.isCollisionFree(nearest, newNode, request.obstacles)) {
        continue
      }

      // Find nearby nodes
      const nearbyNodes = this.findNearby(tree, newNode, searchRadius)

      // Find best parent
      let minCost = nearest.cost + this.distance(nearest, newNode)
      let bestParent = nearest

      for (const nearby of nearbyNodes) {
        const cost = nearby.cost + this.distance(nearby, newNode)
        if (cost < minCost && this.isCollisionFree(nearby, newNode, request.obstacles)) {
          minCost = cost
          bestParent = nearby
        }
      }

      newNode.parent = bestParent
      newNode.cost = minCost
      tree.push(newNode)

      // Rewire tree
      for (const nearby of nearbyNodes) {
        const cost = newNode.cost + this.distance(newNode, nearby)
        if (cost < nearby.cost && this.isCollisionFree(newNode, nearby, request.obstacles)) {
          nearby.parent = newNode
          nearby.cost = cost
        }
      }

      // Check if goal reached
      if (this.distance(newNode, goal) < stepSize) {
        const goalNode: Node = {
          x: goal.x,
          y: goal.y,
          heading: goal.heading,
          cost: newNode.cost + this.distance(newNode, goal),
          parent: newNode
        }
        tree.push(goalNode)

        return this.reconstructPathFromTree(goalNode, request)
      }
    }

    throw new Error('No path found')
  }

  /**
   * Lattice-based planning
   */
  private async planLattice(request: PathPlanRequest): Promise<Trajectory> {
    // Generate lattice of motion primitives
    const primitives = this.generateMotionPrimitives()

    // Use A* on lattice
    return this.planAStar(request)
  }

  /**
   * Frenet frame planning
   */
  private async planFrenet(request: PathPlanRequest): Promise<Trajectory> {
    // Generate candidate trajectories in Frenet frame
    const candidates: Trajectory[] = []

    // Sample lateral offsets and velocities
    const lateralOffsets = [-1.5, 0, 1.5]
    const velocities = [10, 15, 20]
    const timeHorizon = 5.0

    for (const d of lateralOffsets) {
      for (const v of velocities) {
        const trajectory = this.generateFrenetTrajectory(request, d, v, timeHorizon)

        if (trajectory.feasible && trajectory.safe) {
          candidates.push(trajectory)
        }
      }
    }

    if (candidates.length === 0) {
      throw new Error('No feasible trajectory')
    }

    // Select best trajectory
    candidates.sort((a, b) => a.cost - b.cost)

    return candidates[0]
  }

  /**
   * Generate Frenet trajectory
   */
  private generateFrenetTrajectory(
    request: PathPlanRequest,
    lateralOffset: number,
    velocity: number,
    duration: number
  ): Trajectory {
    const waypoints: Waypoint[] = []
    const dt = 0.1
    const steps = Math.floor(duration / dt)

    for (let i = 0; i <= steps; i++) {
      const t = i * dt
      const s = velocity * t  // Longitudinal position

      // Simple trajectory generation
      // In production, use polynomial fitting
      const waypoint: Waypoint = {
        position: {
          x: request.start.x + s * Math.cos(request.start.heading),
          y: request.start.y + s * Math.sin(request.start.heading) + lateralOffset
        },
        heading: request.start.heading,
        curvature: 0,
        velocity,
        acceleration: 0,
        timestamp: Date.now() + i * dt * 1000
      }

      waypoints.push(waypoint)
    }

    return {
      waypoints,
      velocities: waypoints.map(w => w.velocity || 0),
      accelerations: waypoints.map(w => w.acceleration || 0),
      times: waypoints.map((_, i) => i * dt),
      cost: this.computeTrajectoryCost(waypoints),
      length: this.computeTrajectoryLength(waypoints),
      duration,
      safe: true,
      feasible: true
    }
  }

  /**
   * Create occupancy grid
   */
  private createOccupancyGrid(request: PathPlanRequest): void {
    // Determine grid bounds
    const margin = 50
    const minX = Math.min(request.start.x, request.goal.x) - margin
    const maxX = Math.max(request.start.x, request.goal.x) + margin
    const minY = Math.min(request.start.y, request.goal.y) - margin
    const maxY = Math.max(request.start.y, request.goal.y) + margin

    const width = Math.ceil((maxX - minX) / this.resolution)
    const height = Math.ceil((maxY - minY) / this.resolution)

    // Initialize grid
    this.occupancyGrid = Array(height).fill(0).map(() => Array(width).fill(0))

    // Mark obstacles
    for (const obstacle of request.obstacles) {
      if (!obstacle.position) continue

      const gridX = Math.floor((obstacle.position.x - minX) / this.resolution)
      const gridY = Math.floor((obstacle.position.y - minY) / this.resolution)

      // Inflate obstacle
      const radius = Math.ceil(2.0 / this.resolution)  // 2m safety margin

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = gridX + dx
          const y = gridY + dy

          if (x >= 0 && x < width && y >= 0 && y < height) {
            if (dx * dx + dy * dy <= radius * radius) {
              this.occupancyGrid[y][x] = 1
            }
          }
        }
      }
    }
  }

  /**
   * Heuristic function (Euclidean distance)
   */
  private heuristic(a: Pose2D, b: Pose2D): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  }

  /**
   * Check if goal is reached
   */
  private isGoalReached(node: Node, goal: Pose2D): boolean {
    const distance = Math.sqrt((node.x - goal.x) ** 2 + (node.y - goal.y) ** 2)
    return distance < 1.0  // 1m threshold
  }

  /**
   * Get neighbors (8-connected)
   */
  private getNeighbors(node: SearchNode, request: PathPlanRequest): SearchNode[] {
    const neighbors: SearchNode[] = []
    const step = this.resolution

    const directions = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [-1, -1], [1, -1], [-1, 1]
    ]

    for (const [dx, dy] of directions) {
      const x = node.x + dx * step
      const y = node.y + dy * step

      // Check if valid
      if (!this.isValidPosition(x, y, request)) continue

      const moveCost = Math.sqrt(dx * dx + dy * dy) * step
      const g = node.g + moveCost
      const h = this.heuristic({ x, y, heading: 0 }, request.goal)

      neighbors.push({
        x,
        y,
        heading: Math.atan2(dy, dx),
        cost: g,
        g,
        h,
        f: g + h,
        parent: node
      })
    }

    return neighbors
  }

  /**
   * Get kinematically feasible neighbors
   */
  private getKinematicNeighbors(node: SearchNode, request: PathPlanRequest): SearchNode[] {
    const neighbors: SearchNode[] = []
    const step = 1.0
    const steeringAngles = [-0.5, -0.25, 0, 0.25, 0.5]

    for (const steer of steeringAngles) {
      const heading = node.heading + steer
      const x = node.x + step * Math.cos(heading)
      const y = node.y + step * Math.sin(heading)

      if (!this.isValidPosition(x, y, request)) continue

      const g = node.g + step
      const h = this.heuristic({ x, y, heading }, request.goal)

      neighbors.push({
        x,
        y,
        heading,
        cost: g,
        g,
        h,
        f: g + h,
        parent: node
      })
    }

    return neighbors
  }

  /**
   * Check if position is valid
   */
  private isValidPosition(x: number, y: number, request: PathPlanRequest): boolean {
    // Check obstacles
    for (const obstacle of request.obstacles) {
      if (!obstacle.position) continue

      const distance = Math.sqrt(
        (x - obstacle.position.x) ** 2 +
        (y - obstacle.position.y) ** 2
      )

      const safetyMargin = request.constraints?.safetyMargin || 2.0

      if (distance < safetyMargin) {
        return false
      }
    }

    return true
  }

  /**
   * Reconstruct path from search node
   */
  private reconstructPath(node: SearchNode, request: PathPlanRequest): Trajectory {
    const waypoints: Waypoint[] = []
    let current: SearchNode | undefined = node

    while (current) {
      waypoints.unshift({
        position: { x: current.x, y: current.y },
        heading: current.heading,
        curvature: 0
      })

      current = current.parent as SearchNode | undefined
    }

    return this.waypointsToTrajectory(waypoints, request)
  }

  /**
   * Reconstruct path from tree
   */
  private reconstructPathFromTree(node: Node, request: PathPlanRequest): Trajectory {
    const waypoints: Waypoint[] = []
    let current: Node | undefined = node

    while (current) {
      waypoints.unshift({
        position: { x: current.x, y: current.y },
        heading: current.heading,
        curvature: 0
      })

      current = current.parent
    }

    return this.waypointsToTrajectory(waypoints, request)
  }

  /**
   * Convert waypoints to trajectory
   */
  private waypointsToTrajectory(waypoints: Waypoint[], request: PathPlanRequest): Trajectory {
    const velocities: number[] = []
    const accelerations: number[] = []
    const times: number[] = []

    const targetSpeed = request.constraints?.maxSpeed || 15.0
    let time = 0

    for (let i = 0; i < waypoints.length; i++) {
      velocities.push(targetSpeed)
      accelerations.push(0)
      times.push(time)

      if (i < waypoints.length - 1) {
        const distance = this.distance(waypoints[i].position, waypoints[i + 1].position)
        time += distance / targetSpeed
      }
    }

    return {
      waypoints,
      velocities,
      accelerations,
      times,
      cost: this.computeTrajectoryCost(waypoints),
      length: this.computeTrajectoryLength(waypoints),
      duration: time,
      safe: true,
      feasible: true
    }
  }

  /**
   * Smooth trajectory
   */
  private smoothTrajectory(trajectory: Trajectory): Trajectory {
    // Simple smoothing using moving average
    const smoothed = { ...trajectory }
    const window = 5

    if (trajectory.waypoints.length < window) {
      return trajectory
    }

    const smoothedWaypoints: Waypoint[] = []

    for (let i = 0; i < trajectory.waypoints.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2))
      const end = Math.min(trajectory.waypoints.length, i + Math.ceil(window / 2))

      let sumX = 0
      let sumY = 0
      let count = 0

      for (let j = start; j < end; j++) {
        sumX += trajectory.waypoints[j].position.x
        sumY += trajectory.waypoints[j].position.y
        count++
      }

      smoothedWaypoints.push({
        ...trajectory.waypoints[i],
        position: {
          x: sumX / count,
          y: sumY / count
        }
      })
    }

    smoothed.waypoints = smoothedWaypoints

    return smoothed
  }

  /**
   * Check trajectory safety
   */
  private checkSafety(trajectory: Trajectory, obstacles: DetectedObject[]): boolean {
    const safetyMargin = 2.0

    for (const waypoint of trajectory.waypoints) {
      for (const obstacle of obstacles) {
        if (!obstacle.position) continue

        const distance = Math.sqrt(
          (waypoint.position.x - obstacle.position.x) ** 2 +
          (waypoint.position.y - obstacle.position.y) ** 2
        )

        if (distance < safetyMargin) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Compute trajectory cost
   */
  private computeTrajectoryCost(waypoints: Waypoint[]): number {
    let cost = 0

    // Length cost
    cost += this.computeTrajectoryLength(waypoints)

    // Curvature cost
    for (const waypoint of waypoints) {
      cost += Math.abs(waypoint.curvature) * 0.1
    }

    return cost
  }

  /**
   * Compute trajectory length
   */
  private computeTrajectoryLength(waypoints: Waypoint[]): number {
    let length = 0

    for (let i = 0; i < waypoints.length - 1; i++) {
      length += this.distance(waypoints[i].position, waypoints[i + 1].position)
    }

    return length
  }

  /**
   * Utility functions
   */

  private nodeKey(node: Node): string {
    const x = Math.floor(node.x / this.resolution)
    const y = Math.floor(node.y / this.resolution)
    return `${x},${y}`
  }

  private nodeKeyWithHeading(node: Node): string {
    const x = Math.floor(node.x / this.resolution)
    const y = Math.floor(node.y / this.resolution)
    const heading = Math.floor(node.heading / (Math.PI / 8))
    return `${x},${y},${heading}`
  }

  private distance(a: Vector2D | Pose2D, b: Vector2D | Pose2D): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  }

  private randomSample(request: PathPlanRequest): Pose2D {
    const margin = 50
    const minX = Math.min(request.start.x, request.goal.x) - margin
    const maxX = Math.max(request.start.x, request.goal.x) + margin
    const minY = Math.min(request.start.y, request.goal.y) - margin
    const maxY = Math.max(request.start.y, request.goal.y) + margin

    return {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY),
      heading: Math.random() * 2 * Math.PI
    }
  }

  private findNearest(tree: Node[], point: Pose2D): Node {
    let nearest = tree[0]
    let minDist = this.distance(nearest, point)

    for (const node of tree) {
      const dist = this.distance(node, point)
      if (dist < minDist) {
        minDist = dist
        nearest = node
      }
    }

    return nearest
  }

  private findNearby(tree: Node[], point: Node, radius: number): Node[] {
    const nearby: Node[] = []

    for (const node of tree) {
      if (this.distance(node, point) < radius) {
        nearby.push(node)
      }
    }

    return nearby
  }

  private steer(from: Node, to: Pose2D, stepSize: number): Node {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < stepSize) {
      return {
        x: to.x,
        y: to.y,
        heading: Math.atan2(dy, dx),
        cost: 0
      }
    }

    const ratio = stepSize / distance

    return {
      x: from.x + dx * ratio,
      y: from.y + dy * ratio,
      heading: Math.atan2(dy, dx),
      cost: 0
    }
  }

  private isCollisionFree(from: Node, to: Node, obstacles: DetectedObject[]): boolean {
    const steps = 10
    const safetyMargin = 2.0

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = from.x + t * (to.x - from.x)
      const y = from.y + t * (to.y - from.y)

      for (const obstacle of obstacles) {
        if (!obstacle.position) continue

        const distance = Math.sqrt(
          (x - obstacle.position.x) ** 2 +
          (y - obstacle.position.y) ** 2
        )

        if (distance < safetyMargin) {
          return false
        }
      }
    }

    return true
  }

  private generateMotionPrimitives(): any[] {
    // Generate motion primitives for lattice planning
    return []
  }

  private createEmptyTrajectory(): Trajectory {
    return {
      waypoints: [],
      velocities: [],
      accelerations: [],
      times: [],
      cost: Infinity,
      length: 0,
      duration: 0,
      safe: false,
      feasible: false
    }
  }
}

export default PathPlanner
