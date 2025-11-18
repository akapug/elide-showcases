/**
 * Basic Fastify Server Example
 *
 * Demonstrates:
 * - Creating a Fastify instance
 * - Registering routes
 * - Handling different HTTP methods
 * - Route parameters
 * - Query parameters
 * - JSON responses
 */

import { fastify } from '../src/fastify';

const app = fastify({
  logger: true,
});

// Simple GET route
app.get('/', async (request, reply) => {
  return {
    message: 'Welcome to Fastify on Elide!',
    framework: 'Fastify',
    runtime: 'Elide/GraalVM',
    features: [
      'Fast routing',
      'Schema validation',
      'Hook system',
      'Plugin architecture',
      'Polyglot support',
    ],
  };
});

// Route with parameter
app.get('/users/:id', async (request, reply) => {
  const { id } = request.params;

  return {
    user: {
      id,
      name: `User ${id}`,
      email: `user${id}@example.com`,
    },
  };
});

// Route with query parameters
app.get('/search', async (request, reply) => {
  const { q, page, limit } = request.query;

  return {
    query: q || '',
    page: page || 1,
    limit: limit || 10,
    results: [
      { id: 1, title: 'Result 1' },
      { id: 2, title: 'Result 2' },
    ],
  };
});

// POST route with body
app.post('/users', async (request, reply) => {
  const body = request.body;

  // In a real app, you'd save to database
  const newUser = {
    id: Math.floor(Math.random() * 1000),
    ...body,
    createdAt: new Date().toISOString(),
  };

  reply.code(201).send(newUser);
});

// PUT route for updates
app.put('/users/:id', async (request, reply) => {
  const { id } = request.params;
  const body = request.body;

  return {
    id,
    ...body,
    updatedAt: new Date().toISOString(),
  };
});

// DELETE route
app.delete('/users/:id', async (request, reply) => {
  const { id } = request.params;

  reply.code(204).send();
});

// Route with custom status and headers
app.get('/custom-response', async (request, reply) => {
  reply
    .code(200)
    .header('X-Custom-Header', 'Fastify on Elide')
    .header('X-Powered-By', 'GraalVM')
    .type('application/json')
    .send({
      message: 'Custom response with headers',
      timestamp: new Date().toISOString(),
    });
});

// Route that demonstrates returning value directly
app.get('/direct-return', async (request, reply) => {
  // Fastify automatically sends returned objects as JSON
  return {
    method: 'direct return',
    status: 'success',
  };
});

// Route with async operations
app.get('/async-operation', async (request, reply) => {
  // Simulate async database query
  const data = await new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: 1, data: 'Async result' });
    }, 100);
  });

  return data;
});

// Route that demonstrates error handling
app.get('/error', async (request, reply) => {
  throw new Error('This is a test error');
});

// Wildcard route (catches all)
app.get('/files/*', async (request, reply) => {
  const filepath = request.params['*'];

  return {
    message: 'File route',
    path: filepath,
    note: 'In a real app, this would serve static files',
  };
});

// Start server
const start = async () => {
  try {
    const address = await app.listen(3000);
    console.log(`Server listening on ${address}`);
    console.log('\nTry these URLs:');
    console.log('  http://localhost:3000/');
    console.log('  http://localhost:3000/users/123');
    console.log('  http://localhost:3000/search?q=fastify&page=1');
    console.log('  http://localhost:3000/custom-response');
    console.log('  http://localhost:3000/files/path/to/file.txt');
    console.log('\nOr use curl to test POST:');
    console.log('  curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d \'{"name":"John","email":"john@example.com"}\'');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
