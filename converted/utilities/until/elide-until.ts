/**
 * Promise Control Flow - Async Control Flow Utilities
 *
 * Control flow utilities for promise-based operations.
 * **POLYGLOT SHOWCASE**: One control flow library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/until
 *
 * Features:
 * - Promise control flow
 * - Conditional loops
 * - Polling support
 * - Retry logic
 * - Timeout handling
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Works across all Elide languages
 * - Consistent async patterns
 * - Share control flow logic
 * - One implementation everywhere
 *
 * Package is widely used on npm!
 */

export async function pWhilst<T>(
  condition: () => boolean | Promise<boolean>,
  action: () => Promise<T>
): Promise<void> {
  while (await condition()) {
    await action();
  }
}

export async function pDoWhilst<T>(
  action: () => Promise<T>,
  condition: () => boolean | Promise<boolean>
): Promise<void> {
  do {
    await action();
  } while (await condition());
}

export async function pTimes<T>(
  n: number,
  action: (i: number) => Promise<T>
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < n; i++) {
    results.push(await action(i));
  }
  return results;
}

export async function pRepeat<T>(
  n: number,
  action: () => Promise<T>
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < n; i++) {
    results.push(await action());
  }
  return results;
}

export async function pForever<T>(
  action: () => Promise<T>
): Promise<never> {
  while (true) {
    await action();
  }
}

export async function until<T>(
  condition: () => boolean | Promise<boolean>,
  options: { interval?: number; timeout?: number } = {}
): Promise<void> {
  const { interval = 100, timeout = Infinity } = options;
  const startTime = Date.now();

  while (!(await condition())) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

export async function waitUntil<T>(
  condition: () => boolean | Promise<boolean>,
  options: { interval?: number; timeout?: number } = {}
): Promise<void> {
  return until(condition, options);
}

export async function poll<T>(
  fn: () => Promise<T>,
  condition: (result: T) => boolean,
  options: { interval?: number; timeout?: number } = {}
): Promise<T> {
  const { interval = 100, timeout = Infinity } = options;
  const startTime = Date.now();

  while (true) {
    const result = await fn();
    if (condition(result)) {
      return result;
    }

    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for poll condition');
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

export class FailOnce {
  private hasFailed = false;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.hasFailed) {
      return fn();
    }

    try {
      return await fn();
    } catch (err) {
      this.hasFailed = true;
      throw err;
    }
  }

  reset(): void {
    this.hasFailed = false;
  }
}

export default {
  pWhilst,
  pDoWhilst,
  pTimes,
  pRepeat,
  pForever,
  until,
  waitUntil,
  poll,
  FailOnce
};

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 Promise Control Flow - Async Utilities (POLYGLOT!)\n");

  (async () => {
    console.log("=== Example 1: pTimes ===");
    await pTimes(3, async (i) => {
      console.log(`Iteration ${i}`);
      return i;
    });
    console.log();

    console.log("=== Example 2: pWhilst ===");
    let count = 0;
    await pWhilst(
      () => count < 3,
      async () => {
        console.log(`Count: ${count++}`);
      }
    );
    console.log();

    console.log("=== Example 3: waitUntil ===");
    let ready = false;
    setTimeout(() => { ready = true; }, 500);
    console.log("Waiting...");
    await waitUntil(() => ready, { interval: 100, timeout: 2000 });
    console.log("Ready!\n");

    console.log("=== Example 4: poll ===");
    let value = 0;
    setTimeout(() => { value = 42; }, 300);
    const result = await poll(
      async () => value,
      (v) => v === 42,
      { interval: 50, timeout: 2000 }
    );
    console.log(`Polled value: ${result}\n`);

    console.log("=== Example 5: POLYGLOT Use Case ===");
    console.log("🌐 Same control flow library works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
  })();
}
