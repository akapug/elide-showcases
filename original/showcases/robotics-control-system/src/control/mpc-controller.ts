/**
 * Model Predictive Control (MPC) Controller
 *
 * Implements MPC with:
 * - Linear and nonlinear prediction models
 * - Quadratic cost function optimization
 * - State and control constraints
 * - SciPy optimization backend
 */

// @ts-ignore
import scipy from 'python:scipy';
// @ts-ignore
import numpy from 'python:numpy';

import {
  MPCConfig,
  MPCPrediction,
  JointSpaceState,
  Constraints,
  CostWeights,
  DEFAULT_MPC_CONFIG
} from '../types';

/**
 * Model Predictive Controller
 */
export class MPCController {
  private config: MPCConfig;
  private stateSize: number;
  private controlSize: number;
  private A: any; // State transition matrix
  private B: any; // Control input matrix
  private Q: any; // State cost matrix
  private R: any; // Control cost matrix
  private P: any; // Terminal cost matrix
  private warmStartSolution: number[] | null;

  constructor(config?: Partial<MPCConfig>) {
    this.config = { ...DEFAULT_MPC_CONFIG, ...config };
    this.stateSize = 0;
    this.controlSize = 0;
    this.warmStartSolution = null;

    this.initializeCostMatrices();
  }

  /**
   * Set robot model for MPC
   */
  public setRobotModel(robotModel: {
    stateSize: number;
    controlSize: number;
    A?: number[][];
    B?: number[][];
  }): void {
    this.stateSize = robotModel.stateSize;
    this.controlSize = robotModel.controlSize;

    if (robotModel.A && robotModel.B) {
      this.A = numpy.array(robotModel.A);
      this.B = numpy.array(robotModel.B);
    } else {
      // Default to identity dynamics
      this.A = numpy.eye(this.stateSize);
      this.B = numpy.eye(this.stateSize, this.controlSize);
    }

    this.initializeCostMatrices();
  }

  /**
   * Initialize cost matrices
   */
  private initializeCostMatrices(): void {
    if (this.stateSize === 0 || this.controlSize === 0) {
      return;
    }

    // State cost matrix Q
    this.Q = numpy.multiply(
      numpy.eye(this.stateSize),
      this.config.costWeights.tracking
    );

    // Control cost matrix R
    this.R = numpy.multiply(
      numpy.eye(this.controlSize),
      this.config.costWeights.control
    );

    // Terminal cost matrix P
    this.P = numpy.multiply(
      numpy.eye(this.stateSize),
      this.config.costWeights.terminal
    );
  }

  /**
   * Compute optimal control sequence
   */
  public async computeControl(
    currentState: JointSpaceState,
    referenceTrajectory: JointSpaceState[],
    options?: { time?: number; dt?: number }
  ): Promise<MPCPrediction> {
    const startTime = performance.now();

    const N = this.config.horizonLength;
    const dt = options?.dt || this.config.controlInterval;

    // Ensure reference trajectory has enough points
    if (referenceTrajectory.length < N) {
      const lastRef = referenceTrajectory[referenceTrajectory.length - 1];
      while (referenceTrajectory.length < N) {
        referenceTrajectory.push(lastRef);
      }
    }

    let result: MPCPrediction;

    if (this.config.predictionModel === 'linear') {
      result = await this.solveLinearMPC(
        currentState,
        referenceTrajectory.slice(0, N),
        dt
      );
    } else {
      result = await this.solveNonlinearMPC(
        currentState,
        referenceTrajectory.slice(0, N),
        dt
      );
    }

    result.computationTime = performance.now() - startTime;

    // Store for warm start
    if (result.solverStatus === 'success') {
      this.warmStartSolution = result.control.jointTorques;
    }

    return result;
  }

  /**
   * Solve linear MPC using quadratic programming
   */
  private async solveLinearMPC(
    currentState: JointSpaceState,
    reference: JointSpaceState[],
    dt: number
  ): Promise<MPCPrediction> {
    const N = this.config.horizonLength;
    const nx = this.stateSize;
    const nu = this.controlSize;

    // Build prediction matrices
    const { Phi, Gamma } = this.buildPredictionMatrices(N, dt);

    // Build cost matrices
    const { H, f } = this.buildQPMatrices(Phi, Gamma, currentState, reference);

    // Build constraint matrices
    const { A_ineq, b_ineq, lb, ub } = this.buildConstraintMatrices(N);

    // Solve QP problem: min 0.5 * u^T H u + f^T u
    // subject to: A_ineq * u <= b_ineq, lb <= u <= ub
    const initialGuess = this.warmStartSolution || new Array(nu * N).fill(0);

    let optResult: any;

    try {
      // Use SLSQP solver from SciPy
      const objective = (u: any) => {
        const uArray = numpy.array(u);
        const cost1 = numpy.matmul(numpy.matmul(uArray, H), uArray);
        const cost2 = numpy.matmul(f, uArray);
        return 0.5 * cost1 + cost2;
      };

      const bounds = [];
      for (let i = 0; i < nu * N; i++) {
        bounds.push([lb[i], ub[i]]);
      }

      optResult = scipy.optimize.minimize(
        objective,
        numpy.array(initialGuess),
        {
          method: this.config.solver === 'qp' ? 'SLSQP' : 'trust-constr',
          bounds: numpy.array(bounds),
          options: { maxiter: 100, ftol: 1e-6 }
        }
      );
    } catch (error) {
      console.error('MPC optimization failed:', error);
      return this.createFailedResult();
    }

    const optimalControls = Array.from(optResult.x);

    // Extract first control action
    const firstControl = optimalControls.slice(0, nu);

    // Predict future states
    const predictedStates = this.predictStates(
      currentState,
      optimalControls,
      N,
      dt
    );

    return {
      control: {
        jointTorques: firstControl,
        timestamp: Date.now()
      },
      predictedStates,
      predictedCost: optResult.fun,
      computationTime: 0,
      solverStatus: optResult.success ? 'success' : 'failed'
    };
  }

  /**
   * Solve nonlinear MPC using sequential quadratic programming
   */
  private async solveNonlinearMPC(
    currentState: JointSpaceState,
    reference: JointSpaceState[],
    dt: number
  ): Promise<MPCPrediction> {
    const N = this.config.horizonLength;
    const nu = this.controlSize;

    // Define nonlinear objective function
    const objective = (u: any) => {
      const controls = this.reshapeControls(Array.from(u), N, nu);
      const states = this.simulateNonlinearDynamics(currentState, controls, dt);

      let cost = 0;

      // Stage costs
      for (let k = 0; k < N; k++) {
        const stateError = this.computeStateError(states[k], reference[k]);
        const controlInput = numpy.array(controls[k]);

        const stateCost = numpy.matmul(
          numpy.matmul(stateError, this.Q),
          stateError
        );
        const controlCost = numpy.matmul(
          numpy.matmul(controlInput, this.R),
          controlInput
        );

        cost += stateCost + controlCost;

        // Smoothness cost (control rate)
        if (k > 0 && this.config.costWeights.smoothness) {
          const controlDiff = numpy.subtract(
            numpy.array(controls[k]),
            numpy.array(controls[k - 1])
          );
          const smoothnessCost = numpy.matmul(controlDiff, controlDiff);
          cost += this.config.costWeights.smoothness * smoothnessCost;
        }
      }

      // Terminal cost
      const terminalError = this.computeStateError(
        states[N],
        reference[N - 1]
      );
      const terminalCost = numpy.matmul(
        numpy.matmul(terminalError, this.P),
        terminalError
      );
      cost += terminalCost;

      return cost;
    };

    // Define constraints
    const constraints = this.buildNonlinearConstraints(currentState, N, dt);

    // Bounds on control inputs
    const bounds = this.buildControlBounds(N);

    // Initial guess
    const initialGuess = this.warmStartSolution || new Array(nu * N).fill(0);

    // Solve using SciPy
    let optResult: any;

    try {
      optResult = scipy.optimize.minimize(
        objective,
        numpy.array(initialGuess),
        {
          method: 'SLSQP',
          bounds: numpy.array(bounds),
          constraints: constraints,
          options: { maxiter: 50, ftol: 1e-4 }
        }
      );
    } catch (error) {
      console.error('Nonlinear MPC optimization failed:', error);
      return this.createFailedResult();
    }

    const optimalControls = Array.from(optResult.x);
    const firstControl = optimalControls.slice(0, nu);

    const predictedStates = this.predictStates(
      currentState,
      optimalControls,
      N,
      dt
    );

    return {
      control: {
        jointTorques: firstControl,
        timestamp: Date.now()
      },
      predictedStates,
      predictedCost: optResult.fun,
      computationTime: 0,
      solverStatus: optResult.success ? 'success' : 'failed'
    };
  }

  /**
   * Build prediction matrices for linear MPC
   */
  private buildPredictionMatrices(
    N: number,
    dt: number
  ): { Phi: any; Gamma: any } {
    const nx = this.stateSize;
    const nu = this.controlSize;

    // Discretize continuous-time system
    const Ad = this.discretizeA(this.A, dt);
    const Bd = this.discretizeB(this.B, dt);

    // Build Phi matrix (state prediction)
    const Phi = numpy.zeros([N * nx, nx]);
    let Ak = numpy.eye(nx);

    for (let k = 0; k < N; k++) {
      Ak = numpy.matmul(Ak, Ad);
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < nx; j++) {
          Phi[k * nx + i][j] = Ak[i][j];
        }
      }
    }

    // Build Gamma matrix (control prediction)
    const Gamma = numpy.zeros([N * nx, N * nu]);

    for (let k = 0; k < N; k++) {
      let Ak_minus_i = numpy.eye(nx);

      for (let i = 0; i <= k; i++) {
        if (i > 0) {
          Ak_minus_i = numpy.matmul(Ak_minus_i, Ad);
        }

        const block = numpy.matmul(Ak_minus_i, Bd);

        for (let row = 0; row < nx; row++) {
          for (let col = 0; col < nu; col++) {
            Gamma[k * nx + row][(k - i) * nu + col] = block[row][col];
          }
        }
      }
    }

    return { Phi, Gamma };
  }

  /**
   * Build QP matrices H and f
   */
  private buildQPMatrices(
    Phi: any,
    Gamma: any,
    currentState: JointSpaceState,
    reference: JointSpaceState[]
  ): { H: any; f: any } {
    const N = this.config.horizonLength;
    const nx = this.stateSize;
    const nu = this.controlSize;

    // Build block diagonal Q matrix
    const Qbar = numpy.zeros([N * nx, N * nx]);
    for (let k = 0; k < N; k++) {
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < nx; j++) {
          if (k < N - 1) {
            Qbar[k * nx + i][k * nx + j] = this.Q[i][j];
          } else {
            Qbar[k * nx + i][k * nx + j] = this.P[i][j]; // Terminal cost
          }
        }
      }
    }

    // Build block diagonal R matrix
    const Rbar = numpy.zeros([N * nu, N * nu]);
    for (let k = 0; k < N; k++) {
      for (let i = 0; i < nu; i++) {
        for (let j = 0; j < nu; j++) {
          Rbar[k * nu + i][k * nu + j] = this.R[i][j];
        }
      }
    }

    // H = Gamma^T * Qbar * Gamma + Rbar
    const GammaT = numpy.transpose(Gamma);
    const H1 = numpy.matmul(numpy.matmul(GammaT, Qbar), Gamma);
    const H = numpy.add(H1, Rbar);

    // Build reference vector
    const refVector = [];
    for (const refState of reference) {
      refVector.push(...refState.positions);
    }

    // Current state vector
    const x0 = numpy.array(currentState.positions);

    // f = Gamma^T * Qbar * (Phi * x0 - ref)
    const Phi_x0 = numpy.matmul(Phi, x0);
    const diff = numpy.subtract(Phi_x0, numpy.array(refVector));
    const f = numpy.matmul(numpy.matmul(GammaT, Qbar), diff);

    return { H, f };
  }

  /**
   * Build constraint matrices
   */
  private buildConstraintMatrices(
    N: number
  ): { A_ineq: any; b_ineq: any; lb: number[]; ub: number[] } {
    const nu = this.controlSize;
    const constraints = this.config.constraints;

    const lb: number[] = [];
    const ub: number[] = [];

    for (let k = 0; k < N; k++) {
      for (let i = 0; i < nu; i++) {
        if (constraints.torqueBounds) {
          lb.push(constraints.torqueBounds.min);
          ub.push(constraints.torqueBounds.max);
        } else {
          lb.push(-Infinity);
          ub.push(Infinity);
        }
      }
    }

    // Placeholder for inequality constraints
    const A_ineq = numpy.zeros([1, N * nu]);
    const b_ineq = numpy.zeros([1]);

    return { A_ineq, b_ineq, lb, ub };
  }

  /**
   * Build control bounds
   */
  private buildControlBounds(N: number): number[][] {
    const nu = this.controlSize;
    const constraints = this.config.constraints;
    const bounds: number[][] = [];

    for (let k = 0; k < N; k++) {
      for (let i = 0; i < nu; i++) {
        if (constraints.torqueBounds) {
          bounds.push([
            constraints.torqueBounds.min,
            constraints.torqueBounds.max
          ]);
        } else {
          bounds.push([-100, 100]);
        }
      }
    }

    return bounds;
  }

  /**
   * Build nonlinear constraints
   */
  private buildNonlinearConstraints(
    currentState: JointSpaceState,
    N: number,
    dt: number
  ): any[] {
    const constraints = [];

    // Dynamics constraints (equality)
    const dynamicsConstraint = {
      type: 'eq',
      fun: (u: any) => {
        const controls = this.reshapeControls(Array.from(u), N, this.controlSize);
        const states = this.simulateNonlinearDynamics(currentState, controls, dt);

        // Constraint: x[k+1] = f(x[k], u[k]) should be satisfied
        // Return residual (should be zero)
        const residuals = [];
        for (let k = 0; k < N; k++) {
          // Simplified: just return zeros
          for (let i = 0; i < this.stateSize; i++) {
            residuals.push(0);
          }
        }
        return numpy.array(residuals);
      }
    };

    // State constraints (inequality)
    const stateConstraint = {
      type: 'ineq',
      fun: (u: any) => {
        const controls = this.reshapeControls(Array.from(u), N, this.controlSize);
        const states = this.simulateNonlinearDynamics(currentState, controls, dt);

        const constraints: number[] = [];

        for (const state of states) {
          // Position constraints
          if (this.config.constraints.positionBounds) {
            for (const pos of state.positions) {
              constraints.push(pos - this.config.constraints.positionBounds.min);
              constraints.push(this.config.constraints.positionBounds.max - pos);
            }
          }

          // Velocity constraints
          if (this.config.constraints.velocityBounds) {
            for (const vel of state.velocities) {
              constraints.push(vel - this.config.constraints.velocityBounds.min);
              constraints.push(this.config.constraints.velocityBounds.max - vel);
            }
          }
        }

        return numpy.array(constraints);
      }
    };

    return [stateConstraint];
  }

  /**
   * Predict states using linear model
   */
  private predictStates(
    currentState: JointSpaceState,
    controls: number[],
    N: number,
    dt: number
  ): JointSpaceState[] {
    const states: JointSpaceState[] = [];
    let state = { ...currentState };

    const nu = this.controlSize;
    const Ad = this.discretizeA(this.A, dt);
    const Bd = this.discretizeB(this.B, dt);

    for (let k = 0; k < N; k++) {
      const u = controls.slice(k * nu, (k + 1) * nu);

      // x[k+1] = Ad * x[k] + Bd * u[k]
      const x = numpy.array(state.positions);
      const uVec = numpy.array(u);

      const xNext1 = numpy.matmul(Ad, x);
      const xNext2 = numpy.matmul(Bd, uVec);
      const xNext = numpy.add(xNext1, xNext2);

      state = {
        positions: Array.from(xNext),
        velocities: state.velocities,
        accelerations: state.accelerations
      };

      states.push({ ...state });
    }

    return states;
  }

  /**
   * Simulate nonlinear dynamics
   */
  private simulateNonlinearDynamics(
    currentState: JointSpaceState,
    controls: number[][],
    dt: number
  ): JointSpaceState[] {
    const states: JointSpaceState[] = [currentState];

    for (const u of controls) {
      const lastState = states[states.length - 1];

      // Simple nonlinear dynamics (can be replaced with actual robot dynamics)
      const positions = lastState.positions.map((pos, i) => {
        const vel = lastState.velocities[i];
        const acc = u[i]; // Control input is acceleration
        return pos + vel * dt + 0.5 * acc * dt * dt;
      });

      const velocities = lastState.velocities.map((vel, i) => {
        const acc = u[i];
        return vel + acc * dt;
      });

      const accelerations = u;

      states.push({ positions, velocities, accelerations });
    }

    return states;
  }

  /**
   * Compute state error
   */
  private computeStateError(
    state: JointSpaceState,
    reference: JointSpaceState
  ): any {
    const error = [];
    for (let i = 0; i < state.positions.length; i++) {
      error.push(state.positions[i] - reference.positions[i]);
    }
    return numpy.array(error);
  }

  /**
   * Reshape flat control vector
   */
  private reshapeControls(
    flatControls: number[],
    N: number,
    nu: number
  ): number[][] {
    const controls: number[][] = [];
    for (let k = 0; k < N; k++) {
      controls.push(flatControls.slice(k * nu, (k + 1) * nu));
    }
    return controls;
  }

  /**
   * Discretize A matrix
   */
  private discretizeA(A: any, dt: number): any {
    // Ad = e^(A*dt) ≈ I + A*dt (first-order approximation)
    const I = numpy.eye(this.stateSize);
    const Adt = numpy.multiply(A, dt);
    return numpy.add(I, Adt);
  }

  /**
   * Discretize B matrix
   */
  private discretizeB(B: any, dt: number): any {
    // Bd = B*dt (zero-order hold)
    return numpy.multiply(B, dt);
  }

  /**
   * Create failed result
   */
  private createFailedResult(): MPCPrediction {
    return {
      control: {
        jointTorques: new Array(this.controlSize).fill(0),
        timestamp: Date.now()
      },
      predictedStates: [],
      predictedCost: Infinity,
      computationTime: 0,
      solverStatus: 'failed'
    };
  }

  /**
   * Set cost weights
   */
  public setCostWeights(weights: Partial<CostWeights>): void {
    this.config.costWeights = { ...this.config.costWeights, ...weights };
    this.initializeCostMatrices();
  }

  /**
   * Set horizon length
   */
  public setHorizon(length: number): void {
    this.config.horizonLength = length;
  }

  /**
   * Set constraints
   */
  public setConstraints(constraints: Partial<Constraints>): void {
    this.config.constraints = { ...this.config.constraints, ...constraints };
  }

  /**
   * Reset warm start
   */
  public resetWarmStart(): void {
    this.warmStartSolution = null;
  }

  /**
   * Get configuration
   */
  public getConfig(): MPCConfig {
    return { ...this.config };
  }
}

export default MPCController;
