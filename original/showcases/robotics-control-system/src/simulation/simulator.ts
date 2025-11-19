/**
 * Robot Simulation Engine
 *
 * Physics-based simulation with:
 * - Forward dynamics
 * - Collision detection
 * - Contact forces
 * - Visualization support
 */

// @ts-ignore
import numpy from 'python:numpy';

import {
  SimulationConfig,
  SimulationState,
  RobotState,
  Obstacle,
  Contact,
  PhysicsProperties,
  Vector3,
  DEFAULT_SIMULATION_CONFIG
} from '../types';
import { RobotArm } from '../robots/robot-arm';
import { MobileRobot } from '../robots/mobile-robot';

/**
 * Physics-based robot simulator
 */
export class RobotSimulator {
  private config: SimulationConfig;
  private state: SimulationState;
  private robots: (RobotArm | MobileRobot)[];
  private obstacles: Obstacle[];
  private running: boolean;
  private simulationTime: number;

  constructor(config?: Partial<SimulationConfig>) {
    this.config = { ...DEFAULT_SIMULATION_CONFIG, ...config };
    this.robots = [];
    this.obstacles = [];
    this.running = false;
    this.simulationTime = 0;

    this.state = {
      time: 0,
      robots: [],
      obstacles: [],
      contacts: [],
      energy: 0
    };
  }

  /**
   * Add robot to simulation
   */
  public addRobot(robot: RobotArm | MobileRobot): void {
    this.robots.push(robot);
  }

  /**
   * Add obstacle to simulation
   */
  public addObstacle(obstacle: Obstacle): void {
    this.obstacles.push(obstacle);
    this.state.obstacles.push(obstacle);
  }

  /**
   * Start simulation
   */
  public start(): void {
    this.running = true;
    this.simulationTime = 0;
    console.log('Simulation started');
  }

  /**
   * Stop simulation
   */
  public stop(): void {
    this.running = false;
    console.log('Simulation stopped');
  }

  /**
   * Step simulation forward
   */
  public step(): void {
    if (!this.running) {
      return;
    }

    const dt = this.config.timestep;

    // Update each robot
    for (let i = 0; i < this.robots.length; i++) {
      const robot = this.robots[i];

      if (robot instanceof RobotArm) {
        this.stepRobotArm(robot, dt);
      } else if (robot instanceof MobileRobot) {
        this.stepMobileRobot(robot, dt);
      }

      this.state.robots[i] = robot.getState ? robot.getState() : {} as RobotState;
    }

    // Detect collisions
    if (this.config.enableCollision) {
      this.detectCollisions();
    }

    // Update time
    this.simulationTime += dt;
    this.state.time = this.simulationTime;

    // Compute total energy
    this.state.energy = this.computeTotalEnergy();
  }

  /**
   * Run simulation for duration
   */
  public async run(duration: number): Promise<void> {
    this.start();

    const steps = Math.ceil(duration / this.config.timestep);
    const startTime = Date.now();

    for (let i = 0; i < steps; i++) {
      this.step();

      // Real-time mode
      if (this.config.realtime) {
        const elapsedTime = (Date.now() - startTime) / 1000;
        const simulationTime = this.simulationTime;

        if (simulationTime > elapsedTime) {
          const sleepTime = (simulationTime - elapsedTime) * 1000;
          await this.sleep(sleepTime);
        }
      }
    }

    this.stop();
  }

  /**
   * Get current simulation state
   */
  public getState(): SimulationState {
    return {
      ...this.state,
      robots: this.state.robots.map(r => ({ ...r })),
      obstacles: this.state.obstacles.map(o => ({ ...o })),
      contacts: this.state.contacts.map(c => ({ ...c }))
    };
  }

  /**
   * Reset simulation
   */
  public reset(): void {
    this.simulationTime = 0;
    this.state = {
      time: 0,
      robots: [],
      obstacles: this.obstacles,
      contacts: [],
      energy: 0
    };
  }

  /**
   * Set gravity
   */
  public setGravity(gravity: Vector3): void {
    this.config.gravity = gravity;
  }

  /**
   * Enable/disable collision detection
   */
  public setCollisionDetection(enabled: boolean): void {
    this.config.enableCollision = enabled;
  }

  /**
   * Get simulation time
   */
  public getTime(): number {
    return this.simulationTime;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Step robot arm forward in time
   */
  private stepRobotArm(robot: RobotArm, dt: number): void {
    // Physics integration would go here
    // For now, we rely on the robot's own update methods
  }

  /**
   * Step mobile robot forward in time
   */
  private stepMobileRobot(robot: MobileRobot, dt: number): void {
    // Update odometry
    robot.updateOdometry(dt);
  }

  /**
   * Detect collisions between robots and obstacles
   */
  private detectCollisions(): void {
    this.state.contacts = [];

    for (let i = 0; i < this.robots.length; i++) {
      const robot = this.robots[i];

      if (robot instanceof RobotArm) {
        // Check link collisions
        const linkPositions = robot.getLinkPositions();

        for (const obstacle of this.obstacles) {
          for (let j = 0; j < linkPositions.length; j++) {
            if (this.checkCollision(linkPositions[j], obstacle)) {
              const contact: Contact = {
                bodyA: `robot${i}_link${j}`,
                bodyB: 'obstacle',
                point: linkPositions[j],
                normal: this.computeCollisionNormal(linkPositions[j], obstacle),
                force: 100 // Simplified
              };

              this.state.contacts.push(contact);
            }
          }
        }
      } else if (robot instanceof MobileRobot) {
        // Check robot base collision
        const pose = robot.getPose();
        const position = { x: pose.x, y: pose.y, z: 0 };

        for (const obstacle of this.obstacles) {
          if (this.checkCollision(position, obstacle)) {
            const contact: Contact = {
              bodyA: `robot${i}_base`,
              bodyB: 'obstacle',
              point: position,
              normal: this.computeCollisionNormal(position, obstacle),
              force: 50
            };

            this.state.contacts.push(contact);
          }
        }
      }
    }
  }

  /**
   * Check if point collides with obstacle
   */
  private checkCollision(point: Vector3, obstacle: Obstacle): boolean {
    switch (obstacle.type) {
      case 'sphere': {
        const dx = point.x - obstacle.position.x;
        const dy = point.y - obstacle.position.y;
        const dz = point.z - obstacle.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        return dist < (obstacle.radius || 0);
      }

      case 'box': {
        const halfSize = {
          x: (obstacle.size?.x || 0) / 2,
          y: (obstacle.size?.y || 0) / 2,
          z: (obstacle.size?.z || 0) / 2
        };

        return (
          Math.abs(point.x - obstacle.position.x) < halfSize.x &&
          Math.abs(point.y - obstacle.position.y) < halfSize.y &&
          Math.abs(point.z - obstacle.position.z) < halfSize.z
        );
      }

      case 'cylinder': {
        const dx = point.x - obstacle.position.x;
        const dy = point.y - obstacle.position.y;
        const dz = point.z - obstacle.position.z;
        const radialDist = Math.sqrt(dx * dx + dy * dy);

        return (
          radialDist < (obstacle.radius || 0) &&
          Math.abs(dz) < (obstacle.height || 0) / 2
        );
      }

      default:
        return false;
    }
  }

  /**
   * Compute collision normal
   */
  private computeCollisionNormal(point: Vector3, obstacle: Obstacle): Vector3 {
    const dx = point.x - obstacle.position.x;
    const dy = point.y - obstacle.position.y;
    const dz = point.z - obstacle.position.z;

    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (length < 1e-6) {
      return { x: 0, y: 0, z: 1 };
    }

    return {
      x: dx / length,
      y: dy / length,
      z: dz / length
    };
  }

  /**
   * Compute total energy in system
   */
  private computeTotalEnergy(): number {
    let energy = 0;

    for (const robot of this.robots) {
      if (robot instanceof RobotArm) {
        const state = robot.getState();

        // Kinetic energy
        const velocities = state.jointState.velocities;
        for (const v of velocities) {
          energy += 0.5 * 1.0 * v * v; // Simplified mass = 1
        }

        // Potential energy (gravity)
        const pos = state.cartesianPose.position;
        energy += 1.0 * 9.81 * pos.z; // Simplified mass = 1
      }
    }

    return energy;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Visualization helper (would integrate with actual visualization library)
 */
export class SimulationVisualizer {
  private simulator: RobotSimulator;
  private canvas?: any;

  constructor(simulator: RobotSimulator) {
    this.simulator = simulator;
  }

  /**
   * Initialize visualization
   */
  public initialize(canvas: any): void {
    this.canvas = canvas;
    console.log('Visualization initialized');
  }

  /**
   * Render current state
   */
  public render(): void {
    const state = this.simulator.getState();

    // Would render robots, obstacles, contacts, etc.
    // This is a placeholder for actual visualization code

    console.log(`Time: ${state.time.toFixed(3)}s, Contacts: ${state.contacts.length}`);
  }

  /**
   * Start animation loop
   */
  public startAnimation(): void {
    const animate = () => {
      this.render();
      requestAnimationFrame(animate);
    };

    animate();
  }
}

/**
 * Trajectory recorder for analysis
 */
export class TrajectoryRecorder {
  private data: {
    time: number[];
    jointPositions: number[][];
    jointVelocities: number[][];
    jointAccelerations: number[][];
    cartesianPositions: Vector3[];
    energy: number[];
  };

  constructor() {
    this.data = {
      time: [],
      jointPositions: [],
      jointVelocities: [],
      jointAccelerations: [],
      cartesianPositions: [],
      energy: []
    };
  }

  /**
   * Record state
   */
  public record(state: RobotState, time: number, energy: number): void {
    this.data.time.push(time);
    this.data.jointPositions.push([...state.jointState.positions]);
    this.data.jointVelocities.push([...state.jointState.velocities]);
    this.data.jointAccelerations.push([...state.jointState.accelerations]);
    this.data.cartesianPositions.push({ ...state.cartesianPose.position });
    this.data.energy.push(energy);
  }

  /**
   * Get recorded data
   */
  public getData(): typeof this.data {
    return { ...this.data };
  }

  /**
   * Export to CSV
   */
  public exportToCSV(): string {
    let csv = 'time,x,y,z,energy\n';

    for (let i = 0; i < this.data.time.length; i++) {
      const pos = this.data.cartesianPositions[i];
      csv += `${this.data.time[i]},${pos.x},${pos.y},${pos.z},${this.data.energy[i]}\n`;
    }

    return csv;
  }

  /**
   * Clear data
   */
  public clear(): void {
    this.data = {
      time: [],
      jointPositions: [],
      jointVelocities: [],
      jointAccelerations: [],
      cartesianPositions: [],
      energy: []
    };
  }
}

export default RobotSimulator;
