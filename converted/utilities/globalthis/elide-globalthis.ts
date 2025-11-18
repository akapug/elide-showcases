/**
 * globalThis Polyfill
 *
 * ES2020 globalThis polyfill.
 * **POLYGLOT SHOWCASE**: globalThis for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/globalthis (~2M+ downloads/week)
 */

export function getGlobalThis(): typeof globalThis {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof self !== 'undefined') return self as any;
  if (typeof window !== 'undefined') return window as any;
  if (typeof global !== 'undefined') return global as any;
  return Function('return this')();
}

const globalThisPolyfill = getGlobalThis();

if (typeof (globalThis as any) === 'undefined') {
  (getGlobalThis() as any).globalThis = getGlobalThis();
}

export default globalThisPolyfill;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🌍 globalThis Polyfill (POLYGLOT!)\n");
  
  const global = getGlobalThis();
  console.log('globalThis:', typeof global);
  console.log('Has Object:', 'Object' in global);
  console.log('Has Array:', 'Array' in global);
  console.log("\n  ✓ ~2M+ downloads/week!");
}
