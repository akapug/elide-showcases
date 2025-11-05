/**
 * Array shuffling algorithms
 * Fisher-Yates shuffle and variants
 */

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function shuffleInPlace<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

export function sample<T>(array: T[], n: number = 1): T[] {
  if (n <= 0) return [];
  if (n >= array.length) return shuffle(array);

  const result: T[] = [];
  const indices = new Set<number>();

  while (result.length < n) {
    const index = Math.floor(Math.random() * array.length);
    if (!indices.has(index)) {
      indices.add(index);
      result.push(array[index]);
    }
  }

  return result;
}

export function sampleOne<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

export function weightedSample<T>(items: T[], weights: number[]): T | undefined {
  if (items.length === 0 || items.length !== weights.length) return undefined;

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }

  return items[items.length - 1];
}

// CLI demo
if (import.meta.url.includes("shuffle.ts")) {
  const arr = [1, 2, 3, 4, 5];

  console.log("Original:", arr.join(", "));
  console.log("Shuffled:", shuffle(arr).join(", "));
  console.log("Original unchanged:", arr.join(", "));

  console.log("\nSample 3 items:", sample(arr, 3).join(", "));
  console.log("Sample 1 item:", sampleOne(arr));

  const items = ["rare", "common", "legendary"];
  const weights = [10, 70, 5];
  console.log("\nWeighted sample (70% common, 10% rare, 5% legendary):");
  const samples = Array(10).fill(0).map(() => weightedSample(items, weights));
  console.log(samples.join(", "));

  console.log("✅ Shuffle test passed");
}
