/**
 * Mori - ClojureScript Data Structures
 *
 * Persistent data structures for JavaScript (inspired by ClojureScript).
 * **POLYGLOT SHOWCASE**: One persistent structures lib for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/mori (~30K+ downloads/week)
 */

export class PersistentVector<T> {
  constructor(private items: T[] = []) {}

  static of<T>(...items: T[]): PersistentVector<T> {
    return new PersistentVector(items);
  }

  conj(item: T): PersistentVector<T> {
    return new PersistentVector([...this.items, item]);
  }

  get(index: number): T | undefined {
    return this.items[index];
  }

  count(): number {
    return this.items.length;
  }

  toArray(): T[] {
    return [...this.items];
  }
}

export class PersistentMap<K, V> {
  constructor(private map: Map<K, V> = new Map()) {}

  static of<K, V>(...pairs: [K, V][]): PersistentMap<K, V> {
    return new PersistentMap(new Map(pairs));
  }

  assoc(key: K, value: V): PersistentMap<K, V> {
    const newMap = new Map(this.map);
    newMap.set(key, value);
    return new PersistentMap(newMap);
  }

  get(key: K): V | undefined {
    return this.map.get(key);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  dissoc(key: K): PersistentMap<K, V> {
    const newMap = new Map(this.map);
    newMap.delete(key);
    return new PersistentMap(newMap);
  }

  count(): number {
    return this.map.size;
  }
}

export const mori = {
  vector: PersistentVector.of,
  hashMap: PersistentMap.of,
};

export default mori;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔮 Mori - ClojureScript Structures for Elide (POLYGLOT!)\n");

  const v1 = PersistentVector.of(1, 2, 3);
  const v2 = v1.conj(4);
  console.log("v1:", v1.toArray());
  console.log("v2:", v2.toArray());

  const m1 = PersistentMap.of<string, number>(['a', 1], ['b', 2]);
  const m2 = m1.assoc('c', 3);
  console.log("m1.get('c'):", m1.get('c'));
  console.log("m2.get('c'):", m2.get('c'));

  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~30K+ downloads/week on npm");
}
