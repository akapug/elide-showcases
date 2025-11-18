/**
 * Just Throttle - Function Throttling Utility
 *
 * Throttle function calls - limit execution to once per specified time period.
 * **POLYGLOT SHOWCASE**: One throttle utility for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/just-throttle (~30K+ downloads/week)
 *
 * Features:
 * - Simple throttle implementation
 * - Configurable wait time
 * - Leading and trailing edge execution
 * - Guaranteed execution rate
 * - Cancel pending invocations
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need throttling
 * - ONE implementation works everywhere on Elide
 * - Consistent behavior across languages
 * - Share throttle utilities across your stack
 *
 * Use cases:
 * - Scroll event handlers (limit processing rate)
 * - Mouse move tracking (reduce event frequency)
 * - API rate limiting (enforce request limits)
 * - Button click prevention (prevent double-clicks)
 *
 * Package has ~30K+ downloads/week on npm - essential utility!
 */

export interface ThrottleOptions {
  /** Execute on the leading edge (default: true) */
  leading?: boolean;
  /** Execute on the trailing edge (default: true) */
  trailing?: boolean;
}

export interface ThrottledFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel(): void;
}

/**
 * Creates a throttled function that only invokes func at most once per wait milliseconds.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 0,
  options: ThrottleOptions = {}
): ThrottledFunction<T> {
  let timeoutId: any;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: any;
  let result: ReturnType<T> | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  const { leading = true, trailing = true } = options;

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
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastInvoke;

    return Math.max(timeWaiting, 0);
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastInvoke >= wait ||
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

  function throttled(this: any, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(lastCallTime);
      }
      timeoutId = setTimeout(timerExpired, wait);
      return trailing ? invokeFunc(lastCallTime) : result;
    }
    if (timeoutId === undefined) {
      timeoutId = setTimeout(timerExpired, wait);
    }
    return result;
  }

  throttled.cancel = cancel;

  return throttled as ThrottledFunction<T>;
}

export default throttle;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⏱️  Just Throttle - Function Throttling for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Throttle ===");
  let callCount = 0;
  const throttledLog = throttle(() => {
    callCount++;
    console.log(`Throttled function called! (Count: ${callCount})`);
  }, 100);

  console.log("Calling function 10 times rapidly...");
  for (let i = 0; i < 10; i++) {
    throttledLog();
  }
  console.log("Only first call executes immediately, rest are throttled\n");

  setTimeout(() => {
    console.log("=== Example 2: Scroll Handler Simulation ===");
    let scrollCount = 0;
    const handleScroll = throttle((position: number) => {
      scrollCount++;
      console.log(`Scroll position: ${position}px (Handler #${scrollCount})`);
    }, 200);

    console.log("Simulating scroll events every 50ms...");
    let position = 0;
    const scrollInterval = setInterval(() => {
      position += 100;
      handleScroll(position);
      if (position >= 1000) {
        clearInterval(scrollInterval);
      }
    }, 50);

    setTimeout(() => {
      console.log("\n=== Example 3: Leading Edge Only ===");
      const leadingOnly = throttle((msg: string) => {
        console.log(`Leading only: ${msg}`);
      }, 150, { leading: true, trailing: false });

      console.log("Calling 5 times...");
      leadingOnly("Call 1");
      leadingOnly("Call 2");
      leadingOnly("Call 3");
      leadingOnly("Call 4");
      leadingOnly("Call 5");

      setTimeout(() => {
        console.log("\n=== Example 4: Trailing Edge Only ===");
        const trailingOnly = throttle((msg: string) => {
          console.log(`Trailing only: ${msg}`);
        }, 150, { leading: false, trailing: true });

        console.log("Calling 5 times...");
        trailingOnly("Call 1");
        trailingOnly("Call 2");
        trailingOnly("Call 3");
        trailingOnly("Call 4");
        trailingOnly("Call 5");

        setTimeout(() => {
          console.log("\n=== Example 5: API Rate Limiting ===");
          let apiCallCount = 0;
          const makeApiCall = throttle((endpoint: string) => {
            apiCallCount++;
            console.log(`API Call #${apiCallCount} to ${endpoint}`);
          }, 1000);

          console.log("Making 5 API calls rapidly...");
          makeApiCall("/api/users");
          makeApiCall("/api/users");
          makeApiCall("/api/users");
          makeApiCall("/api/users");
          makeApiCall("/api/users");
          console.log("Throttled to max 1 call per second");

          setTimeout(() => {
            console.log("\n=== Example 6: Button Click Prevention ===");
            let clickCount = 0;
            const handleClick = throttle(() => {
              clickCount++;
              console.log(`Button clicked! (Click #${clickCount})`);
            }, 500);

            console.log("Simulating rapid button clicks...");
            handleClick();
            setTimeout(() => handleClick(), 100);
            setTimeout(() => handleClick(), 200);
            setTimeout(() => handleClick(), 300);
            setTimeout(() => handleClick(), 400);

            setTimeout(() => {
              console.log("\n=== POLYGLOT Use Case ===");
              console.log("🌐 Same throttle utility works in:");
              console.log("  • JavaScript/TypeScript");
              console.log("  • Python (via Elide)");
              console.log("  • Ruby (via Elide)");
              console.log("  • Java (via Elide)");
              console.log("\nBenefits:");
              console.log("  ✓ One throttle implementation, all languages");
              console.log("  ✓ Consistent rate limiting everywhere");
              console.log("  ✓ Share utilities across your stack");
              console.log("  ✓ No need for language-specific implementations");
              console.log("\n✅ Use Cases:");
              console.log("- Scroll event handlers");
              console.log("- Mouse move tracking");
              console.log("- API rate limiting");
              console.log("- Button click prevention");
              console.log("- Window resize handlers");
              console.log("- Real-time data updates");
              console.log("\n🚀 Performance:");
              console.log("- Zero dependencies");
              console.log("- Minimal overhead");
              console.log("- ~30K+ downloads/week on npm");
            }, 600);
          }, 1100);
        }, 200);
      }, 200);
    }, 300);
  }, 200);
}
