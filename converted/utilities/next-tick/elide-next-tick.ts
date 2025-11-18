/**
 * Next Tick - Next Tick Scheduling
 *
 * Schedule callbacks for next event loop tick.
 * **POLYGLOT SHOWCASE**: One next-tick for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/next-tick (~100K+ downloads/week)
 */

export function nextTick(callback: (...args: any[]) => void, ...args: any[]): void {
  if (typeof process !== 'undefined' && process.nextTick) {
    process.nextTick(() => callback(...args));
  } else {
    setTimeout(() => callback(...args), 0);
  }
}

export default nextTick;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⏭️  Next Tick - Next Tick Scheduling for Elide (POLYGLOT!)\n");
  
  console.log("Sync 1");
  nextTick(() => console.log("Next tick 1"));
  nextTick(() => console.log("Next tick 2"));
  console.log("Sync 2");
  
  setTimeout(() => {
    console.log("\n🌐 Works in all languages via Elide!");
    console.log("🚀 ~100K+ downloads/week on npm");
  }, 10);
}
