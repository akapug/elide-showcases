/**
 * Number Schema Tests
 * Comprehensive tests for number validation
 */

import * as yup from '../src/yup';

describe('NumberSchema', () => {
  test('validates basic number', async () => {
    const schema = yup.number();
    const result = await schema.validate(42);
    expect(result).toBe(42);
  });

  test('casts string numbers', () => {
    const schema = yup.number();
    expect(schema.cast('42')).toBe(42);
    expect(schema.cast('3.14')).toBe(3.14);
  });

  test('min validation', async () => {
    const schema = yup.number().min(10);

    await expect(schema.validate(10)).resolves.toBe(10);
    await expect(schema.validate(20)).resolves.toBe(20);
    await expect(schema.validate(5)).rejects.toThrow();
  });

  test('max validation', async () => {
    const schema = yup.number().max(100);

    await expect(schema.validate(100)).resolves.toBe(100);
    await expect(schema.validate(50)).resolves.toBe(50);
    await expect(schema.validate(150)).rejects.toThrow();
  });

  test('lessThan validation', async () => {
    const schema = yup.number().lessThan(100);

    await expect(schema.validate(99)).resolves.toBe(99);
    await expect(schema.validate(100)).rejects.toThrow();
    await expect(schema.validate(101)).rejects.toThrow();
  });

  test('moreThan validation', async () => {
    const schema = yup.number().moreThan(0);

    await expect(schema.validate(1)).resolves.toBe(1);
    await expect(schema.validate(0)).rejects.toThrow();
    await expect(schema.validate(-1)).rejects.toThrow();
  });

  test('positive validation', async () => {
    const schema = yup.number().positive();

    await expect(schema.validate(1)).resolves.toBe(1);
    await expect(schema.validate(0.1)).resolves.toBe(0.1);
    await expect(schema.validate(0)).rejects.toThrow();
    await expect(schema.validate(-1)).rejects.toThrow();
  });

  test('negative validation', async () => {
    const schema = yup.number().negative();

    await expect(schema.validate(-1)).resolves.toBe(-1);
    await expect(schema.validate(-0.1)).resolves.toBe(-0.1);
    await expect(schema.validate(0)).rejects.toThrow();
    await expect(schema.validate(1)).rejects.toThrow();
  });

  test('integer validation', async () => {
    const schema = yup.number().integer();

    await expect(schema.validate(42)).resolves.toBe(42);
    await expect(schema.validate(-10)).resolves.toBe(-10);
    await expect(schema.validate(3.14)).rejects.toThrow();
  });

  test('round transformation', () => {
    const schema = yup.number().round();
    expect(schema.cast(3.14)).toBe(3);
    expect(schema.cast(3.7)).toBe(4);
  });

  test('truncate transformation', () => {
    const schema = yup.number().truncate();
    expect(schema.cast(3.14)).toBe(3);
    expect(schema.cast(3.9)).toBe(3);
  });

  test('required validation', async () => {
    const schema = yup.number().required();

    await expect(schema.validate(0)).resolves.toBe(0);
    await expect(schema.validate(null)).rejects.toThrow();
    await expect(schema.validate(undefined)).rejects.toThrow();
  });

  test('nullable numbers', async () => {
    const schema = yup.number().nullable();

    await expect(schema.validate(null)).resolves.toBe(null);
    await expect(schema.validate(42)).resolves.toBe(42);
  });

  test('default values', () => {
    const schema = yup.number().default(0);
    expect(schema.cast(undefined)).toBe(0);
    expect(schema.cast(42)).toBe(42);
  });

  test('chained validations', async () => {
    const schema = yup.number().min(0).max(100).integer();

    await expect(schema.validate(50)).resolves.toBe(50);
    await expect(schema.validate(-1)).rejects.toThrow();
    await expect(schema.validate(101)).rejects.toThrow();
    await expect(schema.validate(50.5)).rejects.toThrow();
  });

  test('range validation', async () => {
    const schema = yup.number().moreThan(0).lessThan(100);

    await expect(schema.validate(50)).resolves.toBe(50);
    await expect(schema.validate(0)).rejects.toThrow();
    await expect(schema.validate(100)).rejects.toThrow();
  });
});
