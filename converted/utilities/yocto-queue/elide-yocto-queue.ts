/**
 * Yocto Queue - Tiny Queue Data Structure
 *
 * Minimal, fast queue implementation with O(1) operations.
 * **POLYGLOT SHOWCASE**: One queue for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/yocto-queue (~10M+ downloads/week)
 *
 * Features:
 * - O(1) enqueue and dequeue
 * - Minimal memory footprint
 * - TypeScript generics
 * - Simple API
 * - Iterator support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need queues
 * - ONE implementation works everywhere on Elide
 * - Consistent data structure APIs
 * - Share queue logic across your stack
 *
 * Use cases:
 * - Task queues (process jobs sequentially)
 * - Event loops (handle events in order)
 * - BFS algorithms (graph traversal)
 * - Message queues (FIFO processing)
 *
 * Package has ~10M+ downloads/week on npm - essential data structure!
 */

class Node<T> {
  value: T;
  next: Node<T> | undefined;

  constructor(value: T) {
    this.value = value;
    this.next = undefined;
  }
}

export class Queue<T> {
  private _head: Node<T> | undefined;
  private _tail: Node<T> | undefined;
  private _size: number;

  constructor() {
    this._head = undefined;
    this._tail = undefined;
    this._size = 0;
  }

  /**
   * Add item to end of queue
   */
  enqueue(value: T): void {
    const node = new Node(value);

    if (this._head) {
      this._tail!.next = node;
      this._tail = node;
    } else {
      this._head = node;
      this._tail = node;
    }

    this._size++;
  }

  /**
   * Remove and return item from front of queue
   */
  dequeue(): T | undefined {
    const current = this._head;
    if (!current) {
      return undefined;
    }

    this._head = this._head.next;
    this._size--;
    return current.value;
  }

  /**
   * Get item at front without removing
   */
  peek(): T | undefined {
    return this._head?.value;
  }

  /**
   * Clear all items
   */
  clear(): void {
    this._head = undefined;
    this._tail = undefined;
    this._size = 0;
  }

  /**
   * Get queue size
   */
  get size(): number {
    return this._size;
  }

  /**
   * Check if queue is empty
   */
  get isEmpty(): boolean {
    return this._size === 0;
  }

  /**
   * Iterator support
   */
  *[Symbol.iterator](): Iterator<T> {
    let current = this._head;

    while (current) {
      yield current.value;
      current = current.next;
    }
  }

  /**
   * Convert to array
   */
  toArray(): T[] {
    return Array.from(this);
  }
}

export default Queue;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📦 Yocto Queue - Tiny Queue for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Queue Operations ===");
  const queue = new Queue<number>();

  console.log("Enqueuing: 1, 2, 3, 4, 5");
  queue.enqueue(1);
  queue.enqueue(2);
  queue.enqueue(3);
  queue.enqueue(4);
  queue.enqueue(5);
  console.log("Queue size:", queue.size);
  console.log("Peek:", queue.peek());

  console.log("\nDequeuing:");
  console.log("Dequeue:", queue.dequeue()); // 1
  console.log("Dequeue:", queue.dequeue()); // 2
  console.log("Queue size:", queue.size);
  console.log("Peek:", queue.peek());
  console.log();

  console.log("=== Example 2: Task Queue ===");
  interface Task {
    id: number;
    name: string;
    priority: string;
  }

  const taskQueue = new Queue<Task>();

  taskQueue.enqueue({ id: 1, name: "Process payment", priority: "high" });
  taskQueue.enqueue({ id: 2, name: "Send email", priority: "medium" });
  taskQueue.enqueue({ id: 3, name: "Update cache", priority: "low" });

  console.log("Processing tasks:");
  while (!taskQueue.isEmpty) {
    const task = taskQueue.dequeue()!;
    console.log(`Task #${task.id}: ${task.name} (${task.priority})`);
  }
  console.log();

  console.log("=== Example 3: BFS Algorithm ===");
  interface TreeNode {
    value: number;
    left?: TreeNode;
    right?: TreeNode;
  }

  const tree: TreeNode = {
    value: 1,
    left: {
      value: 2,
      left: { value: 4 },
      right: { value: 5 },
    },
    right: {
      value: 3,
      left: { value: 6 },
      right: { value: 7 },
    },
  };

  function bfs(root: TreeNode): number[] {
    const result: number[] = [];
    const queue = new Queue<TreeNode>();
    queue.enqueue(root);

    while (!queue.isEmpty) {
      const node = queue.dequeue()!;
      result.push(node.value);

      if (node.left) queue.enqueue(node.left);
      if (node.right) queue.enqueue(node.right);
    }

    return result;
  }

  console.log("Tree BFS traversal:", bfs(tree));
  console.log();

  console.log("=== Example 4: Message Queue ===");
  interface Message {
    from: string;
    to: string;
    content: string;
    timestamp: number;
  }

  const messageQueue = new Queue<Message>();

  messageQueue.enqueue({
    from: "alice",
    to: "bob",
    content: "Hello!",
    timestamp: Date.now(),
  });

  messageQueue.enqueue({
    from: "bob",
    to: "alice",
    content: "Hi there!",
    timestamp: Date.now() + 1000,
  });

  console.log("Processing messages:");
  for (const msg of messageQueue) {
    console.log(`${msg.from} -> ${msg.to}: ${msg.content}`);
  }
  console.log();

  console.log("=== Example 5: Request Queue ===");
  const requestQueue = new Queue<string>();

  console.log("Queueing API requests:");
  requestQueue.enqueue("GET /users");
  requestQueue.enqueue("POST /users");
  requestQueue.enqueue("PUT /users/1");
  requestQueue.enqueue("DELETE /users/2");

  console.log("Queue contents:", requestQueue.toArray());
  console.log("Processing requests...");

  while (!requestQueue.isEmpty) {
    const request = requestQueue.dequeue();
    console.log(`Processing: ${request}`);
  }
  console.log();

  console.log("=== Example 6: Print Queue ===");
  interface PrintJob {
    document: string;
    pages: number;
    user: string;
  }

  const printQueue = new Queue<PrintJob>();

  printQueue.enqueue({ document: "report.pdf", pages: 10, user: "alice" });
  printQueue.enqueue({ document: "invoice.pdf", pages: 2, user: "bob" });
  printQueue.enqueue({ document: "contract.pdf", pages: 25, user: "charlie" });

  console.log("Print queue:");
  let jobNumber = 1;
  for (const job of printQueue) {
    console.log(`Job ${jobNumber++}: ${job.document} (${job.pages} pages) - ${job.user}`);
  }
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Same queue works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log("\nBenefits:");
  console.log("  ✓ One queue implementation, all languages");
  console.log("  ✓ Consistent data structure APIs");
  console.log("  ✓ Share queue logic across your stack");
  console.log("  ✓ O(1) enqueue and dequeue operations");
  console.log("\n✅ Use Cases:");
  console.log("- Task queues");
  console.log("- Event loops");
  console.log("- BFS algorithms");
  console.log("- Message queues");
  console.log("- Request processing");
  console.log("- Job scheduling");
  console.log("\n🚀 Performance:");
  console.log("- O(1) enqueue and dequeue");
  console.log("- Minimal memory footprint");
  console.log("- ~10M+ downloads/week on npm!");
}
