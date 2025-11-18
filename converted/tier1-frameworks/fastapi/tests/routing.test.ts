/**
 * FastAPI Routing Tests
 * Tests for route registration, path parameters, and request handling.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import FastAPI from '../src/fastapi';
import { APIRouter } from '../src/routing';

describe('FastAPI Routing', () => {
  let app: FastAPI;

  beforeEach(() => {
    app = new FastAPI({ title: 'Test API' });
  });

  it('should register GET route', () => {
    app.get('/test', async () => ({ message: 'GET test' }));
    const routes = app.getRoutes();
    expect(routes.has('/test')).toBe(true);
    expect(routes.get('/test')?.has('GET')).toBe(true);
  });

  it('should register POST route', () => {
    app.post('/test', async () => ({ message: 'POST test' }));
    const routes = app.getRoutes();
    expect(routes.has('/test')).toBe(true);
    expect(routes.get('/test')?.has('POST')).toBe(true);
  });

  it('should register multiple HTTP methods on same path', () => {
    app.get('/test', async () => ({ method: 'GET' }));
    app.post('/test', async () => ({ method: 'POST' }));
    app.put('/test', async () => ({ method: 'PUT' }));

    const routes = app.getRoutes();
    const methods = routes.get('/test');
    expect(methods?.size).toBe(3);
    expect(methods?.has('GET')).toBe(true);
    expect(methods?.has('POST')).toBe(true);
    expect(methods?.has('PUT')).toBe(true);
  });

  it('should support path parameters', () => {
    app.get('/users/{user_id}', async (req) => {
      return { user_id: req.params.user_id };
    });

    const routes = app.getRoutes();
    expect(routes.has('/users/{user_id}')).toBe(true);
  });

  it('should support multiple path parameters', () => {
    app.get('/users/{user_id}/posts/{post_id}', async (req) => {
      return {
        user_id: req.params.user_id,
        post_id: req.params.post_id,
      };
    });

    const routes = app.getRoutes();
    expect(routes.has('/users/{user_id}/posts/{post_id}')).toBe(true);
  });

  it('should support route metadata', () => {
    app.get('/test', async () => ({}), {
      summary: 'Test endpoint',
      description: 'This is a test',
      tags: ['testing'],
    });

    const routes = app.getRoutes();
    const route = routes.get('/test')?.get('GET');
    expect(route?.summary).toBe('Test endpoint');
    expect(route?.description).toBe('This is a test');
    expect(route?.tags).toEqual(['testing']);
  });

  it('should support custom status codes', () => {
    app.post('/created', async () => ({}), {
      status_code: 201,
    });

    const routes = app.getRoutes();
    const route = routes.get('/created')?.get('POST');
    expect(route?.status_code).toBe(201);
  });

  it('should create APIRouter', () => {
    const router = new APIRouter();
    expect(router).toBeDefined();
    expect(router.routes.size).toBe(0);
  });

  it('should add routes to APIRouter', () => {
    const router = new APIRouter();
    router.get('/test', async () => ({}));
    router.post('/test', async () => ({}));

    expect(router.routes.size).toBe(1);
    expect(router.routes.get('/test')?.size).toBe(2);
  });

  it('should include APIRouter with prefix', () => {
    const router = new APIRouter();
    router.get('/test', async () => ({ message: 'router test' }));

    app.include_router(router, '/api/v1');

    const routes = app.getRoutes();
    expect(routes.has('/api/v1/test')).toBe(true);
  });

  it('should include APIRouter with tags', () => {
    const router = new APIRouter();
    router.get('/test', async () => ({}), { tags: ['router'] });

    app.include_router(router, '', ['global']);

    const routes = app.getRoutes();
    const route = routes.get('/test')?.get('GET');
    expect(route?.tags).toContain('router');
    expect(route?.tags).toContain('global');
  });

  it('should support DELETE method', () => {
    app.delete('/users/{id}', async (req) => ({
      deleted: req.params.id,
    }));

    const routes = app.getRoutes();
    expect(routes.get('/users/{id}')?.has('DELETE')).toBe(true);
  });

  it('should support PATCH method', () => {
    app.patch('/users/{id}', async (req) => ({
      patched: req.params.id,
    }));

    const routes = app.getRoutes();
    expect(routes.get('/users/{id}')?.has('PATCH')).toBe(true);
  });

  it('should support HEAD method', () => {
    app.head('/health', async () => ({}));

    const routes = app.getRoutes();
    expect(routes.get('/health')?.has('HEAD')).toBe(true);
  });

  it('should support OPTIONS method', () => {
    app.options('/test', async () => ({}));

    const routes = app.getRoutes();
    expect(routes.get('/test')?.has('OPTIONS')).toBe(true);
  });
});
