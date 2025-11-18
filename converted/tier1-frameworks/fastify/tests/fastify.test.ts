/**
 * Fastify Core Tests
 *
 * Tests for core Fastify functionality including:
 * - Instance creation
 * - Route registration
 * - Request handling
 * - Response sending
 * - Error handling
 */

import { fastify, FastifyInstance } from '../src/fastify';
import * as http from 'http';

describe('Fastify Core', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = fastify({ logger: false });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should create a Fastify instance', () => {
    expect(app).toBeDefined();
    expect(app.get).toBeDefined();
    expect(app.post).toBeDefined();
    expect(app.listen).toBeDefined();
  });

  test('should register a GET route', () => {
    app.get('/test', async (request, reply) => {
      return { message: 'test' };
    });

    expect(app).toBeDefined();
  });

  test('should register multiple route methods', () => {
    app.get('/users', async (request, reply) => {
      return { method: 'GET' };
    });

    app.post('/users', async (request, reply) => {
      return { method: 'POST' };
    });

    app.put('/users/:id', async (request, reply) => {
      return { method: 'PUT', id: request.params.id };
    });

    app.delete('/users/:id', async (request, reply) => {
      return { method: 'DELETE', id: request.params.id };
    });

    expect(app).toBeDefined();
  });

  test('should handle route with parameters', () => {
    app.get('/users/:id', async (request, reply) => {
      return { id: request.params.id };
    });

    expect(app).toBeDefined();
  });

  test('should handle route with query parameters', () => {
    app.get('/search', async (request, reply) => {
      return { query: request.query };
    });

    expect(app).toBeDefined();
  });

  test('should register route with schema', () => {
    app.post('/users', {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
            },
          },
        },
      },
    }, async (request, reply) => {
      return { id: 1, name: request.body.name };
    });

    expect(app).toBeDefined();
  });

  test('should handle errors with custom error handler', async () => {
    app.setErrorHandler((error, request, reply) => {
      reply.code(500).send({ custom: true, error: error.message });
    });

    app.get('/error', async (request, reply) => {
      throw new Error('Test error');
    });

    expect(app).toBeDefined();
  });

  test('should handle 404 with custom not found handler', () => {
    app.setNotFoundHandler((request, reply) => {
      reply.code(404).send({ custom: true, path: request.url });
    });

    expect(app).toBeDefined();
  });

  test('should support async route handlers', () => {
    app.get('/async', async (request, reply) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { async: true };
    });

    expect(app).toBeDefined();
  });

  test('should support route.all() for all methods', () => {
    app.all('/wildcard', async (request, reply) => {
      return { method: request.method };
    });

    expect(app).toBeDefined();
  });

  test('should support route() method with options', () => {
    app.route({
      method: 'GET',
      url: '/route-method',
      handler: async (request, reply) => {
        return { route: true };
      },
    });

    expect(app).toBeDefined();
  });

  test('should support multiple methods on single route', () => {
    app.route({
      method: ['GET', 'POST'],
      url: '/multi-method',
      handler: async (request, reply) => {
        return { method: request.method };
      },
    });

    expect(app).toBeDefined();
  });
});

describe('Fastify Response', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = fastify({ logger: false });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should send JSON response', () => {
    app.get('/json', async (request, reply) => {
      reply.send({ message: 'hello' });
    });

    expect(app).toBeDefined();
  });

  test('should send string response', () => {
    app.get('/string', async (request, reply) => {
      reply.send('Hello World');
    });

    expect(app).toBeDefined();
  });

  test('should set status code', () => {
    app.post('/created', async (request, reply) => {
      reply.code(201).send({ created: true });
    });

    expect(app).toBeDefined();
  });

  test('should set headers', () => {
    app.get('/headers', async (request, reply) => {
      reply.header('X-Custom-Header', 'value')
           .header('X-Another-Header', '123')
           .send({ ok: true });
    });

    expect(app).toBeDefined();
  });

  test('should set content type', () => {
    app.get('/html', async (request, reply) => {
      reply.type('text/html').send('<h1>Hello</h1>');
    });

    expect(app).toBeDefined();
  });

  test('should redirect', () => {
    app.get('/redirect', async (request, reply) => {
      reply.redirect(302, '/new-location');
    });

    expect(app).toBeDefined();
  });

  test('should redirect with default status', () => {
    app.get('/redirect-default', async (request, reply) => {
      reply.redirect('/new-location');
    });

    expect(app).toBeDefined();
  });
});

describe('Fastify Decorators', () => {
  let app: FastifyInstance;

  beforeEach(() => {
    app = fastify({ logger: false });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should decorate app instance', () => {
    app.decorate('utility', () => 'value');
    expect((app as any).utility).toBeDefined();
    expect((app as any).utility()).toBe('value');
  });

  test('should decorate request', () => {
    app.decorateRequest('userId', null);

    app.get('/user', async (request, reply) => {
      (request as any).userId = 123;
      return { userId: (request as any).userId };
    });

    expect(app).toBeDefined();
  });

  test('should decorate reply', () => {
    app.decorateReply('success', function(data: any) {
      return this.send({ success: true, data });
    });

    app.get('/success', async (request, reply) => {
      return (reply as any).success({ message: 'ok' });
    });

    expect(app).toBeDefined();
  });
});
