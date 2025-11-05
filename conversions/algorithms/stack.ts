export class Stack<T> {
  private items: T[] = [];
  push(item: T) { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  peek(): T | undefined { return this.items[this.items.length - 1]; }
  get size() { return this.items.length; }
  isEmpty() { return this.items.length === 0; }
}
if (import.meta.url.includes("stack")) {
  const s = new Stack<number>();
  s.push(1); s.push(2); s.push(3);
  console.log("✅", s.pop(), s.peek(), s.size);
}
