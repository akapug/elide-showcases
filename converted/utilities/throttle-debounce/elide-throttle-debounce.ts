/**
 * Throttle Debounce - Function Rate Control Utilities
 *
 * Throttle and debounce functions for rate control.
 * **POLYGLOT SHOWCASE**: One throttle/debounce lib for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/throttle-debounce (~500K+ downloads/week)
 *
 * Features:
 * - Throttle functions (limit execution rate)
 * - Debounce functions (delay execution)
 * - Leading/trailing edge control
 * - Cancelable execution
 * - TypeScript native
 *
 * Package has ~500K+ downloads/week on npm!
 */

interface ThrottleOptions {
  noTrailing?: boolean;
  noLeading?: boolean;
  debounceMode?: boolean;
}

export function throttle<T extends (...args: any[]) => any>(
  delay: number,
  callback: T,
  options: ThrottleOptions = {}
): T & { cancel: () => void } {
  const { noTrailing = false, noLeading = false, debounceMode = false } = options;

  let timeoutID: any;
  let cancelled = false;
  let lastExec = 0;

  function wrapper(this: any, ...args: any[]) {
    if (cancelled) return;

    const self = this;
    const elapsed = Date.now() - lastExec;

    function exec() {
      lastExec = Date.now();
      callback.apply(self, args);
    }

    function clear() {
      timeoutID = undefined;
    }

    if (debounceMode && !timeoutID) {
      exec();
    }

    if (timeoutID) {
      clearTimeout(timeoutID);
    }

    if (debounceMode === undefined && elapsed > delay) {
      if (noLeading) {
        lastExec = Date.now();
        if (!noTrailing) {
          timeoutID = setTimeout(debounceMode ? clear : exec, delay);
        }
      } else {
        exec();
      }
    } else if (noTrailing !== true) {
      timeoutID = setTimeout(
        debounceMode ? clear : exec,
        debounceMode === undefined ? delay - elapsed : delay
      );
    }
  }

  wrapper.cancel = function () {
    if (timeoutID) {
      clearTimeout(timeoutID);
    }
    cancelled = true;
  };

  return wrapper as T & { cancel: () => void };
}

export function debounce<T extends (...args: any[]) => any>(
  delay: number,
  callback: T,
  options: { atBegin?: boolean } = {}
): T & { cancel: () => void } {
  return throttle(delay, callback, { debounceMode: options.atBegin !== true });
}

export default { throttle, debounce };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⏱️  Throttle Debounce - Function Rate Control (POLYGLOT!)\n");

  console.log("=== Example 1: Throttle Function ===");
  let throttleCount = 0;
  const throttled = throttle(1000, () => {
    throttleCount++;
    console.log(`Throttled execution ${throttleCount}`);
  });

  console.log("Calling throttled function 5 times rapidly:");
  for (let i = 0; i < 5; i++) {
    throttled();
  }

  await new Promise(resolve => setTimeout(resolve, 1100));
  throttled();
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log();
  console.log("=== Example 2: Debounce Function ===");
  let debounceCount = 0;
  const debounced = debounce(500, (msg: string) => {
    debounceCount++;
    console.log(`Debounced execution ${debounceCount}: ${msg}`);
  });

  console.log("Calling debounced function 5 times rapidly:");
  debounced("call 1");
  debounced("call 2");
  debounced("call 3");
  debounced("call 4");
  debounced("call 5");

  await new Promise(resolve => setTimeout(resolve, 600));

  console.log();
  console.log("=== Example 3: Search Input Debounce ===");
  const searchAPI = debounce(300, async (query: string) => {
    console.log(`Searching for: "${query}"`);
  });

  console.log("Simulating search input:");
  searchAPI("h");
  await new Promise(resolve => setTimeout(resolve, 50));
  searchAPI("he");
  await new Promise(resolve => setTimeout(resolve, 50));
  searchAPI("hel");
  await new Promise(resolve => setTimeout(resolve, 50));
  searchAPI("hell");
  await new Promise(resolve => setTimeout(resolve, 50));
  searchAPI("hello");

  await new Promise(resolve => setTimeout(resolve, 400));

  console.log();
  console.log("=== Example 4: Window Resize Throttle ===");
  const handleResize = throttle(200, () => {
    console.log(`Window resized at ${new Date().toISOString()}`);
  });

  console.log("Simulating 5 resize events:");
  for (let i = 0; i < 5; i++) {
    handleResize();
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  await new Promise(resolve => setTimeout(resolve, 300));

  console.log();
  console.log("=== Example 5: Cancel Execution ===");
  const cancelable = debounce(500, () => {
    console.log("This should not execute");
  });

  cancelable();
  console.log("Called debounced function");
  await new Promise(resolve => setTimeout(resolve, 200));
  cancelable.cancel();
  console.log("Canceled before execution");

  await new Promise(resolve => setTimeout(resolve, 400));

  console.log();
  console.log("✅ Use Cases:");
  console.log("- Search input (debounce API calls)");
  console.log("- Window resize (throttle event handlers)");
  console.log("- Scroll events (throttle updates)");
  console.log("- Button clicks (debounce form submissions)");
  console.log("- Auto-save (debounce save operations)");
  console.log();
  console.log("~500K+ downloads/week on npm!");
}
