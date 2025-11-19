/**
 * Schema Validation Example
 *
 * Demonstrates JSON schema validation for requests and responses
 */

import fastify from '../src/fastify.ts';

const app = fastify({ logger: true });

// Register reusable schemas
app.addSchema({
  $id: 'user',
  type: 'object',
  properties: {
    id: { type: 'number' },
    username: { type: 'string' },
    email: { type: 'string' },
    age: { type: 'number' }
  }
});

app.addSchema({
  $id: 'error',
  type: 'object',
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
    statusCode: { type: 'number' }
  }
});

// Body validation
app.post('/users', {
  schema: {
    body: {
      type: 'object',
      required: ['username', 'email'],
      properties: {
        username: { type: 'string', minLength: 3 },
        email: { type: 'string' },
        age: { type: 'number', minimum: 18 }
      }
    },
    response: {
      201: { $ref: 'user#' },
      400: { $ref: 'error#' }
    }
  }
}, async (request, reply) => {
  const { username, email, age } = request.body;

  reply.code(201);
  return {
    id: Math.floor(Math.random() * 1000),
    username,
    email,
    age: age || null
  };
});

// Query string validation
app.get('/users', {
  schema: {
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'number', minimum: 1, maximum: 100 },
        offset: { type: 'number', minimum: 0 },
        sort: { type: 'string', enum: ['asc', 'desc'] }
      }
    }
  }
}, async (request, reply) => {
  const { limit = 10, offset = 0, sort = 'asc' } = request.query;

  return {
    users: [
      { id: 1, username: 'alice', email: 'alice@example.com' },
      { id: 2, username: 'bob', email: 'bob@example.com' }
    ],
    pagination: {
      limit,
      offset,
      sort
    }
  };
});

// Params validation
app.get('/users/:id', {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: '^[0-9]+$' }
      }
    }
  }
}, async (request, reply) => {
  const { id } = request.params;

  return {
    id: parseInt(id),
    username: `user${id}`,
    email: `user${id}@example.com`
  };
});

// Headers validation
app.get('/protected', {
  schema: {
    headers: {
      type: 'object',
      required: ['authorization'],
      properties: {
        authorization: { type: 'string', pattern: '^Bearer .+' }
      }
    }
  }
}, async (request, reply) => {
  return {
    message: 'Access granted',
    user: 'authenticated-user'
  };
});

// Complex nested object validation
app.post('/orders', {
  schema: {
    body: {
      type: 'object',
      required: ['customerId', 'items'],
      properties: {
        customerId: { type: 'number' },
        items: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['productId', 'quantity'],
            properties: {
              productId: { type: 'number' },
              quantity: { type: 'number', minimum: 1 },
              price: { type: 'number', minimum: 0 }
            }
          }
        },
        shippingAddress: {
          type: 'object',
          required: ['street', 'city', 'country'],
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            country: { type: 'string' },
            zipCode: { type: 'string' }
          }
        }
      }
    }
  }
}, async (request, reply) => {
  const { customerId, items, shippingAddress } = request.body;

  const total = items.reduce((sum: number, item: any) => {
    return sum + (item.price || 0) * item.quantity;
  }, 0);

  reply.code(201);
  return {
    orderId: Math.floor(Math.random() * 10000),
    customerId,
    items,
    shippingAddress,
    total,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
});

// Custom validation error handler
app.setErrorHandler(async (error, request, reply) => {
  if (error.validation) {
    reply.code(400).send({
      error: 'Validation Error',
      message: 'Request validation failed',
      statusCode: 400,
      validation: error.validation.map(err => ({
        field: err.dataPath,
        message: err.message
      }))
    });
  } else {
    reply.code(error.statusCode || 500).send({
      error: error.name,
      message: error.message,
      statusCode: error.statusCode || 500
    });
  }
});

// Start server
app.listen({ port: 3001 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`\n🚀 Server ready at ${address}`);
  console.log(`\nValidation examples:`);
  console.log(`  POST ${address}/users`);
  console.log(`       Body: { "username": "alice", "email": "alice@example.com", "age": 25 }`);
  console.log(`  GET  ${address}/users?limit=10&offset=0&sort=asc`);
  console.log(`  GET  ${address}/users/123`);
  console.log(`  GET  ${address}/protected`);
  console.log(`       Header: Authorization: Bearer token123`);
  console.log(`  POST ${address}/orders`);
  console.log(`       Body: { "customerId": 1, "items": [...], "shippingAddress": {...} }\n`);
});
