/**
 * Helmet - Security Headers Middleware
 *
 * Help secure Express apps with various HTTP headers.
 * **POLYGLOT SHOWCASE**: Security headers for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/helmet (~10M downloads/week)
 *
 * Features:
 * - Content Security Policy
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Strict-Transport-Security
 * - X-XSS-Protection
 * - Zero dependencies
 *
 * Use cases:
 * - Web application security
 * - XSS prevention
 * - Clickjacking protection
 * - HTTPS enforcement
 *
 * Package has ~10M downloads/week on npm!
 */

interface Request {}

interface Response {
  setHeader(name: string, value: string): void;
}

export interface HelmetOptions {
  contentSecurityPolicy?: boolean | { directives?: Record<string, string[]> };
  dnsPrefetchControl?: boolean;
  frameguard?: boolean | { action?: string };
  hsts?: boolean | { maxAge?: number; includeSubDomains?: boolean };
  ieNoOpen?: boolean;
  noSniff?: boolean;
  xssFilter?: boolean;
  hidePoweredBy?: boolean;
}

/**
 * Set security headers
 */
function setSecurityHeaders(res: Response, options: HelmetOptions = {}) {
  const {
    contentSecurityPolicy = true,
    dnsPrefetchControl = true,
    frameguard = true,
    hsts = true,
    ieNoOpen = true,
    noSniff = true,
    xssFilter = true,
    hidePoweredBy = true,
  } = options;

  // Content-Security-Policy
  if (contentSecurityPolicy) {
    const directives =
      typeof contentSecurityPolicy === "object" && contentSecurityPolicy.directives
        ? contentSecurityPolicy.directives
        : {
            "default-src": ["'self'"],
            "script-src": ["'self'"],
            "style-src": ["'self'", "'unsafe-inline'"],
          };

    const cspValue = Object.entries(directives)
      .map(([key, values]) => `${key} ${values.join(" ")}`)
      .join("; ");

    res.setHeader("Content-Security-Policy", cspValue);
  }

  // X-DNS-Prefetch-Control
  if (dnsPrefetchControl) {
    res.setHeader("X-DNS-Prefetch-Control", "off");
  }

  // X-Frame-Options
  if (frameguard) {
    const action =
      typeof frameguard === "object" && frameguard.action ? frameguard.action : "SAMEORIGIN";
    res.setHeader("X-Frame-Options", action);
  }

  // Strict-Transport-Security
  if (hsts) {
    const maxAge = typeof hsts === "object" && hsts.maxAge ? hsts.maxAge : 15552000;
    const includeSubDomains =
      typeof hsts === "object" ? hsts.includeSubDomains !== false : true;
    const hstsValue = `max-age=${maxAge}${includeSubDomains ? "; includeSubDomains" : ""}`;
    res.setHeader("Strict-Transport-Security", hstsValue);
  }

  // X-Download-Options
  if (ieNoOpen) {
    res.setHeader("X-Download-Options", "noopen");
  }

  // X-Content-Type-Options
  if (noSniff) {
    res.setHeader("X-Content-Type-Options", "nosniff");
  }

  // X-XSS-Protection
  if (xssFilter) {
    res.setHeader("X-XSS-Protection", "1; mode=block");
  }

  // Remove X-Powered-By
  if (hidePoweredBy) {
    res.setHeader("X-Powered-By", "");
  }
}

/**
 * Helmet middleware
 */
export default function helmet(options?: HelmetOptions) {
  return function helmetMiddleware(req: Request, res: Response, next: () => void) {
    setSecurityHeaders(res, options);
    next();
  };
}

export { helmet };

// CLI Demo
if (import.meta.url.includes("elide-helmet.ts")) {
  console.log("⛑️  Helmet - Security Headers Middleware (POLYGLOT!)\n");

  const mockRes: Response = {
    setHeader(name: string, value: string) {
      console.log(`  ${name}: ${value}`);
    },
  };

  console.log("=== Example 1: Default Settings ===");
  const middleware1 = helmet();
  middleware1({}, mockRes, () => {});
  console.log();

  console.log("=== Example 2: Custom CSP ===");
  const middleware2 = helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "https://cdn.example.com"],
        "img-src": ["'self'", "data:", "https:"],
      },
    },
  });
  middleware2({}, mockRes, () => {});
  console.log();

  console.log("=== Example 3: Custom HSTS ===");
  const middleware3 = helmet({
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  });
  middleware3({}, mockRes, () => {});
  console.log();

  console.log("=== Example 4: Disable Specific Headers ===");
  const middleware4 = helmet({
    xssFilter: false,
    frameguard: false,
  });
  middleware4({}, mockRes, () => {});
  console.log();

  console.log("=== Example 5: DENY Frame Options ===");
  const middleware5 = helmet({
    frameguard: { action: "DENY" },
  });
  middleware5({}, mockRes, () => {});
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Web application security");
  console.log("- XSS prevention");
  console.log("- Clickjacking protection");
  console.log("- HTTPS enforcement");
  console.log();

  console.log("💡 Polyglot: Same security headers across all languages!");
}
