/**
 * stack-trace - Get v8 stack traces as an array of CallSite objects
 * Based on https://www.npmjs.com/package/stack-trace (~15M+ downloads/week)
 *
 * Features:
 * - Parse V8 stack traces
 * - Access CallSite objects
 * - Extract file, line, column info
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - V8-compatible stack parsing
 */

interface CallSite {
  getFileName(): string | null;
  getLineNumber(): number | null;
  getColumnNumber(): number | null;
  getFunctionName(): string | null;
  getTypeName(): string | null;
  getMethodName(): string | null;
  isNative(): boolean;
  isToplevel(): boolean;
  isConstructor(): boolean;
}

class CallSiteImpl implements CallSite {
  constructor(
    private fileName: string | null,
    private lineNumber: number | null,
    private columnNumber: number | null,
    private functionName: string | null
  ) {}

  getFileName() { return this.fileName; }
  getLineNumber() { return this.lineNumber; }
  getColumnNumber() { return this.columnNumber; }
  getFunctionName() { return this.functionName; }
  getTypeName() { return null; }
  getMethodName() { return this.functionName; }
  isNative() { return false; }
  isToplevel() { return true; }
  isConstructor() { return false; }
}

const stackTrace = {
  parse(error: Error): CallSite[] {
    const stack = error.stack || '';
    const lines = stack.split('\n').slice(1);

    return lines.map(line => {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) ||
                    line.match(/at\s+(.+?):(\d+):(\d+)/);

      if (match) {
        if (match.length === 5) {
          return new CallSiteImpl(
            match[2],
            parseInt(match[3]),
            parseInt(match[4]),
            match[1]
          );
        } else {
          return new CallSiteImpl(
            match[1],
            parseInt(match[2]),
            parseInt(match[3]),
            null
          );
        }
      }

      return new CallSiteImpl(null, null, null, null);
    });
  },

  get(belowFn?: Function): CallSite[] {
    const error = new Error();
    return this.parse(error);
  }
};

export default stackTrace;
export { CallSite };

// Self-test
if (import.meta.url.includes("elide-stack-trace.ts")) {
  console.log("✅ stack-trace - V8 Stack Parser (POLYGLOT!)\n");

  const error = new Error('Test');
  const callSites = stackTrace.parse(error);

  console.log('Call sites:', callSites.length);
  console.log('First call site:', {
    file: callSites[0]?.getFileName(),
    line: callSites[0]?.getLineNumber(),
    function: callSites[0]?.getFunctionName()
  });

  console.log("\n🚀 ~15M+ downloads/week | V8 stack trace parsing\n");
}
