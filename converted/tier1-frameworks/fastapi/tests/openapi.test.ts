/**
 * FastAPI OpenAPI Tests
 * Tests for OpenAPI schema generation and documentation.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import FastAPI from '../src/fastapi';
import { OpenAPIGenerator } from '../src/openapi';

describe('FastAPI OpenAPI', () => {
  let app: FastAPI;

  beforeEach(() => {
    app = new FastAPI({
      title: 'Test API',
      description: 'Test API Description',
      version: '1.0.0',
    });
  });

  it('should generate basic OpenAPI schema', () => {
    const schema = app.openapi();

    expect(schema.openapi).toBe('3.0.2');
    expect(schema.info.title).toBe('Test API');
    expect(schema.info.description).toBe('Test API Description');
    expect(schema.info.version).toBe('1.0.0');
  });

  it('should include routes in OpenAPI schema', () => {
    app.get('/users', async () => ({}), {
      summary: 'Get users',
      description: 'Retrieve all users',
    });

    const schema = app.openapi();

    expect(schema.paths['/users']).toBeDefined();
    expect(schema.paths['/users'].get).toBeDefined();
    expect(schema.paths['/users'].get.summary).toBe('Get users');
  });

  it('should include tags in OpenAPI schema', () => {
    app.get('/users', async () => ({}), {
      tags: ['Users'],
    });

    const schema = app.openapi();

    expect(schema.tags).toBeDefined();
    expect(schema.tags?.find(t => t.name === 'Users')).toBeDefined();
  });

  it('should include path parameters in schema', () => {
    app.get('/users/{user_id}', async () => ({}), {
      summary: 'Get user by ID',
    });

    const schema = app.openapi();

    expect(schema.paths['/users/{user_id}'].get.parameters).toBeDefined();
    const params = schema.paths['/users/{user_id}'].get.parameters;
    expect(params.find((p: any) => p.name === 'user_id')).toBeDefined();
  });

  it('should include response codes', () => {
    app.get('/users', async () => ({}), {
      status_code: 200,
    });

    const schema = app.openapi();

    expect(schema.paths['/users'].get.responses['200']).toBeDefined();
    expect(schema.paths['/users'].get.responses['422']).toBeDefined();
  });

  it('should exclude routes with include_in_schema: false', () => {
    app.get('/internal', async () => ({}), {
      include_in_schema: false,
    });

    const schema = app.openapi();

    expect(schema.paths['/internal']).toBeUndefined();
  });

  it('should mark deprecated routes', () => {
    app.get('/old-endpoint', async () => ({}), {
      deprecated: true,
    });

    const schema = app.openapi();

    expect(schema.paths['/old-endpoint'].get.deprecated).toBe(true);
  });

  it('should generate operation IDs', () => {
    app.get('/users/{id}', async () => ({}));

    const schema = app.openapi();

    expect(schema.paths['/users/{id}'].get.operationId).toBeDefined();
  });

  it('should include custom responses', () => {
    app.get('/users', async () => ({}), {
      responses: {
        404: {
          description: 'User not found',
        },
      },
    });

    const schema = app.openapi();

    expect(schema.paths['/users'].get.responses['404']).toBeDefined();
  });
});
