/**
 * Schema Validation Tests
 *
 * Tests for JSON schema validation including:
 * - Type validation
 * - Required properties
 * - String formats
 * - Number constraints
 * - Object validation
 * - Array validation
 */

import { SchemaCompiler, ValidationError, CommonSchemas } from '../src/schemas';

describe('SchemaCompiler - Type Validation', () => {
  let compiler: SchemaCompiler;

  beforeEach(() => {
    compiler = new SchemaCompiler();
  });

  test('should validate string type', () => {
    const schema = { type: 'string' as const };
    expect(compiler.validate(schema, 'hello')).toBe(true);
    expect(compiler.validate(schema, 123)).toBe(false);
  });

  test('should validate number type', () => {
    const schema = { type: 'number' as const };
    expect(compiler.validate(schema, 123)).toBe(true);
    expect(compiler.validate(schema, 123.45)).toBe(true);
    expect(compiler.validate(schema, 'hello')).toBe(false);
  });

  test('should validate integer type', () => {
    const schema = { type: 'integer' as const };
    expect(compiler.validate(schema, 123)).toBe(true);
    expect(compiler.validate(schema, 123.45)).toBe(false);
  });

  test('should validate boolean type', () => {
    const schema = { type: 'boolean' as const };
    expect(compiler.validate(schema, true)).toBe(true);
    expect(compiler.validate(schema, false)).toBe(true);
    expect(compiler.validate(schema, 'true')).toBe(false);
  });

  test('should validate object type', () => {
    const schema = { type: 'object' as const };
    expect(compiler.validate(schema, {})).toBe(true);
    expect(compiler.validate(schema, { key: 'value' })).toBe(true);
    expect(compiler.validate(schema, [])).toBe(false);
    expect(compiler.validate(schema, null)).toBe(false);
  });

  test('should validate array type', () => {
    const schema = { type: 'array' as const };
    expect(compiler.validate(schema, [])).toBe(true);
    expect(compiler.validate(schema, [1, 2, 3])).toBe(true);
    expect(compiler.validate(schema, {})).toBe(false);
  });
});

describe('SchemaCompiler - String Validation', () => {
  let compiler: SchemaCompiler;

  beforeEach(() => {
    compiler = new SchemaCompiler();
  });

  test('should validate string minLength', () => {
    const schema = { type: 'string' as const, minLength: 3 };
    expect(compiler.validate(schema, 'hello')).toBe(true);
    expect(compiler.validate(schema, 'hi')).toBe(false);
  });

  test('should validate string maxLength', () => {
    const schema = { type: 'string' as const, maxLength: 5 };
    expect(compiler.validate(schema, 'hello')).toBe(true);
    expect(compiler.validate(schema, 'hello world')).toBe(false);
  });

  test('should validate string pattern', () => {
    const schema = { type: 'string' as const, pattern: '^[a-z]+$' };
    expect(compiler.validate(schema, 'hello')).toBe(true);
    expect(compiler.validate(schema, 'Hello')).toBe(false);
    expect(compiler.validate(schema, 'hello123')).toBe(false);
  });

  test('should validate email format', () => {
    const schema = { type: 'string' as const, format: 'email' };
    expect(compiler.validate(schema, 'test@example.com')).toBe(true);
    expect(compiler.validate(schema, 'invalid-email')).toBe(false);
  });

  test('should validate URL format', () => {
    const schema = { type: 'string' as const, format: 'url' };
    expect(compiler.validate(schema, 'https://example.com')).toBe(true);
    expect(compiler.validate(schema, 'not-a-url')).toBe(false);
  });

  test('should validate UUID format', () => {
    const schema = { type: 'string' as const, format: 'uuid' };
    expect(compiler.validate(schema, '123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(compiler.validate(schema, 'not-a-uuid')).toBe(false);
  });
});

describe('SchemaCompiler - Number Validation', () => {
  let compiler: SchemaCompiler;

  beforeEach(() => {
    compiler = new SchemaCompiler();
  });

  test('should validate minimum', () => {
    const schema = { type: 'number' as const, minimum: 0 };
    expect(compiler.validate(schema, 5)).toBe(true);
    expect(compiler.validate(schema, 0)).toBe(true);
    expect(compiler.validate(schema, -1)).toBe(false);
  });

  test('should validate maximum', () => {
    const schema = { type: 'number' as const, maximum: 100 };
    expect(compiler.validate(schema, 50)).toBe(true);
    expect(compiler.validate(schema, 100)).toBe(true);
    expect(compiler.validate(schema, 101)).toBe(false);
  });
});

describe('SchemaCompiler - Object Validation', () => {
  let compiler: SchemaCompiler;

  beforeEach(() => {
    compiler = new SchemaCompiler();
  });

  test('should validate required properties', () => {
    const schema = {
      type: 'object' as const,
      required: ['name', 'email'],
      properties: {
        name: { type: 'string' as const },
        email: { type: 'string' as const },
      },
    };

    expect(compiler.validate(schema, { name: 'John', email: 'john@example.com' })).toBe(true);
    expect(compiler.validate(schema, { name: 'John' })).toBe(false);
    expect(compiler.validate(schema, { email: 'john@example.com' })).toBe(false);
  });

  test('should validate property types', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const },
        age: { type: 'integer' as const },
      },
    };

    expect(compiler.validate(schema, { name: 'John', age: 30 })).toBe(true);
    expect(compiler.validate(schema, { name: 'John', age: '30' })).toBe(false);
  });

  test('should reject additional properties when additionalProperties is false', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const },
      },
      additionalProperties: false,
    };

    expect(compiler.validate(schema, { name: 'John' })).toBe(true);
    expect(compiler.validate(schema, { name: 'John', extra: 'field' })).toBe(false);
  });
});

describe('SchemaCompiler - Array Validation', () => {
  let compiler: SchemaCompiler;

  beforeEach(() => {
    compiler = new SchemaCompiler();
  });

  test('should validate array items', () => {
    const schema = {
      type: 'array' as const,
      items: { type: 'string' as const },
    };

    expect(compiler.validate(schema, ['a', 'b', 'c'])).toBe(true);
    expect(compiler.validate(schema, ['a', 1, 'c'])).toBe(false);
  });

  test('should validate complex array items', () => {
    const schema = {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        required: ['id', 'name'],
        properties: {
          id: { type: 'integer' as const },
          name: { type: 'string' as const },
        },
      },
    };

    expect(compiler.validate(schema, [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ])).toBe(true);

    expect(compiler.validate(schema, [
      { id: 1, name: 'John' },
      { id: 'invalid', name: 'Jane' },
    ])).toBe(false);
  });
});

describe('SchemaCompiler - Enum and Const', () => {
  let compiler: SchemaCompiler;

  beforeEach(() => {
    compiler = new SchemaCompiler();
  });

  test('should validate enum values', () => {
    const schema = {
      type: 'string' as const,
      enum: ['red', 'green', 'blue'],
    };

    expect(compiler.validate(schema, 'red')).toBe(true);
    expect(compiler.validate(schema, 'yellow')).toBe(false);
  });

  test('should validate const value', () => {
    const schema = {
      const: 'specific-value',
    };

    expect(compiler.validate(schema, 'specific-value')).toBe(true);
    expect(compiler.validate(schema, 'other-value')).toBe(false);
  });
});

describe('SchemaCompiler - Error Reporting', () => {
  let compiler: SchemaCompiler;

  beforeEach(() => {
    compiler = new SchemaCompiler();
  });

  test('should report validation errors', () => {
    const schema = {
      type: 'object' as const,
      required: ['name'],
      properties: {
        name: { type: 'string' as const },
        age: { type: 'integer' as const, minimum: 0 },
      },
    };

    compiler.validate(schema, { age: -1 });
    const errors = compiler.getErrors();

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.field === 'name')).toBe(true);
    expect(errors.some(e => e.field === 'age')).toBe(true);
  });
});

describe('Common Schemas', () => {
  let compiler: SchemaCompiler;

  beforeEach(() => {
    compiler = new SchemaCompiler();
  });

  test('should validate email schema', () => {
    expect(compiler.validate(CommonSchemas.email, 'test@example.com')).toBe(true);
    expect(compiler.validate(CommonSchemas.email, 'invalid')).toBe(false);
  });

  test('should validate UUID schema', () => {
    expect(compiler.validate(CommonSchemas.uuid, '123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(compiler.validate(CommonSchemas.uuid, 'invalid')).toBe(false);
  });

  test('should validate positive integer schema', () => {
    expect(compiler.validate(CommonSchemas.positiveInteger, 1)).toBe(true);
    expect(compiler.validate(CommonSchemas.positiveInteger, 0)).toBe(false);
    expect(compiler.validate(CommonSchemas.positiveInteger, -1)).toBe(false);
  });

  test('should validate pagination schema', () => {
    expect(compiler.validate(CommonSchemas.pagination, { page: 1, limit: 10 })).toBe(true);
    expect(compiler.validate(CommonSchemas.pagination, { page: 0, limit: 10 })).toBe(false);
    expect(compiler.validate(CommonSchemas.pagination, { page: 1, limit: 200 })).toBe(false);
  });
});

describe('ValidationError', () => {
  test('should create validation error with details', () => {
    const errors = [
      { field: 'name', message: 'is required', constraint: 'required' },
      { field: 'age', message: 'must be >= 0', value: -1, constraint: 'minimum' },
    ];

    const error = new ValidationError('Validation failed', errors);

    expect(error.message).toBe('Validation failed');
    expect(error.statusCode).toBe(400);
    expect(error.errors).toEqual(errors);
  });
});
