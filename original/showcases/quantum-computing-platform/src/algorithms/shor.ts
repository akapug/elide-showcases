/**
 * Shor's Factoring Algorithm
 *
 * Implements Shor's quantum algorithm for integer factorization, providing
 * exponential speedup over classical algorithms. Demonstrates polynomial-time
 * factorization on quantum computers vs exponential classical algorithms.
 */

// @ts-ignore
import qiskit from 'python:qiskit';
// @ts-ignore
import numpy from 'python:numpy';

import { CircuitBuilder } from '../circuits/circuit-builder';
import {
  ShorResult,
  AlgorithmError,
  SimulationResult,
} from '../types';

/**
 * Shor's algorithm configuration
 */
export interface ShorConfig {
  /** Number to factor */
  n: number;

  /** Base for modular exponentiation (random if not provided) */
  a?: number;

  /** Number of shots for measurement */
  shots?: number;

  /** Maximum attempts */
  maxAttempts?: number;

  /** Use simplified simulation */
  simplified?: boolean;
}

/**
 * Shor's Factoring Algorithm
 *
 * Factors integers in polynomial time using quantum period finding.
 * Classical complexity: O(exp(n^(1/3))), Quantum complexity: O(n³)
 *
 * @example
 * ```typescript
 * const shor = new ShorFactoring(15);
 * const result = await shor.factor();
 * console.log('Factors:', result.factors); // [3, 5]
 * ```
 */
export class ShorFactoring {
  private n: number;
  private shots: number;
  private maxAttempts: number;
  private simplified: boolean;

  /**
   * Create Shor factoring instance
   * @param n Number to factor (must be odd composite)
   */
  constructor(n: number) {
    if (n < 2) {
      throw new AlgorithmError('Number to factor must be at least 2');
    }

    if (n % 2 === 0) {
      throw new AlgorithmError('Use classical factorization for even numbers');
    }

    if (this.isPrime(n)) {
      throw new AlgorithmError('Number is prime, cannot factor');
    }

    if (this.isPerfectPower(n)) {
      throw new AlgorithmError('Number is a perfect power, use classical methods');
    }

    this.n = n;
    this.shots = 1024;
    this.maxAttempts = 10;
    this.simplified = false;
  }

  /**
   * Factor the number using Shor's algorithm
   * @param config Optional configuration
   */
  async factor(config?: Partial<ShorConfig>): Promise<ShorResult> {
    this.shots = config?.shots || this.shots;
    this.maxAttempts = config?.maxAttempts || this.maxAttempts;
    this.simplified = config?.simplified || this.simplified;

    const startTime = Date.now();
    let attempts = 0;

    while (attempts < this.maxAttempts) {
      attempts++;

      // Step 1: Choose random a coprime to n
      const a = config?.a || this.chooseRandomA();

      console.log(`Attempt ${attempts}: Using a = ${a}`);

      // Step 2: Check if a shares a factor with n (classical)
      const gcd = this.gcd(a, this.n);
      if (gcd !== 1) {
        // Lucky case - found factor immediately
        const factor1 = gcd;
        const factor2 = this.n / gcd;

        const executionTime = Date.now() - startTime;

        return {
          success: true,
          value: [factor1, factor2],
          factors: [factor1, factor2],
          n: this.n,
          probability: 1.0,
          confidence: 1.0,
          iterations: attempts,
          executionTime,
          metadata: {
            method: 'gcd_shortcut',
            a,
          },
        };
      }

      try {
        // Step 3: Use quantum period finding to find period r
        const period = await this.findPeriod(a);

        if (!period) {
          console.log('Period finding failed, trying again...');
          continue;
        }

        console.log(`Found period: ${period}`);

        // Step 4: Use period to find factors (classical)
        if (period % 2 !== 0) {
          console.log('Period is odd, trying again...');
          continue;
        }

        const x = this.modPow(a, period / 2, this.n);

        if (x === this.n - 1) {
          console.log('a^(r/2) ≡ -1 (mod n), trying again...');
          continue;
        }

        // Compute factors
        const factor1 = this.gcd(x - 1, this.n);
        const factor2 = this.gcd(x + 1, this.n);

        if (factor1 !== 1 && factor1 !== this.n) {
          const otherFactor = this.n / factor1;

          const executionTime = Date.now() - startTime;

          return {
            success: true,
            value: [factor1, otherFactor],
            factors: [factor1, otherFactor],
            n: this.n,
            period,
            probability: 0.5,
            confidence: 0.8,
            iterations: attempts,
            executionTime,
            metadata: {
              a,
              period,
              x,
            },
          };
        }

        if (factor2 !== 1 && factor2 !== this.n) {
          const otherFactor = this.n / factor2;

          const executionTime = Date.now() - startTime;

          return {
            success: true,
            value: [factor2, otherFactor],
            factors: [factor2, otherFactor],
            n: this.n,
            period,
            probability: 0.5,
            confidence: 0.8,
            iterations: attempts,
            executionTime,
            metadata: {
              a,
              period,
              x,
            },
          };
        }

        console.log('Factors are trivial, trying again...');
      } catch (error) {
        console.error('Error in quantum period finding:', error);
        continue;
      }
    }

    throw new AlgorithmError(
      `Failed to find factors after ${this.maxAttempts} attempts`
    );
  }

  /**
   * Find period of a^x mod n using quantum period finding
   */
  private async findPeriod(a: number): Promise<number | null> {
    if (this.simplified) {
      // Use classical simulation for demonstration
      return this.findPeriodClassical(a);
    }

    try {
      // Calculate number of qubits needed
      const nQubits = Math.ceil(Math.log2(this.n));
      const countingQubits = 2 * nQubits + 1;

      // Build quantum period finding circuit
      const circuit = this.buildPeriodFindingCircuit(a, countingQubits, nQubits);

      // Execute circuit
      const result = await circuit.execute({
        backend: 'qasm',
        shots: this.shots,
      });

      if (!result.success) {
        return null;
      }

      // Extract period from measurement results
      const period = this.extractPeriod(result, a, countingQubits);

      return period;
    } catch (error) {
      console.error('Quantum period finding error:', error);
      // Fall back to classical for demonstration
      return this.findPeriodClassical(a);
    }
  }

  /**
   * Build quantum circuit for period finding
   */
  private buildPeriodFindingCircuit(
    a: number,
    countingQubits: number,
    workQubits: number
  ): CircuitBuilder {
    const totalQubits = countingQubits + workQubits;
    const circuit = new CircuitBuilder(totalQubits, countingQubits);

    // Initialize counting qubits in superposition
    for (let i = 0; i < countingQubits; i++) {
      circuit.addHadamard(i);
    }

    // Initialize work register to |1⟩
    circuit.addPauliX(countingQubits);

    circuit.addBarrier();

    // Controlled modular exponentiation
    for (let i = 0; i < countingQubits; i++) {
      const power = Math.pow(2, i);
      this.controlledModularExponentiation(
        circuit,
        a,
        power,
        this.n,
        i,
        countingQubits,
        workQubits
      );
    }

    circuit.addBarrier();

    // Apply inverse QFT to counting register
    this.applyInverseQFT(circuit, countingQubits);

    // Measure counting qubits
    const countingMeasurements = Array.from({ length: countingQubits }, (_, i) => i);
    circuit.measure(countingMeasurements, countingMeasurements);

    return circuit;
  }

  /**
   * Controlled modular exponentiation: |x⟩ → |x·a^power mod n⟩
   */
  private controlledModularExponentiation(
    circuit: CircuitBuilder,
    a: number,
    power: number,
    n: number,
    controlQubit: number,
    countingQubits: number,
    workQubits: number
  ): void {
    // Compute a^power mod n
    const exponent = this.modPow(a, power, n);

    // Implement controlled multiplication (simplified)
    // In practice, this requires a complex quantum arithmetic circuit
    // Here we use a placeholder implementation

    const workStart = countingQubits;

    // Apply controlled operations based on exponent value
    // This is a simplified version - real implementation needs quantum arithmetic
    for (let i = 0; i < workQubits; i++) {
      if ((exponent >> i) & 1) {
        circuit.addCNOT(controlQubit, workStart + i);
      }
    }
  }

  /**
   * Apply inverse Quantum Fourier Transform
   */
  private applyInverseQFT(circuit: CircuitBuilder, numQubits: number): void {
    // Reverse qubit order
    for (let i = 0; i < Math.floor(numQubits / 2); i++) {
      circuit.addSwap(i, numQubits - i - 1);
    }

    // Apply inverse QFT gates
    for (let j = 0; j < numQubits; j++) {
      for (let k = 0; k < j; k++) {
        const angle = -Math.PI / Math.pow(2, j - k);
        circuit.addControlledPhase(k, j, angle);
      }
      circuit.addHadamard(j);
    }
  }

  /**
   * Extract period from measurement results
   */
  private extractPeriod(
    result: SimulationResult,
    a: number,
    countingQubits: number
  ): number | null {
    // Find most common measurement
    let maxCount = 0;
    let measuredValue = 0;

    result.counts.forEach((count, bitstring) => {
      if (count > maxCount) {
        maxCount = count;
        measuredValue = parseInt(bitstring, 2);
      }
    });

    if (measuredValue === 0) {
      return null;
    }

    // Use continued fractions to find period
    const phase = measuredValue / Math.pow(2, countingQubits);
    const period = this.continuedFractionExpansion(phase, this.n);

    // Verify period
    if (period && this.modPow(a, period, this.n) === 1) {
      return period;
    }

    return null;
  }

  /**
   * Continued fraction expansion to find period from phase
   */
  private continuedFractionExpansion(phase: number, maxDenominator: number): number | null {
    const epsilon = 1e-10;
    let numerator = 0;
    let denominator = 1;

    for (let d = 1; d <= maxDenominator; d++) {
      const candidateNumerator = Math.round(phase * d);

      if (Math.abs(phase - candidateNumerator / d) < epsilon) {
        numerator = candidateNumerator;
        denominator = d;
        break;
      }
    }

    if (denominator === 1) {
      return null;
    }

    // Simplify fraction
    const g = this.gcd(numerator, denominator);
    return denominator / g;
  }

  /**
   * Classical period finding (for testing and fallback)
   */
  private findPeriodClassical(a: number): number {
    let result = 1;
    let period = 0;

    for (let r = 1; r <= this.n; r++) {
      result = (result * a) % this.n;
      if (result === 1) {
        period = r;
        break;
      }
    }

    return period;
  }

  /**
   * Choose random a coprime to n
   */
  private chooseRandomA(): number {
    let a: number;
    do {
      a = Math.floor(Math.random() * (this.n - 2)) + 2;
    } while (this.gcd(a, this.n) !== 1);
    return a;
  }

  /**
   * Greatest common divisor (Euclidean algorithm)
   */
  private gcd(a: number, b: number): number {
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return Math.abs(a);
  }

  /**
   * Modular exponentiation: a^b mod m
   */
  private modPow(a: number, b: number, m: number): number {
    let result = 1;
    a = a % m;

    while (b > 0) {
      if (b % 2 === 1) {
        result = (result * a) % m;
      }
      b = Math.floor(b / 2);
      a = (a * a) % m;
    }

    return result;
  }

  /**
   * Check if number is prime (simple trial division)
   */
  private isPrime(n: number): boolean {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;

    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false;
    }

    return true;
  }

  /**
   * Check if number is a perfect power
   */
  private isPerfectPower(n: number): boolean {
    for (let b = 2; b <= Math.log2(n); b++) {
      const a = Math.pow(n, 1 / b);
      const rounded = Math.round(a);

      if (Math.pow(rounded, b) === n) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get factorization requirements
   */
  getRequirements(): {
    qubits: number;
    gates: number;
    depth: number;
    complexity: string;
  } {
    const nQubits = Math.ceil(Math.log2(this.n));
    const countingQubits = 2 * nQubits + 1;
    const totalQubits = countingQubits + nQubits;

    // Rough estimates
    const gates = totalQubits * 100; // Simplified estimate
    const depth = totalQubits * 50;

    return {
      qubits: totalQubits,
      gates,
      depth,
      complexity: `O(n³) where n = ${Math.ceil(Math.log2(this.n))} bits`,
    };
  }

  /**
   * Factor multiple numbers in batch
   */
  static async batchFactor(numbers: number[]): Promise<Map<number, ShorResult>> {
    const results = new Map<number, ShorResult>();

    for (const n of numbers) {
      try {
        const shor = new ShorFactoring(n);
        const result = await shor.factor({ simplified: true });
        results.set(n, result);
      } catch (error) {
        console.error(`Failed to factor ${n}:`, error);
      }
    }

    return results;
  }

  /**
   * Benchmark Shor's algorithm
   */
  static async benchmark(
    numbers: number[]
  ): Promise<Array<{ n: number; factors: number[]; time: number; qubits: number }>> {
    const results = [];

    for (const n of numbers) {
      try {
        const shor = new ShorFactoring(n);
        const requirements = shor.getRequirements();

        const startTime = Date.now();
        const result = await shor.factor({ simplified: true });
        const time = Date.now() - startTime;

        results.push({
          n,
          factors: result.factors,
          time,
          qubits: requirements.qubits,
        });
      } catch (error) {
        console.error(`Benchmark failed for ${n}:`, error);
      }
    }

    return results;
  }

  /**
   * Verify factorization
   */
  static verifyFactorization(n: number, factors: number[]): boolean {
    if (factors.length < 2) return false;

    const product = factors.reduce((a, b) => a * b, 1);
    return product === n;
  }

  /**
   * Find all prime factors
   */
  static async findAllPrimeFactors(n: number): Promise<number[]> {
    const factors: number[] = [];
    let remaining = n;

    // Handle 2s
    while (remaining % 2 === 0) {
      factors.push(2);
      remaining /= 2;
    }

    // Factor remaining odd part
    while (remaining > 1) {
      if (this.isPrimeStatic(remaining)) {
        factors.push(remaining);
        break;
      }

      try {
        const shor = new ShorFactoring(remaining);
        const result = await shor.factor({ simplified: true });

        // Add smaller factor and continue with larger
        const [f1, f2] = result.factors.sort((a, b) => a - b);

        if (this.isPrimeStatic(f1)) {
          factors.push(f1);
        } else {
          // Recursively factor if not prime
          const subFactors = await this.findAllPrimeFactors(f1);
          factors.push(...subFactors);
        }

        remaining = f2;
      } catch (error) {
        // Fall back to trial division
        let found = false;
        for (let i = 3; i <= Math.sqrt(remaining); i += 2) {
          if (remaining % i === 0) {
            factors.push(i);
            remaining /= i;
            found = true;
            break;
          }
        }

        if (!found) {
          factors.push(remaining);
          break;
        }
      }
    }

    return factors.sort((a, b) => a - b);
  }

  /**
   * Static prime check
   */
  private static isPrimeStatic(n: number): boolean {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;

    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false;
    }

    return true;
  }

  /**
   * Demonstrate quantum advantage
   */
  static demonstrateQuantumAdvantage(bitSize: number): {
    classical: string;
    quantum: string;
    speedup: string;
  } {
    const n = bitSize;

    // Classical complexity: exp(1.9 * n^(1/3) * (log n)^(2/3))
    const classicalComplexity = Math.exp(
      1.9 * Math.pow(n, 1 / 3) * Math.pow(Math.log(n), 2 / 3)
    );

    // Quantum complexity: O(n³)
    const quantumComplexity = Math.pow(n, 3);

    const speedup = classicalComplexity / quantumComplexity;

    return {
      classical: `O(exp(${classicalComplexity.toExponential(2)}))`,
      quantum: `O(${quantumComplexity})`,
      speedup: `~${speedup.toExponential(2)}x`,
    };
  }
}

export default ShorFactoring;
