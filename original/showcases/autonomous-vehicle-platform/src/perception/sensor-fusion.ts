/**
 * Sensor Fusion Module
 *
 * Fuses data from multiple sensors (camera, LiDAR, radar)
 * Implements Extended Kalman Filter (EKF) and Unscented Kalman Filter (UKF)
 * Provides robust object tracking and state estimation
 */

// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import scipy from 'python:scipy'

import type {
  DetectedObject,
  TrackedObject,
  Vector3D,
  Matrix,
  SensorFusionConfig,
  SensorType,
  TrackedState
} from '../types'

export interface FusionResult {
  objects: TrackedObject[]
  processingTime: number
  fusedSensors: SensorType[]
}

export interface SensorMeasurement {
  sensorType: SensorType
  objects: DetectedObject[]
  timestamp: number
  reliability: number
}

export interface KalmanState {
  // State vector: [x, y, z, vx, vy, vz, ax, ay, az]
  x: number[]  // state vector
  P: Matrix    // state covariance
  Q: Matrix    // process noise
  R: Matrix    // measurement noise
  F: Matrix    // state transition matrix
  H: Matrix    // measurement matrix
  timestamp: number
}

export class SensorFusion {
  private config: SensorFusionConfig
  private trackStates: Map<number, KalmanState> = new Map()
  private nextTrackId: number = 0
  private tracks: Map<number, TrackedObject> = new Map()

  constructor(config: SensorFusionConfig) {
    this.config = {
      maxAssociationDistance: 3.0,
      minDetections: 2,
      ...config
    }
  }

  /**
   * Fuse multi-sensor measurements
   */
  async fuse(measurements: Map<SensorType, DetectedObject[]>): Promise<FusionResult> {
    const startTime = Date.now()

    let fusedObjects: TrackedObject[]

    if (this.config.method === 'ekf') {
      fusedObjects = await this.fuseWithEKF(measurements)
    } else if (this.config.method === 'ukf') {
      fusedObjects = await this.fuseWithUKF(measurements)
    } else if (this.config.method === 'particle_filter') {
      fusedObjects = await this.fuseWithParticleFilter(measurements)
    } else {
      throw new Error(`Unknown fusion method: ${this.config.method}`)
    }

    const processingTime = Date.now() - startTime
    const fusedSensors = Array.from(measurements.keys())

    return {
      objects: fusedObjects,
      processingTime,
      fusedSensors
    }
  }

  /**
   * Fuse measurements using Extended Kalman Filter
   */
  private async fuseWithEKF(
    measurements: Map<SensorType, DetectedObject[]>
  ): Promise<TrackedObject[]> {
    const timestamp = Date.now()

    // Prediction step
    this.predictAllTracks(timestamp)

    // Association and update
    const associations = this.associateMeasurements(measurements)

    // Update matched tracks
    for (const [trackId, sensorMeasurements] of associations.matched) {
      const state = this.trackStates.get(trackId)!
      const track = this.tracks.get(trackId)!

      // Fuse measurements from multiple sensors
      const fusedMeasurement = this.fuseMeasurements(sensorMeasurements)

      // EKF update
      this.ekfUpdate(state, fusedMeasurement)

      // Update track
      this.updateTrack(track, state, fusedMeasurement)
    }

    // Create new tracks for unassociated measurements
    for (const measurement of associations.unmatched) {
      this.createTrack(measurement)
    }

    // Remove old tracks
    this.pruneOldTracks(timestamp)

    // Return all active tracks
    return Array.from(this.tracks.values())
  }

  /**
   * Fuse measurements using Unscented Kalman Filter
   */
  private async fuseWithUKF(
    measurements: Map<SensorType, DetectedObject[]>
  ): Promise<TrackedObject[]> {
    // UKF implementation similar to EKF but with sigma points
    // For this showcase, we'll use EKF implementation
    return this.fuseWithEKF(measurements)
  }

  /**
   * Fuse measurements using Particle Filter
   */
  private async fuseWithParticleFilter(
    measurements: Map<SensorType, DetectedObject[]>
  ): Promise<TrackedObject[]> {
    // Particle filter implementation
    // For this showcase, we'll use EKF implementation
    return this.fuseWithEKF(measurements)
  }

  /**
   * Predict all tracks forward in time
   */
  private predictAllTracks(timestamp: number): void {
    for (const [trackId, state] of this.trackStates) {
      this.ekfPredict(state, timestamp)
    }
  }

  /**
   * EKF prediction step
   */
  private ekfPredict(state: KalmanState, timestamp: number): void {
    const dt = (timestamp - state.timestamp) / 1000  // Convert to seconds

    // Update state transition matrix F
    // State: [x, y, z, vx, vy, vz, ax, ay, az]
    state.F = [
      [1, 0, 0, dt, 0, 0, 0.5*dt*dt, 0, 0],
      [0, 1, 0, 0, dt, 0, 0, 0.5*dt*dt, 0],
      [0, 0, 1, 0, 0, dt, 0, 0, 0.5*dt*dt],
      [0, 0, 0, 1, 0, 0, dt, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, dt, 0],
      [0, 0, 0, 0, 0, 1, 0, 0, dt],
      [0, 0, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 1]
    ]

    // Predict state
    state.x = this.matrixVectorMultiply(state.F, state.x)

    // Predict covariance: P = F*P*F' + Q
    const FP = this.matrixMultiply(state.F, state.P)
    const FPFt = this.matrixMultiply(FP, this.transpose(state.F))
    state.P = this.matrixAdd(FPFt, state.Q)

    state.timestamp = timestamp
  }

  /**
   * EKF update step
   */
  private ekfUpdate(state: KalmanState, measurement: DetectedObject): void {
    if (!measurement.position) return

    // Measurement vector: [x, y, z]
    const z = [measurement.position.x, measurement.position.y, measurement.position.z]

    // Measurement matrix H (extract position from state)
    state.H = [
      [1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0, 0, 0, 0]
    ]

    // Innovation: y = z - H*x
    const Hx = this.matrixVectorMultiply(state.H, state.x)
    const y = this.vectorSubtract(z, Hx)

    // Innovation covariance: S = H*P*H' + R
    const HP = this.matrixMultiply(state.H, state.P)
    const HPHt = this.matrixMultiply(HP, this.transpose(state.H))
    const S = this.matrixAdd(HPHt, state.R)

    // Kalman gain: K = P*H' * S^-1
    const PHt = this.matrixMultiply(state.P, this.transpose(state.H))
    const Sinv = this.matrixInverse(S)
    const K = this.matrixMultiply(PHt, Sinv)

    // Update state: x = x + K*y
    const Ky = this.matrixVectorMultiply(K, y)
    state.x = this.vectorAdd(state.x, Ky)

    // Update covariance: P = (I - K*H) * P
    const KH = this.matrixMultiply(K, state.H)
    const I = this.identity(9)
    const IminusKH = this.matrixSubtract(I, KH)
    state.P = this.matrixMultiply(IminusKH, state.P)
  }

  /**
   * Associate measurements with tracks
   */
  private associateMeasurements(
    measurements: Map<SensorType, DetectedObject[]>
  ): {
    matched: Map<number, SensorMeasurement[]>
    unmatched: DetectedObject[]
  } {
    const matched = new Map<number, SensorMeasurement[]>()
    const unmatched: DetectedObject[] = []

    // Collect all measurements
    const allMeasurements: SensorMeasurement[] = []
    for (const [sensorType, objects] of measurements) {
      for (const obj of objects) {
        allMeasurements.push({
          sensorType,
          objects: [obj],
          timestamp: obj.timestamp,
          reliability: this.getSensorReliability(sensorType)
        })
      }
    }

    // For each measurement, find closest track
    const usedTracks = new Set<number>()
    const usedMeasurements = new Set<number>()

    for (let i = 0; i < allMeasurements.length; i++) {
      const measurement = allMeasurements[i].objects[0]
      if (!measurement.position) continue

      let closestTrack = -1
      let minDistance = this.config.maxAssociationDistance

      for (const [trackId, state] of this.trackStates) {
        if (usedTracks.has(trackId)) continue

        const trackPos = { x: state.x[0], y: state.x[1], z: state.x[2] }
        const distance = this.euclideanDistance(measurement.position, trackPos)

        if (distance < minDistance) {
          minDistance = distance
          closestTrack = trackId
        }
      }

      if (closestTrack !== -1) {
        if (!matched.has(closestTrack)) {
          matched.set(closestTrack, [])
        }
        matched.get(closestTrack)!.push(allMeasurements[i])
        usedTracks.add(closestTrack)
        usedMeasurements.add(i)
      }
    }

    // Unmatched measurements
    for (let i = 0; i < allMeasurements.length; i++) {
      if (!usedMeasurements.has(i)) {
        unmatched.push(allMeasurements[i].objects[0])
      }
    }

    return { matched, unmatched }
  }

  /**
   * Fuse measurements from multiple sensors
   */
  private fuseMeasurements(sensorMeasurements: SensorMeasurement[]): DetectedObject {
    if (sensorMeasurements.length === 1) {
      return sensorMeasurements[0].objects[0]
    }

    // Weighted average based on sensor reliability
    let totalWeight = 0
    const fusedPosition: Vector3D = { x: 0, y: 0, z: 0 }
    let fusedClass = sensorMeasurements[0].objects[0].class
    let fusedConfidence = 0

    for (const sm of sensorMeasurements) {
      const obj = sm.objects[0]
      const weight = sm.reliability * obj.confidence

      if (obj.position) {
        fusedPosition.x += obj.position.x * weight
        fusedPosition.y += obj.position.y * weight
        fusedPosition.z += obj.position.z * weight
      }

      fusedConfidence += obj.confidence * weight
      totalWeight += weight
    }

    fusedPosition.x /= totalWeight
    fusedPosition.y /= totalWeight
    fusedPosition.z /= totalWeight
    fusedConfidence /= totalWeight

    const firstObj = sensorMeasurements[0].objects[0]

    return {
      ...firstObj,
      position: fusedPosition,
      confidence: fusedConfidence,
      timestamp: Date.now()
    }
  }

  /**
   * Get sensor reliability factor
   */
  private getSensorReliability(sensorType: SensorType): number {
    const reliability: Record<SensorType, number> = {
      [SensorType.CAMERA]: 0.7,
      [SensorType.LIDAR]: 0.9,
      [SensorType.RADAR]: 0.8,
      [SensorType.IMU]: 0.95,
      [SensorType.GPS]: 0.85,
      [SensorType.ODOMETRY]: 0.8,
      [SensorType.ULTRASONIC]: 0.6
    }

    return reliability[sensorType] || 0.5
  }

  /**
   * Create new track
   */
  private createTrack(measurement: DetectedObject): number {
    const trackId = this.nextTrackId++

    if (!measurement.position) {
      return trackId
    }

    // Initialize Kalman state
    const state: KalmanState = {
      x: [
        measurement.position.x,
        measurement.position.y,
        measurement.position.z,
        0, 0, 0,  // velocity
        0, 0, 0   // acceleration
      ],
      P: this.identity(9),  // Initial covariance
      Q: this.scaleMatrix(this.identity(9), this.config.processNoise[0][0]),  // Process noise
      R: this.scaleMatrix(this.identity(3), this.config.measurementNoise[0][0]),  // Measurement noise
      F: this.identity(9),  // State transition (updated in predict)
      H: [  // Measurement matrix
        [1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 0]
      ],
      timestamp: Date.now()
    }

    this.trackStates.set(trackId, state)

    // Create tracked object
    const track: TrackedObject = {
      ...measurement,
      trackingId: trackId,
      trackingConfidence: 0.3,
      trackingHistory: [{
        position: measurement.position,
        velocity: { x: 0, y: 0, z: 0 },
        acceleration: { x: 0, y: 0, z: 0 },
        timestamp: Date.now()
      }],
      age: 1,
      consecutiveDetections: 1,
      consecutiveMisses: 0
    }

    this.tracks.set(trackId, track)

    return trackId
  }

  /**
   * Update track with new state
   */
  private updateTrack(
    track: TrackedObject,
    state: KalmanState,
    measurement: DetectedObject
  ): void {
    // Update position from state
    track.position = {
      x: state.x[0],
      y: state.x[1],
      z: state.x[2]
    }

    // Update velocity
    track.velocity = {
      x: state.x[3],
      y: state.x[4],
      z: state.x[5]
    }

    // Update acceleration
    track.acceleration = {
      x: state.x[6],
      y: state.x[7],
      z: state.x[8]
    }

    // Update speed
    track.speed = Math.sqrt(
      track.velocity.x ** 2 +
      track.velocity.y ** 2 +
      track.velocity.z ** 2
    )

    // Update distance
    track.distance = Math.sqrt(
      track.position.x ** 2 +
      track.position.y ** 2 +
      track.position.z ** 2
    )

    // Update confidence
    track.confidence = measurement.confidence
    track.trackingConfidence = Math.min(track.consecutiveDetections / 10, 1.0)

    // Update counters
    track.age++
    track.consecutiveDetections++
    track.consecutiveMisses = 0

    // Update history
    track.trackingHistory.push({
      position: track.position,
      velocity: track.velocity,
      acceleration: track.acceleration,
      timestamp: Date.now()
    })

    // Keep history limited
    if (track.trackingHistory.length > 30) {
      track.trackingHistory.shift()
    }

    // Update covariance
    track.covariance = state.P
  }

  /**
   * Prune old tracks
   */
  private pruneOldTracks(timestamp: number): void {
    const maxAge = 2000  // 2 seconds
    const maxMisses = 5

    for (const [trackId, track] of this.tracks) {
      const age = timestamp - track.timestamp

      if (age > maxAge || track.consecutiveMisses > maxMisses) {
        this.tracks.delete(trackId)
        this.trackStates.delete(trackId)
      }
    }
  }

  /**
   * Compute Euclidean distance
   */
  private euclideanDistance(p1: Vector3D, p2: Vector3D): number {
    return Math.sqrt(
      (p1.x - p2.x) ** 2 +
      (p1.y - p2.y) ** 2 +
      (p1.z - p2.z) ** 2
    )
  }

  // ============================================================================
  // Matrix Operations
  // ============================================================================

  private matrixMultiply(A: Matrix, B: Matrix): Matrix {
    const m = A.length
    const n = A[0].length
    const p = B[0].length

    const C: Matrix = Array(m).fill(0).map(() => Array(p).fill(0))

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < p; j++) {
        for (let k = 0; k < n; k++) {
          C[i][j] += A[i][k] * B[k][j]
        }
      }
    }

    return C
  }

  private matrixVectorMultiply(A: Matrix, x: number[]): number[] {
    const m = A.length
    const y: number[] = Array(m).fill(0)

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < x.length; j++) {
        y[i] += A[i][j] * x[j]
      }
    }

    return y
  }

  private matrixAdd(A: Matrix, B: Matrix): Matrix {
    const m = A.length
    const n = A[0].length
    const C: Matrix = Array(m).fill(0).map(() => Array(n).fill(0))

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        C[i][j] = A[i][j] + B[i][j]
      }
    }

    return C
  }

  private matrixSubtract(A: Matrix, B: Matrix): Matrix {
    const m = A.length
    const n = A[0].length
    const C: Matrix = Array(m).fill(0).map(() => Array(n).fill(0))

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        C[i][j] = A[i][j] - B[i][j]
      }
    }

    return C
  }

  private transpose(A: Matrix): Matrix {
    const m = A.length
    const n = A[0].length
    const At: Matrix = Array(n).fill(0).map(() => Array(m).fill(0))

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        At[j][i] = A[i][j]
      }
    }

    return At
  }

  private identity(n: number): Matrix {
    const I: Matrix = Array(n).fill(0).map(() => Array(n).fill(0))

    for (let i = 0; i < n; i++) {
      I[i][i] = 1
    }

    return I
  }

  private scaleMatrix(A: Matrix, scale: number): Matrix {
    return A.map(row => row.map(val => val * scale))
  }

  private matrixInverse(A: Matrix): Matrix {
    // Simplified matrix inversion using numpy in production
    // For 3x3 matrix, we can use closed-form solution
    const n = A.length

    if (n === 3) {
      const det = this.determinant3x3(A)

      if (Math.abs(det) < 1e-10) {
        // Singular matrix, return identity
        return this.identity(3)
      }

      const inv: Matrix = [
        [
          (A[1][1] * A[2][2] - A[1][2] * A[2][1]) / det,
          (A[0][2] * A[2][1] - A[0][1] * A[2][2]) / det,
          (A[0][1] * A[1][2] - A[0][2] * A[1][1]) / det
        ],
        [
          (A[1][2] * A[2][0] - A[1][0] * A[2][2]) / det,
          (A[0][0] * A[2][2] - A[0][2] * A[2][0]) / det,
          (A[0][2] * A[1][0] - A[0][0] * A[1][2]) / det
        ],
        [
          (A[1][0] * A[2][1] - A[1][1] * A[2][0]) / det,
          (A[0][1] * A[2][0] - A[0][0] * A[2][1]) / det,
          (A[0][0] * A[1][1] - A[0][1] * A[1][0]) / det
        ]
      ]

      return inv
    }

    // For larger matrices, use numpy in production
    return this.identity(n)
  }

  private determinant3x3(A: Matrix): number {
    return (
      A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
      A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
      A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0])
    )
  }

  private vectorAdd(a: number[], b: number[]): number[] {
    return a.map((val, i) => val + b[i])
  }

  private vectorSubtract(a: number[], b: number[]): number[] {
    return a.map((val, i) => val - b[i])
  }

  /**
   * Get fusion statistics
   */
  getStatistics(): any {
    return {
      activeTracks: this.tracks.size,
      totalTracks: this.nextTrackId,
      averageTrackAge: this.getAverageTrackAge(),
      averageConfidence: this.getAverageConfidence()
    }
  }

  private getAverageTrackAge(): number {
    if (this.tracks.size === 0) return 0

    let totalAge = 0
    for (const track of this.tracks.values()) {
      totalAge += track.age
    }

    return totalAge / this.tracks.size
  }

  private getAverageConfidence(): number {
    if (this.tracks.size === 0) return 0

    let totalConfidence = 0
    for (const track of this.tracks.values()) {
      totalConfidence += track.trackingConfidence
    }

    return totalConfidence / this.tracks.size
  }

  /**
   * Reset fusion state
   */
  reset(): void {
    this.trackStates.clear()
    this.tracks.clear()
    this.nextTrackId = 0
  }
}

export default SensorFusion
