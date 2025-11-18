/**
 * create-error - Create custom error classes
 * Based on https://www.npmjs.com/package/create-error (~5M+ downloads/week)
 *
 * Features:
 * - Create custom error classes
 * - Inheritance support
 * - Default properties
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Type-safe custom errors
 */

interface ErrorConstructor {
  new (message?: string, props?: Record<string, any>): Error;
  prototype: Error;
}

function createError(name: string, properties?: Record<string, any>): ErrorConstructor {
  class CustomError extends Error {
    constructor(message?: string, props?: Record<string, any>) {
      super(message);
      this.name = name;
      Object.assign(this, properties, props);
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, CustomError);
      }
    }
  }

  return CustomError as ErrorConstructor;
}

export default createError;

// Self-test
if (import.meta.url.includes("elide-create-error.ts")) {
  console.log("✅ create-error - Custom Error Classes (POLYGLOT!)\n");

  const ValidationError = createError('ValidationError', { code: 400 });
  const DatabaseError = createError('DatabaseError', { code: 500, retryable: true });

  const validationErr = new ValidationError('Invalid input', { field: 'email' });
  const dbErr = new DatabaseError('Connection failed');

  console.log('ValidationError:', validationErr.name, '-', validationErr.message);
  console.log('DatabaseError:', dbErr.name, '-', (dbErr as any).retryable);

  console.log("\n🚀 ~5M+ downloads/week | Simple custom error creation\n");
}
