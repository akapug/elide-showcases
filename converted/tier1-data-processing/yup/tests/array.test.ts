/**
 * Array Schema Tests
 * Comprehensive tests for array validation
 */

import * as yup from '../src/yup';

describe('ArraySchema', () => {
  test('validates basic array', async () => {
    const schema = yup.array();
    const result = await schema.validate([1, 2, 3]);
    expect(result).toEqual([1, 2, 3]);
  });

  test('validates array of specific type', async () => {
    const schema = yup.array(yup.number());

    await expect(schema.validate([1, 2, 3])).resolves.toEqual([1, 2, 3]);
    await expect(schema.validate(['1', '2', '3'])).resolves.toEqual([1, 2, 3]); // casts to numbers
  });

  test('validates array of objects', async () => {
    const schema = yup.array(
      yup.object({
        name: yup.string().required(),
        age: yup.number().required(),
      })
    );

    const result = await schema.validate([
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('John');
  });

  test('min length validation', async () => {
    const schema = yup.array().min(2);

    await expect(schema.validate([1, 2])).resolves.toEqual([1, 2]);
    await expect(schema.validate([1, 2, 3])).resolves.toEqual([1, 2, 3]);
    await expect(schema.validate([1])).rejects.toThrow();
  });

  test('max length validation', async () => {
    const schema = yup.array().max(3);

    await expect(schema.validate([1, 2, 3])).resolves.toEqual([1, 2, 3]);
    await expect(schema.validate([1, 2])).resolves.toEqual([1, 2]);
    await expect(schema.validate([1, 2, 3, 4])).rejects.toThrow();
  });

  test('exact length validation', async () => {
    const schema = yup.array().length(3);

    await expect(schema.validate([1, 2, 3])).resolves.toEqual([1, 2, 3]);
    await expect(schema.validate([1, 2])).rejects.toThrow();
    await expect(schema.validate([1, 2, 3, 4])).rejects.toThrow();
  });

  test('validates each element', async () => {
    const schema = yup.array(yup.string().email());

    await expect(
      schema.validate(['user1@example.com', 'user2@example.com'])
    ).resolves.toBeDefined();

    await expect(schema.validate(['user@example.com', 'invalid'])).rejects.toThrow();
  });

  test('required validation', async () => {
    const schema = yup.array().required();

    await expect(schema.validate([1, 2, 3])).resolves.toEqual([1, 2, 3]);
    await expect(schema.validate(null)).rejects.toThrow();
    await expect(schema.validate(undefined)).rejects.toThrow();
  });

  test('nullable arrays', async () => {
    const schema = yup.array().nullable();

    await expect(schema.validate(null)).resolves.toBe(null);
    await expect(schema.validate([1, 2, 3])).resolves.toEqual([1, 2, 3]);
  });

  test('default values', () => {
    const schema = yup.array().default([]);
    expect(schema.cast(undefined)).toEqual([]);
    expect(schema.cast([1, 2])).toEqual([1, 2]);
  });

  test('ensure method', () => {
    const schema = yup.array().ensure();
    expect(schema.cast(null)).toEqual([]);
    expect(schema.cast(undefined)).toEqual([]);
    expect(schema.cast([1, 2])).toEqual([1, 2]);
  });

  test('compact method', () => {
    const schema = yup.array().compact();
    const result = schema.cast([1, null, 2, undefined, 3, false, 0, '']);
    expect(result).toEqual([1, 2, 3]);
  });

  test('validates nested arrays', async () => {
    const schema = yup.array(yup.array(yup.number()));

    await expect(
      schema.validate([
        [1, 2],
        [3, 4],
      ])
    ).resolves.toBeDefined();
  });

  test('abortEarly false collects all errors', async () => {
    const schema = yup.array(yup.number().positive());

    try {
      await schema.validate([1, -2, 3, -4], { abortEarly: false });
      fail('Should have thrown');
    } catch (err: any) {
      expect(err.inner).toHaveLength(2);
    }
  });

  test('complex validation with chained rules', async () => {
    const schema = yup
      .array(yup.string().min(3).max(10))
      .min(1)
      .max(5)
      .required();

    await expect(schema.validate(['hello', 'world'])).resolves.toBeDefined();
    await expect(schema.validate([])).rejects.toThrow(); // min length
    await expect(schema.validate(['a', 'b', 'c', 'd', 'e', 'f'])).rejects.toThrow(); // max length
    await expect(schema.validate(['hi', 'world'])).rejects.toThrow(); // element too short
  });
});
