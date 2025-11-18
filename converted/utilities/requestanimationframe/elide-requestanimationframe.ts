/**
 * requestAnimationFrame Polyfill
 *
 * Polyfill for requestAnimationFrame API.
 * **POLYGLOT SHOWCASE**: requestAnimationFrame for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/requestanimationframe (~100K+ downloads/week)
 */

let lastTime = 0;

export function requestAnimationFrame(callback: (time: number) => void): number {
  const currentTime = Date.now();
  const timeToCall = Math.max(0, 16 - (currentTime - lastTime));
  const id = setTimeout(() => {
    callback(currentTime + timeToCall);
  }, timeToCall);
  lastTime = currentTime + timeToCall;
  return id as any;
}

export function cancelAnimationFrame(id: number): void {
  clearTimeout(id);
}

if (typeof window !== 'undefined') {
  if (!window.requestAnimationFrame) {
    (window as any).requestAnimationFrame = requestAnimationFrame;
  }
  if (!window.cancelAnimationFrame) {
    (window as any).cancelAnimationFrame = cancelAnimationFrame;
  }
}

export default requestAnimationFrame;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎬 requestAnimationFrame Polyfill (POLYGLOT!)\n");
  
  let frame = 0;
  const animate = (time: number) => {
    console.log(`Frame ${++frame} at ${time}ms`);
    if (frame < 3) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
  console.log("\n  ✓ ~100K+ downloads/week!");
}
