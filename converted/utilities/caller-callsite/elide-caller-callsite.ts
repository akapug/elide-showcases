/**
 * caller-callsite - Get callsite of the caller function
 * Based on https://www.npmjs.com/package/caller-callsite (~40M+ downloads/week)
 *
 * Features:
 * - Get caller's callsite object
 * - Full stack frame access
 * - Depth support
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Rich caller information
 */

interface CallSite {
  getFileName(): string | null;
  getLineNumber(): number | null;
  getColumnNumber(): number | null;
  getFunctionName(): string | null;
  getTypeName(): string | null;
  getThis(): any;
  isNative(): boolean;
}

function callerCallsite(depth: number = 0): CallSite | undefined {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  let callSite: any;

  Error.prepareStackTrace = (_, stack) => {
    callSite = stack[depth + 2];
    return stack;
  };

  const error = new Error();
  error.stack;

  Error.prepareStackTrace = originalPrepareStackTrace;

  // Fallback implementation
  if (!callSite) {
    const stack = new Error().stack || '';
    const lines = stack.split('\n');
    const targetLine = lines[depth + 2];

    if (targetLine) {
      const match = targetLine.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) ||
                    targetLine.match(/at\s+(.+?):(\d+):(\d+)/);

      if (match) {
        callSite = {
          getFileName: () => match[2] || match[1],
          getLineNumber: () => parseInt(match[3] || match[2]),
          getColumnNumber: () => parseInt(match[4] || match[3]),
          getFunctionName: () => match.length === 5 ? match[1] : null,
          getTypeName: () => null,
          getThis: () => undefined,
          isNative: () => false
        };
      }
    }
  }

  return callSite;
}

export default callerCallsite;

// Self-test
if (import.meta.url.includes("elide-caller-callsite.ts")) {
  console.log("✅ caller-callsite - Caller CallSite Info (POLYGLOT!)\n");

  function inner() {
    const callsite = callerCallsite();
    console.log('Caller file:', callsite?.getFileName());
    console.log('Caller line:', callsite?.getLineNumber());
    console.log('Caller function:', callsite?.getFunctionName());
  }

  function outer() {
    inner();
  }

  outer();

  console.log("\n🚀 ~40M+ downloads/week | Rich caller information\n");
}
