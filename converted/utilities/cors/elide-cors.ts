/**
 * CORS - Cross-Origin Resource Sharing Middleware
 *
 * Node.js CORS middleware for enabling CORS with various options.
 * **POLYGLOT SHOWCASE**: CORS handling for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/cors (~40M downloads/week)
 *
 * Features:
 * - Enable CORS for all routes
 * - Configure allowed origins
 * - Custom headers and methods
 * - Credentials support
 * - Preflight request handling
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need CORS handling
 * - ONE CORS policy works everywhere on Elide
 * - Consistent security across languages
 * - Share CORS configuration across your stack
 *
 * Use cases:
 * - REST API security
 * - Frontend-backend separation
 * - Microservices communication
 * - Third-party API integration
 *
 * Package has ~40M downloads/week on npm - essential security middleware!
 */

export interface CorsOptions {
  origin?: string | string[] | boolean | ((origin: string) => boolean);
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

interface Request {
  method: string;
  headers: Record<string, string>;
}

interface Response {
  headers: Record<string, string>;
  statusCode?: number;
  setHeader(name: string, value: string): void;
  end?: () => void;
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string, allowedOrigin: CorsOptions["origin"]): boolean {
  if (allowedOrigin === true) return true;
  if (allowedOrigin === false) return false;

  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.includes(origin);
  }

  if (typeof allowedOrigin === "string") {
    return origin === allowedOrigin;
  }

  if (typeof allowedOrigin === "function") {
    return allowedOrigin(origin);
  }

  return true;
}

/**
 * Configure CORS headers
 */
function configureCors(req: Request, res: Response, options: CorsOptions = {}): void {
  const {
    origin = "*",
    methods = "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders,
    exposedHeaders,
    credentials = false,
    maxAge,
    optionsSuccessStatus = 204,
  } = options;

  const requestOrigin = req.headers["origin"] || "";

  // Handle origin
  if (typeof origin === "boolean") {
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", requestOrigin || "*");
    }
  } else if (isOriginAllowed(requestOrigin, origin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin || "*");
  } else if (origin === "*") {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  // Handle credentials
  if (credentials) {
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  // Handle preflight request
  if (req.method === "OPTIONS") {
    // Methods
    const methodsStr = Array.isArray(methods) ? methods.join(",") : methods;
    res.setHeader("Access-Control-Allow-Methods", methodsStr);

    // Headers
    if (allowedHeaders) {
      const headersStr = Array.isArray(allowedHeaders)
        ? allowedHeaders.join(",")
        : allowedHeaders;
      res.setHeader("Access-Control-Allow-Headers", headersStr);
    } else {
      const requestHeaders = req.headers["access-control-request-headers"];
      if (requestHeaders) {
        res.setHeader("Access-Control-Allow-Headers", requestHeaders);
      }
    }

    // Max age
    if (maxAge !== undefined) {
      res.setHeader("Access-Control-Max-Age", maxAge.toString());
    }

    res.statusCode = optionsSuccessStatus;
  }

  // Exposed headers
  if (exposedHeaders) {
    const exposedStr = Array.isArray(exposedHeaders)
      ? exposedHeaders.join(",")
      : exposedHeaders;
    res.setHeader("Access-Control-Expose-Headers", exposedStr);
  }
}

/**
 * Create CORS middleware
 */
export default function cors(options?: CorsOptions) {
  return function corsMiddleware(req: Request, res: Response, next?: () => void) {
    configureCors(req, res, options);

    if (req.method === "OPTIONS" && !options?.preflightContinue) {
      if (res.end) res.end();
      return;
    }

    if (next) next();
  };
}

export { cors };

// CLI Demo
if (import.meta.url.includes("elide-cors.ts")) {
  console.log("🔒 CORS - Cross-Origin Resource Sharing (POLYGLOT!)\n");

  console.log("=== Example 1: Allow All Origins ===");
  const middleware1 = cors();
  const req1: Request = {
    method: "GET",
    headers: { origin: "https://example.com" },
  };
  const res1: Response = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  middleware1(req1, res1);
  console.log("Headers:", res1.headers);
  console.log();

  console.log("=== Example 2: Specific Origin ===");
  const middleware2 = cors({ origin: "https://trusted.com" });
  const req2: Request = {
    method: "GET",
    headers: { origin: "https://trusted.com" },
  };
  const res2: Response = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  middleware2(req2, res2);
  console.log("Allowed origin:", res2.headers);
  console.log();

  console.log("=== Example 3: Multiple Origins ===");
  const middleware3 = cors({
    origin: ["https://app1.com", "https://app2.com"],
  });
  const req3a: Request = {
    method: "GET",
    headers: { origin: "https://app1.com" },
  };
  const req3b: Request = {
    method: "GET",
    headers: { origin: "https://evil.com" },
  };
  const res3a: Response = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  const res3b: Response = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  middleware3(req3a, res3a);
  middleware3(req3b, res3b);
  console.log("Trusted app:", res3a.headers);
  console.log("Untrusted app:", res3b.headers);
  console.log();

  console.log("=== Example 4: With Credentials ===");
  const middleware4 = cors({
    origin: "https://app.com",
    credentials: true,
  });
  const req4: Request = {
    method: "GET",
    headers: { origin: "https://app.com" },
  };
  const res4: Response = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  middleware4(req4, res4);
  console.log("With credentials:", res4.headers);
  console.log();

  console.log("=== Example 5: Preflight Request ===");
  const middleware5 = cors({
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  });
  const req5: Request = {
    method: "OPTIONS",
    headers: {
      origin: "https://app.com",
      "access-control-request-method": "POST",
      "access-control-request-headers": "content-type",
    },
  };
  const res5: Response = {
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  middleware5(req5, res5);
  console.log("Preflight response:", res5.headers);
  console.log("Status code:", res5.statusCode);
  console.log();

  console.log("=== Example 6: Custom Methods ===");
  const middleware6 = cors({
    methods: "GET,POST,DELETE",
  });
  const req6: Request = {
    method: "OPTIONS",
    headers: { origin: "https://app.com" },
  };
  const res6: Response = {
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  middleware6(req6, res6);
  console.log("Allowed methods:", res6.headers["Access-Control-Allow-Methods"]);
  console.log();

  console.log("=== Example 7: Exposed Headers ===");
  const middleware7 = cors({
    exposedHeaders: ["X-Total-Count", "X-Page-Number"],
  });
  const req7: Request = {
    method: "GET",
    headers: { origin: "https://app.com" },
  };
  const res7: Response = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  middleware7(req7, res7);
  console.log("Exposed headers:", res7.headers["Access-Control-Expose-Headers"]);
  console.log();

  console.log("=== Example 8: Dynamic Origin Check ===");
  const middleware8 = cors({
    origin: (origin: string) => origin.endsWith(".myapp.com"),
  });
  const req8a: Request = {
    method: "GET",
    headers: { origin: "https://api.myapp.com" },
  };
  const req8b: Request = {
    method: "GET",
    headers: { origin: "https://evil.com" },
  };
  const res8a: Response = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  const res8b: Response = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  middleware8(req8a, res8a);
  middleware8(req8b, res8b);
  console.log("Subdomain allowed:", res8a.headers);
  console.log("External blocked:", res8b.headers);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- REST API security");
  console.log("- Frontend-backend separation");
  console.log("- Microservices communication");
  console.log("- Third-party API integration");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Lightweight middleware");
  console.log("- ~40M downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use same CORS policy across languages");
  console.log("- Consistent security everywhere");
  console.log("- Share CORS configuration");
}
