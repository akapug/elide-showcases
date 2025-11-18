/**
 * Timeout AbortController - Automatic Timeout Aborts
 *
 * AbortController with automatic timeout.
 * **POLYGLOT SHOWCASE**: One timeout controller for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/timeout-abort-controller (~100K+ downloads/week)
 *
 * Features:
 * - Automatic timeouts
 * - AbortController integration
 * - Fetch API compatible
 * - Clearable timeouts
 *
 * Package has ~100K+ downloads/week on npm!
 */

export class TimeoutAbortController {
  public readonly signal: AbortSignal;
  private controller: AbortController;
  private timeoutId?: any;

  constructor(timeout: number) {
    this.controller = new AbortController();
    this.signal = this.controller.signal;

    this.timeoutId = setTimeout(() => {
      this.controller.abort();
    }, timeout);
  }

  abort(): void {
    this.clear();
    this.controller.abort();
  }

  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }
}

export default TimeoutAbortController;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⏰ Timeout AbortController - Automatic Timeouts (POLYGLOT!)\n");

  console.log("=== Example 1: Auto Timeout ===");
  const controller = new TimeoutAbortController(1000);

  controller.signal.addEventListener("abort", () => {
    console.log("Request timed out!");
  });

  await new Promise(resolve => setTimeout(resolve, 1100));

  console.log("\n=== Example 2: Clear Before Timeout ===");
  const controller2 = new TimeoutAbortController(2000);
  console.log("Created controller with 2s timeout");

  await new Promise(resolve => setTimeout(resolve, 500));
  controller2.clear();
  console.log("Cleared timeout");

  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log("No abort fired!");

  console.log("\n✅ Automatic timeout management!");
}
