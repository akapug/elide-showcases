/**
 * Lazy Collections for Elide
 * NPM: 50K+ downloads/week
 */

export class LazyCollection<T> {
  constructor(private source: Iterable<T>) {}

  static from<T>(source: Iterable<T>): LazyCollection<T> {
    return new LazyCollection(source);
  }

  *[Symbol.iterator](): Iterator<T> {
    yield* this.source;
  }

  map<U>(fn: (value: T) => U): LazyCollection<U> {
    const source = this.source;
    return new LazyCollection({
      *[Symbol.iterator]() {
        for (const value of source) {
          yield fn(value);
        }
      }
    });
  }

  filter(predicate: (value: T) => boolean): LazyCollection<T> {
    const source = this.source;
    return new LazyCollection({
      *[Symbol.iterator]() {
        for (const value of source) {
          if (predicate(value)) yield value;
        }
      }
    });
  }

  take(count: number): LazyCollection<T> {
    const source = this.source;
    return new LazyCollection({
      *[Symbol.iterator]() {
        let taken = 0;
        for (const value of source) {
          if (taken++ >= count) break;
          yield value;
        }
      }
    });
  }

  toArray(): T[] {
    return Array.from(this.source);
  }
}

if (import.meta.url.includes("lazy-collections")) {
  console.log("🎯 Lazy Collections for Elide\n");
  const result = LazyCollection.from([1, 2, 3, 4, 5])
    .map(x => x * 2)
    .filter(x => x > 5)
    .take(2)
    .toArray();
  console.log("Result:", result);
}

export default LazyCollection;
