/**
 * callsites - Get Call Sites
 *
 * Get call sites from the V8 stack trace API.
 * **POLYGLOT SHOWCASE**: Stack traces for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/callsites (~5M+ downloads/week)
 *
 * Features:
 * - Get call stack
 * - Stack trace API
 * - Caller information
 * - Debug support
 * - Zero dependencies
 *
 * Package has ~5M+ downloads/week on npm!
 */

export interface CallSite {
  getFileName(): string | null;
  getLineNumber(): number | null;
  getColumnNumber(): number | null;
  getFunctionName(): string | null;
  getTypeName(): string | null;
}

export function callsites(): CallSite[] {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  const sites: CallSite[] = [];

  try {
    Error.prepareStackTrace = (_, stack) => stack;
    const stack = new Error().stack as unknown as CallSite[];

    // Skip first 2 frames (this function and Error constructor)
    for (let i = 2; i < Math.min(stack.length, 12); i++) {
      sites.push(stack[i]);
    }
  } finally {
    Error.prepareStackTrace = originalPrepareStackTrace;
  }

  return sites;
}

export default callsites;

if (import.meta.url.includes("elide-callsites.ts")) {
  console.log("📞 callsites - Call Stack Info for Elide (POLYGLOT!)\n");

  function exampleFunction() {
    const sites = callsites();
    console.log(`Call stack depth: ${sites.length}`);

    for (let i = 0; i < Math.min(sites.length, 3); i++) {
      const site = sites[i];
      console.log(`  [${i}] ${site.getFunctionName?.()} at ${site.getFileName?.()}:${site.getLineNumber?.()}`);
    }
  }

  exampleFunction();

  console.log("\n✅ Use Cases: Stack traces, debugging, error handling, caller detection");
  console.log("🚀 ~5M+ downloads/week on npm!");
}
