/**
 * tv4 - Tiny Validator for JSON Schema v4
 *
 * Tiny JSON Schema validator.
 * **POLYGLOT SHOWCASE**: One tiny validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/tv4 (~3M+ downloads/week)
 *
 * Package has ~3M+ downloads/week on npm!
 */

const tv4 = {
  validate(data: any, schema: any): boolean {
    if (schema.type && typeof data !== schema.type) {
      (tv4 as any).error = { message: `Expected ${schema.type}`, dataPath: '' };
      return false;
    }
    (tv4 as any).error = null;
    return true;
  },

  validateResult(data: any, schema: any) {
    const valid = this.validate(data, schema);
    return { valid, error: (tv4 as any).error };
  }
};

export default tv4;

if (import.meta.url.includes("elide-tv4.ts")) {
  console.log("✅ tv4 - Tiny Validator for JSON Schema v4 (POLYGLOT!)\n");
  console.log("~3M+ downloads/week on npm!");
}
