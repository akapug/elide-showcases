/**
 * why-is-node-running - Debug why Node is still running
 * Based on https://www.npmjs.com/package/why-is-node-running (~3M+ downloads/week)
 *
 * Features:
 * - Detect active handles
 * - Track timers and listeners
 * - Debug hanging processes
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Process debugging made easy
 */

interface ActiveHandle {
  type: string;
  stack?: string;
}

function whyIsNodeRunning(logger: (msg: string) => void = console.log): void {
  const handles: ActiveHandle[] = [];

  // Check for active timers
  if (typeof process !== 'undefined' && (process as any)._getActiveHandles) {
    const activeHandles = (process as any)._getActiveHandles();
    handles.push(
      ...activeHandles.map((h: any) => ({
        type: h.constructor?.name || 'Unknown',
        stack: new Error().stack
      }))
    );
  }

  // Check for active requests
  if (typeof process !== 'undefined' && (process as any)._getActiveRequests) {
    const activeRequests = (process as any)._getActiveRequests();
    handles.push(
      ...activeRequests.map((r: any) => ({
        type: r.constructor?.name || 'Request',
        stack: new Error().stack
      }))
    );
  }

  if (handles.length === 0) {
    logger('No active handles found. Node should exit soon.');
    return;
  }

  logger(`\n=== WHY IS NODE RUNNING? ===\n`);
  logger(`Found ${handles.length} active handle(s):\n`);

  const grouped = handles.reduce((acc, handle) => {
    acc[handle.type] = (acc[handle.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  for (const [type, count] of Object.entries(grouped)) {
    logger(`- ${type}: ${count}`);
  }

  logger('\nThese handles are preventing Node from exiting.\n');
}

export default whyIsNodeRunning;

// Self-test
if (import.meta.url.includes("elide-why-is-node-running.ts")) {
  console.log("✅ why-is-node-running - Debug Hanging Processes (POLYGLOT!)\n");

  // Create a timer to demonstrate
  const timer = setTimeout(() => {
    console.log('Timer executed');
  }, 100000);

  whyIsNodeRunning();

  // Clean up
  clearTimeout(timer);

  console.log("\n🚀 ~3M+ downloads/week | Debug hanging Node processes\n");
}
