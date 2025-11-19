# Swagger UI Clone - Elide Port

A complete OpenAPI 3.0 documentation UI implementation in Elide with interactive testing, code generation, and authentication support.

## Features

- **OpenAPI 3.0 Support**: Full OpenAPI 3.0 specification support
- **Interactive UI**: Test APIs directly from the browser
- **Code Generation**: Generate client code in multiple languages
- **Try-It-Out**: Execute API requests with live responses
- **Authentication**: OAuth2, API Key, Basic Auth support
- **Schema Validation**: Request/response validation
- **Deep Linking**: Link directly to specific operations
- **Syntax Highlighting**: Beautiful code highlighting
- **TypeScript Types**: Full TypeScript support

## Installation

```bash
elide install swagger-ui-clone
```

## Quick Start

```typescript
import { SwaggerUI } from './ui/swagger-ui'
import { parseOpenAPISpec } from './parser/openapi-parser'

// From OpenAPI spec file
const spec = await parseOpenAPISpec('./api-spec.yaml')

// Create Swagger UI
const ui = new SwaggerUI({
  spec,
  domId: '#swagger-ui',
  deepLinking: true,
  displayRequestDuration: true
})

// Render UI
ui.render()
```

## OpenAPI Spec

```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
  description: API documentation
servers:
  - url: https://api.example.com/v1
paths:
  /users:
    get:
      summary: List users
      operationId: listUsers
      tags:
        - Users
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
components:
  schemas:
    User:
      type: object
      required:
        - id
        - name
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
          format: email
```

## Features

### Interactive Testing

```typescript
// Configure with authentication
const ui = new SwaggerUI({
  spec,
  requestInterceptor: (request) => {
    request.headers['Authorization'] = `Bearer ${token}`
    return request
  },
  responseInterceptor: (response) => {
    console.log('Response:', response)
    return response
  }
})
```

### Code Generation

```typescript
import { CodeGenerator } from './codegen/generator'

const generator = new CodeGenerator(spec)

// Generate TypeScript client
const tsCode = generator.generateTypeScript({
  moduleName: 'ApiClient',
  includeTypes: true
})

// Generate Python client
const pyCode = generator.generatePython({
  className: 'ApiClient'
})

// Generate cURL commands
const curlCmd = generator.generateCurl({
  operationId: 'listUsers',
  parameters: { limit: 20 }
})
```

### Authentication

```typescript
// OAuth2
ui.authorize({
  oauth2: {
    clientId: 'my-client-id',
    scopes: ['read:users', 'write:users']
  }
})

// API Key
ui.authorize({
  apiKey: {
    name: 'X-API-Key',
    value: 'my-api-key'
  }
})

// Basic Auth
ui.authorize({
  basic: {
    username: 'user',
    password: 'pass'
  }
})
```

## API

### SwaggerUI

```typescript
class SwaggerUI {
  constructor(options: SwaggerUIOptions)
  render(): void
  authorize(auth: AuthConfig): void
  setSpec(spec: OpenAPISpec): void
  executeOperation(operationId: string, params: any): Promise<Response>
}
```

### CodeGenerator

```typescript
class CodeGenerator {
  generateTypeScript(options): string
  generateJavaScript(options): string
  generatePython(options): string
  generateJava(options): string
  generateGo(options): string
  generateCurl(options): string
}
```

## Examples

See `examples/` directory for complete examples.

## License

MIT
