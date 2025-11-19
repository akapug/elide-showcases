/**
 * Quantum Circuit Builder
 *
 * Provides a fluent API for building quantum circuits using Qiskit through Elide's
 * polyglot bridge. Demonstrates seamless TypeScript/Python integration.
 */

// @ts-ignore
import qiskit from 'python:qiskit';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import matplotlib from 'python:matplotlib.pyplot';

import {
  QuantumCircuit,
  QuantumGate,
  GateType,
  SimulationResult,
  SimulationOptions,
  Measurement,
  MeasurementBasis,
  CircuitProperties,
  OptimizationOptions,
  TranspiledCircuit,
  CircuitError,
  ComplexVector,
  ComplexMatrix,
} from '../types';

/**
 * Circuit builder with fluent API for quantum circuit construction
 */
export class CircuitBuilder {
  private qiskitCircuit: any;
  private numQubits: number;
  private numClassicalBits: number;
  private gates: QuantumGate[] = [];
  private measurements: Measurement[] = [];
  private circuitName: string;
  private metadata: Record<string, unknown> = {};

  /**
   * Create a new quantum circuit
   * @param qubits Number of qubits
   * @param classicalBits Number of classical bits
   * @param name Optional circuit name
   */
  constructor(qubits: number, classicalBits: number = 0, name?: string) {
    if (qubits <= 0) {
      throw new CircuitError('Number of qubits must be positive');
    }
    if (classicalBits < 0) {
      throw new CircuitError('Number of classical bits cannot be negative');
    }

    this.numQubits = qubits;
    this.numClassicalBits = classicalBits;
    this.circuitName = name || `quantum_circuit_${qubits}q`;

    // Create Qiskit quantum circuit using polyglot bridge
    this.qiskitCircuit = new qiskit.QuantumCircuit(qubits, classicalBits);
  }

  // ============================================================================
  // Single-Qubit Gates
  // ============================================================================

  /**
   * Add Hadamard gate (creates superposition)
   * H = 1/√2 * [[1, 1], [1, -1]]
   */
  addHadamard(qubit: number): this {
    this.validateQubit(qubit);
    this.qiskitCircuit.h(qubit);
    this.gates.push({
      name: 'h',
      qubits: [qubit],
      parameters: [],
      isParameterized: false,
    });
    return this;
  }

  /**
   * Add Pauli-X gate (bit flip, NOT gate)
   * X = [[0, 1], [1, 0]]
   */
  addPauliX(qubit: number): this {
    this.validateQubit(qubit);
    this.qiskitCircuit.x(qubit);
    this.gates.push({
      name: 'x',
      qubits: [qubit],
      parameters: [],
      isParameterized: false,
    });
    return this;
  }

  /**
   * Add Pauli-Y gate
   * Y = [[0, -i], [i, 0]]
   */
  addPauliY(qubit: number): this {
    this.validateQubit(qubit);
    this.qiskitCircuit.y(qubit);
    this.gates.push({
      name: 'y',
      qubits: [qubit],
      parameters: [],
      isParameterized: false,
    });
    return this;
  }

  /**
   * Add Pauli-Z gate (phase flip)
   * Z = [[1, 0], [0, -1]]
   */
  addPauliZ(qubit: number): this {
    this.validateQubit(qubit);
    this.qiskitCircuit.z(qubit);
    this.gates.push({
      name: 'z',
      qubits: [qubit],
      parameters: [],
      isParameterized: false,
    });
    return this;
  }

  /**
   * Add S gate (√Z, phase gate)
   * S = [[1, 0], [0, i]]
   */
  addSGate(qubit: number): this {
    this.validateQubit(qubit);
    this.qiskitCircuit.s(qubit);
    this.gates.push({
      name: 's',
      qubits: [qubit],
      parameters: [],
      isParameterized: false,
    });
    return this;
  }

  /**
   * Add S† gate (conjugate of S)
   */
  addSDaggerGate(qubit: number): this {
    this.validateQubit(qubit);
    this.qiskitCircuit.sdg(qubit);
    this.gates.push({
      name: 'sdg',
      qubits: [qubit],
      parameters: [],
      isParameterized: false,
    });
    return this;
  }

  /**
   * Add T gate (π/8 gate, √S)
   * T = [[1, 0], [0, e^(iπ/4)]]
   */
  addTGate(qubit: number): this {
    this.validateQubit(qubit);
    this.qiskitCircuit.t(qubit);
    this.gates.push({
      name: 't',
      qubits: [qubit],
      parameters: [],
      isParameterized: false,
    });
    return this;
  }

  /**
   * Add T† gate (conjugate of T)
   */
  addTDaggerGate(qubit: number): this {
    this.validateQubit(qubit);
    this.qiskitCircuit.tdg(qubit);
    this.gates.push({
      name: 'tdg',
      qubits: [qubit],
      parameters: [],
      isParameterized: false,
    });
    return this;
  }

  /**
   * Add rotation around X-axis
   * RX(θ) = [[cos(θ/2), -i·sin(θ/2)], [-i·sin(θ/2), cos(θ/2)]]
   */
  addRX(qubit: number, theta: number): this {
    this.validateQubit(qubit);
    this.qiskitCircuit.rx(theta, qubit);
    this.gates.push({
      name: 'rx',
      qubits: [qubit],
      parameters: [theta],
      isParameterized: true,
    });
    return this;
  }

  /**
   * Add rotation around Y-axis
   * RY(θ) = [[cos(θ/2), -sin(θ/2)], [sin(θ/2), cos(θ/2)]]
   */
  addRY(qubit: number, theta: number): this {
    this.validateQubit(qubit);
    this.qiskitCircuit.ry(theta, qubit);
    this.gates.push({
      name: 'ry',
      qubits: [qubit],
      parameters: [theta],
      isParameterized: true,
    });
    return this;
  }

  /**
   * Add rotation around Z-axis
   * RZ(θ) = [[e^(-iθ/2), 0], [0, e^(iθ/2)]]
   */
  addRZ(qubit: number, theta: number): this {
    this.validateQubit(qubit);
    this.qiskitCircuit.rz(theta, qubit);
    this.gates.push({
      name: 'rz',
      qubits: [qubit],
      parameters: [theta],
      isParameterized: true,
    });
    return this;
  }

  /**
   * Add general U gate (arbitrary single-qubit rotation)
   * U(θ, φ, λ)
   */
  addUGate(qubit: number, theta: number, phi: number, lambda: number): this {
    this.validateQubit(qubit);
    this.qiskitCircuit.u(theta, phi, lambda, qubit);
    this.gates.push({
      name: 'u',
      qubits: [qubit],
      parameters: [theta, phi, lambda],
      isParameterized: true,
    });
    return this;
  }

  /**
   * Add phase gate U1
   */
  addPhase(qubit: number, lambda: number): this {
    this.validateQubit(qubit);
    this.qiskitCircuit.p(lambda, qubit);
    this.gates.push({
      name: 'u1',
      qubits: [qubit],
      parameters: [lambda],
      isParameterized: true,
    });
    return this;
  }

  /**
   * Add identity gate (no operation)
   */
  addIdentity(qubit: number): this {
    this.validateQubit(qubit);
    this.qiskitCircuit.id(qubit);
    this.gates.push({
      name: 'id',
      qubits: [qubit],
      parameters: [],
      isParameterized: false,
    });
    return this;
  }

  // ============================================================================
  // Two-Qubit Gates
  // ============================================================================

  /**
   * Add CNOT (Controlled-NOT) gate
   * Most important two-qubit gate for entanglement
   */
  addCNOT(control: number, target: number): this {
    this.validateQubit(control);
    this.validateQubit(target);
    if (control === target) {
      throw new CircuitError('Control and target qubits must be different');
    }

    this.qiskitCircuit.cx(control, target);
    this.gates.push({
      name: 'cx',
      qubits: [control, target],
      parameters: [],
      isParameterized: false,
    });
    return this;
  }

  /**
   * Add CY (Controlled-Y) gate
   */
  addCY(control: number, target: number): this {
    this.validateQubit(control);
    this.validateQubit(target);
    if (control === target) {
      throw new CircuitError('Control and target qubits must be different');
    }

    this.qiskitCircuit.cy(control, target);
    this.gates.push({
      name: 'cy',
      qubits: [control, target],
      parameters: [],
      isParameterized: false,
    });
    return this;
  }

  /**
   * Add CZ (Controlled-Z) gate
   */
  addCZ(control: number, target: number): this {
    this.validateQubit(control);
    this.validateQubit(target);
    if (control === target) {
      throw new CircuitError('Control and target qubits must be different');
    }

    this.qiskitCircuit.cz(control, target);
    this.gates.push({
      name: 'cz',
      qubits: [control, target],
      parameters: [],
      isParameterized: false,
    });
    return this;
  }

  /**
   * Add SWAP gate (swaps quantum states of two qubits)
   */
  addSwap(qubit1: number, qubit2: number): this {
    this.validateQubit(qubit1);
    this.validateQubit(qubit2);
    if (qubit1 === qubit2) {
      throw new CircuitError('Cannot swap qubit with itself');
    }

    this.qiskitCircuit.swap(qubit1, qubit2);
    this.gates.push({
      name: 'swap',
      qubits: [qubit1, qubit2],
      parameters: [],
      isParameterized: false,
    });
    return this;
  }

  /**
   * Add Controlled-RX gate
   */
  addCRX(control: number, target: number, theta: number): this {
    this.validateQubit(control);
    this.validateQubit(target);
    if (control === target) {
      throw new CircuitError('Control and target qubits must be different');
    }

    this.qiskitCircuit.crx(theta, control, target);
    this.gates.push({
      name: 'crx',
      qubits: [control, target],
      parameters: [theta],
      isParameterized: true,
    });
    return this;
  }

  /**
   * Add Controlled-RY gate
   */
  addCRY(control: number, target: number, theta: number): this {
    this.validateQubit(control);
    this.validateQubit(target);
    if (control === target) {
      throw new CircuitError('Control and target qubits must be different');
    }

    this.qiskitCircuit.cry(theta, control, target);
    this.gates.push({
      name: 'cry',
      qubits: [control, target],
      parameters: [theta],
      isParameterized: true,
    });
    return this;
  }

  /**
   * Add Controlled-RZ gate
   */
  addCRZ(control: number, target: number, theta: number): this {
    this.validateQubit(control);
    this.validateQubit(target);
    if (control === target) {
      throw new CircuitError('Control and target qubits must be different');
    }

    this.qiskitCircuit.crz(theta, control, target);
    this.gates.push({
      name: 'crz',
      qubits: [control, target],
      parameters: [theta],
      isParameterized: true,
    });
    return this;
  }

  /**
   * Add Controlled-Phase gate
   */
  addControlledPhase(control: number, target: number, theta: number): this {
    this.validateQubit(control);
    this.validateQubit(target);
    if (control === target) {
      throw new CircuitError('Control and target qubits must be different');
    }

    this.qiskitCircuit.cp(theta, control, target);
    this.gates.push({
      name: 'cp',
      qubits: [control, target],
      parameters: [theta],
      isParameterized: true,
    });
    return this;
  }

  // ============================================================================
  // Multi-Qubit Gates
  // ============================================================================

  /**
   * Add Toffoli (CCX, CCNOT) gate
   * Three-qubit controlled-controlled-NOT gate
   */
  addToffoli(control1: number, control2: number, target: number): this {
    this.validateQubit(control1);
    this.validateQubit(control2);
    this.validateQubit(target);

    const qubits = [control1, control2, target];
    if (new Set(qubits).size !== 3) {
      throw new CircuitError('All qubits must be different for Toffoli gate');
    }

    this.qiskitCircuit.ccx(control1, control2, target);
    this.gates.push({
      name: 'ccx',
      qubits: [control1, control2, target],
      parameters: [],
      isParameterized: false,
    });
    return this;
  }

  /**
   * Add Fredkin (CSWAP) gate
   * Controlled-SWAP gate
   */
  addFredkin(control: number, target1: number, target2: number): this {
    this.validateQubit(control);
    this.validateQubit(target1);
    this.validateQubit(target2);

    const qubits = [control, target1, target2];
    if (new Set(qubits).size !== 3) {
      throw new CircuitError('All qubits must be different for Fredkin gate');
    }

    this.qiskitCircuit.cswap(control, target1, target2);
    this.gates.push({
      name: 'cswap',
      qubits: [control, target1, target2],
      parameters: [],
      isParameterized: false,
    });
    return this;
  }

  /**
   * Add multi-controlled X gate
   */
  addMultiControlledX(controls: number[], target: number): this {
    controls.forEach(c => this.validateQubit(c));
    this.validateQubit(target);

    const allQubits = [...controls, target];
    if (new Set(allQubits).size !== allQubits.length) {
      throw new CircuitError('All qubits must be different');
    }

    this.qiskitCircuit.mcx(controls, target);
    this.gates.push({
      name: 'mcx',
      qubits: allQubits,
      parameters: [],
      isParameterized: false,
    });
    return this;
  }

  // ============================================================================
  // Measurements
  // ============================================================================

  /**
   * Measure qubits into classical bits
   */
  measure(qubits: number[], classicalBits: number[]): this {
    if (qubits.length !== classicalBits.length) {
      throw new CircuitError('Number of qubits and classical bits must match');
    }

    qubits.forEach(q => this.validateQubit(q));
    classicalBits.forEach(c => this.validateClassicalBit(c));

    // Add measurement to Qiskit circuit
    for (let i = 0; i < qubits.length; i++) {
      this.qiskitCircuit.measure(qubits[i], classicalBits[i]);
    }

    this.measurements.push({
      qubits,
      classicalBits,
      basis: 'computational',
    });

    return this;
  }

  /**
   * Measure all qubits
   */
  measureAll(): this {
    if (this.numClassicalBits < this.numQubits) {
      throw new CircuitError('Not enough classical bits to measure all qubits');
    }

    const qubits = Array.from({ length: this.numQubits }, (_, i) => i);
    const classicalBits = Array.from({ length: this.numQubits }, (_, i) => i);

    return this.measure(qubits, classicalBits);
  }

  /**
   * Measure single qubit
   */
  measureQubit(qubit: number, classicalBit: number): this {
    return this.measure([qubit], [classicalBit]);
  }

  // ============================================================================
  // Circuit Manipulation
  // ============================================================================

  /**
   * Add barrier (prevents optimization across this point)
   */
  addBarrier(qubits?: number[]): this {
    if (qubits) {
      qubits.forEach(q => this.validateQubit(q));
      this.qiskitCircuit.barrier(qubits);
    } else {
      this.qiskitCircuit.barrier();
    }
    return this;
  }

  /**
   * Reset qubit to |0⟩ state
   */
  reset(qubit: number): this {
    this.validateQubit(qubit);
    this.qiskitCircuit.reset(qubit);
    return this;
  }

  /**
   * Reset all qubits
   */
  resetAll(): this {
    for (let i = 0; i < this.numQubits; i++) {
      this.qiskitCircuit.reset(i);
    }
    return this;
  }

  /**
   * Compose with another circuit
   */
  compose(other: CircuitBuilder, qubits?: number[]): this {
    if (qubits) {
      this.qiskitCircuit = this.qiskitCircuit.compose(other.qiskitCircuit, qubits);
    } else {
      this.qiskitCircuit = this.qiskitCircuit.compose(other.qiskitCircuit);
    }

    this.gates.push(...other.gates);
    return this;
  }

  /**
   * Inverse of the circuit
   */
  inverse(): CircuitBuilder {
    const inversed = new CircuitBuilder(
      this.numQubits,
      this.numClassicalBits,
      `${this.circuitName}_inverse`
    );
    inversed.qiskitCircuit = this.qiskitCircuit.inverse();
    return inversed;
  }

  /**
   * Repeat circuit n times
   */
  repeat(n: number): CircuitBuilder {
    if (n <= 0) {
      throw new CircuitError('Repeat count must be positive');
    }

    const repeated = new CircuitBuilder(
      this.numQubits,
      this.numClassicalBits,
      `${this.circuitName}_x${n}`
    );

    for (let i = 0; i < n; i++) {
      repeated.compose(this);
    }

    return repeated;
  }

  // ============================================================================
  // Circuit Analysis
  // ============================================================================

  /**
   * Get circuit depth (longest path from input to output)
   */
  depth(): number {
    return this.qiskitCircuit.depth();
  }

  /**
   * Get total gate count
   */
  gateCount(): number {
    return this.gates.length;
  }

  /**
   * Get gate count by type
   */
  gateCountByType(): Map<GateType, number> {
    const counts = new Map<GateType, number>();

    this.gates.forEach(gate => {
      const type = gate.name as GateType;
      counts.set(type, (counts.get(type) || 0) + 1);
    });

    return counts;
  }

  /**
   * Get circuit properties
   */
  properties(): CircuitProperties {
    const gatesByType = this.gateCountByType();
    const twoQubitGates = this.gates.filter(g => g.qubits.length === 2).length;

    const connectivity = new Map<number, Set<number>>();
    this.gates.forEach(gate => {
      if (gate.qubits.length === 2) {
        const [q1, q2] = gate.qubits;
        if (!connectivity.has(q1)) connectivity.set(q1, new Set());
        if (!connectivity.has(q2)) connectivity.set(q2, new Set());
        connectivity.get(q1)!.add(q2);
        connectivity.get(q2)!.add(q1);
      }
    });

    return {
      depth: this.depth(),
      gateCount: this.gateCount(),
      gatesByType,
      twoQubitGates,
      connectivity,
      criticalPath: [], // Would require more complex analysis
    };
  }

  /**
   * Count number of qubits
   */
  numQubitsCount(): number {
    return this.numQubits;
  }

  /**
   * Count number of classical bits
   */
  numClassicalBitsCount(): number {
    return this.numClassicalBits;
  }

  // ============================================================================
  // Optimization and Transpilation
  // ============================================================================

  /**
   * Optimize circuit
   * @param level Optimization level (0-3)
   */
  optimize(level: number = 1): CircuitBuilder {
    if (level < 0 || level > 3) {
      throw new CircuitError('Optimization level must be between 0 and 3');
    }

    const optimized = new CircuitBuilder(
      this.numQubits,
      this.numClassicalBits,
      `${this.circuitName}_opt${level}`
    );

    // Use Qiskit transpiler for optimization
    const transpiler = qiskit.transpile;
    optimized.qiskitCircuit = transpiler(this.qiskitCircuit, {
      optimization_level: level,
    });

    return optimized;
  }

  /**
   * Decompose circuit into basis gates
   */
  decompose(basisGates?: GateType[]): CircuitBuilder {
    const decomposed = new CircuitBuilder(
      this.numQubits,
      this.numClassicalBits,
      `${this.circuitName}_decomposed`
    );

    if (basisGates) {
      const transpiler = qiskit.transpile;
      decomposed.qiskitCircuit = transpiler(this.qiskitCircuit, {
        basis_gates: basisGates,
      });
    } else {
      decomposed.qiskitCircuit = this.qiskitCircuit.decompose();
    }

    return decomposed;
  }

  // ============================================================================
  // Execution
  // ============================================================================

  /**
   * Execute circuit and return results
   */
  async execute(options: Partial<SimulationOptions> = {}): Promise<SimulationResult> {
    const defaultOptions: SimulationOptions = {
      backend: 'qasm',
      shots: 1024,
      optimization_level: 1,
    };

    const execOptions = { ...defaultOptions, ...options };

    try {
      // Import Qiskit Aer for simulation
      const Aer = qiskit.Aer;
      let backend;

      if (execOptions.backend === 'statevector') {
        backend = Aer.get_backend('statevector_simulator');
      } else if (execOptions.backend === 'unitary') {
        backend = Aer.get_backend('unitary_simulator');
      } else {
        backend = Aer.get_backend('qasm_simulator');
      }

      const startTime = Date.now();

      // Execute circuit
      const job = qiskit.execute(this.qiskitCircuit, backend, {
        shots: execOptions.shots,
        optimization_level: execOptions.optimization_level,
      });

      const result = job.result();
      const executionTime = Date.now() - startTime;

      // Extract results
      const counts = new Map<string, number>();
      if (execOptions.backend === 'qasm') {
        const countsDict = result.get_counts();
        for (const key in countsDict) {
          counts.set(key, countsDict[key]);
        }
      }

      // Calculate probabilities
      const probabilities = new Map<string, number>();
      const totalShots = execOptions.shots || 1024;
      counts.forEach((count, bitstring) => {
        probabilities.set(bitstring, count / totalShots);
      });

      // Get statevector if available
      let statevector: ComplexVector | undefined;
      if (execOptions.backend === 'statevector') {
        const sv = result.get_statevector();
        statevector = this.convertToComplexVector(sv);
      }

      // Get unitary if available
      let unitary: ComplexMatrix | undefined;
      if (execOptions.backend === 'unitary') {
        const u = result.get_unitary();
        unitary = this.convertToComplexMatrix(u);
      }

      return {
        counts,
        statevector,
        unitary,
        probabilities,
        executionTime,
        memoryUsed: 0, // Would need to implement memory tracking
        success: true,
      };
    } catch (error) {
      return {
        counts: new Map(),
        probabilities: new Map(),
        executionTime: 0,
        memoryUsed: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // Visualization
  // ============================================================================

  /**
   * Draw circuit as text
   */
  drawText(): string {
    return this.qiskitCircuit.draw('text').toString();
  }

  /**
   * Draw circuit using matplotlib
   */
  async drawMatplotlib(filename?: string): Promise<void> {
    const fig = this.qiskitCircuit.draw('mpl');

    if (filename) {
      matplotlib.savefig(filename);
    } else {
      matplotlib.show();
    }
  }

  /**
   * Get QASM representation
   */
  toQASM(): string {
    return this.qiskitCircuit.qasm();
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get underlying Qiskit circuit
   */
  getQiskitCircuit(): any {
    return this.qiskitCircuit;
  }

  /**
   * Convert to QuantumCircuit interface
   */
  toQuantumCircuit(): QuantumCircuit {
    return {
      qubits: this.numQubits,
      classicalBits: this.numClassicalBits,
      gates: this.gates,
      measurements: this.measurements,
      name: this.circuitName,
      metadata: this.metadata,
    };
  }

  /**
   * Clone circuit
   */
  clone(): CircuitBuilder {
    const cloned = new CircuitBuilder(
      this.numQubits,
      this.numClassicalBits,
      `${this.circuitName}_clone`
    );
    cloned.qiskitCircuit = this.qiskitCircuit.copy();
    cloned.gates = [...this.gates];
    cloned.measurements = [...this.measurements];
    cloned.metadata = { ...this.metadata };
    return cloned;
  }

  /**
   * Validate qubit index
   */
  private validateQubit(qubit: number): void {
    if (qubit < 0 || qubit >= this.numQubits) {
      throw new CircuitError(
        `Qubit index ${qubit} out of range [0, ${this.numQubits - 1}]`
      );
    }
  }

  /**
   * Validate classical bit index
   */
  private validateClassicalBit(bit: number): void {
    if (bit < 0 || bit >= this.numClassicalBits) {
      throw new CircuitError(
        `Classical bit index ${bit} out of range [0, ${this.numClassicalBits - 1}]`
      );
    }
  }

  /**
   * Convert NumPy array to ComplexVector
   */
  private convertToComplexVector(numpyArray: any): ComplexVector {
    const vector: ComplexVector = [];
    const length = numpyArray.length;

    for (let i = 0; i < length; i++) {
      const value = numpyArray[i];
      vector.push({
        real: value.real || value,
        imag: value.imag || 0,
      });
    }

    return vector;
  }

  /**
   * Convert NumPy matrix to ComplexMatrix
   */
  private convertToComplexMatrix(numpyMatrix: any): ComplexMatrix {
    const matrix: ComplexMatrix = [];
    const rows = numpyMatrix.shape[0];
    const cols = numpyMatrix.shape[1];

    for (let i = 0; i < rows; i++) {
      const row: ComplexVector = [];
      for (let j = 0; j < cols; j++) {
        const value = numpyMatrix[i][j];
        row.push({
          real: value.real || value,
          imag: value.imag || 0,
        });
      }
      matrix.push(row);
    }

    return matrix;
  }

  /**
   * Set circuit metadata
   */
  setMetadata(key: string, value: unknown): this {
    this.metadata[key] = value;
    return this;
  }

  /**
   * Get circuit metadata
   */
  getMetadata(key: string): unknown {
    return this.metadata[key];
  }

  /**
   * Get all metadata
   */
  getAllMetadata(): Record<string, unknown> {
    return { ...this.metadata };
  }
}

/**
 * Helper function to create a Bell state circuit
 */
export function createBellState(): CircuitBuilder {
  const circuit = new CircuitBuilder(2, 2, 'bell_state');
  circuit.addHadamard(0);
  circuit.addCNOT(0, 1);
  circuit.measureAll();
  return circuit;
}

/**
 * Helper function to create a GHZ state circuit
 */
export function createGHZState(numQubits: number): CircuitBuilder {
  if (numQubits < 2) {
    throw new CircuitError('GHZ state requires at least 2 qubits');
  }

  const circuit = new CircuitBuilder(numQubits, numQubits, 'ghz_state');
  circuit.addHadamard(0);

  for (let i = 1; i < numQubits; i++) {
    circuit.addCNOT(0, i);
  }

  circuit.measureAll();
  return circuit;
}

/**
 * Helper function to create a W state circuit
 */
export function createWState(numQubits: number): CircuitBuilder {
  if (numQubits < 2) {
    throw new CircuitError('W state requires at least 2 qubits');
  }

  const circuit = new CircuitBuilder(numQubits, numQubits, 'w_state');

  // Create W state using recursive construction
  circuit.addRY(0, 2 * Math.asin(Math.sqrt(1 / numQubits)));

  for (let i = 1; i < numQubits; i++) {
    const theta = 2 * Math.asin(Math.sqrt(1 / (numQubits - i)));
    circuit.addCRY(i - 1, i, theta);
    circuit.addCNOT(i, i - 1);
  }

  circuit.measureAll();
  return circuit;
}

export default CircuitBuilder;
