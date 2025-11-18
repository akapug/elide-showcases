/**
 * TypeBox - JSON Schema Type Builder
 *
 * JSON Schema type builder for TypeScript.
 * **POLYGLOT SHOWCASE**: One type builder for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@sinclair/typebox (~2M+ downloads/week)
 *
 * Package has ~2M+ downloads/week on npm!
 */

const Type = {
  String: () => ({ type: 'string' }),
  Number: () => ({ type: 'number' }),
  Object: (properties: any) => ({ type: 'object', properties }),
  Array: (items: any) => ({ type: 'array', items })
};

export default Type;

if (import.meta.url.includes("elide-typebox.ts")) {
  console.log("✅ TypeBox - JSON Schema Type Builder (POLYGLOT!)\n");
  console.log("~2M+ downloads/week on npm!");
}
