/**
 * Greatest Common Divisor (GCD) and Least Common Multiple (LCM)
 * Essential number theory algorithms
 */

export function gcd(a: number, b: number): number {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Expected numbers');
  }

  a = Math.abs(Math.floor(a));
  b = Math.abs(Math.floor(b));

  // Euclidean algorithm
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }

  return a;
}

export function gcdRecursive(a: number, b: number): number {
  a = Math.abs(Math.floor(a));
  b = Math.abs(Math.floor(b));

  return b === 0 ? a : gcdRecursive(b, a % b);
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a * b) / gcd(a, b));
}

export function gcdMultiple(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  if (numbers.length === 1) return Math.abs(numbers[0]);

  return numbers.reduce((acc, num) => gcd(acc, num));
}

export function lcmMultiple(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  if (numbers.some(n => n === 0)) return 0;
  if (numbers.length === 1) return Math.abs(numbers[0]);

  return numbers.reduce((acc, num) => lcm(acc, num));
}

// CLI demo
if (import.meta.url.includes("gcd-lcm.ts")) {
  console.log("GCD of 48 and 18:", gcd(48, 18)); // 6
  console.log("LCM of 12 and 18:", lcm(12, 18)); // 36

  console.log("\nGCD of multiple numbers [12, 18, 24]:", gcdMultiple([12, 18, 24])); // 6
  console.log("LCM of multiple numbers [4, 6, 8]:", lcmMultiple([4, 6, 8])); // 24

  console.log("\nGCD recursive:", gcdRecursive(100, 35)); // 5

  console.log("✅ GCD/LCM test passed");
}
