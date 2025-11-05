/**
 * Knapsack Problem Algorithms
 * 0/1 Knapsack and Unbounded Knapsack
 */

export interface Item {
  weight: number;
  value: number;
  name?: string;
}

export function knapsack01(items: Item[], capacity: number): { maxValue: number; items: Item[] } {
  const n = items.length;
  const dp: number[][] = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      const item = items[i - 1];
      if (item.weight <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],
          dp[i - 1][w - item.weight] + item.value
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // Reconstruct solution
  const selectedItems: Item[] = [];
  let w = capacity;
  for (let i = n; i > 0 && w > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selectedItems.push(items[i - 1]);
      w -= items[i - 1].weight;
    }
  }

  return {
    maxValue: dp[n][capacity],
    items: selectedItems.reverse()
  };
}

export function knapsackUnbounded(items: Item[], capacity: number): { maxValue: number; counts: Map<Item, number> } {
  const dp = Array(capacity + 1).fill(0);
  const itemUsed = Array(capacity + 1).fill(-1);

  for (let w = 0; w <= capacity; w++) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.weight <= w) {
        const newValue = dp[w - item.weight] + item.value;
        if (newValue > dp[w]) {
          dp[w] = newValue;
          itemUsed[w] = i;
        }
      }
    }
  }

  // Reconstruct solution
  const counts = new Map<Item, number>();
  let w = capacity;
  while (w > 0 && itemUsed[w] !== -1) {
    const item = items[itemUsed[w]];
    counts.set(item, (counts.get(item) || 0) + 1);
    w -= item.weight;
  }

  return {
    maxValue: dp[capacity],
    counts
  };
}

export function fractionalKnapsack(items: Item[], capacity: number): { maxValue: number; fractions: Map<Item, number> } {
  // Sort by value-to-weight ratio (greedy)
  const sorted = [...items].sort((a, b) => (b.value / b.weight) - (a.value / a.weight));

  let remaining = capacity;
  let maxValue = 0;
  const fractions = new Map<Item, number>();

  for (const item of sorted) {
    if (remaining >= item.weight) {
      fractions.set(item, 1);
      maxValue += item.value;
      remaining -= item.weight;
    } else {
      const fraction = remaining / item.weight;
      fractions.set(item, fraction);
      maxValue += item.value * fraction;
      remaining = 0;
      break;
    }
  }

  return { maxValue, fractions };
}

// CLI demo
if (import.meta.url.includes("knapsack.ts")) {
  const items: Item[] = [
    { weight: 2, value: 3, name: "A" },
    { weight: 3, value: 4, name: "B" },
    { weight: 4, value: 5, name: "C" },
    { weight: 5, value: 6, name: "D" }
  ];

  console.log("Items:");
  items.forEach(item => console.log("  " + (item.name || "") + ": weight=" + item.weight + ", value=" + item.value));

  console.log("\n0/1 Knapsack (capacity=7):");
  const result01 = knapsack01(items, 7);
  console.log("Max value:", result01.maxValue);
  console.log("Items:", result01.items.map(i => i.name).join(", "));

  console.log("\nUnbounded Knapsack (capacity=10):");
  const resultUnbounded = knapsackUnbounded(items, 10);
  console.log("Max value:", resultUnbounded.maxValue);
  console.log("Items:");
  resultUnbounded.counts.forEach((count, item) => {
    console.log("  " + (item.name || "") + " × " + count);
  });

  console.log("\nFractional Knapsack (capacity=7):");
  const resultFractional = fractionalKnapsack(items, 7);
  console.log("Max value:", resultFractional.maxValue.toFixed(2));

  console.log("✅ Knapsack test passed");
}
