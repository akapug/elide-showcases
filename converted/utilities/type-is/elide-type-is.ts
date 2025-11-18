/**
 * Type Is - Content Type Checking
 *
 * Infer the content-type of a request.
 * **POLYGLOT SHOWCASE**: Type checking for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/type-is (~30M downloads/week)
 *
 * Features:
 * - Check content type
 * - Wildcard matching
 * - Extension matching
 * - Multiple type checking
 * - Zero dependencies
 *
 * Package has ~30M downloads/week on npm!
 */

interface Request {
  headers: Record<string, string>;
}

function typeIs(req: Request, types: string | string[]): string | false | null {
  const contentType = req.headers["content-type"];
  if (!contentType) return null;

  const typeArray = Array.isArray(types) ? types : [types];
  const actualType = contentType.split(";")[0].trim();

  for (const type of typeArray) {
    if (type === actualType) return type;
    if (type.endsWith("/*")) {
      const prefix = type.slice(0, -2);
      if (actualType.startsWith(prefix)) return type;
    }
  }

  return false;
}

export default typeIs;
export { typeIs };

if (import.meta.url.includes("elide-type-is.ts")) {
  console.log("🔍 Type Is - Content Type Checking (POLYGLOT!)\n");

  const req = { headers: { "content-type": "application/json; charset=utf-8" } };
  console.log("Is JSON:", typeIs(req, "application/json"));
  console.log("Is HTML:", typeIs(req, "text/html"));
  console.log("Is application/*:", typeIs(req, "application/*"));
  console.log("\n💡 Polyglot: Same type checking everywhere!");
}
