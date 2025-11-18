/**
 * ThrottleIt - Function Throttling
 *
 * Core features:
 * - Function throttling
 * - Leading/trailing execution
 * - Configurable delay
 * - Cancel support
 * - Flush support
 * - Rate limiting
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 3M+ downloads/week
 */

interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: ThrottleOptions = {}
): T & { cancel: () => void; flush: () => void } {
  const { leading = true, trailing = true } = options;

  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  let result: any;
  let args: any[] | null = null;
  let context: any = null;

  const later = () => {
    previous = leading === false ? 0 : Date.now();
    timeout = null;
    if (args) {
      result = func.apply(context, args);
      context = args = null;
    }
  };

  const throttled = function (this: any, ...currentArgs: any[]) {
    const now = Date.now();

    if (!previous && leading === false) {
      previous = now;
    }

    const remaining = wait - (now - previous);
    context = this;
    args = currentArgs;

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      previous = now;
      result = func.apply(context, args);
      context = args = null;
    } else if (!timeout && trailing) {
      timeout = setTimeout(later, remaining);
    }

    return result;
  } as T & { cancel: () => void; flush: () => void };

  throttled.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    previous = 0;
    timeout = context = args = null;
  };

  throttled.flush = () => {
    if (timeout) {
      result = func.apply(context, args!);
      context = args = null;
      clearTimeout(timeout);
      timeout = null;
      previous = Date.now();
    }
  };

  return throttled;
}

// Simple throttle without options
export function throttleIt<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  return throttle(func, wait, { leading: true, trailing: true });
}

if (import.meta.url.includes("throttleit")) {
  console.log("🎯 ThrottleIt for Elide - Function Throttling\n");

  console.log("=== Basic Throttling ===");
  let callCount = 0;

  const throttled = throttle(() => {
    callCount++;
    console.log(`Called: ${callCount} at ${Date.now()}`);
  }, 1000);

  // Rapid calls - only first and last will execute
  for (let i = 0; i < 5; i++) {
    throttled();
  }

  setTimeout(() => {
    console.log(`Total calls executed: ${callCount} out of 5 attempts`);

    console.log("\n=== Scroll Event Simulation ===");
    let scrollCalls = 0;
    let handlerCalls = 0;

    const scrollHandler = throttle(() => {
      handlerCalls++;
      console.log(`Scroll handler: ${handlerCalls}`);
    }, 100);

    const scrollInterval = setInterval(() => {
      scrollCalls++;
      scrollHandler();

      if (scrollCalls >= 20) {
        clearInterval(scrollInterval);
        console.log(`Scroll events: ${scrollCalls}, Handler calls: ${handlerCalls}`);

        console.log("\n=== Leading/Trailing Options ===");
        let leadingCount = 0;
        let trailingCount = 0;

        const leadingOnly = throttle(() => leadingCount++, 100, { leading: true, trailing: false });
        const trailingOnly = throttle(() => trailingCount++, 100, { leading: false, trailing: true });

        for (let i = 0; i < 3; i++) {
          leadingOnly();
          trailingOnly();
        }

        setTimeout(() => {
          console.log("Leading only calls:", leadingCount);
          console.log("Trailing only calls:", trailingCount);

          console.log("\n=== Cancel Example ===");
          const cancellable = throttle(() => {
            console.log("This should not appear");
          }, 1000);

          cancellable();
          cancellable.cancel();
          console.log("Throttled function cancelled");

          console.log();
          console.log("✅ Use Cases: Scroll handlers, Resize handlers, API rate limiting");
          console.log("🚀 3M+ npm downloads/week - Zero dependencies - Polyglot-ready");
        }, 200);
      }
    }, 10);
  }, 1500);
}

export default throttle;
