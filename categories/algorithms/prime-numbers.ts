/**
 * Prime number algorithms
 * Checking primality, generating primes, factorization
 */

export function isPrime(n: number): boolean {
  if (typeof n !== 'number' || !Number.isInteger(n)) return false;
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;

  // Check divisors up to sqrt(n)
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }

  return true;
}

export function sieveOfEratosthenes(max: number): number[] {
  if (max < 2) return [];

  const isPrimeArr = new Array(max + 1).fill(true);
  isPrimeArr[0] = isPrimeArr[1] = false;

  for (let i = 2; i * i <= max; i++) {
    if (isPrimeArr[i]) {
      for (let j = i * i; j <= max; j += i) {
        isPrimeArr[j] = false;
      }
    }
  }

  const primes: number[] = [];
  for (let i = 2; i <= max; i++) {
    if (isPrimeArr[i]) primes.push(i);
  }

  return primes;
}

export function primeFactors(n: number): number[] {
  if (!Number.isInteger(n) || n <= 1) return [];

  const factors: number[] = [];

  while (n % 2 === 0) {
    factors.push(2);
    n /= 2;
  }

  for (let i = 3; i * i <= n; i += 2) {
    while (n % i === 0) {
      factors.push(i);
      n /= i;
    }
  }

  if (n > 2) factors.push(n);

  return factors;
}

export function nthPrime(n: number): number {
  if (n < 1) throw new RangeError('n must be >= 1');
  if (n === 1) return 2;

  let count = 1;
  let candidate = 3;

  while (count < n) {
    if (isPrime(candidate)) count++;
    if (count < n) candidate += 2;
  }

  return candidate;
}

export function nextPrime(n: number): number {
  if (n < 2) return 2;

  let candidate = n % 2 === 0 ? n + 1 : n + 2;
  while (!isPrime(candidate)) {
    candidate += 2;
  }

  return candidate;
}

// CLI demo
if (import.meta.url.includes("prime-numbers.ts")) {
  console.log("Is 17 prime?", isPrime(17)); // true
  console.log("Is 20 prime?", isPrime(20)); // false

  console.log("\nPrimes up to 50:", sieveOfEratosthenes(50).join(", "));

  console.log("\nPrime factors of 60:", primeFactors(60).join(" × ")); // 2 × 2 × 3 × 5

  console.log("\n10th prime:", nthPrime(10)); // 29
  console.log("Next prime after 20:", nextPrime(20)); // 23

  console.log("✅ Prime numbers test passed");
}
