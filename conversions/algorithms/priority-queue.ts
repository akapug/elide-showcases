export class PriorityQueue<T> {
  private items: { value: T; priority: number }[] = [];
  enqueue(value: T, priority: number) {
    this.items.push({ value, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }
  dequeue(): T | undefined {
    return this.items.shift()?.value;
  }
  get size() { return this.items.length; }
}
if (import.meta.url.includes("priority-queue")) {
  const pq = new PriorityQueue<string>();
  pq.enqueue("low", 3); pq.enqueue("high", 1);
  console.log("✅", pq.dequeue());
}
