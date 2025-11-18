/**
 * Vary - Manage Vary Header
 *
 * Manipulate the HTTP Vary header.
 * **POLYGLOT SHOWCASE**: Vary header handling for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/vary (~15M downloads/week)
 *
 * Features:
 * - Append to Vary header
 * - Parse Vary header
 * - Merge Vary values
 * - Case-insensitive handling
 * - Zero dependencies
 *
 * Use cases:
 * - HTTP caching
 * - Content negotiation
 * - CDN configuration
 *
 * Package has ~15M downloads/week on npm!
 */

/**
 * Parse Vary header
 */
function parse(header: string): string[] {
  return header
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Append to Vary header
 */
export default function vary(header: string | undefined, field: string | string[]): string {
  const fields = Array.isArray(field) ? field : [field];
  const current = header ? parse(header) : [];
  const currentLower = current.map((s) => s.toLowerCase());

  for (const f of fields) {
    if (f === "*") return "*";
    if (!currentLower.includes(f.toLowerCase())) {
      current.push(f);
      currentLower.push(f.toLowerCase());
    }
  }

  return current.join(", ");
}

export { vary };

// CLI Demo
if (import.meta.url.includes("elide-vary.ts")) {
  console.log("🔄 Vary - HTTP Vary Header Management (POLYGLOT!)\n");

  console.log("=== Example 1: Append to Vary ===");
  let varyHeader = vary(undefined, "Accept");
  console.log(`Initial: ${varyHeader}`);
  varyHeader = vary(varyHeader, "Accept-Encoding");
  console.log(`Added encoding: ${varyHeader}`);
  varyHeader = vary(varyHeader, "Accept-Language");
  console.log(`Added language: ${varyHeader}`);
  console.log();

  console.log("=== Example 2: Multiple Fields ===");
  const multi = vary(undefined, ["Accept", "Accept-Encoding", "Accept-Language"]);
  console.log(`Multiple: ${multi}`);
  console.log();

  console.log("=== Example 3: Wildcard ===");
  const wildcard = vary("Accept", "*");
  console.log(`Wildcard: ${wildcard}`);
  console.log();

  console.log("=== Example 4: Duplicate Prevention ===");
  let dup = vary(undefined, "Accept");
  dup = vary(dup, "Accept");
  dup = vary(dup, "accept");
  console.log(`No duplicates: ${dup}`);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- HTTP caching strategies");
  console.log("- Content negotiation");
  console.log("- CDN configuration");
  console.log();

  console.log("💡 Polyglot: Same Vary logic across all languages!");
}
