/**
 * Mathematical Utilities for Quantum Computing
 * 
 * Comprehensive mathematical functions for quantum algorithms including
 * linear algebra, complex numbers, probability distributions, and more.
 */

// @ts-ignore
import numpy from 'python:numpy';

import { Complex, ComplexVector, ComplexMatrix, RealVector, RealMatrix } from '../types';

/**
 * Complex number operations
 */
export class ComplexMath {
  /**
   * Create complex number
   */
  static complex(real: number, imag: number = 0): Complex {
    return { real, imag };
  }

  /**
   * Add two complex numbers
   */
  static add(a: Complex, b: Complex): Complex {
    return {
      real: a.real + b.real,
      imag: a.imag + b.imag,
    };
  }

  /**
   * Subtract complex numbers
   */
  static subtract(a: Complex, b: Complex): Complex {
    return {
      real: a.real - b.real,
      imag: a.imag - b.imag,
    };
  }

  /**
   * Multiply complex numbers
   */
  static multiply(a: Complex, b: Complex): Complex {
    return {
      real: a.real * b.real - a.imag * b.imag,
      imag: a.real * b.imag + a.imag * b.real,
    };
  }

  /**
   * Divide complex numbers
   */
  static divide(a: Complex, b: Complex): Complex {
    const denom = b.real * b.real + b.imag * b.imag;
    return {
      real: (a.real * b.real + a.imag * b.imag) / denom,
      imag: (a.imag * b.real - a.real * b.imag) / denom,
    };
  }

  /**
   * Complex conjugate
   */
  static conjugate(z: Complex): Complex {
    return {
      real: z.real,
      imag: -z.imag,
    };
  }

  /**
   * Magnitude (absolute value)
   */
  static magnitude(z: Complex): number {
    return Math.sqrt(z.real * z.real + z.imag * z.imag);
  }

  /**
   * Phase (argument)
   */
  static phase(z: Complex): number {
    return Math.atan2(z.imag, z.real);
  }

  /**
   * Exponential: e^(iθ)
   */
  static exp(theta: number): Complex {
    return {
      real: Math.cos(theta),
      imag: Math.sin(theta),
    };
  }

  /**
   * Power
   */
  static pow(z: Complex, n: number): Complex {
    const r = Math.pow(this.magnitude(z), n);
    const theta = this.phase(z) * n;
    return {
      real: r * Math.cos(theta),
      imag: r * Math.sin(theta),
    };
  }
}

/**
 * Vector operations for quantum states
 */
export class VectorMath {
  /**
   * Dot product of complex vectors
   */
  static dot(a: ComplexVector, b: ComplexVector): Complex {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let result: Complex = { real: 0, imag: 0 };

    for (let i = 0; i < a.length; i++) {
      const product = ComplexMath.multiply(
        ComplexMath.conjugate(a[i]),
        b[i]
      );
      result = ComplexMath.add(result, product);
    }

    return result;
  }

  /**
   * Norm (length) of complex vector
   */
  static norm(v: ComplexVector): number {
    let sum = 0;
    for (const z of v) {
      sum += z.real * z.real + z.imag * z.imag;
    }
    return Math.sqrt(sum);
  }

  /**
   * Normalize vector
   */
  static normalize(v: ComplexVector): ComplexVector {
    const n = this.norm(v);
    return v.map(z => ({
      real: z.real / n,
      imag: z.imag / n,
    }));
  }

  /**
   * Tensor product of vectors
   */
  static tensorProduct(a: ComplexVector, b: ComplexVector): ComplexVector {
    const result: ComplexVector = [];

    for (const ai of a) {
      for (const bi of b) {
        result.push(ComplexMath.multiply(ai, bi));
      }
    }

    return result;
  }

  /**
   * Outer product
   */
  static outerProduct(a: ComplexVector, b: ComplexVector): ComplexMatrix {
    const result: ComplexMatrix = [];

    for (let i = 0; i < a.length; i++) {
      const row: ComplexVector = [];
      for (let j = 0; j < b.length; j++) {
        row.push(ComplexMath.multiply(a[i], ComplexMath.conjugate(b[j])));
      }
      result.push(row);
    }

    return result;
  }

  /**
   * Fidelity between two quantum states
   */
  static fidelity(a: ComplexVector, b: ComplexVector): number {
    const dotProduct = this.dot(a, b);
    const magnitude = ComplexMath.magnitude(dotProduct);
    return magnitude * magnitude;
  }

  /**
   * Create zero vector
   */
  static zeros(n: number): ComplexVector {
    return Array(n).fill(null).map(() => ({ real: 0, imag: 0 }));
  }

  /**
   * Create basis vector |i⟩
   */
  static basis(n: number, i: number): ComplexVector {
    const v = this.zeros(n);
    v[i] = { real: 1, imag: 0 };
    return v;
  }
}

/**
 * Matrix operations for quantum gates
 */
export class MatrixMath {
  /**
   * Matrix multiplication
   */
  static multiply(a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
    if (a[0].length !== b.length) {
      throw new Error('Invalid matrix dimensions for multiplication');
    }

    const result: ComplexMatrix = [];

    for (let i = 0; i < a.length; i++) {
      const row: ComplexVector = [];
      for (let j = 0; j < b[0].length; j++) {
        let sum: Complex = { real: 0, imag: 0 };
        for (let k = 0; k < a[0].length; k++) {
          const product = ComplexMath.multiply(a[i][k], b[k][j]);
          sum = ComplexMath.add(sum, product);
        }
        row.push(sum);
      }
      result.push(row);
    }

    return result;
  }

  /**
   * Matrix-vector multiplication
   */
  static multiplyVector(m: ComplexMatrix, v: ComplexVector): ComplexVector {
    if (m[0].length !== v.length) {
      throw new Error('Invalid dimensions for matrix-vector multiplication');
    }

    const result: ComplexVector = [];

    for (let i = 0; i < m.length; i++) {
      let sum: Complex = { real: 0, imag: 0 };
      for (let j = 0; j < v.length; j++) {
        const product = ComplexMath.multiply(m[i][j], v[j]);
        sum = ComplexMath.add(sum, product);
      }
      result.push(sum);
    }

    return result;
  }

  /**
   * Transpose matrix
   */
  static transpose(m: ComplexMatrix): ComplexMatrix {
    const result: ComplexMatrix = [];

    for (let j = 0; j < m[0].length; j++) {
      const row: ComplexVector = [];
      for (let i = 0; i < m.length; i++) {
        row.push(m[i][j]);
      }
      result.push(row);
    }

    return result;
  }

  /**
   * Hermitian conjugate (dagger)
   */
  static dagger(m: ComplexMatrix): ComplexMatrix {
    const transposed = this.transpose(m);
    return transposed.map(row =>
      row.map(z => ComplexMath.conjugate(z))
    );
  }

  /**
   * Tensor product of matrices
   */
  static tensorProduct(a: ComplexMatrix, b: ComplexMatrix): ComplexMatrix {
    const result: ComplexMatrix = [];

    for (let i = 0; i < a.length; i++) {
      for (let k = 0; k < b.length; k++) {
        const row: ComplexVector = [];
        for (let j = 0; j < a[0].length; j++) {
          for (let l = 0; l < b[0].length; l++) {
            row.push(ComplexMath.multiply(a[i][j], b[k][l]));
          }
        }
        result.push(row);
      }
    }

    return result;
  }

  /**
   * Trace of matrix
   */
  static trace(m: ComplexMatrix): Complex {
    let sum: Complex = { real: 0, imag: 0 };
    const n = Math.min(m.length, m[0].length);

    for (let i = 0; i < n; i++) {
      sum = ComplexMath.add(sum, m[i][i]);
    }

    return sum;
  }

  /**
   * Identity matrix
   */
  static identity(n: number): ComplexMatrix {
    const result: ComplexMatrix = [];

    for (let i = 0; i < n; i++) {
      const row: ComplexVector = [];
      for (let j = 0; j < n; j++) {
        row.push({
          real: i === j ? 1 : 0,
          imag: 0,
        });
      }
      result.push(row);
    }

    return result;
  }

  /**
   * Check if matrix is unitary
   */
  static isUnitary(m: ComplexMatrix, tolerance: number = 1e-10): boolean {
    const dagger = this.dagger(m);
    const product = this.multiply(m, dagger);
    const identity = this.identity(m.length);

    // Check if M†M ≈ I
    for (let i = 0; i < m.length; i++) {
      for (let j = 0; j < m.length; j++) {
        const diff = ComplexMath.subtract(product[i][j], identity[i][j]);
        if (ComplexMath.magnitude(diff) > tolerance) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if matrix is Hermitian
   */
  static isHermitian(m: ComplexMatrix, tolerance: number = 1e-10): boolean {
    const dagger = this.dagger(m);

    for (let i = 0; i < m.length; i++) {
      for (let j = 0; j < m.length; j++) {
        const diff = ComplexMath.subtract(m[i][j], dagger[i][j]);
        if (ComplexMath.magnitude(diff) > tolerance) {
          return false;
        }
      }
    }

    return true;
  }
}

/**
 * Probability and statistics utilities
 */
export class ProbabilityMath {
  /**
   * Sample from probability distribution
   */
  static sample(probabilities: Map<string, number>): string {
    const rand = Math.random();
    let cumulative = 0;

    for (const [outcome, prob] of probabilities) {
      cumulative += prob;
      if (rand < cumulative) {
        return outcome;
      }
    }

    // Return last outcome if rounding errors
    return Array.from(probabilities.keys())[probabilities.size - 1];
  }

  /**
   * Shannon entropy
   */
  static entropy(probabilities: Map<string, number>): number {
    let entropy = 0;

    for (const prob of probabilities.values()) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }

    return entropy;
  }

  /**
   * KL divergence
   */
  static klDivergence(
    p: Map<string, number>,
    q: Map<string, number>
  ): number {
    let kl = 0;

    for (const [outcome, pProb] of p) {
      const qProb = q.get(outcome) || 1e-10;
      if (pProb > 0) {
        kl += pProb * Math.log2(pProb / qProb);
      }
    }

    return kl;
  }

  /**
   * Total variation distance
   */
  static totalVariation(
    p: Map<string, number>,
    q: Map<string, number>
  ): number {
    let distance = 0;
    const allOutcomes = new Set([...p.keys(), ...q.keys()]);

    for (const outcome of allOutcomes) {
      const pProb = p.get(outcome) || 0;
      const qProb = q.get(outcome) || 0;
      distance += Math.abs(pProb - qProb);
    }

    return distance / 2;
  }

  /**
   * Expected value
   */
  static expectation(
    probabilities: Map<string, number>,
    valueFunction: (outcome: string) => number
  ): number {
    let expectation = 0;

    for (const [outcome, prob] of probabilities) {
      expectation += prob * valueFunction(outcome);
    }

    return expectation;
  }

  /**
   * Variance
   */
  static variance(
    probabilities: Map<string, number>,
    valueFunction: (outcome: string) => number
  ): number {
    const mean = this.expectation(probabilities, valueFunction);
    let variance = 0;

    for (const [outcome, prob] of probabilities) {
      const value = valueFunction(outcome);
      variance += prob * Math.pow(value - mean, 2);
    }

    return variance;
  }
}

/**
 * Number theory utilities for Shor's algorithm
 */
export class NumberTheory {
  /**
   * Greatest common divisor
   */
  static gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);

    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }

    return a;
  }

  /**
   * Extended Euclidean algorithm
   */
  static extendedGcd(a: number, b: number): { gcd: number; x: number; y: number } {
    if (b === 0) {
      return { gcd: a, x: 1, y: 0 };
    }

    const result = this.extendedGcd(b, a % b);
    return {
      gcd: result.gcd,
      x: result.y,
      y: result.x - Math.floor(a / b) * result.y,
    };
  }

  /**
   * Modular multiplicative inverse
   */
  static modInverse(a: number, m: number): number {
    const { gcd, x } = this.extendedGcd(a, m);

    if (gcd !== 1) {
      throw new Error('Modular inverse does not exist');
    }

    return ((x % m) + m) % m;
  }

  /**
   * Modular exponentiation
   */
  static modPow(base: number, exponent: number, modulus: number): number {
    let result = 1;
    base = base % modulus;

    while (exponent > 0) {
      if (exponent % 2 === 1) {
        result = (result * base) % modulus;
      }
      exponent = Math.floor(exponent / 2);
      base = (base * base) % modulus;
    }

    return result;
  }

  /**
   * Check if prime (Miller-Rabin)
   */
  static isPrime(n: number, k: number = 5): boolean {
    if (n < 2) return false;
    if (n === 2 || n === 3) return true;
    if (n % 2 === 0) return false;

    // Write n-1 as 2^r * d
    let d = n - 1;
    let r = 0;
    while (d % 2 === 0) {
      d /= 2;
      r++;
    }

    // Witness loop
    for (let i = 0; i < k; i++) {
      const a = 2 + Math.floor(Math.random() * (n - 3));
      let x = this.modPow(a, d, n);

      if (x === 1 || x === n - 1) continue;

      let composite = true;
      for (let j = 0; j < r - 1; j++) {
        x = this.modPow(x, 2, n);
        if (x === n - 1) {
          composite = false;
          break;
        }
      }

      if (composite) return false;
    }

    return true;
  }

  /**
   * Factor using trial division
   */
  static trialDivision(n: number): number[] {
    const factors: number[] = [];
    let remaining = n;

    // Factor out 2s
    while (remaining % 2 === 0) {
      factors.push(2);
      remaining /= 2;
    }

    // Factor out odd numbers
    for (let i = 3; i <= Math.sqrt(remaining); i += 2) {
      while (remaining % i === 0) {
        factors.push(i);
        remaining /= i;
      }
    }

    if (remaining > 1) {
      factors.push(remaining);
    }

    return factors;
  }

  /**
   * Continued fraction expansion
   */
  static continuedFraction(x: number, maxTerms: number = 10): number[] {
    const terms: number[] = [];
    let remaining = x;

    for (let i = 0; i < maxTerms; i++) {
      const term = Math.floor(remaining);
      terms.push(term);

      remaining -= term;
      if (Math.abs(remaining) < 1e-10) break;

      remaining = 1 / remaining;
    }

    return terms;
  }

  /**
   * Evaluate continued fraction
   */
  static evaluateContinuedFraction(terms: number[]): number {
    if (terms.length === 0) return 0;

    let result = terms[terms.length - 1];

    for (let i = terms.length - 2; i >= 0; i--) {
      result = terms[i] + 1 / result;
    }

    return result;
  }
}

export default {
  ComplexMath,
  VectorMath,
  MatrixMath,
  ProbabilityMath,
  NumberTheory,
};
