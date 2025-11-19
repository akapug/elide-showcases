/**
 * Autonomous Vehicle Demo
 *
 * Demonstrates the complete AV pipeline:
 * - Object detection
 * - Lane detection
 * - Sensor fusion
 * - Path planning
 * - Behavior planning
 * - Vehicle control
 * - Simulation
 */

// @ts-ignore
import cv2 from 'python:cv2'

import { ObjectDetector } from '../src/perception/object-detection'
import { LaneDetector } from '../src/perception/lane-detection'
import { SensorFusion } from '../src/perception/sensor-fusion'
import { PathPlanner } from '../src/planning/path-planner'
import { BehaviorPlanner } from '../src/planning/behavior-planner'
import { VehicleController } from '../src/control/vehicle-controller'
import { HDMapLoader, Localizer } from '../src/mapping/hd-mapping'
import { Simulator } from '../src/simulation/av-simulator'

import type {
  DetectorConfig,
  LaneDetectorConfig,
  SensorFusionConfig,
  PlannerConfig,
  ControllerConfig,
  VehicleState,
  SimulationConfig,
  Trajectory
} from '../src/types'

/**
 * Complete AV System Demo
 */
async function completeAVDemo() {
  console.log('=== Autonomous Vehicle Complete Demo ===\n')

  // ========================================================================
  // 1. Initialize Components
  // ========================================================================

  console.log('1. Initializing AV components...')

  // Perception
  const detectorConfig: DetectorConfig = {
    model: 'yolov8n',
    device: 'cuda',
    confidenceThreshold: 0.5,
    nmsThreshold: 0.45
  }
  const detector = new ObjectDetector(detectorConfig)
  await detector.initialize()

  const laneDetectorConfig: LaneDetectorConfig = {
    method: 'polyfit',
    degree: 2,
    roi: { top: 0.4, bottom: 1.0 }
  }
  const laneDetector = new LaneDetector(laneDetectorConfig)

  const fusionConfig: SensorFusionConfig = {
    method: 'ekf',
    sensors: ['camera', 'lidar', 'radar'],
    processNoise: [[0.1, 0], [0, 0.1]],
    measurementNoise: [[1.0, 0], [0, 1.0]],
    maxAssociationDistance: 3.0,
    minDetections: 2
  }
  const sensorFusion = new SensorFusion(fusionConfig)

  // Planning
  const plannerConfig: PlannerConfig = {
    algorithm: 'hybrid-astar',
    resolution: 0.5,
    lookahead: 50.0,
    constraints: {
      maxSpeed: 15.0,
      maxAcceleration: 3.0,
      maxDeceleration: 8.0,
      maxCurvature: 0.5,
      maxJerk: 2.0,
      minTurningRadius: 5.0,
      safetyMargin: 2.0
    }
  }
  const pathPlanner = new PathPlanner(plannerConfig)

  const behaviorPlanner = new BehaviorPlanner({
    mode: 'fsm',
    safetyMargin: 2.0
  })

  // Control
  const controllerConfig: ControllerConfig = {
    type: 'mpc',
    lookahead: 20.0,
    horizon: 20,
    dt: 0.1
  }
  const controller = new VehicleController(controllerConfig)

  // Mapping
  const mapLoader = new HDMapLoader()
  const map = await mapLoader.load('map.json')
  const localizer = new Localizer(map)

  // Simulation
  const simConfig: SimulationConfig = {
    scenario: 'urban-driving',
    map: 'city_map',
    startPose: { x: 0, y: 0, heading: 0 },
    goalPose: { x: 150, y: 0, heading: 0 },
    traffic: [
      {
        id: 'car_1',
        type: 'car',
        initialPose: { x: 50, y: 0, heading: 0 },
        initialVelocity: 10,
        behavior: 'constant_velocity'
      },
      {
        id: 'car_2',
        type: 'car',
        initialPose: { x: 100, y: -3.7, heading: 0 },
        initialVelocity: 12,
        behavior: 'constant_velocity'
      }
    ],
    weather: {
      type: 'clear',
      intensity: 0,
      visibility: 1000
    },
    timeOfDay: 'day',
    dt: 0.1,
    maxSteps: 3000
  }
  const simulator = new Simulator(simConfig)

  console.log('✓ All components initialized\n')

  // ========================================================================
  // 2. Run Simulation
  // ========================================================================

  console.log('2. Running simulation...')

  let step = 0
  const maxSteps = 1000
  let trajectory: Trajectory | undefined

  while (step < maxSteps && !simulator.isComplete()) {
    // Get sensor data
    const sensorData = simulator.getSensorData()
    const egoState = simulator.getEgoState()

    // Perception
    const cameraObjects = simulator.getDetectedObjects()

    // Sensor fusion
    const fusionResult = await sensorFusion.fuse(
      new Map([['camera', cameraObjects]])
    )
    const trackedObjects = fusionResult.objects

    // Localization
    const localization = localizer.localize(egoState)

    // Path planning (replan every 10 steps)
    if (step % 10 === 0 || !trajectory) {
      const planResult = await pathPlanner.plan({
        start: {
          x: egoState.x,
          y: egoState.y,
          heading: egoState.yaw
        },
        goal: simConfig.goalPose,
        map: map,
        obstacles: trackedObjects
      })

      if (planResult.success) {
        trajectory = planResult.trajectory
      }
    }

    // Behavior planning
    const behavior = behaviorPlanner.plan({
      egoState,
      objects: trackedObjects,
      lanes: { left: undefined, right: undefined, additional: [], laneWidth: 3.7, confidence: 0.8, timestamp: Date.now() },
      trafficLights: [],
      map,
      destination: { x: simConfig.goalPose.x, y: simConfig.goalPose.y }
    })

    // Vehicle control
    if (trajectory) {
      const controlOutput = await controller.compute(
        egoState,
        trajectory,
        behavior.targetSpeed
      )

      // Apply control
      simulator.applyControl(controlOutput.control)
    }

    // Print progress
    if (step % 100 === 0) {
      const stats = simulator.getStatistics()
      console.log(`Step ${step}: Position (${egoState.x.toFixed(1)}, ${egoState.y.toFixed(1)}), ` +
                  `Speed ${egoState.speed.toFixed(1)} m/s, ` +
                  `Behavior: ${behavior.state}`)
    }

    step++
  }

  // ========================================================================
  // 3. Results
  // ========================================================================

  console.log('\n3. Simulation Results:')

  const stats = simulator.getStatistics()
  console.log(`   Steps: ${stats.steps}`)
  console.log(`   Time: ${stats.time.toFixed(1)}s`)
  console.log(`   Distance: ${stats.distance.toFixed(1)}m`)
  console.log(`   Average Speed: ${stats.averageSpeed.toFixed(1)} m/s`)
  console.log(`   Collisions: ${stats.collisions}`)
  console.log(`   Goal Reached: ${stats.reachedGoal ? 'Yes' : 'No'}`)

  console.log('\n✓ Demo complete!\n')
}

/**
 * Object Detection Demo
 */
async function objectDetectionDemo() {
  console.log('=== Object Detection Demo ===\n')

  // Initialize detector
  const config: DetectorConfig = {
    model: 'yolov8n',
    device: 'cuda',
    confidenceThreshold: 0.5,
    nmsThreshold: 0.45
  }

  const detector = new ObjectDetector(config)
  await detector.initialize()

  console.log('Detector initialized\n')

  // Simulate camera frame
  console.log('Processing frame...')

  // In a real scenario, load from file:
  // const frame = cv2.imread('camera.jpg')

  // For demo, simulate detection results
  const startTime = Date.now()

  // Simulated detections
  const objects = [
    {
      id: 0,
      class: 'car' as any,
      confidence: 0.92,
      bbox: { x: 320, y: 240, width: 100, height: 80 },
      position: { x: 15.0, y: 0.0, z: 0.0 },
      distance: 15.0,
      speed: 12.0,
      timestamp: Date.now()
    },
    {
      id: 1,
      class: 'pedestrian' as any,
      confidence: 0.87,
      bbox: { x: 500, y: 300, width: 50, height: 120 },
      position: { x: 8.0, y: 2.0, z: 0.0 },
      distance: 8.2,
      speed: 1.5,
      timestamp: Date.now()
    }
  ]

  const detectionTime = Date.now() - startTime

  console.log(`Detected ${objects.length} objects in ${detectionTime}ms:\n`)

  for (const obj of objects) {
    console.log(`  ${obj.class}: confidence=${(obj.confidence * 100).toFixed(0)}%, ` +
                `distance=${obj.distance!.toFixed(1)}m, speed=${obj.speed!.toFixed(1)}m/s`)
  }

  console.log('\n✓ Object detection demo complete!\n')
}

/**
 * Path Planning Demo
 */
async function pathPlanningDemo() {
  console.log('=== Path Planning Demo ===\n')

  // Initialize planner
  const config: PlannerConfig = {
    algorithm: 'hybrid-astar',
    resolution: 0.5,
    lookahead: 50.0,
    constraints: {
      maxSpeed: 15.0,
      maxAcceleration: 3.0,
      maxDeceleration: 8.0,
      maxCurvature: 0.5,
      maxJerk: 2.0,
      minTurningRadius: 5.0,
      safetyMargin: 2.0
    }
  }

  const planner = new PathPlanner(config)

  console.log(`Using ${config.algorithm} algorithm\n`)

  // Plan path
  console.log('Planning path from (0, 0) to (100, 50)...')

  const startTime = Date.now()

  const result = await planner.plan({
    start: { x: 0, y: 0, heading: 0 },
    goal: { x: 100, y: 50, heading: Math.PI / 4 },
    map: null,
    obstacles: [
      {
        id: 0,
        class: 'obstacle' as any,
        confidence: 1.0,
        bbox: { x: 0, y: 0, width: 0, height: 0 },
        position: { x: 50, y: 25, z: 0 },
        timestamp: Date.now()
      }
    ]
  })

  const planningTime = Date.now() - startTime

  if (result.success) {
    console.log(`✓ Path found in ${planningTime}ms`)
    console.log(`  Waypoints: ${result.trajectory.waypoints.length}`)
    console.log(`  Length: ${result.trajectory.length.toFixed(1)}m`)
    console.log(`  Duration: ${result.trajectory.duration.toFixed(1)}s`)
    console.log(`  Cost: ${result.trajectory.cost.toFixed(2)}`)
    console.log(`  Safe: ${result.trajectory.safe ? 'Yes' : 'No'}`)
  } else {
    console.log(`✗ Planning failed: ${result.error}`)
  }

  console.log('\n✓ Path planning demo complete!\n')
}

/**
 * Control Demo
 */
async function controlDemo() {
  console.log('=== Vehicle Control Demo ===\n')

  // Initialize controller
  const config: ControllerConfig = {
    type: 'mpc',
    lookahead: 20.0,
    horizon: 20,
    dt: 0.1
  }

  const controller = new VehicleController(config)

  console.log(`Using ${config.type} controller\n`)

  // Create simple trajectory
  const trajectory: Trajectory = {
    waypoints: [
      { position: { x: 0, y: 0 }, heading: 0, curvature: 0, velocity: 10 },
      { position: { x: 10, y: 0 }, heading: 0, curvature: 0, velocity: 10 },
      { position: { x: 20, y: 5 }, heading: 0.2, curvature: 0.1, velocity: 10 },
      { position: { x: 30, y: 10 }, heading: 0.4, curvature: 0.1, velocity: 10 }
    ],
    velocities: [10, 10, 10, 10],
    accelerations: [0, 0, 0, 0],
    times: [0, 1, 2, 3],
    cost: 30,
    length: 30,
    duration: 3,
    safe: true,
    feasible: true
  }

  // Vehicle state
  const state: VehicleState = {
    x: 0,
    y: 0,
    z: 0,
    roll: 0,
    pitch: 0,
    yaw: 0,
    vx: 8,
    vy: 0,
    vz: 0,
    wx: 0,
    wy: 0,
    wz: 0,
    ax: 0,
    ay: 0,
    az: 0,
    speed: 8,
    heading: 0,
    steeringAngle: 0,
    steeringRate: 0,
    timestamp: Date.now()
  }

  console.log('Computing control...')

  const output = await controller.compute(state, trajectory, 10.0)

  console.log('\nControl Output:')
  console.log(`  Steering: ${(output.control.steering * 180 / Math.PI).toFixed(2)}°`)
  console.log(`  Throttle: ${(output.control.throttle * 100).toFixed(0)}%`)
  console.log(`  Brake: ${(output.control.brake * 100).toFixed(0)}%`)

  console.log('\nTracking Error:')
  console.log(`  Lateral: ${output.trackingError.lateralError.toFixed(3)}m`)
  console.log(`  Heading: ${(output.trackingError.headingError * 180 / Math.PI).toFixed(2)}°`)
  console.log(`  Velocity: ${output.trackingError.velocityError.toFixed(2)}m/s`)

  console.log('\n✓ Control demo complete!\n')
}

/**
 * Main function
 */
async function main() {
  const demos = [
    { name: 'Complete AV System', fn: completeAVDemo },
    { name: 'Object Detection', fn: objectDetectionDemo },
    { name: 'Path Planning', fn: pathPlanningDemo },
    { name: 'Vehicle Control', fn: controlDemo }
  ]

  // Run demo based on command line argument
  const demoIndex = parseInt(process.argv[2] || '0')

  if (demoIndex >= 0 && demoIndex < demos.length) {
    console.log(`\nRunning: ${demos[demoIndex].name}\n`)
    await demos[demoIndex].fn()
  } else {
    console.log('\n=== Autonomous Vehicle Platform Demo ===\n')
    console.log('Available demos:')
    demos.forEach((demo, i) => {
      console.log(`  ${i}: ${demo.name}`)
    })
    console.log('\nUsage: elide run examples/av-demo.ts [demo_index]')
    console.log('\nRunning complete demo by default...\n')
    await completeAVDemo()
  }
}

// Run main
main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
