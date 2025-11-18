/**
 * sylvester - Vector and Matrix Math
 *
 * Vector and matrix mathematics library.
 * **POLYGLOT SHOWCASE**: One vector/matrix library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/sylvester (~30K+ downloads/week)
 *
 * Features:
 * - Vector class with operations
 * - Matrix class with operations
 * - Dot products, cross products
 * - Zero dependencies
 *
 * Package has ~30K+ downloads/week on npm!
 */

export class Vector {
  elements: number[];

  constructor(elements: number[]) {
    this.elements = elements;
  }

  dot(other: Vector): number {
    return this.elements.reduce((sum, val, i) => sum + val * other.elements[i], 0);
  }

  cross(other: Vector): Vector {
    const a = this.elements;
    const b = other.elements;
    return new Vector([
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ]);
  }

  magnitude(): number {
    return Math.sqrt(this.dot(this));
  }

  add(other: Vector): Vector {
    return new Vector(this.elements.map((v, i) => v + other.elements[i]));
  }
}

export class Matrix {
  elements: number[][];

  constructor(elements: number[][]) {
    this.elements = elements;
  }

  multiply(other: Matrix): Matrix {
    const result: number[][] = [];
    for (let i = 0; i < this.elements.length; i++) {
      result[i] = [];
      for (let j = 0; j < other.elements[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < this.elements[0].length; k++) {
          sum += this.elements[i][k] * other.elements[k][j];
        }
        result[i][j] = sum;
      }
    }
    return new Matrix(result);
  }
}

export default { Vector, Matrix };

// CLI Demo
if (import.meta.url.includes("elide-sylvester.ts")) {
  console.log("🎯 sylvester for Elide (POLYGLOT!)\n");
  const v1 = new Vector([1, 2, 3]);
  const v2 = new Vector([4, 5, 6]);
  console.log("Dot:", v1.dot(v2));
  console.log("Magnitude:", v1.magnitude().toFixed(2));
  console.log("\n🚀 ~30K+ downloads/week on npm!");
}
