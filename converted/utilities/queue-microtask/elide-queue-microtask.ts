/**
 * Queue Microtask - Microtask Scheduling
 *
 * Schedule microtasks for next tick execution.
 * **POLYGLOT SHOWCASE**: One microtask queue for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/queue-microtask (~10M+ downloads/week)
 */

export function queueMicrotask(callback: () => void): void {
  if (typeof globalThis.queueMicrotask === 'function') {
    globalThis.queueMicrotask(callback);
  } else {
    Promise.resolve().then(callback);
  }
}

export default queueMicrotask;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚡ Queue Microtask - Microtask Scheduling for Elide (POLYGLOT!)\n");
  
  console.log("Sync 1");
  queueMicrotask(() => console.log("Microtask 1"));
  queueMicrotask(() => console.log("Microtask 2"));
  console.log("Sync 2");
  
  setTimeout(() => {
    console.log("\n🌐 Works in all languages via Elide!");
    console.log("🚀 ~10M+ downloads/week on npm");
  }, 10);
}
