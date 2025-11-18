/**
 * Ruby Bridge for Zod
 *
 * This bridge allows Zod schemas defined in TypeScript to be used
 * in Ruby code running on Elide. Part of the polyglot killer feature!
 */

import { ZodType } from "../src/types.ts";
import { serializeSchema } from "./python-bridge.ts";

/**
 * Export schema for use in Ruby
 * This creates a Ruby-compatible validator from a Zod schema
 */
export function exportForRuby(name: string, schema: ZodType<any, any, any>): string {
  const serialized = serializeSchema(schema);
  return `
# Auto-generated from TypeScript Zod schema
# This demonstrates Elide's polyglot capabilities!

require 'json'
require 'date'

${name.toUpperCase}_SCHEMA = ${JSON.stringify(serialized, null, 2)}

def validate_${name.toLowerCase()}(data)
  # Validate data against the ${name} schema.
  # This validator was generated from a TypeScript Zod schema!
  validate_with_schema(data, ${name.toUpperCase}_SCHEMA)
end
`;
}

/**
 * Convert a Zod schema to Ruby type annotations
 */
export function toRubyType(schema: ZodType<any, any, any>): string {
  const def = (schema as any)._def;

  switch (def.typeName) {
    case "ZodString":
      return "String";
    case "ZodNumber":
      return "Numeric";
    case "ZodBoolean":
      return "Boolean";
    case "ZodDate":
      return "Date";
    case "ZodObject":
      return generateRubyObject(def);
    case "ZodArray":
      return `Array<${toRubyType(def.type)}>`;
    case "ZodEnum":
      return def.values.map((v: string) => `"${v}"`).join(" | ");
    case "ZodUnion":
      return def.options.map((o: any) => toRubyType(o)).join(" | ");
    case "ZodOptional":
    case "ZodNullable":
      return `${toRubyType(def.innerType)} | nil`;
    default:
      return "Object";
  }
}

function generateRubyObject(def: any): string {
  const shape = def.shape;
  const fields: string[] = [];

  for (const key in shape) {
    const fieldType = toRubyType(shape[key]);
    fields.push(`  # @return [${fieldType}]`);
    fields.push(`  attr_accessor :${key}`);
  }

  return `class Model\n${fields.join("\n")}\nend`;
}
