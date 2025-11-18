/**
 * callsite - Access v8 CallSite objects
 * Based on https://www.npmjs.com/package/callsite (~8M+ downloads/week)
 *
 * Features:
 * - Get call site information
 * - Access caller details
 * - V8 stack API wrapper
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Simple caller introspection
 */

interface CallSite {
  getFileName(): string | undefined;
  getLineNumber(): number | undefined;
  getColumnNumber(): number | undefined;
  getFunctionName(): string | null;
  getTypeName(): string | null;
  getMethodName(): string | null;
  isNative(): boolean;
}

function callsite(): CallSite[] {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  let callSites: any[] = [];

  Error.prepareStackTrace = (_, stack) => {
    callSites = stack;
    return stack;
  };

  const error = new Error();
  error.stack; // Trigger stack trace

  Error.prepareStackTrace = originalPrepareStackTrace;

  // Fallback parsing if prepareStackTrace doesn't work
  if (!callSites || callSites.length === 0) {
    const stack = new Error().stack || '';
    const lines = stack.split('\n').slice(2);

    return lines.map(line => {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) ||
                    line.match(/at\s+(.+?):(\d+):(\d+)/);

      const obj: any = {};
      if (match) {
        if (match.length === 5) {
          obj.getFileName = () => match[2];
          obj.getLineNumber = () => parseInt(match[3]);
          obj.getColumnNumber = () => parseInt(match[4]);
          obj.getFunctionName = () => match[1];
        } else {
          obj.getFileName = () => match[1];
          obj.getLineNumber = () => parseInt(match[2]);
          obj.getColumnNumber = () => parseInt(match[3]);
          obj.getFunctionName = () => null;
        }
      } else {
        obj.getFileName = () => undefined;
        obj.getLineNumber = () => undefined;
        obj.getColumnNumber = () => undefined;
        obj.getFunctionName = () => null;
      }

      obj.getTypeName = () => null;
      obj.getMethodName = () => obj.getFunctionName();
      obj.isNative = () => false;

      return obj as CallSite;
    });
  }

  return callSites.slice(1);
}

export default callsite;

// Self-test
if (import.meta.url.includes("elide-callsite.ts")) {
  console.log("✅ callsite - V8 CallSite Access (POLYGLOT!)\n");

  function exampleFunction() {
    const stack = callsite();
    console.log('Call sites:', stack.length);
    console.log('Current function:', stack[0]?.getFunctionName() || 'anonymous');
    console.log('File:', stack[0]?.getFileName());
    console.log('Line:', stack[0]?.getLineNumber());
  }

  exampleFunction();

  console.log("\n🚀 ~8M+ downloads/week | Simple caller introspection\n");
}
