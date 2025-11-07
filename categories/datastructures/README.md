# Data Structures - Classic CS Implementations

**5 fundamental data structure implementations** in TypeScript.

## 🎯 What's Included

Classic computer science data structures:
- **Stack** - LIFO (Last In, First Out)
- **Queue** - FIFO (First In, First Out)
- **LinkedList** - Dynamic linear structure
- **Tree** - Hierarchical structure (Binary Search Tree)
- **Graph** - Network of nodes and edges

## 📁 Structures (5 total)

Each implementation includes:
- Full TypeScript implementation with generics
- Type-safe operations
- Common algorithms (insert, delete, search, traverse)
- Time/space complexity documentation
- CLI demo with examples

## 🚀 Quick Start

```bash
cd categories/datastructures

# Stack implementation
elide run stack.ts

# Queue implementation
elide run queue.ts

# LinkedList
elide run linked-list.ts

# Binary Search Tree
elide run tree.ts

# Graph implementation
elide run graph.ts
```

## 💡 Use Cases

### Stack - LIFO Operations
```typescript
import { Stack } from './stack.ts';

const stack = new Stack<number>();
stack.push(1);
stack.push(2);
stack.push(3);

console.log(stack.pop()); // 3 (last in, first out)
console.log(stack.peek()); // 2 (top element)
```

**Use cases:**
- Undo/redo functionality
- Expression evaluation
- Backtracking algorithms
- Function call stack simulation
- Browser history (back button)

### Queue - FIFO Operations
```typescript
import { Queue } from './queue.ts';

const queue = new Queue<string>();
queue.enqueue('first');
queue.enqueue('second');
queue.enqueue('third');

console.log(queue.dequeue()); // 'first' (first in, first out)
console.log(queue.peek()); // 'second' (front element)
```

**Use cases:**
- Task scheduling
- BFS algorithms
- Request handling
- Event processing
- Message queues

### LinkedList - Dynamic List
```typescript
import { LinkedList } from './linked-list.ts';

const list = new LinkedList<number>();
list.append(1);
list.append(2);
list.prepend(0);
list.insertAt(1, 1.5);

console.log(list.toArray()); // [0, 1.5, 1, 2]
```

**Use cases:**
- Dynamic collections
- Efficient insertion/deletion
- Implementing other structures
- LRU cache
- Music playlists

### Tree - Hierarchical Data
```typescript
import { BinarySearchTree } from './tree.ts';

const bst = new BinarySearchTree<number>();
bst.insert(5);
bst.insert(3);
bst.insert(7);

console.log(bst.search(3)); // true
console.log(bst.inOrder()); // [3, 5, 7] (sorted)
```

**Use cases:**
- Sorted data storage
- Fast lookups (O(log n))
- File systems
- Database indices
- Decision trees

### Graph - Networks
```typescript
import { Graph } from './graph.ts';

const graph = new Graph<string>();
graph.addVertex('A');
graph.addVertex('B');
graph.addEdge('A', 'B');

const neighbors = graph.getNeighbors('A'); // ['B']
const path = graph.bfs('A', 'B'); // Breadth-first search
```

**Use cases:**
- Social networks
- Route planning
- Dependency resolution
- Network topology
- Recommendation systems

## ⚡ Performance

Time complexity for common operations:

### Stack:
- Push: **O(1)**
- Pop: **O(1)**
- Peek: **O(1)**
- Space: **O(n)**

### Queue:
- Enqueue: **O(1)**
- Dequeue: **O(1)**
- Peek: **O(1)**
- Space: **O(n)**

### LinkedList:
- Append: **O(1)** (with tail pointer)
- Prepend: **O(1)**
- Insert at index: **O(n)**
- Delete: **O(n)**
- Search: **O(n)**
- Space: **O(n)**

### Binary Search Tree (balanced):
- Insert: **O(log n)**
- Search: **O(log n)**
- Delete: **O(log n)**
- Traverse: **O(n)**
- Space: **O(n)**

### Graph (adjacency list):
- Add vertex: **O(1)**
- Add edge: **O(1)**
- Remove vertex: **O(V + E)**
- Remove edge: **O(E)**
- BFS/DFS: **O(V + E)**
- Space: **O(V + E)**

## 🏆 Highlights

### Most Fundamental:
- **Stack** - Simplest useful structure
- **Queue** - Essential for ordering
- **LinkedList** - Dynamic memory management

### Most Powerful:
- **Tree** - Logarithmic operations
- **Graph** - Complex relationships
- **LinkedList** - Flexible insertions

### Best for Learning:
- **Stack** - Perfect for beginners
- **Queue** - FIFO concept
- **LinkedList** - Pointer manipulation

## 🎨 Example: LRU Cache with LinkedList

```typescript
// Implement LRU Cache using LinkedList

import { LinkedList } from './linked-list.ts';

class LRUCache<K, V> {
  private capacity: number;
  private cache = new Map<K, V>();
  private order = new LinkedList<K>();

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Move to end (most recently used)
    this.order.remove(key);
    this.order.append(key);

    return this.cache.get(key);
  }

  put(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.order.remove(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict least recently used
      const lru = this.order.removeFirst();
      if (lru) this.cache.delete(lru);
    }

    this.cache.set(key, value);
    this.order.append(key);
  }
}

// O(1) get and put operations!
const cache = new LRUCache<string, number>(3);
cache.put('a', 1);
cache.put('b', 2);
cache.put('c', 3);
cache.put('d', 4); // Evicts 'a'
```

## 📊 Comparison with Native JavaScript

| Structure | Native JS | Our Implementation | Benefit |
|-----------|-----------|-------------------|---------|
| Stack | `Array.push()/pop()` | Custom Stack class | Explicit LIFO semantics |
| Queue | `Array.shift()/push()` | Custom Queue class | O(1) dequeue vs O(n) |
| LinkedList | ❌ None | Custom class | Efficient insertion/deletion |
| Tree | ❌ None | Custom BST | Sorted data, O(log n) ops |
| Graph | ❌ None (adjacency list) | Custom Graph class | Clean API, algorithms |

## 🔧 Advanced Features

### Stack:
- Generic type support
- Size tracking
- isEmpty() helper
- Clear operation
- Peek without pop

### Queue:
- Generic type support
- Size tracking
- Circular buffer option (for efficiency)
- Priority queue variant
- Peek without dequeue

### LinkedList:
- Doubly-linked option
- Circular option
- Reverse operation
- Find/filter operations
- Iterator support

### Tree (BST):
- Generic comparable types
- Traversals (in-order, pre-order, post-order)
- Min/max finding
- Height calculation
- Balancing (AVL variant)

### Graph:
- Directed/undirected support
- Weighted edges
- BFS/DFS traversal
- Cycle detection
- Path finding algorithms

## 💡 When to Use What

### Use Stack when:
- LIFO order matters
- Implementing undo/redo
- Depth-first traversal
- Expression parsing

### Use Queue when:
- FIFO order matters
- Task scheduling
- Breadth-first traversal
- Event processing

### Use LinkedList when:
- Frequent insertions/deletions
- Unknown size
- No random access needed
- Building other structures

### Use Tree when:
- Sorted data needed
- Fast lookups required
- Hierarchical data
- Range queries

### Use Graph when:
- Network relationships
- Path finding needed
- Dependency resolution
- Complex connections

---

**5 data structures. Type-safe. Production-ready implementations.**
