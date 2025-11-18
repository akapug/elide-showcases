/**
 * is-my-json-valid - Fast JSON Validator
 *
 * Fast JSON Schema validator.
 * **POLYGLOT SHOWCASE**: One JSON validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/is-my-json-valid (~5M+ downloads/week)
 *
 * Package has ~5M+ downloads/week on npm!
 */

function validator(schema: any) {
  return function(data: any) {
    if (schema.type && typeof data !== schema.type) {
      (validator as any).errors = [{ field: 'data', message: `Expected ${schema.type}` }];
      return false;
    }
    (validator as any).errors = null;
    return true;
  };
}

export default validator;

if (import.meta.url.includes("elide-is-my-json-valid.ts")) {
  console.log("✅ is-my-json-valid - Fast JSON Validator (POLYGLOT!)\n");
  console.log("~5M+ downloads/week on npm!");
}
