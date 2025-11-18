/**
 * Hooks Example
 *
 * Demonstrates:
 * - onRequest hook
 * - preHandler hook
 * - onSend hook
 * - onResponse hook
 * - onError hook
 * - Hook execution order
 * - Custom hooks (CORS, auth, rate limiting)
 */

import { fastify } from '../src/fastify';
import { HookUtils } from '../src/hooks';

const app = fastify({
  logger: true,
});

// Global timing hooks
const timing = HookUtils.createTimingHook();
app.addHook('onRequest', timing.onRequest);
app.addHook('onResponse', timing.onResponse);

// Request ID hook
app.addHook('onRequest', HookUtils.createRequestIdHook());

// Security headers
app.addHook('onRequest', HookUtils.createSecurityHeadersHook());

// CORS support
app.addHook('onRequest', HookUtils.createCORSHook({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['Content-Type', 'Authorization'],
}));

// Logging hook
app.addHook('onRequest', async (request, reply) => {
  request.log.info({
    method: request.method,
    url: request.url,
    id: request.id,
  }, 'Incoming request');
});

// Pre-handler hook for request modification
app.addHook('preHandler', async (request, reply) => {
  // Add custom data to request
  (request as any).customData = {
    processedAt: new Date().toISOString(),
    version: 'v1',
  };
});

// onSend hook to modify response
app.addHook('onSend', async (request, reply) => {
  request.log.info({
    method: request.method,
    url: request.url,
    statusCode: reply.raw.statusCode,
  }, 'Sending response');
});

// onResponse hook for cleanup
app.addHook('onResponse', async (request, reply) => {
  const responseTime = reply.getResponseTime();
  request.log.info({
    method: request.method,
    url: request.url,
    statusCode: reply.raw.statusCode,
    responseTime: `${responseTime}ms`,
  }, 'Request completed');
});

// Error hook
app.addHook('onError', async (request, reply) => {
  request.log.error('Error occurred during request processing');
} as any);

// Routes

app.get('/', async (request, reply) => {
  return {
    message: 'Hooks example server',
    requestId: request.id,
    customData: (request as any).customData,
  };
});

// Route demonstrating protected resource
app.get('/protected', {
  preHandler: [
    HookUtils.createAuthHook(async (token) => {
      // Simple token validation
      return token === 'valid-token-123';
    }),
  ],
}, async (request, reply) => {
  return {
    message: 'This is a protected resource',
    user: (request as any).user,
  };
});

// Route with rate limiting
app.get('/rate-limited', {
  preHandler: [
    HookUtils.createRateLimitHook({
      max: 5,
      windowMs: 60000, // 1 minute
    }),
  ],
}, async (request, reply) => {
  return {
    message: 'This route is rate limited to 5 requests per minute',
    timestamp: new Date().toISOString(),
  };
});

// Route that triggers an error
app.get('/error', async (request, reply) => {
  throw new Error('Intentional error to demonstrate error hooks');
});

// Route with custom preHandler
app.get('/custom-hook', {
  preHandler: async (request, reply) => {
    // Custom validation
    const apiKey = request.headers['x-api-key'];
    if (!apiKey) {
      reply.code(401).send({ error: 'API key required' });
      return;
    }

    // Add API key info to request
    (request as any).apiKey = apiKey;
  },
}, async (request, reply) => {
  return {
    message: 'Custom hook validated the request',
    apiKey: (request as any).apiKey,
  };
});

// Route with multiple preHandlers
app.get('/multi-hooks', {
  preHandler: [
    async (request, reply) => {
      request.log.info('First hook');
      (request as any).hook1 = true;
    },
    async (request, reply) => {
      request.log.info('Second hook');
      (request as any).hook2 = true;
    },
    async (request, reply) => {
      request.log.info('Third hook');
      (request as any).hook3 = true;
    },
  ],
}, async (request, reply) => {
  return {
    message: 'All hooks executed',
    hooks: {
      hook1: (request as any).hook1,
      hook2: (request as any).hook2,
      hook3: (request as any).hook3,
    },
  };
});

// Custom error handler
app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  reply.code(500).send({
    error: 'Internal Server Error',
    message: error.message,
    requestId: request.id,
    timestamp: new Date().toISOString(),
  });
});

// Start server
const start = async () => {
  try {
    const address = await app.listen(3002);
    console.log(`Hooks example server listening on ${address}`);
    console.log('\nTry these URLs:');
    console.log('\n✅ Basic request (will show all hooks in action):');
    console.log('  curl http://localhost:3002/');
    console.log('\n🔒 Protected route (requires valid token):');
    console.log('  curl http://localhost:3002/protected -H "Authorization: Bearer valid-token-123"');
    console.log('\n❌ Protected route (invalid token):');
    console.log('  curl http://localhost:3002/protected -H "Authorization: Bearer invalid"');
    console.log('\n⏱️  Rate limited route (try calling 6 times quickly):');
    console.log('  curl http://localhost:3002/rate-limited');
    console.log('\n🔑 Custom hook route:');
    console.log('  curl http://localhost:3002/custom-hook -H "X-Api-Key: my-key"');
    console.log('\n🔗 Multiple hooks:');
    console.log('  curl http://localhost:3002/multi-hooks');
    console.log('\n💥 Error route:');
    console.log('  curl http://localhost:3002/error');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
