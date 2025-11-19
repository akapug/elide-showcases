/**
 * Quantum Computing Platform - Type Definitions
 *
 * Comprehensive TypeScript type system for quantum computing operations,
 * providing type safety for quantum circuits, gates, algorithms, and simulations.
 */

// ============================================================================
// Complex Numbers and Linear Algebra
// ============================================================================

/**
 * Complex number representation
 */
export interface Complex {
  real: number;
  imag: number;
}

/**
 * Complex vector (quantum state)
 */
export type ComplexVector = Complex[];

/**
 * Complex matrix (quantum operator)
 */
export type ComplexMatrix = Complex[][];

/**
 * Real vector
 */
export type RealVector = number[];

/**
 * Real matrix
 */
export type RealMatrix = number[][];

/**
 * Pauli operator types
 */
export type PauliOperator = 'I' | 'X' | 'Y' | 'Z';

/**
 * Pauli string (e.g., "XXYZ")
 */
export type PauliString = string;

// ============================================================================
// Quantum States and Qubits
// ============================================================================

/**
 * Qubit representation
 */
export interface Qubit {
  /** Qubit index in the circuit */
  index: number;

  /** Current quantum state (if known) */
  state?: ComplexVector;

  /** Whether this qubit has been measured */
  measured: boolean;

  /** Classical bit this qubit is measured into */
  classicalBit?: number;
}

/**
 * Quantum state representation
 */
export interface QuantumState {
  /** Number of qubits */
  qubits: number;

  /** State vector (2^n amplitudes) */
  statevector: ComplexVector;

  /** Density matrix (for mixed states) */
  densityMatrix?: ComplexMatrix;

  /** Whether this is a pure state */
  isPure: boolean;

  /** State fidelity (if comparing to target) */
  fidelity?: number;
}

/**
 * Measurement basis
 */
export type MeasurementBasis = 'computational' | 'X' | 'Y' | 'Z' | 'bell';

/**
 * Measurement result
 */
export interface Measurement {
  /** Qubits that were measured */
  qubits: number[];

  /** Classical bits to store results */
  classicalBits: number[];

  /** Measurement basis */
  basis: MeasurementBasis;

  /** Measurement outcome (if executed) */
  outcome?: string;
}

/**
 * Classical register
 */
export interface ClassicalRegister {
  /** Number of bits */
  size: number;

  /** Register name */
  name: string;

  /** Current bit values */
  values: boolean[];
}

// ============================================================================
// Quantum Gates
// ============================================================================

/**
 * Base quantum gate interface
 */
export interface QuantumGate {
  /** Gate name */
  name: string;

  /** Qubits this gate acts on */
  qubits: number[];

  /** Gate parameters (angles, etc.) */
  parameters: number[];

  /** Unitary matrix representation */
  matrix?: ComplexMatrix;

  /** Whether this gate is parameterized */
  isParameterized: boolean;

  /** Label for visualization */
  label?: string;
}

/**
 * Single-qubit gate
 */
export interface SingleQubitGate extends QuantumGate {
  qubits: [number];
}

/**
 * Two-qubit gate
 */
export interface TwoQubitGate extends QuantumGate {
  qubits: [number, number];
  control?: number;
  target?: number;
}

/**
 * Multi-qubit gate
 */
export interface MultiQubitGate extends QuantumGate {
  qubits: number[];
}

/**
 * Gate types
 */
export type GateType =
  // Single-qubit gates
  | 'h' | 'x' | 'y' | 'z'
  | 's' | 'sdg' | 't' | 'tdg'
  | 'rx' | 'ry' | 'rz'
  | 'u' | 'u1' | 'u2' | 'u3'
  | 'id'
  // Two-qubit gates
  | 'cx' | 'cy' | 'cz'
  | 'ch' | 'swap'
  | 'crx' | 'cry' | 'crz'
  | 'cu' | 'cp'
  // Multi-qubit gates
  | 'ccx' | 'cswap'
  | 'mcx' | 'mcy' | 'mcz'
  // Custom
  | 'custom';

/**
 * Parameterized gate
 */
export interface ParameterizedGate extends QuantumGate {
  /** Parameter names */
  parameterNames: string[];

  /** Parameter bounds */
  parameterBounds?: Array<[number, number]>;

  /** Bind parameters to create concrete gate */
  bind(parameters: Record<string, number>): QuantumGate;
}

/**
 * Controlled gate
 */
export interface ControlledGate extends QuantumGate {
  /** Control qubits */
  controls: number[];

  /** Target qubits */
  targets: number[];

  /** Base gate being controlled */
  baseGate: QuantumGate;

  /** Control state (default all 1s) */
  controlState?: string;
}

// ============================================================================
// Quantum Circuits
// ============================================================================

/**
 * Quantum circuit
 */
export interface QuantumCircuit {
  /** Number of qubits */
  qubits: number;

  /** Number of classical bits */
  classicalBits: number;

  /** Gates in the circuit */
  gates: QuantumGate[];

  /** Measurements */
  measurements: Measurement[];

  /** Circuit name */
  name?: string;

  /** Circuit metadata */
  metadata?: Record<string, unknown>;

  /** Global phase */
  globalPhase?: number;
}

/**
 * Circuit properties
 */
export interface CircuitProperties {
  /** Circuit depth (longest path) */
  depth: number;

  /** Total gate count */
  gateCount: number;

  /** Gate count by type */
  gatesByType: Map<GateType, number>;

  /** Number of two-qubit gates */
  twoQubitGates: number;

  /** Qubit connectivity graph */
  connectivity: Map<number, Set<number>>;

  /** Critical path */
  criticalPath: QuantumGate[];
}

/**
 * Circuit optimization options
 */
export interface OptimizationOptions {
  /** Optimization level (0-3) */
  level: number;

  /** Target basis gates */
  basisGates?: GateType[];

  /** Coupling map (for hardware) */
  couplingMap?: Array<[number, number]>;

  /** Maximum iterations */
  maxIterations?: number;

  /** Seed for randomized optimizations */
  seed?: number;
}

/**
 * Transpiled circuit result
 */
export interface TranspiledCircuit {
  /** Optimized circuit */
  circuit: QuantumCircuit;

  /** Original circuit */
  original: QuantumCircuit;

  /** Qubit mapping */
  qubitMapping: Map<number, number>;

  /** Optimization statistics */
  stats: {
    depthReduction: number;
    gateReduction: number;
    transpileTime: number;
  };
}

// ============================================================================
// Simulation
// ============================================================================

/**
 * Simulation backend types
 */
export type SimulatorBackend =
  | 'statevector'
  | 'qasm'
  | 'unitary'
  | 'pulse'
  | 'stabilizer';

/**
 * Simulation options
 */
export interface SimulationOptions {
  /** Backend to use */
  backend: SimulatorBackend;

  /** Number of shots */
  shots?: number;

  /** Optimization level */
  optimization_level?: number;

  /** Noise model */
  noise_model?: NoiseModel;

  /** Random seed */
  seed?: number;

  /** Memory limit (bytes) */
  memoryLimit?: number;

  /** Enable GPU acceleration */
  gpu?: boolean;
}

/**
 * Simulation result
 */
export interface SimulationResult {
  /** Measurement counts */
  counts: Map<string, number>;

  /** Final statevector */
  statevector?: ComplexVector;

  /** Unitary matrix */
  unitary?: ComplexMatrix;

  /** Measurement probabilities */
  probabilities: Map<string, number>;

  /** Execution time (ms) */
  executionTime: number;

  /** Memory used (bytes) */
  memoryUsed: number;

  /** Success flag */
  success: boolean;

  /** Error message (if failed) */
  error?: string;

  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Expectation value result
 */
export interface ExpectationValue {
  /** Expectation value */
  value: number;

  /** Standard deviation */
  std: number;

  /** Variance */
  variance: number;

  /** Number of shots used */
  shots: number;
}

// ============================================================================
// Noise Models
// ============================================================================

/**
 * Quantum error types
 */
export type ErrorType =
  | 'bit_flip'
  | 'phase_flip'
  | 'bit_phase_flip'
  | 'depolarizing'
  | 'amplitude_damping'
  | 'phase_damping'
  | 'thermal_relaxation';

/**
 * Quantum error
 */
export interface QuantumError {
  /** Error type */
  type: ErrorType;

  /** Error probability or rate */
  probability: number;

  /** Affected qubits */
  qubits: number[];

  /** Gate this error applies to */
  gate?: GateType;

  /** Additional parameters */
  parameters?: Record<string, number>;
}

/**
 * Noise model
 */
export interface NoiseModel {
  /** Gate errors */
  gateErrors: Map<GateType, QuantumError[]>;

  /** Measurement errors */
  measurementError?: number;

  /** Thermal relaxation parameters */
  thermalRelaxation?: {
    t1: number; // T1 time (seconds)
    t2: number; // T2 time (seconds)
  };

  /** Readout errors */
  readoutError?: number[][];

  /** Temperature (Kelvin) */
  temperature?: number;
}

/**
 * Decoherence parameters
 */
export interface DecoherenceParams {
  /** T1 relaxation time */
  t1: number;

  /** T2 dephasing time */
  t2: number;

  /** Gate time */
  gateTime: number;

  /** Measurement time */
  measurementTime: number;
}

// ============================================================================
// Quantum Algorithms
// ============================================================================

/**
 * Algorithm result base
 */
export interface AlgorithmResult {
  /** Success flag */
  success: boolean;

  /** Result value */
  value: unknown;

  /** Confidence/probability */
  confidence: number;

  /** Number of iterations */
  iterations: number;

  /** Execution time (ms) */
  executionTime: number;

  /** Circuit used */
  circuit?: QuantumCircuit;

  /** Additional data */
  metadata?: Record<string, unknown>;
}

/**
 * Grover's algorithm result
 */
export interface GroverResult extends AlgorithmResult {
  /** Found item */
  target: string;

  /** Search probability */
  probability: number;

  /** Optimal iterations */
  optimalIterations: number;

  /** All measurement results */
  counts: Map<string, number>;
}

/**
 * Shor's algorithm result
 */
export interface ShorResult extends AlgorithmResult {
  /** Factors found */
  factors: number[];

  /** Number being factored */
  n: number;

  /** Period found */
  period?: number;

  /** Success probability */
  probability: number;
}

/**
 * VQE result
 */
export interface VQEResult extends AlgorithmResult {
  /** Ground state energy */
  energy: number;

  /** Optimal parameters */
  parameters: number[];

  /** Energy history */
  energyHistory: number[];

  /** Convergence status */
  converged: boolean;

  /** Number of function evaluations */
  evaluations: number;

  /** Final gradient norm */
  gradientNorm?: number;
}

/**
 * QAOA result
 */
export interface QAOAResult extends AlgorithmResult {
  /** Best solution found */
  solution: string;

  /** Objective value */
  objectiveValue: number;

  /** Optimal parameters */
  parameters: number[];

  /** Approximation ratio */
  approximationRatio: number;

  /** Success probability */
  probability: number;
}

/**
 * Quantum teleportation result
 */
export interface TeleportationResult extends AlgorithmResult {
  /** Teleported state */
  state: ComplexVector;

  /** Fidelity with original */
  fidelity: number;

  /** Classical communication bits */
  classicalBits: string;
}

// ============================================================================
// Optimization
// ============================================================================

/**
 * Optimizer types
 */
export type OptimizerType =
  | 'COBYLA'
  | 'NELDER_MEAD'
  | 'POWELL'
  | 'SLSQP'
  | 'BFGS'
  | 'ADAM'
  | 'SPSA';

/**
 * Optimization options
 */
export interface OptimizerOptions {
  /** Optimizer type */
  type: OptimizerType;

  /** Maximum iterations */
  maxIterations: number;

  /** Convergence tolerance */
  tolerance: number;

  /** Learning rate (for gradient-based) */
  learningRate?: number;

  /** Initial parameters */
  initialParameters?: number[];

  /** Parameter bounds */
  bounds?: Array<[number, number]>;
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  /** Optimal parameters */
  parameters: number[];

  /** Optimal value */
  value: number;

  /** Number of function evaluations */
  evaluations: number;

  /** Convergence flag */
  converged: boolean;

  /** Optimization history */
  history: {
    parameters: number[][];
    values: number[];
  };
}

/**
 * Gradient computation method
 */
export type GradientMethod =
  | 'parameter_shift'
  | 'finite_difference'
  | 'spsa'
  | 'natural';

// ============================================================================
// Quantum Chemistry
// ============================================================================

/**
 * Molecular geometry
 */
export interface Molecule {
  /** Atoms (element symbols) */
  atoms: string[];

  /** Coordinates (Angstroms) */
  coordinates: number[][];

  /** Charge */
  charge: number;

  /** Spin multiplicity */
  multiplicity: number;

  /** Basis set */
  basis: string;
}

/**
 * Hamiltonian operator
 */
export interface Hamiltonian {
  /** Pauli terms */
  pauliTerms: Array<{
    pauli: PauliString;
    coefficient: number;
  }>;

  /** Number of qubits */
  qubits: number;

  /** Constant term */
  constant: number;
}

/**
 * Fermion operator
 */
export interface FermionOperator {
  /** Creation/annihilation operators */
  terms: Array<{
    indices: number[];
    daggers: boolean[];
    coefficient: Complex;
  }>;
}

// ============================================================================
// Graph Problems
// ============================================================================

/**
 * Graph representation
 */
export interface Graph {
  /** Number of nodes */
  nodes: number;

  /** Edges (pairs of node indices) */
  edges: Array<[number, number]>;

  /** Edge weights */
  weights?: Map<string, number>;

  /** Node labels */
  nodeLabels?: Map<number, string>;
}

/**
 * Max-cut problem
 */
export interface MaxCutProblem {
  /** Graph */
  graph: Graph;

  /** Partition (nodes in set A) */
  partition?: Set<number>;

  /** Cut size */
  cutSize?: number;
}

/**
 * Graph coloring problem
 */
export interface GraphColoringProblem {
  /** Graph */
  graph: Graph;

  /** Number of colors */
  colors: number;

  /** Coloring assignment */
  coloring?: Map<number, number>;
}

// ============================================================================
// Visualization
// ============================================================================

/**
 * Circuit drawing options
 */
export interface DrawOptions {
  /** Output format */
  format: 'text' | 'mpl' | 'latex';

  /** Show gate parameters */
  showParameters: boolean;

  /** Show measurement results */
  showResults: boolean;

  /** Color scheme */
  colorScheme?: 'default' | 'bw' | 'colorblind';

  /** Scale factor */
  scale?: number;
}

/**
 * Bloch sphere coordinates
 */
export interface BlochVector {
  /** X coordinate */
  x: number;

  /** Y coordinate */
  y: number;

  /** Z coordinate */
  z: number;
}

/**
 * Histogram data
 */
export interface HistogramData {
  /** Bit strings */
  labels: string[];

  /** Counts */
  values: number[];

  /** Probabilities */
  probabilities: number[];
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Quantum error class
 */
export class QuantumError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuantumError';
  }
}

/**
 * Circuit error class
 */
export class CircuitError extends QuantumError {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitError';
  }
}

/**
 * Simulation error class
 */
export class SimulationError extends QuantumError {
  constructor(message: string) {
    super(message);
    this.name = 'SimulationError';
  }
}

/**
 * Algorithm error class
 */
export class AlgorithmError extends QuantumError {
  constructor(message: string) {
    super(message);
    this.name = 'AlgorithmError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Quantum state preparation
 */
export type StatePreparation =
  | ComplexVector
  | 'zero'
  | 'one'
  | 'plus'
  | 'minus'
  | 'bell'
  | 'ghz'
  | 'w';

/**
 * Measurement outcome
 */
export type MeasurementOutcome = '0' | '1';

/**
 * Bit string
 */
export type BitString = string;

/**
 * Probability distribution
 */
export type ProbabilityDistribution = Map<BitString, number>;

/**
 * Callback for iterative algorithms
 */
export type IterationCallback = (iteration: number, value: number, parameters?: number[]) => void | Promise<void>;

/**
 * Observable (Hermitian operator)
 */
export interface Observable {
  /** Pauli representation */
  pauli: PauliString;

  /** Coefficient */
  coefficient: number;

  /** Qubits */
  qubits: number[];
}

/**
 * Quantum register
 */
export interface QuantumRegister {
  /** Number of qubits */
  size: number;

  /** Register name */
  name: string;

  /** Qubit objects */
  qubits: Qubit[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Common quantum states
 */
export const QUANTUM_STATES = {
  ZERO: [{ real: 1, imag: 0 }, { real: 0, imag: 0 }] as ComplexVector,
  ONE: [{ real: 0, imag: 0 }, { real: 1, imag: 0 }] as ComplexVector,
  PLUS: [
    { real: 1 / Math.sqrt(2), imag: 0 },
    { real: 1 / Math.sqrt(2), imag: 0 }
  ] as ComplexVector,
  MINUS: [
    { real: 1 / Math.sqrt(2), imag: 0 },
    { real: -1 / Math.sqrt(2), imag: 0 }
  ] as ComplexVector,
};

/**
 * Pauli matrices
 */
export const PAULI_MATRICES = {
  I: [
    [{ real: 1, imag: 0 }, { real: 0, imag: 0 }],
    [{ real: 0, imag: 0 }, { real: 1, imag: 0 }]
  ] as ComplexMatrix,
  X: [
    [{ real: 0, imag: 0 }, { real: 1, imag: 0 }],
    [{ real: 1, imag: 0 }, { real: 0, imag: 0 }]
  ] as ComplexMatrix,
  Y: [
    [{ real: 0, imag: 0 }, { real: 0, imag: -1 }],
    [{ real: 0, imag: 1 }, { real: 0, imag: 0 }]
  ] as ComplexMatrix,
  Z: [
    [{ real: 1, imag: 0 }, { real: 0, imag: 0 }],
    [{ real: 0, imag: 0 }, { real: -1, imag: 0 }]
  ] as ComplexMatrix,
};

/**
 * Physical constants
 */
export const PHYSICAL_CONSTANTS = {
  /** Planck constant (J⋅s) */
  PLANCK: 6.62607015e-34,

  /** Reduced Planck constant (J⋅s) */
  HBAR: 1.054571817e-34,

  /** Speed of light (m/s) */
  SPEED_OF_LIGHT: 299792458,

  /** Boltzmann constant (J/K) */
  BOLTZMANN: 1.380649e-23,

  /** Elementary charge (C) */
  ELEMENTARY_CHARGE: 1.602176634e-19,
};

/**
 * Conversion factors
 */
export const CONVERSIONS = {
  /** Hartree to eV */
  HARTREE_TO_EV: 27.211386245988,

  /** Bohr to Angstrom */
  BOHR_TO_ANGSTROM: 0.529177210903,

  /** Kelvin to Hartree */
  KELVIN_TO_HARTREE: 3.1668115634556e-6,
};

export default {
  QUANTUM_STATES,
  PAULI_MATRICES,
  PHYSICAL_CONSTANTS,
  CONVERSIONS,
};
