/**
 * LRU Cache - Least Recently Used Cache
 *
 * Core features:
 * - O(1) get/set operations
 * - LRU eviction policy
 * - Max size limit
 * - TTL support
 * - Update on access
 * - Size tracking
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 150M+ downloads/week
 */

interface LRUOptions {
  max?: number;
  maxAge?: number;
  length?: (value: any, key: string) => number;
  dispose?: (key: string, value: any) => void;
  updateAgeOnGet?: boolean;
}

class Node<K, V> {
  constructor(
    public key: K,
    public value: V,
    public expires?: number,
    public prev?: Node<K, V>,
    public next?: Node<K, V>
  ) {}
}

export class LRUCache<K = string, V = any> {
  private cache = new Map<K, Node<K, V>>();
  private head?: Node<K, V>;
  private tail?: Node<K, V>;
  private max: number;
  private maxAge: number;
  private length: (value: V, key: K) => number;
  private dispose?: (key: K, value: V) => void;
  private updateAgeOnGet: boolean;
  private currentLength = 0;

  constructor(options: LRUOptions | number = {}) {
    if (typeof options === 'number') {
      options = { max: options };
    }

    this.max = options.max || Infinity;
    this.maxAge = options.maxAge || 0;
    this.length = options.length || (() => 1);
    this.dispose = options.dispose;
    this.updateAgeOnGet = options.updateAgeOnGet !== false;
  }

  private moveToFront(node: Node<K, V>) {
    if (node === this.head) return;

    // Remove from current position
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.tail) this.tail = node.prev;

    // Move to front
    node.prev = undefined;
    node.next = this.head;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
  }

  private evict() {
    if (!this.tail) return;

    const evicted = this.tail;
    this.tail = evicted.prev;
    if (this.tail) {
      this.tail.next = undefined;
    } else {
      this.head = undefined;
    }

    this.cache.delete(evicted.key);
    this.currentLength -= this.length(evicted.value, evicted.key);

    if (this.dispose) {
      this.dispose(evicted.key, evicted.value);
    }
  }

  set(key: K, value: V, maxAge?: number): boolean {
    const expires = maxAge || this.maxAge;
    const expiresAt = expires > 0 ? Date.now() + expires : undefined;

    const existing = this.cache.get(key);
    if (existing) {
      this.currentLength -= this.length(existing.value, key);
      existing.value = value;
      existing.expires = expiresAt;
      this.currentLength += this.length(value, key);
      this.moveToFront(existing);
    } else {
      const node = new Node(key, value, expiresAt);
      this.cache.set(key, node);
      this.currentLength += this.length(value, key);

      node.next = this.head;
      if (this.head) this.head.prev = node;
      this.head = node;
      if (!this.tail) this.tail = node;

      while (this.currentLength > this.max && this.tail) {
        this.evict();
      }
    }

    return true;
  }

  get(key: K): V | undefined {
    const node = this.cache.get(key);
    if (!node) return undefined;

    if (node.expires && node.expires < Date.now()) {
      this.delete(key);
      return undefined;
    }

    if (this.updateAgeOnGet && node.expires) {
      node.expires = Date.now() + this.maxAge;
    }

    this.moveToFront(node);
    return node.value;
  }

  peek(key: K): V | undefined {
    const node = this.cache.get(key);
    if (!node) return undefined;

    if (node.expires && node.expires < Date.now()) {
      return undefined;
    }

    return node.value;
  }

  has(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) return false;
    if (node.expires && node.expires < Date.now()) {
      this.delete(key);
      return false;
    }
    return true;
  }

  delete(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    this.cache.delete(key);
    this.currentLength -= this.length(node.value, key);

    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.head) this.head = node.next;
    if (node === this.tail) this.tail = node.prev;

    if (this.dispose) {
      this.dispose(key, node.value);
    }

    return true;
  }

  clear(): void {
    if (this.dispose) {
      for (const [key, node] of this.cache) {
        this.dispose(key, node.value);
      }
    }
    this.cache.clear();
    this.head = undefined;
    this.tail = undefined;
    this.currentLength = 0;
  }

  keys(): K[] {
    const keys: K[] = [];
    let node = this.head;
    while (node) {
      keys.push(node.key);
      node = node.next;
    }
    return keys;
  }

  values(): V[] {
    const values: V[] = [];
    let node = this.head;
    while (node) {
      values.push(node.value);
      node = node.next;
    }
    return values;
  }

  get size(): number {
    return this.cache.size;
  }

  get length(): number {
    return this.currentLength;
  }

  reset(): void {
    this.clear();
  }
}

// CLI Demo
if (import.meta.url.includes("lru-cache")) {
  console.log("🎯 LRU Cache for Elide - Least Recently Used Cache\n");

  const cache = new LRUCache<string, any>({ max: 3 });

  console.log("=== Basic Operations (max: 3) ===");
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  console.log("Keys after setting a,b,c:", cache.keys());

  console.log("\n=== LRU Eviction ===");
  cache.set('d', 4);
  console.log("Keys after setting d (should evict 'a'):", cache.keys());

  console.log("\n=== Access Updates Order ===");
  cache.get('b');
  cache.set('e', 5);
  console.log("Keys after accessing 'b' then setting 'e' (should evict 'c'):", cache.keys());

  console.log("\n=== TTL Support ===");
  const ttlCache = new LRUCache<string, string>({ maxAge: 1000 });
  ttlCache.set('temp', 'expires soon');
  console.log("Value:", ttlCache.get('temp'));
  console.log("Has temp:", ttlCache.has('temp'));

  console.log("\n=== Size Tracking ===");
  const sizeCache = new LRUCache<string, string>({
    max: 10,
    length: (value) => value.length,
  });

  sizeCache.set('short', 'hi');
  sizeCache.set('medium', 'hello');
  sizeCache.set('long', 'hello world');
  console.log("Total length:", sizeCache.length);
  console.log("Size (items):", sizeCache.size);

  console.log("\n=== Peek (no reordering) ===");
  const peekCache = new LRUCache<string, number>({ max: 3 });
  peekCache.set('x', 1);
  peekCache.set('y', 2);
  peekCache.set('z', 3);
  console.log("Before peek:", peekCache.keys());
  peekCache.peek('x');
  console.log("After peek 'x':", peekCache.keys());

  console.log();
  console.log("✅ Use Cases:");
  console.log("- HTTP caching");
  console.log("- Memoization");
  console.log("- Database query cache");
  console.log("- Image/asset caching");
  console.log();

  console.log("🚀 Polyglot Benefits:");
  console.log("- 150M+ npm downloads/week");
  console.log("- Zero dependencies");
  console.log("- Works in TypeScript, Python, Ruby, Java");
  console.log("- Instant startup on Elide");
}

export default LRUCache;
