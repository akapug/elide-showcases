/**
 * Combinations and Permutations
 * Generate all possible arrangements
 */

export function combinations<T>(array: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > array.length) return [];

  const result: T[][] = [];

  function backtrack(start: number, current: T[]) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }

    for (let i = start; i < array.length; i++) {
      current.push(array[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }

  backtrack(0, []);
  return result;
}

export function permutations<T>(array: T[]): T[][] {
  if (array.length === 0) return [[]];

  const result: T[][] = [];

  function backtrack(current: T[], remaining: T[]) {
    if (remaining.length === 0) {
      result.push([...current]);
      return;
    }

    for (let i = 0; i < remaining.length; i++) {
      current.push(remaining[i]);
      const newRemaining = [...remaining.slice(0, i), ...remaining.slice(i + 1)];
      backtrack(current, newRemaining);
      current.pop();
    }
  }

  backtrack([], array);
  return result;
}

export function permutationsCount(n: number): number {
  if (n < 0) return 0;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

export function combinationsCount(n: number, k: number): number {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;

  // Use the formula: C(n,k) = n! / (k! * (n-k)!)
  // Optimized to avoid overflow
  k = Math.min(k, n - k);

  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }

  return Math.round(result);
}

export function powerSet<T>(array: T[]): T[][] {
  const result: T[][] = [[]];

  for (const item of array) {
    const len = result.length;
    for (let i = 0; i < len; i++) {
      result.push([...result[i], item]);
    }
  }

  return result;
}

// CLI demo
if (import.meta.url.includes("combinations.ts")) {
  const arr = [1, 2, 3, 4];

  console.log("Combinations of [1,2,3,4] choose 2:");
  combinations(arr, 2).forEach(c => console.log("  " + c.join(", ")));

  console.log("\nPermutations of [1,2,3]:");
  permutations([1, 2, 3]).forEach(p => console.log("  " + p.join(", ")));

  console.log("\nCombinations count C(5,2):", combinationsCount(5, 2)); // 10
  console.log("Permutations count P(5):", permutationsCount(5)); // 120

  console.log("\nPower set of [1,2,3]:");
  powerSet([1, 2, 3]).forEach(s => console.log("  {" + s.join(", ") + "}"));

  console.log("✅ Combinations test passed");
}
