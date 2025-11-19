/**
 * Inverse Kinematics Solver
 *
 * Implements multiple IK algorithms:
 * - Jacobian-based iterative solver
 * - FABRIK (Forward And Backward Reaching Inverse Kinematics)
 * - CCD (Cyclic Coordinate Descent)
 * - Optimization-based using SciPy
 */

// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';

import {
  Vector3,
  InverseKinematicsOptions,
  InverseKinematicsResult,
  DHParameters,
  JointLimits,
  EPSILON
} from '../types';
import { ForwardKinematics, distance, normalize, dot } from './forward-kinematics';

/**
 * Inverse kinematics solver with multiple algorithms
 */
export class InverseKinematics {
  private forwardKinematics: ForwardKinematics;
  private jointLimits: JointLimits[];
  private dhParameters: DHParameters[];

  constructor(
    dhParameters: DHParameters[],
    jointLimits?: JointLimits[]
  ) {
    this.dhParameters = dhParameters;
    this.forwardKinematics = new ForwardKinematics(dhParameters);
    this.jointLimits = jointLimits || this.createDefaultLimits(dhParameters.length);
  }

  /**
   * Solve inverse kinematics using specified method
   */
  public async solve(
    target: Vector3,
    options?: Partial<InverseKinematicsOptions>
  ): Promise<InverseKinematicsResult> {
    const opts: InverseKinematicsOptions = {
      method: options?.method || 'jacobian',
      tolerance: options?.tolerance || 0.001,
      maxIterations: options?.maxIterations || 100,
      initialGuess: options?.initialGuess,
      avoidLimits: options?.avoidLimits !== false,
      weights: options?.weights
    };

    const startTime = performance.now();

    let result: InverseKinematicsResult;

    switch (opts.method) {
      case 'jacobian':
        result = await this.solveJacobian(target, opts);
        break;
      case 'fabrik':
        result = await this.solveFABRIK(target, opts);
        break;
      case 'ccd':
        result = await this.solveCCD(target, opts);
        break;
      case 'optimization':
        result = await this.solveOptimization(target, opts);
        break;
      default:
        throw new Error(`Unknown IK method: ${opts.method}`);
    }

    result.computationTime = performance.now() - startTime;
    return result;
  }

  /**
   * Jacobian-based iterative IK solver
   */
  private async solveJacobian(
    target: Vector3,
    options: InverseKinematicsOptions
  ): Promise<InverseKinematicsResult> {
    const n = this.dhParameters.length;
    let q = options.initialGuess || new Array(n).fill(0);

    let iteration = 0;
    let error = Infinity;

    while (iteration < options.maxIterations && error > options.tolerance) {
      // Compute current end-effector position
      const currentPos = this.forwardKinematics.getEndEffectorPosition(q);

      // Compute position error
      const errorVector = numpy.array([
        target.x - currentPos.x,
        target.y - currentPos.y,
        target.z - currentPos.z
      ]);

      error = numpy.linalg.norm(errorVector);

      if (error <= options.tolerance) {
        break;
      }

      // Compute Jacobian
      const jacobianInfo = this.forwardKinematics.computeJacobian(q);

      // Use only position part of Jacobian (first 3 rows)
      const J = this.matrixToNumpy(jacobianInfo.matrix);
      const Jp = J.slice([0, 3], [0, n]);

      // Compute pseudo-inverse with damping (damped least squares)
      const lambda = 0.01; // Damping factor
      const JpT = numpy.transpose(Jp);
      const damping = numpy.multiply(numpy.eye(n), lambda * lambda);
      const JpTJp = numpy.matmul(JpT, Jp);
      const JpTJp_damped = numpy.add(JpTJp, damping);
      const JpInv = numpy.matmul(numpy.linalg.inv(JpTJp_damped), JpT);

      // Compute joint angle update
      const dq = numpy.matmul(JpInv, errorVector);

      // Apply step size control
      const stepSize = 0.5;
      const qArray = numpy.array(q);
      const qNew = numpy.add(qArray, numpy.multiply(dq, stepSize));

      // Enforce joint limits
      q = Array.from(qNew).map((angle: number, i: number) =>
        this.clampToLimits(angle, i)
      );

      iteration++;
    }

    return {
      success: error <= options.tolerance,
      jointAngles: q,
      iterations: iteration,
      error,
      computationTime: 0 // Will be set by caller
    };
  }

  /**
   * FABRIK (Forward And Backward Reaching Inverse Kinematics)
   */
  private async solveFABRIK(
    target: Vector3,
    options: InverseKinematicsOptions
  ): Promise<InverseKinematicsResult> {
    const n = this.dhParameters.length;

    // Compute link lengths from DH parameters
    const linkLengths: number[] = [];
    let totalLength = 0;
    for (const dh of this.dhParameters) {
      const length = Math.sqrt(dh.a * dh.a + dh.d * dh.d);
      linkLengths.push(length);
      totalLength += length;
    }

    // Check if target is reachable
    const basePos = { x: 0, y: 0, z: 0 };
    const distToTarget = distance(basePos, target);
    if (distToTarget > totalLength) {
      // Target is unreachable - stretch towards it
      const direction = normalize({
        x: target.x - basePos.x,
        y: target.y - basePos.y,
        z: target.z - basePos.z
      });
      target = {
        x: basePos.x + direction.x * totalLength * 0.99,
        y: basePos.y + direction.y * totalLength * 0.99,
        z: basePos.z + direction.z * totalLength * 0.99
      };
    }

    // Initialize joint positions
    let q = options.initialGuess || new Array(n).fill(0);
    let positions = this.forwardKinematics.getLinkPositions(q);

    let iteration = 0;
    let error = distance(positions[positions.length - 1], target);

    while (iteration < options.maxIterations && error > options.tolerance) {
      // Forward reaching
      positions[positions.length - 1] = target;
      for (let i = positions.length - 2; i >= 0; i--) {
        const direction = normalize({
          x: positions[i].x - positions[i + 1].x,
          y: positions[i].y - positions[i + 1].y,
          z: positions[i].z - positions[i + 1].z
        });

        positions[i] = {
          x: positions[i + 1].x + direction.x * linkLengths[i],
          y: positions[i + 1].y + direction.y * linkLengths[i],
          z: positions[i + 1].z + direction.z * linkLengths[i]
        };
      }

      // Backward reaching
      positions[0] = basePos;
      for (let i = 0; i < positions.length - 1; i++) {
        const direction = normalize({
          x: positions[i + 1].x - positions[i].x,
          y: positions[i + 1].y - positions[i].y,
          z: positions[i + 1].z - positions[i].z
        });

        positions[i + 1] = {
          x: positions[i].x + direction.x * linkLengths[i],
          y: positions[i].y + direction.y * linkLengths[i],
          z: positions[i].z + direction.z * linkLengths[i]
        };
      }

      // Convert positions back to joint angles (simplified)
      q = this.positionsToJointAngles(positions);

      error = distance(positions[positions.length - 1], target);
      iteration++;
    }

    return {
      success: error <= options.tolerance,
      jointAngles: q,
      iterations: iteration,
      error,
      computationTime: 0
    };
  }

  /**
   * CCD (Cyclic Coordinate Descent)
   */
  private async solveCCD(
    target: Vector3,
    options: InverseKinematicsOptions
  ): Promise<InverseKinematicsResult> {
    const n = this.dhParameters.length;
    let q = options.initialGuess || new Array(n).fill(0);

    let iteration = 0;
    let error = Infinity;

    while (iteration < options.maxIterations && error > options.tolerance) {
      // Iterate through joints from end-effector to base
      for (let i = n - 1; i >= 0; i--) {
        const positions = this.forwardKinematics.getLinkPositions(q);
        const endEffector = positions[positions.length - 1];
        const joint = positions[i];

        // Vectors from joint to end-effector and target
        const toEnd = {
          x: endEffector.x - joint.x,
          y: endEffector.y - joint.y,
          z: endEffector.z - joint.z
        };

        const toTarget = {
          x: target.x - joint.x,
          y: target.y - joint.y,
          z: target.z - joint.z
        };

        // Normalize vectors
        const toEndNorm = normalize(toEnd);
        const toTargetNorm = normalize(toTarget);

        // Compute rotation angle
        const cosAngle = dot(toEndNorm, toTargetNorm);
        const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

        // Determine rotation direction (simplified for z-axis rotation)
        const cross = toEndNorm.x * toTargetNorm.y - toEndNorm.y * toTargetNorm.x;
        const rotationAngle = cross >= 0 ? angle : -angle;

        // Update joint angle
        q[i] += rotationAngle * 0.5; // Damping factor
        q[i] = this.clampToLimits(q[i], i);
      }

      // Check convergence
      const currentPos = this.forwardKinematics.getEndEffectorPosition(q);
      error = distance(currentPos, target);
      iteration++;
    }

    return {
      success: error <= options.tolerance,
      jointAngles: q,
      iterations: iteration,
      error,
      computationTime: 0
    };
  }

  /**
   * Optimization-based IK using SciPy
   */
  private async solveOptimization(
    target: Vector3,
    options: InverseKinematicsOptions
  ): Promise<InverseKinematicsResult> {
    const n = this.dhParameters.length;
    const initialGuess = options.initialGuess || new Array(n).fill(0);

    // Define objective function
    const objective = (q: any) => {
      const qArray = Array.from(q);
      const currentPos = this.forwardKinematics.getEndEffectorPosition(qArray);

      const error = numpy.array([
        currentPos.x - target.x,
        currentPos.y - target.y,
        currentPos.z - target.z
      ]);

      return numpy.linalg.norm(error);
    };

    // Define bounds
    const bounds = this.jointLimits.map(limit => [
      limit.positionMin,
      limit.positionMax
    ]);

    // Solve using SciPy optimization
    const result = scipy.optimize.minimize(
      objective,
      numpy.array(initialGuess),
      {
        method: 'SLSQP',
        bounds: numpy.array(bounds),
        options: { maxiter: options.maxIterations, ftol: options.tolerance }
      }
    );

    const finalError = objective(result.x);

    return {
      success: result.success && finalError <= options.tolerance,
      jointAngles: Array.from(result.x),
      iterations: result.nit,
      error: finalError,
      computationTime: 0
    };
  }

  /**
   * Solve IK with orientation constraint
   */
  public async solveWithOrientation(
    target: Vector3,
    targetOrientation: { x: number; y: number; z: number },
    options?: Partial<InverseKinematicsOptions>
  ): Promise<InverseKinematicsResult> {
    const n = this.dhParameters.length;
    const initialGuess = options?.initialGuess || new Array(n).fill(0);

    // Objective function with position and orientation error
    const objective = (q: any) => {
      const qArray = Array.from(q);
      const fk = this.forwardKinematics.computeForwardKinematics(qArray);

      // Position error
      const posError = numpy.array([
        fk.endEffectorPose.position.x - target.x,
        fk.endEffectorPose.position.y - target.y,
        fk.endEffectorPose.position.z - target.z
      ]);

      // Orientation error (simplified - using quaternion components)
      const orientError = numpy.array([
        fk.endEffectorPose.orientation.x - targetOrientation.x,
        fk.endEffectorPose.orientation.y - targetOrientation.y,
        fk.endEffectorPose.orientation.z - targetOrientation.z
      ]);

      const posWeight = 1.0;
      const orientWeight = 0.5;

      return (
        posWeight * numpy.linalg.norm(posError) +
        orientWeight * numpy.linalg.norm(orientError)
      );
    };

    const bounds = this.jointLimits.map(limit => [
      limit.positionMin,
      limit.positionMax
    ]);

    const result = scipy.optimize.minimize(
      objective,
      numpy.array(initialGuess),
      {
        method: 'SLSQP',
        bounds: numpy.array(bounds),
        options: { maxiter: options?.maxIterations || 100, ftol: options?.tolerance || 0.001 }
      }
    );

    const finalError = objective(result.x);

    return {
      success: result.success,
      jointAngles: Array.from(result.x),
      iterations: result.nit,
      error: finalError,
      computationTime: 0
    };
  }

  /**
   * Solve IK with multiple solutions
   */
  public async solveMultiple(
    target: Vector3,
    numSolutions = 8,
    options?: Partial<InverseKinematicsOptions>
  ): Promise<InverseKinematicsResult[]> {
    const results: InverseKinematicsResult[] = [];
    const n = this.dhParameters.length;

    // Try different initial guesses
    for (let i = 0; i < numSolutions; i++) {
      const initialGuess = this.generateRandomConfiguration();

      const result = await this.solve(target, {
        ...options,
        initialGuess
      });

      if (result.success) {
        // Check if this is a unique solution
        const isUnique = results.every(existing =>
          !this.configurationsEqual(existing.jointAngles, result.jointAngles)
        );

        if (isUnique) {
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * Find closest reachable point to target
   */
  public async findClosestReachable(
    target: Vector3,
    options?: Partial<InverseKinematicsOptions>
  ): Promise<{ position: Vector3; jointAngles: number[] }> {
    const n = this.dhParameters.length;

    // Objective: minimize distance to target
    const objective = (q: any) => {
      const qArray = Array.from(q);
      const pos = this.forwardKinematics.getEndEffectorPosition(qArray);

      return Math.sqrt(
        Math.pow(pos.x - target.x, 2) +
        Math.pow(pos.y - target.y, 2) +
        Math.pow(pos.z - target.z, 2)
      );
    };

    const bounds = this.jointLimits.map(limit => [
      limit.positionMin,
      limit.positionMax
    ]);

    const result = scipy.optimize.minimize(
      objective,
      numpy.array(new Array(n).fill(0)),
      {
        method: 'SLSQP',
        bounds: numpy.array(bounds),
        options: { maxiter: 200 }
      }
    );

    const jointAngles = Array.from(result.x);
    const position = this.forwardKinematics.getEndEffectorPosition(jointAngles);

    return { position, jointAngles };
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Clamp joint angle to limits
   */
  private clampToLimits(angle: number, jointIndex: number): number {
    const limits = this.jointLimits[jointIndex];
    return Math.max(limits.positionMin, Math.min(limits.positionMax, angle));
  }

  /**
   * Generate random valid configuration
   */
  private generateRandomConfiguration(): number[] {
    return this.jointLimits.map(limit => {
      const range = limit.positionMax - limit.positionMin;
      return limit.positionMin + Math.random() * range;
    });
  }

  /**
   * Check if two configurations are equal (within tolerance)
   */
  private configurationsEqual(q1: number[], q2: number[], tolerance = 0.01): boolean {
    if (q1.length !== q2.length) return false;

    for (let i = 0; i < q1.length; i++) {
      if (Math.abs(q1[i] - q2[i]) > tolerance) {
        return false;
      }
    }

    return true;
  }

  /**
   * Convert link positions to joint angles (simplified)
   */
  private positionsToJointAngles(positions: Vector3[]): number[] {
    const angles: number[] = [];

    for (let i = 0; i < positions.length - 1; i++) {
      const dx = positions[i + 1].x - positions[i].x;
      const dy = positions[i + 1].y - positions[i].y;
      const angle = Math.atan2(dy, dx);
      angles.push(angle);
    }

    return angles;
  }

  /**
   * Create default joint limits
   */
  private createDefaultLimits(n: number): JointLimits[] {
    return Array(n).fill(null).map(() => ({
      positionMin: -Math.PI,
      positionMax: Math.PI,
      velocityMax: 2.0,
      accelerationMax: 5.0,
      torqueMax: 100.0
    }));
  }

  /**
   * Convert Matrix to NumPy array
   */
  private matrixToNumpy(matrix: { rows: number; cols: number; data: number[][] }): any {
    return numpy.array(matrix.data);
  }

  /**
   * Validate solution
   */
  public validateSolution(
    jointAngles: number[],
    target: Vector3,
    tolerance: number
  ): boolean {
    const currentPos = this.forwardKinematics.getEndEffectorPosition(jointAngles);
    const error = distance(currentPos, target);
    return error <= tolerance;
  }

  /**
   * Get all valid solutions for target
   */
  public async getAllSolutions(
    target: Vector3,
    options?: Partial<InverseKinematicsOptions>
  ): Promise<InverseKinematicsResult[]> {
    // For most robots, there are typically 0-8 solutions
    const maxSolutions = 16;
    const solutions = await this.solveMultiple(target, maxSolutions, options);

    // Filter and sort by error
    return solutions
      .filter(s => s.success)
      .sort((a, b) => a.error - b.error);
  }

  /**
   * Find solution closest to current configuration
   */
  public async solveClosestToCurrentAsync(
    target: Vector3,
    currentConfig: number[],
    options?: Partial<InverseKinematicsOptions>
  ): Promise<InverseKinematicsResult> {
    // Use current configuration as initial guess
    return this.solve(target, {
      ...options,
      initialGuess: currentConfig
    });
  }

  /**
   * Compute configuration space distance
   */
  private configurationDistance(q1: number[], q2: number[]): number {
    let sumSq = 0;
    for (let i = 0; i < q1.length; i++) {
      const diff = q1[i] - q2[i];
      sumSq += diff * diff;
    }
    return Math.sqrt(sumSq);
  }

  /**
   * Find solution with best manipulability
   */
  public async solveBestManipulability(
    target: Vector3,
    options?: Partial<InverseKinematicsOptions>
  ): Promise<InverseKinematicsResult> {
    const solutions = await this.solveMultiple(target, 8, options);

    if (solutions.length === 0) {
      throw new Error('No valid solutions found');
    }

    // Find solution with best manipulability
    let bestSolution = solutions[0];
    let bestManipulability = 0;

    for (const solution of solutions) {
      const jacobianInfo = this.forwardKinematics.computeJacobian(solution.jointAngles);
      if (jacobianInfo.manipulability > bestManipulability) {
        bestManipulability = jacobianInfo.manipulability;
        bestSolution = solution;
      }
    }

    return bestSolution;
  }

  /**
   * Check if target is within workspace
   */
  public isReachable(target: Vector3): boolean {
    // Compute total reach
    let maxReach = 0;
    for (const dh of this.dhParameters) {
      maxReach += Math.sqrt(dh.a * dh.a + dh.d * dh.d);
    }

    const basePos = { x: 0, y: 0, z: 0 };
    const dist = distance(basePos, target);

    return dist <= maxReach;
  }
}

/**
 * Analytical IK solver for specific robot types
 */
export class AnalyticalIK {
  /**
   * Solve IK for 2-DOF planar arm
   */
  public static solve2DOFPlanar(
    target: { x: number; y: number },
    l1: number,
    l2: number
  ): { elbow_up: number[]; elbow_down: number[] } | null {
    const { x, y } = target;
    const distSq = x * x + y * y;
    const dist = Math.sqrt(distSq);

    // Check reachability
    if (dist > l1 + l2 || dist < Math.abs(l1 - l2)) {
      return null;
    }

    // Elbow-up solution
    const cosTheta2 = (distSq - l1 * l1 - l2 * l2) / (2 * l1 * l2);
    const theta2_up = Math.acos(cosTheta2);
    const theta2_down = -theta2_up;

    const k1_up = l1 + l2 * Math.cos(theta2_up);
    const k2_up = l2 * Math.sin(theta2_up);
    const theta1_up = Math.atan2(y, x) - Math.atan2(k2_up, k1_up);

    const k1_down = l1 + l2 * Math.cos(theta2_down);
    const k2_down = l2 * Math.sin(theta2_down);
    const theta1_down = Math.atan2(y, x) - Math.atan2(k2_down, k1_down);

    return {
      elbow_up: [theta1_up, theta2_up],
      elbow_down: [theta1_down, theta2_down]
    };
  }

  /**
   * Solve IK for 3-DOF spherical wrist
   */
  public static solve3DOFSphericalWrist(
    target: Vector3,
    orientation: { roll: number; pitch: number; yaw: number }
  ): number[] {
    // Simplified spherical wrist IK
    const theta4 = orientation.yaw;
    const theta5 = orientation.pitch;
    const theta6 = orientation.roll;

    return [theta4, theta5, theta6];
  }
}

export default InverseKinematics;
