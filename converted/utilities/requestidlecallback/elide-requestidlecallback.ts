/**
 * requestIdleCallback Polyfill
 *
 * Polyfill for requestIdleCallback API.
 * **POLYGLOT SHOWCASE**: requestIdleCallback for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/requestidlecallback (~100K+ downloads/week)
 */

export interface IdleDeadline {
  didTimeout: boolean;
  timeRemaining(): number;
}

export interface IdleRequestOptions {
  timeout?: number;
}

export function requestIdleCallback(
  callback: (deadline: IdleDeadline) => void,
  options?: IdleRequestOptions
): number {
  const start = Date.now();
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining() {
        return Math.max(0, 50 - (Date.now() - start));
      }
    });
  }, 1) as any;
}

export function cancelIdleCallback(handle: number): void {
  clearTimeout(handle);
}

if (typeof window !== 'undefined') {
  if (!window.requestIdleCallback) {
    (window as any).requestIdleCallback = requestIdleCallback;
  }
  if (!window.cancelIdleCallback) {
    (window as any).cancelIdleCallback = cancelIdleCallback;
  }
}

export default requestIdleCallback;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⏱️ requestIdleCallback Polyfill (POLYGLOT!)\n");
  
  requestIdleCallback((deadline) => {
    console.log('Idle callback executed');
    console.log('Time remaining:', deadline.timeRemaining(), 'ms');
    console.log('Did timeout:', deadline.didTimeout);
  });
  
  console.log("\n  ✓ ~100K+ downloads/week!");
}
