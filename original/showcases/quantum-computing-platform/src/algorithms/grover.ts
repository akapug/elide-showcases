/**
 * Grover's Search Algorithm
 *
 * Implements Grover's quantum search algorithm, providing quadratic speedup
 * for searching unstructured databases. Demonstrates O(√N) complexity vs O(N) classical.
 */

// @ts-ignore
import qiskit from 'python:qiskit';
// @ts-ignore
import numpy from 'python:numpy';

import { CircuitBuilder } from '../circuits/circuit-builder';
import {
  GroverResult,
  AlgorithmError,
  SimulationResult,
  QuantumCircuit,
} from '../types';

/**
 * Grover's search algorithm configuration
 */
export interface GroverConfig {
  /** Database to search */
  database: string[];

  /** Target item to find */
  target?: string;

  /** Number of iterations (auto-calculated if not provided) */
  iterations?: number;

  /** Number of shots for measurement */
  shots?: number;

  /** Optimization level */
  optimizationLevel?: number;
}

/**
 * Grover's Search Algorithm
 *
 * Searches for a marked item in an unstructured database with quadratic speedup.
 * Classical complexity: O(N), Quantum complexity: O(√N)
 *
 * @example
 * ```typescript
 * const grover = new GroverSearch(['00', '01', '10', '11']);
 * const result = await grover.search('10');
 * console.log('Found:', result.target, 'with probability:', result.probability);
 * ```
 */
export class GroverSearch {
  private database: string[];
  private numQubits: number;
  private target: string | null = null;
  private optimalIterations: number;
  private shots: number;
  private optimizationLevel: number;

  /**
   * Create Grover search instance
   * @param database Array of bit strings representing searchable items
   */
  constructor(database: string[]) {
    if (database.length === 0) {
      throw new AlgorithmError('Database cannot be empty');
    }

    // Validate database entries
    const bitLength = database[0].length;
    if (!database.every(item => item.length === bitLength)) {
      throw new AlgorithmError('All database items must have same bit length');
    }

    if (!database.every(item => /^[01]+$/.test(item))) {
      throw new AlgorithmError('Database items must be binary strings');
    }

    this.database = database;
    this.numQubits = bitLength;

    // Calculate optimal number of Grover iterations
    this.optimalIterations = Math.floor(
      (Math.PI / 4) * Math.sqrt(Math.pow(2, this.numQubits))
    );

    this.shots = 1024;
    this.optimizationLevel = 1;
  }

  /**
   * Search for target item in database
   * @param target Target bit string to find
   * @param config Optional configuration
   */
  async search(target: string, config?: Partial<GroverConfig>): Promise<GroverResult> {
    if (!this.database.includes(target)) {
      throw new AlgorithmError('Target not in database');
    }

    this.target = target;
    this.shots = config?.shots || this.shots;
    this.optimizationLevel = config?.optimizationLevel || this.optimizationLevel;

    const iterations = config?.iterations || this.optimalIterations;

    const startTime = Date.now();

    try {
      // Build Grover circuit
      const circuit = this.buildCircuit(target, iterations);

      // Execute circuit
      const result = await circuit.execute({
        backend: 'qasm',
        shots: this.shots,
        optimization_level: this.optimizationLevel,
      });

      if (!result.success) {
        throw new AlgorithmError(result.error || 'Simulation failed');
      }

      const executionTime = Date.now() - startTime;

      // Analyze results
      const targetProbability = result.probabilities.get(target) || 0;
      const confidence = this.calculateConfidence(result.counts, target);

      return {
        success: true,
        value: target,
        target,
        probability: targetProbability,
        optimalIterations: this.optimalIterations,
        confidence,
        iterations,
        executionTime,
        counts: result.counts,
        circuit: circuit.toQuantumCircuit(),
      };
    } catch (error) {
      throw new AlgorithmError(
        `Grover search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search without knowing target (finds any marked item)
   * Requires custom oracle function
   */
  async searchWithOracle(
    oracle: (circuit: CircuitBuilder) => void,
    iterations?: number
  ): Promise<GroverResult> {
    const startTime = Date.now();

    try {
      const circuit = new CircuitBuilder(this.numQubits, this.numQubits);

      // Initialize with Hadamard gates (equal superposition)
      this.initializeSuperposition(circuit);

      // Apply Grover iterations
      const numIterations = iterations || this.optimalIterations;
      for (let i = 0; i < numIterations; i++) {
        // Apply oracle
        oracle(circuit);

        // Apply diffusion operator
        this.applyDiffusion(circuit);
      }

      // Measure
      circuit.measureAll();

      // Execute
      const result = await circuit.execute({
        backend: 'qasm',
        shots: this.shots,
      });

      if (!result.success) {
        throw new AlgorithmError(result.error || 'Simulation failed');
      }

      const executionTime = Date.now() - startTime;

      // Find most probable outcome
      let maxCount = 0;
      let foundTarget = '';

      result.counts.forEach((count, bitstring) => {
        if (count > maxCount) {
          maxCount = count;
          foundTarget = bitstring;
        }
      });

      const probability = result.probabilities.get(foundTarget) || 0;

      return {
        success: true,
        value: foundTarget,
        target: foundTarget,
        probability,
        optimalIterations: this.optimalIterations,
        confidence: probability,
        iterations: numIterations,
        executionTime,
        counts: result.counts,
        circuit: circuit.toQuantumCircuit(),
      };
    } catch (error) {
      throw new AlgorithmError(
        `Grover oracle search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build complete Grover circuit
   */
  private buildCircuit(target: string, iterations: number): CircuitBuilder {
    const circuit = new CircuitBuilder(this.numQubits, this.numQubits);

    // Step 1: Initialize qubits in equal superposition
    this.initializeSuperposition(circuit);

    // Step 2: Apply Grover iterations
    for (let i = 0; i < iterations; i++) {
      // Apply oracle (marks target state)
      this.applyOracle(circuit, target);

      // Apply diffusion operator (amplifies target)
      this.applyDiffusion(circuit);

      // Add barrier for clarity
      circuit.addBarrier();
    }

    // Step 3: Measure all qubits
    circuit.measureAll();

    return circuit;
  }

  /**
   * Initialize qubits in equal superposition
   * |ψ⟩ = (1/√N) Σ|x⟩
   */
  private initializeSuperposition(circuit: CircuitBuilder): void {
    for (let i = 0; i < this.numQubits; i++) {
      circuit.addHadamard(i);
    }
  }

  /**
   * Apply oracle that marks the target state
   * Oracle: O|x⟩ = (-1)^f(x)|x⟩ where f(x) = 1 if x = target
   */
  private applyOracle(circuit: CircuitBuilder, target: string): void {
    // Convert target to qubit indices that should be in |1⟩ state
    const targetBits = target.split('').map(bit => bit === '1');

    // Apply X gates to qubits that should be 0 in target
    for (let i = 0; i < this.numQubits; i++) {
      if (!targetBits[i]) {
        circuit.addPauliX(i);
      }
    }

    // Apply multi-controlled Z gate
    if (this.numQubits === 1) {
      circuit.addPauliZ(0);
    } else if (this.numQubits === 2) {
      circuit.addCZ(0, 1);
    } else {
      // For 3+ qubits, use multi-controlled Z
      // Implement using H-CCX-H pattern on last qubit
      const lastQubit = this.numQubits - 1;
      circuit.addHadamard(lastQubit);

      if (this.numQubits === 3) {
        circuit.addToffoli(0, 1, lastQubit);
      } else {
        // For more qubits, use multi-controlled X
        const controls = Array.from({ length: this.numQubits - 1 }, (_, i) => i);
        circuit.addMultiControlledX(controls, lastQubit);
      }

      circuit.addHadamard(lastQubit);
    }

    // Uncompute: Apply X gates again to restore
    for (let i = 0; i < this.numQubits; i++) {
      if (!targetBits[i]) {
        circuit.addPauliX(i);
      }
    }
  }

  /**
   * Apply diffusion operator (Grover operator)
   * D = 2|s⟩⟨s| - I where |s⟩ is equal superposition
   */
  private applyDiffusion(circuit: CircuitBuilder): void {
    // Apply H gates
    for (let i = 0; i < this.numQubits; i++) {
      circuit.addHadamard(i);
    }

    // Apply X gates
    for (let i = 0; i < this.numQubits; i++) {
      circuit.addPauliX(i);
    }

    // Apply multi-controlled Z gate (same as oracle for all-ones)
    if (this.numQubits === 1) {
      circuit.addPauliZ(0);
    } else if (this.numQubits === 2) {
      circuit.addCZ(0, 1);
    } else {
      const lastQubit = this.numQubits - 1;
      circuit.addHadamard(lastQubit);

      if (this.numQubits === 3) {
        circuit.addToffoli(0, 1, lastQubit);
      } else {
        const controls = Array.from({ length: this.numQubits - 1 }, (_, i) => i);
        circuit.addMultiControlledX(controls, lastQubit);
      }

      circuit.addHadamard(lastQubit);
    }

    // Apply X gates
    for (let i = 0; i < this.numQubits; i++) {
      circuit.addPauliX(i);
    }

    // Apply H gates
    for (let i = 0; i < this.numQubits; i++) {
      circuit.addHadamard(i);
    }
  }

  /**
   * Calculate confidence score based on measurement results
   */
  private calculateConfidence(counts: Map<string, number>, target: string): number {
    const targetCount = counts.get(target) || 0;
    let totalCount = 0;

    counts.forEach(count => {
      totalCount += count;
    });

    return totalCount > 0 ? targetCount / totalCount : 0;
  }

  /**
   * Get optimal number of iterations for given database size
   */
  static calculateOptimalIterations(databaseSize: number): number {
    return Math.floor((Math.PI / 4) * Math.sqrt(databaseSize));
  }

  /**
   * Calculate success probability after k iterations
   */
  static calculateSuccessProbability(
    databaseSize: number,
    iterations: number
  ): number {
    const theta = Math.asin(1 / Math.sqrt(databaseSize));
    return Math.pow(Math.sin((2 * iterations + 1) * theta), 2);
  }

  /**
   * Get number of qubits needed for database size
   */
  static calculateRequiredQubits(databaseSize: number): number {
    return Math.ceil(Math.log2(databaseSize));
  }

  /**
   * Generate random database of given size
   */
  static generateRandomDatabase(size: number): string[] {
    const numQubits = GroverSearch.calculateRequiredQubits(size);
    const database: string[] = [];
    const maxSize = Math.pow(2, numQubits);

    // Generate all possible bit strings up to size
    for (let i = 0; i < Math.min(size, maxSize); i++) {
      const bitstring = i.toString(2).padStart(numQubits, '0');
      database.push(bitstring);
    }

    return database;
  }

  /**
   * Benchmark Grover's algorithm for different database sizes
   */
  static async benchmark(
    sizes: number[]
  ): Promise<Array<{ size: number; iterations: number; time: number; probability: number }>> {
    const results = [];

    for (const size of sizes) {
      const database = GroverSearch.generateRandomDatabase(size);
      const target = database[Math.floor(Math.random() * database.length)];

      const grover = new GroverSearch(database);
      const startTime = Date.now();
      const result = await grover.search(target);
      const time = Date.now() - startTime;

      results.push({
        size,
        iterations: result.iterations,
        time,
        probability: result.probability,
      });
    }

    return results;
  }

  /**
   * Demonstrate amplitude amplification
   * Shows how probability increases with iterations
   */
  async demonstrateAmplification(target: string): Promise<{
    iterations: number[];
    probabilities: number[];
  }> {
    const maxIterations = this.optimalIterations * 2;
    const iterations: number[] = [];
    const probabilities: number[] = [];

    for (let i = 0; i <= maxIterations; i++) {
      const circuit = this.buildCircuit(target, i);
      const result = await circuit.execute({
        backend: 'qasm',
        shots: this.shots,
      });

      iterations.push(i);
      probabilities.push(result.probabilities.get(target) || 0);
    }

    return { iterations, probabilities };
  }

  /**
   * Search multiple targets simultaneously
   */
  async searchMultiple(targets: string[]): Promise<Map<string, GroverResult>> {
    const results = new Map<string, GroverResult>();

    for (const target of targets) {
      if (this.database.includes(target)) {
        const result = await this.search(target);
        results.set(target, result);
      }
    }

    return results;
  }

  /**
   * Get database information
   */
  getDatabaseInfo(): {
    size: number;
    qubits: number;
    optimalIterations: number;
    speedup: number;
  } {
    const size = this.database.length;
    const classicalComplexity = size;
    const quantumComplexity = this.optimalIterations;
    const speedup = classicalComplexity / quantumComplexity;

    return {
      size,
      qubits: this.numQubits,
      optimalIterations: this.optimalIterations,
      speedup,
    };
  }

  /**
   * Visualize search process
   */
  async visualizeSearch(target: string): Promise<void> {
    const { iterations, probabilities } = await this.demonstrateAmplification(target);

    console.log('Grover Search Amplitude Amplification:');
    console.log('=====================================');

    for (let i = 0; i < iterations.length; i++) {
      const prob = probabilities[i];
      const barLength = Math.floor(prob * 50);
      const bar = '█'.repeat(barLength) + '░'.repeat(50 - barLength);

      console.log(`Iter ${iterations[i].toString().padStart(2)}: ${bar} ${(prob * 100).toFixed(1)}%`);
    }

    console.log('\nOptimal iterations:', this.optimalIterations);
    console.log('Database size:', this.database.length);
    console.log('Speedup: ~', Math.sqrt(this.database.length).toFixed(1), 'x');
  }
}

/**
 * Custom oracle builder for advanced Grover searches
 */
export class GroverOracle {
  /**
   * Create oracle for single-bit marked state
   */
  static singleBitOracle(qubit: number, value: boolean): (circuit: CircuitBuilder) => void {
    return (circuit: CircuitBuilder) => {
      if (!value) {
        circuit.addPauliX(qubit);
      }
      circuit.addPauliZ(qubit);
      if (!value) {
        circuit.addPauliX(qubit);
      }
    };
  }

  /**
   * Create oracle for multiple marked states
   */
  static multipleTargetsOracle(targets: string[]): (circuit: CircuitBuilder) => void {
    return (circuit: CircuitBuilder) => {
      for (const target of targets) {
        const bits = target.split('').map(b => b === '1');
        const numQubits = bits.length;

        // Apply X gates for 0 bits
        for (let i = 0; i < numQubits; i++) {
          if (!bits[i]) {
            circuit.addPauliX(i);
          }
        }

        // Apply multi-controlled Z
        if (numQubits === 1) {
          circuit.addPauliZ(0);
        } else if (numQubits === 2) {
          circuit.addCZ(0, 1);
        } else {
          const lastQubit = numQubits - 1;
          circuit.addHadamard(lastQubit);

          if (numQubits === 3) {
            circuit.addToffoli(0, 1, lastQubit);
          } else {
            const controls = Array.from({ length: numQubits - 1 }, (_, i) => i);
            circuit.addMultiControlledX(controls, lastQubit);
          }

          circuit.addHadamard(lastQubit);
        }

        // Uncompute X gates
        for (let i = 0; i < numQubits; i++) {
          if (!bits[i]) {
            circuit.addPauliX(i);
          }
        }
      }
    };
  }

  /**
   * Create oracle for pattern matching
   */
  static patternOracle(pattern: string): (circuit: CircuitBuilder) => void {
    return (circuit: CircuitBuilder) => {
      const bits = pattern.split('');
      const numQubits = bits.length;

      for (let i = 0; i < numQubits; i++) {
        if (bits[i] === '0') {
          circuit.addPauliX(i);
        } else if (bits[i] === 'x' || bits[i] === 'X') {
          // Don't care bit - skip
          continue;
        }
      }

      // Count non-wildcard bits
      const controlQubits = bits
        .map((bit, idx) => (bit !== 'x' && bit !== 'X' ? idx : -1))
        .filter(idx => idx >= 0);

      if (controlQubits.length > 0) {
        // Apply multi-controlled Z on non-wildcard bits
        const lastControl = controlQubits[controlQubits.length - 1];
        circuit.addHadamard(lastControl);

        if (controlQubits.length === 2) {
          circuit.addCNOT(controlQubits[0], lastControl);
        } else if (controlQubits.length > 2) {
          const controls = controlQubits.slice(0, -1);
          circuit.addMultiControlledX(controls, lastControl);
        }

        circuit.addHadamard(lastControl);
      }

      // Uncompute
      for (let i = 0; i < numQubits; i++) {
        if (bits[i] === '0') {
          circuit.addPauliX(i);
        }
      }
    };
  }
}

export default GroverSearch;
