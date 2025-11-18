/**
 * Set Polyfill
 *
 * ES6 Set polyfill.
 * **POLYGLOT SHOWCASE**: Set for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/set-polyfill (~50K+ downloads/week)
 */

export class SetPolyfill<T> {
  private _values: T[] = [];

  get size(): number {
    return this._values.length;
  }

  add(value: T): this {
    if (!this.has(value)) {
      this._values.push(value);
    }
    return this;
  }

  clear(): void {
    this._values = [];
  }

  delete(value: T): boolean {
    const index = this._values.indexOf(value);
    if (index === -1) return false;
    this._values.splice(index, 1);
    return true;
  }

  has(value: T): boolean {
    return this._values.indexOf(value) !== -1;
  }

  forEach(callback: (value: T, value2: T, set: this) => void): void {
    this._values.forEach(value => callback(value, value, this));
  }

  *entries(): IterableIterator<[T, T]> {
    for (const value of this._values) {
      yield [value, value];
    }
  }

  *keys(): IterableIterator<T> {
    yield* this._values;
  }

  *values(): IterableIterator<T> {
    yield* this._values;
  }
}

export default SetPolyfill;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📦 Set Polyfill (POLYGLOT!)\n");
  
  const set = new SetPolyfill<number>();
  set.add(1);
  set.add(2);
  set.add(3);
  set.add(2); // Duplicate
  console.log('Size:', set.size);
  console.log('Has 2:', set.has(2));
  console.log('Values:', Array.from(set.values()));
  console.log("\n  ✓ ~50K+ downloads/week!");
}
