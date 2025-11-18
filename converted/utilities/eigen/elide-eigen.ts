/**
 * eigen - Eigenvalues
 *
 * Eigenvalue and eigenvector computation.
 * **POLYGLOT SHOWCASE**: One eigenvalue library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/eigen (~5K+ downloads/week)
 *
 * Features:
 * - Power iteration method
 * - Eigenvalue computation
 * - Eigenvector computation
 * - Zero dependencies
 *
 * Package has ~5K+ downloads/week on npm!
 */

type Matrix = number[][];
type Vector = number[];

export function powerIteration(matrix: Matrix, iterations: number = 100): { eigenvalue: number; eigenvector: Vector } {
  const n = matrix.length;
  let v: Vector = Array(n).fill(1);

  for (let iter = 0; iter < iterations; iter++) {
    // Multiply matrix by vector
    const newV: Vector = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        newV[i] += matrix[i][j] * v[j];
      }
    }

    // Normalize
    const norm = Math.sqrt(newV.reduce((sum, x) => sum + x * x, 0));
    v = newV.map(x => x / norm);
  }

  // Calculate eigenvalue
  let eigenvalue = 0;
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += matrix[i][j] * v[j];
    }
    eigenvalue += v[i] * sum;
  }

  return { eigenvalue, eigenvector: v };
}

export default { powerIteration };

// CLI Demo
if (import.meta.url.includes("elide-eigen.ts")) {
  console.log("🔍 eigen for Elide (POLYGLOT!)\n");
  const A = [[4, 1], [2, 3]];
  const result = powerIteration(A);
  console.log("Eigenvalue:", result.eigenvalue.toFixed(4));
  console.log("Eigenvector:", result.eigenvector.map(x => x.toFixed(4)));
  console.log("\n🚀 ~5K+ downloads/week on npm!");
}
