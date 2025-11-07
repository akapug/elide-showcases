/**
 * Simple JSON Schema Validator
 * Basic validation for JSON schemas
 */

export type SchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

export interface Schema {
  type?: SchemaType | SchemaType[];
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: any[];
}

export interface ValidationError {
  path: string;
  message: string;
}

export function validate(data: any, schema: Schema, path: string = 'root'): ValidationError[] {
  const errors: ValidationError[] = [];

  // Type validation
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actualType = getType(data);

    if (!types.includes(actualType)) {
      errors.push({ path, message: `Expected type ${types.join('|')}, got ${actualType}` });
      return errors; // Stop validating if type is wrong
    }
  }

  // String validations
  if (typeof data === 'string') {
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push({ path, message: `String length ${data.length} < ${schema.minLength}` });
    }
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push({ path, message: `String length ${data.length} > ${schema.maxLength}` });
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
      errors.push({ path, message: `String does not match pattern ${schema.pattern}` });
    }
  }

  // Number validations
  if (typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push({ path, message: `Number ${data} < ${schema.minimum}` });
    }
    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push({ path, message: `Number ${data} > ${schema.maximum}` });
    }
  }

  // Enum validation
  if (schema.enum && !schema.enum.includes(data)) {
    errors.push({ path, message: `Value not in enum: ${JSON.stringify(schema.enum)}` });
  }

  // Object validations
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const propPath = `${path}.${key}`;
        if (key in data) {
          errors.push(...validate(data[key], propSchema, propPath));
        } else if (schema.required?.includes(key)) {
          errors.push({ path: propPath, message: 'Required property missing' });
        }
      }
    }
  }

  // Array validations
  if (Array.isArray(data) && schema.items) {
    data.forEach((item, index) => {
      errors.push(...validate(item, schema.items!, `${path}[${index}]`));
    });
  }

  return errors;
}

function getType(value: any): SchemaType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value as SchemaType;
}

// CLI demo
if (import.meta.url.includes("json-schema.ts")) {
  console.log("JSON Schema Validator Demo\n");

  const schema: Schema = {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      age: { type: 'number', minimum: 0, maximum: 150 },
      email: { type: 'string', pattern: '^[^@]+@[^@]+\\.[^@]+$' },
      status: { type: 'string', enum: ['active', 'inactive'] }
    },
    required: ['name', 'email']
  };

  const validData = {
    name: 'Alice',
    age: 30,
    email: 'alice@example.com',
    status: 'active'
  };

  const invalidData = {
    name: '',
    age: 200,
    status: 'unknown'
  };

  console.log("Valid data:");
  const errors1 = validate(validData, schema);
  console.log(errors1.length === 0 ? "✅ No errors" : JSON.stringify(errors1, null, 2));

  console.log("\nInvalid data:");
  const errors2 = validate(invalidData, schema);
  errors2.forEach(e => console.log(`  ${e.path}: ${e.message}`));

  console.log("\n✅ JSON schema test passed");
}
