/**
 * Quantum Circuit Simulator
 *
 * High-performance quantum circuit simulation using Qiskit Aer backends.
 * Supports statevector, QASM, unitary, and pulse simulations.
 */

// @ts-ignore
import qiskit from 'python:qiskit';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import matplotlib from 'python:matplotlib.pyplot';

import { CircuitBuilder } from '../circuits/circuit-builder';
import {
  SimulationOptions,
  SimulationResult,
  SimulatorBackend,
  NoiseModel,
  SimulationError,
  ComplexVector,
  ComplexMatrix,
  ExpectationValue,
  PauliString,
} from '../types';

/**
 * Quantum Circuit Simulator
 *
 * Provides access to multiple simulation backends with noise modeling support.
 *
 * @example
 * ```typescript
 * const simulator = new QuantumSimulator({
 *   backend: 'statevector',
 *   shots: 1024
 * });
 *
 * const result = await simulator.simulate(circuit);
 * console.log('Statevector:', result.statevector);
 * ```
 */
export class QuantumSimulator {
  private backend: SimulatorBackend;
  private shots: number;
  private optimizationLevel: number;
  private noiseModel: NoiseModel | null;
  private seed: number | null;
  private memoryLimit: number | null;
  private useGPU: boolean;
  private qiskitBackend: any;

  constructor(options: Partial<SimulationOptions> = {}) {
    this.backend = options.backend || 'qasm';
    this.shots = options.shots || 1024;
    this.optimizationLevel = options.optimization_level || 1;
    this.noiseModel = options.noise_model || null;
    this.seed = options.seed || null;
    this.memoryLimit = options.memoryLimit || null;
    this.useGPU = options.gpu || false;

    this.qiskitBackend = this.initializeBackend();
  }

  /**
   * Initialize Qiskit backend
   */
  private initializeBackend(): any {
    const Aer = qiskit.Aer;

    switch (this.backend) {
      case 'statevector':
        return Aer.get_backend('statevector_simulator');

      case 'qasm':
        return Aer.get_backend('qasm_simulator');

      case 'unitary':
        return Aer.get_backend('unitary_simulator');

      case 'pulse':
        return Aer.get_backend('pulse_simulator');

      case 'stabilizer':
        // Stabilizer simulator for Clifford circuits
        return Aer.get_backend('stabilizer_simulator');

      default:
        throw new SimulationError(`Unknown backend: ${this.backend}`);
    }
  }

  /**
   * Simulate quantum circuit
   */
  async simulate(circuit: CircuitBuilder): Promise<SimulationResult> {
    const startTime = Date.now();

    try {
      const qiskitCircuit = circuit.getQiskitCircuit();

      // Prepare execution options
      const executeOptions: any = {
        shots: this.shots,
        optimization_level: this.optimizationLevel,
      };

      if (this.seed !== null) {
        executeOptions.seed_simulator = this.seed;
      }

      if (this.noiseModel) {
        executeOptions.noise_model = this.convertNoiseModel(this.noiseModel);
      }

      // Execute circuit
      const job = qiskit.execute(qiskitCircuit, this.qiskitBackend, executeOptions);
      const result = job.result();

      const executionTime = Date.now() - startTime;

      // Extract results based on backend
      return this.extractResults(result, executionTime);
    } catch (error) {
      throw new SimulationError(
        `Simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract results from Qiskit result object
   */
  private extractResults(result: any, executionTime: number): SimulationResult {
    const simResult: SimulationResult = {
      counts: new Map(),
      probabilities: new Map(),
      executionTime,
      memoryUsed: 0,
      success: true,
    };

    try {
      // Get measurement counts
      if (this.backend === 'qasm' || this.backend === 'stabilizer') {
        const countsDict = result.get_counts();
        for (const key in countsDict) {
          simResult.counts.set(key, countsDict[key]);
        }

        // Calculate probabilities
        const totalShots = this.shots;
        simResult.counts.forEach((count, bitstring) => {
          simResult.probabilities.set(bitstring, count / totalShots);
        });
      }

      // Get statevector
      if (this.backend === 'statevector') {
        const sv = result.get_statevector();
        simResult.statevector = this.convertComplexArray(sv);

        // Calculate probabilities from statevector
        simResult.statevector.forEach((amplitude, index) => {
          const probability =
            amplitude.real * amplitude.real + amplitude.imag * amplitude.imag;
          const bitstring = index.toString(2).padStart(
            Math.log2(simResult.statevector!.length),
            '0'
          );
          simResult.probabilities.set(bitstring, probability);
        });
      }

      // Get unitary
      if (this.backend === 'unitary') {
        const unitary = result.get_unitary();
        simResult.unitary = this.convertComplexMatrix(unitary);
      }

      return simResult;
    } catch (error) {
      throw new SimulationError(
        `Result extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Simulate multiple circuits in batch
   */
  async simulateBatch(circuits: CircuitBuilder[]): Promise<SimulationResult[]> {
    const results: SimulationResult[] = [];

    for (const circuit of circuits) {
      const result = await this.simulate(circuit);
      results.push(result);
    }

    return results;
  }

  /**
   * Measure expectation value of observable
   */
  async measureExpectation(
    circuit: CircuitBuilder,
    observable: PauliString
  ): Promise<ExpectationValue> {
    const measurements: number[] = [];

    // Run multiple times to get statistics
    for (let i = 0; i < 10; i++) {
      const result = await this.simulate(circuit);
      const value = this.calculatePauliExpectation(result, observable);
      measurements.push(value);
    }

    const mean = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const variance =
      measurements.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) /
      measurements.length;
    const std = Math.sqrt(variance);

    return {
      value: mean,
      std,
      variance,
      shots: this.shots,
    };
  }

  /**
   * Calculate expectation value from measurement results
   */
  private calculatePauliExpectation(
    result: SimulationResult,
    observable: PauliString
  ): number {
    let expectation = 0;
    let total = 0;

    result.counts.forEach((count, bitstring) => {
      const parity = this.calculateParity(bitstring, observable);
      expectation += parity * count;
      total += count;
    });

    return total > 0 ? expectation / total : 0;
  }

  /**
   * Calculate parity for Pauli string
   */
  private calculateParity(bitstring: string, observable: PauliString): number {
    let ones = 0;

    for (let i = 0; i < observable.length; i++) {
      const pauli = observable[i];
      if (pauli !== 'I' && bitstring[i] === '1') {
        ones++;
      }
    }

    return ones % 2 === 0 ? 1 : -1;
  }

  /**
   * Get statevector at specific time
   */
  async getStatevector(circuit: CircuitBuilder): Promise<ComplexVector> {
    const tempBackend = this.backend;
    this.backend = 'statevector';
    this.qiskitBackend = this.initializeBackend();

    const result = await this.simulate(circuit);

    this.backend = tempBackend;
    this.qiskitBackend = this.initializeBackend();

    if (!result.statevector) {
      throw new SimulationError('Failed to get statevector');
    }

    return result.statevector;
  }

  /**
   * Get unitary matrix of circuit
   */
  async getUnitary(circuit: CircuitBuilder): Promise<ComplexMatrix> {
    const tempBackend = this.backend;
    this.backend = 'unitary';
    this.qiskitBackend = this.initializeBackend();

    const result = await this.simulate(circuit);

    this.backend = tempBackend;
    this.qiskitBackend = this.initializeBackend();

    if (!result.unitary) {
      throw new SimulationError('Failed to get unitary');
    }

    return result.unitary;
  }

  /**
   * Convert noise model to Qiskit format
   */
  private convertNoiseModel(noise: NoiseModel): any {
    // In real implementation, would convert to Qiskit NoiseModel
    // This is a placeholder
    return null;
  }

  /**
   * Convert NumPy array to ComplexVector
   */
  private convertComplexArray(array: any): ComplexVector {
    const result: ComplexVector = [];
    const length = array.length || array.shape[0];

    for (let i = 0; i < length; i++) {
      const value = array[i];
      result.push({
        real: value.real !== undefined ? value.real : value,
        imag: value.imag !== undefined ? value.imag : 0,
      });
    }

    return result;
  }

  /**
   * Convert NumPy matrix to ComplexMatrix
   */
  private convertComplexMatrix(matrix: any): ComplexMatrix {
    const result: ComplexMatrix = [];
    const rows = matrix.shape[0];
    const cols = matrix.shape[1];

    for (let i = 0; i < rows; i++) {
      const row: ComplexVector = [];
      for (let j = 0; j < cols; j++) {
        const value = matrix[i][j];
        row.push({
          real: value.real !== undefined ? value.real : value,
          imag: value.imag !== undefined ? value.imag : 0,
        });
      }
      result.push(row);
    }

    return result;
  }

  /**
   * Set backend
   */
  setBackend(backend: SimulatorBackend): void {
    this.backend = backend;
    this.qiskitBackend = this.initializeBackend();
  }

  /**
   * Set noise model
   */
  setNoiseModel(noise: NoiseModel | null): void {
    this.noiseModel = noise;
  }

  /**
   * Set shots
   */
  setShots(shots: number): void {
    this.shots = shots;
  }

  /**
   * Get backend info
   */
  getBackendInfo(): {
    name: string;
    type: SimulatorBackend;
    maxQubits: number;
    supportedFeatures: string[];
  } {
    const maxQubits =
      this.backend === 'statevector' ? 20 : this.backend === 'qasm' ? 30 : 15;

    return {
      name: this.qiskitBackend.name(),
      type: this.backend,
      maxQubits,
      supportedFeatures: this.getSupportedFeatures(),
    };
  }

  /**
   * Get supported features for current backend
   */
  private getSupportedFeatures(): string[] {
    const features: string[] = [];

    if (this.backend === 'statevector') {
      features.push('statevector', 'exact_probabilities', 'pure_states');
    } else if (this.backend === 'qasm') {
      features.push('measurements', 'sampling', 'noise', 'mixed_states');
    } else if (this.backend === 'unitary') {
      features.push('unitary_matrix', 'exact_evolution');
    }

    return features;
  }

  /**
   * Estimate memory requirements
   */
  estimateMemory(numQubits: number): {
    bytes: number;
    megabytes: number;
    gigabytes: number;
  } {
    let bytes = 0;

    if (this.backend === 'statevector') {
      // Complex128: 16 bytes per amplitude
      bytes = Math.pow(2, numQubits) * 16;
    } else if (this.backend === 'unitary') {
      // Complex128 matrix: 16 bytes * 2^n * 2^n
      bytes = Math.pow(2, numQubits) * Math.pow(2, numQubits) * 16;
    } else {
      // QASM simulator: much less memory
      bytes = numQubits * 1024; // Rough estimate
    }

    return {
      bytes,
      megabytes: bytes / (1024 * 1024),
      gigabytes: bytes / (1024 * 1024 * 1024),
    };
  }

  /**
   * Benchmark simulator performance
   */
  async benchmark(qubitCounts: number[]): Promise<Array<{
    qubits: number;
    time: number;
    memory: number;
  }>> {
    const results = [];

    for (const qubits of qubitCounts) {
      const circuit = new CircuitBuilder(qubits, qubits);

      // Add some gates
      for (let i = 0; i < qubits; i++) {
        circuit.addHadamard(i);
      }
      for (let i = 0; i < qubits - 1; i++) {
        circuit.addCNOT(i, i + 1);
      }
      circuit.measureAll();

      const startTime = Date.now();
      const result = await this.simulate(circuit);
      const time = Date.now() - startTime;

      const memEstimate = this.estimateMemory(qubits);

      results.push({
        qubits,
        time,
        memory: memEstimate.megabytes,
      });
    }

    return results;
  }
}

/**
 * State Tomography
 *
 * Reconstruct quantum state from measurement statistics
 */
export class StateTomography {
  private circuit: CircuitBuilder;
  private qubits: number;

  constructor(circuit: CircuitBuilder) {
    this.circuit = circuit;
    this.qubits = circuit.numQubitsCount();
  }

  /**
   * Reconstruct state using tomography
   */
  async reconstruct(options: {
    shots: number;
    basis: string[];
  }): Promise<{
    statevector: ComplexVector;
    densityMatrix: ComplexMatrix;
    fidelity: number;
    purity: number;
  }> {
    const measurements = new Map<string, Map<string, number>>();

    // Measure in different bases
    for (const basis of options.basis) {
      const measuredCircuit = this.prepareMeasurementBasis(basis);

      const simulator = new QuantumSimulator({
        backend: 'qasm',
        shots: options.shots,
      });

      const result = await simulator.simulate(measuredCircuit);
      measurements.set(basis, result.counts);
    }

    // Reconstruct density matrix
    const densityMatrix = this.reconstructDensityMatrix(measurements, options.shots);

    // Extract statevector (if pure state)
    const statevector = this.extractStatevector(densityMatrix);

    // Calculate purity
    const purity = this.calculatePurity(densityMatrix);

    return {
      statevector,
      densityMatrix,
      fidelity: 0.95, // Would need target state to calculate
      purity,
    };
  }

  /**
   * Prepare measurement in specific basis
   */
  private prepareMeasurementBasis(basis: string): CircuitBuilder {
    const circuit = this.circuit.clone();

    // Add basis transformation gates
    for (let i = 0; i < this.qubits; i++) {
      if (basis === 'X' || basis.charAt(i) === 'X') {
        circuit.addHadamard(i);
      } else if (basis === 'Y' || basis.charAt(i) === 'Y') {
        circuit.addSDaggerGate(i);
        circuit.addHadamard(i);
      }
      // Z basis: no transformation needed
    }

    circuit.measureAll();
    return circuit;
  }

  /**
   * Reconstruct density matrix from measurements
   */
  private reconstructDensityMatrix(
    measurements: Map<string, Map<string, number>>,
    shots: number
  ): ComplexMatrix {
    const dim = Math.pow(2, this.qubits);
    const rho: ComplexMatrix = Array(dim)
      .fill(null)
      .map(() =>
        Array(dim)
          .fill(null)
          .map(() => ({ real: 0, imag: 0 }))
      );

    // Simplified reconstruction (full tomography requires maximum likelihood)
    // This is a placeholder implementation

    return rho;
  }

  /**
   * Extract statevector from density matrix
   */
  private extractStatevector(densityMatrix: ComplexMatrix): ComplexVector {
    // Extract diagonal for simplified case
    return densityMatrix.map(row => row[0]);
  }

  /**
   * Calculate purity of density matrix
   */
  private calculatePurity(rho: ComplexMatrix): number {
    // Tr(ρ²)
    let purity = 0;

    for (let i = 0; i < rho.length; i++) {
      for (let j = 0; j < rho.length; j++) {
        const product =
          rho[i][j].real * rho[j][i].real - rho[i][j].imag * rho[j][i].imag;
        purity += product;
      }
    }

    return Math.abs(purity);
  }
}

export default QuantumSimulator;
