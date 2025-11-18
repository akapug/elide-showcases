/**
 * RAF - requestAnimationFrame Polyfill
 *
 * Robust requestAnimationFrame polyfill.
 * **POLYGLOT SHOWCASE**: RAF for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/raf (~300K+ downloads/week)
 */

let lastTime = 0;
const vendors = ['webkit', 'moz'];

export function raf(callback: (time: number) => void): number {
  const currentTime = Date.now();
  const timeToCall = Math.max(0, 16.66 - (currentTime - lastTime));
  const id = setTimeout(() => {
    callback(currentTime + timeToCall);
  }, timeToCall);
  lastTime = currentTime + timeToCall;
  return id as any;
}

export namespace raf {
  export function cancel(id: number): void {
    clearTimeout(id);
  }

  export function polyfill(): void {
    if (typeof window !== 'undefined') {
      if (!window.requestAnimationFrame) {
        (window as any).requestAnimationFrame = raf;
      }
      if (!window.cancelAnimationFrame) {
        (window as any).cancelAnimationFrame = cancel;
      }
    }
  }
}

export default raf;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 RAF (requestAnimationFrame) (POLYGLOT!)\n");
  
  let count = 0;
  const loop = (time: number) => {
    console.log(`RAF ${++count} at ${time}ms`);
    if (count < 3) {
      raf(loop);
    }
  };
  
  raf(loop);
  console.log("\n  ✓ ~300K+ downloads/week!");
}
