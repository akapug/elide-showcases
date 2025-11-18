/**
 * Collect.js - Collections Library for Elide
 * NPM: 200K+ downloads/week
 */

export class Collection<T> {
  constructor(private items: T[]) {}

  static collect<T>(items: T[]): Collection<T> {
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

  pluck<K extends keyof T>(key: K): Collection<T[K]> {
    return new Collection(this.items.map(item => item[key]));
  }

  unique(): Collection<T> {
    return new Collection(Array.from(new Set(this.items)));
  }

  count(): number {
    return this.items.length;
  }

  toArray(): T[] {
    return this.items;
  }
}

export const collect = Collection.collect;

if (import.meta.url.includes("collect.js")) {
  console.log("🎯 Collect.js for Elide - Collections Made Easy\n");
  const result = collect([1, 2, 3, 4, 5])
    .map(x => x * 2)
    .filter(x => x > 5)
    .toArray();
  console.log("Result:", result);
}

export default collect;
