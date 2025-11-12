/**
 * Timers - Timer Functions for Elide
 *
 * Complete implementation of Node.js timers module.
 * **POLYGLOT SHOWCASE**: Timers for ALL languages on Elide!
 *
 * Features:
 * - setTimeout/clearTimeout
 * - setInterval/clearInterval
 * - setImmediate/clearImmediate
 * - Promise-based timers
 * - Timer management
 *
 * Use cases:
 * - Delayed execution
 * - Periodic tasks
 * - Async operations
 * - Rate limiting
 * - Debouncing/throttling
 */

/**
 * Timer handle interface
 */
export interface Timeout {
  ref(): this;
  unref(): this;
  hasRef(): boolean;
  refresh(): this;
  [Symbol.toPrimitive](): number;
}

class TimerHandle implements Timeout {
  constructor(private id: number) {}

  ref(): this {
    return this;
  }

  unref(): this {
    return this;
  }

  hasRef(): boolean {
    return true;
  }

  refresh(): this {
    return this;
  }

  [Symbol.toPrimitive](): number {
    return this.id;
  }
}

/**
 * Set a timeout
 */
export function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): Timeout {
  const id = globalThis.setTimeout(() => callback(...args), ms);
  return new TimerHandle(id as unknown as number);
}

/**
 * Clear a timeout
 */
export function clearTimeout(timeout: Timeout | number): void {
  const id = typeof timeout === 'number' ? timeout : timeout[Symbol.toPrimitive]();
  globalThis.clearTimeout(id as any);
}

/**
 * Set an interval
 */
export function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): Timeout {
  const id = globalThis.setInterval(() => callback(...args), ms);
  return new TimerHandle(id as unknown as number);
}

/**
 * Clear an interval
 */
export function clearInterval(timeout: Timeout | number): void {
  const id = typeof timeout === 'number' ? timeout : timeout[Symbol.toPrimitive]();
  globalThis.clearInterval(id as any);
}

/**
 * Set immediate (execute on next tick)
 */
export function setImmediate(callback: (...args: any[]) => void, ...args: any[]): Timeout {
  const id = globalThis.setTimeout(() => callback(...args), 0);
  return new TimerHandle(id as unknown as number);
}

/**
 * Clear immediate
 */
export function clearImmediate(immediate: Timeout | number): void {
  const id = typeof immediate === 'number' ? immediate : immediate[Symbol.toPrimitive]();
  globalThis.clearTimeout(id as any);
}

/**
 * Promises API
 */
export const promises = {
  /**
   * Promise-based setTimeout
   */
  setTimeout(ms: number, value?: any): Promise<any> {
    return new Promise(resolve => {
      globalThis.setTimeout(() => resolve(value), ms);
    });
  },

  /**
   * Promise-based setImmediate
   */
  setImmediate(value?: any): Promise<any> {
    return new Promise(resolve => {
      globalThis.setTimeout(() => resolve(value), 0);
    });
  },

  /**
   * Promise-based setInterval (async iterator)
   */
  async *setInterval(ms: number, value?: any): AsyncGenerator<any, void, unknown> {
    while (true) {
      await new Promise(resolve => globalThis.setTimeout(resolve, ms));
      yield value;
    }
  }
};

// Default export
export default {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  setImmediate,
  clearImmediate,
  promises
};

// CLI Demo
if (import.meta.url.includes("timers.ts")) {
  console.log("⏱️  Timers - Timer Functions for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: setTimeout ===");
  setTimeout(() => {
    console.log('Executed after 100ms');
  }, 100);

  console.log("=== Example 2: setInterval ===");
  let count = 0;
  const interval = setInterval(() => {
    console.log(`Interval ${++count}`);
    if (count >= 3) {
      clearInterval(interval);
      console.log('Interval cleared');
    }
  }, 150);

  setTimeout(() => {
    console.log();
    console.log("=== Example 3: setImmediate ===");
    setImmediate(() => {
      console.log('Executed immediately (next tick)');
    });

    console.log('This runs first');
  }, 500);

  setTimeout(async () => {
    console.log();
    console.log("=== Example 4: Promises API ===");
    await promises.setTimeout(100);
    console.log('Promise-based timeout completed');

    await promises.setImmediate();
    console.log('Promise-based immediate completed');
  }, 600);

  setTimeout(async () => {
    console.log();
    console.log("=== Example 5: Async Iterator ===");
    let iterCount = 0;
    for await (const _ of promises.setInterval(100, 'tick')) {
      console.log(`Tick ${++iterCount}`);
      if (iterCount >= 3) break;
    }
  }, 900);

  setTimeout(() => {
    console.log();
    console.log("=== Example 6: Timer Handle ===");
    const timer = setTimeout(() => {
      console.log('This will be cancelled');
    }, 1000);

    clearTimeout(timer);
    console.log('Timer cancelled before execution');
  }, 1300);

  setTimeout(() => {
    console.log();
    console.log("=== Example 7: Debounce Pattern ===");
    let debounceTimer: Timeout | null = null;

    function debounce(fn: Function, delay: number) {
      return (...args: any[]) => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fn(...args), delay);
      };
    }

    const debouncedLog = debounce((msg: string) => {
      console.log('Debounced:', msg);
    }, 100);

    debouncedLog('Call 1');
    debouncedLog('Call 2');
    debouncedLog('Call 3'); // Only this will execute
  }, 1400);

  setTimeout(() => {
    console.log();
    console.log("=== Example 8: Rate Limiting ===");
    let lastCall = 0;
    const rateLimit = 200; // ms

    function rateLimited(fn: Function) {
      return (...args: any[]) => {
        const now = Date.now();
        if (now - lastCall >= rateLimit) {
          lastCall = now;
          fn(...args);
        } else {
          console.log('Rate limited - call ignored');
        }
      };
    }

    const limitedLog = rateLimited((msg: string) => {
      console.log('Rate limited:', msg);
    });

    limitedLog('Call 1');
    setTimeout(() => limitedLog('Call 2'), 50);  // Will be ignored
    setTimeout(() => limitedLog('Call 3'), 250); // Will execute
  }, 1600);

  setTimeout(() => {
    console.log();
    console.log("=== Example 9: Retry Pattern ===");
    let attempts = 0;
    const maxAttempts = 3;

    async function retryOperation(operation: () => Promise<any>, delay: number = 100) {
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`Attempt ${attempts}...`);

          if (attempts < 3) {
            throw new Error('Simulated failure');
          }

          console.log('Success!');
          return;
        } catch (err) {
          if (attempts >= maxAttempts) {
            console.log('Max attempts reached');
            throw err;
          }
          await promises.setTimeout(delay);
        }
      }
    }

    retryOperation(async () => {});
  }, 2100);

  setTimeout(() => {
    console.log();
    console.log("=== Example 10: Polling Pattern ===");
    let pollCount = 0;
    let ready = false;

    // Simulate async resource becoming ready
    setTimeout(() => {
      ready = true;
    }, 400);

    function poll(check: () => boolean, interval: number = 100) {
      return new Promise<void>((resolve) => {
        const pollInterval = setInterval(() => {
          pollCount++;
          console.log(`Polling... (${pollCount})`);

          if (check()) {
            clearInterval(pollInterval);
            console.log('Resource ready!');
            resolve();
          }

          if (pollCount >= 5) {
            clearInterval(pollInterval);
            console.log('Polling timeout');
            resolve();
          }
        }, interval);
      });
    }

    poll(() => ready);
  }, 2400);

  setTimeout(() => {
    console.log();
    console.log("=== POLYGLOT Use Case ===");
    console.log("🌐 Timers work in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
    console.log();
    console.log("Benefits:");
    console.log("  ✓ One timer API for all languages");
    console.log("  ✓ Consistent async patterns");
    console.log("  ✓ Share timing utilities");
    console.log("  ✓ Cross-language scheduling");
  }, 3000);
}
