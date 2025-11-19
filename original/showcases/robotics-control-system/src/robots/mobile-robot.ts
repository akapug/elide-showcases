/**
 * Mobile Robot Implementation
 *
 * Differential drive mobile robot with:
 * - Odometry and localization
 * - Path following (pure pursuit, Stanley)
 * - Velocity control
 * - Obstacle avoidance
 */

// @ts-ignore
import numpy from 'python:numpy';

import {
  MobileRobotConfig,
  Pose2D,
  Vector3,
  Vector2,
  Path,
  Waypoint,
  Obstacle
} from '../types';
import { PIDController } from '../control/pid-controller';

/**
 * Differential drive mobile robot
 */
export class MobileRobot {
  private config: MobileRobotConfig;
  private pose: Pose2D;
  private linearVelocity: number;
  private angularVelocity: number;
  private leftWheelVelocity: number;
  private rightWheelVelocity: number;
  private odometry: { leftTicks: number; rightTicks: number };
  private linearController: PIDController;
  private angularController: PIDController;

  constructor(config: MobileRobotConfig) {
    this.config = config;
    this.pose = { x: 0, y: 0, theta: 0 };
    this.linearVelocity = 0;
    this.angularVelocity = 0;
    this.leftWheelVelocity = 0;
    this.rightWheelVelocity = 0;
    this.odometry = { leftTicks: 0, rightTicks: 0 };

    // Initialize controllers
    this.linearController = new PIDController({
      kp: 1.0,
      ki: 0.1,
      kd: 0.05
    });

    this.angularController = new PIDController({
      kp: 2.0,
      ki: 0.2,
      kd: 0.1
    });
  }

  /**
   * Set robot pose
   */
  public setPose(pose: Pose2D): void {
    this.pose = { ...pose };
  }

  /**
   * Get current pose
   */
  public getPose(): Pose2D {
    return { ...this.pose };
  }

  /**
   * Set velocity (linear and angular)
   */
  public setVelocity(linear: number, angular: number): void {
    // Clamp to limits
    this.linearVelocity = Math.max(
      -this.config.maxLinearVelocity,
      Math.min(this.config.maxLinearVelocity, linear)
    );

    this.angularVelocity = Math.max(
      -this.config.maxAngularVelocity,
      Math.min(this.config.maxAngularVelocity, angular)
    );

    // Convert to wheel velocities
    this.updateWheelVelocities();
  }

  /**
   * Set wheel velocities directly
   */
  public setWheelVelocities(left: number, right: number): void {
    this.leftWheelVelocity = left;
    this.rightWheelVelocity = right;

    // Convert to body velocities
    this.linearVelocity = this.config.wheelRadius * (left + right) / 2;
    this.angularVelocity = this.config.wheelRadius * (right - left) / this.config.wheelBase;
  }

  /**
   * Update odometry
   */
  public updateOdometry(dt: number): void {
    // Update position using differential drive kinematics
    const dx = this.linearVelocity * Math.cos(this.pose.theta) * dt;
    const dy = this.linearVelocity * Math.sin(this.pose.theta) * dt;
    const dtheta = this.angularVelocity * dt;

    this.pose.x += dx;
    this.pose.y += dy;
    this.pose.theta += dtheta;

    // Normalize theta to [-pi, pi]
    this.pose.theta = this.normalizeAngle(this.pose.theta);

    // Update encoder ticks
    if (this.config.encoderResolution) {
      const leftDist = this.leftWheelVelocity * dt;
      const rightDist = this.rightWheelVelocity * dt;

      this.odometry.leftTicks += leftDist * this.config.encoderResolution;
      this.odometry.rightTicks += rightDist * this.config.encoderResolution;
    }
  }

  /**
   * Follow path using pure pursuit controller
   */
  public async followPath(
    path: Path,
    options?: {
      lookaheadDistance?: number;
      maxLinearVelocity?: number;
      maxAngularVelocity?: number;
    }
  ): Promise<void> {
    const lookahead = options?.lookaheadDistance || 0.3;
    const maxLinVel = options?.maxLinearVelocity || this.config.maxLinearVelocity;
    const maxAngVel = options?.maxAngularVelocity || this.config.maxAngularVelocity;

    const dt = 0.05; // 20Hz control

    for (const waypoint of path.waypoints) {
      const goal = { x: waypoint.position.x, y: waypoint.position.y };

      while (!this.atGoal(goal, 0.1)) {
        // Compute lookahead point
        const lookaheadPoint = this.computeLookaheadPoint(path, lookahead);

        // Pure pursuit control
        const { linear, angular } = this.computePurePursuitControl(
          lookaheadPoint,
          lookahead,
          maxLinVel
        );

        this.setVelocity(linear, angular);
        this.updateOdometry(dt);

        await this.sleep(dt * 1000);
      }
    }

    // Stop at goal
    this.setVelocity(0, 0);
  }

  /**
   * Compute pure pursuit control
   */
  public computePurePursuitControl(
    lookaheadPoint: { x: number; y: number },
    lookaheadDistance: number,
    maxVelocity: number
  ): { linear: number; angular: number } {
    // Transform lookahead point to robot frame
    const dx = lookaheadPoint.x - this.pose.x;
    const dy = lookaheadPoint.y - this.pose.y;

    const localX = dx * Math.cos(this.pose.theta) + dy * Math.sin(this.pose.theta);
    const localY = -dx * Math.sin(this.pose.theta) + dy * Math.cos(this.pose.theta);

    // Compute curvature
    const curvature = 2 * localY / (lookaheadDistance * lookaheadDistance);

    // Compute velocities
    const linear = maxVelocity;
    const angular = curvature * linear;

    return {
      linear: Math.min(linear, this.config.maxLinearVelocity),
      angular: Math.max(
        -this.config.maxAngularVelocity,
        Math.min(this.config.maxAngularVelocity, angular)
      )
    };
  }

  /**
   * Compute Stanley controller output
   */
  public computeStanleyControl(
    path: Path,
    k: number = 0.5
  ): { linear: number; angular: number } {
    // Find closest point on path
    const closestPoint = this.findClosestPointOnPath(path);

    // Compute heading error
    const pathHeading = closestPoint.heading || 0;
    const headingError = this.normalizeAngle(pathHeading - this.pose.theta);

    // Compute cross-track error
    const dx = closestPoint.x - this.pose.x;
    const dy = closestPoint.y - this.pose.y;
    const crossTrackError = -dx * Math.sin(this.pose.theta) + dy * Math.cos(this.pose.theta);

    // Stanley control law
    const linear = this.config.maxLinearVelocity * 0.8;
    const angular = headingError + Math.atan2(k * crossTrackError, linear);

    return {
      linear: Math.min(linear, this.config.maxLinearVelocity),
      angular: Math.max(
        -this.config.maxAngularVelocity,
        Math.min(this.config.maxAngularVelocity, angular)
      )
    };
  }

  /**
   * Compute dynamic window approach for obstacle avoidance
   */
  public computeDWA(
    obstacles: Obstacle[],
    goal: { x: number; y: number }
  ): { linear: number; angular: number } {
    const dt = 0.1;
    const vResolution = 0.1;
    const wResolution = 0.1;

    let bestScore = -Infinity;
    let bestV = 0;
    let bestW = 0;

    // Dynamic window
    const vMin = Math.max(
      this.linearVelocity - (this.config.maxLinearAcceleration || 2) * dt,
      0
    );
    const vMax = Math.min(
      this.linearVelocity + (this.config.maxLinearAcceleration || 2) * dt,
      this.config.maxLinearVelocity
    );

    const wMin = Math.max(
      this.angularVelocity - (this.config.maxAngularAcceleration || 3) * dt,
      -this.config.maxAngularVelocity
    );
    const wMax = Math.min(
      this.angularVelocity + (this.config.maxAngularAcceleration || 3) * dt,
      this.config.maxAngularVelocity
    );

    // Search dynamic window
    for (let v = vMin; v <= vMax; v += vResolution) {
      for (let w = wMin; w <= wMax; w += wResolution) {
        // Simulate trajectory
        const trajectory = this.simulateTrajectory(v, w, dt, 10);

        // Check collision
        if (this.trajectoryCollides(trajectory, obstacles)) {
          continue;
        }

        // Compute score
        const score = this.computeDWAScore(trajectory, goal, v, w);

        if (score > bestScore) {
          bestScore = score;
          bestV = v;
          bestW = w;
        }
      }
    }

    return { linear: bestV, angular: bestW };
  }

  /**
   * Localize using landmarks (simplified)
   */
  public localize(landmarks: { position: Vector2; id: number }[]): Pose2D {
    // Simplified localization - would use particle filter or EKF in practice
    if (landmarks.length === 0) {
      return this.pose;
    }

    // Use odometry with landmark correction
    return this.pose;
  }

  /**
   * Scan environment (simulated)
   */
  public async scanEnvironment(): Promise<Obstacle[]> {
    // Would interface with actual sensors (LiDAR, cameras)
    return [];
  }

  /**
   * Check if at goal
   */
  public atGoal(goal: { x: number; y: number }, tolerance = 0.1): boolean {
    const dx = goal.x - this.pose.x;
    const dy = goal.y - this.pose.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < tolerance;
  }

  /**
   * Get current velocities
   */
  public getVelocities(): { linear: number; angular: number } {
    return {
      linear: this.linearVelocity,
      angular: this.angularVelocity
    };
  }

  /**
   * Reset odometry
   */
  public resetOdometry(): void {
    this.odometry = { leftTicks: 0, rightTicks: 0 };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Update wheel velocities from body velocities
   */
  private updateWheelVelocities(): void {
    // Differential drive inverse kinematics
    this.leftWheelVelocity = (
      this.linearVelocity - this.angularVelocity * this.config.wheelBase / 2
    ) / this.config.wheelRadius;

    this.rightWheelVelocity = (
      this.linearVelocity + this.angularVelocity * this.config.wheelBase / 2
    ) / this.config.wheelRadius;
  }

  /**
   * Normalize angle to [-pi, pi]
   */
  private normalizeAngle(angle: number): number {
    while (angle > Math.PI) {
      angle -= 2 * Math.PI;
    }
    while (angle < -Math.PI) {
      angle += 2 * Math.PI;
    }
    return angle;
  }

  /**
   * Compute lookahead point on path
   */
  private computeLookaheadPoint(
    path: Path,
    lookaheadDistance: number
  ): { x: number; y: number } {
    // Find point on path at lookahead distance
    for (let i = 1; i < path.waypoints.length; i++) {
      const p1 = path.waypoints[i - 1].position;
      const p2 = path.waypoints[i].position;

      const dx1 = p1.x - this.pose.x;
      const dy1 = p1.y - this.pose.y;
      const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

      const dx2 = p2.x - this.pose.x;
      const dy2 = p2.y - this.pose.y;
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      if (dist2 >= lookaheadDistance && dist1 < lookaheadDistance) {
        // Interpolate
        const t = (lookaheadDistance - dist1) / (dist2 - dist1);
        return {
          x: p1.x + t * (p2.x - p1.x),
          y: p1.y + t * (p2.y - p1.y)
        };
      }
    }

    // Return goal if no point found
    const goal = path.waypoints[path.waypoints.length - 1].position;
    return { x: goal.x, y: goal.y };
  }

  /**
   * Find closest point on path
   */
  private findClosestPointOnPath(
    path: Path
  ): { x: number; y: number; heading?: number } {
    let minDist = Infinity;
    let closest = { x: 0, y: 0, heading: 0 };

    for (const waypoint of path.waypoints) {
      const dx = waypoint.position.x - this.pose.x;
      const dy = waypoint.position.y - this.pose.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < minDist) {
        minDist = dist;
        closest = {
          x: waypoint.position.x,
          y: waypoint.position.y,
          heading: Math.atan2(dy, dx)
        };
      }
    }

    return closest;
  }

  /**
   * Simulate trajectory
   */
  private simulateTrajectory(
    v: number,
    w: number,
    dt: number,
    steps: number
  ): Pose2D[] {
    const trajectory: Pose2D[] = [];
    let pose = { ...this.pose };

    for (let i = 0; i < steps; i++) {
      pose.x += v * Math.cos(pose.theta) * dt;
      pose.y += v * Math.sin(pose.theta) * dt;
      pose.theta += w * dt;

      trajectory.push({ ...pose });
    }

    return trajectory;
  }

  /**
   * Check if trajectory collides with obstacles
   */
  private trajectoryCollides(trajectory: Pose2D[], obstacles: Obstacle[]): boolean {
    for (const pose of trajectory) {
      for (const obstacle of obstacles) {
        const dx = pose.x - obstacle.position.x;
        const dy = pose.y - obstacle.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (obstacle.type === 'sphere' && dist < (obstacle.radius || 0) + 0.3) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Compute DWA score
   */
  private computeDWAScore(
    trajectory: Pose2D[],
    goal: { x: number; y: number },
    v: number,
    w: number
  ): number {
    const lastPose = trajectory[trajectory.length - 1];

    // Heading to goal
    const dx = goal.x - lastPose.x;
    const dy = goal.y - lastPose.y;
    const angleToGoal = Math.atan2(dy, dx);
    const headingScore = 1 - Math.abs(this.normalizeAngle(angleToGoal - lastPose.theta)) / Math.PI;

    // Distance to goal
    const dist = Math.sqrt(dx * dx + dy * dy);
    const distScore = 1 / (1 + dist);

    // Velocity score (prefer higher velocities)
    const velScore = v / this.config.maxLinearVelocity;

    // Combined score
    return 2.0 * headingScore + 1.0 * distScore + 0.5 * velScore;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Predefined mobile robot configurations
 */
export const MobileRobotConfigs = {
  /**
   * TurtleBot 3 Burger
   */
  TurtleBot3: {
    name: 'TurtleBot3',
    type: 'differential' as const,
    wheelBase: 0.16,
    wheelRadius: 0.033,
    maxLinearVelocity: 0.22,
    maxAngularVelocity: 2.84,
    maxLinearAcceleration: 1.0,
    maxAngularAcceleration: 3.0,
    encoderResolution: 4096
  },

  /**
   * Pioneer 3-DX
   */
  Pioneer3DX: {
    name: 'Pioneer 3-DX',
    type: 'differential' as const,
    wheelBase: 0.33,
    wheelRadius: 0.0975,
    maxLinearVelocity: 1.2,
    maxAngularVelocity: 4.0,
    maxLinearAcceleration: 2.0,
    maxAngularAcceleration: 5.0,
    encoderResolution: 500
  }
};

export default MobileRobot;
