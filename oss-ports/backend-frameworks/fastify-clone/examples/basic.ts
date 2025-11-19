/**
 * Basic Fastify Clone Example
 *
 * Demonstrates basic server setup and simple routes
 */

import fastify from '../src/fastify.ts';

const app = fastify({
  logger: {
    level: 'info',
    prettyPrint: true
  }
});

// Basic GET route
app.get('/', async (request, reply) => {
  return { hello: 'world', timestamp: Date.now() };
});

// Route with URL parameters
app.get('/user/:id', async (request, reply) => {
  const { id } = request.params;
  return {
    userId: id,
    name: `User ${id}`,
    email: `user${id}@example.com`
  };
});

// Route with query parameters
app.get('/search', async (request, reply) => {
  const { q, limit = '10' } = request.query;
  return {
    query: q,
    limit: parseInt(limit),
    results: [
      { id: 1, title: `Result for "${q}" #1` },
      { id: 2, title: `Result for "${q}" #2` }
    ]
  };
});

// POST route
app.post('/echo', async (request, reply) => {
  return {
    received: request.body,
    method: request.method,
    timestamp: Date.now()
  };
});

// Multiple HTTP methods on same path
app.route({
  method: ['GET', 'POST'],
  url: '/multi',
  handler: async (request, reply) => {
    return {
      message: `Handled ${request.method} request`,
      method: request.method
    };
  }
});

// Status code example
app.get('/status/:code', async (request, reply) => {
  const code = parseInt(request.params.code);
  reply.code(code);
  return {
    statusCode: code,
    message: `Response with status ${code}`
  };
});

// Redirect example
app.get('/redirect', async (request, reply) => {
  return reply.redirect('/');
});

// Custom headers
app.get('/headers', async (request, reply) => {
  reply
    .header('X-Custom-Header', 'custom-value')
    .header('X-Request-Id', request.id);

  return {
    message: 'Check response headers',
    requestId: request.id
  };
});

// Start server
app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`\n🚀 Server ready at ${address}`);
  console.log(`\nTry these endpoints:`);
  console.log(`  GET  ${address}/`);
  console.log(`  GET  ${address}/user/123`);
  console.log(`  GET  ${address}/search?q=test&limit=5`);
  console.log(`  POST ${address}/echo`);
  console.log(`  GET  ${address}/multi`);
  console.log(`  GET  ${address}/status/201`);
  console.log(`  GET  ${address}/redirect`);
  console.log(`  GET  ${address}/headers\n`);
});
