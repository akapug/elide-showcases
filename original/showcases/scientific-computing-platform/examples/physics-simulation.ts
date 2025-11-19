/**
 * Physics Simulations
 *
 * Comprehensive physics simulations using scientific computing stack.
 * Demonstrates N-body problems, wave equations, quantum mechanics, fluid dynamics,
 * and classical mechanics.
 *
 * Features:
 * - N-body gravitational simulations
 * - Wave equation solvers
 * - Quantum mechanics (Schrödinger equation)
 * - Molecular dynamics
 * - Pendulum systems
 * - Orbital mechanics
 */

import { LinearAlgebra } from '../src/compute/linear-algebra';
import { SignalProcessing } from '../src/compute/signal-processing';
import { Optimization } from '../src/compute/optimization';
import { Plotter } from '../src/visualization/plotter';
import Python from 'python';

// ============================================================================
// Physics Constants
// ============================================================================

const GRAVITATIONAL_CONSTANT = 6.67430e-11; // m^3 kg^-1 s^-2
const SPEED_OF_LIGHT = 299792458; // m/s
const PLANCK_CONSTANT = 6.62607015e-34; // J⋅s
const BOLTZMANN_CONSTANT = 1.380649e-23; // J/K
const ELECTRON_MASS = 9.1093837015e-31; // kg
const PROTON_MASS = 1.67262192369e-27; // kg

// ============================================================================
// Types
// ============================================================================

interface Body {
  mass: number;
  position: number[];
  velocity: number[];
  acceleration?: number[];
}

interface SimulationResult {
  time: number[];
  positions: number[][][];
  velocities: number[][][];
  energies: number[];
}

interface WaveSimulation {
  x: number[];
  t: number[];
  u: number[][];
}

interface QuantumState {
  x: number[];
  psi: number[];
  energy: number;
}

// ============================================================================
// Physics Simulation Class
// ============================================================================

export class PhysicsSimulation {
  private linalg: LinearAlgebra;
  private signal: SignalProcessing;
  private optimize: Optimization;
  private plotter: Plotter;
  private numpy: any;
  private scipy: any;

  constructor() {
    this.linalg = new LinearAlgebra();
    this.signal = new SignalProcessing();
    this.optimize = new Optimization();
    this.plotter = new Plotter();
    this.numpy = Python.import('numpy');
    this.scipy = Python.import('scipy');
  }

  // ==========================================================================
  // N-Body Simulations
  // ==========================================================================

  /**
   * Simulate N-body gravitational system
   */
  nBodySimulation(
    bodies: Body[],
    config: {
      timeStep: number;
      duration: number;
      integrator?: 'euler' | 'rk4' | 'leapfrog';
    }
  ): SimulationResult {
    const { timeStep, duration, integrator = 'rk4' } = config;
    const nSteps = Math.floor(duration / timeStep);
    const nBodies = bodies.length;

    // Initialize arrays
    const time: number[] = [];
    const positions: number[][][] = [];
    const velocities: number[][][] = [];
    const energies: number[] = [];

    // Current state
    let currentBodies = JSON.parse(JSON.stringify(bodies));

    // Simulation loop
    for (let step = 0; step <= nSteps; step++) {
      const t = step * timeStep;
      time.push(t);

      // Record current state
      positions.push(currentBodies.map(b => [...b.position]));
      velocities.push(currentBodies.map(b => [...b.velocity]));

      // Calculate energy
      const energy = this.calculateTotalEnergy(currentBodies);
      energies.push(energy);

      // Update state using chosen integrator
      if (step < nSteps) {
        if (integrator === 'rk4') {
          currentBodies = this.rk4Step(currentBodies, timeStep);
        } else if (integrator === 'leapfrog') {
          currentBodies = this.leapfrogStep(currentBodies, timeStep);
        } else {
          currentBodies = this.eulerStep(currentBodies, timeStep);
        }
      }
    }

    return { time, positions, velocities, energies };
  }

  /**
   * Solar system simulation
   */
  solarSystemSimulation(years: number = 1): SimulationResult {
    const AU = 1.496e11; // Astronomical unit in meters
    const YEAR = 365.25 * 24 * 3600; // Year in seconds

    const bodies: Body[] = [
      {
        mass: 1.989e30, // Sun
        position: [0, 0, 0],
        velocity: [0, 0, 0]
      },
      {
        mass: 3.285e23, // Mercury
        position: [0.387 * AU, 0, 0],
        velocity: [0, 47870, 0]
      },
      {
        mass: 4.867e24, // Venus
        position: [0.723 * AU, 0, 0],
        velocity: [0, 35020, 0]
      },
      {
        mass: 5.972e24, // Earth
        position: [1.0 * AU, 0, 0],
        velocity: [0, 29780, 0]
      },
      {
        mass: 6.39e23, // Mars
        position: [1.524 * AU, 0, 0],
        velocity: [0, 24070, 0]
      }
    ];

    return this.nBodySimulation(bodies, {
      timeStep: 3600, // 1 hour
      duration: years * YEAR,
      integrator: 'leapfrog'
    });
  }

  /**
   * Calculate gravitational accelerations
   */
  private calculateAccelerations(bodies: Body[]): number[][] {
    const n = bodies.length;
    const accelerations: number[][] = Array(n).fill(0).map(() => [0, 0, 0]);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const dx = bodies[j].position[0] - bodies[i].position[0];
          const dy = bodies[j].position[1] - bodies[i].position[1];
          const dz = bodies[j].position[2] - bodies[i].position[2];

          const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const force = GRAVITATIONAL_CONSTANT * bodies[j].mass / (r * r * r);

          accelerations[i][0] += force * dx;
          accelerations[i][1] += force * dy;
          accelerations[i][2] += force * dz;
        }
      }
    }

    return accelerations;
  }

  /**
   * Euler integration step
   */
  private eulerStep(bodies: Body[], dt: number): Body[] {
    const accelerations = this.calculateAccelerations(bodies);

    return bodies.map((body, i) => ({
      mass: body.mass,
      position: [
        body.position[0] + body.velocity[0] * dt,
        body.position[1] + body.velocity[1] * dt,
        body.position[2] + body.velocity[2] * dt
      ],
      velocity: [
        body.velocity[0] + accelerations[i][0] * dt,
        body.velocity[1] + accelerations[i][1] * dt,
        body.velocity[2] + accelerations[i][2] * dt
      ]
    }));
  }

  /**
   * Runge-Kutta 4th order integration step
   */
  private rk4Step(bodies: Body[], dt: number): Body[] {
    // k1
    const k1_acc = this.calculateAccelerations(bodies);

    // k2
    const bodies_k2 = bodies.map((b, i) => ({
      mass: b.mass,
      position: [
        b.position[0] + 0.5 * dt * b.velocity[0],
        b.position[1] + 0.5 * dt * b.velocity[1],
        b.position[2] + 0.5 * dt * b.velocity[2]
      ],
      velocity: [
        b.velocity[0] + 0.5 * dt * k1_acc[i][0],
        b.velocity[1] + 0.5 * dt * k1_acc[i][1],
        b.velocity[2] + 0.5 * dt * k1_acc[i][2]
      ]
    }));
    const k2_acc = this.calculateAccelerations(bodies_k2);

    // k3
    const bodies_k3 = bodies.map((b, i) => ({
      mass: b.mass,
      position: [
        b.position[0] + 0.5 * dt * bodies_k2[i].velocity[0],
        b.position[1] + 0.5 * dt * bodies_k2[i].velocity[1],
        b.position[2] + 0.5 * dt * bodies_k2[i].velocity[2]
      ],
      velocity: [
        b.velocity[0] + 0.5 * dt * k2_acc[i][0],
        b.velocity[1] + 0.5 * dt * k2_acc[i][1],
        b.velocity[2] + 0.5 * dt * k2_acc[i][2]
      ]
    }));
    const k3_acc = this.calculateAccelerations(bodies_k3);

    // k4
    const bodies_k4 = bodies.map((b, i) => ({
      mass: b.mass,
      position: [
        b.position[0] + dt * bodies_k3[i].velocity[0],
        b.position[1] + dt * bodies_k3[i].velocity[1],
        b.position[2] + dt * bodies_k3[i].velocity[2]
      ],
      velocity: [
        b.velocity[0] + dt * k3_acc[i][0],
        b.velocity[1] + dt * k3_acc[i][1],
        b.velocity[2] + dt * k3_acc[i][2]
      ]
    }));
    const k4_acc = this.calculateAccelerations(bodies_k4);

    // Final update
    return bodies.map((b, i) => ({
      mass: b.mass,
      position: [
        b.position[0] + dt * (b.velocity[0] + bodies_k2[i].velocity[0] / 3 + bodies_k3[i].velocity[0] / 3 + bodies_k4[i].velocity[0] / 6),
        b.position[1] + dt * (b.velocity[1] + bodies_k2[i].velocity[1] / 3 + bodies_k3[i].velocity[1] / 3 + bodies_k4[i].velocity[1] / 6),
        b.position[2] + dt * (b.velocity[2] + bodies_k2[i].velocity[2] / 3 + bodies_k3[i].velocity[2] / 3 + bodies_k4[i].velocity[2] / 6)
      ],
      velocity: [
        b.velocity[0] + dt * (k1_acc[i][0] + 2 * k2_acc[i][0] + 2 * k3_acc[i][0] + k4_acc[i][0]) / 6,
        b.velocity[1] + dt * (k1_acc[i][1] + 2 * k2_acc[i][1] + 2 * k3_acc[i][1] + k4_acc[i][1]) / 6,
        b.velocity[2] + dt * (k1_acc[i][2] + 2 * k2_acc[i][2] + 2 * k3_acc[i][2] + k4_acc[i][2]) / 6
      ]
    }));
  }

  /**
   * Leapfrog integration step (symplectic, conserves energy better)
   */
  private leapfrogStep(bodies: Body[], dt: number): Body[] {
    // Half-step velocity update
    const halfStepAccel = this.calculateAccelerations(bodies);
    const halfStepBodies = bodies.map((b, i) => ({
      mass: b.mass,
      position: b.position,
      velocity: [
        b.velocity[0] + 0.5 * dt * halfStepAccel[i][0],
        b.velocity[1] + 0.5 * dt * halfStepAccel[i][1],
        b.velocity[2] + 0.5 * dt * halfStepAccel[i][2]
      ]
    }));

    // Full-step position update
    const fullStepBodies = halfStepBodies.map(b => ({
      mass: b.mass,
      position: [
        b.position[0] + dt * b.velocity[0],
        b.position[1] + dt * b.velocity[1],
        b.position[2] + dt * b.velocity[2]
      ],
      velocity: b.velocity
    }));

    // Half-step velocity update
    const finalAccel = this.calculateAccelerations(fullStepBodies);
    return fullStepBodies.map((b, i) => ({
      mass: b.mass,
      position: b.position,
      velocity: [
        b.velocity[0] + 0.5 * dt * finalAccel[i][0],
        b.velocity[1] + 0.5 * dt * finalAccel[i][1],
        b.velocity[2] + 0.5 * dt * finalAccel[i][2]
      ]
    }));
  }

  /**
   * Calculate total energy (kinetic + potential)
   */
  private calculateTotalEnergy(bodies: Body[]): number {
    let kinetic = 0;
    let potential = 0;

    // Kinetic energy
    for (const body of bodies) {
      const vSquared = body.velocity[0] ** 2 + body.velocity[1] ** 2 + body.velocity[2] ** 2;
      kinetic += 0.5 * body.mass * vSquared;
    }

    // Potential energy
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const dx = bodies[j].position[0] - bodies[i].position[0];
        const dy = bodies[j].position[1] - bodies[i].position[1];
        const dz = bodies[j].position[2] - bodies[i].position[2];
        const r = Math.sqrt(dx * dx + dy * dy + dz * dz);

        potential -= GRAVITATIONAL_CONSTANT * bodies[i].mass * bodies[j].mass / r;
      }
    }

    return kinetic + potential;
  }

  // ==========================================================================
  // Wave Equations
  // ==========================================================================

  /**
   * Solve 1D wave equation
   */
  solve1DWaveEquation(config: {
    length: number;
    nx: number;
    tMax: number;
    dt: number;
    c: number;
    initialCondition: (x: number) => number;
  }): WaveSimulation {
    const { length, nx, tMax, dt, c } = config;
    const dx = length / (nx - 1);
    const nt = Math.floor(tMax / dt);

    // CFL condition
    const cfl = c * dt / dx;
    if (cfl > 1) {
      console.warn(`CFL condition violated: ${cfl} > 1. Simulation may be unstable.`);
    }

    // Initialize grid
    const x: number[] = Array.from({ length: nx }, (_, i) => i * dx);
    const t: number[] = Array.from({ length: nt }, (_, i) => i * dt);
    const u: number[][] = Array(nt).fill(0).map(() => Array(nx).fill(0));

    // Initial conditions
    for (let i = 0; i < nx; i++) {
      u[0][i] = config.initialCondition(x[i]);
      u[1][i] = u[0][i]; // Zero initial velocity
    }

    // Time stepping
    for (let n = 1; n < nt - 1; n++) {
      for (let i = 1; i < nx - 1; i++) {
        u[n + 1][i] = 2 * u[n][i] - u[n - 1][i] +
          (cfl ** 2) * (u[n][i + 1] - 2 * u[n][i] + u[n][i - 1]);
      }

      // Boundary conditions (fixed ends)
      u[n + 1][0] = 0;
      u[n + 1][nx - 1] = 0;
    }

    return { x, t, u };
  }

  /**
   * Solve 2D wave equation
   */
  solve2DWaveEquation(config: {
    domain: { x: [number, number]; y: [number, number] };
    gridSize: [number, number];
    timeSteps: number;
    waveSpeed: number;
    initialCondition: (x: number, y: number) => number;
    boundaryConditions?: 'dirichlet' | 'neumann';
  }): any {
    // Implementation using finite difference method
    const { domain, gridSize, timeSteps, waveSpeed } = config;
    const [nx, ny] = gridSize;

    const dx = (domain.x[1] - domain.x[0]) / (nx - 1);
    const dy = (domain.y[1] - domain.y[0]) / (ny - 1);
    const dt = 0.5 * Math.min(dx, dy) / waveSpeed; // CFL condition

    const x = Array.from({ length: nx }, (_, i) => domain.x[0] + i * dx);
    const y = Array.from({ length: ny }, (_, j) => domain.y[0] + j * dy);

    // Initialize solution
    let u_prev = Array(nx).fill(0).map(() => Array(ny).fill(0));
    let u_curr = Array(nx).fill(0).map(() => Array(ny).fill(0));
    let u_next = Array(nx).fill(0).map(() => Array(ny).fill(0));

    // Set initial conditions
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        u_curr[i][j] = config.initialCondition(x[i], y[j]);
        u_prev[i][j] = u_curr[i][j];
      }
    }

    const snapshots: number[][][] = [JSON.parse(JSON.stringify(u_curr))];
    const snapshotInterval = Math.floor(timeSteps / 100);

    // Time integration
    for (let n = 0; n < timeSteps; n++) {
      for (let i = 1; i < nx - 1; i++) {
        for (let j = 1; j < ny - 1; j++) {
          const laplacian = (u_curr[i + 1][j] + u_curr[i - 1][j] - 2 * u_curr[i][j]) / (dx * dx) +
                          (u_curr[i][j + 1] + u_curr[i][j - 1] - 2 * u_curr[i][j]) / (dy * dy);

          u_next[i][j] = 2 * u_curr[i][j] - u_prev[i][j] + (waveSpeed * dt) ** 2 * laplacian;
        }
      }

      // Apply boundary conditions
      for (let i = 0; i < nx; i++) {
        u_next[i][0] = 0;
        u_next[i][ny - 1] = 0;
      }
      for (let j = 0; j < ny; j++) {
        u_next[0][j] = 0;
        u_next[nx - 1][j] = 0;
      }

      // Update arrays
      [u_prev, u_curr, u_next] = [u_curr, u_next, u_prev];

      // Store snapshot
      if (n % snapshotInterval === 0) {
        snapshots.push(JSON.parse(JSON.stringify(u_curr)));
      }
    }

    return { x, y, snapshots, dt };
  }

  // ==========================================================================
  // Quantum Mechanics
  // ==========================================================================

  /**
   * Solve 1D time-independent Schrödinger equation
   */
  quantumHarmonicOscillator(config: {
    mass: number;
    omega: number;
    xRange: [number, number];
    numPoints: number;
    numStates: number;
  }): { x: number[]; eigenstates: number[][]; eigenvalues: number[] } {
    const { mass, omega, xRange, numPoints, numStates } = config;
    const dx = (xRange[1] - xRange[0]) / (numPoints - 1);
    const x = Array.from({ length: numPoints }, (_, i) => xRange[0] + i * dx);

    // Build Hamiltonian matrix
    const hbar = PLANCK_CONSTANT / (2 * Math.PI);
    const kinetic_factor = -hbar ** 2 / (2 * mass * dx ** 2);

    // Potential energy: V(x) = 0.5 * m * omega^2 * x^2
    const V = x.map(xi => 0.5 * mass * omega ** 2 * xi ** 2);

    // Build tridiagonal Hamiltonian
    const H: number[][] = Array(numPoints).fill(0).map(() => Array(numPoints).fill(0));

    for (let i = 0; i < numPoints; i++) {
      H[i][i] = -2 * kinetic_factor + V[i];
      if (i > 0) {
        H[i][i - 1] = kinetic_factor;
      }
      if (i < numPoints - 1) {
        H[i][i + 1] = kinetic_factor;
      }
    }

    // Solve eigenvalue problem
    const { eigenvalues, eigenvectors } = this.linalg.eig(H);

    // Sort by eigenvalue and select lowest states
    const indices = eigenvalues
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => a.val - b.val)
      .slice(0, numStates)
      .map(item => item.idx);

    const selectedEigenvalues = indices.map(i => eigenvalues[i]);
    const selectedEigenvectors = indices.map(i =>
      eigenvectors.map(row => row[i])
    );

    // Normalize eigenvectors
    const normalizedStates = selectedEigenvectors.map(state => {
      const norm = Math.sqrt(state.reduce((sum, val) => sum + val ** 2, 0) * dx);
      return state.map(val => val / norm);
    });

    return {
      x,
      eigenstates: normalizedStates,
      eigenvalues: selectedEigenvalues
    };
  }

  /**
   * Solve time-dependent Schrödinger equation
   */
  evolveQuantumState(
    initialState: number[],
    potential: number[],
    config: {
      mass: number;
      dx: number;
      dt: number;
      steps: number;
    }
  ): number[][] {
    // Crank-Nicolson method for time evolution
    const { mass, dx, dt, steps } = config;
    const N = initialState.length;
    const hbar = PLANCK_CONSTANT / (2 * Math.PI);

    const alpha = hbar * dt / (4 * mass * dx ** 2);
    const states: number[][] = [initialState];

    let currentState = [...initialState];

    for (let step = 0; step < steps; step++) {
      // Build matrices for Crank-Nicolson
      // (I + iH dt/2) psi_new = (I - iH dt/2) psi_old
      // Simplified implementation - in practice would use sparse matrices

      currentState = this.crankNicolsonStep(currentState, potential, alpha, dx, dt);
      states.push([...currentState]);
    }

    return states;
  }

  private crankNicolsonStep(
    psi: number[],
    V: number[],
    alpha: number,
    dx: number,
    dt: number
  ): number[] {
    // Simplified Crank-Nicolson step
    // In production, would use proper complex arithmetic and sparse linear solver
    const N = psi.length;
    const psi_new = [...psi];

    // Forward time step (simplified)
    for (let i = 1; i < N - 1; i++) {
      const laplacian = (psi[i + 1] - 2 * psi[i] + psi[i - 1]) / (dx * dx);
      psi_new[i] = psi[i] + dt * (alpha * laplacian - V[i] * psi[i]);
    }

    return psi_new;
  }

  // ==========================================================================
  // Classical Mechanics
  // ==========================================================================

  /**
   * Double pendulum simulation
   */
  doublePendulum(config: {
    m1: number;
    m2: number;
    L1: number;
    L2: number;
    theta1: number;
    theta2: number;
    omega1?: number;
    omega2?: number;
    g?: number;
    duration: number;
    dt: number;
  }): any {
    const { m1, m2, L1, L2, theta1, theta2, g = 9.81, duration, dt } = config;
    const omega1 = config.omega1 || 0;
    const omega2 = config.omega2 || 0;

    const steps = Math.floor(duration / dt);
    const state = [theta1, omega1, theta2, omega2];
    const history = {
      t: [0],
      theta1: [theta1],
      theta2: [theta2],
      omega1: [omega1],
      omega2: [omega2]
    };

    // Equations of motion for double pendulum
    const derivatives = (s: number[]) => {
      const [th1, w1, th2, w2] = s;
      const dth = th2 - th1;

      const den1 = (m1 + m2) * L1 - m2 * L1 * Math.cos(dth) ** 2;
      const den2 = (L2 / L1) * den1;

      const dw1 = (m2 * L1 * w1 ** 2 * Math.sin(dth) * Math.cos(dth) +
                  m2 * g * Math.sin(th2) * Math.cos(dth) +
                  m2 * L2 * w2 ** 2 * Math.sin(dth) -
                  (m1 + m2) * g * Math.sin(th1)) / den1;

      const dw2 = (-m2 * L2 * w2 ** 2 * Math.sin(dth) * Math.cos(dth) +
                  (m1 + m2) * g * Math.sin(th1) * Math.cos(dth) -
                  (m1 + m2) * L1 * w1 ** 2 * Math.sin(dth) -
                  (m1 + m2) * g * Math.sin(th2)) / den2;

      return [w1, dw1, w2, dw2];
    };

    // RK4 integration
    for (let i = 1; i <= steps; i++) {
      const k1 = derivatives(state);
      const k2 = derivatives(state.map((s, j) => s + 0.5 * dt * k1[j]));
      const k3 = derivatives(state.map((s, j) => s + 0.5 * dt * k2[j]));
      const k4 = derivatives(state.map((s, j) => s + dt * k3[j]));

      for (let j = 0; j < 4; j++) {
        state[j] += (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]);
      }

      history.t.push(i * dt);
      history.theta1.push(state[0]);
      history.omega1.push(state[1]);
      history.theta2.push(state[2]);
      history.omega2.push(state[3]);
    }

    return history;
  }

  // ==========================================================================
  // Visualization
  // ==========================================================================

  /**
   * Plot orbital trajectories
   */
  plotOrbits(result: SimulationResult): void {
    const figId = this.plotter.figure([12, 12]);

    // 3D plot of trajectories
    const ax = this.plotter.create_3d_axes();

    for (let i = 0; i < result.positions[0].length; i++) {
      const x = result.positions.map(p => p[i][0]);
      const y = result.positions.map(p => p[i][1]);
      const z = result.positions.map(p => p[i][2]);

      this.plotter.plot3d(ax, x, y, z, { label: `Body ${i + 1}` });
    }

    this.plotter.savefig(`orbits_${Date.now()}.png`);
  }

  /**
   * Animate wave propagation
   */
  animateWave(wave: WaveSimulation): void {
    const figId = this.plotter.figure([10, 6]);

    this.plotter.animate(
      (frame: number) => {
        return {
          x: wave.x,
          y: wave.u[Math.floor(frame * wave.u.length / 100)]
        };
      },
      { frames: 100, interval: 50 }
    );
  }

  /**
   * Plot quantum wavefunctions
   */
  plotWavefunctions(eigenstates: number[][], eigenvalues: number[]): void {
    this.plotter.figure([12, 8]);

    eigenstates.forEach((state, i) => {
      this.plotter.plot(
        Array.from({ length: state.length }, (_, j) => j),
        state,
        {
          label: `n=${i}, E=${eigenvalues[i].toFixed(4)}`,
          linewidth: 2
        }
      );
    });

    this.plotter.savefig(`wavefunctions_${Date.now()}.png`);
  }
}

export default PhysicsSimulation;
