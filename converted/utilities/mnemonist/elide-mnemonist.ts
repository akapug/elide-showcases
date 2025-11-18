/**
 * Mnemonist - Data Structures
 *
 * Curated collection of data structures for JavaScript.
 * **POLYGLOT SHOWCASE**: One data structures lib for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/mnemonist (~100K+ downloads/week)
 */

export class Stack<T> {
  private items: T[] = [];
  
  push(item: T): void {
    this.items.push(item);
  }
  
  pop(): T | undefined {
    return this.items.pop();
  }
  
  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }
  
  get size(): number {
    return this.items.length;
  }
}

export class Set<T> {
  private items = new globalThis.Set<T>();
  
  add(item: T): void {
    this.items.add(item);
  }
  
  has(item: T): boolean {
    return this.items.has(item);
  }
  
  delete(item: T): boolean {
    return this.items.delete(item);
  }
  
  get size(): number {
    return this.items.size;
  }
  
  values(): IterableIterator<T> {
    return this.items.values();
  }
}

export class Heap<T> {
  private items: T[] = [];
  private compareFn: (a: T, b: T) => number;
  
  constructor(compareFn: (a: T, b: T) => number = (a, b) => (a as any) - (b as any)) {
    this.compareFn = compareFn;
  }
  
  push(item: T): void {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
  }
  
  pop(): T | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }
  
  peek(): T | undefined {
    return this.items[0];
  }
  
  get size(): number {
    return this.items.length;
  }
  
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compareFn(this.items[index], this.items[parent]) >= 0) break;
      [this.items[index], this.items[parent]] = [this.items[parent], this.items[index]];
      index = parent;
    }
  }
  
  private bubbleDown(index: number): void {
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;
      
      if (left < this.items.length && this.compareFn(this.items[left], this.items[smallest]) < 0) {
        smallest = left;
      }
      
      if (right < this.items.length && this.compareFn(this.items[right], this.items[smallest]) < 0) {
        smallest = right;
      }
      
      if (smallest === index) break;
      
      [this.items[index], this.items[smallest]] = [this.items[smallest], this.items[index]];
      index = smallest;
    }
  }
}

export default { Stack, Set, Heap };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📚 Mnemonist - Data Structures for Elide (POLYGLOT!)\n");

  console.log("=== Stack ===");
  const stack = new Stack<number>();
  stack.push(1);
  stack.push(2);
  stack.push(3);
  console.log("pop:", stack.pop());
  console.log("peek:", stack.peek());
  
  console.log("\n=== Heap (Min) ===");
  const heap = new Heap<number>();
  heap.push(5);
  heap.push(2);
  heap.push(8);
  heap.push(1);
  console.log("pop (min):", heap.pop());
  console.log("pop (min):", heap.pop());
  
  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~100K+ downloads/week on npm");
}
