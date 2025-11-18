/**
 * Integration Tests
 * Complex real-world validation scenarios
 */

import * as yup from '../src/yup';

describe('Integration Tests', () => {
  test('user registration form', async () => {
    const registrationSchema = yup.object({
      username: yup.string().min(3).max(20).required(),
      email: yup.string().email().required(),
      password: yup.string().min(8).required(),
      confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Passwords must match')
        .required(),
      age: yup.number().min(18).integer().required(),
      terms: yup.boolean().oneOf([true], 'You must accept the terms').required(),
    });

    const validData = {
      username: 'johndoe',
      email: 'john@example.com',
      password: 'securepass123',
      confirmPassword: 'securepass123',
      age: 25,
      terms: true,
    };

    await expect(registrationSchema.validate(validData)).resolves.toBeDefined();

    // Invalid email
    await expect(
      registrationSchema.validate({ ...validData, email: 'invalid' })
    ).rejects.toThrow();

    // Password mismatch
    await expect(
      registrationSchema.validate({ ...validData, confirmPassword: 'different' })
    ).rejects.toThrow();

    // Under age
    await expect(registrationSchema.validate({ ...validData, age: 16 })).rejects.toThrow();

    // Terms not accepted
    await expect(
      registrationSchema.validate({ ...validData, terms: false })
    ).rejects.toThrow();
  });

  test('e-commerce order validation', async () => {
    const orderSchema = yup.object({
      customer: yup.object({
        name: yup.string().required(),
        email: yup.string().email().required(),
        phone: yup.string().matches(/^\+?[\d\s-()]+$/).required(),
      }),
      items: yup
        .array(
          yup.object({
            productId: yup.string().required(),
            quantity: yup.number().positive().integer().required(),
            price: yup.number().positive().required(),
          })
        )
        .min(1, 'Order must have at least one item')
        .required(),
      shipping: yup.object({
        address: yup.string().required(),
        city: yup.string().required(),
        zip: yup.string().required(),
        country: yup.string().required(),
      }),
      payment: yup.object({
        method: yup.string().oneOf(['credit_card', 'paypal', 'bank_transfer']).required(),
        total: yup.number().positive().required(),
      }),
    });

    const validOrder = {
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0123',
      },
      items: [
        { productId: 'PROD-001', quantity: 2, price: 29.99 },
        { productId: 'PROD-002', quantity: 1, price: 49.99 },
      ],
      shipping: {
        address: '123 Main St',
        city: 'New York',
        zip: '10001',
        country: 'USA',
      },
      payment: {
        method: 'credit_card',
        total: 109.97,
      },
    };

    await expect(orderSchema.validate(validOrder)).resolves.toBeDefined();

    // Empty items array
    await expect(
      orderSchema.validate({ ...validOrder, items: [] })
    ).rejects.toThrow();

    // Invalid payment method
    await expect(
      orderSchema.validate({
        ...validOrder,
        payment: { ...validOrder.payment, method: 'cash' },
      })
    ).rejects.toThrow();
  });

  test('blog post with tags and metadata', async () => {
    const postSchema = yup.object({
      title: yup.string().min(5).max(200).required(),
      slug: yup
        .string()
        .matches(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
        .required(),
      content: yup.string().min(100).required(),
      author: yup.object({
        id: yup.string().required(),
        name: yup.string().required(),
      }),
      tags: yup.array(yup.string()).min(1).max(10),
      published: yup.boolean().default(false),
      publishDate: yup.date().when('published', {
        is: true,
        then: (schema) => schema.required(),
        otherwise: (schema) => schema.optional(),
      }),
      metadata: yup.object({
        views: yup.number().default(0),
        likes: yup.number().default(0),
        featured: yup.boolean().default(false),
      }),
    });

    const validPost = {
      title: 'Introduction to Yup Validation',
      slug: 'intro-to-yup-validation',
      content: 'Lorem ipsum dolor sit amet...'.repeat(10),
      author: { id: 'user-123', name: 'John Doe' },
      tags: ['validation', 'javascript', 'yup'],
      published: true,
      publishDate: new Date(),
      metadata: { views: 0, likes: 0, featured: false },
    };

    await expect(postSchema.validate(validPost)).resolves.toBeDefined();

    // Published without publishDate
    await expect(
      postSchema.validate({ ...validPost, published: true, publishDate: undefined })
    ).rejects.toThrow();

    // Invalid slug
    await expect(
      postSchema.validate({ ...validPost, slug: 'Invalid Slug!' })
    ).rejects.toThrow();
  });

  test('form with conditional fields', async () => {
    const formSchema = yup.object({
      accountType: yup.string().oneOf(['personal', 'business']).required(),
      firstName: yup.string().when('accountType', {
        is: 'personal',
        then: (schema) => schema.required(),
      }),
      lastName: yup.string().when('accountType', {
        is: 'personal',
        then: (schema) => schema.required(),
      }),
      companyName: yup.string().when('accountType', {
        is: 'business',
        then: (schema) => schema.required(),
      }),
      taxId: yup.string().when('accountType', {
        is: 'business',
        then: (schema) => schema.required(),
      }),
    });

    // Personal account
    await expect(
      formSchema.validate({
        accountType: 'personal',
        firstName: 'John',
        lastName: 'Doe',
      })
    ).resolves.toBeDefined();

    // Business account
    await expect(
      formSchema.validate({
        accountType: 'business',
        companyName: 'Acme Corp',
        taxId: '12-3456789',
      })
    ).resolves.toBeDefined();

    // Personal without required fields
    await expect(
      formSchema.validate({
        accountType: 'personal',
      })
    ).rejects.toThrow();
  });

  test('multi-step form validation', async () => {
    const step1Schema = yup.object({
      email: yup.string().email().required(),
      password: yup.string().min(8).required(),
    });

    const step2Schema = yup.object({
      firstName: yup.string().required(),
      lastName: yup.string().required(),
      phone: yup.string().required(),
    });

    const step3Schema = yup.object({
      address: yup.string().required(),
      city: yup.string().required(),
      country: yup.string().required(),
    });

    const completeSchema = step1Schema.shape(step2Schema.describe().tests as any).shape(step3Schema.describe().tests as any);

    // Validate each step individually
    await expect(
      step1Schema.validate({ email: 'user@example.com', password: 'password123' })
    ).resolves.toBeDefined();

    await expect(
      step2Schema.validate({ firstName: 'John', lastName: 'Doe', phone: '555-0123' })
    ).resolves.toBeDefined();

    await expect(
      step3Schema.validate({ address: '123 Main St', city: 'NYC', country: 'USA' })
    ).resolves.toBeDefined();
  });

  test('nested validation with arrays and objects', async () => {
    const companySchema = yup.object({
      name: yup.string().required(),
      departments: yup.array(
        yup.object({
          name: yup.string().required(),
          manager: yup.object({
            name: yup.string().required(),
            email: yup.string().email().required(),
          }),
          employees: yup.array(
            yup.object({
              name: yup.string().required(),
              role: yup.string().required(),
              salary: yup.number().positive().required(),
            })
          ),
        })
      ),
    });

    const validCompany = {
      name: 'Tech Corp',
      departments: [
        {
          name: 'Engineering',
          manager: { name: 'Alice', email: 'alice@techcorp.com' },
          employees: [
            { name: 'Bob', role: 'Developer', salary: 80000 },
            { name: 'Carol', role: 'Designer', salary: 75000 },
          ],
        },
      ],
    };

    await expect(companySchema.validate(validCompany)).resolves.toBeDefined();
  });

  test('transformation pipeline', () => {
    const schema = yup
      .string()
      .trim()
      .lowercase()
      .transform((value) => value.replace(/\s+/g, '-'));

    expect(schema.cast('  Hello World  ')).toBe('hello-world');
  });

  test('complex validation with all error messages', async () => {
    const schema = yup.object({
      username: yup.string().min(3).max(20).required(),
      email: yup.string().email().required(),
      age: yup.number().positive().integer().required(),
    });

    try {
      await schema.validate(
        { username: 'ab', email: 'invalid', age: -5 },
        { abortEarly: false }
      );
      fail('Should have thrown');
    } catch (err: any) {
      expect(err.inner.length).toBeGreaterThan(0);
    }
  });
});
