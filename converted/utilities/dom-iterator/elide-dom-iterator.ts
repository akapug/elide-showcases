/**
 * DOM Iterator - Iterate Over DOM Nodes
 *
 * Utilities for iterating over DOM nodes and collections.
 * **POLYGLOT SHOWCASE**: One DOM iterator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/dom-iterator (~3M downloads/week)
 *
 * Features:
 * - Node iteration
 * - Collection iteration
 * - Iterator patterns
 * - Functional helpers
 * - Lazy evaluation
 * - Memory efficient
 *
 * Polyglot Benefits:
 * - DOM iteration in any language
 * - ONE API for all services
 * - Share iteration logic
 * - Consistent patterns
 *
 * Use cases:
 * - Node iteration
 * - Collection processing
 * - Tree traversal
 * - Batch operations
 *
 * Package has ~3M downloads/week on npm!
 */

class DOMIterator {
  private nodes: Node[];
  private index: number = 0;

  constructor(nodes: Node | Node[] | NodeList) {
    if (nodes instanceof NodeList) {
      this.nodes = Array.from(nodes);
    } else if (Array.isArray(nodes)) {
      this.nodes = nodes;
    } else {
      this.nodes = [nodes];
    }
  }

  next(): { value: Node | undefined; done: boolean } {
    if (this.index < this.nodes.length) {
      return {
        value: this.nodes[this.index++],
        done: false
      };
    }
    return {
      value: undefined,
      done: true
    };
  }

  reset(): void {
    this.index = 0;
  }

  hasNext(): boolean {
    return this.index < this.nodes.length;
  }

  forEach(callback: (node: Node, index: number) => void): void {
    this.nodes.forEach(callback);
  }

  map<T>(callback: (node: Node, index: number) => T): T[] {
    return this.nodes.map(callback);
  }

  filter(predicate: (node: Node, index: number) => boolean): DOMIterator {
    return new DOMIterator(this.nodes.filter(predicate));
  }

  find(predicate: (node: Node, index: number) => boolean): Node | undefined {
    return this.nodes.find(predicate);
  }

  some(predicate: (node: Node, index: number) => boolean): boolean {
    return this.nodes.some(predicate);
  }

  every(predicate: (node: Node, index: number) => boolean): boolean {
    return this.nodes.every(predicate);
  }

  reduce<T>(
    callback: (acc: T, node: Node, index: number) => T,
    initialValue: T
  ): T {
    return this.nodes.reduce(callback, initialValue);
  }

  toArray(): Node[] {
    return [...this.nodes];
  }

  get length(): number {
    return this.nodes.length;
  }

  [Symbol.iterator]() {
    let index = 0;
    const nodes = this.nodes;

    return {
      next(): { value: Node | undefined; done: boolean } {
        if (index < nodes.length) {
          return { value: nodes[index++], done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
}

function iterate(nodes: Node | Node[] | NodeList): DOMIterator {
  return new DOMIterator(nodes);
}

function* iterateChildren(node: Node): Generator<Node> {
  for (let i = 0; i < node.childNodes.length; i++) {
    yield node.childNodes[i];
  }
}

function* iterateDescendants(node: Node): Generator<Node> {
  for (const child of iterateChildren(node)) {
    yield child;
    yield* iterateDescendants(child);
  }
}

function* iterateAncestors(node: Node): Generator<Node> {
  let current = node.parentNode;
  while (current) {
    yield current;
    current = current.parentNode;
  }
}

export default DOMIterator;
export {
  DOMIterator,
  iterate,
  iterateChildren,
  iterateDescendants,
  iterateAncestors
};

// CLI Demo
if (import.meta.url.includes("elide-dom-iterator.ts")) {
  console.log("✅ DOM Iterator - Node Iteration (POLYGLOT!)\n");

  console.log("Example DOM iteration:");
  console.log("  iterate(nodes).forEach(n => process(n))");
  console.log("  iterate(nodes).filter(n => n.nodeType === 1)");
  console.log("  for (const child of iterateChildren(node))");
  console.log("  for (const desc of iterateDescendants(node))");

  console.log("\n🚀 ~3M downloads/week on npm!");
  console.log("💡 Powerful DOM iteration utilities!");
}
