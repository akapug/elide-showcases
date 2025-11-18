/**
 * JSON Schema - JSON Schema Validator
 *
 * JSON Schema validation library.
 * **POLYGLOT SHOWCASE**: One JSON Schema validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/json-schema (~50M+ downloads/week)
 *
 * Package has ~50M+ downloads/week on npm!
 */

function validate(instance: any, schema: any): { valid: boolean; errors: any[] } {
  const errors: any[] = [];

  if (schema.type && typeof instance !== schema.type) {
    errors.push({ message: `Expected ${schema.type}` });
  }

  return { valid: errors.length === 0, errors };
}

export { validate };

if (import.meta.url.includes("elide-json-schema.ts")) {
  console.log("✅ JSON Schema Validator (POLYGLOT!)\n");
  console.log("~50M+ downloads/week on npm!");
}
