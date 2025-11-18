/**
 * Schema Validation Example
 *
 * Demonstrates:
 * - Request body validation
 * - Query string validation
 * - Parameter validation
 * - Response schema
 * - Custom error messages
 * - Common schema patterns
 */

import { fastify } from '../src/fastify';
import { CommonSchemas } from '../src/schemas';

const app = fastify({
  logger: true,
});

// Route with body schema validation
app.post('/users', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: {
          type: 'string',
          minLength: 2,
          maxLength: 50,
        },
        email: CommonSchemas.email,
        age: {
          type: 'integer',
          minimum: 18,
          maximum: 120,
        },
        role: {
          type: 'string',
          enum: ['admin', 'user', 'moderator'],
        },
      },
      additionalProperties: false,
    },
    response: {
      201: {
        type: 'object',
        properties: {
          id: CommonSchemas.uuid,
          name: { type: 'string' },
          email: { type: 'string' },
          createdAt: CommonSchemas.timestamp,
        },
      },
    },
  },
}, async (request, reply) => {
  const user = request.body;

  const newUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: user.name,
    email: user.email,
    createdAt: new Date().toISOString(),
  };

  reply.code(201).send(newUser);
});

// Route with query string validation
app.get('/search', {
  schema: {
    querystring: {
      type: 'object',
      required: ['q'],
      properties: {
        q: CommonSchemas.nonEmptyString,
        page: {
          type: 'integer',
          minimum: 1,
          default: 1,
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10,
        },
        sort: {
          type: 'string',
          enum: ['asc', 'desc'],
          default: 'asc',
        },
      },
    },
  },
}, async (request, reply) => {
  const { q, page, limit, sort } = request.query;

  return {
    query: q,
    pagination: { page, limit },
    sort,
    results: [],
  };
});

// Route with parameter validation
app.get('/users/:userId/posts/:postId', {
  schema: {
    params: {
      type: 'object',
      required: ['userId', 'postId'],
      properties: {
        userId: CommonSchemas.uuid,
        postId: CommonSchemas.positiveInteger,
      },
    },
  },
}, async (request, reply) => {
  const { userId, postId } = request.params;

  return {
    user: userId,
    post: postId,
    data: { title: 'Sample Post', content: 'Post content' },
  };
});

// Route with header validation
app.get('/api/data', {
  schema: {
    headers: {
      type: 'object',
      required: ['authorization'],
      properties: {
        authorization: {
          type: 'string',
          pattern: '^Bearer .+$',
        },
        'content-type': {
          type: 'string',
          enum: ['application/json'],
        },
      },
    },
  },
}, async (request, reply) => {
  return {
    message: 'Authenticated request',
    headers: {
      authorization: request.headers.authorization,
    },
  };
});

// Complex nested object validation
app.post('/orders', {
  schema: {
    body: {
      type: 'object',
      required: ['customer', 'items'],
      properties: {
        customer: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string', minLength: 1 },
            email: CommonSchemas.email,
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                zipCode: { type: 'string', pattern: '^[0-9]{5}$' },
              },
            },
          },
        },
        items: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['productId', 'quantity'],
            properties: {
              productId: CommonSchemas.uuid,
              quantity: CommonSchemas.positiveInteger,
              price: {
                type: 'number',
                minimum: 0,
              },
            },
          },
        },
        notes: {
          type: 'string',
          maxLength: 500,
        },
      },
    },
    response: {
      201: {
        type: 'object',
        properties: {
          orderId: CommonSchemas.uuid,
          status: {
            type: 'string',
            enum: ['pending', 'confirmed', 'shipped'],
          },
          total: { type: 'number' },
          createdAt: CommonSchemas.timestamp,
        },
      },
    },
  },
}, async (request, reply) => {
  const order = request.body;

  const total = order.items.reduce((sum: number, item: any) => {
    return sum + (item.price * item.quantity);
  }, 0);

  reply.code(201).send({
    orderId: '123e4567-e89b-12d3-a456-426614174000',
    status: 'pending',
    total,
    createdAt: new Date().toISOString(),
  });
});

// Using oneOf for polymorphic validation
app.post('/notifications', {
  schema: {
    body: {
      oneOf: [
        {
          type: 'object',
          required: ['type', 'email'],
          properties: {
            type: { const: 'email' },
            email: CommonSchemas.email,
            subject: { type: 'string' },
            body: { type: 'string' },
          },
        },
        {
          type: 'object',
          required: ['type', 'phone'],
          properties: {
            type: { const: 'sms' },
            phone: { type: 'string', pattern: '^\\+?[0-9]{10,15}$' },
            message: { type: 'string', maxLength: 160 },
          },
        },
      ],
    },
  },
}, async (request, reply) => {
  const notification = request.body;

  return {
    message: `${notification.type} notification queued`,
    notification,
  };
});

// Custom error handler for validation errors
app.setErrorHandler((error, request, reply) => {
  if (error.name === 'ValidationError') {
    reply.code(400).send({
      error: 'Validation Failed',
      message: error.message,
      details: (error as any).errors || [],
    });
  } else {
    reply.code(500).send({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
});

// Start server
const start = async () => {
  try {
    const address = await app.listen(3001);
    console.log(`Schema validation server listening on ${address}`);
    console.log('\nTry these examples:');
    console.log('\n✅ Valid request:');
    console.log('curl -X POST http://localhost:3001/users -H "Content-Type: application/json" -d \'{"name":"John Doe","email":"john@example.com","age":25,"role":"user"}\'');
    console.log('\n❌ Invalid request (missing required field):');
    console.log('curl -X POST http://localhost:3001/users -H "Content-Type: application/json" -d \'{"name":"John"}\'');
    console.log('\n❌ Invalid request (invalid email):');
    console.log('curl -X POST http://localhost:3001/users -H "Content-Type: application/json" -d \'{"name":"John","email":"not-an-email"}\'');
    console.log('\n✅ Query validation:');
    console.log('curl "http://localhost:3001/search?q=fastify&page=1&limit=10&sort=asc"');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
