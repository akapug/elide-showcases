/**
 * caller - Get the caller of a function
 * Based on https://www.npmjs.com/package/caller (~40M+ downloads/week)
 *
 * Features:
 * - Get caller file path
 * - Depth-based lookup
 * - Simple API
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Easy caller detection
 */

function caller(depth: number = 0): string | undefined {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  let fileName: string | undefined;

  Error.prepareStackTrace = (_, stack) => {
    const target = stack[depth + 2];
    fileName = target?.getFileName?.();
    return stack;
  };

  const error = new Error();
  error.stack;

  Error.prepareStackTrace = originalPrepareStackTrace;

  // Fallback if prepareStackTrace doesn't work
  if (!fileName) {
    const stack = new Error().stack || '';
    const lines = stack.split('\n');
    const targetLine = lines[depth + 2];

    if (targetLine) {
      const match = targetLine.match(/\((.+?):\d+:\d+\)/) ||
                    targetLine.match(/at\s+(.+?):\d+:\d+/);
      if (match) {
        fileName = match[1];
      }
    }
  }

  return fileName;
}

export default caller;

// Self-test
if (import.meta.url.includes("elide-caller.ts")) {
  console.log("✅ caller - Get Function Caller (POLYGLOT!)\n");

  function inner() {
    const callerFile = caller();
    console.log('Called from:', callerFile);
    return callerFile;
  }

  function outer() {
    return inner();
  }

  outer();

  console.log("\n🚀 ~40M+ downloads/week | Easy caller detection\n");
}
