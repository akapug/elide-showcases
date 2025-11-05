/**
 * Factorial calculations
 * Various methods for computing factorials
 */

export function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError('Factorial is only defined for non-negative integers');
  }

  if (n === 0 || n === 1) return 1;

  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }

  return result;
}

export function factorialRecursive(n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError('Factorial is only defined for non-negative integers');
  }

  return n <= 1 ? 1 : n * factorialRecursive(n - 1);
}

export function factorialBigInt(n: number): bigint {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError('Factorial is only defined for non-negative integers');
  }

  if (n === 0 || n === 1) return 1n;

  let result = 1n;
  for (let i = 2n; i <= BigInt(n); i++) {
    result *= i;
  }

  return result;
}

export function doubleFactorial(n: number): number {
  if (!Number.isInteger(n) || n < -1) {
    throw new RangeError('Double factorial requires integer >= -1');
  }

  if (n === -1 || n === 0 || n === 1) return 1;

  let result = 1;
  for (let i = n; i > 1; i -= 2) {
    result *= i;
  }

  return result;
}

export function fallingFactorial(n: number, k: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(k)) {
    throw new TypeError('Both arguments must be integers');
  }

  if (k < 0) return 0;
  if (k === 0) return 1;

  let result = 1;
  for (let i = 0; i < k; i++) {
    result *= (n - i);
  }

  return result;
}

// CLI demo
if (import.meta.url.includes("factorial.ts")) {
  console.log("5! =", factorial(5)); // 120
  console.log("10! =", factorial(10)); // 3628800

  console.log("\n5! (recursive) =", factorialRecursive(5)); // 120

  console.log("\n20! (BigInt) =", factorialBigInt(20).toString()); // Very large number

  console.log("\n7!! (double factorial) =", doubleFactorial(7)); // 7 × 5 × 3 × 1 = 105
  console.log("8!! (double factorial) =", doubleFactorial(8)); // 8 × 6 × 4 × 2 = 384

  console.log("\nFalling factorial (5, 3) =", fallingFactorial(5, 3)); // 5 × 4 × 3 = 60

  console.log("✅ Factorial test passed");
}
