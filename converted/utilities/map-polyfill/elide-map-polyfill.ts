/**
 * Map Polyfill
 *
 * ES6 Map polyfill.
 * **POLYGLOT SHOWCASE**: Map for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/map-polyfill (~50K+ downloads/week)
 */

export class MapPolyfill<K, V> {
  private _keys: K[] = [];
  private _values: V[] = [];

  get size(): number {
    return this._keys.length;
  }

  clear(): void {
    this._keys = [];
    this._values = [];
  }

  delete(key: K): boolean {
    const index = this._keys.indexOf(key);
    if (index === -1) return false;
    this._keys.splice(index, 1);
    this._values.splice(index, 1);
    return true;
  }

  get(key: K): V | undefined {
    const index = this._keys.indexOf(key);
    return index !== -1 ? this._values[index] : undefined;
  }

  has(key: K): boolean {
    return this._keys.indexOf(key) !== -1;
  }

  set(key: K, value: V): this {
    const index = this._keys.indexOf(key);
    if (index !== -1) {
      this._values[index] = value;
    } else {
      this._keys.push(key);
      this._values.push(value);
    }
    return this;
  }

  forEach(callback: (value: V, key: K, map: this) => void): void {
    this._keys.forEach((key, i) => callback(this._values[i], key, this));
  }

  *entries(): IterableIterator<[K, V]> {
    for (let i = 0; i < this._keys.length; i++) {
      yield [this._keys[i], this._values[i]];
    }
  }

  *keys(): IterableIterator<K> {
    yield* this._keys;
  }

  *values(): IterableIterator<V> {
    yield* this._values;
  }
}

export default MapPolyfill;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🗺️ Map Polyfill (POLYGLOT!)\n");
  
  const map = new MapPolyfill<string, number>();
  map.set('a', 1);
  map.set('b', 2);
  map.set('c', 3);
  console.log('Size:', map.size);
  console.log('Get a:', map.get('a'));
  console.log('Has b:', map.has('b'));
  console.log("\n  ✓ ~50K+ downloads/week!");
}
