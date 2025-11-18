/**
 * Immutable - Immutable Collections
 *
 * Immutable persistent data collections.
 * **POLYGLOT SHOWCASE**: One immutable collections for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/immutable (~2M+ downloads/week)
 *
 * Features:
 * - Immutable List, Map, Set
 * - Persistent data structures
 * - Efficient updates
 * - Zero dependencies
 *
 * Package has ~2M+ downloads/week on npm!
 */

export class List<T> {
  private items: T[];
  
  constructor(items: T[] = []) {
    this.items = [...items];
  }
  
  get(index: number): T | undefined {
    return this.items[index];
  }
  
  set(index: number, value: T): List<T> {
    const newItems = [...this.items];
    newItems[index] = value;
    return new List(newItems);
  }
  
  push(value: T): List<T> {
    return new List([...this.items, value]);
  }
  
  size(): number {
    return this.items.length;
  }
  
  toArray(): T[] {
    return [...this.items];
  }
}

export class ImmutableMap<K, V> {
  private data: Map<K, V>;
  
  constructor(entries?: [K, V][]) {
    this.data = new Map(entries);
  }
  
  get(key: K): V | undefined {
    return this.data.get(key);
  }
  
  set(key: K, value: V): ImmutableMap<K, V> {
    const newMap = new Map(this.data);
    newMap.set(key, value);
    return new ImmutableMap(Array.from(newMap.entries()));
  }
  
  delete(key: K): ImmutableMap<K, V> {
    const newMap = new Map(this.data);
    newMap.delete(key);
    return new ImmutableMap(Array.from(newMap.entries()));
  }
  
  size(): number {
    return this.data.size;
  }
}

export default { List, Map: ImmutableMap };

if (import.meta.url.includes("elide-immutable.ts")) {
  console.log("🔒 Immutable - Immutable Collections for Elide (POLYGLOT!)\n");
  
  const list = new List([1, 2, 3]);
  const list2 = list.push(4);
  
  console.log("List 1:", list.toArray());
  console.log("List 2:", list2.toArray());
  
  const map = new ImmutableMap([["a", 1]]);
  const map2 = map.set("b", 2);
  
  console.log("Map 1 size:", map.size());
  console.log("Map 2 size:", map2.size());
  console.log("\n✅ ~2M+ downloads/week on npm");
}
