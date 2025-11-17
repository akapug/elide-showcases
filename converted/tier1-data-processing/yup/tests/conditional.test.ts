/**
 * Conditional Validation Tests
 * Tests for .when() and cross-field validation
 */

import * as yup from '../src/yup';

describe('Conditional Validation', () => {
  test('when with simple condition', async () => {
    const schema = yup.object({
      isCompany: yup.boolean(),
      companyName: yup.string().when('isCompany', {
        is: true,
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.optional(),
      }),
    });

    await expect(
      schema.validate({ isCompany: true, companyName: 'Acme Corp' })
    ).resolves.toBeDefined();

    await expect(schema.validate({ isCompany: true })).rejects.toThrow();

    await expect(schema.validate({ isCompany: false })).resolves.toBeDefined();
  });

  test('when with function condition', async () => {
    const schema = yup.object({
      age: yup.number(),
      guardian: yup.string().when('age', {
        is: (age: number) => age < 18,
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.optional(),
      }),
    });

    await expect(schema.validate({ age: 15, guardian: 'Parent' })).resolves.toBeDefined();
    await expect(schema.validate({ age: 15 })).rejects.toThrow();
    await expect(schema.validate({ age: 20 })).resolves.toBeDefined();
  });

  test('when with reference', async () => {
    const schema = yup.object({
      password: yup.string().required(),
      confirmPassword: yup.string().when(yup.ref('password'), {
        is: (val: string) => val && val.length > 0,
        then: (schema) => schema.required().oneOf([yup.ref('password')], 'Passwords must match'),
      }),
    });

    await expect(
      schema.validate({ password: 'secret123', confirmPassword: 'secret123' })
    ).resolves.toBeDefined();

    await expect(
      schema.validate({ password: 'secret123', confirmPassword: 'different' })
    ).rejects.toThrow();
  });

  test('multiple conditional validations', async () => {
    const schema = yup.object({
      role: yup.string().oneOf(['admin', 'user', 'guest']),
      permissions: yup.array().when('role', {
        is: 'admin',
        then: (schema) => schema.min(1).required(),
        otherwise: (schema) => schema.optional(),
      }),
      department: yup.string().when('role', {
        is: (role: string) => role === 'admin' || role === 'user',
        then: (schema) => schema.required(),
      }),
    });

    await expect(
      schema.validate({ role: 'admin', permissions: ['read', 'write'], department: 'IT' })
    ).resolves.toBeDefined();

    await expect(schema.validate({ role: 'admin', department: 'IT' })).rejects.toThrow();

    await expect(schema.validate({ role: 'guest' })).resolves.toBeDefined();
  });

  test('cross-field validation with ref', async () => {
    const schema = yup.object({
      startDate: yup.date().required(),
      endDate: yup.date().min(yup.ref('startDate'), 'End date must be after start date'),
    });

    const start = new Date('2024-01-01');
    const end = new Date('2024-12-31');

    await expect(schema.validate({ startDate: start, endDate: end })).resolves.toBeDefined();

    await expect(
      schema.validate({ startDate: end, endDate: start })
    ).rejects.toThrow();
  });

  test('nested conditional validation', async () => {
    const schema = yup.object({
      shipping: yup.object({
        method: yup.string().oneOf(['standard', 'express']),
        trackingNumber: yup.string().when('method', {
          is: 'express',
          then: (schema) => schema.required(),
        }),
      }),
    });

    await expect(
      schema.validate({ shipping: { method: 'express', trackingNumber: 'ABC123' } })
    ).resolves.toBeDefined();

    await expect(
      schema.validate({ shipping: { method: 'express' } })
    ).rejects.toThrow();

    await expect(
      schema.validate({ shipping: { method: 'standard' } })
    ).resolves.toBeDefined();
  });

  test('conditional with default values', async () => {
    const schema = yup.object({
      type: yup.string().default('basic'),
      premium: yup.boolean().when('type', {
        is: 'advanced',
        then: (schema) => schema.default(true),
        otherwise: (schema) => schema.default(false),
      }),
    });

    const result1 = schema.cast({ type: 'advanced' });
    expect(result1.premium).toBe(true);

    const result2 = schema.cast({ type: 'basic' });
    expect(result2.premium).toBe(false);
  });
});
