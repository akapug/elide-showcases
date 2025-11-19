/**
 * Linear Algebra Operations Bridge
 *
 * Comprehensive linear algebra operations using NumPy and SciPy through Elide's
 * Python bridge. Provides production-ready matrix operations, decompositions,
 * solvers, and advanced numerical linear algebra methods.
 *
 * Features:
 * - Zero-copy array sharing between TypeScript and NumPy
 * - Matrix operations (multiplication, transpose, inverse, etc.)
 * - Eigenvalue and singular value decompositions
 * - Linear system solvers
 * - Matrix norms and condition numbers
 * - Tensor operations
 * - Sparse matrix support
 */

import Python from 'python';

// Type definitions
export interface Matrix extends Array<number[]> {}
export interface Vector extends Array<number> {}

export interface EigenResult {
  eigenvalues: number[] | Complex[];
  eigenvectors: Matrix;
}

export interface Complex {
  real: number;
  imag: number;
}

export interface SVDResult {
  U: Matrix;
  S: number[];
  Vt: Matrix;
}

export interface QRResult {
  Q: Matrix;
  R: Matrix;
}

export interface LUResult {
  P: Matrix;
  L: Matrix;
  U: Matrix;
}

export interface CholeskyResult {
  L: Matrix;
}

export interface SchurResult {
  T: Matrix;
  Z: Matrix;
}

export interface LeastSquaresResult {
  x: Vector;
  residuals: number[];
  rank: number;
  s: number[];
}

/**
 * Linear Algebra Operations Class
 */
export class LinearAlgebra {
  private numpy: any;
  private scipy: any;
  private linalg: any;
  private scipyLinalg: any;

  constructor() {
    // Import Python modules
    this.numpy = Python.import('numpy');
    this.scipy = Python.import('scipy');
    this.linalg = this.numpy.linalg;
    this.scipyLinalg = this.scipy.linalg;
  }

  // ============================================================================
  // Matrix Operations
  // ============================================================================

  /**
   * Matrix multiplication
   */
  matmul(A: Matrix, B: Matrix): Matrix {
    const npA = this.toNumpyArray(A);
    const npB = this.toNumpyArray(B);
    const result = this.numpy.matmul(npA, npB);
    return this.toJsArray(result);
  }

  /**
   * Dot product
   */
  dot(a: Vector, b: Vector): number {
    const npA = this.toNumpyArray(a);
    const npB = this.toNumpyArray(b);
    return this.numpy.dot(npA, npB);
  }

  /**
   * Cross product
   */
  cross(a: Vector, b: Vector): Vector {
    const npA = this.toNumpyArray(a);
    const npB = this.toNumpyArray(b);
    const result = this.numpy.cross(npA, npB);
    return this.toJsArray(result);
  }

  /**
   * Outer product
   */
  outer(a: Vector, b: Vector): Matrix {
    const npA = this.toNumpyArray(a);
    const npB = this.toNumpyArray(b);
    const result = this.numpy.outer(npA, npB);
    return this.toJsArray(result);
  }

  /**
   * Kronecker product
   */
  kron(A: Matrix, B: Matrix): Matrix {
    const npA = this.toNumpyArray(A);
    const npB = this.toNumpyArray(B);
    const result = this.numpy.kron(npA, npB);
    return this.toJsArray(result);
  }

  /**
   * Matrix transpose
   */
  transpose(A: Matrix): Matrix {
    const npA = this.toNumpyArray(A);
    const result = this.numpy.transpose(npA);
    return this.toJsArray(result);
  }

  /**
   * Matrix trace
   */
  trace(A: Matrix): number {
    const npA = this.toNumpyArray(A);
    return this.numpy.trace(npA);
  }

  /**
   * Matrix determinant
   */
  det(A: Matrix): number {
    const npA = this.toNumpyArray(A);
    return this.linalg.det(npA);
  }

  /**
   * Matrix rank
   */
  rank(A: Matrix, tol?: number): number {
    const npA = this.toNumpyArray(A);
    if (tol !== undefined) {
      return this.linalg.matrix_rank(npA, tol);
    }
    return this.linalg.matrix_rank(npA);
  }

  /**
   * Matrix inverse
   */
  inv(A: Matrix): Matrix {
    const npA = this.toNumpyArray(A);
    const result = this.linalg.inv(npA);
    return this.toJsArray(result);
  }

  /**
   * Moore-Penrose pseudoinverse
   */
  pinv(A: Matrix, rcond?: number): Matrix {
    const npA = this.toNumpyArray(A);
    const result = rcond !== undefined
      ? this.linalg.pinv(npA, rcond)
      : this.linalg.pinv(npA);
    return this.toJsArray(result);
  }

  // ============================================================================
  // Matrix Decompositions
  // ============================================================================

  /**
   * Eigenvalue decomposition
   */
  eig(A: Matrix): EigenResult {
    const npA = this.toNumpyArray(A);
    const [eigenvalues, eigenvectors] = this.linalg.eig(npA);

    return {
      eigenvalues: this.toJsArray(eigenvalues),
      eigenvectors: this.toJsArray(eigenvectors)
    };
  }

  /**
   * Eigenvalues only (faster than full decomposition)
   */
  eigvals(A: Matrix): number[] | Complex[] {
    const npA = this.toNumpyArray(A);
    const eigenvalues = this.linalg.eigvals(npA);
    return this.toJsArray(eigenvalues);
  }

  /**
   * Eigenvalues and eigenvectors for Hermitian/symmetric matrices
   */
  eigh(A: Matrix, UPLO: 'L' | 'U' = 'L'): EigenResult {
    const npA = this.toNumpyArray(A);
    const [eigenvalues, eigenvectors] = this.linalg.eigh(npA, UPLO);

    return {
      eigenvalues: this.toJsArray(eigenvalues),
      eigenvectors: this.toJsArray(eigenvectors)
    };
  }

  /**
   * Singular Value Decomposition
   */
  svd(A: Matrix, fullMatrices: boolean = true): SVDResult {
    const npA = this.toNumpyArray(A);
    const [U, S, Vt] = this.linalg.svd(npA, fullMatrices);

    return {
      U: this.toJsArray(U),
      S: this.toJsArray(S),
      Vt: this.toJsArray(Vt)
    };
  }

  /**
   * Singular values only (faster than full SVD)
   */
  svdvals(A: Matrix): number[] {
    const npA = this.toNumpyArray(A);
    const result = this.linalg.svd(npA, false);
    return this.toJsArray(result);
  }

  /**
   * QR decomposition
   */
  qr(A: Matrix, mode: 'reduced' | 'complete' = 'reduced'): QRResult {
    const npA = this.toNumpyArray(A);
    const [Q, R] = this.linalg.qr(npA, mode);

    return {
      Q: this.toJsArray(Q),
      R: this.toJsArray(R)
    };
  }

  /**
   * Cholesky decomposition
   */
  cholesky(A: Matrix, lower: boolean = true): CholeskyResult {
    const npA = this.toNumpyArray(A);
    const L = this.linalg.cholesky(npA);

    return {
      L: lower ? this.toJsArray(L) : this.toJsArray(this.numpy.transpose(L))
    };
  }

  /**
   * LU decomposition
   */
  lu(A: Matrix): LUResult {
    const npA = this.toNumpyArray(A);
    const [P, L, U] = this.scipyLinalg.lu(npA);

    return {
      P: this.toJsArray(P),
      L: this.toJsArray(L),
      U: this.toJsArray(U)
    };
  }

  /**
   * Schur decomposition
   */
  schur(A: Matrix): SchurResult {
    const npA = this.toNumpyArray(A);
    const [T, Z] = this.scipyLinalg.schur(npA);

    return {
      T: this.toJsArray(T),
      Z: this.toJsArray(Z)
    };
  }

  /**
   * Hessenberg decomposition
   */
  hessenberg(A: Matrix): { H: Matrix; Q: Matrix } {
    const npA = this.toNumpyArray(A);
    const [H, Q] = this.scipyLinalg.hessenberg(npA, true);

    return {
      H: this.toJsArray(H),
      Q: this.toJsArray(Q)
    };
  }

  // ============================================================================
  // Linear System Solvers
  // ============================================================================

  /**
   * Solve linear system Ax = b
   */
  solve(A: Matrix, b: Vector | Matrix): Vector | Matrix {
    const npA = this.toNumpyArray(A);
    const npB = this.toNumpyArray(b);
    const result = this.linalg.solve(npA, npB);
    return this.toJsArray(result);
  }

  /**
   * Least squares solution
   */
  lstsq(A: Matrix, b: Vector | Matrix, rcond?: number): LeastSquaresResult {
    const npA = this.toNumpyArray(A);
    const npB = this.toNumpyArray(b);

    const result = rcond !== undefined
      ? this.linalg.lstsq(npA, npB, rcond)
      : this.linalg.lstsq(npA, npB, null);

    return {
      x: this.toJsArray(result[0]),
      residuals: this.toJsArray(result[1]),
      rank: result[2],
      s: this.toJsArray(result[3])
    };
  }

  /**
   * Solve triangular system
   */
  solvTriangular(A: Matrix, b: Vector, lower: boolean = true): Vector {
    const npA = this.toNumpyArray(A);
    const npB = this.toNumpyArray(b);
    const result = this.scipyLinalg.solve_triangular(npA, npB, { lower });
    return this.toJsArray(result);
  }

  /**
   * Solve banded matrix system
   */
  solveBanded(l_and_u: [number, number], ab: Matrix, b: Vector): Vector {
    const npAB = this.toNumpyArray(ab);
    const npB = this.toNumpyArray(b);
    const result = this.scipyLinalg.solve_banded(l_and_u, npAB, npB);
    return this.toJsArray(result);
  }

  /**
   * Solve Toeplitz system
   */
  solveToeplitz(c_or_cr: Vector | [Vector, Vector], b: Vector): Vector {
    const npB = this.toNumpyArray(b);
    let result;

    if (Array.isArray(c_or_cr) && c_or_cr.length === 2) {
      const [c, r] = c_or_cr;
      result = this.scipyLinalg.solve_toeplitz(
        [this.toNumpyArray(c), this.toNumpyArray(r)],
        npB
      );
    } else {
      const npC = this.toNumpyArray(c_or_cr as Vector);
      result = this.scipyLinalg.solve_toeplitz(npC, npB);
    }

    return this.toJsArray(result);
  }

  // ============================================================================
  // Matrix Norms and Metrics
  // ============================================================================

  /**
   * Matrix or vector norm
   */
  norm(x: Matrix | Vector, ord?: number | 'fro' | 'nuc' | number): number {
    const npX = this.toNumpyArray(x);
    return ord !== undefined
      ? this.linalg.norm(npX, ord)
      : this.linalg.norm(npX);
  }

  /**
   * Condition number
   */
  cond(A: Matrix, p?: number | 'fro' | 'nuc'): number {
    const npA = this.toNumpyArray(A);
    return p !== undefined
      ? this.linalg.cond(npA, p)
      : this.linalg.cond(npA);
  }

  /**
   * Matrix power
   */
  matrixPower(A: Matrix, n: number): Matrix {
    const npA = this.toNumpyArray(A);
    const result = this.linalg.matrix_power(npA, n);
    return this.toJsArray(result);
  }

  /**
   * Matrix exponential
   */
  expm(A: Matrix): Matrix {
    const npA = this.toNumpyArray(A);
    const result = this.scipyLinalg.expm(npA);
    return this.toJsArray(result);
  }

  /**
   * Matrix logarithm
   */
  logm(A: Matrix): Matrix {
    const npA = this.toNumpyArray(A);
    const result = this.scipyLinalg.logm(npA);
    return this.toJsArray(result);
  }

  /**
   * Matrix square root
   */
  sqrtm(A: Matrix): Matrix {
    const npA = this.toNumpyArray(A);
    const result = this.scipyLinalg.sqrtm(npA);
    return this.toJsArray(result);
  }

  // ============================================================================
  // Special Matrices
  // ============================================================================

  /**
   * Create identity matrix
   */
  eye(n: number, m?: number): Matrix {
    const result = m !== undefined
      ? this.numpy.eye(n, m)
      : this.numpy.eye(n);
    return this.toJsArray(result);
  }

  /**
   * Create diagonal matrix
   */
  diag(v: Vector, k: number = 0): Matrix {
    const npV = this.toNumpyArray(v);
    const result = this.numpy.diag(npV, k);
    return this.toJsArray(result);
  }

  /**
   * Extract diagonal
   */
  diagonal(A: Matrix, offset: number = 0): Vector {
    const npA = this.toNumpyArray(A);
    const result = this.numpy.diagonal(npA, offset);
    return this.toJsArray(result);
  }

  /**
   * Create Vandermonde matrix
   */
  vander(x: Vector, N?: number, increasing: boolean = false): Matrix {
    const npX = this.toNumpyArray(x);
    const result = N !== undefined
      ? this.numpy.vander(npX, N, increasing)
      : this.numpy.vander(npX, null, increasing);
    return this.toJsArray(result);
  }

  /**
   * Create Hilbert matrix
   */
  hilbert(n: number): Matrix {
    const result = this.scipyLinalg.hilbert(n);
    return this.toJsArray(result);
  }

  /**
   * Create Toeplitz matrix
   */
  toeplitz(c: Vector, r?: Vector): Matrix {
    const npC = this.toNumpyArray(c);
    const result = r !== undefined
      ? this.scipyLinalg.toeplitz(npC, this.toNumpyArray(r))
      : this.scipyLinalg.toeplitz(npC);
    return this.toJsArray(result);
  }

  /**
   * Create Hankel matrix
   */
  hankel(c: Vector, r?: Vector): Matrix {
    const npC = this.toNumpyArray(c);
    const result = r !== undefined
      ? this.scipyLinalg.hankel(npC, this.toNumpyArray(r))
      : this.scipyLinalg.hankel(npC);
    return this.toJsArray(result);
  }

  /**
   * Create circulant matrix
   */
  circulant(c: Vector): Matrix {
    const npC = this.toNumpyArray(c);
    const result = this.scipyLinalg.circulant(npC);
    return this.toJsArray(result);
  }

  // ============================================================================
  // Tensor Operations
  // ============================================================================

  /**
   * Tensor dot product
   */
  tensordot(a: Matrix, b: Matrix, axes: number | [number[], number[]] = 2): Matrix {
    const npA = this.toNumpyArray(a);
    const npB = this.toNumpyArray(b);
    const result = this.numpy.tensordot(npA, npB, axes);
    return this.toJsArray(result);
  }

  /**
   * Einstein summation
   */
  einsum(subscripts: string, ...operands: Matrix[]): Matrix {
    const npOperands = operands.map(op => this.toNumpyArray(op));
    const result = this.numpy.einsum(subscripts, ...npOperands);
    return this.toJsArray(result);
  }

  // ============================================================================
  // Advanced Operations
  // ============================================================================

  /**
   * Solve continuous Lyapunov equation
   */
  solveLyapunov(A: Matrix, Q: Matrix): Matrix {
    const npA = this.toNumpyArray(A);
    const npQ = this.toNumpyArray(Q);
    const result = this.scipyLinalg.solve_continuous_lyapunov(npA, npQ);
    return this.toJsArray(result);
  }

  /**
   * Solve discrete Lyapunov equation
   */
  solveDiscreteLyapunov(A: Matrix, Q: Matrix): Matrix {
    const npA = this.toNumpyArray(A);
    const npQ = this.toNumpyArray(Q);
    const result = this.scipyLinalg.solve_discrete_lyapunov(npA, npQ);
    return this.toJsArray(result);
  }

  /**
   * Solve Sylvester equation
   */
  solveSylvester(A: Matrix, B: Matrix, Q: Matrix): Matrix {
    const npA = this.toNumpyArray(A);
    const npB = this.toNumpyArray(B);
    const npQ = this.toNumpyArray(Q);
    const result = this.scipyLinalg.solve_sylvester(npA, npB, npQ);
    return this.toJsArray(result);
  }

  /**
   * Polar decomposition
   */
  polar(A: Matrix, side: 'right' | 'left' = 'right'): { U: Matrix; P: Matrix } {
    const npA = this.toNumpyArray(A);
    const [U, P] = this.scipyLinalg.polar(npA, side);

    return {
      U: this.toJsArray(U),
      P: this.toJsArray(P)
    };
  }

  /**
   * Orthonormal basis for range of A
   */
  orth(A: Matrix): Matrix {
    const npA = this.toNumpyArray(A);
    const result = this.scipyLinalg.orth(npA);
    return this.toJsArray(result);
  }

  /**
   * Orthonormal basis for null space of A
   */
  nullSpace(A: Matrix, rcond?: number): Matrix {
    const npA = this.toNumpyArray(A);
    const result = rcond !== undefined
      ? this.scipyLinalg.null_space(npA, rcond)
      : this.scipyLinalg.null_space(npA);
    return this.toJsArray(result);
  }

  /**
   * Subspace angles
   */
  subspaceAngles(A: Matrix, B: Matrix): number[] {
    const npA = this.toNumpyArray(A);
    const npB = this.toNumpyArray(B);
    const result = this.scipyLinalg.subspace_angles(npA, npB);
    return this.toJsArray(result);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Convert JavaScript array to NumPy array (zero-copy when possible)
   */
  private toNumpyArray(arr: any): any {
    if (arr instanceof Float64Array || arr instanceof Float32Array) {
      // Zero-copy conversion for typed arrays
      return this.numpy.frombuffer(arr.buffer, arr.constructor.name.toLowerCase());
    }
    return this.numpy.array(arr);
  }

  /**
   * Convert NumPy array to JavaScript array
   */
  private toJsArray(npArr: any): any {
    // Check if it's a scalar
    if (!npArr.shape || npArr.shape.length === 0) {
      return npArr.item();
    }

    // Convert to JavaScript array
    return npArr.tolist();
  }

  /**
   * Create typed array from JavaScript array for zero-copy operations
   */
  createTypedArray(arr: number[], dtype: 'float32' | 'float64' = 'float64'): Float32Array | Float64Array {
    return dtype === 'float32' ? new Float32Array(arr) : new Float64Array(arr);
  }

  /**
   * Batch matrix operations for improved performance
   */
  batchMatmul(matrices: Matrix[]): Matrix[] {
    const npMatrices = matrices.map(m => this.toNumpyArray(m));
    const results = npMatrices.map((m, i) => {
      if (i === 0) return m;
      return this.numpy.matmul(npMatrices[i - 1], m);
    });
    return results.map(r => this.toJsArray(r));
  }

  /**
   * Check if matrix is symmetric
   */
  isSymmetric(A: Matrix, tol: number = 1e-8): boolean {
    const npA = this.toNumpyArray(A);
    const diff = this.numpy.subtract(npA, this.numpy.transpose(npA));
    const maxDiff = this.numpy.max(this.numpy.abs(diff));
    return maxDiff < tol;
  }

  /**
   * Check if matrix is positive definite
   */
  isPositiveDefinite(A: Matrix): boolean {
    try {
      this.cholesky(A);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if matrix is orthogonal
   */
  isOrthogonal(A: Matrix, tol: number = 1e-8): boolean {
    const npA = this.toNumpyArray(A);
    const product = this.numpy.matmul(this.numpy.transpose(npA), npA);
    const identity = this.numpy.eye(A.length);
    const diff = this.numpy.subtract(product, identity);
    const maxDiff = this.numpy.max(this.numpy.abs(diff));
    return maxDiff < tol;
  }
}

export default LinearAlgebra;
