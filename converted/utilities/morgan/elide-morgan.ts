/**
 * Morgan - HTTP Request Logger Middleware
 *
 * HTTP request logger middleware for node.js.
 * **POLYGLOT SHOWCASE**: HTTP logging for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/morgan (~10M downloads/week)
 *
 * Features:
 * - Predefined logging formats
 * - Custom token support
 * - Colorized output
 * - Response time tracking
 * - Status code logging
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need HTTP logging
 * - ONE logger works everywhere on Elide
 * - Consistent log format across languages
 * - Share logging configuration across your stack
 *
 * Use cases:
 * - API request logging
 * - Development debugging
 * - Production monitoring
 * - Audit trails
 *
 * Package has ~10M downloads/week on npm - essential logging middleware!
 */

interface Request {
  method: string;
  url: string;
  headers: Record<string, string>;
  httpVersion?: string;
}

interface Response {
  statusCode: number;
  headers: Record<string, string>;
  get(name: string): string | undefined;
}

type TokenFunction = (req: Request, res: Response) => string;

const tokens: Record<string, TokenFunction> = {
  method: (req) => req.method,
  url: (req) => req.url,
  status: (req, res) => String(res.statusCode),
  "response-time": () => "0", // Placeholder
  "remote-addr": (req) => req.headers["x-forwarded-for"] || "127.0.0.1",
  "http-version": (req) => req.httpVersion || "1.1",
  referrer: (req) => req.headers["referer"] || req.headers["referrer"] || "-",
  "user-agent": (req) => req.headers["user-agent"] || "-",
  date: () => new Date().toISOString(),
  "res-content-length": (req, res) => res.headers["content-length"] || "-",
  "req-content-length": (req) => req.headers["content-length"] || "-",
};

/**
 * Predefined formats
 */
const formats: Record<string, string> = {
  combined:
    ':remote-addr - :method :url HTTP/:http-version :status :res-content-length ":referrer" ":user-agent"',
  common: ':remote-addr - :method :url HTTP/:http-version :status :res-content-length',
  dev: ":method :url :status :response-time ms",
  short: ":remote-addr :method :url HTTP/:http-version :status :res-content-length - :response-time ms",
  tiny: ":method :url :status :res-content-length - :response-time ms",
};

/**
 * Status code color
 */
function statusColor(status: number): string {
  if (status >= 500) return "\x1b[31m"; // red
  if (status >= 400) return "\x1b[33m"; // yellow
  if (status >= 300) return "\x1b[36m"; // cyan
  if (status >= 200) return "\x1b[32m"; // green
  return "\x1b[0m"; // reset
}

/**
 * Compile format string
 */
function compile(format: string, colored: boolean = false): (req: Request, res: Response) => string {
  return (req: Request, res: Response) => {
    let result = format;

    // Replace tokens
    for (const [name, fn] of Object.entries(tokens)) {
      const regex = new RegExp(`:${name}`, "g");
      result = result.replace(regex, fn(req, res));
    }

    // Colorize status in dev mode
    if (colored && format === formats.dev) {
      const status = res.statusCode;
      const color = statusColor(status);
      result = result.replace(String(status), `${color}${status}\x1b[0m`);
    }

    return result;
  };
}

/**
 * Create morgan logger
 */
export default function morgan(
  format: string = "dev",
  options: { stream?: any; skip?: (req: Request, res: Response) => boolean } = {}
) {
  const formatString = formats[format] || format;
  const colored = format === "dev";
  const formatter = compile(formatString, colored);

  return function logger(req: Request, res: Response, next: () => void) {
    const startTime = Date.now();

    // Override response-time token
    tokens["response-time"] = () => String(Date.now() - startTime);

    const log = () => {
      if (options.skip && options.skip(req, res)) {
        return;
      }

      const message = formatter(req, res);
      if (options.stream) {
        options.stream.write(message + "\n");
      } else {
        console.log(message);
      }
    };

    // Log after response
    if (next) {
      next();
    }

    // Simulate response end
    setTimeout(log, 0);
  };
}

export { morgan };

// CLI Demo
if (import.meta.url.includes("elide-morgan.ts")) {
  console.log("📝 Morgan - HTTP Request Logger (POLYGLOT!)\n");

  const mockReq: Request = {
    method: "GET",
    url: "/api/users",
    headers: {
      "user-agent": "Mozilla/5.0",
      "x-forwarded-for": "192.168.1.1",
    },
    httpVersion: "1.1",
  };

  const mockRes: Response = {
    statusCode: 200,
    headers: { "content-length": "1234" },
    get(name: string) {
      return this.headers[name];
    },
  };

  console.log("=== Example 1: Dev Format (Colored) ===");
  const devLogger = morgan("dev");
  devLogger(mockReq, mockRes, () => {});
  console.log();

  console.log("=== Example 2: Combined Format ===");
  const combinedLogger = morgan("combined");
  combinedLogger(mockReq, mockRes, () => {});
  console.log();

  console.log("=== Example 3: Tiny Format ===");
  const tinyLogger = morgan("tiny");
  tinyLogger(mockReq, mockRes, () => {});
  console.log();

  console.log("=== Example 4: Common Format ===");
  const commonLogger = morgan("common");
  commonLogger(mockReq, mockRes, () => {});
  console.log();

  console.log("=== Example 5: Short Format ===");
  const shortLogger = morgan("short");
  shortLogger(mockReq, mockRes, () => {});
  console.log();

  console.log("=== Example 6: Different Status Codes ===");
  const statusLogger = morgan("dev");
  const statuses = [200, 201, 301, 404, 500];

  statuses.forEach((status) => {
    const res = { ...mockRes, statusCode: status };
    console.log(`Status ${status}:`);
    statusLogger(mockReq, res, () => {});
  });
  console.log();

  console.log("=== Example 7: POST Request ===");
  const postReq: Request = {
    method: "POST",
    url: "/api/users",
    headers: {
      "user-agent": "curl/7.68.0",
      "content-length": "128",
    },
  };
  const postRes: Response = {
    statusCode: 201,
    headers: { "content-length": "45" },
    get(name) {
      return this.headers[name];
    },
  };
  statusLogger(postReq, postRes, () => {});
  console.log();

  console.log("=== Example 8: Custom Format ===");
  const customLogger = morgan(":method :url - :status");
  customLogger(mockReq, mockRes, () => {});
  console.log();

  console.log("=== Example 9: With Referrer ===");
  const refReq: Request = {
    method: "GET",
    url: "/page",
    headers: {
      "user-agent": "Mozilla/5.0",
      referrer: "https://google.com",
    },
  };
  const combinedWithRef = morgan("combined");
  combinedWithRef(refReq, mockRes, () => {});
  console.log();

  console.log("=== Example 10: Skip Function ===");
  const skipLogger = morgan("tiny", {
    skip: (req, res) => res.statusCode < 400,
  });

  console.log("Success (skipped):");
  skipLogger(mockReq, { ...mockRes, statusCode: 200 }, () => {});
  console.log("Error (logged):");
  skipLogger(mockReq, { ...mockRes, statusCode: 404 }, () => {});
  console.log();

  console.log("✅ Use Cases:");
  console.log("- API request logging");
  console.log("- Development debugging");
  console.log("- Production monitoring");
  console.log("- Audit trails");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Minimal overhead");
  console.log("- ~10M downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Same log format across all languages");
  console.log("- Consistent monitoring");
  console.log("- Share logging configuration");
}
