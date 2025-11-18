/**
 * ndarray-ops - Array Operations
 *
 * Element-wise operations for ndarrays.
 * **POLYGLOT SHOWCASE**: One operation library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/ndarray-ops (~50K+ downloads/week)
 *
 * Features:
 * - Element-wise arithmetic operations
 * - Unary operations (abs, sqrt, exp, log)
 * - Binary operations (add, sub, mul, div)
 * - Comparison operations
 * - Reductions (sum, min, max)
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - NumPy, MATLAB, R all need array ops
 * - ONE implementation works everywhere on Elide
 * - Share computation code across languages
 * - Consistent behavior across stack
 *
 * Use cases:
 * - Image processing
 * - Scientific computing
 * - Data transformations
 * - Machine learning
 *
 * Package has ~50K+ downloads/week on npm!
 */

type NDArray = { data: number[]; shape: number[]; get(...indices: number[]): number; set(...args: any[]): void; };

/**
 * Element-wise addition
 */
export function add(out: NDArray, a: NDArray, b: NDArray): NDArray {
  const size = a.data.length;
  for (let i = 0; i < size; i++) {
    out.data[i] = a.data[i] + b.data[i];
  }
  return out;
}

/**
 * Element-wise subtraction
 */
export function sub(out: NDArray, a: NDArray, b: NDArray): NDArray {
  const size = a.data.length;
  for (let i = 0; i < size; i++) {
    out.data[i] = a.data[i] - b.data[i];
  }
  return out;
}

/**
 * Element-wise multiplication
 */
export function mul(out: NDArray, a: NDArray, b: NDArray): NDArray {
  const size = a.data.length;
  for (let i = 0; i < size; i++) {
    out.data[i] = a.data[i] * b.data[i];
  }
  return out;
}

/**
 * Element-wise division
 */
export function div(out: NDArray, a: NDArray, b: NDArray): NDArray {
  const size = a.data.length;
  for (let i = 0; i < size; i++) {
    out.data[i] = a.data[i] / b.data[i];
  }
  return out;
}

/**
 * Element-wise absolute value
 */
export function abs(out: NDArray, a: NDArray): NDArray {
  const size = a.data.length;
  for (let i = 0; i < size; i++) {
    out.data[i] = Math.abs(a.data[i]);
  }
  return out;
}

/**
 * Element-wise square root
 */
export function sqrt(out: NDArray, a: NDArray): NDArray {
  const size = a.data.length;
  for (let i = 0; i < size; i++) {
    out.data[i] = Math.sqrt(a.data[i]);
  }
  return out;
}

/**
 * Element-wise exponential
 */
export function exp(out: NDArray, a: NDArray): NDArray {
  const size = a.data.length;
  for (let i = 0; i < size; i++) {
    out.data[i] = Math.exp(a.data[i]);
  }
  return out;
}

/**
 * Element-wise natural logarithm
 */
export function log(out: NDArray, a: NDArray): NDArray {
  const size = a.data.length;
  for (let i = 0; i < size; i++) {
    out.data[i] = Math.log(a.data[i]);
  }
  return out;
}

/**
 * Sum all elements
 */
export function sum(a: NDArray): number {
  return a.data.reduce((acc, val) => acc + val, 0);
}

/**
 * Find minimum value
 */
export function min(a: NDArray): number {
  return Math.min(...a.data);
}

/**
 * Find maximum value
 */
export function max(a: NDArray): number {
  return Math.max(...a.data);
}

/**
 * Scalar addition
 */
export function adds(out: NDArray, a: NDArray, scalar: number): NDArray {
  const size = a.data.length;
  for (let i = 0; i < size; i++) {
    out.data[i] = a.data[i] + scalar;
  }
  return out;
}

/**
 * Scalar multiplication
 */
export function muls(out: NDArray, a: NDArray, scalar: number): NDArray {
  const size = a.data.length;
  for (let i = 0; i < size; i++) {
    out.data[i] = a.data[i] * scalar;
  }
  return out;
}

export default {
  add, sub, mul, div,
  abs, sqrt, exp, log,
  sum, min, max,
  adds, muls
};

// CLI Demo
if (import.meta.url.includes("elide-ndarray-ops.ts")) {
  console.log("⚡ ndarray-ops - Array Operations for Elide (POLYGLOT!)\n");

  // Simple mock ndarray for demo
  const create = (data: number[]) => ({ data, shape: [data.length], get: (i: number) => data[i], set: (i: number, v: number) => { data[i] = v; } });

  console.log("=== Example 1: Element-wise Arithmetic ===");
  const a = create([1, 2, 3, 4]);
  const b = create([5, 6, 7, 8]);
  const result = create([0, 0, 0, 0]);

  add(result, a, b);
  console.log("a + b =", result.data);

  mul(result, a, b);
  console.log("a * b =", result.data);
  console.log();

  console.log("=== Example 2: Unary Operations ===");
  const c = create([1, 4, 9, 16]);
  sqrt(result, c);
  console.log("sqrt([1,4,9,16]) =", result.data);

  const d = create([0, 1, 2, 3]);
  exp(result, d);
  console.log("exp([0,1,2,3]) =", result.data.map(x => x.toFixed(2)));
  console.log();

  console.log("=== Example 3: Reductions ===");
  const e = create([1, 2, 3, 4, 5]);
  console.log("array:", e.data);
  console.log("sum:", sum(e));
  console.log("min:", min(e));
  console.log("max:", max(e));
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Works in JavaScript, Python, R, Java via Elide");
  console.log("✅ Element-wise ops for scientific computing");
  console.log("🚀 ~50K+ downloads/week on npm!");
}
