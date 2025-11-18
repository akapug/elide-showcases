/**
 * Highland - Streams Library for Elide
 * NPM: 200K+ downloads/week
 */

type StreamCallback<T> = (err: Error | null, data?: T) => void;

export class Stream<T> {
  constructor(private generator: (push: StreamCallback<T>) => void) {}

  static of<T>(...values: T[]): Stream<T> {
    return new Stream(push => {
      values.forEach(v => push(null, v));
      push(new Error('END'));
    });
  }

  map<U>(fn: (value: T) => U): Stream<U> {
    return new Stream(push => {
      this.generator((err, data) => {
        if (err) return push(err);
        if (data !== undefined) push(null, fn(data));
      });
    });
  }

  filter(predicate: (value: T) => boolean): Stream<T> {
    return new Stream(push => {
      this.generator((err, data) => {
        if (err) return push(err);
        if (data !== undefined && predicate(data)) push(null, data);
      });
    });
  }

  toArray(callback: (values: T[]) => void): void {
    const values: T[] = [];
    this.generator((err, data) => {
      if (err?.message === 'END') return callback(values);
      if (data !== undefined) values.push(data);
    });
  }
}

if (import.meta.url.includes("highland")) {
  console.log("🎯 Highland for Elide - Stream Processing\n");
  Stream.of(1, 2, 3, 4).map(x => x * 2).toArray(arr => console.log("Result:", arr));
}

export default Stream;
