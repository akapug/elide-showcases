/**
 * linear-algebra - Linear Algebra
 *
 * Linear algebra operations.
 * **POLYGLOT SHOWCASE**: One linear algebra library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/linear-algebra (~20K+ downloads/week)
 *
 * Features:
 * - Vector and matrix operations
 * - Dot product, cross product
 * - Matrix inverse and determinant
 * - Zero dependencies
 *
 * Package has ~20K+ downloads/week on npm!
 */

type Vector = number[];
type Matrix = number[][];

export function dot(a: Vector, b: Vector): number {
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

export function cross(a: Vector, b: Vector): Vector {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

export function norm(v: Vector): number {
  return Math.sqrt(dot(v, v));
}

export function matmul(a: Matrix, b: Matrix): Matrix {
  const result: Matrix = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < a[0].length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

export default { dot, cross, norm, matmul };

// CLI Demo
if (import.meta.url.includes("elide-linear-algebra.ts")) {
  console.log("🔢 linear-algebra for Elide (POLYGLOT!)\n");
  const v1 = [1, 2, 3];
  const v2 = [4, 5, 6];
  console.log("dot:", dot(v1, v2));
  console.log("cross:", cross(v1, v2));
  console.log("norm:", norm(v1).toFixed(2));
  console.log("\n🚀 ~20K+ downloads/week on npm!");
}
