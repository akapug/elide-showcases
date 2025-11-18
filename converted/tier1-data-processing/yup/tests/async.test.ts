/**
 * Async Validation Tests
 * Tests for asynchronous validation
 */

import * as yup from '../src/yup';

// Simulate async database check
async function checkUsernameExists(username: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 10));
  const existingUsers = ['admin', 'user', 'test'];
  return existingUsers.includes(username);
}

// Simulate async API validation
async function validateApiKey(key: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 10));
  return key.startsWith('sk_') && key.length === 32;
}

describe('Async Validation', () => {
  test('basic async validation', async () => {
    const schema = yup.string().test({
      name: 'checkUsername',
      message: 'Username already exists',
      test: async (value) => {
        if (!value) return true;
        const exists = await checkUsernameExists(value);
        return !exists;
      },
    });

    await expect(schema.validate('newuser')).resolves.toBe('newuser');
    await expect(schema.validate('admin')).rejects.toThrow('Username already exists');
  });

  test('async validation with custom error', async () => {
    const schema = yup.string().test({
      name: 'apiKey',
      message: 'Invalid API key format',
      test: async (value) => {
        if (!value) return true;
        return await validateApiKey(value);
      },
    });

    await expect(schema.validate('sk_' + 'x'.repeat(29))).resolves.toBeDefined();
    await expect(schema.validate('invalid_key')).rejects.toThrow('Invalid API key format');
  });

  test('multiple async validations', async () => {
    const schema = yup
      .string()
      .test({
        name: 'unique',
        message: 'Username already taken',
        test: async (value) => {
          if (!value) return true;
          const exists = await checkUsernameExists(value);
          return !exists;
        },
      })
      .test({
        name: 'length',
        message: 'Username must be 3-20 characters',
        test: (value) => {
          if (!value) return true;
          return value.length >= 3 && value.length <= 20;
        },
      });

    await expect(schema.validate('newuser')).resolves.toBe('newuser');
    await expect(schema.validate('admin')).rejects.toThrow('Username already taken');
    await expect(schema.validate('ab')).rejects.toThrow('Username must be 3-20 characters');
  });

  test('async object validation', async () => {
    const schema = yup.object({
      username: yup.string().test({
        name: 'unique',
        message: 'Username already exists',
        test: async (value) => {
          if (!value) return true;
          const exists = await checkUsernameExists(value);
          return !exists;
        },
      }),
      email: yup.string().email().required(),
    });

    await expect(
      schema.validate({ username: 'newuser', email: 'new@example.com' })
    ).resolves.toBeDefined();

    await expect(
      schema.validate({ username: 'admin', email: 'admin@example.com' })
    ).rejects.toThrow();
  });

  test('async validation with context', async () => {
    const schema = yup.object({
      currentPassword: yup.string(),
      newPassword: yup.string().test({
        name: 'passwordStrength',
        message: 'Password too weak',
        test: async (value, context) => {
          if (!value) return true;

          // Simulate async password strength check
          await new Promise((resolve) => setTimeout(resolve, 10));

          // Check against current password from context
          const current = context.parent.currentPassword;
          if (current && value === current) {
            return context.createError({ message: 'New password must differ from current' });
          }

          return value.length >= 8;
        },
      }),
    });

    await expect(
      schema.validate({ currentPassword: 'old123', newPassword: 'newpass123' })
    ).resolves.toBeDefined();

    await expect(
      schema.validate({ currentPassword: 'password', newPassword: 'password' })
    ).rejects.toThrow('New password must differ from current');
  });

  test('async validation with promises', async () => {
    const schema = yup.string().test({
      name: 'asyncCheck',
      message: 'Validation failed',
      test: (value) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(value !== 'forbidden');
          }, 10);
        });
      },
    });

    await expect(schema.validate('allowed')).resolves.toBe('allowed');
    await expect(schema.validate('forbidden')).rejects.toThrow();
  });

  test('async validation in arrays', async () => {
    const schema = yup.array(
      yup.string().test({
        name: 'uniqueUsername',
        message: 'Username ${value} is already taken',
        test: async (value) => {
          if (!value) return true;
          const exists = await checkUsernameExists(value);
          return !exists;
        },
      })
    );

    await expect(schema.validate(['newuser1', 'newuser2'])).resolves.toBeDefined();

    await expect(schema.validate(['admin', 'newuser'])).rejects.toThrow();
  });

  test('combined sync and async validations', async () => {
    const schema = yup
      .string()
      .min(3, 'Too short')
      .max(20, 'Too long')
      .matches(/^[a-z]+$/, 'Only lowercase letters')
      .test({
        name: 'available',
        message: 'Not available',
        test: async (value) => {
          if (!value) return true;
          const exists = await checkUsernameExists(value);
          return !exists;
        },
      });

    // Passes all validations
    await expect(schema.validate('newuser')).resolves.toBe('newuser');

    // Fails sync validation
    await expect(schema.validate('ab')).rejects.toThrow('Too short');

    // Fails async validation
    await expect(schema.validate('admin')).rejects.toThrow('Not available');

    // Fails regex validation
    await expect(schema.validate('User123')).rejects.toThrow('Only lowercase letters');
  });
});
