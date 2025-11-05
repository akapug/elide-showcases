/**
 * Matrix operations
 * Common matrix algorithms and operations
 */

export type Matrix = number[][];

export function createMatrix(rows: number, cols: number, fill: number = 0): Matrix {
  return Array(rows).fill(0).map(() => Array(cols).fill(fill));
}

export function identityMatrix(size: number): Matrix {
  const matrix = createMatrix(size, size, 0);
  for (let i = 0; i < size; i++) {
    matrix[i][i] = 1;
  }
  return matrix;
}

export function transpose(matrix: Matrix): Matrix {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = createMatrix(cols, rows);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = matrix[i][j];
    }
  }

  return result;
}

export function add(a: Matrix, b: Matrix): Matrix {
  if (a.length !== b.length || a[0].length !== b[0].length) {
    throw new Error('Matrices must have same dimensions');
  }

  const rows = a.length;
  const cols = a[0].length;
  const result = createMatrix(rows, cols);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i][j] = a[i][j] + b[i][j];
    }
  }

  return result;
}

export function multiply(a: Matrix, b: Matrix): Matrix {
  const aRows = a.length;
  const aCols = a[0].length;
  const bRows = b.length;
  const bCols = b[0].length;

  if (aCols !== bRows) {
    throw new Error('Invalid matrix dimensions for multiplication');
  }

  const result = createMatrix(aRows, bCols);

  for (let i = 0; i < aRows; i++) {
    for (let j = 0; j < bCols; j++) {
      let sum = 0;
      for (let k = 0; k < aCols; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }

  return result;
}

export function scalarMultiply(matrix: Matrix, scalar: number): Matrix {
  return matrix.map(row => row.map(val => val * scalar));
}

export function determinant(matrix: Matrix): number {
  const n = matrix.length;

  if (n !== matrix[0].length) {
    throw new Error('Determinant requires square matrix');
  }

  if (n === 1) return matrix[0][0];
  if (n === 2) {
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  }

  let det = 0;
  for (let j = 0; j < n; j++) {
    const minor = matrix.slice(1).map(row => row.filter((_, i) => i !== j));
    det += Math.pow(-1, j) * matrix[0][j] * determinant(minor);
  }

  return det;
}

export function rotate90Clockwise(matrix: Matrix): Matrix {
  const n = matrix.length;
  const result = createMatrix(n, n);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      result[j][n - 1 - i] = matrix[i][j];
    }
  }

  return result;
}

// CLI demo
if (import.meta.url.includes("matrix.ts")) {
  const a = [[1, 2], [3, 4]];
  const b = [[5, 6], [7, 8]];

  console.log("Matrix A:");
  a.forEach(row => console.log("  " + row.join(" ")));

  console.log("\nMatrix B:");
  b.forEach(row => console.log("  " + row.join(" ")));

  console.log("\nA + B:");
  add(a, b).forEach(row => console.log("  " + row.join(" ")));

  console.log("\nA × B:");
  multiply(a, b).forEach(row => console.log("  " + row.join(" ")));

  console.log("\nDeterminant of A:", determinant(a));

  console.log("\nIdentity 3x3:");
  identityMatrix(3).forEach(row => console.log("  " + row.join(" ")));

  console.log("✅ Matrix test passed");
}
