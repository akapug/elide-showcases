/**
 * Debounce - Function Debouncing
 *
 * Core features:
 * - Function debouncing
 * - Leading/trailing execution
 * - Configurable delay
 * - Cancel support
 * - Flush support
 * - Immediate execution option
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 15M+ downloads/week
 */

interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): T & { cancel: () => void; flush: () => void; pending: () => boolean } {
  const { leading = false, trailing = true, maxWait } = options;

  let timeout: NodeJS.Timeout | null = null;
  let maxTimeout: NodeJS.Timeout | null = null;
  let result: any;
  let lastArgs: any[] | null = null;
  let lastThis: any = null;
  let lastCallTime: number | null = null;
  let lastInvokeTime = 0;

  const invokeFunc = (time: number) => {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = null;
    lastInvokeTime = time;
    result = func.apply(thisArg, args!);
    return result;
  };

  const leadingEdge = (time: number) => {
    lastInvokeTime = time;
    timeout = setTimeout(timerExpired, wait);

    return leading ? invokeFunc(time) : result;
  };

  const remainingWait = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  };

  const shouldInvoke = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  const timerExpired = () => {
    const time = Date.now();

    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }

    timeout = setTimeout(timerExpired, remainingWait(time));
  };

  const trailingEdge = (time: number) => {
    timeout = null;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }

    lastArgs = lastThis = null;
    return result;
  };

  const debounced = function (this: any, ...args: any[]) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeout === null) {
        return leadingEdge(lastCallTime);
      }

      if (maxWait !== undefined) {
        timeout = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }

    if (timeout === null) {
      timeout = setTimeout(timerExpired, wait);
    }

    return result;
  } as T & { cancel: () => void; flush: () => void; pending: () => boolean };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    if (maxTimeout) {
      clearTimeout(maxTimeout);
    }

    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timeout = maxTimeout = null;
  };

  debounced.flush = () => {
    return timeout === null ? result : trailingEdge(Date.now());
  };

  debounced.pending = () => {
    return timeout !== null;
  };

  return debounced;
}

if (import.meta.url.includes("debounce")) {
  console.log("🎯 Debounce for Elide - Function Debouncing\n");

  console.log("=== Basic Debouncing ===");
  let callCount = 0;

  const debouncedFn = debounce(() => {
    callCount++;
    console.log(`Function called: ${callCount} at ${Date.now()}`);
  }, 300);

  // Rapid calls - only the last one will execute
  for (let i = 0; i < 5; i++) {
    debouncedFn();
  }

  setTimeout(() => {
    console.log(`Total calls executed: ${callCount} out of 5 attempts`);

    console.log("\n=== Search Input Simulation ===");
    let searchCalls = 0;
    let apiCalls = 0;

    const search = debounce((query: string) => {
      apiCalls++;
      console.log(`API call #${apiCalls}: Searching for "${query}"`);
    }, 200);

    const queries = ['h', 'he', 'hel', 'hell', 'hello'];
    queries.forEach((q, i) => {
      searchCalls++;
      setTimeout(() => search(q), i * 50);
    });

    setTimeout(() => {
      console.log(`Keystrokes: ${searchCalls}, API calls: ${apiCalls}`);

      console.log("\n=== Leading Edge ===");
      let leadingCount = 0;

      const leadingDebounce = debounce(() => {
        leadingCount++;
        console.log(`Leading edge call: ${leadingCount}`);
      }, 200, { leading: true, trailing: false });

      leadingDebounce();
      leadingDebounce();
      leadingDebounce();

      setTimeout(() => {
        console.log("Leading calls executed:", leadingCount);

        console.log("\n=== Max Wait ===");
        let maxWaitCalls = 0;

        const maxWaitDebounce = debounce(() => {
          maxWaitCalls++;
          console.log(`Max wait call: ${maxWaitCalls}`);
        }, 100, { maxWait: 300 });

        // Call every 50ms for 500ms - should invoke at least once due to maxWait
        const interval = setInterval(() => {
          maxWaitDebounce();
        }, 50);

        setTimeout(() => {
          clearInterval(interval);
          console.log("Max wait calls:", maxWaitCalls);

          console.log("\n=== Pending Status ===");
          const pendingFn = debounce(() => {
            console.log("Executed");
          }, 100);

          console.log("Pending before call:", pendingFn.pending());
          pendingFn();
          console.log("Pending after call:", pendingFn.pending());

          setTimeout(() => {
            console.log("Pending after execution:", pendingFn.pending());

            console.log();
            console.log("✅ Use Cases: Search input, Form validation, Window resize");
            console.log("🚀 15M+ npm downloads/week - Zero dependencies - Polyglot-ready");
          }, 150);
        }, 500);
      }, 300);
    }, 500);
  }, 400);
}

export default debounce;
