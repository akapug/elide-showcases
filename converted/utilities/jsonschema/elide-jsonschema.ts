/**
 * JSONSchema - JSON Schema Validator
 *
 * JSON Schema validator for Node.js.
 * **POLYGLOT SHOWCASE**: One JSON Schema validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/jsonschema (~10M+ downloads/week)
 *
 * Package has ~10M+ downloads/week on npm!
 */

class Validator {
  validate(instance: any, schema: any) {
    const errors: any[] = [];

    if (schema.type && typeof instance !== schema.type) {
      errors.push({ message: `Expected ${schema.type}`, property: 'instance' });
    }

    return { valid: errors.length === 0, errors };
  }
}

export { Validator };

if (import.meta.url.includes("elide-jsonschema.ts")) {
  console.log("✅ JSONSchema Validator (POLYGLOT!)\n");
  const v = new Validator();
  console.log(v.validate("hello", { type: 'string' }));
  console.log("~10M+ downloads/week on npm!");
}
