/**
 * Error Handling Example
 *
 * Demonstrates comprehensive error handling patterns
 */

import fastify from '../src/fastify.ts';

const app = fastify({ logger: true });

// ==================== CUSTOM ERROR CLASSES ====================

class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';

  constructor(message: string, public fields?: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends Error {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends Error {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends Error {
  statusCode = 409;
  code = 'CONFLICT';

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

// ==================== GLOBAL ERROR HANDLER ====================

app.setErrorHandler(async (error: any, request, reply) => {
  const { statusCode = 500, code, message } = error;

  // Log error
  request.log.error({
    err: error,
    url: request.url,
    method: request.method
  });

  // Prepare error response
  const errorResponse: any = {
    error: true,
    code: code || 'INTERNAL_ERROR',
    message,
    statusCode
  };

  // Add validation errors if present
  if (error.validation) {
    errorResponse.validation = error.validation;
  }

  // Add field errors for validation errors
  if (error.fields) {
    errorResponse.fields = error.fields;
  }

  // Don't expose internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    errorResponse.message = 'Internal server error';
    delete errorResponse.stack;
  } else if (statusCode === 500) {
    errorResponse.stack = error.stack?.split('\n');
  }

  reply.code(statusCode).send(errorResponse);
});

// ==================== CUSTOM 404 HANDLER ====================

app.setNotFoundHandler(async (request, reply) => {
  reply.code(404).send({
    error: true,
    code: 'NOT_FOUND',
    message: `Route ${request.method}:${request.url} not found`,
    statusCode: 404,
    availableRoutes: [
      'GET /users',
      'POST /users',
      'GET /users/:id'
    ]
  });
});

// ==================== ERROR ROUTES ====================

// Synchronous error
app.get('/error/sync', async (request, reply) => {
  throw new Error('Synchronous error occurred');
});

// Asynchronous error
app.get('/error/async', async (request, reply) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  throw new Error('Asynchronous error occurred');
});

// Validation error
app.post('/users', async (request, reply) => {
  const { username, email, age } = request.body;

  const errors: Record<string, string> = {};

  if (!username || username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  }

  if (!email || !email.includes('@')) {
    errors.email = 'Valid email is required';
  }

  if (age && (age < 18 || age > 120)) {
    errors.age = 'Age must be between 18 and 120';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return {
    success: true,
    user: { username, email, age }
  };
});

// Authentication error
app.get('/protected', async (request, reply) => {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AuthenticationError('Authorization header is required');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Invalid authorization format');
  }

  const token = authHeader.substring(7);
  if (token !== 'valid-token') {
    throw new AuthenticationError('Invalid or expired token');
  }

  return {
    message: 'Access granted',
    user: { id: 1, username: 'admin' }
  };
});

// Authorization error
app.delete('/admin/users/:id', async (request, reply) => {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AuthenticationError();
  }

  // Simulate role check
  const userRole = 'user'; // Should be 'admin'

  if (userRole !== 'admin') {
    throw new AuthorizationError('Admin role required for this operation');
  }

  return {
    success: true,
    message: 'User deleted'
  };
});

// Not found error
app.get('/users/:id', async (request, reply) => {
  const { id } = request.params;

  // Simulate database lookup
  const user = null;

  if (!user) {
    throw new NotFoundError(`User with id ${id}`);
  }

  return user;
});

// Conflict error
app.post('/users/register', async (request, reply) => {
  const { username, email } = request.body;

  // Simulate checking if user exists
  const userExists = username === 'admin';

  if (userExists) {
    throw new ConflictError('Username already taken');
  }

  reply.code(201);
  return {
    success: true,
    user: { username, email }
  };
});

// Database error simulation
app.get('/database-error', async (request, reply) => {
  const error: any = new Error('Database connection failed');
  error.statusCode = 503;
  error.code = 'DATABASE_ERROR';
  throw error;
});

// Timeout simulation
app.get('/timeout', async (request, reply) => {
  await new Promise(resolve => setTimeout(resolve, 5000));
  return { message: 'Request completed' };
});

// Multiple errors (first one wins)
app.get('/multiple-errors', async (request, reply) => {
  try {
    throw new Error('First error');
  } catch (err) {
    throw new Error('Second error');
  }
});

// Error in hook
app.get('/hook-error', {
  preHandler: [
    async (request, reply) => {
      throw new Error('Error in preHandler hook');
    }
  ]
}, async (request, reply) => {
  return { message: 'This will never be reached' };
});

// Graceful error recovery
app.get('/recoverable', async (request, reply) => {
  try {
    // Simulate operation that might fail
    if (Math.random() > 0.5) {
      throw new Error('Operation failed');
    }
    return { success: true, data: 'Operation succeeded' };
  } catch (err) {
    request.log.warn('Operation failed, returning fallback');
    return {
      success: false,
      fallback: true,
      message: 'Using cached data'
    };
  }
});

// Schema validation error
app.post('/validate', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string', minLength: 1 },
        email: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  return {
    success: true,
    data: request.body
  };
});

// Start server
app.listen({ port: 3004 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`\n🚀 Server ready at ${address}`);
  console.log(`\nError handling examples:`);
  console.log(`  GET  ${address}/error/sync - Synchronous error`);
  console.log(`  GET  ${address}/error/async - Asynchronous error`);
  console.log(`  POST ${address}/users - Validation error`);
  console.log(`  GET  ${address}/protected - Authentication error`);
  console.log(`  DELETE ${address}/admin/users/1 - Authorization error`);
  console.log(`  GET  ${address}/users/999 - Not found error`);
  console.log(`  POST ${address}/users/register - Conflict error`);
  console.log(`  GET  ${address}/database-error - Database error`);
  console.log(`  GET  ${address}/hook-error - Error in hook`);
  console.log(`  GET  ${address}/recoverable - Graceful error recovery`);
  console.log(`  POST ${address}/validate - Schema validation error\n`);
});
