/**
 * Timed Out - Request Timeout Utility
 *
 * Timeout utility for HTTP requests and operations.
 * **POLYGLOT SHOWCASE**: One timeout utility for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/timed-out (~100K+ downloads/week)
 *
 * Features:
 * - Request timeouts
 * - Socket timeouts
 * - Response timeouts
 * - Configurable delays
 *
 * Package has ~100K+ downloads/week on npm!
 */

export interface TimeoutOptions {
  request?: number;
  response?: number;
  socket?: number;
}

export class TimedOutError extends Error {
  public readonly event: string;

  constructor(event: string) {
    super(`Timeout (${event})`);
    this.name = "TimedOutError";
    this.event = event;
  }
}

export function timedOut(options: TimeoutOptions): AbortController {
  const controller = new AbortController();
  const timeouts: any[] = [];

  if (options.request) {
    const timeout = setTimeout(() => {
      controller.abort();
    }, options.request);
    timeouts.push(timeout);
  }

  if (options.socket) {
    const timeout = setTimeout(() => {
      controller.abort();
    }, options.socket);
    timeouts.push(timeout);
  }

  if (options.response) {
    const timeout = setTimeout(() => {
      controller.abort();
    }, options.response);
    timeouts.push(timeout);
  }

  const originalAbort = controller.abort.bind(controller);
  controller.abort = () => {
    timeouts.forEach(clearTimeout);
    originalAbort();
  };

  return controller;
}

export default timedOut;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⏲️  Timed Out - Request Timeout Utility (POLYGLOT!)\n");

  console.log("=== Example: Request Timeout ===");
  const controller = timedOut({
    request: 1000,
    response: 5000
  });

  controller.signal.addEventListener("abort", () => {
    console.log("Request aborted due to timeout!");
  });

  await new Promise(resolve => setTimeout(resolve, 1100));

  console.log("\n✅ Request timeout utilities!");
}
