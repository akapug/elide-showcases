/**
 * Most.js - Ultra-high Performance Reactive Programming for Elide
 * NPM: 300K+ downloads/week
 */

export class Stream<T> {
  constructor(private source: () => T[]) {}

  static from<T>(values: T[]): Stream<T> {
    return new Stream(() => values);
  }

  map<U>(fn: (value: T) => U): Stream<U> {
    return new Stream(() => this.source().map(fn));
  }

  filter(predicate: (value: T) => boolean): Stream<T> {
    return new Stream(() => this.source().filter(predicate));
  }

  reduce<U>(fn: (acc: U, value: T) => U, initial: U): U {
    return this.source().reduce(fn, initial);
  }

  forEach(fn: (value: T) => void): void {
    this.source().forEach(fn);
  }
}

if (import.meta.url.includes("most")) {
  console.log("🎯 Most.js for Elide - Ultra-high Performance Streams\n");
  Stream.from([1, 2, 3, 4, 5]).map(x => x * 2).filter(x => x > 5).forEach(x => console.log(x));
}

export default Stream;
