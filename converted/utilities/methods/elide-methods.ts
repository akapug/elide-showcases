/**
 * Methods - HTTP Methods
 *
 * HTTP verbs that Node.js core's HTTP parser supports.
 * **POLYGLOT SHOWCASE**: HTTP methods for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/methods (~30M downloads/week)
 *
 * Features:
 * - Complete list of HTTP methods
 * - Method validation
 * - Case-insensitive checking
 * - Standard and custom methods
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need HTTP method handling
 * - ONE method list works everywhere on Elide
 * - Consistent HTTP conventions across languages
 * - Share method validation across your stack
 *
 * Use cases:
 * - Route handling
 * - Method validation
 * - API documentation
 * - Request filtering
 *
 * Package has ~30M downloads/week on npm - essential HTTP utility!
 */

/**
 * HTTP methods supported by Node.js
 */
export const methods: string[] = [
  "ACL",
  "BIND",
  "CHECKOUT",
  "CONNECT",
  "COPY",
  "DELETE",
  "GET",
  "HEAD",
  "LINK",
  "LOCK",
  "M-SEARCH",
  "MERGE",
  "MKACTIVITY",
  "MKCALENDAR",
  "MKCOL",
  "MOVE",
  "NOTIFY",
  "OPTIONS",
  "PATCH",
  "POST",
  "PROPFIND",
  "PROPPATCH",
  "PURGE",
  "PUT",
  "REBIND",
  "REPORT",
  "SEARCH",
  "SOURCE",
  "SUBSCRIBE",
  "TRACE",
  "UNBIND",
  "UNLINK",
  "UNLOCK",
  "UNSUBSCRIBE",
];

/**
 * Common HTTP methods
 */
export const common: string[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

/**
 * Safe HTTP methods (no side effects)
 */
export const safe: string[] = ["GET", "HEAD", "OPTIONS"];

/**
 * Idempotent HTTP methods
 */
export const idempotent: string[] = ["GET", "HEAD", "PUT", "DELETE", "OPTIONS", "TRACE"];

/**
 * Check if a method is valid
 */
export function isValid(method: string): boolean {
  return methods.includes(method.toUpperCase());
}

/**
 * Check if a method is safe
 */
export function isSafe(method: string): boolean {
  return safe.includes(method.toUpperCase());
}

/**
 * Check if a method is idempotent
 */
export function isIdempotent(method: string): boolean {
  return idempotent.includes(method.toUpperCase());
}

/**
 * Normalize method name
 */
export function normalize(method: string): string {
  return method.toUpperCase();
}

export default methods;

// CLI Demo
if (import.meta.url.includes("elide-methods.ts")) {
  console.log("🔤 Methods - HTTP Methods (POLYGLOT!)\n");

  console.log("=== Example 1: All HTTP Methods ===");
  console.log(`Total methods: ${methods.length}`);
  console.log("Methods:", methods.slice(0, 10).join(", ") + ", ...");
  console.log();

  console.log("=== Example 2: Common Methods ===");
  console.log("Common:", common.join(", "));
  console.log();

  console.log("=== Example 3: Safe Methods ===");
  console.log("Safe (no side effects):", safe.join(", "));
  console.log();

  console.log("=== Example 4: Idempotent Methods ===");
  console.log("Idempotent:", idempotent.join(", "));
  console.log();

  console.log("=== Example 5: Method Validation ===");
  const testMethods = ["GET", "POST", "INVALID", "DELETE", "CUSTOM"];
  testMethods.forEach((method) => {
    console.log(`  ${method}: ${isValid(method) ? "✓ valid" : "✗ invalid"}`);
  });
  console.log();

  console.log("=== Example 6: Safe Method Check ===");
  const safeMethods = ["GET", "POST", "HEAD", "DELETE"];
  safeMethods.forEach((method) => {
    console.log(`  ${method}: ${isSafe(method) ? "✓ safe" : "✗ not safe"}`);
  });
  console.log();

  console.log("=== Example 7: Idempotency Check ===");
  const idempotentMethods = ["GET", "POST", "PUT", "DELETE"];
  idempotentMethods.forEach((method) => {
    console.log(`  ${method}: ${isIdempotent(method) ? "✓ idempotent" : "✗ not idempotent"}`);
  });
  console.log();

  console.log("=== Example 8: Normalize Methods ===");
  const mixedCase = ["get", "Post", "DELETE", "pAtCh"];
  mixedCase.forEach((method) => {
    console.log(`  ${method} => ${normalize(method)}`);
  });
  console.log();

  console.log("=== Example 9: Route Handler ===");
  function createRoute(method: string, path: string, handler: Function) {
    if (!isValid(method)) {
      return { error: "Invalid HTTP method" };
    }
    return {
      method: normalize(method),
      path,
      handler: handler.name,
      safe: isSafe(method),
      idempotent: isIdempotent(method),
    };
  }

  const routes = [
    createRoute("GET", "/users", function getUsers() {}),
    createRoute("POST", "/users", function createUser() {}),
    createRoute("PUT", "/users/:id", function updateUser() {}),
    createRoute("DELETE", "/users/:id", function deleteUser() {}),
  ];

  routes.forEach((route: any) => {
    console.log(`  ${route.method} ${route.path} - safe: ${route.safe}, idempotent: ${route.idempotent}`);
  });
  console.log();

  console.log("=== Example 10: Method-Based Caching ===");
  function shouldCache(method: string): boolean {
    return isSafe(method);
  }

  common.forEach((method) => {
    console.log(`  ${method}: ${shouldCache(method) ? "✓ cacheable" : "✗ not cacheable"}`);
  });
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Route handling");
  console.log("- Method validation");
  console.log("- API documentation");
  console.log("- Request filtering");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast lookups");
  console.log("- ~30M downloads/week on npm");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Same method list across languages");
  console.log("- Consistent HTTP conventions");
  console.log("- Share validation logic");
}
