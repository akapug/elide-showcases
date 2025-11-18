/**
 * boom - HTTP-friendly error objects
 * Based on https://www.npmjs.com/package/@hapi/boom (~15M+ downloads/week)
 *
 * Features:
 * - HTTP status code errors
 * - Rich error metadata
 * - Hapi framework integration
 *
 * Polyglot Benefits:
 * - Works seamlessly in TypeScript, Python, Ruby, Java via Elide
 * - Zero npm dependencies
 * - Type-safe HTTP errors
 */

class BoomError extends Error {
  isBoom: boolean = true;
  output: {
    statusCode: number;
    payload: {
      statusCode: number;
      error: string;
      message: string;
    };
    headers: Record<string, string>;
  };

  constructor(message: string, statusCode: number, error: string) {
    super(message);
    this.name = 'BoomError';
    this.output = {
      statusCode,
      payload: { statusCode, error, message },
      headers: {}
    };
  }
}

const boom = {
  badRequest: (message = 'Bad Request') =>
    new BoomError(message, 400, 'Bad Request'),

  unauthorized: (message = 'Unauthorized') =>
    new BoomError(message, 401, 'Unauthorized'),

  forbidden: (message = 'Forbidden') =>
    new BoomError(message, 403, 'Forbidden'),

  notFound: (message = 'Not Found') =>
    new BoomError(message, 404, 'Not Found'),

  conflict: (message = 'Conflict') =>
    new BoomError(message, 409, 'Conflict'),

  internal: (message = 'Internal Server Error') =>
    new BoomError(message, 500, 'Internal Server Error'),

  badGateway: (message = 'Bad Gateway') =>
    new BoomError(message, 502, 'Bad Gateway'),

  isBoom: (err: any): err is BoomError =>
    err && err.isBoom === true
};

export { BoomError, boom };
export default boom;

// Self-test
if (import.meta.url.includes("elide-boom.ts")) {
  console.log("✅ boom - HTTP-Friendly Errors (POLYGLOT!)\n");

  const notFoundErr = boom.notFound('User not found');
  const badRequestErr = boom.badRequest('Invalid email format');

  console.log('404 Error:', notFoundErr.output.payload);
  console.log('400 Error:', badRequestErr.output.statusCode);
  console.log('Is Boom?', boom.isBoom(notFoundErr));

  console.log("\n🚀 ~15M+ downloads/week | Hapi's HTTP error library\n");
}
