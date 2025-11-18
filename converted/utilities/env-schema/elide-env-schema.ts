/**
 * env-schema - JSON Schema-based Environment Variable Validation
 *
 * Validate environment variables using JSON Schema.
 * **POLYGLOT SHOWCASE**: One schema validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/env-schema (~50K+ downloads/week)
 *
 * Features:
 * - JSON Schema validation for environment variables
 * - Type coercion (string, number, boolean, array)
 * - Required field validation
 * - Default values
 * - Pattern matching
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need env validation
 * - ONE schema format works everywhere on Elide
 * - Consistent validation rules across languages
 * - Share environment schemas across your stack
 *
 * Use cases:
 * - Environment variable validation
 * - Configuration schema enforcement
 * - Type-safe environment access
 * - 12-factor app compliance
 *
 * Package has ~50K+ downloads/week on npm!
 */

interface SchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array';
  default?: any;
  enum?: any[];
  pattern?: string;
  separator?: string;
}

interface EnvSchema {
  type: 'object';
  required?: string[];
  properties: Record<string, SchemaProperty>;
}

export function envSchema<T = any>(options: { schema: EnvSchema; data?: Record<string, string | undefined> }): T {
  const { schema, data = process.env } = options;
  const result: any = {};
  const errors: string[] = [];

  if (schema.required) {
    for (const field of schema.required) {
      if (data[field] === undefined) {
        errors.push(`Required environment variable "${field}" is not set`);
      }
    }
  }

  for (const [key, prop] of Object.entries(schema.properties)) {
    let value = data[key];

    if (value === undefined) {
      if (prop.default !== undefined) {
        result[key] = prop.default;
        continue;
      }
      result[key] = undefined;
      continue;
    }

    if (prop.enum && !prop.enum.includes(value)) {
      errors.push(`"${key}" must be one of: ${prop.enum.join(', ')}`);
      continue;
    }

    if (prop.pattern && !new RegExp(prop.pattern).test(value)) {
      errors.push(`"${key}" does not match pattern`);
      continue;
    }

    try {
      switch (prop.type) {
        case 'string':
          result[key] = value;
          break;
        case 'number':
          result[key] = Number(value);
          if (isNaN(result[key])) throw new Error('must be a number');
          break;
        case 'boolean':
          result[key] = ['true', '1', 'yes'].includes(value.toLowerCase());
          break;
        case 'array':
          result[key] = value.split(prop.separator || ',').map(s => s.trim());
          break;
      }
    } catch (e) {
      errors.push(`"${key}" ${e.message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }

  return result as T;
}

export default envSchema;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔧 env-schema - JSON Schema Environment Validation (POLYGLOT!)\n");

  process.env.PORT = '3000';
  process.env.NODE_ENV = 'production';
  process.env.DEBUG = 'false';

  const schema = {
    type: 'object' as const,
    required: ['PORT', 'NODE_ENV'],
    properties: {
      PORT: { type: 'number' as const, default: 8080 },
      NODE_ENV: { type: 'string' as const, enum: ['development', 'production', 'test'] },
      DEBUG: { type: 'boolean' as const, default: false }
    }
  };

  const env = envSchema({ schema });
  console.log("Validated:", env);
  console.log("\n✅ Use Cases: Env validation, Schema enforcement, Type safety");
  console.log("🚀 50K+ npm downloads/week - Zero dependencies - Polyglot-ready");
}
