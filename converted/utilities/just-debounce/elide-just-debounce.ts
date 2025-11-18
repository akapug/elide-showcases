/**
 * Just Debounce - Function Debouncing Utility
 *
 * Debounce function calls - delay execution until after wait time has elapsed.
 * **POLYGLOT SHOWCASE**: One debounce utility for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/just-debounce (~50K+ downloads/week)
 *
 * Features:
 * - Simple debounce implementation
 * - Configurable wait time
 * - Leading and trailing edge execution
 * - Immediate execution option
 * - Cancel pending invocations
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need debouncing
 * - ONE implementation works everywhere on Elide
 * - Consistent behavior across languages
 * - Share debounce utilities across your stack
 *
 * Use cases:
 * - Search input (wait for user to finish typing)
 * - Window resize handlers (throttle expensive operations)
 * - API call rate limiting (avoid excessive requests)
 * - Auto-save functionality (save after user stops typing)
 *
 * Package has ~50K+ downloads/week on npm - essential utility!
 */

export interface DebounceOptions {
  /** Execute on the leading edge instead of trailing */
  leading?: boolean;
  /** Execute on the trailing edge (default: true) */
  trailing?: boolean;
}

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): void;
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 0,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  let timeoutId: any;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: any;
  let result: any;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  const { leading = false, trailing = true } = options;

  function invokeFunc(time: number) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args!);
    return result;
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - lastCallTime!;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return timeWaiting;
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number) {
    timeoutId = undefined;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timeoutId = undefined;
  }

  function flush() {
    return timeoutId === undefined ? result : trailingEdge(Date.now());
  }

  function debounced(this: any, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(lastCallTime);
      }
    }
    if (timeoutId === undefined) {
      timeoutId = setTimeout(timerExpired, wait);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced as DebouncedFunction<T>;
}

export default debounce;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⏱️  Just Debounce - Function Debouncing for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Debounce ===");
  let callCount = 0;
  const debouncedLog = debounce(() => {
    callCount++;
    console.log(`Debounced function called! (Count: ${callCount})`);
  }, 100);

  console.log("Calling function 5 times rapidly...");
  debouncedLog();
  debouncedLog();
  debouncedLog();
  debouncedLog();
  debouncedLog();

  setTimeout(() => {
    console.log("Wait 150ms... function should execute once\n");

    console.log("=== Example 2: Search Input Simulation ===");
    let searchCount = 0;
    const search = debounce((query: string) => {
      searchCount++;
      console.log(`Searching for: "${query}" (Search #${searchCount})`);
    }, 300);

    console.log("User typing 'hello'...");
    search("h");
    setTimeout(() => search("he"), 50);
    setTimeout(() => search("hel"), 100);
    setTimeout(() => search("hell"), 150);
    setTimeout(() => search("hello"), 200);

    setTimeout(() => {
      console.log("Wait 500ms... search executes once with 'hello'\n");

      console.log("=== Example 3: Leading Edge Execution ===");
      const leadingDebounce = debounce((msg: string) => {
        console.log(`Leading edge: ${msg}`);
      }, 100, { leading: true, trailing: false });

      leadingDebounce("First call - executes immediately");
      leadingDebounce("Second call - ignored");
      leadingDebounce("Third call - ignored");

      setTimeout(() => {
        console.log("\n=== Example 4: Cancel Pending Calls ===");
        let cancelCount = 0;
        const cancellable = debounce(() => {
          cancelCount++;
          console.log(`This should not execute (Count: ${cancelCount})`);
        }, 200);

        cancellable();
        cancellable();
        console.log("Calling debounced function twice...");
        console.log("Cancelling before execution...");
        cancellable.cancel();

        setTimeout(() => {
          console.log("Function was cancelled - did not execute\n");

          console.log("=== Example 5: Flush Pending Calls ===");
          const flushable = debounce((value: number) => {
            console.log(`Flushed with value: ${value}`);
          }, 500);

          flushable(42);
          console.log("Calling with value 42, wait time: 500ms");
          console.log("Flushing immediately instead of waiting...");
          flushable.flush();

          setTimeout(() => {
            console.log("\n=== Example 6: Auto-save Simulation ===");
            let saveCount = 0;
            const autoSave = debounce((content: string) => {
              saveCount++;
              console.log(`Auto-saving document... (Save #${saveCount})`);
              console.log(`Content: "${content}"`);
            }, 1000);

            console.log("User typing...");
            autoSave("The quick");
            setTimeout(() => autoSave("The quick brown"), 200);
            setTimeout(() => autoSave("The quick brown fox"), 400);
            setTimeout(() => autoSave("The quick brown fox jumps"), 600);

            setTimeout(() => {
              console.log("\n=== POLYGLOT Use Case ===");
              console.log("🌐 Same debounce utility works in:");
              console.log("  • JavaScript/TypeScript");
              console.log("  • Python (via Elide)");
              console.log("  • Ruby (via Elide)");
              console.log("  • Java (via Elide)");
              console.log("\nBenefits:");
              console.log("  ✓ One debounce implementation, all languages");
              console.log("  ✓ Consistent debouncing behavior everywhere");
              console.log("  ✓ Share utilities across your stack");
              console.log("  ✓ No need for language-specific implementations");
              console.log("\n✅ Use Cases:");
              console.log("- Search inputs (wait for typing to finish)");
              console.log("- Window resize handlers");
              console.log("- API rate limiting");
              console.log("- Auto-save functionality");
              console.log("- Form validation");
              console.log("- Scroll event handlers");
              console.log("\n🚀 Performance:");
              console.log("- Zero dependencies");
              console.log("- Minimal memory footprint");
              console.log("- ~50K+ downloads/week on npm");
            }, 1200);
          }, 100);
        }, 300);
      }, 150);
    }, 500);
  }, 150);
}
