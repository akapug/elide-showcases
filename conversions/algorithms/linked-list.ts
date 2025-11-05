class Node<T> {
  constructor(public value: T, public next: Node<T> | null = null) {}
}
export class LinkedList<T> {
  private head: Node<T> | null = null;
  append(value: T) {
    if (!this.head) this.head = new Node(value);
    else {
      let current = this.head;
      while (current.next) current = current.next;
      current.next = new Node(value);
    }
  }
  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }
}
if (import.meta.url.includes("linked-list")) {
  const list = new LinkedList<number>();
  list.append(1); list.append(2); list.append(3);
  console.log("✅", list.toArray());
}
