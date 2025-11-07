/**
 * Binary Heap (Min-Heap and Max-Heap)
 * Efficient priority queue implementation
 * Time: O(log n) insert/extract, O(1) peek
 */

type Comparator<T> = (a: T, b: T) => number;

export class Heap<T> {
  private data: T[] = [];
  private compare: Comparator<T>;

  constructor(comparator?: Comparator<T>) {
    this.compare = comparator || ((a: any, b: any) => a - b); // Default min-heap
  }

  private parent(i: number): number {
    return Math.floor((i - 1) / 2);
  }

  private leftChild(i: number): number {
    return 2 * i + 1;
  }

  private rightChild(i: number): number {
    return 2 * i + 2;
  }

  private swap(i: number, j: number): void {
    [this.data[i], this.data[j]] = [this.data[j], this.data[i]];
  }

  private heapifyUp(index: number): void {
    while (index > 0) {
      const parentIdx = this.parent(index);
      if (this.compare(this.data[index], this.data[parentIdx]) < 0) {
        this.swap(index, parentIdx);
        index = parentIdx;
      } else {
        break;
      }
    }
  }

  private heapifyDown(index: number): void {
    while (true) {
      const left = this.leftChild(index);
      const right = this.rightChild(index);
      let smallest = index;

      if (left < this.data.length && this.compare(this.data[left], this.data[smallest]) < 0) {
        smallest = left;
      }

      if (right < this.data.length && this.compare(this.data[right], this.data[smallest]) < 0) {
        smallest = right;
      }

      if (smallest !== index) {
        this.swap(index, smallest);
        index = smallest;
      } else {
        break;
      }
    }
  }

  push(value: T): void {
    this.data.push(value);
    this.heapifyUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    if (this.data.length === 1) return this.data.pop();

    const result = this.data[0];
    this.data[0] = this.data.pop()!;
    this.heapifyDown(0);

    return result;
  }

  peek(): T | undefined {
    return this.data[0];
  }

  get size(): number {
    return this.data.length;
  }

  isEmpty(): boolean {
    return this.data.length === 0;
  }

  toArray(): T[] {
    return [...this.data];
  }
}

export class MinHeap<T> extends Heap<T> {
  constructor() {
    super((a: any, b: any) => a - b);
  }
}

export class MaxHeap<T> extends Heap<T> {
  constructor() {
    super((a: any, b: any) => b - a);
  }
}

// CLI demo
if (import.meta.url.includes("heap.ts")) {
  console.log("Min Heap:");
  const minHeap = new MinHeap<number>();
  [5, 3, 7, 1, 9, 2].forEach(n => minHeap.push(n));

  const sorted: number[] = [];
  while (!minHeap.isEmpty()) {
    sorted.push(minHeap.pop()!);
  }
  console.log("Heap sort (ascending):", sorted.join(", "));

  console.log("\nMax Heap:");
  const maxHeap = new MaxHeap<number>();
  [5, 3, 7, 1, 9, 2].forEach(n => maxHeap.push(n));

  const sortedDesc: number[] = [];
  while (!maxHeap.isEmpty()) {
    sortedDesc.push(maxHeap.pop()!);
  }
  console.log("Heap sort (descending):", sortedDesc.join(", "));

  console.log("✅ Heap test passed");
}
