/**
 * Bacon.js - Functional Reactive Programming for Elide
 * NPM: 100K+ downloads/week
 */

type Subscriber<T> = (value: T) => void;

export class EventStream<T> {
  private subscribers: Subscriber<T>[] = [];

  onValue(fn: Subscriber<T>): void {
    this.subscribers.push(fn);
  }

  push(value: T): void {
    this.subscribers.forEach(fn => fn(value));
  }

  map<U>(fn: (value: T) => U): EventStream<U> {
    const stream = new EventStream<U>();
    this.onValue(value => stream.push(fn(value)));
    return stream;
  }

  filter(predicate: (value: T) => boolean): EventStream<T> {
    const stream = new EventStream<T>();
    this.onValue(value => predicate(value) && stream.push(value));
    return stream;
  }

  static fromArray<T>(values: T[]): EventStream<T> {
    const stream = new EventStream<T>();
    setTimeout(() => values.forEach(v => stream.push(v)), 0);
    return stream;
  }
}

if (import.meta.url.includes("baconjs")) {
  console.log("🎯 Bacon.js for Elide - FRP Made Easy\n");
  const stream = EventStream.fromArray([1, 2, 3, 4, 5]);
  stream.map(x => x * 2).filter(x => x > 5).onValue(x => console.log("Value:", x));
}

export default EventStream;
