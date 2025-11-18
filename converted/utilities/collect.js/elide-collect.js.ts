/**
 * Collect.js - Collections
 *
 * Convenient and dependency-free wrapper for working with arrays and objects.
 * **POLYGLOT SHOWCASE**: One collections lib for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/collect.js (~50K+ downloads/week)
 */

export class Collection<T> {
  constructor(private items: T[]) {}

  static make<T>(items: T[]): Collection<T> {
    return new Collection(items);
  }

  all(): T[] {
    return this.items;
  }

  map<U>(fn: (item: T) => U): Collection<U> {
    return new Collection(this.items.map(fn));
  }

  filter(fn: (item: T) => boolean): Collection<T> {
    return new Collection(this.items.filter(fn));
  }

  first(): T | undefined {
    return this.items[0];
  }

  last(): T | undefined {
    return this.items[this.items.length - 1];
  }

  count(): number {
    return this.items.length;
  }

  pluck<K extends keyof T>(key: K): Collection<T[K]> {
    return new Collection(this.items.map(item => item[key]));
  }

  unique(): Collection<T> {
    return new Collection(Array.from(new Set(this.items)));
  }

  chunk(size: number): Collection<T[]> {
    const chunks: T[][] = [];
    for (let i = 0; i < this.items.length; i += size) {
      chunks.push(this.items.slice(i, i + size));
    }
    return new Collection(chunks);
  }

  flatten(): Collection<any> {
    return new Collection(this.items.flat(Infinity));
  }
}

export default Collection;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📦 Collect.js - Collections for Elide (POLYGLOT!)\n");

  const collection = Collection.make([1, 2, 3, 4, 5]);
  console.log("map:", collection.map(x => x * 2).all());
  console.log("filter:", collection.filter(x => x % 2 === 0).all());
  console.log("first:", collection.first());
  console.log("last:", collection.last());

  const users = Collection.make([
    { name: "Alice", age: 25 },
    { name: "Bob", age: 30 }
  ]);
  console.log("pluck:", users.pluck('name').all());

  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~50K+ downloads/week on npm");
}
