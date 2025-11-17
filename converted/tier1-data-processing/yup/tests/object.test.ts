/**
 * Object Schema Tests
 * Comprehensive tests for object validation
 */

import * as yup from '../src/yup';

describe('ObjectSchema', () => {
  test('validates basic object', async () => {
    const schema = yup.object({
      name: yup.string(),
      age: yup.number(),
    });

    const result = await schema.validate({ name: 'John', age: 30 });
    expect(result).toEqual({ name: 'John', age: 30 });
  });

  test('validates nested objects', async () => {
    const schema = yup.object({
      user: yup.object({
        name: yup.string(),
        email: yup.string().email(),
      }),
    });

    const result = await schema.validate({
      user: { name: 'John', email: 'john@example.com' },
    });

    expect(result.user.name).toBe('John');
    expect(result.user.email).toBe('john@example.com');
  });

  test('validates required fields', async () => {
    const schema = yup.object({
      name: yup.string().required(),
      email: yup.string().email().required(),
    });

    await expect(schema.validate({ name: 'John', email: 'john@example.com' })).resolves.toBeDefined();

    await expect(schema.validate({ name: 'John' })).rejects.toThrow();
    await expect(schema.validate({ email: 'john@example.com' })).rejects.toThrow();
  });

  test('applies default values', () => {
    const schema = yup.object({
      name: yup.string().default('Anonymous'),
      role: yup.string().default('user'),
    });

    const result = schema.cast({});
    expect(result.name).toBe('Anonymous');
    expect(result.role).toBe('user');
  });

  test('casts field values', () => {
    const schema = yup.object({
      age: yup.number(),
      active: yup.boolean(),
    });

    const result = schema.cast({ age: '30', active: 'true' });
    expect(result.age).toBe(30);
    expect(result.active).toBe(true);
  });

  test('pick fields', async () => {
    const schema = yup.object({
      name: yup.string(),
      email: yup.string(),
      age: yup.number(),
    });

    const pickedSchema = schema.pick(['name', 'email']);
    const result = await pickedSchema.validate({ name: 'John', email: 'john@example.com' });

    expect(result).toEqual({ name: 'John', email: 'john@example.com' });
  });

  test('omit fields', async () => {
    const schema = yup.object({
      name: yup.string(),
      email: yup.string(),
      password: yup.string(),
    });

    const omittedSchema = schema.omit(['password']);
    const result = await omittedSchema.validate({ name: 'John', email: 'john@example.com' });

    expect(result).toEqual({ name: 'John', email: 'john@example.com' });
  });

  test('noUnknown validation', async () => {
    const schema = yup.object({
      name: yup.string(),
    }).noUnknown();

    await expect(schema.validate({ name: 'John' })).resolves.toBeDefined();
    await expect(schema.validate({ name: 'John', extra: 'field' })).rejects.toThrow();
  });

  test('stripUnknown option', () => {
    const schema = yup.object({
      name: yup.string(),
      age: yup.number(),
    });

    const result = schema.cast(
      { name: 'John', age: 30, extra: 'field' },
      { stripUnknown: true }
    );

    expect(result).toEqual({ name: 'John', age: 30 });
  });

  test('preserves unknown fields by default', () => {
    const schema = yup.object({
      name: yup.string(),
    });

    const result = schema.cast({ name: 'John', extra: 'field' });
    expect(result).toEqual({ name: 'John', extra: 'field' });
  });

  test('validates all fields with abortEarly false', async () => {
    const schema = yup.object({
      name: yup.string().required(),
      email: yup.string().email().required(),
      age: yup.number().positive().required(),
    });

    try {
      await schema.validate({}, { abortEarly: false });
      fail('Should have thrown');
    } catch (err: any) {
      expect(err.inner).toHaveLength(3);
    }
  });

  test('nullable objects', async () => {
    const schema = yup.object({
      name: yup.string(),
    }).nullable();

    await expect(schema.validate(null)).resolves.toBe(null);
    await expect(schema.validate({ name: 'John' })).resolves.toBeDefined();
  });

  test('shape method', async () => {
    const baseSchema = yup.object({
      name: yup.string(),
    });

    const extendedSchema = baseSchema.shape({
      email: yup.string().email(),
    });

    const result = await extendedSchema.validate({ name: 'John', email: 'john@example.com' });
    expect(result).toEqual({ name: 'John', email: 'john@example.com' });
  });
});
