/**
 * Immediate - setImmediate Polyfill
 *
 * Cross-platform setImmediate implementation.
 * **POLYGLOT SHOWCASE**: One setImmediate for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/immediate (~2M+ downloads/week)
 */

export function setImmediate(callback: (...args: any[]) => void, ...args: any[]): any {
  if (typeof globalThis.setImmediate === 'function') {
    return globalThis.setImmediate(callback, ...args);
  }
  return setTimeout(callback, 0, ...args);
}

export function clearImmediate(id: any): void {
  if (typeof globalThis.clearImmediate === 'function') {
    globalThis.clearImmediate(id);
  } else {
    clearTimeout(id);
  }
}

export default { setImmediate, clearImmediate };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚡ Immediate - setImmediate for Elide (POLYGLOT!)\n");
  
  console.log("Sync 1");
  setImmediate(() => console.log("Immediate 1"));
  setImmediate(() => console.log("Immediate 2"));
  console.log("Sync 2");
  
  setTimeout(() => {
    console.log("\n🌐 Works in all languages via Elide!");
    console.log("🚀 ~2M+ downloads/week on npm");
  }, 10);
}
