/**
 * Denque - Double-Ended Queue
 *
 * High-performance double-ended queue with O(1) operations on both ends.
 * **POLYGLOT SHOWCASE**: One deque for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/denque (~500K+ downloads/week)
 *
 * Features:
 * - O(1) push/pop on both ends
 * - Array-like indexing
 * - Memory efficient circular buffer
 * - TypeScript generics
 * - Iterator support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need deques
 * - ONE implementation works everywhere on Elide
 * - Consistent data structure APIs
 * - Share deque logic across your stack
 *
 * Use cases:
 * - Sliding window algorithms
 * - Undo/redo stacks
 * - Work stealing schedulers
 * - LRU cache implementation
 *
 * Package has ~500K+ downloads/week on npm!
 */

export class Denque<T> {
  private _list: (T | undefined)[];
  private _head: number;
  private _tail: number;
  private _capacity: number;
  private _capacityMask: number;

  constructor(array?: T[], capacity?: number) {
    this._capacity = capacity || (array?.length ? 2 ** Math.ceil(Math.log2(array.length)) : 16);
    this._capacityMask = this._capacity - 1;
    this._list = new Array(this._capacity);
    this._head = 0;
    this._tail = 0;

    if (array) {
      for (const item of array) {
        this.push(item);
      }
    }
  }

  /**
   * Add item to end
   */
  push(item: T): void {
    this._list[this._tail] = item;
    this._tail = (this._tail + 1) & this._capacityMask;
    if (this._tail === this._head) {
      this._growArray();
    }
  }

  /**
   * Add item to front
   */
  unshift(item: T): void {
    this._head = (this._head - 1 + this._capacity) & this._capacityMask;
    this._list[this._head] = item;
    if (this._tail === this._head) {
      this._growArray();
    }
  }

  /**
   * Remove and return item from end
   */
  pop(): T | undefined {
    if (this._head === this._tail) return undefined;
    this._tail = (this._tail - 1 + this._capacity) & this._capacityMask;
    const item = this._list[this._tail];
    this._list[this._tail] = undefined;
    return item;
  }

  /**
   * Remove and return item from front
   */
  shift(): T | undefined {
    if (this._head === this._tail) return undefined;
    const item = this._list[this._head];
    this._list[this._head] = undefined;
    this._head = (this._head + 1) & this._capacityMask;
    return item;
  }

  /**
   * Get item at index
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this.size) return undefined;
    return this._list[(this._head + index) & this._capacityMask];
  }

  /**
   * Peek at front item
   */
  peekFront(): T | undefined {
    return this._list[this._head];
  }

  /**
   * Peek at back item
   */
  peekBack(): T | undefined {
    return this._list[(this._tail - 1 + this._capacity) & this._capacityMask];
  }

  /**
   * Clear all items
   */
  clear(): void {
    this._head = 0;
    this._tail = 0;
    this._list = new Array(this._capacity);
  }

  /**
   * Get size
   */
  get size(): number {
    return (this._tail - this._head + this._capacity) & this._capacityMask;
  }

  /**
   * Check if empty
   */
  get isEmpty(): boolean {
    return this._head === this._tail;
  }

  /**
   * Convert to array
   */
  toArray(): T[] {
    return Array.from(this);
  }

  /**
   * Iterator
   */
  *[Symbol.iterator](): Iterator<T> {
    let i = this._head;
    while (i !== this._tail) {
      yield this._list[i]!;
      i = (i + 1) & this._capacityMask;
    }
  }

  private _growArray(): void {
    this._capacity *= 2;
    this._capacityMask = this._capacity - 1;
    const newList = new Array(this._capacity);

    let i = 0;
    let j = this._head;
    while (j !== this._tail) {
      newList[i++] = this._list[j];
      j = (j + 1) & (this._capacityMask >> 1);
    }

    this._list = newList;
    this._head = 0;
    this._tail = i;
  }
}

export default Denque;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 Denque - Double-Ended Queue for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Operations ===");
  const deque = new Denque<number>();
  deque.push(1);
  deque.push(2);
  deque.push(3);
  console.log("After push(1,2,3):", deque.toArray());

  deque.unshift(0);
  console.log("After unshift(0):", deque.toArray());

  console.log("Pop:", deque.pop());
  console.log("Shift:", deque.shift());
  console.log("Result:", deque.toArray());
  console.log();

  console.log("=== Example 2: Sliding Window Maximum ===");
  function maxSlidingWindow(nums: number[], k: number): number[] {
    const result: number[] = [];
    const deque = new Denque<number>();

    for (let i = 0; i < nums.length; i++) {
      while (!deque.isEmpty && nums[deque.peekBack()!] < nums[i]) {
        deque.pop();
      }
      deque.push(i);

      if (deque.peekFront()! <= i - k) {
        deque.shift();
      }

      if (i >= k - 1) {
        result.push(nums[deque.peekFront()!]);
      }
    }

    return result;
  }

  const nums = [1, 3, -1, -3, 5, 3, 6, 7];
  console.log("Array:", nums);
  console.log("Window size: 3");
  console.log("Maximums:", maxSlidingWindow(nums, 3));
  console.log();

  console.log("=== Example 3: Undo/Redo Stack ===");
  class UndoRedo<T> {
    private past = new Denque<T>();
    private future = new Denque<T>();

    do(action: T): void {
      this.past.push(action);
      this.future.clear();
    }

    undo(): T | undefined {
      const action = this.past.pop();
      if (action !== undefined) {
        this.future.unshift(action);
      }
      return action;
    }

    redo(): T | undefined {
      const action = this.future.shift();
      if (action !== undefined) {
        this.past.push(action);
      }
      return action;
    }
  }

  const history = new UndoRedo<string>();
  history.do("Type 'Hello'");
  history.do("Type 'World'");
  history.do("Type '!'");
  console.log("Undo:", history.undo());
  console.log("Undo:", history.undo());
  console.log("Redo:", history.redo());
  console.log();

  console.log("=== Example 4: Palindrome Checker ===");
  function isPalindrome(s: string): boolean {
    const deque = new Denque(s.toLowerCase().replace(/[^a-z0-9]/g, '').split(''));

    while (deque.size > 1) {
      if (deque.shift() !== deque.pop()) {
        return false;
      }
    }

    return true;
  }

  console.log("'A man a plan a canal Panama':", isPalindrome("A man a plan a canal Panama"));
  console.log("'Hello World':", isPalindrome("Hello World"));
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Same denque works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log("\nBenefits:");
  console.log("  ✓ One deque implementation, all languages");
  console.log("  ✓ O(1) operations on both ends");
  console.log("  ✓ Share data structures across your stack");
  console.log("\n✅ Use Cases:");
  console.log("- Sliding window algorithms");
  console.log("- Undo/redo functionality");
  console.log("- Work stealing schedulers");
  console.log("- Palindrome checking");
  console.log("- LRU cache implementation");
  console.log("\n🚀 Performance:");
  console.log("- O(1) push/pop/shift/unshift");
  console.log("- Memory efficient circular buffer");
  console.log("- ~500K+ downloads/week on npm");
}
