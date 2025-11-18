/**
 * xstream - Reactive Streams for Elide
 * NPM: 500K+ downloads/week
 */

export class Stream<T> {
  private listeners: ((value: T) => void)[] = [];

  static create<T>(): Stream<T> {
    return new Stream<T>();
  }

  static of<T>(...values: T[]): Stream<T> {
    const stream = new Stream<T>();
    setTimeout(() => values.forEach(v => stream.shamefullySendNext(v)), 0);
    return stream;
  }

  shamefullySendNext(value: T): void {
    this.listeners.forEach(fn => fn(value));
  }

  addListener(listener: { next: (value: T) => void }): void {
    this.listeners.push(listener.next.bind(listener));
  }

  map<U>(fn: (value: T) => U): Stream<U> {
    const stream = new Stream<U>();
    this.addListener({ next: value => stream.shamefullySendNext(fn(value)) });
    return stream;
  }

  filter(predicate: (value: T) => boolean): Stream<T> {
    const stream = new Stream<T>();
    this.addListener({ next: value => predicate(value) && stream.shamefullySendNext(value) });
    return stream;
  }
}

if (import.meta.url.includes("xstream")) {
  console.log("🎯 xstream for Elide - Reactive Streams\n");
  Stream.of(1, 2, 3, 4, 5).map(x => x * 2).filter(x => x > 5).addListener({ next: x => console.log(x) });
}

export default Stream;
