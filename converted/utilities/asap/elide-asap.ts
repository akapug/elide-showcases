/**
 * ASAP - As Soon As Possible Execution
 *
 * Execute callbacks as soon as possible in a future turn.
 * **POLYGLOT SHOWCASE**: One ASAP for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/asap (~2M+ downloads/week)
 */

const queue: Array<() => void> = [];
let flushing = false;

function flush(): void {
  flushing = true;
  while (queue.length) {
    const callback = queue.shift()!;
    try {
      callback();
    } catch (error) {
      if (queue.length) {
        requestFlush();
      }
      throw error;
    }
  }
  flushing = false;
}

function requestFlush(): void {
  if (typeof globalThis.queueMicrotask === 'function') {
    globalThis.queueMicrotask(flush);
  } else {
    Promise.resolve().then(flush);
  }
}

export function asap(callback: () => void): void {
  queue.push(callback);
  if (!flushing) {
    requestFlush();
  }
}

export default asap;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🚀 ASAP - As Soon As Possible for Elide (POLYGLOT!)\n");
  
  console.log("Sync 1");
  asap(() => console.log("ASAP 1"));
  asap(() => console.log("ASAP 2"));
  console.log("Sync 2");
  
  setTimeout(() => {
    console.log("\n🌐 Works in all languages via Elide!");
    console.log("🚀 ~2M+ downloads/week on npm");
  }, 10);
}
