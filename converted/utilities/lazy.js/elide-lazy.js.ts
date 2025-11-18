/**
 * Lazy.js - Lazy Evaluation
 *
 * Lazy evaluation library for JavaScript.
 * **POLYGLOT SHOWCASE**: One lazy eval lib for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/lazy.js (~100K+ downloads/week)
 */

export class Lazy<T> {
  constructor(private source: Iterable<T>) {}

  static from<T>(source: Iterable<T>): Lazy<T> {
    return new Lazy(source);
  }

  map<U>(fn: (item: T) => U): Lazy<U> {
    const source = this.source;
    return new Lazy({
      *[Symbol.iterator]() {
        for (const item of source) {
          yield fn(item);
        }
      }
    });
  }

  filter(fn: (item: T) => boolean): Lazy<T> {
    const source = this.source;
    return new Lazy({
      *[Symbol.iterator]() {
        for (const item of source) {
          if (fn(item)) yield item;
        }
      }
    });
  }

  take(count: number): Lazy<T> {
    const source = this.source;
    return new Lazy({
      *[Symbol.iterator]() {
        let taken = 0;
        for (const item of source) {
          if (taken++ >= count) break;
          yield item;
        }
      }
    });
  }

  toArray(): T[] {
    return Array.from(this.source);
  }

  first(): T | undefined {
    for (const item of this.source) {
      return item;
    }
    return undefined;
  }
}

export default Lazy;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("💤 Lazy.js - Lazy Evaluation for Elide (POLYGLOT!)\n");

  const result = Lazy.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    .map(x => x * 2)
    .filter(x => x > 10)
    .take(3)
    .toArray();

  console.log("Result:", result);
  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~100K+ downloads/week on npm");
}
