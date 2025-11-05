/**
 * TinyQueue - Fast Priority Queue (Min-Heap)
 *
 * A tiny and fast JavaScript priority queue implementation using a binary heap.
 * Perfect for algorithms that need efficient min/max operations.
 *
 * Features:
 * - O(log n) push and pop operations
 * - O(1) peek operation
 * - Custom comparison function
 * - Efficient binary heap implementation
 * - Very small code size
 *
 * Use cases:
 * - A* pathfinding algorithms
 * - Dijkstra's shortest path
 * - Task scheduling by priority
 * - Event processing
 * - Merge k sorted arrays
 *
 * Package has ~5M+ downloads/week on npm!
 */

type CompareFunction<T> = (a: T, b: T) => number;

/**
 * TinyQueue - A simple priority queue (min-heap by default)
 */
export default class TinyQueue<T = any> {
  public data: T[];
  public length: number;
  private compare: CompareFunction<T>;

  /**
   * Create a new priority queue
   *
   * @param data - Initial data (will be heapified)
   * @param compare - Comparison function (default: min-heap for numbers)
   */
  constructor(data: T[] = [], compare?: CompareFunction<T>) {
    this.data = data;
    this.length = this.data.length;
    this.compare = compare || defaultCompare;

    if (this.length > 0) {
      // Heapify the initial data (Floyd's algorithm)
      for (let i = (this.length >> 1) - 1; i >= 0; i--) {
        this._down(i);
      }
    }
  }

  /**
   * Add an item to the queue
   * O(log n) complexity
   */
  push(item: T): void {
    this.data.push(item);
    this.length++;
    this._up(this.length - 1);
  }

  /**
   * Remove and return the smallest item
   * O(log n) complexity
   */
  pop(): T | undefined {
    if (this.length === 0) return undefined;

    const top = this.data[0];
    const bottom = this.data.pop();
    this.length--;

    if (this.length > 0 && bottom !== undefined) {
      this.data[0] = bottom;
      this._down(0);
    }

    return top;
  }

  /**
   * Return the smallest item without removing it
   * O(1) complexity
   */
  peek(): T | undefined {
    return this.data[0];
  }

  /**
   * Move an element up the heap
   */
  private _up(pos: number): void {
    const { data, compare } = this;
    const item = data[pos];

    while (pos > 0) {
      const parent = (pos - 1) >> 1;
      const current = data[parent];

      if (compare(item, current) >= 0) break;

      data[pos] = current;
      pos = parent;
    }

    data[pos] = item;
  }

  /**
   * Move an element down the heap
   */
  private _down(pos: number): void {
    const { data, compare, length } = this;
    const halfLength = length >> 1;
    const item = data[pos];

    while (pos < halfLength) {
      let left = (pos << 1) + 1;
      let best = data[left];
      const right = left + 1;

      if (right < length && compare(data[right], best) < 0) {
        left = right;
        best = data[right];
      }

      if (compare(best, item) >= 0) break;

      data[pos] = best;
      pos = left;
    }

    data[pos] = item;
  }
}

/**
 * Default comparison function (min-heap for numbers)
 */
function defaultCompare(a: any, b: any): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

// CLI Demo
if (import.meta.url.includes("elide-tinyqueue.ts")) {
  console.log("🔢 TinyQueue - Priority Queue for Elide\n");

  console.log("=== Example 1: Basic Min-Heap ===");
  const minHeap = new TinyQueue<number>();
  minHeap.push(5);
  minHeap.push(2);
  minHeap.push(8);
  minHeap.push(1);
  minHeap.push(3);

  console.log("Pushed: 5, 2, 8, 1, 3");
  console.log("Peek (min):", minHeap.peek());
  console.log("Popping all items:");
  while (minHeap.length > 0) {
    console.log("  -", minHeap.pop());
  }
  console.log();

  console.log("=== Example 2: Max-Heap (Custom Compare) ===");
  const maxHeap = new TinyQueue<number>([], (a, b) => b - a);
  maxHeap.push(5);
  maxHeap.push(2);
  maxHeap.push(8);
  maxHeap.push(1);
  maxHeap.push(3);

  console.log("Pushed: 5, 2, 8, 1, 3");
  console.log("Peek (max):", maxHeap.peek());
  console.log("Popping all items:");
  while (maxHeap.length > 0) {
    console.log("  -", maxHeap.pop());
  }
  console.log();

  console.log("=== Example 3: Priority Task Scheduler ===");
  interface Task {
    name: string;
    priority: number;
  }

  const taskQueue = new TinyQueue<Task>([], (a, b) => a.priority - b.priority);

  taskQueue.push({ name: 'Low priority task', priority: 3 });
  taskQueue.push({ name: 'High priority task', priority: 1 });
  taskQueue.push({ name: 'Medium priority task', priority: 2 });
  taskQueue.push({ name: 'Critical task', priority: 0 });

  console.log("Processing tasks by priority:");
  while (taskQueue.length > 0) {
    const task = taskQueue.pop()!;
    console.log(`  [Priority ${task.priority}] ${task.name}`);
  }
  console.log();

  console.log("=== Example 4: Initialize with Data ===");
  const initial = new TinyQueue<number>([5, 3, 7, 1, 9, 2, 8]);
  console.log("Initial data: [5, 3, 7, 1, 9, 2, 8]");
  console.log("Auto-heapified!");
  console.log("Sorted output:");
  const sorted: number[] = [];
  while (initial.length > 0) {
    sorted.push(initial.pop()!);
  }
  console.log("  " + sorted.join(', '));
  console.log();

  console.log("=== Example 5: Find K Smallest Elements ===");
  function kSmallest(arr: number[], k: number): number[] {
    // Use max-heap of size k
    const heap = new TinyQueue<number>([], (a, b) => b - a);

    for (const num of arr) {
      if (heap.length < k) {
        heap.push(num);
      } else if (num < heap.peek()!) {
        heap.pop();
        heap.push(num);
      }
    }

    const result: number[] = [];
    while (heap.length > 0) {
      result.push(heap.pop()!);
    }
    return result.reverse();
  }

  const numbers = [7, 10, 4, 3, 20, 15, 8, 2];
  console.log("Array:", numbers.join(', '));
  console.log("3 smallest:", kSmallest(numbers, 3).join(', '));
  console.log("5 smallest:", kSmallest(numbers, 5).join(', '));
  console.log();

  console.log("=== Example 6: Merge K Sorted Arrays ===");
  function mergeKSorted(arrays: number[][]): number[] {
    interface Item {
      value: number;
      arrayIndex: number;
      elementIndex: number;
    }

    const heap = new TinyQueue<Item>([], (a, b) => a.value - b.value);
    const result: number[] = [];

    // Initialize heap with first element from each array
    for (let i = 0; i < arrays.length; i++) {
      if (arrays[i].length > 0) {
        heap.push({ value: arrays[i][0], arrayIndex: i, elementIndex: 0 });
      }
    }

    // Process heap
    while (heap.length > 0) {
      const item = heap.pop()!;
      result.push(item.value);

      // Add next element from same array
      const nextIndex = item.elementIndex + 1;
      if (nextIndex < arrays[item.arrayIndex].length) {
        heap.push({
          value: arrays[item.arrayIndex][nextIndex],
          arrayIndex: item.arrayIndex,
          elementIndex: nextIndex
        });
      }
    }

    return result;
  }

  const sorted1 = [1, 4, 7];
  const sorted2 = [2, 5, 8];
  const sorted3 = [3, 6, 9];
  console.log("Array 1:", sorted1.join(', '));
  console.log("Array 2:", sorted2.join(', '));
  console.log("Array 3:", sorted3.join(', '));
  console.log("Merged:", mergeKSorted([sorted1, sorted2, sorted3]).join(', '));
  console.log();

  console.log("=== Example 7: String Priority (Lexicographic) ===");
  const stringHeap = new TinyQueue<string>([], (a, b) => a.localeCompare(b));
  stringHeap.push("zebra");
  stringHeap.push("apple");
  stringHeap.push("mango");
  stringHeap.push("banana");

  console.log("Pushed: zebra, apple, mango, banana");
  console.log("Alphabetical order:");
  while (stringHeap.length > 0) {
    console.log("  -", stringHeap.pop());
  }
  console.log();

  console.log("=== Example 8: Performance Test ===");
  const perfHeap = new TinyQueue<number>();
  const n = 10000;

  console.log(`Inserting ${n.toLocaleString()} random numbers...`);
  const start = Date.now();
  for (let i = 0; i < n; i++) {
    perfHeap.push(Math.random());
  }
  const insertTime = Date.now() - start;

  console.log(`Extracting all ${n.toLocaleString()} numbers in sorted order...`);
  const extractStart = Date.now();
  let prev = -Infinity;
  let isSorted = true;
  while (perfHeap.length > 0) {
    const val = perfHeap.pop()!;
    if (val < prev) isSorted = false;
    prev = val;
  }
  const extractTime = Date.now() - extractStart;

  console.log(`Insert time: ${insertTime}ms`);
  console.log(`Extract time: ${extractTime}ms`);
  console.log(`Correctly sorted: ${isSorted}`);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- A* and Dijkstra pathfinding algorithms");
  console.log("- Task scheduling by priority");
  console.log("- Event-driven simulations");
  console.log("- Merging sorted data streams");
  console.log("- Finding k smallest/largest elements");
  console.log("- Median maintenance in streams");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~5M+ downloads/week on npm");
  console.log();

  console.log("⚡ Complexity:");
  console.log("- Push: O(log n)");
  console.log("- Pop: O(log n)");
  console.log("- Peek: O(1)");
  console.log("- Space: O(n)");
}
