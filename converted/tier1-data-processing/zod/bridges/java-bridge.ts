/**
 * Java Bridge for Zod
 *
 * This bridge allows Zod schemas defined in TypeScript to be used
 * in Java code running on Elide. Completes the polyglot killer feature!
 */

import { ZodType } from "../src/types.ts";
import { serializeSchema } from "./python-bridge.ts";

/**
 * Export schema for use in Java
 * This creates a Java-compatible validator from a Zod schema
 */
export function exportForJava(name: string, schema: ZodType<any, any, any>): string {
  const serialized = serializeSchema(schema);
  const className = name.charAt(0).toUpperCase() + name.slice(1);

  return `
/**
 * Auto-generated from TypeScript Zod schema
 * This demonstrates Elide's polyglot capabilities!
 */

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.*;

public class ${className}Validator {
    private static final String SCHEMA_JSON = ${JSON.stringify(JSON.stringify(serialized))};
    private static final ObjectMapper mapper = new ObjectMapper();
    private static JsonNode schema;

    static {
        try {
            schema = mapper.readTree(SCHEMA_JSON);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load schema", e);
        }
    }

    /**
     * Validate data against the ${className} schema.
     * This validator was generated from a TypeScript Zod schema!
     */
    public static Map<String, Object> validate(Map<String, Object> data) throws ValidationException {
        return ZodValidator.validateWithSchema(data, schema);
    }

    public static Map<String, Object> validate(String json) throws ValidationException {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = mapper.readValue(json, Map.class);
            return validate(data);
        } catch (Exception e) {
            throw new ValidationException("Invalid JSON: " + e.getMessage());
        }
    }
}
`;
}

/**
 * Convert a Zod schema to Java type annotations
 */
export function toJavaType(schema: ZodType<any, any, any>): string {
  const def = (schema as any)._def;

  switch (def.typeName) {
    case "ZodString":
      return "String";
    case "ZodNumber":
      // Check if it's an integer
      const hasIntCheck = def.checks?.some((c: any) => c.kind === "int");
      return hasIntCheck ? "Integer" : "Double";
    case "ZodBoolean":
      return "Boolean";
    case "ZodDate":
      return "Date";
    case "ZodObject":
      return "Map<String, Object>";
    case "ZodArray":
      return `List<${toJavaType(def.type)}>`;
    case "ZodEnum":
      return "String";
    case "ZodUnion":
      return "Object"; // Java doesn't have union types
    case "ZodOptional":
    case "ZodNullable":
      return toJavaType(def.innerType);
    default:
      return "Object";
  }
}

/**
 * Generate Java class from Zod object schema
 */
export function generateJavaClass(name: string, schema: ZodType<any, any, any>): string {
  const def = (schema as any)._def;

  if (def.typeName !== "ZodObject") {
    throw new Error("Can only generate Java classes from ZodObject schemas");
  }

  const className = name.charAt(0).toUpperCase() + name.slice(1);
  const shape = def.shape;
  const fields: string[] = [];
  const getters: string[] = [];
  const setters: string[] = [];

  for (const key in shape) {
    const fieldType = toJavaType(shape[key]);
    const fieldName = key;
    const methodName = key.charAt(0).toUpperCase() + key.slice(1);

    fields.push(`    private ${fieldType} ${fieldName};`);
    getters.push(`    public ${fieldType} get${methodName}() { return ${fieldName}; }`);
    setters.push(`    public void set${methodName}(${fieldType} ${fieldName}) { this.${fieldName} = ${fieldName}; }`);
  }

  return `
/**
 * Auto-generated from TypeScript Zod schema
 */
public class ${className} {
${fields.join("\n")}

${getters.join("\n")}

${setters.join("\n")}

    public void validate() throws ValidationException {
        ${className}Validator.validate(this.toMap());
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
${Object.keys(shape).map(key => `        map.put("${key}", this.${key});`).join("\n")}
        return map;
    }
}
`;
}
