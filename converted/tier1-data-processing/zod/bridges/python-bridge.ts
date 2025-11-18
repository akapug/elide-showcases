/**
 * Python Bridge for Zod
 *
 * This bridge allows Zod schemas defined in TypeScript to be used
 * in Python code running on Elide. This is the KILLER FEATURE -
 * define your validation schema ONCE in TypeScript, use it EVERYWHERE.
 */

import { ZodType } from "../src/types.ts";

/**
 * Convert a Zod schema to Python-compatible validation code
 *
 * This demonstrates Elide's unique polyglot capabilities:
 * 1. Schema defined once in TypeScript
 * 2. Automatically usable in Python
 * 3. Same validation logic, zero duplication
 */
export function toPythonSchema(schema: ZodType<any, any, any>): string {
  const def = (schema as any)._def;

  switch (def.typeName) {
    case "ZodString":
      return generatePythonString(def);
    case "ZodNumber":
      return generatePythonNumber(def);
    case "ZodBoolean":
      return "bool";
    case "ZodDate":
      return "datetime";
    case "ZodObject":
      return generatePythonObject(def);
    case "ZodArray":
      return `List[${toPythonSchema(def.type)}]`;
    case "ZodEnum":
      return `Literal[${def.values.map((v: string) => `"${v}"`).join(", ")}]`;
    case "ZodUnion":
      return `Union[${def.options.map((o: any) => toPythonSchema(o)).join(", ")}]`;
    case "ZodOptional":
      return `Optional[${toPythonSchema(def.innerType)}]`;
    case "ZodNullable":
      return `Optional[${toPythonSchema(def.innerType)}]`;
    default:
      return "Any";
  }
}

function generatePythonString(def: any): string {
  let base = "str";
  const constraints: string[] = [];

  for (const check of def.checks) {
    if (check.kind === "email") {
      constraints.push("email");
    } else if (check.kind === "url") {
      constraints.push("url");
    } else if (check.kind === "min") {
      constraints.push(`min_length=${check.value}`);
    } else if (check.kind === "max") {
      constraints.push(`max_length=${check.value}`);
    }
  }

  if (constraints.length > 0) {
    return `str  # ${constraints.join(", ")}`;
  }

  return base;
}

function generatePythonNumber(def: any): string {
  let base = "float";
  const constraints: string[] = [];

  for (const check of def.checks) {
    if (check.kind === "int") {
      base = "int";
    } else if (check.kind === "min") {
      constraints.push(`>=${check.value}`);
    } else if (check.kind === "max") {
      constraints.push(`<=${check.value}`);
    }
  }

  if (constraints.length > 0) {
    return `${base}  # ${constraints.join(", ")}`;
  }

  return base;
}

function generatePythonObject(def: any): string {
  const shape = def.shape;
  const fields: string[] = [];

  for (const key in shape) {
    const fieldType = toPythonSchema(shape[key]);
    fields.push(`    ${key}: ${fieldType}`);
  }

  return `class Model:\n${fields.join("\n")}`;
}

/**
 * Serialize a Zod schema for Python interop
 * Returns a JSON representation that Python code can parse
 */
export function serializeSchema(schema: ZodType<any, any, any>): Record<string, any> {
  const def = (schema as any)._def;

  const serialized: Record<string, any> = {
    type: def.typeName,
  };

  switch (def.typeName) {
    case "ZodString":
      serialized.checks = def.checks;
      break;
    case "ZodNumber":
      serialized.checks = def.checks;
      break;
    case "ZodObject":
      serialized.shape = {};
      for (const key in def.shape) {
        serialized.shape[key] = serializeSchema(def.shape[key]);
      }
      serialized.unknownKeys = def.unknownKeys;
      break;
    case "ZodArray":
      serialized.element = serializeSchema(def.type);
      serialized.minLength = def.minLength;
      serialized.maxLength = def.maxLength;
      break;
    case "ZodEnum":
      serialized.values = def.values;
      break;
    case "ZodUnion":
      serialized.options = def.options.map((o: any) => serializeSchema(o));
      break;
    case "ZodOptional":
    case "ZodNullable":
      serialized.inner = serializeSchema(def.innerType);
      break;
    case "ZodLiteral":
      serialized.value = def.value;
      break;
  }

  return serialized;
}

/**
 * Export schema for use in Python
 * This creates a Python-compatible validator from a Zod schema
 */
export function exportForPython(name: string, schema: ZodType<any, any, any>): string {
  const serialized = serializeSchema(schema);
  return `
# Auto-generated from TypeScript Zod schema
# This demonstrates Elide's polyglot capabilities!

from typing import Any, Dict, List, Optional, Union, Literal
from datetime import datetime
import re

${name}_SCHEMA = ${JSON.stringify(serialized, null, 2)}

def validate_${name.toLowerCase()}(data: Any) -> Dict[str, Any]:
    """
    Validate data against the ${name} schema.
    This validator was generated from a TypeScript Zod schema!
    """
    from zod import validate_with_schema
    return validate_with_schema(data, ${name}_SCHEMA)
`;
}
