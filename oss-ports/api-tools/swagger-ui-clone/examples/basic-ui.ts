/**
 * Basic Swagger UI Example
 *
 * Demonstrates basic Swagger UI setup with OpenAPI spec.
 */

import { SwaggerUI } from '../src/ui/swagger-ui'
import { parseOpenAPISpec } from '../src/parser/openapi-parser'
import { CodeGenerator } from '../src/codegen/generator'

// Example OpenAPI specification
const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Pet Store API',
    version: '1.0.0',
    description: 'A sample Pet Store API',
    contact: {
      name: 'API Support',
      email: 'support@example.com'
    }
  },
  servers: [
    {
      url: 'https://api.petstore.com/v1',
      description: 'Production server'
    },
    {
      url: 'https://staging-api.petstore.com/v1',
      description: 'Staging server'
    }
  ],
  paths: {
    '/pets': {
      get: {
        summary: 'List all pets',
        operationId: 'listPets',
        tags: ['pets'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'How many items to return',
            required: false,
            schema: {
              type: 'integer',
              format: 'int32',
              default: 10,
              minimum: 1,
              maximum: 100
            }
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of items to skip',
            required: false,
            schema: {
              type: 'integer',
              format: 'int32',
              default: 0
            }
          }
        ],
        responses: {
          '200': {
            description: 'A paged array of pets',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Pet'
                      }
                    },
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
            }
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create a pet',
        operationId: 'createPet',
        tags: ['pets'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NewPet'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Pet created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Pet'
                }
              }
            }
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/pets/{petId}': {
      get: {
        summary: 'Info for a specific pet',
        operationId: 'showPetById',
        tags: ['pets'],
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            description: 'The id of the pet to retrieve',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Expected response to a valid request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Pet'
                }
              }
            }
          },
          '404': {
            description: 'Pet not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update a pet',
        operationId: 'updatePet',
        tags: ['pets'],
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            description: 'The id of the pet to update',
            schema: {
              type: 'string'
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NewPet'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Pet updated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Pet'
                }
              }
            }
          },
          '404': {
            description: 'Pet not found'
          }
        }
      },
      delete: {
        summary: 'Delete a pet',
        operationId: 'deletePet',
        tags: ['pets'],
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            description: 'The id of the pet to delete',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '204': {
            description: 'Pet deleted'
          },
          '404': {
            description: 'Pet not found'
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Pet: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier'
          },
          name: {
            type: 'string',
            description: 'Pet name'
          },
          tag: {
            type: 'string',
            description: 'Pet category tag'
          },
          status: {
            type: 'string',
            enum: ['available', 'pending', 'sold'],
            default: 'available',
            description: 'Pet status'
          },
          age: {
            type: 'integer',
            minimum: 0,
            description: 'Pet age in years'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          }
        }
      },
      NewPet: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100
          },
          tag: {
            type: 'string'
          },
          age: {
            type: 'integer',
            minimum: 0,
            maximum: 50
          }
        }
      },
      Error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: {
            type: 'integer',
            format: 'int32'
          },
          message: {
            type: 'string'
          }
        }
      }
    },
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
  security: [
    {
      bearerAuth: []
    }
  ]
}

// Parse and validate spec
async function main() {
  const parsedSpec = await parseOpenAPISpec(spec)

  // Create Swagger UI
  const ui = new SwaggerUI({
    spec: parsedSpec,
    domId: '#swagger-ui',
    deepLinking: true,
    displayRequestDuration: true,
    tryItOutEnabled: true,
    requestInterceptor: (request) => {
      // Add authorization header
      const token = localStorage.getItem('auth_token')
      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`)
      }
      return request
    },
    responseInterceptor: (response) => {
      console.log('Response received:', response.status)
      return response
    }
  })

  // Render UI
  ui.render()

  // Generate client code
  const generator = new CodeGenerator(parsedSpec)

  // TypeScript client
  const tsCode = generator.generateTypeScript({
    moduleName: 'PetStoreClient',
    includeTypes: true,
    axios: false
  })

  console.log('TypeScript Client:')
  console.log(tsCode)

  // Python client
  const pyCode = generator.generatePython({
    className: 'PetStoreClient',
    includeTyping: true
  })

  console.log('\nPython Client:')
  console.log(pyCode)

  // cURL commands
  const curlCmd = generator.generateCurl({
    operationId: 'listPets',
    parameters: { limit: 20, offset: 0 }
  })

  console.log('\ncURL Command:')
  console.log(curlCmd)
}

// Run example
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', main)
} else {
  main()
}
