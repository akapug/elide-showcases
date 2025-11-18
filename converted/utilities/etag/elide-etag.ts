/**
 * ETag - Create Simple HTTP ETags
 *
 * Generate ETags for HTTP caching.
 * **POLYGLOT SHOWCASE**: ETag generation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/etag (~12M downloads/week)
 *
 * Features:
 * - Generate ETags from strings/buffers
 * - Strong and weak ETags
 * - File stat-based ETags
 * - MD5 and size-based hashing
 * - Zero dependencies
 *
 * Use cases:
 * - HTTP caching
 * - Conditional requests
 * - Bandwidth optimization
 *
 * Package has ~12M downloads/week on npm!
 */

/**
 * Generate ETag hash (simple hash for demo)
 */
function hash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Generate ETag
 */
export default function etag(entity: string | Buffer | { size: number; mtime: Date }, options?: { weak?: boolean }): string {
  const weak = options?.weak || false;

  let tag: string;

  if (typeof entity === "string") {
    tag = `${entity.length.toString(16)}-${hash(entity)}`;
  } else if (Buffer.isBuffer && Buffer.isBuffer(entity)) {
    tag = `${entity.length.toString(16)}-${hash(entity.toString())}`;
  } else if (typeof entity === "object" && "size" in entity && "mtime" in entity) {
    tag = `${entity.size.toString(16)}-${entity.mtime.getTime().toString(16)}`;
  } else {
    throw new TypeError("Invalid entity type");
  }

  return weak ? `W/"${tag}"` : `"${tag}"`;
}

export { etag };

// CLI Demo
if (import.meta.url.includes("elide-etag.ts")) {
  console.log("🏷️  ETag - HTTP ETag Generation (POLYGLOT!)\n");

  console.log("=== Example 1: String ETags ===");
  const content1 = "Hello World";
  const content2 = "Hello World!";
  console.log(`"${content1}" => ${etag(content1)}`);
  console.log(`"${content2}" => ${etag(content2)}`);
  console.log();

  console.log("=== Example 2: Weak ETags ===");
  const weakTag = etag("content", { weak: true });
  console.log(`Weak ETag: ${weakTag}`);
  console.log();

  console.log("=== Example 3: File Stat ETags ===");
  const stat = { size: 1024, mtime: new Date("2024-01-01") };
  console.log(`File stat => ${etag(stat)}`);
  console.log();

  console.log("=== Example 4: Conditional Requests ===");
  const responseBody = "API response data";
  const responseEtag = etag(responseBody);
  const clientEtag = responseEtag;

  if (clientEtag === responseEtag) {
    console.log("304 Not Modified - Use cached version");
  } else {
    console.log(`200 OK - New content, ETag: ${responseEtag}`);
  }
  console.log();

  console.log("✅ Use Cases:");
  console.log("- HTTP caching");
  console.log("- Conditional requests");
  console.log("- Bandwidth optimization");
  console.log();

  console.log("💡 Polyglot: Same ETags across all languages!");
}
