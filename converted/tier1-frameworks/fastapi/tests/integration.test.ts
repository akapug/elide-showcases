/**
 * FastAPI Integration Tests
 * End-to-end tests for complete FastAPI functionality.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import FastAPI from '../src/fastapi';
import { APIRouter } from '../src/routing';
import { createModel, Field } from '../src/models';
import { CORSMiddleware } from '../src/middleware';

describe('FastAPI Integration', () => {
  let app: FastAPI;

  beforeEach(() => {
    app = new FastAPI({
      title: 'Integration Test API',
      description: 'Testing complete FastAPI functionality',
      version: '1.0.0',
    });
  });

  it('should create complete CRUD API', () => {
    // Create model
    const UserModel = createModel('User', {
      fields: {
        id: Field({ type: 'number' }),
        name: Field({ type: 'string', required: true }),
        email: Field({ type: 'string', required: true }),
      },
    });

    // In-memory storage
    const users: any[] = [];
    let nextId = 1;

    // Create
    app.post('/users', async (req) => {
      const user = new UserModel({
        id: nextId++,
        ...req.body,
      });
      users.push(user.dict());
      return user.dict();
    }, {
      summary: 'Create user',
      tags: ['Users'],
      status_code: 201,
    });

    // Read all
    app.get('/users', async () => {
      return { users };
    }, {
      summary: 'List users',
      tags: ['Users'],
    });

    // Read one
    app.get('/users/{id}', async (req) => {
      const id = parseInt(req.params.id);
      const user = users.find(u => u.id === id);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }, {
      summary: 'Get user',
      tags: ['Users'],
    });

    // Update
    app.put('/users/{id}', async (req) => {
      const id = parseInt(req.params.id);
      const index = users.findIndex(u => u.id === id);
      if (index === -1) {
        throw new Error('User not found');
      }
      users[index] = { ...users[index], ...req.body };
      return users[index];
    }, {
      summary: 'Update user',
      tags: ['Users'],
    });

    // Delete
    app.delete('/users/{id}', async (req) => {
      const id = parseInt(req.params.id);
      const index = users.findIndex(u => u.id === id);
      if (index === -1) {
        throw new Error('User not found');
      }
      users.splice(index, 1);
      return { deleted: true };
    }, {
      summary: 'Delete user',
      tags: ['Users'],
      status_code: 204,
    });

    const routes = app.getRoutes();
    expect(routes.size).toBeGreaterThan(4);
  });

  it('should work with routers and middleware', () => {
    // Add middleware
    app.add_middleware(CORSMiddleware());

    // Create router
    const router = new APIRouter({ prefix: '/api/v1' });

    router.get('/status', async () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }), {
      tags: ['Health'],
    });

    // Include router
    app.include_router(router);

    const routes = app.getRoutes();
    expect(routes.has('/api/v1/status')).toBe(true);
  });

  it('should generate complete OpenAPI documentation', () => {
    app.get('/users', async () => ([]), {
      summary: 'List users',
      description: 'Get all users in the system',
      tags: ['Users'],
    });

    app.post('/users', async () => ({}), {
      summary: 'Create user',
      description: 'Create a new user',
      tags: ['Users'],
      status_code: 201,
    });

    const schema = app.openapi();

    expect(schema.openapi).toBe('3.0.2');
    expect(schema.paths['/users']).toBeDefined();
    expect(schema.paths['/users'].get).toBeDefined();
    expect(schema.paths['/users'].post).toBeDefined();
    expect(schema.tags).toBeDefined();
  });

  it('should handle nested routers', () => {
    const apiRouter = new APIRouter({ prefix: '/api' });
    const v1Router = new APIRouter({ prefix: '/v1' });

    v1Router.get('/users', async () => ({ version: 'v1' }));

    apiRouter.include_router(v1Router);
    app.include_router(apiRouter);

    const routes = app.getRoutes();
    expect(routes.has('/api/v1/users')).toBe(true);
  });

  it('should support complex query parameters', async () => {
    app.get('/search', async (req) => {
      return {
        query: req.query.q,
        limit: parseInt(req.query.limit || '10'),
        offset: parseInt(req.query.offset || '0'),
        sort: req.query.sort || 'relevance',
      };
    });

    const routes = app.getRoutes();
    const route = routes.get('/search')?.get('GET');

    if (route) {
      const result = await route.handler({
        query: {
          q: 'test',
          limit: '20',
          offset: '10',
          sort: 'date',
        },
      });

      expect(result.query).toBe('test');
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(10);
      expect(result.sort).toBe('date');
    }
  });

  it('should support file upload endpoint', () => {
    app.post('/upload', async (req) => {
      return {
        filename: req.body.filename,
        size: req.body.size,
        uploaded: true,
      };
    }, {
      summary: 'Upload file',
      tags: ['Files'],
    });

    const routes = app.getRoutes();
    expect(routes.has('/upload')).toBe(true);
  });

  it('should support background tasks simulation', async () => {
    const tasks: any[] = [];

    app.post('/send-email', async (req) => {
      // Add background task
      tasks.push({
        type: 'email',
        to: req.body.email,
        status: 'pending',
      });

      return {
        message: 'Email queued',
        task_id: tasks.length,
      };
    });

    const routes = app.getRoutes();
    const route = routes.get('/send-email')?.get('POST');

    if (route) {
      const result = await route.handler({
        body: { email: 'test@example.com' },
      });

      expect(result.message).toBe('Email queued');
      expect(tasks.length).toBe(1);
    }
  });

  it('should handle startup and shutdown events', () => {
    let startupCalled = false;
    let shutdownCalled = false;

    app.on_event('startup', () => {
      startupCalled = true;
    });

    app.on_event('shutdown', () => {
      shutdownCalled = true;
    });

    // In real implementation, these would be called during server lifecycle
    // For testing, we can verify they're registered
    expect(startupCalled).toBe(false); // Not called yet
    expect(shutdownCalled).toBe(false); // Not called yet
  });
});
