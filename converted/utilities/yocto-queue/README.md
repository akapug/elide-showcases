# Yocto Queue - Tiny Queue Data Structure

Minimal, fast queue implementation with O(1) enqueue/dequeue operations.

Based on [yocto-queue](https://www.npmjs.com/package/yocto-queue) (~10M+ downloads/week)

## Features

- ⚡ O(1) enqueue and dequeue
- 💾 Minimal memory footprint
- 🎯 TypeScript generics
- 🔄 Iterator support
- 📋 Simple API
- 📦 Zero dependencies

## Quick Start

```typescript
import { Queue } from './elide-yocto-queue.ts';

// Basic operations
const queue = new Queue<number>();
queue.enqueue(1);
queue.enqueue(2);
queue.enqueue(3);

queue.dequeue(); // 1
queue.peek(); // 2
queue.size; // 2
queue.isEmpty; // false

// Task queue
const tasks = new Queue<Task>();
tasks.enqueue({ id: 1, name: "Process payment" });
tasks.enqueue({ id: 2, name: "Send email" });

while (!tasks.isEmpty) {
  const task = tasks.dequeue();
  processTask(task);
}

// BFS traversal
function bfs(root: TreeNode) {
  const queue = new Queue<TreeNode>();
  queue.enqueue(root);

  while (!queue.isEmpty) {
    const node = queue.dequeue()!;
    visit(node);
    if (node.left) queue.enqueue(node.left);
    if (node.right) queue.enqueue(node.right);
  }
}
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const queue = new Queue<string>();
queue.enqueue("hello");
```

### Python (via Elide)
```python
from elide_yocto_queue import Queue

queue = Queue()
queue.enqueue("hello")
```

### Ruby (via Elide)
```ruby
require 'elide/yocto_queue'

queue = Queue.new
queue.enqueue("hello")
```

### Java (via Elide)
```java
import elide.yoctoqueue.Queue;

var queue = new Queue<String>();
queue.enqueue("hello");
```

## Use Cases

- **Task queues** - Process jobs in FIFO order
- **Event loops** - Handle events sequentially
- **BFS algorithms** - Graph/tree traversal
- **Message queues** - Process messages in order
- **Request processing** - Handle requests sequentially
- **Job scheduling** - Schedule jobs in order

## API

### `new Queue<T>()`

Creates a new queue.

### `enqueue(value: T): void`

Add item to end of queue. O(1) operation.

### `dequeue(): T | undefined`

Remove and return item from front. O(1) operation.

### `peek(): T | undefined`

Get front item without removing it.

### `clear(): void`

Remove all items from queue.

### `size: number`

Get number of items in queue.

### `isEmpty: boolean`

Check if queue is empty.

### `[Symbol.iterator]()`

Iterate over queue items.

### `toArray(): T[]`

Convert queue to array.

## Performance

All core operations are O(1):
- `enqueue()`: O(1)
- `dequeue()`: O(1)
- `peek()`: O(1)
- `size`: O(1)
- `isEmpty`: O(1)

## Why Elide?

- 🌐 **Polyglot** - One queue for all languages
- ⚡ **Fast** - O(1) operations everywhere
- 📦 **Zero dependencies** - Pure TypeScript implementation
- 🔄 **Consistent** - Same API in every language
- 🚀 **Production-ready** - 10M+ downloads/week on npm

Run the demo: `elide run elide-yocto-queue.ts`
