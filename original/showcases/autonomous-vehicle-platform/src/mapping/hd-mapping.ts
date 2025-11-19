/**
 * HD Mapping Module
 *
 * High-definition road map with lane-level precision
 * Provides map matching and localization
 */

import type {
  HDMap,
  MapLane,
  MapJunction,
  MapRoadMarking,
  MapTrafficSign,
  MapTrafficLight,
  LocalizationResult,
  Vector2D,
  VehicleState
} from '../types'

export class HDMapLoader {
  private map?: HDMap

  /**
   * Load HD map from file
   */
  async load(path: string): Promise<HDMap> {
    // In production, load from file
    // For showcase, create sample map
    this.map = this.createSampleMap()
    return this.map
  }

  /**
   * Get map
   */
  getMap(): HDMap | undefined {
    return this.map
  }

  /**
   * Create sample HD map
   */
  private createSampleMap(): HDMap {
    const lanes = new Map<string, MapLane>()
    const junctions = new Map<string, MapJunction>()
    const roadMarkings = new Map<string, MapRoadMarking>()
    const trafficSigns = new Map<string, MapTrafficSign>()
    const trafficLights = new Map<string, MapTrafficLight>()

    // Create main lane
    const lane1: MapLane = {
      id: 'lane_1',
      type: 'driving',
      centerline: this.generateLaneCenterline(0, 0, 100, 0),
      leftBoundary: this.generateLaneCenterline(0, 1.85, 100, 1.85),
      rightBoundary: this.generateLaneCenterline(0, -1.85, 100, -1.85),
      width: 3.7,
      speedLimit: 50 / 3.6,  // 50 km/h in m/s
      direction: 'forward',
      predecessors: [],
      successors: ['lane_2'],
      rightNeighbor: 'lane_3'
    }

    const lane2: MapLane = {
      id: 'lane_2',
      type: 'driving',
      centerline: this.generateLaneCenterline(100, 0, 200, 0),
      leftBoundary: this.generateLaneCenterline(100, 1.85, 200, 1.85),
      rightBoundary: this.generateLaneCenterline(100, -1.85, 200, -1.85),
      width: 3.7,
      speedLimit: 50 / 3.6,
      direction: 'forward',
      predecessors: ['lane_1'],
      successors: [],
      rightNeighbor: 'lane_4'
    }

    // Right lane
    const lane3: MapLane = {
      id: 'lane_3',
      type: 'driving',
      centerline: this.generateLaneCenterline(0, -3.7, 100, -3.7),
      leftBoundary: this.generateLaneCenterline(0, -1.85, 100, -1.85),
      rightBoundary: this.generateLaneCenterline(0, -5.55, 100, -5.55),
      width: 3.7,
      speedLimit: 50 / 3.6,
      direction: 'forward',
      predecessors: [],
      successors: ['lane_4'],
      leftNeighbor: 'lane_1'
    }

    const lane4: MapLane = {
      id: 'lane_4',
      type: 'driving',
      centerline: this.generateLaneCenterline(100, -3.7, 200, -3.7),
      leftBoundary: this.generateLaneCenterline(100, -1.85, 200, -1.85),
      rightBoundary: this.generateLaneCenterline(100, -5.55, 200, -5.55),
      width: 3.7,
      speedLimit: 50 / 3.6,
      direction: 'forward',
      predecessors: ['lane_3'],
      successors: [],
      leftNeighbor: 'lane_2'
    }

    lanes.set('lane_1', lane1)
    lanes.set('lane_2', lane2)
    lanes.set('lane_3', lane3)
    lanes.set('lane_4', lane4)

    // Create junction
    const junction1: MapJunction = {
      id: 'junction_1',
      type: 'intersection',
      polygon: [
        { x: 95, y: 10 },
        { x: 105, y: 10 },
        { x: 105, y: -10 },
        { x: 95, y: -10 }
      ],
      incomingLanes: ['lane_1', 'lane_3'],
      outgoingLanes: ['lane_2', 'lane_4'],
      trafficControl: 'signal'
    }

    junctions.set('junction_1', junction1)

    // Add traffic light
    const trafficLight1: MapTrafficLight = {
      id: 'tl_1',
      position: { x: 95, y: 5 },
      heading: 0,
      affectedLanes: ['lane_1']
    }

    trafficLights.set('tl_1', trafficLight1)

    // Add traffic sign
    const sign1: MapTrafficSign = {
      id: 'sign_1',
      type: 'speed_limit_50',
      position: { x: 50, y: 5 },
      heading: 0,
      affectedLanes: ['lane_1', 'lane_3']
    }

    trafficSigns.set('sign_1', sign1)

    return {
      id: 'map_1',
      version: '1.0',
      lanes,
      junctions,
      roadMarkings,
      trafficSigns,
      trafficLights,
      bounds: {
        minX: 0,
        maxX: 200,
        minY: -10,
        maxY: 10
      }
    }
  }

  /**
   * Generate lane centerline
   */
  private generateLaneCenterline(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): Vector2D[] {
    const points: Vector2D[] = []
    const steps = 50

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      points.push({
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      })
    }

    return points
  }
}

export class Localizer {
  private map?: HDMap

  constructor(map: HDMap) {
    this.map = map
  }

  /**
   * Localize vehicle on map
   */
  localize(state: VehicleState): LocalizationResult {
    if (!this.map) {
      throw new Error('Map not loaded')
    }

    // Find nearest lane
    const { lane, distance } = this.findNearestLane(state)

    if (!lane) {
      return {
        position: { x: state.x, y: state.y },
        heading: state.yaw,
        confidence: 0,
        uncertainty: [[1, 0], [0, 1]],
        timestamp: Date.now()
      }
    }

    // Match to lane centerline
    const matchedPosition = this.matchToLane(state, lane)

    return {
      position: matchedPosition,
      heading: state.yaw,
      laneId: lane.id,
      confidence: Math.max(0, 1 - distance / 5.0),
      uncertainty: [[0.1, 0], [0, 0.1]],
      timestamp: Date.now()
    }
  }

  /**
   * Find nearest lane
   */
  private findNearestLane(state: VehicleState): {
    lane: MapLane | null
    distance: number
  } {
    let nearestLane: MapLane | null = null
    let minDistance = Infinity

    for (const lane of this.map!.lanes.values()) {
      const distance = this.distanceToLane(state, lane)

      if (distance < minDistance) {
        minDistance = distance
        nearestLane = lane
      }
    }

    return { lane: nearestLane, distance: minDistance }
  }

  /**
   * Calculate distance to lane
   */
  private distanceToLane(state: VehicleState, lane: MapLane): number {
    let minDistance = Infinity

    for (const point of lane.centerline) {
      const dx = state.x - point.x
      const dy = state.y - point.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < minDistance) {
        minDistance = distance
      }
    }

    return minDistance
  }

  /**
   * Match position to lane
   */
  private matchToLane(state: VehicleState, lane: MapLane): Vector2D {
    let nearestPoint = lane.centerline[0]
    let minDistance = Infinity

    for (const point of lane.centerline) {
      const dx = state.x - point.x
      const dy = state.y - point.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < minDistance) {
        minDistance = distance
        nearestPoint = point
      }
    }

    return nearestPoint
  }

  /**
   * Get lane by ID
   */
  getLane(laneId: string): MapLane | undefined {
    return this.map?.lanes.get(laneId)
  }

  /**
   * Get lanes in area
   */
  getLanesInArea(center: Vector2D, radius: number): MapLane[] {
    const lanesInArea: MapLane[] = []

    if (!this.map) return lanesInArea

    for (const lane of this.map.lanes.values()) {
      // Check if any point on centerline is within radius
      for (const point of lane.centerline) {
        const dx = point.x - center.x
        const dy = point.y - center.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < radius) {
          lanesInArea.push(lane)
          break
        }
      }
    }

    return lanesInArea
  }

  /**
   * Get junctions in area
   */
  getJunctionsInArea(center: Vector2D, radius: number): MapJunction[] {
    const junctionsInArea: MapJunction[] = []

    if (!this.map) return junctionsInArea

    for (const junction of this.map.junctions.values()) {
      // Check if junction center is within radius
      const junctionCenter = this.polygonCenter(junction.polygon)
      const dx = junctionCenter.x - center.x
      const dy = junctionCenter.y - center.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < radius) {
        junctionsInArea.push(junction)
      }
    }

    return junctionsInArea
  }

  /**
   * Get traffic signs in area
   */
  getTrafficSignsInArea(center: Vector2D, radius: number): MapTrafficSign[] {
    const signsInArea: MapTrafficSign[] = []

    if (!this.map) return signsInArea

    for (const sign of this.map.trafficSigns.values()) {
      const dx = sign.position.x - center.x
      const dy = sign.position.y - center.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < radius) {
        signsInArea.push(sign)
      }
    }

    return signsInArea
  }

  /**
   * Get traffic lights in area
   */
  getTrafficLightsInArea(center: Vector2D, radius: number): MapTrafficLight[] {
    const lightsInArea: MapTrafficLight[] = []

    if (!this.map) return lightsInArea

    for (const light of this.map.trafficLights.values()) {
      const dx = light.position.x - center.x
      const dy = light.position.y - center.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < radius) {
        lightsInArea.push(light)
      }
    }

    return lightsInArea
  }

  /**
   * Calculate polygon center
   */
  private polygonCenter(polygon: Vector2D[]): Vector2D {
    let sumX = 0
    let sumY = 0

    for (const point of polygon) {
      sumX += point.x
      sumY += point.y
    }

    return {
      x: sumX / polygon.length,
      y: sumY / polygon.length
    }
  }
}

export default { HDMapLoader, Localizer }
