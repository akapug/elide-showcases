/**
 * Trajectory Generator
 *
 * Generates smooth trajectories with:
 * - Cubic and quintic spline interpolation
 * - B-splines and Bezier curves
 * - Velocity and acceleration constraints
 * - Time-optimal trajectory generation
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';

import {
  Trajectory,
  TrajectoryConfig,
  TrajectoryState,
  Waypoint,
  Vector3,
  Constraints,
  SplineParams,
  DEFAULT_TRAJECTORY_CONFIG
} from '../types';
import { distance } from '../kinematics/forward-kinematics';

/**
 * Trajectory generator with spline interpolation
 */
export class TrajectoryGenerator {
  private config: TrajectoryConfig;

  constructor(config?: Partial<TrajectoryConfig>) {
    this.config = { ...DEFAULT_TRAJECTORY_CONFIG, ...config };
  }

  /**
   * Generate trajectory from waypoints
   */
  public generate(
    waypoints: Waypoint[],
    options?: Partial<TrajectoryConfig>
  ): Trajectory {
    const config = { ...this.config, ...options };

    if (waypoints.length < 2) {
      throw new Error('At least 2 waypoints required');
    }

    // Assign times if not provided
    waypoints = this.assignTimes(waypoints, config);

    // Generate based on interpolation type
    let states: TrajectoryState[];

    switch (config.interpolationType) {
      case 'linear':
        states = this.generateLinear(waypoints);
        break;
      case 'cubic-spline':
        states = this.generateCubicSpline(waypoints);
        break;
      case 'quintic-spline':
        states = this.generateQuinticSpline(waypoints);
        break;
      case 'b-spline':
        states = this.generateBSpline(waypoints);
        break;
      case 'bezier':
        states = this.generateBezier(waypoints);
        break;
      default:
        states = this.generateCubicSpline(waypoints);
    }

    // Enforce constraints
    states = this.enforceConstraints(states, config);

    // Create trajectory object with sampling function
    const trajectory: Trajectory = {
      states,
      duration: states[states.length - 1].time,
      length: this.computeLength(states),
      maxVelocity: this.computeMaxVelocity(states),
      maxAcceleration: this.computeMaxAcceleration(states),
      sample: (time: number) => this.sampleTrajectory(states, time)
    };

    return trajectory;
  }

  /**
   * Generate linear interpolation
   */
  private generateLinear(waypoints: Waypoint[]): TrajectoryState[] {
    const states: TrajectoryState[] = [];
    const dt = 0.01; // 10ms resolution

    for (let i = 0; i < waypoints.length - 1; i++) {
      const w1 = waypoints[i];
      const w2 = waypoints[i + 1];
      const duration = (w2.time || 0) - (w1.time || 0);
      const steps = Math.ceil(duration / dt);

      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const time = (w1.time || 0) + t * duration;

        const position = this.lerp(w1.position, w2.position, t);

        const velocity = {
          x: (w2.position.x - w1.position.x) / duration,
          y: (w2.position.y - w1.position.y) / duration,
          z: (w2.position.z - w1.position.z) / duration
        };

        states.push({
          position,
          velocity,
          acceleration: { x: 0, y: 0, z: 0 },
          time
        });
      }
    }

    return states;
  }

  /**
   * Generate cubic spline interpolation
   */
  private generateCubicSpline(waypoints: Waypoint[]): TrajectoryState[] {
    const times = waypoints.map(w => w.time || 0);
    const positions = waypoints.map(w => w.position);

    // Extract x, y, z coordinates
    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    const zs = positions.map(p => p.z);

    // Create cubic splines using SciPy
    const splineX = scipy.interpolate.CubicSpline(times, xs);
    const splineY = scipy.interpolate.CubicSpline(times, ys);
    const splineZ = scipy.interpolate.CubicSpline(times, zs);

    // Sample trajectory
    const states: TrajectoryState[] = [];
    const dt = 0.01;
    const duration = times[times.length - 1] - times[0];
    const steps = Math.ceil(duration / dt);

    for (let i = 0; i <= steps; i++) {
      const time = times[0] + (i / steps) * duration;

      const position = {
        x: splineX(time),
        y: splineY(time),
        z: splineZ(time)
      };

      const velocity = {
        x: splineX.derivative(1)(time),
        y: splineY.derivative(1)(time),
        z: splineZ.derivative(1)(time)
      };

      const acceleration = {
        x: splineX.derivative(2)(time),
        y: splineY.derivative(2)(time),
        z: splineZ.derivative(2)(time)
      };

      states.push({ position, velocity, acceleration, time });
    }

    return states;
  }

  /**
   * Generate quintic spline interpolation
   */
  private generateQuinticSpline(waypoints: Waypoint[]): TrajectoryState[] {
    const times = waypoints.map(w => w.time || 0);
    const positions = waypoints.map(w => w.position);

    // Initial and final velocities (zero by default)
    const initialVel = waypoints[0].velocity || { x: 0, y: 0, z: 0 };
    const finalVel = waypoints[waypoints.length - 1].velocity || { x: 0, y: 0, z: 0 };

    // Quintic polynomial coefficients
    const coeffs = this.computeQuinticCoefficients(
      positions[0],
      positions[positions.length - 1],
      initialVel,
      finalVel,
      times[times.length - 1] - times[0]
    );

    const states: TrajectoryState[] = [];
    const dt = 0.01;
    const duration = times[times.length - 1] - times[0];
    const steps = Math.ceil(duration / dt);

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * duration;
      const time = times[0] + t;

      const position = this.evaluateQuintic(coeffs, t, 0);
      const velocity = this.evaluateQuintic(coeffs, t, 1);
      const acceleration = this.evaluateQuintic(coeffs, t, 2);

      states.push({ position, velocity, acceleration, time });
    }

    return states;
  }

  /**
   * Generate B-spline interpolation
   */
  private generateBSpline(waypoints: Waypoint[]): TrajectoryState[] {
    const positions = waypoints.map(w => w.position);
    const controlPoints = this.convertToBSplineControlPoints(positions);

    const states: TrajectoryState[] = [];
    const dt = 0.01;
    const duration = waypoints[waypoints.length - 1].time || 1;
    const steps = Math.ceil(duration / dt);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const time = t * duration;

      const position = this.evaluateBSpline(controlPoints, t, 3);
      const velocity = this.evaluateBSplineDerivative(controlPoints, t, 3, 1);
      const acceleration = this.evaluateBSplineDerivative(controlPoints, t, 3, 2);

      states.push({ position, velocity, acceleration, time });
    }

    return states;
  }

  /**
   * Generate Bezier curve
   */
  private generateBezier(waypoints: Waypoint[]): TrajectoryState[] {
    const positions = waypoints.map(w => w.position);
    const controlPoints = this.generateBezierControlPoints(positions);

    const states: TrajectoryState[] = [];
    const dt = 0.01;
    const duration = waypoints[waypoints.length - 1].time || 1;
    const steps = Math.ceil(duration / dt);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const time = t * duration;

      const position = this.evaluateBezier(controlPoints, t);
      const velocity = this.evaluateBezierDerivative(controlPoints, t, 1);
      const acceleration = this.evaluateBezierDerivative(controlPoints, t, 2);

      states.push({ position, velocity, acceleration, time });
    }

    return states;
  }

  /**
   * Enforce velocity and acceleration constraints
   */
  private enforceConstraints(
    states: TrajectoryState[],
    config: TrajectoryConfig
  ): TrajectoryState[] {
    const constrainedStates: TrajectoryState[] = [];

    for (const state of states) {
      const velMag = this.magnitude(state.velocity);
      const accMag = this.magnitude(state.acceleration);

      let velocity = state.velocity;
      let acceleration = state.acceleration;

      // Limit velocity
      if (velMag > config.maxVelocity) {
        const scale = config.maxVelocity / velMag;
        velocity = {
          x: state.velocity.x * scale,
          y: state.velocity.y * scale,
          z: state.velocity.z * scale
        };
      }

      // Limit acceleration
      if (accMag > config.maxAcceleration) {
        const scale = config.maxAcceleration / accMag;
        acceleration = {
          x: state.acceleration.x * scale,
          y: state.acceleration.y * scale,
          z: state.acceleration.z * scale
        };
      }

      constrainedStates.push({
        ...state,
        velocity,
        acceleration
      });
    }

    return constrainedStates;
  }

  /**
   * Assign times to waypoints
   */
  private assignTimes(
    waypoints: Waypoint[],
    config: TrajectoryConfig
  ): Waypoint[] {
    if (waypoints[0].time !== undefined) {
      // Times already assigned
      return waypoints;
    }

    const result: Waypoint[] = [];
    let currentTime = 0;

    for (let i = 0; i < waypoints.length; i++) {
      if (i > 0) {
        const dist = distance(waypoints[i - 1].position, waypoints[i].position);
        const duration = dist / config.maxVelocity;
        currentTime += duration;
      }

      result.push({
        ...waypoints[i],
        time: currentTime
      });
    }

    return result;
  }

  /**
   * Sample trajectory at specific time
   */
  private sampleTrajectory(states: TrajectoryState[], time: number): TrajectoryState {
    if (time <= states[0].time) {
      return states[0];
    }

    if (time >= states[states.length - 1].time) {
      return states[states.length - 1];
    }

    // Find surrounding states
    for (let i = 1; i < states.length; i++) {
      if (states[i].time >= time) {
        const s1 = states[i - 1];
        const s2 = states[i];
        const t = (time - s1.time) / (s2.time - s1.time);

        return {
          position: this.lerp(s1.position, s2.position, t),
          velocity: this.lerp(s1.velocity, s2.velocity, t),
          acceleration: this.lerp(s1.acceleration, s2.acceleration, t),
          time
        };
      }
    }

    return states[states.length - 1];
  }

  /**
   * Linear interpolation
   */
  private lerp(v1: Vector3, v2: Vector3, t: number): Vector3 {
    return {
      x: v1.x + t * (v2.x - v1.x),
      y: v1.y + t * (v2.y - v1.y),
      z: v1.z + t * (v2.z - v1.z)
    };
  }

  /**
   * Compute quintic polynomial coefficients
   */
  private computeQuinticCoefficients(
    p0: Vector3,
    p1: Vector3,
    v0: Vector3,
    v1: Vector3,
    duration: number
  ): { x: number[]; y: number[]; z: number[] } {
    const T = duration;

    // Quintic polynomial: p(t) = a0 + a1*t + a2*t^2 + a3*t^3 + a4*t^4 + a5*t^5
    const computeAxis = (p0: number, p1: number, v0: number, v1: number) => {
      const a0 = p0;
      const a1 = v0;
      const a2 = 0;
      const a3 = (20 * p1 - 20 * p0 - (8 * v1 + 12 * v0) * T) / (2 * T * T * T);
      const a4 = (30 * p0 - 30 * p1 + (14 * v1 + 16 * v0) * T) / (2 * T * T * T * T);
      const a5 = (12 * p1 - 12 * p0 - (6 * v1 + 6 * v0) * T) / (2 * T * T * T * T * T);

      return [a0, a1, a2, a3, a4, a5];
    };

    return {
      x: computeAxis(p0.x, p1.x, v0.x, v1.x),
      y: computeAxis(p0.y, p1.y, v0.y, v1.y),
      z: computeAxis(p0.z, p1.z, v0.z, v1.z)
    };
  }

  /**
   * Evaluate quintic polynomial
   */
  private evaluateQuintic(
    coeffs: { x: number[]; y: number[]; z: number[] },
    t: number,
    derivative: number
  ): Vector3 {
    const evalAxis = (a: number[], t: number, deriv: number): number => {
      if (deriv === 0) {
        return a[0] + a[1] * t + a[2] * t * t + a[3] * t * t * t +
               a[4] * t * t * t * t + a[5] * t * t * t * t * t;
      } else if (deriv === 1) {
        return a[1] + 2 * a[2] * t + 3 * a[3] * t * t +
               4 * a[4] * t * t * t + 5 * a[5] * t * t * t * t;
      } else {
        return 2 * a[2] + 6 * a[3] * t + 12 * a[4] * t * t + 20 * a[5] * t * t * t;
      }
    };

    return {
      x: evalAxis(coeffs.x, t, derivative),
      y: evalAxis(coeffs.y, t, derivative),
      z: evalAxis(coeffs.z, t, derivative)
    };
  }

  /**
   * Convert waypoints to B-spline control points
   */
  private convertToBSplineControlPoints(positions: Vector3[]): Vector3[] {
    // Simplified: use positions as control points
    return positions;
  }

  /**
   * Evaluate B-spline
   */
  private evaluateBSpline(controlPoints: Vector3[], t: number, degree: number): Vector3 {
    const n = controlPoints.length - 1;
    const i = Math.min(Math.floor(t * n), n - 1);
    const localT = t * n - i;

    // Cubic B-spline basis functions
    const b0 = (1 - localT) * (1 - localT) * (1 - localT) / 6;
    const b1 = (3 * localT * localT * localT - 6 * localT * localT + 4) / 6;
    const b2 = (-3 * localT * localT * localT + 3 * localT * localT + 3 * localT + 1) / 6;
    const b3 = localT * localT * localT / 6;

    const idx = Math.max(0, Math.min(i, n - 3));

    return {
      x: b0 * controlPoints[idx].x + b1 * controlPoints[idx + 1].x +
         b2 * controlPoints[idx + 2].x + b3 * controlPoints[idx + 3].x,
      y: b0 * controlPoints[idx].y + b1 * controlPoints[idx + 1].y +
         b2 * controlPoints[idx + 2].y + b3 * controlPoints[idx + 3].y,
      z: b0 * controlPoints[idx].z + b1 * controlPoints[idx + 1].z +
         b2 * controlPoints[idx + 2].z + b3 * controlPoints[idx + 3].z
    };
  }

  /**
   * Evaluate B-spline derivative
   */
  private evaluateBSplineDerivative(
    controlPoints: Vector3[],
    t: number,
    degree: number,
    derivative: number
  ): Vector3 {
    const epsilon = 0.001;
    const p1 = this.evaluateBSpline(controlPoints, Math.max(0, t - epsilon), degree);
    const p2 = this.evaluateBSpline(controlPoints, Math.min(1, t + epsilon), degree);

    const scale = 1 / (2 * epsilon);

    return {
      x: (p2.x - p1.x) * scale,
      y: (p2.y - p1.y) * scale,
      z: (p2.z - p1.z) * scale
    };
  }

  /**
   * Generate Bezier control points
   */
  private generateBezierControlPoints(positions: Vector3[]): Vector3[] {
    // Simplified: use positions as control points
    return positions;
  }

  /**
   * Evaluate Bezier curve
   */
  private evaluateBezier(controlPoints: Vector3[], t: number): Vector3 {
    const n = controlPoints.length - 1;

    // De Casteljau's algorithm
    let points = [...controlPoints];

    for (let i = 1; i <= n; i++) {
      const newPoints: Vector3[] = [];
      for (let j = 0; j < points.length - 1; j++) {
        newPoints.push(this.lerp(points[j], points[j + 1], t));
      }
      points = newPoints;
    }

    return points[0];
  }

  /**
   * Evaluate Bezier derivative
   */
  private evaluateBezierDerivative(
    controlPoints: Vector3[],
    t: number,
    derivative: number
  ): Vector3 {
    const epsilon = 0.001;
    const p1 = this.evaluateBezier(controlPoints, Math.max(0, t - epsilon));
    const p2 = this.evaluateBezier(controlPoints, Math.min(1, t + epsilon));

    const scale = 1 / (2 * epsilon);

    return {
      x: (p2.x - p1.x) * scale,
      y: (p2.y - p1.y) * scale,
      z: (p2.z - p1.z) * scale
    };
  }

  /**
   * Compute trajectory length
   */
  private computeLength(states: TrajectoryState[]): number {
    let length = 0;
    for (let i = 1; i < states.length; i++) {
      length += distance(states[i - 1].position, states[i].position);
    }
    return length;
  }

  /**
   * Compute maximum velocity
   */
  private computeMaxVelocity(states: TrajectoryState[]): number {
    let maxVel = 0;
    for (const state of states) {
      const vel = this.magnitude(state.velocity);
      if (vel > maxVel) {
        maxVel = vel;
      }
    }
    return maxVel;
  }

  /**
   * Compute maximum acceleration
   */
  private computeMaxAcceleration(states: TrajectoryState[]): number {
    let maxAcc = 0;
    for (const state of states) {
      const acc = this.magnitude(state.acceleration);
      if (acc > maxAcc) {
        maxAcc = acc;
      }
    }
    return maxAcc;
  }

  /**
   * Compute vector magnitude
   */
  private magnitude(v: Vector3): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  /**
   * Optimize trajectory for time
   */
  public optimizeTime(trajectory: Trajectory, constraints: Constraints): Trajectory {
    // Time-optimal trajectory generation would go here
    // This is a placeholder that returns the original trajectory
    return trajectory;
  }
}

export default TrajectoryGenerator;
