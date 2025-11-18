/**
 * HTTP Errors - Create HTTP Error Objects
 *
 * Create HTTP errors for Express, Koa, Connect, etc.
 * **POLYGLOT SHOWCASE**: HTTP error handling for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/http-errors (~60M downloads/week)
 *
 * Features:
 * - Create HTTP errors with status codes
 * - Named constructors for common errors
 * - Custom properties and messages
 * - Stack traces
 * - Error inheritance
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need HTTP error handling
 * - ONE error pattern works everywhere on Elide
 * - Consistent error responses across languages
 * - Share error handling logic across your stack
 *
 * Use cases:
 * - REST API error responses
 * - Middleware error handling
 * - HTTP client errors (4xx)
 * - HTTP server errors (5xx)
 *
 * Package has ~60M downloads/week on npm - essential HTTP utility!
 */

/**
 * HTTP Error class
 */
export class HttpError extends Error {
  statusCode: number;
  status: number;
  expose: boolean;
  headers?: Record<string, string>;

  constructor(statusCode: number, message?: string, properties?: Record<string, any>) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.status = statusCode;
    this.expose = statusCode < 500;

    if (properties) {
      Object.assign(this, properties);
    }

    // Set the prototype explicitly
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

/**
 * Create HTTP error
 */
export function createError(statusCode: number, message?: string, properties?: Record<string, any>): HttpError;
export function createError(message: string, properties?: Record<string, any>): HttpError;
export function createError(...args: any[]): HttpError {
  let statusCode = 500;
  let message: string | undefined;
  let properties: Record<string, any> | undefined;

  // Parse arguments
  if (typeof args[0] === "number") {
    statusCode = args[0];
    message = args[1];
    properties = args[2];
  } else if (typeof args[0] === "string") {
    message = args[0];
    properties = args[1];
  }

  return new HttpError(statusCode, message || getStatusMessage(statusCode), properties);
}

/**
 * Get status message
 */
function getStatusMessage(statusCode: number): string {
  const messages: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    411: "Length Required",
    412: "Precondition Failed",
    413: "Payload Too Large",
    414: "URI Too Long",
    415: "Unsupported Media Type",
    416: "Range Not Satisfiable",
    417: "Expectation Failed",
    418: "I'm a teapot",
    421: "Misdirected Request",
    422: "Unprocessable Entity",
    423: "Locked",
    424: "Failed Dependency",
    425: "Too Early",
    426: "Upgrade Required",
    428: "Precondition Required",
    429: "Too Many Requests",
    431: "Request Header Fields Too Large",
    451: "Unavailable For Legal Reasons",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
    505: "HTTP Version Not Supported",
    506: "Variant Also Negotiates",
    507: "Insufficient Storage",
    508: "Loop Detected",
    510: "Not Extended",
    511: "Network Authentication Required",
  };

  return messages[statusCode] || "Unknown Error";
}

// Named error constructors (4xx Client Errors)
export class BadRequest extends HttpError {
  constructor(message?: string) {
    super(400, message || "Bad Request");
    this.name = "BadRequestError";
  }
}

export class Unauthorized extends HttpError {
  constructor(message?: string) {
    super(401, message || "Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class PaymentRequired extends HttpError {
  constructor(message?: string) {
    super(402, message || "Payment Required");
    this.name = "PaymentRequiredError";
  }
}

export class Forbidden extends HttpError {
  constructor(message?: string) {
    super(403, message || "Forbidden");
    this.name = "ForbiddenError";
  }
}

export class NotFound extends HttpError {
  constructor(message?: string) {
    super(404, message || "Not Found");
    this.name = "NotFoundError";
  }
}

export class MethodNotAllowed extends HttpError {
  constructor(message?: string) {
    super(405, message || "Method Not Allowed");
    this.name = "MethodNotAllowedError";
  }
}

export class NotAcceptable extends HttpError {
  constructor(message?: string) {
    super(406, message || "Not Acceptable");
    this.name = "NotAcceptableError";
  }
}

export class Conflict extends HttpError {
  constructor(message?: string) {
    super(409, message || "Conflict");
    this.name = "ConflictError";
  }
}

export class Gone extends HttpError {
  constructor(message?: string) {
    super(410, message || "Gone");
    this.name = "GoneError";
  }
}

export class UnprocessableEntity extends HttpError {
  constructor(message?: string) {
    super(422, message || "Unprocessable Entity");
    this.name = "UnprocessableEntityError";
  }
}

export class TooManyRequests extends HttpError {
  constructor(message?: string) {
    super(429, message || "Too Many Requests");
    this.name = "TooManyRequestsError";
  }
}

// Named error constructors (5xx Server Errors)
export class InternalServerError extends HttpError {
  constructor(message?: string) {
    super(500, message || "Internal Server Error");
    this.name = "InternalServerErrorError";
  }
}

export class NotImplemented extends HttpError {
  constructor(message?: string) {
    super(501, message || "Not Implemented");
    this.name = "NotImplementedError";
  }
}

export class BadGateway extends HttpError {
  constructor(message?: string) {
    super(502, message || "Bad Gateway");
    this.name = "BadGatewayError";
  }
}

export class ServiceUnavailable extends HttpError {
  constructor(message?: string) {
    super(503, message || "Service Unavailable");
    this.name = "ServiceUnavailableError";
  }
}

export class GatewayTimeout extends HttpError {
  constructor(message?: string) {
    super(504, message || "Gateway Timeout");
    this.name = "GatewayTimeoutError";
  }
}

export default createError;

// CLI Demo
if (import.meta.url.includes("elide-http-errors.ts")) {
  console.log("⚠️  HTTP Errors - Create HTTP Error Objects (POLYGLOT!)\n");

  console.log("=== Example 1: Create Errors by Status Code ===");
  const err400 = createError(400, "Invalid input");
  const err404 = createError(404);
  const err500 = createError(500, "Database connection failed");

  console.log(`${err400.statusCode}: ${err400.message}`);
  console.log(`${err404.statusCode}: ${err404.message}`);
  console.log(`${err500.statusCode}: ${err500.message}`);
  console.log();

  console.log("=== Example 2: Named Error Constructors ===");
  const badRequest = new BadRequest("Missing required field");
  const unauthorized = new Unauthorized("Invalid token");
  const notFound = new NotFound("User not found");
  const forbidden = new Forbidden("Access denied");

  console.log(`${badRequest.name}: ${badRequest.message}`);
  console.log(`${unauthorized.name}: ${unauthorized.message}`);
  console.log(`${notFound.name}: ${notFound.message}`);
  console.log(`${forbidden.name}: ${forbidden.message}`);
  console.log();

  console.log("=== Example 3: Server Errors ===");
  const internalError = new InternalServerError("Something went wrong");
  const notImplemented = new NotImplemented("Feature not available");
  const serviceUnavailable = new ServiceUnavailable("Database is down");

  console.log(`${internalError.statusCode}: ${internalError.message}`);
  console.log(`${notImplemented.statusCode}: ${notImplemented.message}`);
  console.log(`${serviceUnavailable.statusCode}: ${serviceUnavailable.message}`);
  console.log();

  console.log("=== Example 4: Error Properties ===");
  const err = new NotFound("Resource not found");
  console.log(`Status: ${err.statusCode}`);
  console.log(`Message: ${err.message}`);
  console.log(`Expose: ${err.expose}`);
  console.log(`Name: ${err.name}`);
  console.log();

  console.log("=== Example 5: Custom Properties ===");
  const validationError = createError(422, "Validation failed", {
    fields: { email: "Invalid email format", age: "Must be 18+" },
  });
  console.log(`${validationError.statusCode}: ${validationError.message}`);
  console.log("Fields:", (validationError as any).fields);
  console.log();

  console.log("=== Example 6: Rate Limiting ===");
  const rateLimitError = new TooManyRequests("Rate limit exceeded");
  rateLimitError.headers = {
    "Retry-After": "60",
    "X-RateLimit-Limit": "100",
    "X-RateLimit-Remaining": "0",
  };
  console.log(`${rateLimitError.statusCode}: ${rateLimitError.message}`);
  console.log("Headers:", rateLimitError.headers);
  console.log();

  console.log("=== Example 7: Middleware Error Handler ===");
  function errorHandler(err: HttpError) {
    return {
      status: err.statusCode,
      error: {
        message: err.message,
        code: err.name,
      },
    };
  }

  const error = new Unauthorized("Token expired");
  console.log("Error response:", errorHandler(error));
  console.log();

  console.log("=== Example 8: All 4xx Errors ===");
  const clientErrors = [
    new BadRequest(),
    new Unauthorized(),
    new Forbidden(),
    new NotFound(),
    new MethodNotAllowed(),
    new Conflict(),
    new UnprocessableEntity(),
    new TooManyRequests(),
  ];

  clientErrors.forEach((err) => {
    console.log(`  ${err.statusCode}: ${err.message} (expose: ${err.expose})`);
  });
  console.log();

  console.log("=== Example 9: All 5xx Errors ===");
  const serverErrors = [
    new InternalServerError(),
    new NotImplemented(),
    new BadGateway(),
    new ServiceUnavailable(),
    new GatewayTimeout(),
  ];

  serverErrors.forEach((err) => {
    console.log(`  ${err.statusCode}: ${err.message} (expose: ${err.expose})`);
  });
  console.log();

  console.log("=== Example 10: Error in Try-Catch ===");
  try {
    throw new NotFound("API endpoint not found");
  } catch (err) {
    if (err instanceof HttpError) {
      console.log(`Caught HTTP error: ${err.statusCode} ${err.message}`);
    }
  }
  console.log();

  console.log("✅ Use Cases:");
  console.log("- REST API error responses");
  console.log("- Middleware error handling");
  console.log("- HTTP client errors (4xx)");
  console.log("- HTTP server errors (5xx)");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Named constructors for common errors");
  console.log("- ~60M downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use same error codes across all languages");
  console.log("- Consistent error response format");
  console.log("- Share error handling logic");
}
