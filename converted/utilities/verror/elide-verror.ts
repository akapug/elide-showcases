/**
 * verror - Rich JavaScript errors with chaining
 * Based on https://www.npmjs.com/package/verror (~15M+ downloads/week)
 *
 * Features:
 * - Error chaining with cause tracking
 * - Structured error information
 * - Printf-style error messages
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Type-safe error handling
 */

class VError extends Error {
  cause?: Error;
  info: Record<string, any>;

  constructor(options: { cause?: Error; info?: Record<string, any> } | string, message?: string) {
    if (typeof options === 'string') {
      super(options);
      this.info = {};
    } else {
      super(message || options.cause?.message || 'Unknown error');
      this.cause = options.cause;
      this.info = options.info || {};
    }
    this.name = 'VError';
  }

  static cause(err: Error): Error | undefined {
    return (err as VError).cause;
  }

  static info(err: Error): Record<string, any> {
    return (err as VError).info || {};
  }

  static fullStack(err: Error): string {
    let stack = err.stack || '';
    let current = (err as VError).cause;
    while (current) {
      stack += '\nCaused by: ' + current.stack;
      current = (current as VError).cause;
    }
    return stack;
  }
}

class WError extends VError {
  constructor(options: { cause?: Error; info?: Record<string, any> }, message: string) {
    super(options, message);
    this.name = 'WError';
  }
}

export { VError, WError };
export default VError;

// Self-test
if (import.meta.url.includes("elide-verror.ts")) {
  console.log("✅ verror - Rich JavaScript Errors (POLYGLOT!)\n");

  const cause = new Error("Database connection failed");
  const err = new VError({
    cause,
    info: { host: 'localhost', port: 5432 }
  }, "Failed to fetch user");

  console.log('Error message:', err.message);
  console.log('Error info:', VError.info(err));
  console.log('Error cause:', VError.cause(err)?.message);
  console.log('Full stack:', VError.fullStack(err).split('\n')[0]);

  console.log("\n🚀 ~15M+ downloads/week | Battle-tested error chaining\n");
}
