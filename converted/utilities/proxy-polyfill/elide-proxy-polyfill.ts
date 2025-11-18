/**
 * Proxy Polyfill
 *
 * Polyfill for ES6 Proxy.
 * **POLYGLOT SHOWCASE**: Proxy for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/proxy-polyfill (~100K+ downloads/week)
 */

export function createProxy<T extends object>(target: T, handler: ProxyHandler<T>): T {
  const proxy = Object.create(Object.getPrototypeOf(target));
  
  Object.keys(target).forEach(key => {
    Object.defineProperty(proxy, key, {
      get() {
        return handler.get ? handler.get(target, key, proxy) : (target as any)[key];
      },
      set(value) {
        if (handler.set) {
          return handler.set(target, key, value, proxy);
        }
        (target as any)[key] = value;
        return true;
      }
    });
  });
  
  return proxy;
}

export default createProxy;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🪞 Proxy Polyfill (POLYGLOT!)\n");
  
  const obj = { name: 'Alice', age: 30 };
  const proxy = createProxy(obj, {
    get(target, prop) {
      console.log(`Getting ${String(prop)}`);
      return (target as any)[prop];
    }
  });
  
  console.log(proxy.name);
  console.log("\n  ✓ ~100K+ downloads/week!");
}
