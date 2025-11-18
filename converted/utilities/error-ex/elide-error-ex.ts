/**
 * error-ex - Easy error subclassing and metadata
 * Based on https://www.npmjs.com/package/error-ex (~80M+ downloads/week)
 *
 * Features:
 * - Create custom error classes
 * - Attach metadata to errors
 * - Prototype chain preservation
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Type-safe error extension
 */

interface ErrorExConstructor {
  new (message?: string): Error & Record<string, any>;
  (message?: string): Error & Record<string, any>;
}

function errorEx(name: string, properties?: Record<string, any>): ErrorExConstructor {
  const CustomError: any = function(this: any, message?: string) {
    // Support both `new ErrorType()` and `ErrorType()`
    if (!(this instanceof CustomError)) {
      return new (CustomError as any)(message);
    }

    Object.defineProperty(this, 'message', {
      configurable: true,
      enumerable: false,
      value: message || '',
      writable: true
    });

    Object.defineProperty(this, 'name', {
      enumerable: false,
      value: name,
      writable: true
    });

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }

    // Apply default properties
    if (properties) {
      Object.assign(this, properties);
    }
  };

  CustomError.prototype = Object.create(Error.prototype);
  CustomError.prototype.constructor = CustomError;

  return CustomError;
}

export default errorEx;

// Self-test
if (import.meta.url.includes("elide-error-ex.ts")) {
  console.log("✅ error-ex - Error Subclassing (POLYGLOT!)\n");

  const JSONError = errorEx('JSONError', { code: 'EJSON' });
  const ParseError = errorEx('ParseError', { code: 'EPARSE', line: 0 });

  const jsonErr = new JSONError('Invalid JSON');
  (jsonErr as any).fileName = 'config.json';

  const parseErr = new ParseError('Unexpected token');
  (parseErr as any).line = 42;

  console.log('JSONError:', jsonErr.name, '-', (jsonErr as any).code);
  console.log('ParseError:', parseErr.name, '- line', (parseErr as any).line);
  console.log('instanceof Error:', jsonErr instanceof Error);

  console.log("\n🚀 ~80M+ downloads/week | Most popular error extension\n");
}
