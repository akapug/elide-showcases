export class Queue<T> {
  private items: T[] = [];
  enqueue(item: T) { this.items.push(item); }
  dequeue(): T | undefined { return this.items.shift(); }
  peek(): T | undefined { return this.items[0]; }
  get size() { return this.items.length; }
  isEmpty() { return this.items.length === 0; }
}
if (import.meta.url.includes("queue")) {
  const q = new Queue<number>();
  q.enqueue(1); q.enqueue(2);
  console.log("✅", q.dequeue(), q.peek());
}
