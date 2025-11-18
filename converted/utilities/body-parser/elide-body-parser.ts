/**
 * Body Parser - HTTP Request Body Parsing Middleware
 *
 * Node.js body parsing middleware.
 * **POLYGLOT SHOWCASE**: Request body parsing for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/body-parser (~40M downloads/week)
 *
 * Features:
 * - JSON body parsing
 * - URL-encoded form parsing
 * - Raw body parsing
 * - Text body parsing
 * - Automatic content-type detection
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need body parsing
 * - ONE parsing logic works everywhere on Elide
 * - Consistent request handling across languages
 * - Share parsing configuration across your stack
 *
 * Use cases:
 * - REST API request handling
 * - Form submissions
 * - JSON API endpoints
 * - File upload preprocessing
 *
 * Package has ~40M downloads/week on npm - essential HTTP middleware!
 */

export interface BodyParserOptions {
  limit?: string | number;
  type?: string | string[] | ((req: any) => boolean);
  strict?: boolean;
  verify?: (req: any, res: any, buf: Buffer, encoding: string) => void;
}

interface Request {
  headers: Record<string, string>;
  body?: any;
  rawBody?: string;
}

/**
 * Parse size limit
 */
function parseLimit(limit: string | number = "100kb"): number {
  if (typeof limit === "number") return limit;

  const match = limit.match(/^(\d+)(kb|mb|gb)?$/i);
  if (!match) return 100 * 1024; // default 100kb

  const value = parseInt(match[1], 10);
  const unit = (match[2] || "").toLowerCase();

  switch (unit) {
    case "gb":
      return value * 1024 * 1024 * 1024;
    case "mb":
      return value * 1024 * 1024;
    case "kb":
      return value * 1024;
    default:
      return value;
  }
}

/**
 * Check if content type matches
 */
function typeMatches(
  contentType: string,
  type: string | string[] | ((req: any) => boolean) | undefined,
  req: any
): boolean {
  if (!type) return true;

  if (typeof type === "function") {
    return type(req);
  }

  const types = Array.isArray(type) ? type : [type];
  return types.some((t) => contentType.includes(t));
}

/**
 * JSON body parser
 */
export function json(options: BodyParserOptions = {}) {
  const limit = parseLimit(options.limit);
  const type = options.type || "application/json";
  const strict = options.strict !== false;

  return function jsonParser(req: Request, res: any, next: () => void) {
    const contentType = req.headers["content-type"] || "";

    if (!typeMatches(contentType, type, req)) {
      return next();
    }

    if (req.rawBody) {
      const bodyStr = req.rawBody;

      if (bodyStr.length > limit) {
        throw new Error("Request body too large");
      }

      try {
        req.body = JSON.parse(bodyStr);
      } catch (err) {
        throw new Error("Invalid JSON");
      }
    }

    next();
  };
}

/**
 * URL-encoded body parser
 */
export function urlencoded(options: BodyParserOptions = {}) {
  const limit = parseLimit(options.limit);
  const type = options.type || "application/x-www-form-urlencoded";
  const extended = (options as any).extended !== false;

  return function urlencodedParser(req: Request, res: any, next: () => void) {
    const contentType = req.headers["content-type"] || "";

    if (!typeMatches(contentType, type, req)) {
      return next();
    }

    if (req.rawBody) {
      const bodyStr = req.rawBody;

      if (bodyStr.length > limit) {
        throw new Error("Request body too large");
      }

      const parsed: Record<string, any> = {};
      const pairs = bodyStr.split("&");

      for (const pair of pairs) {
        const [key, value] = pair.split("=").map(decodeURIComponent);
        if (key) {
          if (extended && key.includes("[")) {
            // Simple array/object parsing for extended mode
            const arrayMatch = key.match(/^(.+)\[\]$/);
            if (arrayMatch) {
              const baseKey = arrayMatch[1];
              if (!parsed[baseKey]) parsed[baseKey] = [];
              parsed[baseKey].push(value);
            } else {
              parsed[key] = value;
            }
          } else {
            parsed[key] = value;
          }
        }
      }

      req.body = parsed;
    }

    next();
  };
}

/**
 * Raw body parser
 */
export function raw(options: BodyParserOptions = {}) {
  const limit = parseLimit(options.limit);
  const type = options.type || "application/octet-stream";

  return function rawParser(req: Request, res: any, next: () => void) {
    const contentType = req.headers["content-type"] || "";

    if (!typeMatches(contentType, type, req)) {
      return next();
    }

    if (req.rawBody) {
      if (req.rawBody.length > limit) {
        throw new Error("Request body too large");
      }
      req.body = req.rawBody;
    }

    next();
  };
}

/**
 * Text body parser
 */
export function text(options: BodyParserOptions = {}) {
  const limit = parseLimit(options.limit);
  const type = options.type || "text/plain";

  return function textParser(req: Request, res: any, next: () => void) {
    const contentType = req.headers["content-type"] || "";

    if (!typeMatches(contentType, type, req)) {
      return next();
    }

    if (req.rawBody) {
      if (req.rawBody.length > limit) {
        throw new Error("Request body too large");
      }
      req.body = req.rawBody;
    }

    next();
  };
}

export default { json, urlencoded, raw, text };

// CLI Demo
if (import.meta.url.includes("elide-body-parser.ts")) {
  console.log("📦 Body Parser - HTTP Request Body Parsing (POLYGLOT!)\n");

  console.log("=== Example 1: JSON Parser ===");
  const jsonParser = json();
  const req1: Request = {
    headers: { "content-type": "application/json" },
    rawBody: '{"name":"Alice","age":30}',
  };
  jsonParser(req1, {}, () => {});
  console.log("Parsed JSON:", req1.body);
  console.log();

  console.log("=== Example 2: URL-Encoded Parser ===");
  const urlParser = urlencoded();
  const req2: Request = {
    headers: { "content-type": "application/x-www-form-urlencoded" },
    rawBody: "name=Bob&email=bob%40example.com&age=25",
  };
  urlParser(req2, {}, () => {});
  console.log("Parsed form data:", req2.body);
  console.log();

  console.log("=== Example 3: Extended URL-Encoded (Arrays) ===");
  const extendedParser = urlencoded({ extended: true } as any);
  const req3: Request = {
    headers: { "content-type": "application/x-www-form-urlencoded" },
    rawBody: "tags[]=javascript&tags[]=typescript&tags[]=nodejs",
  };
  extendedParser(req3, {}, () => {});
  console.log("Parsed arrays:", req3.body);
  console.log();

  console.log("=== Example 4: Text Parser ===");
  const textParser = text();
  const req4: Request = {
    headers: { "content-type": "text/plain" },
    rawBody: "Plain text content",
  };
  textParser(req4, {}, () => {});
  console.log("Parsed text:", req4.body);
  console.log();

  console.log("=== Example 5: Size Limits ===");
  const limitedParser = json({ limit: "1kb" });
  const req5: Request = {
    headers: { "content-type": "application/json" },
    rawBody: '{"data":"' + "x".repeat(2000) + '"}',
  };
  try {
    limitedParser(req5, {}, () => {});
  } catch (err: any) {
    console.log("Error:", err.message);
  }
  console.log();

  console.log("=== Example 6: Custom Content Types ===");
  const customParser = json({ type: "application/vnd.api+json" });
  const req6: Request = {
    headers: { "content-type": "application/vnd.api+json" },
    rawBody: '{"type":"articles","id":"1"}',
  };
  customParser(req6, {}, () => {});
  console.log("Custom type:", req6.body);
  console.log();

  console.log("=== Example 7: Multiple Types ===");
  const multiParser = json({ type: ["application/json", "application/vnd.api+json"] });
  const req7a: Request = {
    headers: { "content-type": "application/json" },
    rawBody: '{"standard":true}',
  };
  const req7b: Request = {
    headers: { "content-type": "application/vnd.api+json" },
    rawBody: '{"custom":true}',
  };
  multiParser(req7a, {}, () => {});
  multiParser(req7b, {}, () => {});
  console.log("Standard JSON:", req7a.body);
  console.log("Custom JSON:", req7b.body);
  console.log();

  console.log("=== Example 8: Invalid JSON Handling ===");
  const invalidParser = json();
  const req8: Request = {
    headers: { "content-type": "application/json" },
    rawBody: "{invalid json}",
  };
  try {
    invalidParser(req8, {}, () => {});
  } catch (err: any) {
    console.log("Error:", err.message);
  }
  console.log();

  console.log("=== Example 9: Parsing Nested Objects ===");
  const nestedParser = json();
  const req9: Request = {
    headers: { "content-type": "application/json" },
    rawBody: '{"user":{"name":"Charlie","address":{"city":"NYC"}}}',
  };
  nestedParser(req9, {}, () => {});
  console.log("Nested:", req9.body);
  console.log();

  console.log("=== Example 10: Form with Special Characters ===");
  const specialParser = urlencoded();
  const req10: Request = {
    headers: { "content-type": "application/x-www-form-urlencoded" },
    rawBody: "message=Hello%20World%21&email=test%40example.com",
  };
  specialParser(req10, {}, () => {});
  console.log("Decoded:", req10.body);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- REST API request handling");
  console.log("- Form submissions");
  console.log("- JSON API endpoints");
  console.log("- File upload preprocessing");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast parsing");
  console.log("- ~40M downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Same parsing logic across languages");
  console.log("- Consistent request handling");
  console.log("- Share parser configuration");
}
