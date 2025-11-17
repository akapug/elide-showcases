/**
 * Fastify Clone Tests
 *
 * Comprehensive test suite for the Fastify clone implementation
 */

import fastify from '../src/fastify.ts';

// Test utilities
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

// ==================== BASIC ROUTING TESTS ====================

async function testBasicRouting() {
  console.log('Testing basic routing...');

  const app = fastify();

  app.get('/test', async (request, reply) => {
    return { message: 'test' };
  });

  const response = await app.inject({
    method: 'GET',
    url: '/test'
  });

  assertEqual(response.statusCode, 200, 'Status code should be 200');
  const data = response.json();
  assertEqual(data.message, 'test', 'Response should contain correct message');

  console.log('✓ Basic routing test passed');
}

// ==================== ROUTE PARAMETERS TESTS ====================

async function testRouteParameters() {
  console.log('Testing route parameters...');

  const app = fastify();

  app.get('/users/:id', async (request, reply) => {
    return { userId: request.params.id };
  });

  const response = await app.inject({
    method: 'GET',
    url: '/users/123'
  });

  assertEqual(response.statusCode, 200, 'Status code should be 200');
  const data = response.json();
  assertEqual(data.userId, '123', 'Param should be extracted correctly');

  console.log('✓ Route parameters test passed');
}

// ==================== QUERY STRING TESTS ====================

async function testQueryString() {
  console.log('Testing query string parsing...');

  const app = fastify();

  app.get('/search', async (request, reply) => {
    return { query: request.query };
  });

  const response = await app.inject({
    method: 'GET',
    url: '/search',
    query: { q: 'test', limit: '10' }
  });

  assertEqual(response.statusCode, 200, 'Status code should be 200');
  const data = response.json();
  assertEqual(data.query.q, 'test', 'Query param q should be parsed');
  assertEqual(data.query.limit, '10', 'Query param limit should be parsed');

  console.log('✓ Query string test passed');
}

// ==================== POST BODY TESTS ====================

async function testPostBody() {
  console.log('Testing POST body parsing...');

  const app = fastify();

  app.post('/users', async (request, reply) => {
    return { received: request.body };
  });

  const payload = { name: 'John', email: 'john@example.com' };

  const response = await app.inject({
    method: 'POST',
    url: '/users',
    headers: { 'content-type': 'application/json' },
    payload
  });

  assertEqual(response.statusCode, 200, 'Status code should be 200');
  const data = response.json();
  assertEqual(data.received.name, 'John', 'Body should be parsed correctly');

  console.log('✓ POST body test passed');
}

// ==================== STATUS CODE TESTS ====================

async function testStatusCodes() {
  console.log('Testing status codes...');

  const app = fastify();

  app.get('/created', async (request, reply) => {
    reply.code(201);
    return { message: 'created' };
  });

  app.get('/not-found', async (request, reply) => {
    reply.code(404);
    return { error: 'Not found' };
  });

  const response1 = await app.inject({
    method: 'GET',
    url: '/created'
  });
  assertEqual(response1.statusCode, 201, 'Should return 201');

  const response2 = await app.inject({
    method: 'GET',
    url: '/not-found'
  });
  assertEqual(response2.statusCode, 404, 'Should return 404');

  console.log('✓ Status code test passed');
}

// ==================== HOOKS TESTS ====================

async function testHooks() {
  console.log('Testing lifecycle hooks...');

  const app = fastify();
  const hooksCalled: string[] = [];

  app.addHook('onRequest', async (request, reply) => {
    hooksCalled.push('onRequest');
  });

  app.addHook('preHandler', async (request, reply) => {
    hooksCalled.push('preHandler');
  });

  app.addHook('onResponse', async (request, reply) => {
    hooksCalled.push('onResponse');
  });

  app.get('/test', async (request, reply) => {
    hooksCalled.push('handler');
    return { success: true };
  });

  await app.inject({
    method: 'GET',
    url: '/test'
  });

  assert(hooksCalled.includes('onRequest'), 'onRequest hook should be called');
  assert(hooksCalled.includes('preHandler'), 'preHandler hook should be called');
  assert(hooksCalled.includes('handler'), 'handler should be called');
  assert(hooksCalled.includes('onResponse'), 'onResponse hook should be called');

  console.log('✓ Hooks test passed');
}

// ==================== ERROR HANDLING TESTS ====================

async function testErrorHandling() {
  console.log('Testing error handling...');

  const app = fastify();

  app.get('/error', async (request, reply) => {
    throw new Error('Test error');
  });

  app.setErrorHandler(async (error, request, reply) => {
    reply.code(500).send({
      custom: true,
      message: error.message
    });
  });

  const response = await app.inject({
    method: 'GET',
    url: '/error'
  });

  assertEqual(response.statusCode, 500, 'Should return 500');
  const data = response.json();
  assert(data.custom, 'Custom error handler should be called');

  console.log('✓ Error handling test passed');
}

// ==================== DECORATORS TESTS ====================

async function testDecorators() {
  console.log('Testing decorators...');

  const app = fastify();

  app.decorate('utility', () => 'useful value');

  app.get('/test', async (request, reply) => {
    return { value: app.utility() };
  });

  const response = await app.inject({
    method: 'GET',
    url: '/test'
  });

  const data = response.json();
  assertEqual(data.value, 'useful value', 'Decorator should work');

  console.log('✓ Decorators test passed');
}

// ==================== SCHEMA VALIDATION TESTS ====================

async function testSchemaValidation() {
  console.log('Testing schema validation...');

  const app = fastify();

  app.post('/users', {
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    return { success: true };
  });

  // Valid request
  const response1 = await app.inject({
    method: 'POST',
    url: '/users',
    payload: { name: 'John', email: 'john@example.com' }
  });

  assertEqual(response1.statusCode, 200, 'Valid request should succeed');

  // Invalid request (missing required field)
  const response2 = await app.inject({
    method: 'POST',
    url: '/users',
    payload: { email: 'john@example.com' }
  });

  assertEqual(response2.statusCode, 400, 'Invalid request should return 400');

  console.log('✓ Schema validation test passed');
}

// ==================== PLUGIN TESTS ====================

async function testPlugins() {
  console.log('Testing plugin system...');

  const app = fastify();

  const testPlugin = async (fastify: any, options: any) => {
    fastify.decorate('pluginData', options.value);
  };

  app.register(testPlugin, { value: 'plugin-value' });

  app.get('/test', async (request, reply) => {
    return { data: app.pluginData };
  });

  await app.ready();

  const response = await app.inject({
    method: 'GET',
    url: '/test'
  });

  const data = response.json();
  assertEqual(data.data, 'plugin-value', 'Plugin should be loaded');

  console.log('✓ Plugin test passed');
}

// ==================== HEADERS TESTS ====================

async function testHeaders() {
  console.log('Testing headers...');

  const app = fastify();

  app.get('/test', async (request, reply) => {
    reply
      .header('X-Custom-Header', 'custom-value')
      .type('application/json');

    return { success: true };
  });

  const response = await app.inject({
    method: 'GET',
    url: '/test'
  });

  assertEqual(response.headers['x-custom-header'], 'custom-value', 'Custom header should be set');

  console.log('✓ Headers test passed');
}

// ==================== NOT FOUND TESTS ====================

async function testNotFound() {
  console.log('Testing 404 handling...');

  const app = fastify();

  app.setNotFoundHandler(async (request, reply) => {
    reply.code(404).send({
      custom: true,
      path: request.url
    });
  });

  const response = await app.inject({
    method: 'GET',
    url: '/non-existent'
  });

  assertEqual(response.statusCode, 404, 'Should return 404');
  const data = response.json();
  assert(data.custom, 'Custom 404 handler should be called');

  console.log('✓ Not found test passed');
}

// ==================== RUN ALL TESTS ====================

async function runTests() {
  console.log('\n=== Running Fastify Clone Tests ===\n');

  const tests = [
    testBasicRouting,
    testRouteParameters,
    testQueryString,
    testPostBody,
    testStatusCodes,
    testHooks,
    testErrorHandling,
    testDecorators,
    testSchemaValidation,
    testPlugins,
    testHeaders,
    testNotFound
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (err) {
      console.error(`✗ Test failed: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== Test Results ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${tests.length}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
