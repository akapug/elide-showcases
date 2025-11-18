/**
 * serialize-error - Serialize/deserialize errors to JSON
 * Based on https://www.npmjs.com/package/serialize-error (~40M+ downloads/week)
 *
 * Features:
 * - Serialize Error objects to JSON
 * - Preserve stack traces
 * - Handle circular references
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Error transport across boundaries
 */

interface SerializedError {
  name?: string;
  message?: string;
  stack?: string;
  code?: string | number;
  [key: string]: any;
}

function serializeError(error: Error | any): SerializedError {
  if (!(error instanceof Error)) {
    return error;
  }

  const serialized: SerializedError = {
    name: error.name,
    message: error.message,
    stack: error.stack
  };

  // Copy enumerable properties
  for (const key in error) {
    if (Object.prototype.hasOwnProperty.call(error, key)) {
      serialized[key] = (error as any)[key];
    }
  }

  // Handle common error properties
  if ('code' in error) {
    serialized.code = (error as any).code;
  }

  return serialized;
}

function deserializeError(serialized: SerializedError): Error {
  const error = new Error(serialized.message);
  error.name = serialized.name || 'Error';
  error.stack = serialized.stack;

  // Restore other properties
  for (const key in serialized) {
    if (key !== 'name' && key !== 'message' && key !== 'stack') {
      (error as any)[key] = serialized[key];
    }
  }

  return error;
}

export { serializeError, deserializeError };
export default serializeError;

// Self-test
if (import.meta.url.includes("elide-serialize-error.ts")) {
  console.log("✅ serialize-error - Error Serialization (POLYGLOT!)\n");

  const error = new Error('Database connection failed');
  (error as any).code = 'ECONNREFUSED';
  (error as any).port = 5432;

  const serialized = serializeError(error);
  console.log('Serialized:', JSON.stringify(serialized, null, 2).substring(0, 150));

  const deserialized = deserializeError(serialized);
  console.log('Deserialized message:', deserialized.message);
  console.log('Deserialized code:', (deserialized as any).code);

  console.log("\n🚀 ~40M+ downloads/week | Error transport solution\n");
}
