/**
 * Lifecycle Hooks Example
 *
 * Demonstrates the complete lifecycle hooks system
 */

import fastify from '../src/fastify.ts';

const app = fastify({ logger: true });

// Track request timing
app.decorateRequest('startTime', 0);
app.decorateRequest('timings', {});

// onRequest - First hook in lifecycle
app.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();
  request.log.info(`[onRequest] ${request.method} ${request.url}`);
});

// preParsing - Before body parsing
app.addHook('preParsing', async (request, reply) => {
  request.timings.preParsing = Date.now() - request.startTime;
  request.log.info('[preParsing] About to parse request body');
});

// preValidation - Before schema validation
app.addHook('preValidation', async (request, reply) => {
  request.timings.preValidation = Date.now() - request.startTime;
  request.log.info('[preValidation] About to validate request');
});

// preHandler - Before route handler
app.addHook('preHandler', async (request, reply) => {
  request.timings.preHandler = Date.now() - request.startTime;
  request.log.info('[preHandler] About to execute route handler');

  // Example: Add user context
  request.user = {
    id: 123,
    username: 'demo-user'
  };
});

// onResponse - After response sent
app.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - request.startTime;
  request.log.info(
    `[onResponse] Request completed in ${duration}ms`,
    { timings: request.timings, statusCode: reply.statusCode }
  );
});

// onError - When error occurs
app.addHook('onError', async (error, request, reply) => {
  request.log.error('[onError] Error occurred:', error.message);
});

// Routes with route-specific hooks
app.get('/simple', async (request, reply) => {
  return {
    message: 'Simple route with global hooks',
    user: request.user,
    timings: request.timings
  };
});

// Route with its own hooks
app.get('/with-hooks', {
  onRequest: [
    async (request, reply) => {
      request.log.info('[Route Hook] Custom onRequest hook');
    }
  ],
  preHandler: [
    async (request, reply) => {
      request.log.info('[Route Hook] Custom preHandler hook');
      request.customData = 'Added by route hook';
    }
  ]
}, async (request, reply) => {
  return {
    message: 'Route with custom hooks',
    customData: request.customData,
    user: request.user
  };
});

// Route that demonstrates authentication hook
app.get('/protected', {
  onRequest: [
    async (request, reply) => {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header'
        });
        return;
      }

      // Simulate token validation
      const token = authHeader.substring(7);
      if (token !== 'secret-token') {
        reply.code(403).send({
          error: 'Forbidden',
          message: 'Invalid token'
        });
        return;
      }

      request.authenticated = true;
    }
  ]
}, async (request, reply) => {
  return {
    message: 'Protected resource',
    authenticated: request.authenticated,
    user: request.user
  };
});

// Route that demonstrates rate limiting hook
const requestCounts = new Map();

app.get('/rate-limited', {
  preHandler: [
    async (request, reply) => {
      const ip = request.ip;
      const count = requestCounts.get(ip) || 0;

      if (count >= 5) {
        reply.code(429).send({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded'
        });
        return;
      }

      requestCounts.set(ip, count + 1);

      // Reset after 1 minute
      setTimeout(() => {
        requestCounts.delete(ip);
      }, 60000);
    }
  ]
}, async (request, reply) => {
  return {
    message: 'Rate limited endpoint',
    requestsRemaining: 5 - (requestCounts.get(request.ip) || 0)
  };
});

// Route with validation hook
app.post('/validated', {
  preValidation: [
    async (request, reply) => {
      // Custom validation logic
      if (!request.body || typeof request.body !== 'object') {
        reply.code(400).send({
          error: 'Bad Request',
          message: 'Request body must be a JSON object'
        });
        return;
      }
    }
  ],
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
  return {
    message: 'Data validated successfully',
    data: request.body
  };
});

// Route that triggers an error
app.get('/error', async (request, reply) => {
  throw new Error('Intentional error for testing');
});

// onReady hook
app.addHook('onReady', (done) => {
  console.log('Server is ready!');
  done();
});

// onClose hook
app.addHook('onClose', (instance, done) => {
  console.log('Server is closing...');
  // Cleanup logic here
  done();
});

// Start server
app.listen({ port: 3002 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`\n🚀 Server ready at ${address}`);
  console.log(`\nHooks examples:`);
  console.log(`  GET  ${address}/simple - Route with global hooks`);
  console.log(`  GET  ${address}/with-hooks - Route with custom hooks`);
  console.log(`  GET  ${address}/protected - Authentication hook`);
  console.log(`       Header: Authorization: Bearer secret-token`);
  console.log(`  GET  ${address}/rate-limited - Rate limiting hook`);
  console.log(`  POST ${address}/validated - Validation hooks`);
  console.log(`  GET  ${address}/error - Error handling hook\n`);
});
