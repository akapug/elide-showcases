/**
 * caller-path - Get the path of the caller module
 * Based on https://www.npmjs.com/package/caller-path (~40M+ downloads/week)
 *
 * Features:
 * - Get caller's file path
 * - Clean path output
 * - Depth support
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Simple caller path detection
 */

function callerPath(depth: number = 0): string | undefined {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  let filePath: string | undefined;

  Error.prepareStackTrace = (_, stack) => {
    const target = stack[depth + 2];
    filePath = target?.getFileName?.();
    return stack;
  };

  const error = new Error();
  error.stack;

  Error.prepareStackTrace = originalPrepareStackTrace;

  // Fallback parsing
  if (!filePath) {
    const stack = new Error().stack || '';
    const lines = stack.split('\n');
    const targetLine = lines[depth + 2];

    if (targetLine) {
      const match = targetLine.match(/\((.+?):\d+:\d+\)/) ||
                    targetLine.match(/at\s+(.+?):\d+:\d+/);
      if (match) {
        filePath = match[1];
      }
    }
  }

  return filePath;
}

export default callerPath;

// Self-test
if (import.meta.url.includes("elide-caller-path.ts")) {
  console.log("✅ caller-path - Caller Path Detection (POLYGLOT!)\n");

  function inner() {
    const path = callerPath();
    console.log('Caller path:', path);
    return path;
  }

  function middle() {
    return inner();
  }

  function outer() {
    return middle();
  }

  outer();

  console.log("\n🚀 ~40M+ downloads/week | Simple path detection\n");
}
