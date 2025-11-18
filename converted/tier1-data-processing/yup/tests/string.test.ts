/**
 * String Schema Tests
 * Comprehensive tests for string validation
 */

import * as yup from '../src/yup';

describe('StringSchema', () => {
  test('validates basic string', async () => {
    const schema = yup.string();
    const result = await schema.validate('hello');
    expect(result).toBe('hello');
  });

  test('casts non-string values', () => {
    const schema = yup.string();
    expect(schema.cast(123)).toBe('123');
    expect(schema.cast(true)).toBe('true');
  });

  test('min length validation', async () => {
    const schema = yup.string().min(5);

    await expect(schema.validate('hello')).resolves.toBe('hello');
    await expect(schema.validate('hi')).rejects.toThrow();
  });

  test('max length validation', async () => {
    const schema = yup.string().max(5);

    await expect(schema.validate('hello')).resolves.toBe('hello');
    await expect(schema.validate('hello world')).rejects.toThrow();
  });

  test('exact length validation', async () => {
    const schema = yup.string().length(5);

    await expect(schema.validate('hello')).resolves.toBe('hello');
    await expect(schema.validate('hi')).rejects.toThrow();
    await expect(schema.validate('hello world')).rejects.toThrow();
  });

  test('email validation', async () => {
    const schema = yup.string().email();

    await expect(schema.validate('user@example.com')).resolves.toBe('user@example.com');
    await expect(schema.validate('invalid-email')).rejects.toThrow();
  });

  test('url validation', async () => {
    const schema = yup.string().url();

    await expect(schema.validate('https://example.com')).resolves.toBe('https://example.com');
    await expect(schema.validate('http://example.com')).resolves.toBe('http://example.com');
    await expect(schema.validate('not-a-url')).rejects.toThrow();
  });

  test('uuid validation', async () => {
    const schema = yup.string().uuid();

    await expect(schema.validate('550e8400-e29b-41d4-a716-446655440000')).resolves.toBe(
      '550e8400-e29b-41d4-a716-446655440000'
    );
    await expect(schema.validate('not-a-uuid')).rejects.toThrow();
  });

  test('matches regex pattern', async () => {
    const schema = yup.string().matches(/^[A-Z]+$/);

    await expect(schema.validate('HELLO')).resolves.toBe('HELLO');
    await expect(schema.validate('hello')).rejects.toThrow();
  });

  test('lowercase transformation', () => {
    const schema = yup.string().lowercase();
    expect(schema.cast('HELLO')).toBe('hello');
  });

  test('uppercase transformation', () => {
    const schema = yup.string().uppercase();
    expect(schema.cast('hello')).toBe('HELLO');
  });

  test('trim transformation', () => {
    const schema = yup.string().trim();
    expect(schema.cast('  hello  ')).toBe('hello');
  });

  test('required validation', async () => {
    const schema = yup.string().required();

    await expect(schema.validate('hello')).resolves.toBe('hello');
    await expect(schema.validate('')).rejects.toThrow();
    await expect(schema.validate(null)).rejects.toThrow();
    await expect(schema.validate(undefined)).rejects.toThrow();
  });

  test('nullable strings', async () => {
    const schema = yup.string().nullable();

    await expect(schema.validate(null)).resolves.toBe(null);
    await expect(schema.validate('hello')).resolves.toBe('hello');
  });

  test('optional strings', async () => {
    const schema = yup.string().optional();

    await expect(schema.validate(undefined)).resolves.toBe(undefined);
    await expect(schema.validate('hello')).resolves.toBe('hello');
  });

  test('default values', () => {
    const schema = yup.string().default('default');
    expect(schema.cast(undefined)).toBe('default');
    expect(schema.cast('value')).toBe('value');
  });

  test('chained validations', async () => {
    const schema = yup.string().min(5).max(10).email();

    await expect(schema.validate('user@example.com')).resolves.toBe('user@example.com');
    await expect(schema.validate('a@b.c')).rejects.toThrow(); // too short
    await expect(schema.validate('verylongemail@example.com')).rejects.toThrow(); // too long
  });

  test('custom error messages', async () => {
    const schema = yup.string().min(5, 'Must be at least 5 characters');

    try {
      await schema.validate('hi');
      fail('Should have thrown');
    } catch (err: any) {
      expect(err.message).toContain('Must be at least 5 characters');
    }
  });
});
