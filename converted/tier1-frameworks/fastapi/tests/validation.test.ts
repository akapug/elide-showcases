/**
 * FastAPI Validation Tests
 * Tests for Pydantic model validation and parameter validation.
 */

import { describe, it, expect } from '@jest/globals';
import { BaseModel, Field, createModel, ValidationError } from '../src/models';

describe('FastAPI Validation', () => {
  it('should validate string fields', () => {
    const UserModel = createModel('User', {
      fields: {
        name: Field({ type: 'string', required: true }),
      },
    });

    const user = new UserModel({ name: 'John' });
    expect(user.dict()).toEqual({ name: 'John' });
  });

  it('should validate number fields', () => {
    const ProductModel = createModel('Product', {
      fields: {
        price: Field({ type: 'number', required: true }),
      },
    });

    const product = new ProductModel({ price: 29.99 });
    expect(product.dict()).toEqual({ price: 29.99 });
  });

  it('should validate required fields', () => {
    const UserModel = createModel('User', {
      fields: {
        email: Field({ type: 'string', required: true }),
      },
    });

    expect(() => {
      new UserModel({});
    }).toThrow();
  });

  it('should use default values', () => {
    const UserModel = createModel('User', {
      fields: {
        role: Field({ type: 'string', default: 'user' }),
      },
    });

    const user = new UserModel({});
    expect(user.dict()).toEqual({ role: 'user' });
  });

  it('should validate string length', () => {
    const UserModel = createModel('User', {
      fields: {
        username: Field({
          type: 'string',
          minLength: 3,
          maxLength: 20,
        }),
      },
    });

    expect(() => {
      new UserModel({ username: 'ab' });
    }).toThrow();

    expect(() => {
      new UserModel({ username: 'a'.repeat(21) });
    }).toThrow();

    const user = new UserModel({ username: 'john' });
    expect(user.dict()).toEqual({ username: 'john' });
  });

  it('should validate number ranges', () => {
    const ProductModel = createModel('Product', {
      fields: {
        quantity: Field({ type: 'number', min: 1, max: 100 }),
      },
    });

    expect(() => {
      new ProductModel({ quantity: 0 });
    }).toThrow();

    expect(() => {
      new ProductModel({ quantity: 101 });
    }).toThrow();

    const product = new ProductModel({ quantity: 50 });
    expect(product.dict()).toEqual({ quantity: 50 });
  });

  it('should validate string patterns', () => {
    const UserModel = createModel('User', {
      fields: {
        email: Field({
          type: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        }),
      },
    });

    expect(() => {
      new UserModel({ email: 'invalid-email' });
    }).toThrow();

    const user = new UserModel({ email: 'test@example.com' });
    expect(user.dict()).toEqual({ email: 'test@example.com' });
  });

  it('should validate enums', () => {
    const UserModel = createModel('User', {
      fields: {
        role: Field({
          type: 'string',
          enum: ['admin', 'user', 'guest'],
        }),
      },
    });

    expect(() => {
      new UserModel({ role: 'superadmin' });
    }).toThrow();

    const user = new UserModel({ role: 'admin' });
    expect(user.dict()).toEqual({ role: 'admin' });
  });

  it('should convert model to JSON', () => {
    const UserModel = createModel('User', {
      fields: {
        name: Field({ type: 'string' }),
        age: Field({ type: 'number' }),
      },
    });

    const user = new UserModel({ name: 'John', age: 30 });
    const json = user.json();
    expect(JSON.parse(json)).toEqual({ name: 'John', age: 30 });
  });

  it('should parse from object', () => {
    const UserModel = createModel('User', {
      fields: {
        name: Field({ type: 'string' }),
      },
    });

    const user = UserModel.parse_obj({ name: 'John' });
    expect(user.dict()).toEqual({ name: 'John' });
  });

  it('should parse from JSON string', () => {
    const UserModel = createModel('User', {
      fields: {
        name: Field({ type: 'string' }),
      },
    });

    const user = UserModel.parse_raw('{"name":"John"}');
    expect(user.dict()).toEqual({ name: 'John' });
  });

  it('should generate OpenAPI schema', () => {
    const UserModel = createModel('User', {
      title: 'User',
      description: 'User model',
      fields: {
        name: Field({ type: 'string', required: true, description: 'User name' }),
        age: Field({ type: 'number', min: 0, max: 150, description: 'User age' }),
      },
    });

    const schema = UserModel.schema();
    expect(schema.title).toBe('User');
    expect(schema.type).toBe('object');
    expect(schema.properties.name).toBeDefined();
    expect(schema.properties.age).toBeDefined();
    expect(schema.required).toContain('name');
  });

  it('should handle optional fields', () => {
    const UserModel = createModel('User', {
      fields: {
        name: Field({ type: 'string', required: true }),
        email: Field({ type: 'string', required: false }),
      },
    });

    const user = new UserModel({ name: 'John' });
    expect(user.dict()).toEqual({ name: 'John' });
  });

  it('should validate boolean fields', () => {
    const SettingsModel = createModel('Settings', {
      fields: {
        enabled: Field({ type: 'boolean' }),
      },
    });

    const settings = new SettingsModel({ enabled: true });
    expect(settings.dict()).toEqual({ enabled: true });
  });

  it('should validate array fields', () => {
    const PostModel = createModel('Post', {
      fields: {
        tags: Field({ type: 'array' }),
      },
    });

    const post = new PostModel({ tags: ['python', 'fastapi'] });
    expect(post.dict()).toEqual({ tags: ['python', 'fastapi'] });
  });
});
