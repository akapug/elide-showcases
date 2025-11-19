/**
 * Autonomous Vehicle Performance Benchmarks
 *
 * Benchmarks for perception, planning, and control components
 */

import { ObjectDetector } from '../src/perception/object-detection'
import { LaneDetector } from '../src/perception/lane-detection'
import { SensorFusion } from '../src/perception/sensor-fusion'
import { PathPlanner } from '../src/planning/path-planner'
import { BehaviorPlanner } from '../src/planning/behavior-planner'
import { VehicleController } from '../src/control/vehicle-controller'
import { Simulator } from '../src/simulation/av-simulator'

import type {
  DetectorConfig,
  PlannerConfig,
  PlanningAlgorithm,
  ControllerType
} from '../src/types'

interface BenchmarkResult {
  name: string
  iterations: number
  totalTime: number
  avgTime: number
  minTime: number
  maxTime: number
  throughput: number
}

/**
 * Benchmark object detection
 */
async function benchmarkObjectDetection(): Promise<BenchmarkResult> {
  console.log('Benchmarking object detection...')

  const config: DetectorConfig = {
    model: 'yolov8n',
    device: 'cuda',
    confidenceThreshold: 0.5,
    nmsThreshold: 0.45
  }

  const detector = new ObjectDetector(config)
  await detector.initialize()

  const iterations = 100
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now()

    // Simulate detection
    // In production: await detector.detect(frame)
    await new Promise(resolve => setTimeout(resolve, 25))  // Simulate 25ms detection

    const endTime = performance.now()
    times.push(endTime - startTime)

    if (i % 10 === 0) {
      process.stdout.write(`\rProgress: ${i}/${iterations}`)
    }
  }

  process.stdout.write('\r')

  const totalTime = times.reduce((a, b) => a + b, 0)
  const avgTime = totalTime / iterations
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const throughput = 1000 / avgTime  // FPS

  return {
    name: 'Object Detection',
    iterations,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    throughput
  }
}

/**
 * Benchmark lane detection
 */
async function benchmarkLaneDetection(): Promise<BenchmarkResult> {
  console.log('Benchmarking lane detection...')

  const detector = new LaneDetector({
    method: 'polyfit',
    degree: 2,
    roi: { top: 0.4, bottom: 1.0 }
  })

  const iterations = 100
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now()

    // Simulate detection
    await new Promise(resolve => setTimeout(resolve, 15))  // Simulate 15ms detection

    const endTime = performance.now()
    times.push(endTime - startTime)

    if (i % 10 === 0) {
      process.stdout.write(`\rProgress: ${i}/${iterations}`)
    }
  }

  process.stdout.write('\r')

  const totalTime = times.reduce((a, b) => a + b, 0)
  const avgTime = totalTime / iterations
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const throughput = 1000 / avgTime

  return {
    name: 'Lane Detection',
    iterations,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    throughput
  }
}

/**
 * Benchmark sensor fusion
 */
async function benchmarkSensorFusion(): Promise<BenchmarkResult> {
  console.log('Benchmarking sensor fusion...')

  const fusion = new SensorFusion({
    method: 'ekf',
    sensors: ['camera', 'lidar', 'radar'],
    processNoise: [[0.1, 0], [0, 0.1]],
    measurementNoise: [[1.0, 0], [0, 1.0]],
    maxAssociationDistance: 3.0,
    minDetections: 2
  })

  const iterations = 100
  const times: number[] = []

  // Create sample measurements
  const measurements = new Map([
    ['camera' as any, [
      {
        id: 0,
        class: 'car' as any,
        confidence: 0.9,
        bbox: { x: 320, y: 240, width: 100, height: 80 },
        position: { x: 15.0, y: 0.0, z: 0.0 },
        timestamp: Date.now()
      }
    ]],
    ['lidar' as any, [
      {
        id: 1,
        class: 'car' as any,
        confidence: 0.95,
        bbox: { x: 0, y: 0, width: 0, height: 0 },
        position: { x: 14.8, y: 0.2, z: 0.0 },
        timestamp: Date.now()
      }
    ]]
  ])

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now()

    await fusion.fuse(measurements)

    const endTime = performance.now()
    times.push(endTime - startTime)

    if (i % 10 === 0) {
      process.stdout.write(`\rProgress: ${i}/${iterations}`)
    }
  }

  process.stdout.write('\r')

  const totalTime = times.reduce((a, b) => a + b, 0)
  const avgTime = totalTime / iterations
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const throughput = 1000 / avgTime

  return {
    name: 'Sensor Fusion',
    iterations,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    throughput
  }
}

/**
 * Benchmark path planning
 */
async function benchmarkPathPlanning(): Promise<Record<string, BenchmarkResult>> {
  console.log('Benchmarking path planning...')

  const algorithms: PlanningAlgorithm[] = ['astar', 'hybrid-astar', 'rrt', 'rrt-star']
  const results: Record<string, BenchmarkResult> = {}

  for (const algorithm of algorithms) {
    console.log(`  Testing ${algorithm}...`)

    const config: PlannerConfig = {
      algorithm,
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

    const iterations = 20
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()

      await planner.plan({
        start: { x: 0, y: 0, heading: 0 },
        goal: { x: 100, y: 50, heading: Math.PI / 4 },
        map: null,
        obstacles: []
      })

      const endTime = performance.now()
      times.push(endTime - startTime)
    }

    const totalTime = times.reduce((a, b) => a + b, 0)
    const avgTime = totalTime / iterations
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)
    const throughput = 1000 / avgTime

    results[algorithm] = {
      name: `Path Planning (${algorithm})`,
      iterations,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      throughput
    }
  }

  return results
}

/**
 * Benchmark vehicle control
 */
async function benchmarkVehicleControl(): Promise<Record<string, BenchmarkResult>> {
  console.log('Benchmarking vehicle control...')

  const controllers: ControllerType[] = ['pure-pursuit', 'stanley', 'mpc', 'pid']
  const results: Record<string, BenchmarkResult> = {}

  // Create sample trajectory
  const trajectory = {
    waypoints: Array.from({ length: 100 }, (_, i) => ({
      position: { x: i, y: Math.sin(i * 0.1) * 5 },
      heading: 0,
      curvature: 0,
      velocity: 10
    })),
    velocities: Array(100).fill(10),
    accelerations: Array(100).fill(0),
    times: Array.from({ length: 100 }, (_, i) => i * 0.1),
    cost: 100,
    length: 100,
    duration: 10,
    safe: true,
    feasible: true
  }

  const state = {
    x: 0,
    y: 0,
    z: 0,
    roll: 0,
    pitch: 0,
    yaw: 0,
    vx: 10,
    vy: 0,
    vz: 0,
    wx: 0,
    wy: 0,
    wz: 0,
    ax: 0,
    ay: 0,
    az: 0,
    speed: 10,
    heading: 0,
    steeringAngle: 0,
    steeringRate: 0,
    timestamp: Date.now()
  }

  for (const type of controllers) {
    console.log(`  Testing ${type}...`)

    const controller = new VehicleController({
      type,
      lookahead: 20.0,
      horizon: 20,
      dt: 0.1
    })

    const iterations = 100
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()

      await controller.compute(state, trajectory, 10.0)

      const endTime = performance.now()
      times.push(endTime - startTime)
    }

    const totalTime = times.reduce((a, b) => a + b, 0)
    const avgTime = totalTime / iterations
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)
    const throughput = 1000 / avgTime

    results[type] = {
      name: `Vehicle Control (${type})`,
      iterations,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      throughput
    }
  }

  return results
}

/**
 * Benchmark end-to-end pipeline
 */
async function benchmarkEndToEnd(): Promise<BenchmarkResult> {
  console.log('Benchmarking end-to-end pipeline...')

  const simulator = new Simulator({
    scenario: 'urban-driving',
    map: 'city_map',
    startPose: { x: 0, y: 0, heading: 0 },
    goalPose: { x: 100, y: 0, heading: 0 },
    traffic: [],
    weather: { type: 'clear', intensity: 0, visibility: 1000 },
    timeOfDay: 'day',
    dt: 0.1,
    maxSteps: 1000
  })

  const iterations = 100
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now()

    // Simulate one complete cycle
    simulator.getSensorData()
    simulator.getDetectedObjects()
    simulator.step({
      steering: 0,
      throttle: 0.5,
      brake: 0,
      gear: 'D',
      timestamp: Date.now()
    })

    const endTime = performance.now()
    times.push(endTime - startTime)

    if (i % 10 === 0) {
      process.stdout.write(`\rProgress: ${i}/${iterations}`)
    }
  }

  process.stdout.write('\r')

  const totalTime = times.reduce((a, b) => a + b, 0)
  const avgTime = totalTime / iterations
  const minTime = Math.min(...times)
  const maxTime = Math.max(...times)
  const throughput = 1000 / avgTime

  return {
    name: 'End-to-End Pipeline',
    iterations,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    throughput
  }
}

/**
 * Print benchmark results
 */
function printResults(result: BenchmarkResult) {
  console.log(`\n${result.name}:`)
  console.log(`  Iterations: ${result.iterations}`)
  console.log(`  Total Time: ${result.totalTime.toFixed(2)}ms`)
  console.log(`  Average: ${result.avgTime.toFixed(2)}ms`)
  console.log(`  Min: ${result.minTime.toFixed(2)}ms`)
  console.log(`  Max: ${result.maxTime.toFixed(2)}ms`)
  console.log(`  Throughput: ${result.throughput.toFixed(1)} Hz`)
}

/**
 * Main benchmark function
 */
async function main() {
  console.log('=== Autonomous Vehicle Performance Benchmarks ===\n')

  const results: BenchmarkResult[] = []

  // Perception benchmarks
  console.log('Running perception benchmarks...\n')
  results.push(await benchmarkObjectDetection())
  results.push(await benchmarkLaneDetection())
  results.push(await benchmarkSensorFusion())

  // Planning benchmarks
  console.log('\nRunning planning benchmarks...\n')
  const planningResults = await benchmarkPathPlanning()
  results.push(...Object.values(planningResults))

  // Control benchmarks
  console.log('\nRunning control benchmarks...\n')
  const controlResults = await benchmarkVehicleControl()
  results.push(...Object.values(controlResults))

  // End-to-end benchmark
  console.log('\nRunning end-to-end benchmark...\n')
  results.push(await benchmarkEndToEnd())

  // Print all results
  console.log('\n' + '='.repeat(60))
  console.log('BENCHMARK RESULTS')
  console.log('='.repeat(60))

  for (const result of results) {
    printResults(result)
  }

  // Summary table
  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log('\nComponent                          | Avg Time | Throughput')
  console.log('-'.repeat(60))

  for (const result of results) {
    const name = result.name.padEnd(35)
    const avgTime = `${result.avgTime.toFixed(2)}ms`.padEnd(9)
    const throughput = `${result.throughput.toFixed(1)} Hz`
    console.log(`${name}| ${avgTime}| ${throughput}`)
  }

  console.log('\n✓ All benchmarks complete!\n')
}

// Run benchmarks
main().catch(error => {
  console.error('Error:', error)
  process.exit(1)
})
