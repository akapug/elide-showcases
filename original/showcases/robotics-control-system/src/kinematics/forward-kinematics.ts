/**
 * Forward Kinematics Solver
 *
 * Implements forward kinematics using Denavit-Hartenberg (DH) parameters
 * and homogeneous transformation matrices. Leverages Python's NumPy for
 * efficient matrix operations.
 */

// @ts-ignore
import numpy from 'python:numpy';

import {
  Vector3,
  Quaternion,
  Transform,
  DHParameters,
  JointAngles,
  ForwardKinematicsResult,
  Matrix,
  JacobianInfo,
  Link,
  EPSILON
} from '../types';

/**
 * Forward kinematics solver using DH parameters
 */
export class ForwardKinematics {
  private dhParameters: DHParameters[];
  private links: Link[];
  private baseTransform: Transform;

  constructor(
    dhParameters: DHParameters[],
    links?: Link[],
    baseTransform?: Transform
  ) {
    this.dhParameters = dhParameters;
    this.links = links || [];
    this.baseTransform = baseTransform || this.createIdentityTransform();
  }

  /**
   * Compute forward kinematics for given joint angles
   */
  public computeForwardKinematics(jointAngles: number[]): ForwardKinematicsResult {
    if (jointAngles.length !== this.dhParameters.length) {
      throw new Error(
        `Joint angle count (${jointAngles.length}) does not match DH parameter count (${this.dhParameters.length})`
      );
    }

    const linkTransforms: Transform[] = [];
    let currentTransform = this.numpyToTransform(
      this.transformToNumpy(this.baseTransform)
    );

    // Compute transformation for each link
    for (let i = 0; i < this.dhParameters.length; i++) {
      const dh = { ...this.dhParameters[i] };
      dh.theta += jointAngles[i]; // Add joint angle to theta

      const linkTransform = this.computeDHTransform(dh);
      linkTransforms.push(linkTransform);

      // Chain transformations
      const currentMatrix = this.transformToNumpy(currentTransform);
      const linkMatrix = this.transformToNumpy(linkTransform);
      const newMatrix = numpy.matmul(currentMatrix, linkMatrix);

      currentTransform = this.numpyToTransform(newMatrix);
    }

    // Extract end-effector pose
    const endEffectorPose = {
      position: currentTransform.position,
      orientation: this.rotationMatrixToQuaternion(currentTransform.rotation)
    };

    return {
      endEffectorPose,
      linkTransforms
    };
  }

  /**
   * Compute transformation matrix from DH parameters
   */
  private computeDHTransform(dh: DHParameters): Transform {
    const { a, alpha, d, theta } = dh;

    // Compute trigonometric values
    const ct = Math.cos(theta);
    const st = Math.sin(theta);
    const ca = Math.cos(alpha);
    const sa = Math.sin(alpha);

    // DH transformation matrix using NumPy
    const matrix = numpy.array([
      [ct, -st * ca, st * sa, a * ct],
      [st, ct * ca, -ct * sa, a * st],
      [0, sa, ca, d],
      [0, 0, 0, 1]
    ]);

    return this.numpyToTransform(matrix);
  }

  /**
   * Compute Jacobian matrix for given joint angles
   */
  public computeJacobian(jointAngles: number[]): JacobianInfo {
    const n = jointAngles.length;
    const J = numpy.zeros([6, n]);

    // Compute forward kinematics for all links
    const fk = this.computeForwardKinematics(jointAngles);
    const endEffectorPos = fk.endEffectorPose.position;

    // Base transform
    let T = this.transformToNumpy(this.baseTransform);

    for (let i = 0; i < n; i++) {
      // Get transformation up to joint i
      if (i > 0) {
        const linkMatrix = this.transformToNumpy(fk.linkTransforms[i - 1]);
        T = numpy.matmul(T, linkMatrix);
      }

      // Extract z-axis and origin of joint i
      const z = numpy.array([T[0][2], T[1][2], T[2][2]]);
      const o = numpy.array([T[0][3], T[1][3], T[2][3]]);

      // End effector position
      const oe = numpy.array([endEffectorPos.x, endEffectorPos.y, endEffectorPos.z]);

      // Compute Jacobian column for revolute joint
      const diff = numpy.subtract(oe, o);
      const Jv = numpy.cross(z, diff); // Linear velocity
      const Jw = z; // Angular velocity

      // Fill Jacobian column
      for (let row = 0; row < 3; row++) {
        J[row][i] = Jv[row];
        J[row + 3][i] = Jw[row];
      }
    }

    // Compute Jacobian properties
    const JtJ = numpy.matmul(numpy.transpose(J), J);
    const det = numpy.linalg.det(JtJ);
    const condition = numpy.linalg.cond(J);
    const manipulability = Math.sqrt(Math.abs(det));

    return {
      matrix: this.numpyToMatrix(J),
      determinant: det,
      condition,
      isSingular: Math.abs(det) < EPSILON,
      manipulability
    };
  }

  /**
   * Compute analytical Jacobian (alternative method)
   */
  public computeAnalyticalJacobian(jointAngles: number[]): Matrix {
    const n = jointAngles.length;
    const epsilon = 1e-6;
    const J = numpy.zeros([6, n]);

    // Numerical differentiation
    for (let i = 0; i < n; i++) {
      const anglesPlusEps = [...jointAngles];
      const anglesMinusEps = [...jointAngles];
      anglesPlusEps[i] += epsilon;
      anglesMinusEps[i] -= epsilon;

      const fkPlus = this.computeForwardKinematics(anglesPlusEps);
      const fkMinus = this.computeForwardKinematics(anglesMinusEps);

      // Position derivative
      const posPlus = fkPlus.endEffectorPose.position;
      const posMinus = fkMinus.endEffectorPose.position;

      J[0][i] = (posPlus.x - posMinus.x) / (2 * epsilon);
      J[1][i] = (posPlus.y - posMinus.y) / (2 * epsilon);
      J[2][i] = (posPlus.z - posMinus.z) / (2 * epsilon);

      // Orientation derivative (simplified)
      const quatPlus = fkPlus.endEffectorPose.orientation;
      const quatMinus = fkMinus.endEffectorPose.orientation;

      J[3][i] = (quatPlus.x - quatMinus.x) / (2 * epsilon);
      J[4][i] = (quatPlus.y - quatMinus.y) / (2 * epsilon);
      J[5][i] = (quatPlus.z - quatMinus.z) / (2 * epsilon);
    }

    return this.numpyToMatrix(J);
  }

  /**
   * Compute velocity from joint velocities using Jacobian
   */
  public computeVelocity(
    jointAngles: number[],
    jointVelocities: number[]
  ): { linear: Vector3; angular: Vector3 } {
    const jacobianInfo = this.computeJacobian(jointAngles);
    const J = this.matrixToNumpy(jacobianInfo.matrix);
    const qDot = numpy.array(jointVelocities);

    const velocity = numpy.matmul(J, qDot);

    return {
      linear: {
        x: velocity[0],
        y: velocity[1],
        z: velocity[2]
      },
      angular: {
        x: velocity[3],
        y: velocity[4],
        z: velocity[5]
      }
    };
  }

  /**
   * Compute acceleration from joint accelerations
   */
  public computeAcceleration(
    jointAngles: number[],
    jointVelocities: number[],
    jointAccelerations: number[]
  ): { linear: Vector3; angular: Vector3 } {
    const jacobianInfo = this.computeJacobian(jointAngles);
    const J = this.matrixToNumpy(jacobianInfo.matrix);

    // Compute Jacobian time derivative (numerical approximation)
    const epsilon = 1e-6;
    const nextAngles = jointAngles.map((angle, i) =>
      angle + jointVelocities[i] * epsilon
    );
    const nextJacobianInfo = this.computeJacobian(nextAngles);
    const Jnext = this.matrixToNumpy(nextJacobianInfo.matrix);
    const Jdot = numpy.divide(numpy.subtract(Jnext, J), epsilon);

    const qDot = numpy.array(jointVelocities);
    const qDdot = numpy.array(jointAccelerations);

    // Acceleration = J * qDdot + Jdot * qDot
    const term1 = numpy.matmul(J, qDdot);
    const term2 = numpy.matmul(Jdot, qDot);
    const acceleration = numpy.add(term1, term2);

    return {
      linear: {
        x: acceleration[0],
        y: acceleration[1],
        z: acceleration[2]
      },
      angular: {
        x: acceleration[3],
        y: acceleration[4],
        z: acceleration[5]
      }
    };
  }

  /**
   * Check if configuration is at singularity
   */
  public checkSingularity(jointAngles: number[], threshold = 0.01): boolean {
    const jacobianInfo = this.computeJacobian(jointAngles);
    return jacobianInfo.isSingular || jacobianInfo.manipulability < threshold;
  }

  /**
   * Compute manipulability ellipsoid
   */
  public computeManipulabilityEllipsoid(
    jointAngles: number[]
  ): { axes: Vector3[]; values: number[] } {
    const jacobianInfo = this.computeJacobian(jointAngles);
    const J = this.matrixToNumpy(jacobianInfo.matrix);

    // Take only position Jacobian (first 3 rows)
    const Jp = J.slice([0, 3], [0, jointAngles.length]);

    // Compute JJ^T
    const JJt = numpy.matmul(Jp, numpy.transpose(Jp));

    // Eigenvalue decomposition
    const [eigenvalues, eigenvectors] = numpy.linalg.eig(JJt);

    const axes: Vector3[] = [];
    for (let i = 0; i < 3; i++) {
      axes.push({
        x: eigenvectors[0][i],
        y: eigenvectors[1][i],
        z: eigenvectors[2][i]
      });
    }

    return {
      axes,
      values: Array.from(eigenvalues).map((v: number) => Math.sqrt(v))
    };
  }

  /**
   * Compute workspace boundary points
   */
  public computeWorkspaceBoundary(
    resolution = 10
  ): Vector3[] {
    const points: Vector3[] = [];
    const n = this.dhParameters.length;

    // Sample joint space
    const samples = Math.pow(resolution, n);
    for (let i = 0; i < samples; i++) {
      const jointAngles: number[] = [];
      let idx = i;

      for (let j = 0; j < n; j++) {
        const angle = (idx % resolution) * (2 * Math.PI / resolution);
        jointAngles.push(angle);
        idx = Math.floor(idx / resolution);
      }

      const fk = this.computeForwardKinematics(jointAngles);
      points.push(fk.endEffectorPose.position);
    }

    return points;
  }

  /**
   * Get end-effector position for given joint angles
   */
  public getEndEffectorPosition(jointAngles: number[]): Vector3 {
    const fk = this.computeForwardKinematics(jointAngles);
    return fk.endEffectorPose.position;
  }

  /**
   * Get end-effector orientation for given joint angles
   */
  public getEndEffectorOrientation(jointAngles: number[]): Quaternion {
    const fk = this.computeForwardKinematics(jointAngles);
    return fk.endEffectorPose.orientation;
  }

  /**
   * Get all link positions
   */
  public getLinkPositions(jointAngles: number[]): Vector3[] {
    const positions: Vector3[] = [this.baseTransform.position];
    let currentTransform = this.transformToNumpy(this.baseTransform);

    for (let i = 0; i < this.dhParameters.length; i++) {
      const dh = { ...this.dhParameters[i] };
      dh.theta += jointAngles[i];

      const linkTransform = this.computeDHTransform(dh);
      const linkMatrix = this.transformToNumpy(linkTransform);
      currentTransform = numpy.matmul(currentTransform, linkMatrix);

      const transform = this.numpyToTransform(currentTransform);
      positions.push(transform.position);
    }

    return positions;
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Convert Transform to NumPy array
   */
  private transformToNumpy(transform: Transform): any {
    return numpy.array(transform.matrix);
  }

  /**
   * Convert NumPy array to Transform
   */
  private numpyToTransform(matrix: any): Transform {
    const matrixData: number[][] = [];
    for (let i = 0; i < 4; i++) {
      matrixData.push([]);
      for (let j = 0; j < 4; j++) {
        matrixData[i].push(matrix[i][j]);
      }
    }

    const rotation: number[][] = [
      [matrixData[0][0], matrixData[0][1], matrixData[0][2]],
      [matrixData[1][0], matrixData[1][1], matrixData[1][2]],
      [matrixData[2][0], matrixData[2][1], matrixData[2][2]]
    ];

    const position: Vector3 = {
      x: matrixData[0][3],
      y: matrixData[1][3],
      z: matrixData[2][3]
    };

    return { matrix: matrixData, rotation, position };
  }

  /**
   * Convert NumPy array to Matrix
   */
  private numpyToMatrix(npArray: any): Matrix {
    const shape = npArray.shape;
    const rows = shape[0];
    const cols = shape[1];
    const data: number[][] = [];

    for (let i = 0; i < rows; i++) {
      data.push([]);
      for (let j = 0; j < cols; j++) {
        data[i].push(npArray[i][j]);
      }
    }

    return { rows, cols, data };
  }

  /**
   * Convert Matrix to NumPy array
   */
  private matrixToNumpy(matrix: Matrix): any {
    return numpy.array(matrix.data);
  }

  /**
   * Convert rotation matrix to quaternion
   */
  private rotationMatrixToQuaternion(R: number[][]): Quaternion {
    const trace = R[0][0] + R[1][1] + R[2][2];

    let w: number, x: number, y: number, z: number;

    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0);
      w = 0.25 / s;
      x = (R[2][1] - R[1][2]) * s;
      y = (R[0][2] - R[2][0]) * s;
      z = (R[1][0] - R[0][1]) * s;
    } else if (R[0][0] > R[1][1] && R[0][0] > R[2][2]) {
      const s = 2.0 * Math.sqrt(1.0 + R[0][0] - R[1][1] - R[2][2]);
      w = (R[2][1] - R[1][2]) / s;
      x = 0.25 * s;
      y = (R[0][1] + R[1][0]) / s;
      z = (R[0][2] + R[2][0]) / s;
    } else if (R[1][1] > R[2][2]) {
      const s = 2.0 * Math.sqrt(1.0 + R[1][1] - R[0][0] - R[2][2]);
      w = (R[0][2] - R[2][0]) / s;
      x = (R[0][1] + R[1][0]) / s;
      y = 0.25 * s;
      z = (R[1][2] + R[2][1]) / s;
    } else {
      const s = 2.0 * Math.sqrt(1.0 + R[2][2] - R[0][0] - R[1][1]);
      w = (R[1][0] - R[0][1]) / s;
      x = (R[0][2] + R[2][0]) / s;
      y = (R[1][2] + R[2][1]) / s;
      z = 0.25 * s;
    }

    // Normalize
    const norm = Math.sqrt(w * w + x * x + y * y + z * z);
    return { w: w / norm, x: x / norm, y: y / norm, z: z / norm };
  }

  /**
   * Create identity transform
   */
  private createIdentityTransform(): Transform {
    return {
      matrix: [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ],
      rotation: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ],
      position: { x: 0, y: 0, z: 0 }
    };
  }

  /**
   * Create rotation matrix from axis and angle
   */
  public static createRotationMatrix(
    axis: 'x' | 'y' | 'z',
    angle: number
  ): number[][] {
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    switch (axis) {
      case 'x':
        return [
          [1, 0, 0],
          [0, c, -s],
          [0, s, c]
        ];
      case 'y':
        return [
          [c, 0, s],
          [0, 1, 0],
          [-s, 0, c]
        ];
      case 'z':
        return [
          [c, -s, 0],
          [s, c, 0],
          [0, 0, 1]
        ];
    }
  }

  /**
   * Create translation matrix
   */
  public static createTranslationMatrix(translation: Vector3): number[][] {
    return [
      [1, 0, 0, translation.x],
      [0, 1, 0, translation.y],
      [0, 0, 1, translation.z],
      [0, 0, 0, 1]
    ];
  }

  /**
   * Multiply transformation matrices
   */
  public static multiplyTransforms(T1: Transform, T2: Transform): Transform {
    const matrix1 = numpy.array(T1.matrix);
    const matrix2 = numpy.array(T2.matrix);
    const result = numpy.matmul(matrix1, matrix2);

    const matrixData: number[][] = [];
    for (let i = 0; i < 4; i++) {
      matrixData.push([]);
      for (let j = 0; j < 4; j++) {
        matrixData[i].push(result[i][j]);
      }
    }

    const rotation: number[][] = [
      [matrixData[0][0], matrixData[0][1], matrixData[0][2]],
      [matrixData[1][0], matrixData[1][1], matrixData[1][2]],
      [matrixData[2][0], matrixData[2][1], matrixData[2][2]]
    ];

    const position: Vector3 = {
      x: matrixData[0][3],
      y: matrixData[1][3],
      z: matrixData[2][3]
    };

    return { matrix: matrixData, rotation, position };
  }

  /**
   * Invert transformation matrix
   */
  public static invertTransform(T: Transform): Transform {
    const matrix = numpy.array(T.matrix);
    const invMatrix = numpy.linalg.inv(matrix);

    const matrixData: number[][] = [];
    for (let i = 0; i < 4; i++) {
      matrixData.push([]);
      for (let j = 0; j < 4; j++) {
        matrixData[i].push(invMatrix[i][j]);
      }
    }

    const rotation: number[][] = [
      [matrixData[0][0], matrixData[0][1], matrixData[0][2]],
      [matrixData[1][0], matrixData[1][1], matrixData[1][2]],
      [matrixData[2][0], matrixData[2][1], matrixData[2][2]]
    ];

    const position: Vector3 = {
      x: matrixData[0][3],
      y: matrixData[1][3],
      z: matrixData[2][3]
    };

    return { matrix: matrixData, rotation, position };
  }
}

/**
 * Helper function to compute distance between two positions
 */
export function distance(p1: Vector3, p2: Vector3): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Helper function to normalize a vector
 */
export function normalize(v: Vector3): Vector3 {
  const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (length < EPSILON) {
    return { x: 0, y: 0, z: 0 };
  }
  return {
    x: v.x / length,
    y: v.y / length,
    z: v.z / length
  };
}

/**
 * Helper function to compute cross product
 */
export function cross(v1: Vector3, v2: Vector3): Vector3 {
  return {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x
  };
}

/**
 * Helper function to compute dot product
 */
export function dot(v1: Vector3, v2: Vector3): number {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}
