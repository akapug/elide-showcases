/**
 * Encode URL - Encode URL to Percent-Encoded Form
 *
 * Encode a URL to a percent-encoded form.
 * **POLYGLOT SHOWCASE**: URL encoding for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/encodeurl (~20M downloads/week)
 *
 * Features:
 * - Encode URLs safely
 * - Preserve already encoded URLs
 * - Handle special characters
 * - RFC 3986 compliant
 * - Zero dependencies
 *
 * Use cases:
 * - URL generation
 * - Redirect handling
 * - API endpoints
 * - Query parameters
 *
 * Package has ~20M downloads/week on npm!
 */

const ENCODE_CHARS_REGEXP = /(?:[^\x21\x23-\x3B\x3D\x3F-\x5F\x61-\x7A\x7C\x7E]|%(?![0-9A-Fa-f]{2}))+/g;
const UNMATCHED_SURROGATE_PAIR_REGEXP = /(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]|[\uD800-\uDBFF]([^\uDC00-\uDFFF]|$)/g;
const UNMATCHED_SURROGATE_PAIR_REPLACE = "$1\uFFFD$2";

/**
 * Encode URL
 */
export default function encodeUrl(url: string): string {
  return String(url)
    .replace(UNMATCHED_SURROGATE_PAIR_REGEXP, UNMATCHED_SURROGATE_PAIR_REPLACE)
    .replace(ENCODE_CHARS_REGEXP, encodeURIComponent);
}

export { encodeUrl };

// CLI Demo
if (import.meta.url.includes("elide-encodeurl.ts")) {
  console.log("🔗 Encode URL - URL Encoding (POLYGLOT!)\n");

  console.log("=== Example 1: Basic URL ===");
  console.log(encodeUrl("http://example.com/path"));
  console.log();

  console.log("=== Example 2: URL with Spaces ===");
  console.log(encodeUrl("http://example.com/hello world"));
  console.log();

  console.log("=== Example 3: Special Characters ===");
  console.log(encodeUrl("http://example.com/café"));
  console.log();

  console.log("=== Example 4: Query Parameters ===");
  console.log(encodeUrl("http://example.com?name=John Doe&city=New York"));
  console.log();

  console.log("=== Example 5: Already Encoded ===");
  console.log(encodeUrl("http://example.com/hello%20world"));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- URL generation");
  console.log("- Redirect handling");
  console.log("- API endpoints");
  console.log();

  console.log("💡 Polyglot: Same encoding across all languages!");
}
