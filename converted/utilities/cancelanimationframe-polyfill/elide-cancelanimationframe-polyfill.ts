/**
 * cancelAnimationFrame Polyfill
 *
 * Polyfill for cancelAnimationFrame API.
 * **POLYGLOT SHOWCASE**: cancelAnimationFrame for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/cancelanimationframe-polyfill (~10K+ downloads/week)
 */

const activeFrames = new Map<number, number>();

export function cancelAnimationFrame(handle: number): void {
  const timeoutId = activeFrames.get(handle);
  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
    activeFrames.delete(handle);
  }
}

if (typeof window !== 'undefined' && !window.cancelAnimationFrame) {
  (window as any).cancelAnimationFrame = cancelAnimationFrame;
}

export default cancelAnimationFrame;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("❌ cancelAnimationFrame Polyfill (POLYGLOT!)\n");
  
  console.log('cancelAnimationFrame polyfill loaded');
  console.log('Use to cancel animation frames');
  console.log("\n  ✓ ~10K+ downloads/week!");
}
