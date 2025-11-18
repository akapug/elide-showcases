# Denque - Double-Ended Queue

High-performance double-ended queue with O(1) operations on both ends.

Based on [denque](https://www.npmjs.com/package/denque) (~500K+ downloads/week)

## Features

- ⚡ O(1) push/pop/shift/unshift
- 📊 Array-like indexing
- 💾 Memory efficient circular buffer
- 🎯 TypeScript generics
- 🔄 Iterator support
- 📦 Zero dependencies

## Quick Start

```typescript
import { Denque } from './elide-denque.ts';

// Basic operations
const deque = new Denque<number>();
deque.push(1);      // Add to end
deque.unshift(0);   // Add to front
deque.pop();        // Remove from end
deque.shift();      // Remove from front

// From array
const deque2 = new Denque([1, 2, 3, 4, 5]);

// Sliding window
function maxSlidingWindow(nums: number[], k: number) {
  const result = [];
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

// Undo/Redo
class UndoRedo {
  private past = new Denque();
  private future = new Denque();

  do(action) {
    this.past.push(action);
    this.future.clear();
  }

  undo() {
    const action = this.past.pop();
    if (action) this.future.unshift(action);
    return action;
  }

  redo() {
    const action = this.future.shift();
    if (action) this.past.push(action);
    return action;
  }
}
```

## API

### `new Denque<T>(array?, capacity?)`
Create a new double-ended queue.

### `push(item: T): void`
Add item to end. O(1).

### `unshift(item: T): void`
Add item to front. O(1).

### `pop(): T | undefined`
Remove and return item from end. O(1).

### `shift(): T | undefined`
Remove and return item from front. O(1).

### `get(index: number): T | undefined`
Get item at index. O(1).

### `peekFront(): T | undefined`
Peek at front item without removing.

### `peekBack(): T | undefined`
Peek at back item without removing.

### `clear(): void`
Remove all items.

### `size: number`
Get number of items.

### `isEmpty: boolean`
Check if empty.

### `toArray(): T[]`
Convert to array.

## Use Cases

- **Sliding window** - Maximum/minimum in sliding window
- **Undo/Redo** - Command history management
- **Work stealing** - Task scheduler with both ends access
- **Palindrome** - Check palindromes efficiently
- **LRU cache** - Cache eviction policy implementation
- **BFS/DFS** - Graph traversal algorithms

## Performance

All core operations are O(1):
- `push()`: O(1)
- `pop()`: O(1)
- `unshift()`: O(1)
- `shift()`: O(1)
- `get()`: O(1)
- `peek()`: O(1)

## Why Elide?

- 🌐 **Polyglot** - One deque for all languages
- ⚡ **Fast** - O(1) operations on both ends
- 📦 **Zero dependencies** - Pure TypeScript
- 🔄 **Consistent** - Same API everywhere
- 🚀 **Production-ready** - 500K+ downloads/week

Run the demo: `elide run elide-denque.ts`
