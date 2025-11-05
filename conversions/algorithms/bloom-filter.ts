/**
 * Bloom Filter
 * Probabilistic data structure for set membership
 * Space-efficient with no false negatives
 */

export class BloomFilter {
  private bits: boolean[];
  private hashCount: number;
  private size: number;

  constructor(size: number = 1000, hashCount: number = 3) {
    this.size = size;
    this.bits = Array(size).fill(false);
    this.hashCount = hashCount;
  }

  private hash(item: string, seed: number): number {
    let hash = seed;
    for (let i = 0; i < item.length; i++) {
      hash = ((hash << 5) - hash) + item.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % this.size;
  }

  add(item: string): void {
    for (let i = 0; i < this.hashCount; i++) {
      const index = this.hash(item, i);
      this.bits[index] = true;
    }
  }

  contains(item: string): boolean {
    for (let i = 0; i < this.hashCount; i++) {
      const index = this.hash(item, i);
      if (!this.bits[index]) return false;
    }
    return true;
  }

  addAll(items: string[]): void {
    items.forEach(item => this.add(item));
  }

  getFillRatio(): number {
    const filled = this.bits.filter(bit => bit).length;
    return filled / this.size;
  }

  clear(): void {
    this.bits.fill(false);
  }

  estimateCount(): number {
    const filled = this.bits.filter(bit => bit).length;
    return Math.round(-this.size * Math.log(1 - filled / this.size) / this.hashCount);
  }
}

// CLI demo
if (import.meta.url.includes("bloom-filter.ts")) {
  const bloom = new BloomFilter(1000, 3);

  console.log("Adding words: apple, banana, cherry");
  bloom.add("apple");
  bloom.add("banana");
  bloom.add("cherry");

  console.log("\nContains 'apple':", bloom.contains("apple")); // true
  console.log("Contains 'banana':", bloom.contains("banana")); // true
  console.log("Contains 'orange':", bloom.contains("orange")); // false (probably)

  console.log("\nFill ratio:", (bloom.getFillRatio() * 100).toFixed(2) + "%");
  console.log("Estimated count:", bloom.estimateCount());

  // Test false positive rate
  const testWords = ["dog", "cat", "elephant", "tiger", "lion"];
  const falsePositives = testWords.filter(w => bloom.contains(w));
  console.log("\nFalse positives from test set:", falsePositives.join(", "));

  console.log("✅ Bloom filter test passed");
}
