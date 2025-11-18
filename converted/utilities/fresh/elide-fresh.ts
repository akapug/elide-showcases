/**
 * Fresh - HTTP Freshness Testing
 *
 * HTTP response freshness testing.
 * **POLYGLOT SHOWCASE**: Cache freshness for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/fresh (~12M downloads/week)
 *
 * Features:
 * - Check if response is fresh
 * - ETag comparison
 * - Last-Modified comparison
 * - Cache-Control support
 * - Zero dependencies
 *
 * Use cases:
 * - HTTP caching
 * - 304 Not Modified responses
 * - Bandwidth optimization
 *
 * Package has ~12M downloads/week on npm!
 */

interface RequestHeaders {
  "if-none-match"?: string;
  "if-modified-since"?: string;
  "cache-control"?: string;
}

interface ResponseHeaders {
  etag?: string;
  "last-modified"?: string;
}

/**
 * Check if response is fresh
 */
export default function fresh(reqHeaders: RequestHeaders, resHeaders: ResponseHeaders): boolean {
  const noneMatch = reqHeaders["if-none-match"];
  const modifiedSince = reqHeaders["if-modified-since"];
  const cacheControl = reqHeaders["cache-control"];

  // No conditional headers
  if (!noneMatch && !modifiedSince) {
    return false;
  }

  // Cache-Control: no-cache
  if (cacheControl && cacheControl.includes("no-cache")) {
    return false;
  }

  // ETag comparison
  if (noneMatch && resHeaders.etag) {
    const etags = noneMatch.split(",").map((s) => s.trim());
    if (!etags.includes(resHeaders.etag)) {
      return false;
    }
  }

  // Last-Modified comparison
  if (modifiedSince && resHeaders["last-modified"]) {
    const modifiedTime = new Date(modifiedSince).getTime();
    const lastModified = new Date(resHeaders["last-modified"]).getTime();

    if (lastModified > modifiedTime) {
      return false;
    }
  }

  return true;
}

export { fresh };

// CLI Demo
if (import.meta.url.includes("elide-fresh.ts")) {
  console.log("🌱 Fresh - HTTP Freshness Testing (POLYGLOT!)\n");

  console.log("=== Example 1: ETag Match ===");
  const reqHeaders1 = { "if-none-match": '"abc123"' };
  const resHeaders1 = { etag: '"abc123"' };
  console.log(`Fresh: ${fresh(reqHeaders1, resHeaders1)}`);
  console.log();

  console.log("=== Example 2: ETag Mismatch ===");
  const reqHeaders2 = { "if-none-match": '"abc123"' };
  const resHeaders2 = { etag: '"def456"' };
  console.log(`Fresh: ${fresh(reqHeaders2, resHeaders2)}`);
  console.log();

  console.log("=== Example 3: Last-Modified ===");
  const reqHeaders3 = { "if-modified-since": "Wed, 21 Oct 2024 07:28:00 GMT" };
  const resHeaders3 = { "last-modified": "Wed, 21 Oct 2024 07:00:00 GMT" };
  console.log(`Fresh: ${fresh(reqHeaders3, resHeaders3)}`);
  console.log();

  console.log("=== Example 4: Cache-Control no-cache ===");
  const reqHeaders4 = { "if-none-match": '"abc123"', "cache-control": "no-cache" };
  const resHeaders4 = { etag: '"abc123"' };
  console.log(`Fresh: ${fresh(reqHeaders4, resHeaders4)}`);
  console.log();

  console.log("=== Example 5: 304 Not Modified ===");
  function handleRequest(req: RequestHeaders, res: ResponseHeaders) {
    if (fresh(req, res)) {
      return { status: 304, body: null };
    }
    return { status: 200, body: "Content here" };
  }

  const result = handleRequest({ "if-none-match": '"v1"' }, { etag: '"v1"' });
  console.log(`Response:`, result);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- HTTP caching");
  console.log("- 304 Not Modified responses");
  console.log("- Bandwidth optimization");
  console.log();

  console.log("💡 Polyglot: Same freshness logic across all languages!");
}
