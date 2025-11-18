/**
 * sparse-matrix - Sparse Matrices
 *
 * Sparse matrix data structure and operations.
 * **POLYGLOT SHOWCASE**: One sparse matrix library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/sparse-matrix (~10K+ downloads/week)
 *
 * Features:
 * - COO (coordinate) format
 * - Efficient storage
 * - Matrix operations
 * - Zero dependencies
 *
 * Package has ~10K+ downloads/week on npm!
 */

export class SparseMatrix {
  rows: Map<number, Map<number, number>>;
  numRows: number;
  numCols: number;

  constructor(numRows: number, numCols: number) {
    this.rows = new Map();
    this.numRows = numRows;
    this.numCols = numCols;
  }

  set(row: number, col: number, value: number): void {
    if (!this.rows.has(row)) {
      this.rows.set(row, new Map());
    }
    this.rows.get(row)!.set(col, value);
  }

  get(row: number, col: number): number {
    return this.rows.get(row)?.get(col) || 0;
  }

  mult(vector: number[]): number[] {
    const result = new Array(this.numRows).fill(0);
    this.rows.forEach((cols, row) => {
      cols.forEach((value, col) => {
        result[row] += value * vector[col];
      });
    });
    return result;
  }

  nnz(): number {
    let count = 0;
    this.rows.forEach(cols => count += cols.size);
    return count;
  }
}

export default { SparseMatrix };

// CLI Demo
if (import.meta.url.includes("elide-sparse-matrix.ts")) {
  console.log("🕸️  sparse-matrix for Elide (POLYGLOT!)\n");
  const m = new SparseMatrix(3, 3);
  m.set(0, 0, 1);
  m.set(1, 1, 2);
  m.set(2, 2, 3);
  console.log("Non-zeros:", m.nnz());
  console.log("m * [1,1,1]:", m.mult([1, 1, 1]));
  console.log("\n🚀 ~10K+ downloads/week on npm!");
}
