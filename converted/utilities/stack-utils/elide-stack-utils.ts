/**
 * stack-utils - Capture and manipulate stack traces
 * Based on https://www.npmjs.com/package/stack-utils (~40M+ downloads/week)
 *
 * Features:
 * - Parse stack traces
 * - Clean internal frames
 * - Capture call sites
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Advanced stack manipulation
 */

interface CallSite {
  file: string;
  line: number;
  column: number;
  function?: string;
  method?: string;
  type?: string;
}

interface StackUtilsOptions {
  internals?: RegExp[];
  cwd?: string;
}

class StackUtils {
  private options: StackUtilsOptions;

  constructor(options: StackUtilsOptions = {}) {
    this.options = {
      internals: [/node_modules/, /node:internal/],
      ...options
    };
  }

  clean(stack: string | string[]): string {
    const lines = Array.isArray(stack) ? stack : stack.split('\n');

    const cleaned = lines.filter(line => {
      if (!line.trim()) return false;

      for (const pattern of this.options.internals || []) {
        if (pattern.test(line)) return false;
      }

      return true;
    });

    return cleaned.join('\n');
  }

  capture(limit = 10, startStackFunction?: Function): CallSite[] {
    const error = new Error();
    const stack = error.stack || '';
    const lines = stack.split('\n').slice(2, limit + 2);

    return lines.map(line => this.parseLine(line));
  }

  parseLine(line: string): CallSite {
    // Match: at functionName (file:line:column)
    const match1 = line.match(/at (.+?) \((.+?):(\d+):(\d+)\)/);
    if (match1) {
      return {
        function: match1[1],
        file: match1[2],
        line: parseInt(match1[3]),
        column: parseInt(match1[4])
      };
    }

    // Match: at file:line:column
    const match2 = line.match(/at (.+?):(\d+):(\d+)/);
    if (match2) {
      return {
        file: match2[1],
        line: parseInt(match2[2]),
        column: parseInt(match2[3])
      };
    }

    return { file: '', line: 0, column: 0 };
  }

  at(startStackFunction?: Function): CallSite {
    const callSites = this.capture(1, startStackFunction);
    return callSites[0] || { file: '', line: 0, column: 0 };
  }
}

export default StackUtils;
export { StackUtils, CallSite };

// Self-test
if (import.meta.url.includes("elide-stack-utils.ts")) {
  console.log("✅ stack-utils - Stack Trace Utilities (POLYGLOT!)\n");

  const stackUtils = new StackUtils();

  const error = new Error('Test');
  const cleaned = stackUtils.clean(error.stack || '');
  console.log('Cleaned stack lines:', cleaned.split('\n').length);

  const callSites = stackUtils.capture(3);
  console.log('Captured call sites:', callSites.length);
  console.log('First call site:', callSites[0]?.function || 'anonymous');

  console.log("\n🚀 ~40M+ downloads/week | Advanced stack utilities\n");
}
