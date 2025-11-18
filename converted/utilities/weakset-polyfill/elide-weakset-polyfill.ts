/**
 * WeakSet Polyfill
 *
 * ES6 WeakSet polyfill.
 * **POLYGLOT SHOWCASE**: WeakSet for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/weakset-polyfill (~30K+ downloads/week)
 */

export class WeakSetPolyfill<T extends object> {
  private _id = `__weakset_${Math.random()}__`;

  add(value: T): this {
    Object.defineProperty(value, this._id, {
      value: true,
      configurable: true
    });
    return this;
  }

  delete(value: T): boolean {
    if (!(this._id in value)) return false;
    delete (value as any)[this._id];
    return true;
  }

  has(value: T): boolean {
    return this._id in value;
  }
}

export default WeakSetPolyfill;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📦 WeakSet Polyfill (POLYGLOT!)\n");
  
  const ws = new WeakSetPolyfill<object>();
  const obj = { id: 1 };
  ws.add(obj);
  console.log('Has obj:', ws.has(obj));
  ws.delete(obj);
  console.log('After delete:', ws.has(obj));
  console.log("\n  ✓ ~30K+ downloads/week!");
}
