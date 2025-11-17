# Fastify Swagger Clone - Elide Port

A comprehensive Fastify OpenAPI plugin that automatically generates OpenAPI 3.0 documentation from route schemas with validation and Swagger UI integration.

## Features

- **Auto-Documentation**: Generate OpenAPI from route schemas
- **Schema Validation**: Request/response validation
- **Swagger UI Integration**: Built-in Swagger UI
- **TypeScript Support**: Full type safety
- **Route Transformation**: Convert route schemas to OpenAPI
- **Multiple Formats**: JSON and YAML export
- **Custom Operations**: Extend with custom operations
- **Validation**: JSON Schema validation

## Installation

```bash
elide install fastify-swagger-clone
```

## Quick Start

```typescript
import { createFastify } from './server/fastify'
import { fastifySwagger } from './plugins/swagger'

const app = createFastify()

// Register swagger plugin
await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'My API',
      version: '1.0.0'
    },
    servers: [
      { url: 'http://localhost:3000' }
    ]
  },
  exposeRoute: true
})

// Define routes with schemas
app.get('/users', {
  schema: {
    description: 'List all users',
    tags: ['users'],
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
      }
    },
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' }
          }
        }
      }
    }
  },
  handler: async (request, reply) => {
    return [
      { id: '1', name: 'Alice', email: 'alice@example.com' }
    ]
  }
})

await app.listen({ port: 3000 })

// Swagger UI available at http://localhost:3000/documentation
// OpenAPI JSON at http://localhost:3000/documentation/json
```

## Route Schemas

```typescript
// Complete route schema example
app.post('/users', {
  schema: {
    description: 'Create a new user',
    tags: ['users'],
    summary: 'Create user',
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string', minLength: 2 },
        email: { type: 'string', format: 'email' },
        age: { type: 'integer', minimum: 0 }
      }
    },
    response: {
      201: {
        description: 'User created',
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' }
        }
      },
      400: {
        description: 'Bad request',
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  },
  handler: async (request, reply) => {
    const user = await createUser(request.body)
    reply.code(201).send(user)
  }
})
```

## Validation

```typescript
// Automatic validation from schema
app.get('/users/:id', {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: '^[0-9]+$' }
      }
    }
  },
  handler: async (request, reply) => {
    // request.params.id is validated
    return getUserById(request.params.id)
  }
})
```

## Reusable Schemas

```typescript
// Define reusable schemas
const userSchema = {
  $id: 'user',
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' }
  }
}

app.addSchema(userSchema)

// Use in routes
app.get('/users', {
  schema: {
    response: {
      200: {
        type: 'array',
        items: { $ref: 'user#' }
      }
    }
  },
  handler: async () => getUsers()
})
```

## Security

```typescript
await app.register(fastifySwagger, {
  openapi: {
    info: { title: 'Secure API', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  }
})

// Protected route
app.get('/protected', {
  schema: {
    security: [{ bearerAuth: [] }]
  },
  onRequest: async (request, reply) => {
    await authenticate(request)
  },
  handler: async () => {
    return { data: 'protected' }
  }
})
```

## Export OpenAPI

```typescript
// Get OpenAPI spec
const spec = app.swagger()

// Export as JSON
const json = JSON.stringify(spec, null, 2)

// Export as YAML
const yaml = app.swagger({ yaml: true })
```

## Custom Transformations

```typescript
await app.register(fastifySwagger, {
  transform: (schema) => {
    // Custom schema transformation
    return {
      ...schema,
      hide: false
    }
  },
  transformObject: (swaggerObject) => {
    // Custom OpenAPI object transformation
    return {
      ...swaggerObject,
      info: {
        ...swaggerObject.info,
        'x-custom': 'value'
      }
    }
  }
})
```

## License

MIT
