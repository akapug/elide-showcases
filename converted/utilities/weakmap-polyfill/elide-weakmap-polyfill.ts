/**
 * WeakMap Polyfill
 *
 * ES6 WeakMap polyfill.
 * **POLYGLOT SHOWCASE**: WeakMap for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/weakmap-polyfill (~50K+ downloads/week)
 */

export class WeakMapPolyfill<K extends object, V> {
  private _id = `__weakmap_${Math.random()}__`;

  delete(key: K): boolean {
    if (!(this._id in key)) return false;
    delete (key as any)[this._id];
    return true;
  }

  get(key: K): V | undefined {
    return (key as any)[this._id];
  }

  has(key: K): boolean {
    return this._id in key;
  }

  set(key: K, value: V): this {
    Object.defineProperty(key, this._id, {
      value,
      configurable: true
    });
    return this;
  }
}

export default WeakMapPolyfill;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🗺️ WeakMap Polyfill (POLYGLOT!)\n");
  
  const wm = new WeakMapPolyfill<object, string>();
  const key = { id: 1 };
  wm.set(key, 'value');
  console.log('Has key:', wm.has(key));
  console.log('Get value:', wm.get(key));
  console.log("\n  ✓ ~50K+ downloads/week!");
}
