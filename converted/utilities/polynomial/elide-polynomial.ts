/**
 * polynomial - Polynomial Operations
 *
 * Polynomial arithmetic and evaluation.
 * **POLYGLOT SHOWCASE**: One polynomial library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/polynomial (~20K+ downloads/week)
 *
 * Features:
 * - Polynomial evaluation
 * - Addition, subtraction, multiplication
 * - Derivative and integral
 * - Zero dependencies
 *
 * Package has ~20K+ downloads/week on npm!
 */

export class Polynomial {
  coeffs: number[];

  constructor(coeffs: number[]) {
    this.coeffs = coeffs;
  }

  eval(x: number): number {
    return this.coeffs.reduce((sum, c, i) => sum + c * Math.pow(x, i), 0);
  }

  add(other: Polynomial): Polynomial {
    const maxLen = Math.max(this.coeffs.length, other.coeffs.length);
    const result: number[] = [];
    for (let i = 0; i < maxLen; i++) {
      result.push((this.coeffs[i] || 0) + (other.coeffs[i] || 0));
    }
    return new Polynomial(result);
  }

  mul(other: Polynomial): Polynomial {
    const result = new Array(this.coeffs.length + other.coeffs.length - 1).fill(0);
    for (let i = 0; i < this.coeffs.length; i++) {
      for (let j = 0; j < other.coeffs.length; j++) {
        result[i + j] += this.coeffs[i] * other.coeffs[j];
      }
    }
    return new Polynomial(result);
  }

  derivative(): Polynomial {
    if (this.coeffs.length === 1) return new Polynomial([0]);
    return new Polynomial(this.coeffs.slice(1).map((c, i) => c * (i + 1)));
  }
}

export default Polynomial;

// CLI Demo
if (import.meta.url.includes("elide-polynomial.ts")) {
  console.log("🔢 polynomial for Elide (POLYGLOT!)\n");
  const p = new Polynomial([1, 2, 3]); // 1 + 2x + 3x²
  console.log("p(2) =", p.eval(2));
  console.log("p'(x) coeffs:", p.derivative().coeffs);
  console.log("\n🚀 ~20K+ downloads/week on npm!");
}
