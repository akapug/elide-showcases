/**
 * Core Type Definitions for Robotics Control System
 *
 * Comprehensive type definitions for robot kinematics, control, planning,
 * and simulation components.
 */

// ============================================================================
// Basic Geometric Types
// ============================================================================

/**
 * 3D vector representation
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * 2D vector representation
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Quaternion for 3D rotation representation
 */
export interface Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
}

/**
 * Euler angles for rotation representation
 */
export interface EulerAngles {
  roll: number;  // Rotation around X-axis
  pitch: number; // Rotation around Y-axis
  yaw: number;   // Rotation around Z-axis
}

/**
 * 2D pose (position + orientation)
 */
export interface Pose2D {
  x: number;
  y: number;
  theta: number; // Orientation angle in radians
}

/**
 * 3D pose (position + orientation)
 */
export interface Pose3D {
  position: Vector3;
  orientation: Quaternion;
}

/**
 * Homogeneous transformation matrix (4x4)
 */
export interface Transform {
  matrix: number[][]; // 4x4 transformation matrix
  position: Vector3;
  rotation: number[][]; // 3x3 rotation matrix
}

/**
 * Bounding box
 */
export interface BoundingBox {
  min: Vector3;
  max: Vector3;
}

/**
 * Matrix representation
 */
export interface Matrix {
  rows: number;
  cols: number;
  data: number[][];
}

// ============================================================================
// Robot Kinematics Types
// ============================================================================

/**
 * Denavit-Hartenberg (DH) parameters for robot kinematics
 */
export interface DHParameters {
  a: number;      // Link length
  alpha: number;  // Link twist
  d: number;      // Link offset
  theta: number;  // Joint angle
}

/**
 * Joint angles for robot manipulator
 */
export interface JointAngles {
  angles: number[]; // Joint angles in radians
}

/**
 * Joint state including position, velocity, acceleration
 */
export interface JointState {
  position: number;
  velocity: number;
  acceleration: number;
  torque?: number;
  effort?: number;
}

/**
 * Complete joint space state
 */
export interface JointSpaceState {
  positions: number[];
  velocities: number[];
  accelerations: number[];
  torques?: number[];
}

/**
 * Joint limits
 */
export interface JointLimits {
  positionMin: number;
  positionMax: number;
  velocityMax: number;
  accelerationMax: number;
  torqueMax: number;
}

/**
 * Link properties
 */
export interface Link {
  id: number;
  name: string;
  length: number;
  mass: number;
  centerOfMass: Vector3;
  inertia: Matrix;
  dhParams: DHParameters;
}

/**
 * Robot workspace definition
 */
export interface Workspace {
  reachable: Vector3[];
  dexterous: Vector3[];
  bounds: BoundingBox;
  volume: number;
}

/**
 * Forward kinematics result
 */
export interface ForwardKinematicsResult {
  endEffectorPose: Pose3D;
  linkTransforms: Transform[];
  jacobian?: Matrix;
}

/**
 * Inverse kinematics options
 */
export interface InverseKinematicsOptions {
  method: 'jacobian' | 'fabrik' | 'ccd' | 'optimization';
  tolerance: number;
  maxIterations: number;
  initialGuess?: number[];
  avoidLimits?: boolean;
  weights?: number[];
}

/**
 * Inverse kinematics result
 */
export interface InverseKinematicsResult {
  success: boolean;
  jointAngles: number[];
  iterations: number;
  error: number;
  computationTime: number;
}

/**
 * Jacobian matrix with singularity information
 */
export interface JacobianInfo {
  matrix: Matrix;
  determinant: number;
  condition: number;
  isSingular: boolean;
  manipulability: number;
}

// ============================================================================
// Control System Types
// ============================================================================

/**
 * PID controller configuration
 */
export interface PIDConfig {
  kp: number;  // Proportional gain
  ki: number;  // Integral gain
  kd: number;  // Derivative gain
  outputLimit?: number;
  integralLimit?: number;
  deadband?: number;
  sampleTime?: number;
}

/**
 * PID controller state
 */
export interface PIDState {
  error: number;
  integral: number;
  derivative: number;
  output: number;
  lastError: number;
  lastTime: number;
}

/**
 * Model Predictive Control configuration
 */
export interface MPCConfig {
  horizonLength: number;        // Prediction horizon
  controlInterval: number;      // Control update interval (seconds)
  predictionModel: 'linear' | 'nonlinear';
  costWeights: CostWeights;
  constraints: Constraints;
  solver?: 'qp' | 'sqp' | 'ipopt' | 'cvxpy';
  warmStart?: boolean;
}

/**
 * Cost weights for MPC
 */
export interface CostWeights {
  tracking: number;    // State tracking error weight
  control: number;     // Control effort weight
  terminal: number;    // Terminal state weight
  smoothness?: number; // Control smoothness weight
}

/**
 * Control constraints
 */
export interface Constraints {
  positionBounds?: { min: number; max: number };
  velocityBounds?: { min: number; max: number };
  accelerationBounds?: { min: number; max: number };
  jerkBounds?: { min: number; max: number };
  torqueBounds?: { min: number; max: number };
}

/**
 * Control command
 */
export interface ControlCommand {
  jointTorques: number[];
  jointVelocities?: number[];
  jointPositions?: number[];
  timestamp: number;
}

/**
 * MPC prediction result
 */
export interface MPCPrediction {
  control: ControlCommand;
  predictedStates: JointSpaceState[];
  predictedCost: number;
  computationTime: number;
  solverStatus: string;
}

/**
 * Controller performance metrics
 */
export interface ControllerMetrics {
  riseTime: number;
  settlingTime: number;
  overshoot: number;
  steadyStateError: number;
  peakTime: number;
}

/**
 * Impedance control parameters
 */
export interface ImpedanceParams {
  stiffness: Vector3;  // Spring stiffness in each axis
  damping: Vector3;    // Damping coefficient in each axis
  mass?: Vector3;      // Virtual mass
}

/**
 * Force-torque sensor data
 */
export interface ForceTorque {
  force: Vector3;
  torque: Vector3;
  timestamp: number;
}

// ============================================================================
// Path Planning Types
// ============================================================================

/**
 * Path planning algorithm type
 */
export type PathPlanningAlgorithm =
  | 'rrt'
  | 'rrt-star'
  | 'rrt-connect'
  | 'a-star'
  | 'dijkstra'
  | 'prm'
  | 'informed-rrt-star';

/**
 * Path planner configuration
 */
export interface PathPlannerConfig {
  algorithm: PathPlanningAlgorithm;
  workspace: BoundingBox;
  stepSize: number;
  maxIterations: number;
  goalBias?: number;
  optimizationRadius?: number;
  collisionCheckResolution?: number;
}

/**
 * Obstacle types
 */
export type ObstacleType = 'box' | 'sphere' | 'cylinder' | 'mesh';

/**
 * Obstacle definition
 */
export interface Obstacle {
  type: ObstacleType;
  position: Vector3;
  size?: Vector3;     // For box
  radius?: number;    // For sphere/cylinder
  height?: number;    // For cylinder
  rotation?: Quaternion;
  mesh?: Vector3[];   // For mesh obstacles
}

/**
 * Path waypoint
 */
export interface Waypoint {
  position: Vector3;
  orientation?: Quaternion;
  time?: number;
  velocity?: Vector3;
}

/**
 * Complete path
 */
export interface Path {
  waypoints: Waypoint[];
  totalLength: number;
  planningTime: number;
  algorithm: string;
  cost?: number;
}

/**
 * RRT tree node
 */
export interface RRTNode {
  id: number;
  position: Vector3;
  parent?: RRTNode;
  children: RRTNode[];
  cost: number;
}

/**
 * A* grid node
 */
export interface AStarNode {
  position: Vector3;
  g: number; // Cost from start
  h: number; // Heuristic to goal
  f: number; // Total cost (g + h)
  parent?: AStarNode;
}

/**
 * Collision detection result
 */
export interface CollisionResult {
  collision: boolean;
  distance: number;
  point?: Vector3;
  normal?: Vector3;
}

// ============================================================================
// Trajectory Types
// ============================================================================

/**
 * Trajectory interpolation type
 */
export type InterpolationType =
  | 'linear'
  | 'cubic-spline'
  | 'quintic-spline'
  | 'b-spline'
  | 'bezier';

/**
 * Trajectory generator configuration
 */
export interface TrajectoryConfig {
  interpolationType: InterpolationType;
  maxVelocity: number;
  maxAcceleration: number;
  maxJerk?: number;
  timeOptimal?: boolean;
  smoothness?: number;
}

/**
 * Trajectory state at a specific time
 */
export interface TrajectoryState {
  position: Vector3;
  velocity: Vector3;
  acceleration: Vector3;
  jerk?: Vector3;
  time: number;
}

/**
 * Complete trajectory
 */
export interface Trajectory {
  states: TrajectoryState[];
  duration: number;
  length: number;
  maxVelocity: number;
  maxAcceleration: number;
  sample: (time: number) => TrajectoryState;
}

/**
 * Trajectory optimization options
 */
export interface TrajectoryOptimizationOptions {
  optimizeTime: boolean;
  optimizeEnergy: boolean;
  smoothnessWeight: number;
  constraints: Constraints;
}

/**
 * Spline parameters
 */
export interface SplineParams {
  order: number;
  knots: number[];
  controlPoints: Vector3[];
  coefficients?: number[][];
}

// ============================================================================
// Robot Types
// ============================================================================

/**
 * Robot type
 */
export type RobotType =
  | 'manipulator'
  | 'mobile'
  | 'aerial'
  | 'legged'
  | 'hybrid';

/**
 * Robot arm configuration
 */
export interface RobotArmConfig {
  name: string;
  type: RobotType;
  dofCount: number;
  dhParameters: DHParameters[];
  jointLimits: JointLimits[];
  links: Link[];
  maxVelocity: number[];
  maxAcceleration: number[];
  maxTorque: number[];
  payload?: number;
  baseTransform?: Transform;
}

/**
 * Mobile robot configuration
 */
export interface MobileRobotConfig {
  name: string;
  type: 'differential' | 'ackermann' | 'omnidirectional' | 'mecanum';
  wheelBase: number;
  wheelRadius: number;
  maxLinearVelocity: number;
  maxAngularVelocity: number;
  maxLinearAcceleration?: number;
  maxAngularAcceleration?: number;
  encoderResolution?: number;
  trackWidth?: number; // For differential drive
}

/**
 * Robot state
 */
export interface RobotState {
  jointState: JointSpaceState;
  cartesianPose: Pose3D;
  velocity: Vector3;
  angularVelocity: Vector3;
  timestamp: number;
}

/**
 * End effector type
 */
export type EndEffectorType =
  | 'gripper'
  | 'vacuum'
  | 'tool'
  | 'camera'
  | 'custom';

/**
 * End effector configuration
 */
export interface EndEffector {
  type: EndEffectorType;
  name: string;
  transform: Transform;
  maxGripForce?: number;
  fingerCount?: number;
  toolOffset?: Vector3;
}

// ============================================================================
// Simulation Types
// ============================================================================

/**
 * Simulation configuration
 */
export interface SimulationConfig {
  timestep: number;
  gravity: Vector3;
  enableCollision: boolean;
  enableVisualization: boolean;
  realtime: boolean;
  solverIterations?: number;
}

/**
 * Physics properties
 */
export interface PhysicsProperties {
  mass: number;
  inertia: Matrix;
  friction: number;
  restitution: number;
  damping: number;
}

/**
 * Simulation state
 */
export interface SimulationState {
  time: number;
  robots: RobotState[];
  obstacles: Obstacle[];
  contacts: Contact[];
  energy: number;
}

/**
 * Contact information
 */
export interface Contact {
  bodyA: string;
  bodyB: string;
  point: Vector3;
  normal: Vector3;
  force: number;
}

/**
 * Visualization options
 */
export interface VisualizationOptions {
  showJoints: boolean;
  showLinks: boolean;
  showCollisionShapes: boolean;
  showTrajectory: boolean;
  showForces: boolean;
  showWorkspace: boolean;
  cameraPosition?: Vector3;
  cameraTarget?: Vector3;
}

// ============================================================================
// Sensor Types
// ============================================================================

/**
 * Sensor type
 */
export type SensorType =
  | 'encoder'
  | 'force-torque'
  | 'imu'
  | 'lidar'
  | 'camera'
  | 'proximity';

/**
 * Sensor data
 */
export interface SensorData {
  type: SensorType;
  timestamp: number;
  data: any;
}

/**
 * IMU data
 */
export interface IMUData extends SensorData {
  type: 'imu';
  data: {
    linearAcceleration: Vector3;
    angularVelocity: Vector3;
    orientation: Quaternion;
  };
}

/**
 * Encoder data
 */
export interface EncoderData extends SensorData {
  type: 'encoder';
  data: {
    position: number;
    velocity: number;
    ticks: number;
  };
}

/**
 * LiDAR scan
 */
export interface LiDARScan extends SensorData {
  type: 'lidar';
  data: {
    ranges: number[];
    angles: number[];
    intensities?: number[];
    minRange: number;
    maxRange: number;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Time series data
 */
export interface TimeSeriesData<T> {
  timestamps: number[];
  values: T[];
}

/**
 * Statistics
 */
export interface Statistics {
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  computationTime: number;
  iterationCount: number;
  memoryUsage?: number;
  successRate?: number;
}

/**
 * Result wrapper
 */
export interface Result<T, E = Error> {
  success: boolean;
  value?: T;
  error?: E;
  message?: string;
}

/**
 * Async result
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * System configuration
 */
export interface SystemConfig {
  controlFrequency: number;
  planningFrequency: number;
  simulationFrequency: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics: boolean;
  enableVisualization: boolean;
}

/**
 * Safety configuration
 */
export interface SafetyConfig {
  enableCollisionAvoidance: boolean;
  enableWorkspaceLimits: boolean;
  enableJointLimits: boolean;
  enableVelocityLimits: boolean;
  emergencyStopEnabled: boolean;
  safetyDistance: number;
  forceLimit?: number;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  // Re-export for convenience
  Matrix as MatrixType,
  Vector3 as Position,
  Quaternion as Rotation,
};

/**
 * Type guards
 */
export function isVector3(obj: any): obj is Vector3 {
  return obj && typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.z === 'number';
}

export function isQuaternion(obj: any): obj is Quaternion {
  return obj && typeof obj.w === 'number' && typeof obj.x === 'number' &&
         typeof obj.y === 'number' && typeof obj.z === 'number';
}

export function isPose2D(obj: any): obj is Pose2D {
  return obj && typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.theta === 'number';
}

export function isPose3D(obj: any): obj is Pose3D {
  return obj && isVector3(obj.position) && isQuaternion(obj.orientation);
}

/**
 * Constants
 */
export const EPSILON = 1e-10;
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;
export const GRAVITY = 9.81; // m/s²

/**
 * Default configurations
 */
export const DEFAULT_PID_CONFIG: PIDConfig = {
  kp: 1.0,
  ki: 0.0,
  kd: 0.0,
  outputLimit: 100.0,
  integralLimit: 50.0,
  sampleTime: 0.01
};

export const DEFAULT_MPC_CONFIG: MPCConfig = {
  horizonLength: 20,
  controlInterval: 0.01,
  predictionModel: 'linear',
  costWeights: {
    tracking: 10.0,
    control: 0.1,
    terminal: 20.0
  },
  constraints: {
    positionBounds: { min: -Math.PI, max: Math.PI },
    velocityBounds: { min: -2.0, max: 2.0 },
    accelerationBounds: { min: -5.0, max: 5.0 }
  }
};

export const DEFAULT_TRAJECTORY_CONFIG: TrajectoryConfig = {
  interpolationType: 'cubic-spline',
  maxVelocity: 1.0,
  maxAcceleration: 2.0,
  maxJerk: 10.0,
  timeOptimal: false,
  smoothness: 1.0
};

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  timestep: 0.001,
  gravity: { x: 0, y: 0, z: -9.81 },
  enableCollision: true,
  enableVisualization: false,
  realtime: true,
  solverIterations: 10
};
