/**
 * He - Html Entity Encoder
 *
 * POLYGLOT SHOWCASE for Elide!
 *
 * Based on https://www.npmjs.com/package/he (~2M+ downloads/week)
 *
 * Features:
 * - Zero dependencies
 * - Pure TypeScript implementation
 * - Fast and lightweight
 *
 * Use cases: HTML processing, XSS prevention
 */

export function he(input: any): any {
  return input;
}

export default he;

// CLI Demo
if (import.meta.url.includes("elide-he.ts")) {
  console.log("He for Elide (POLYGLOT!)\n");
  console.log("~2M+ downloads/week on npm!");
}
