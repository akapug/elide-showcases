/**
 * Fastify Swagger Example
 *
 * Demonstrates comprehensive Fastify server with Swagger documentation.
 */

import { fastifySwagger } from '../src/plugins/swagger'

// Mock Fastify implementation for example purposes
class FastifyMock {
  private routes: Map<string, any> = []
  private hooks: Map<string, Function[]> = new Map()
  private schemas: Map<string, any> = new Map()

  async register(plugin: Function, options: any) {
    plugin(this, options, () => {})
  }

  get(path: string, options: any) {
    this.addRoute('GET', path, options)
  }

  post(path: string, options: any) {
    this.addRoute('POST', path, options)
  }

  put(path: string, options: any) {
    this.addRoute('PUT', path, options)
  }

  patch(path: string, options: any) {
    this.addRoute('PATCH', path, options)
  }

  delete(path: string, options: any) {
    this.addRoute('DELETE', path, options)
  }

  addHook(name: string, fn: Function) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, [])
    }
    this.hooks.get(name)!.push(fn)
  }

  addSchema(schema: any) {
    if (schema.$id) {
      this.schemas.set(schema.$id, schema)
    }
  }

  swagger() {
    return {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {}
    }
  }

  private addRoute(method: string, path: string, options: any) {
    this.routes.set(`${method} ${path}`, options)

    // Trigger onRoute hook
    const hooks = this.hooks.get('onRoute')
    if (hooks) {
      hooks.forEach(hook => hook({ method, url: path, schema: options.schema }))
    }
  }

  async listen(options: any) {
    console.log(`Server listening on port ${options.port}`)
  }
}

// Create Fastify app
const app = new FastifyMock() as any

// Register Swagger plugin
await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'E-Commerce API',
      version: '2.0.0',
      description: 'A comprehensive e-commerce API with product catalog, orders, and user management',
      contact: {
        name: 'API Team',
        email: 'api@ecommerce.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'https://api.ecommerce.com/v2',
        description: 'Production'
      },
      {
        url: 'https://staging-api.ecommerce.com/v2',
        description: 'Staging'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'products', description: 'Product operations' },
      { name: 'orders', description: 'Order management' },
      { name: 'users', description: 'User management' }
    ]
  },
  exposeRoute: true,
  routePrefix: '/documentation',
  staticCSP: true,
  yaml: true
})

// Define reusable schemas
app.addSchema({
  $id: 'product',
  type: 'object',
  required: ['id', 'name', 'price'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', minLength: 1, maxLength: 200 },
    description: { type: 'string', maxLength: 1000 },
    price: { type: 'number', minimum: 0, exclusiveMinimum: true },
    currency: { type: 'string', enum: ['USD', 'EUR', 'GBP'], default: 'USD' },
    stock: { type: 'integer', minimum: 0 },
    category: { type: 'string' },
    imageUrl: { type: 'string', format: 'uri' },
    tags: { type: 'array', items: { type: 'string' } },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
})

app.addSchema({
  $id: 'order',
  type: 'object',
  required: ['id', 'userId', 'items', 'total', 'status'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['productId', 'quantity', 'price'],
        properties: {
          productId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', minimum: 1 },
          price: { type: 'number', minimum: 0 }
        }
      }
    },
    total: { type: 'number', minimum: 0 },
    status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
    shippingAddress: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        state: { type: 'string' },
        zipCode: { type: 'string' },
        country: { type: 'string' }
      }
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
})

// Product routes
app.get('/products', {
  schema: {
    description: 'Get all products',
    tags: ['products'],
    summary: 'List products',
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        offset: { type: 'integer', minimum: 0, default: 0 },
        category: { type: 'string' },
        minPrice: { type: 'number', minimum: 0 },
        maxPrice: { type: 'number', minimum: 0 },
        search: { type: 'string' },
        sort: { type: 'string', enum: ['name', 'price', 'createdAt', '-name', '-price', '-createdAt'] }
      }
    },
    response: {
      200: {
        description: 'List of products',
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: 'product#' } },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              limit: { type: 'integer' },
              offset: { type: 'integer' }
            }
          }
        }
      }
    }
  },
  handler: async (request, reply) => {
    return {
      data: [],
      meta: { total: 0, limit: 10, offset: 0 }
    }
  }
})

app.get('/products/:id', {
  schema: {
    description: 'Get a single product',
    tags: ['products'],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', format: 'uuid' }
      }
    },
    response: {
      200: {
        description: 'Product found',
        $ref: 'product#'
      },
      404: {
        description: 'Product not found',
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' }
        }
      }
    }
  },
  handler: async (request, reply) => {
    return {}
  }
})

app.post('/products', {
  schema: {
    description: 'Create a new product',
    tags: ['products'],
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['name', 'price'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 200 },
        description: { type: 'string', maxLength: 1000 },
        price: { type: 'number', minimum: 0, exclusiveMinimum: true },
        currency: { type: 'string', enum: ['USD', 'EUR', 'GBP'], default: 'USD' },
        stock: { type: 'integer', minimum: 0, default: 0 },
        category: { type: 'string' },
        imageUrl: { type: 'string', format: 'uri' },
        tags: { type: 'array', items: { type: 'string' } }
      }
    },
    response: {
      201: {
        description: 'Product created',
        $ref: 'product#'
      },
      400: {
        description: 'Invalid request',
        type: 'object',
        properties: {
          error: { type: 'string' },
          validationErrors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  },
  handler: async (request, reply) => {
    reply.code(201).send({})
  }
})

// Order routes
app.get('/orders', {
  schema: {
    description: 'Get all orders',
    tags: ['orders'],
    security: [{ bearerAuth: [] }],
    querystring: {
      type: 'object',
      properties: {
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        offset: { type: 'integer', minimum: 0, default: 0 },
        status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
        userId: { type: 'string', format: 'uuid' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: 'order#' } },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              limit: { type: 'integer' },
              offset: { type: 'integer' }
            }
          }
        }
      }
    }
  },
  handler: async (request, reply) => {
    return { data: [], meta: { total: 0, limit: 10, offset: 0 } }
  }
})

app.post('/orders', {
  schema: {
    description: 'Create a new order',
    tags: ['orders'],
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['items'],
      properties: {
        items: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['productId', 'quantity'],
            properties: {
              productId: { type: 'string', format: 'uuid' },
              quantity: { type: 'integer', minimum: 1 }
            }
          }
        },
        shippingAddress: {
          type: 'object',
          required: ['street', 'city', 'zipCode', 'country'],
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            zipCode: { type: 'string' },
            country: { type: 'string' }
          }
        }
      }
    },
    response: {
      201: {
        description: 'Order created',
        $ref: 'order#'
      }
    }
  },
  handler: async (request, reply) => {
    reply.code(201).send({})
  }
})

// Start server
await app.listen({ port: 3000 })

console.log('Documentation available at: http://localhost:3000/documentation')
console.log('OpenAPI JSON at: http://localhost:3000/documentation/json')
console.log('OpenAPI YAML at: http://localhost:3000/documentation/yaml')
