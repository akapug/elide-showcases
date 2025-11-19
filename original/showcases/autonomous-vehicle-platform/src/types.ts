/**
 * Type definitions for Autonomous Vehicle Platform
 *
 * Comprehensive types for perception, planning, control, mapping, and simulation
 */

// ============================================================================
// Core Math Types
// ============================================================================

export interface Vector2D {
  x: number
  y: number
}

export interface Vector3D {
  x: number
  y: number
  z: number
}

export interface Vector4D {
  x: number
  y: number
  z: number
  w: number
}

export interface Quaternion {
  w: number
  x: number
  y: number
  z: number
}

export interface Pose2D {
  x: number
  y: number
  heading: number
}

export interface Pose3D {
  position: Vector3D
  orientation: Quaternion
}

export type Matrix = number[][]

export interface Transform3D {
  translation: Vector3D
  rotation: Quaternion
}

// ============================================================================
// Coordinate Systems
// ============================================================================

export interface VehicleFrame {
  x: number      // longitudinal (forward)
  y: number      // lateral (left)
  z: number      // vertical (up)
  roll: number   // rotation around x
  pitch: number  // rotation around y
  yaw: number    // rotation around z (heading)
}

export interface WorldFrame {
  lat: number    // latitude
  lon: number    // longitude
  alt: number    // altitude
  heading: number
}

export interface FrenetFrame {
  s: number      // longitudinal position along path
  d: number      // lateral offset from path
  s_dot: number  // longitudinal velocity
  d_dot: number  // lateral velocity
  s_ddot: number // longitudinal acceleration
  d_ddot: number // lateral acceleration
}

// ============================================================================
// Vehicle Types
// ============================================================================

export interface VehicleState {
  // Position
  x: number
  y: number
  z: number

  // Orientation
  roll: number
  pitch: number
  yaw: number

  // Linear velocity
  vx: number
  vy: number
  vz: number

  // Angular velocity
  wx: number
  wy: number
  wz: number

  // Acceleration
  ax: number
  ay: number
  az: number

  // Speed and heading
  speed: number
  heading: number

  // Steering
  steeringAngle: number
  steeringRate: number

  // Timestamp
  timestamp: number
}

export interface VehicleParameters {
  // Dimensions
  length: number
  width: number
  height: number
  wheelbase: number
  trackWidth: number

  // Axle distances
  frontOverhang: number
  rearOverhang: number
  distanceToFrontAxle: number
  distanceToRearAxle: number

  // Mass and inertia
  mass: number
  inertia: number

  // Performance limits
  maxSpeed: number
  maxAcceleration: number
  maxDeceleration: number
  maxSteeringAngle: number
  maxSteeringRate: number
  maxLateralAcceleration: number

  // Actuator limits
  maxThrottle: number
  maxBrake: number
}

export interface ControlInput {
  steering: number   // steering angle (-maxSteeringAngle to +maxSteeringAngle)
  throttle: number   // throttle (0 to 1)
  brake: number      // brake (0 to 1)
  gear: 'P' | 'R' | 'N' | 'D'
  timestamp: number
}

export interface ControlOutput extends ControlInput {
  valid: boolean
  safetyChecked: boolean
}

// ============================================================================
// Sensor Types
// ============================================================================

export enum SensorType {
  CAMERA = 'camera',
  LIDAR = 'lidar',
  RADAR = 'radar',
  IMU = 'imu',
  GPS = 'gps',
  ODOMETRY = 'odometry',
  ULTRASONIC = 'ultrasonic'
}

export interface SensorData {
  type: SensorType
  timestamp: number
  frameId: string
}

export interface ImageData extends SensorData {
  type: SensorType.CAMERA
  width: number
  height: number
  channels: number
  data: Uint8Array | number[][][]
  encoding: 'rgb' | 'bgr' | 'gray'
  cameraId: string
}

export interface PointCloud extends SensorData {
  type: SensorType.LIDAR
  points: Point3D[]
  intensity?: number[]
  timestamp: number
}

export interface Point3D {
  x: number
  y: number
  z: number
  intensity?: number
  ring?: number
}

export interface RadarTarget {
  range: number
  azimuth: number
  elevation: number
  rangeRate: number
  rcs: number  // radar cross section
  snr: number  // signal-to-noise ratio
}

export interface RadarData extends SensorData {
  type: SensorType.RADAR
  targets: RadarTarget[]
  radarId: string
}

export interface IMUData extends SensorData {
  type: SensorType.IMU
  linearAcceleration: Vector3D
  angularVelocity: Vector3D
  orientation?: Quaternion
}

export interface GPSData extends SensorData {
  type: SensorType.GPS
  latitude: number
  longitude: number
  altitude: number
  heading?: number
  speed?: number
  accuracy: number
  numSatellites: number
}

export interface CameraModel {
  width: number
  height: number
  fx: number  // focal length x
  fy: number  // focal length y
  cx: number  // principal point x
  cy: number  // principal point y
  k1: number  // radial distortion
  k2: number
  k3: number
  p1: number  // tangential distortion
  p2: number
}

export interface LidarModel {
  channels: number
  range: number
  horizontalResolution: number
  verticalResolution: number
  frequency: number
  accuracy: number
}

export interface RadarModel {
  range: number
  fov: number
  rangeResolution: number
  velocityResolution: number
  angularResolution: number
}

// ============================================================================
// Perception Types
// ============================================================================

export enum ObjectClass {
  UNKNOWN = 'unknown',
  CAR = 'car',
  TRUCK = 'truck',
  BUS = 'bus',
  MOTORCYCLE = 'motorcycle',
  BICYCLE = 'bicycle',
  PEDESTRIAN = 'pedestrian',
  TRAFFIC_SIGN = 'traffic_sign',
  TRAFFIC_LIGHT = 'traffic_light',
  CONE = 'cone',
  BARRIER = 'barrier',
  OBSTACLE = 'obstacle'
}

export interface BoundingBox2D {
  x: number      // center x
  y: number      // center y
  width: number
  height: number
  rotation?: number
}

export interface BoundingBox3D {
  center: Vector3D
  size: Vector3D
  rotation: Quaternion
}

export interface DetectedObject {
  id: number
  class: ObjectClass
  confidence: number

  // 2D detection
  bbox: BoundingBox2D

  // 3D detection (optional)
  bbox3d?: BoundingBox3D
  position?: Vector3D
  velocity?: Vector3D
  acceleration?: Vector3D

  // Tracking
  trackingId?: number
  trackingConfidence?: number

  // Additional attributes
  distance?: number
  speed?: number
  heading?: number

  // Uncertainty
  covariance?: Matrix

  // Metadata
  sensorType?: SensorType
  timestamp: number
}

export interface TrackedObject extends DetectedObject {
  trackingId: number
  trackingConfidence: number
  trackingHistory: TrackedState[]
  predictedTrajectory?: Trajectory
  age: number
  consecutiveDetections: number
  consecutiveMisses: number
}

export interface TrackedState {
  position: Vector3D
  velocity: Vector3D
  acceleration: Vector3D
  timestamp: number
}

export interface Lane {
  id: number
  type: 'solid' | 'dashed' | 'double'
  color: 'white' | 'yellow'
  confidence: number
  points: Vector2D[]
  polynomial?: number[]  // polynomial coefficients
  curvature: number
  heading: number
}

export interface LaneDetection {
  left?: Lane
  right?: Lane
  center?: Lane
  additional: Lane[]
  laneWidth: number
  confidence: number
  timestamp: number
}

export interface DrivableArea {
  polygon: Vector2D[]
  confidence: number
  timestamp: number
}

export interface TrafficSign {
  type: string
  confidence: number
  position: Vector3D
  bbox: BoundingBox2D
  text?: string
}

export enum TrafficLightState {
  RED = 'red',
  YELLOW = 'yellow',
  GREEN = 'green',
  RED_YELLOW = 'red_yellow',
  UNKNOWN = 'unknown'
}

export interface TrafficLight {
  state: TrafficLightState
  confidence: number
  position: Vector3D
  bbox: BoundingBox2D
  timeToChange?: number
}

export interface PerceptionOutput {
  objects: DetectedObject[]
  trackedObjects: TrackedObject[]
  lanes: LaneDetection
  drivableArea?: DrivableArea
  trafficSigns: TrafficSign[]
  trafficLights: TrafficLight[]
  freeSpace: Vector2D[]
  timestamp: number
}

// ============================================================================
// Planning Types
// ============================================================================

export enum BehaviorState {
  IDLE = 'idle',
  LANE_KEEP = 'lane_keep',
  LANE_CHANGE_LEFT = 'lane_change_left',
  LANE_CHANGE_RIGHT = 'lane_change_right',
  OVERTAKE = 'overtake',
  MERGE = 'merge',
  INTERSECTION = 'intersection',
  STOP = 'stop',
  PARKING = 'parking',
  EMERGENCY = 'emergency',
  PULL_OVER = 'pull_over'
}

export interface BehaviorOutput {
  state: BehaviorState
  targetSpeed: number
  targetLane: number
  targetPosition?: Vector2D
  reason: string
  priority: number
  timestamp: number
}

export interface Waypoint {
  position: Vector2D | Vector3D
  heading: number
  curvature: number
  velocity?: number
  acceleration?: number
  timestamp?: number
}

export interface Trajectory {
  waypoints: Waypoint[]
  velocities: number[]
  accelerations: number[]
  times: number[]
  cost: number
  length: number
  duration: number
  safe: boolean
  feasible: boolean
}

export interface PathPlanRequest {
  start: Pose2D
  goal: Pose2D
  map: any  // HDMap
  obstacles: DetectedObject[]
  constraints?: PlanningConstraints
}

export interface PlanningConstraints {
  maxSpeed: number
  maxAcceleration: number
  maxDeceleration: number
  maxCurvature: number
  maxJerk: number
  minTurningRadius: number
  safetyMargin: number
}

export enum PlanningAlgorithm {
  ASTAR = 'astar',
  HYBRID_ASTAR = 'hybrid-astar',
  RRT = 'rrt',
  RRT_STAR = 'rrt-star',
  LATTICE = 'lattice',
  FRENET = 'frenet',
  POLYNOMIAL = 'polynomial'
}

export interface PlanningResult {
  success: boolean
  trajectory: Trajectory
  computationTime: number
  iterations: number
  error?: string
}

// ============================================================================
// Control Types
// ============================================================================

export enum ControllerType {
  PURE_PURSUIT = 'pure-pursuit',
  STANLEY = 'stanley',
  MPC = 'mpc',
  PID = 'pid',
  LQR = 'lqr'
}

export interface ControllerConfig {
  type: ControllerType
  lookahead?: number
  kp?: number
  ki?: number
  kd?: number
  horizon?: number
  dt?: number
  Q?: Matrix  // state cost matrix
  R?: Matrix  // control cost matrix
}

export interface TrackingError {
  lateralError: number
  headingError: number
  velocityError: number
  timestamp: number
}

export interface ControllerOutput {
  control: ControlInput
  trackingError: TrackingError
  timestamp: number
}

// ============================================================================
// Mapping Types
// ============================================================================

export interface MapLane {
  id: string
  type: 'driving' | 'parking' | 'shoulder' | 'bike'
  centerline: Vector2D[]
  leftBoundary: Vector2D[]
  rightBoundary: Vector2D[]
  width: number
  speedLimit: number
  direction: 'forward' | 'backward' | 'bidirectional'
  predecessors: string[]
  successors: string[]
  leftNeighbor?: string
  rightNeighbor?: string
}

export interface MapJunction {
  id: string
  type: 'intersection' | 'merge' | 'diverge'
  polygon: Vector2D[]
  incomingLanes: string[]
  outgoingLanes: string[]
  trafficControl?: 'signal' | 'stop' | 'yield' | 'none'
}

export interface MapRoadMarking {
  id: string
  type: 'solid' | 'dashed' | 'double' | 'crosswalk' | 'stop_line'
  color: 'white' | 'yellow'
  points: Vector2D[]
}

export interface MapTrafficSign {
  id: string
  type: string
  position: Vector2D
  heading: number
  affectedLanes: string[]
}

export interface MapTrafficLight {
  id: string
  position: Vector2D
  heading: number
  affectedLanes: string[]
}

export interface HDMap {
  id: string
  version: string
  lanes: Map<string, MapLane>
  junctions: Map<string, MapJunction>
  roadMarkings: Map<string, MapRoadMarking>
  trafficSigns: Map<string, MapTrafficSign>
  trafficLights: Map<string, MapTrafficLight>
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

export interface LocalizationResult {
  position: Vector2D
  heading: number
  laneId?: string
  confidence: number
  uncertainty: Matrix
  timestamp: number
}

// ============================================================================
// Simulation Types
// ============================================================================

export interface SimulationConfig {
  scenario: string
  map: string
  startPose: Pose2D
  goalPose: Pose2D
  traffic: TrafficAgent[]
  weather: WeatherCondition
  timeOfDay: 'day' | 'night' | 'dawn' | 'dusk'
  dt: number
  maxSteps: number
}

export interface TrafficAgent {
  id: string
  type: ObjectClass
  initialPose: Pose2D
  initialVelocity: number
  behavior: 'static' | 'constant_velocity' | 'follow_lane' | 'aggressive' | 'defensive'
  route?: Vector2D[]
}

export interface WeatherCondition {
  type: 'clear' | 'rain' | 'fog' | 'snow'
  intensity: number  // 0 to 1
  visibility: number  // meters
}

export interface SimulationState {
  timestamp: number
  step: number
  egoVehicle: VehicleState
  trafficAgents: Map<string, VehicleState>
  collisions: Collision[]
  reachedGoal: boolean
}

export interface Collision {
  timestamp: number
  egoVehicle: boolean
  objectId?: string
  position: Vector2D
  severity: 'minor' | 'major' | 'critical'
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface DetectorConfig {
  model: 'yolov8n' | 'yolov8s' | 'yolov8m' | 'yolov8l' | 'fasterrcnn' | 'ssd'
  device: 'cpu' | 'cuda' | 'mps'
  precision?: 'fp32' | 'fp16' | 'int8'
  confidenceThreshold: number
  nmsThreshold: number
  maxDetections?: number
  classes?: ObjectClass[]
}

export interface LaneDetectorConfig {
  method: 'hough' | 'polyfit' | 'cnn' | 'sliding_window'
  degree?: number
  roi?: {
    top: number
    bottom: number
    left?: number
    right?: number
  }
  minLineLength?: number
  maxLineGap?: number
}

export interface SensorFusionConfig {
  method: 'ekf' | 'ukf' | 'particle_filter'
  sensors: SensorType[]
  processNoise: Matrix
  measurementNoise: Matrix
  maxAssociationDistance: number
  minDetections: number
}

export interface PlannerConfig {
  algorithm: PlanningAlgorithm
  resolution: number
  lookahead: number
  constraints: PlanningConstraints
  replanInterval?: number
}

export interface AVConfig {
  perception: {
    objectDetection: DetectorConfig
    laneDetection: LaneDetectorConfig
    sensorFusion: SensorFusionConfig
  }
  planning: {
    pathPlanner: PlannerConfig
    behaviorPlanner: {
      mode: 'fsm' | 'learning'
      safetyMargin: number
    }
  }
  control: {
    controller: ControllerConfig
  }
  vehicle: VehicleParameters
}

// ============================================================================
// Utility Types
// ============================================================================

export interface TimeStamped {
  timestamp: number
}

export interface Identified {
  id: string | number
}

export interface Confidence {
  confidence: number
}

export interface RiskLevel {
  level: 'none' | 'low' | 'medium' | 'high' | 'critical'
  value: number
  reason: string
}

export interface PerformanceMetrics {
  fps: number
  latency: number
  cpuUsage: number
  gpuUsage: number
  memoryUsage: number
}

// ============================================================================
// Helper Types
// ============================================================================

export type Point2D = Vector2D
export type Position2D = Vector2D
export type Position3D = Vector3D
export type Rotation = Quaternion

export interface Range {
  min: number
  max: number
}

export interface Circle {
  center: Vector2D
  radius: number
}

export interface Rectangle {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}

export interface Polygon {
  points: Vector2D[]
}

// ============================================================================
// Event Types
// ============================================================================

export interface AVEvent {
  type: string
  timestamp: number
  data: any
}

export interface CollisionEvent extends AVEvent {
  type: 'collision'
  data: {
    objectId?: string
    position: Vector2D
    severity: 'minor' | 'major' | 'critical'
  }
}

export interface LaneChangeEvent extends AVEvent {
  type: 'lane_change'
  data: {
    fromLane: number
    toLane: number
    direction: 'left' | 'right'
  }
}

export interface EmergencyStopEvent extends AVEvent {
  type: 'emergency_stop'
  data: {
    reason: string
    decelerationRate: number
  }
}

// ============================================================================
// Callback Types
// ============================================================================

export type PerceptionCallback = (output: PerceptionOutput) => void
export type PlanningCallback = (trajectory: Trajectory) => void
export type ControlCallback = (control: ControlInput) => void
export type EventCallback = (event: AVEvent) => void

// ============================================================================
// Error Types
// ============================================================================

export class PerceptionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PerceptionError'
  }
}

export class PlanningError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PlanningError'
  }
}

export class ControlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ControlError'
  }
}

export class SimulationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SimulationError'
  }
}

// ============================================================================
// Constants
// ============================================================================

export const VEHICLE_CLASSES = [
  ObjectClass.CAR,
  ObjectClass.TRUCK,
  ObjectClass.BUS,
  ObjectClass.MOTORCYCLE,
  ObjectClass.BICYCLE
] as const

export const VULNERABLE_CLASSES = [
  ObjectClass.PEDESTRIAN,
  ObjectClass.BICYCLE,
  ObjectClass.MOTORCYCLE
] as const

export const STATIC_CLASSES = [
  ObjectClass.TRAFFIC_SIGN,
  ObjectClass.TRAFFIC_LIGHT,
  ObjectClass.CONE,
  ObjectClass.BARRIER,
  ObjectClass.OBSTACLE
] as const

export const SENSOR_TYPES = [
  SensorType.CAMERA,
  SensorType.LIDAR,
  SensorType.RADAR,
  SensorType.IMU,
  SensorType.GPS
] as const

export const BEHAVIOR_STATES = [
  BehaviorState.IDLE,
  BehaviorState.LANE_KEEP,
  BehaviorState.LANE_CHANGE_LEFT,
  BehaviorState.LANE_CHANGE_RIGHT,
  BehaviorState.OVERTAKE,
  BehaviorState.MERGE,
  BehaviorState.INTERSECTION,
  BehaviorState.STOP,
  BehaviorState.PARKING,
  BehaviorState.EMERGENCY
] as const

// ============================================================================
// Type Guards
// ============================================================================

export function isVector2D(obj: any): obj is Vector2D {
  return obj && typeof obj.x === 'number' && typeof obj.y === 'number'
}

export function isVector3D(obj: any): obj is Vector3D {
  return obj && typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.z === 'number'
}

export function isPose2D(obj: any): obj is Pose2D {
  return obj && typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.heading === 'number'
}

export function isDetectedObject(obj: any): obj is DetectedObject {
  return obj && typeof obj.id === 'number' && obj.class && obj.confidence !== undefined && obj.bbox
}

export function isTrackedObject(obj: any): obj is TrackedObject {
  return isDetectedObject(obj) && obj.trackingId !== undefined && obj.trackingHistory
}

// ============================================================================
// Exports
// ============================================================================

export default {
  // Types are exported individually above
  // This default export provides a namespace for constants and utilities
  VEHICLE_CLASSES,
  VULNERABLE_CLASSES,
  STATIC_CLASSES,
  SENSOR_TYPES,
  BEHAVIOR_STATES,
  isVector2D,
  isVector3D,
  isPose2D,
  isDetectedObject,
  isTrackedObject
}
