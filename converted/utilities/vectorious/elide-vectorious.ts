/**
 * vectorious - Linear Algebra
 *
 * High-performance linear algebra library.
 * **POLYGLOT SHOWCASE**: One linear algebra library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/vectorious (~10K+ downloads/week)
 *
 * Features:
 * - Vector and matrix operations
 * - BLAS-like operations
 * - High performance
 * - Zero dependencies
 *
 * Package has ~10K+ downloads/week on npm!
 */

export class NDArray {
  data: Float64Array;
  shape: number[];

  constructor(data: number[] | Float64Array, shape?: number[]) {
    this.data = data instanceof Float64Array ? data : new Float64Array(data);
    this.shape = shape || [this.data.length];
  }

  dot(other: NDArray): number {
    return this.data.reduce((sum, val, i) => sum + val * other.data[i], 0);
  }

  add(other: NDArray): NDArray {
    const result = new Float64Array(this.data.length);
    for (let i = 0; i < this.data.length; i++) {
      result[i] = this.data[i] + other.data[i];
    }
    return new NDArray(result, this.shape);
  }

  scale(scalar: number): NDArray {
    return new NDArray(this.data.map(x => x * scalar), this.shape);
  }

  magnitude(): number {
    return Math.sqrt(this.dot(this));
  }
}

export default { NDArray };

// CLI Demo
if (import.meta.url.includes("elide-vectorious.ts")) {
  console.log("⚡ vectorious for Elide (POLYGLOT!)\n");
  const v = new NDArray([1, 2, 3]);
  console.log("Magnitude:", v.magnitude().toFixed(2));
  console.log("\n🚀 ~10K+ downloads/week on npm!");
}
