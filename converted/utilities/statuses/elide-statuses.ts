/**
 * Statuses - HTTP Status Codes
 *
 * HTTP status utility for node.
 * **POLYGLOT SHOWCASE**: HTTP status codes for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/statuses (~30M downloads/week)
 *
 * Features:
 * - Get status message from code
 * - Get status code from message
 * - Check if status is redirect
 * - Check if status is empty
 * - Check if status is retry-able
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need HTTP status handling
 * - ONE status database works everywhere on Elide
 * - Consistent status messages across languages
 * - Share HTTP conventions across your stack
 *
 * Use cases:
 * - HTTP response handling
 * - Error messages
 * - API documentation
 * - Status validation
 *
 * Package has ~30M downloads/week on npm - essential HTTP utility!
 */

const STATUS_CODES: Record<number, string> = {
  // 1xx Informational
  100: "Continue",
  101: "Switching Protocols",
  102: "Processing",
  103: "Early Hints",

  // 2xx Success
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  207: "Multi-Status",
  208: "Already Reported",
  226: "IM Used",

  // 3xx Redirection
  300: "Multiple Choices",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  305: "Use Proxy",
  307: "Temporary Redirect",
  308: "Permanent Redirect",

  // 4xx Client Errors
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

  // 5xx Server Errors
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported",
  506: "Variant Also Negotiates",
  507: "Insufficient Storage",
  508: "Loop Detected",
  509: "Bandwidth Limit Exceeded",
  510: "Not Extended",
  511: "Network Authentication Required",
};

const CODE_TO_MESSAGE: Record<number, string> = STATUS_CODES;

const MESSAGE_TO_CODE: Record<string, number> = {};
Object.entries(STATUS_CODES).forEach(([code, message]) => {
  MESSAGE_TO_CODE[message.toLowerCase()] = parseInt(code, 10);
});

// Status code sets
const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308]);
const EMPTY_STATUS = new Set([204, 205, 304]);
const RETRY_STATUS = new Set([502, 503, 504]);

/**
 * Get status message or code
 */
export function status(code: number): string;
export function status(message: string): number;
export function status(codeOrMessage: number | string): string | number {
  if (typeof codeOrMessage === "number") {
    return CODE_TO_MESSAGE[codeOrMessage] || "Unknown Status";
  } else {
    return MESSAGE_TO_CODE[codeOrMessage.toLowerCase()] || 0;
  }
}

/**
 * Get status message from code
 */
export function message(code: number): string {
  return CODE_TO_MESSAGE[code] || "Unknown Status";
}

/**
 * Get status code from message
 */
export function code(msg: string): number {
  return MESSAGE_TO_CODE[msg.toLowerCase()] || 0;
}

/**
 * Check if status code is a redirect
 */
export function redirect(code: number): boolean {
  return REDIRECT_STATUS.has(code);
}

/**
 * Check if status code should have empty body
 */
export function empty(code: number): boolean {
  return EMPTY_STATUS.has(code) || (code >= 100 && code < 200);
}

/**
 * Check if status code is retry-able
 */
export function retry(code: number): boolean {
  return RETRY_STATUS.has(code);
}

export default status;

// CLI Demo
if (import.meta.url.includes("elide-statuses.ts")) {
  console.log("🔢 Statuses - HTTP Status Codes (POLYGLOT!)\n");

  console.log("=== Example 1: Get Message from Code ===");
  const codes = [200, 201, 301, 404, 500, 503];
  codes.forEach((code) => {
    console.log(`  ${code} => ${status(code)}`);
  });
  console.log();

  console.log("=== Example 2: Get Code from Message ===");
  const messages = ["OK", "Not Found", "Internal Server Error", "Bad Request"];
  messages.forEach((msg) => {
    console.log(`  "${msg}" => ${status(msg)}`);
  });
  console.log();

  console.log("=== Example 3: 2xx Success Codes ===");
  const successCodes = [200, 201, 202, 204];
  successCodes.forEach((code) => {
    console.log(`  ${code}: ${message(code)}`);
  });
  console.log();

  console.log("=== Example 4: 4xx Client Errors ===");
  const clientErrors = [400, 401, 403, 404, 422, 429];
  clientErrors.forEach((code) => {
    console.log(`  ${code}: ${message(code)}`);
  });
  console.log();

  console.log("=== Example 5: 5xx Server Errors ===");
  const serverErrors = [500, 502, 503, 504];
  serverErrors.forEach((code) => {
    console.log(`  ${code}: ${message(code)}`);
  });
  console.log();

  console.log("=== Example 6: Redirect Codes ===");
  const redirectCodes = [301, 302, 303, 307, 308, 404];
  redirectCodes.forEach((code) => {
    console.log(`  ${code} ${message(code)} => ${redirect(code) ? "✓ is redirect" : "✗ not redirect"}`);
  });
  console.log();

  console.log("=== Example 7: Empty Body Codes ===");
  const emptyCodes = [204, 205, 304, 200];
  emptyCodes.forEach((code) => {
    console.log(`  ${code} ${message(code)} => ${empty(code) ? "✓ empty body" : "✗ has body"}`);
  });
  console.log();

  console.log("=== Example 8: Retry-able Codes ===");
  const retryCodes = [500, 502, 503, 504, 404];
  retryCodes.forEach((code) => {
    console.log(`  ${code} ${message(code)} => ${retry(code) ? "✓ retry-able" : "✗ not retry-able"}`);
  });
  console.log();

  console.log("=== Example 9: API Response Builder ===");
  function buildResponse(statusCode: number, data?: any) {
    return {
      status: statusCode,
      statusText: message(statusCode),
      data: empty(statusCode) ? undefined : data,
      headers: redirect(statusCode) ? { Location: "/redirect" } : {},
    };
  }

  const responses = [
    buildResponse(200, { success: true }),
    buildResponse(204),
    buildResponse(301, { redirect: true }),
    buildResponse(404, { error: "Not found" }),
  ];

  responses.forEach((res) => {
    console.log(`  ${res.status} ${res.statusText}:`, res.data || "(empty)");
  });
  console.log();

  console.log("=== Example 10: Error Handler ===");
  function handleError(code: number) {
    const msg = message(code);
    const canRetry = retry(code);
    return {
      error: msg,
      code,
      retry: canRetry,
      message: canRetry ? "Request can be retried" : "Request cannot be retried",
    };
  }

  const errorCodes = [503, 404, 502];
  errorCodes.forEach((code) => {
    const result = handleError(code);
    console.log(`  ${code}: ${result.error} (${result.message})`);
  });
  console.log();

  console.log("=== Example 11: All 1xx Informational ===");
  [100, 101, 102, 103].forEach((code) => {
    console.log(`  ${code}: ${message(code)}`);
  });
  console.log();

  console.log("=== Example 12: All 3xx Redirects ===");
  [300, 301, 302, 303, 304, 307, 308].forEach((code) => {
    console.log(`  ${code}: ${message(code)}`);
  });
  console.log();

  console.log("✅ Use Cases:");
  console.log("- HTTP response handling");
  console.log("- Error message generation");
  console.log("- API documentation");
  console.log("- Status code validation");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast lookup tables");
  console.log("- ~30M downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Same status codes across all languages");
  console.log("- Consistent error messages");
  console.log("- Share HTTP conventions");
}
