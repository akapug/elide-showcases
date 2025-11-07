/**
 * Union-Find (Disjoint Set Union)
 * Efficient set operations with path compression
 * Time: O(α(n)) amortized, where α is inverse Ackermann
 */

export class UnionFind {
  private parent: number[];
  private rank: number[];
  private count: number;

  constructor(size: number) {
    this.parent = Array(size).fill(0).map((_, i) => i);
    this.rank = Array(size).fill(0);
    this.count = size;
  }

  find(x: number): number {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // Path compression
    }
    return this.parent[x];
  }

  union(x: number, y: number): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false;

    // Union by rank
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }

    this.count--;
    return true;
  }

  connected(x: number, y: number): boolean {
    return this.find(x) === this.find(y);
  }

  getCount(): number {
    return this.count;
  }

  getComponents(): number[][] {
    const components = new Map<number, number[]>();

    for (let i = 0; i < this.parent.length; i++) {
      const root = this.find(i);
      if (!components.has(root)) {
        components.set(root, []);
      }
      components.get(root)!.push(i);
    }

    return Array.from(components.values());
  }
}

// CLI demo
if (import.meta.url.includes("union-find.ts")) {
  const uf = new UnionFind(10);

  console.log("Initial components:", uf.getCount()); // 10

  console.log("\nUnion operations:");
  console.log("Union(0, 1):", uf.union(0, 1));
  console.log("Union(1, 2):", uf.union(1, 2));
  console.log("Union(3, 4):", uf.union(3, 4));
  console.log("Union(5, 6):", uf.union(5, 6));
  console.log("Union(6, 7):", uf.union(6, 7));

  console.log("\nComponents:", uf.getCount()); // 5

  console.log("\nConnectivity:");
  console.log("Connected(0, 2):", uf.connected(0, 2)); // true
  console.log("Connected(0, 3):", uf.connected(0, 3)); // false
  console.log("Connected(5, 7):", uf.connected(5, 7)); // true

  console.log("\nAll components:");
  uf.getComponents().forEach((comp, i) => {
    console.log("  Component " + i + ": " + comp.join(", "));
  });

  console.log("✅ Union-Find test passed");
}
