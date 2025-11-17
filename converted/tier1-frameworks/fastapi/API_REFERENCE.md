# FastAPI on Elide - API Reference

Complete API reference for FastAPI on Elide.

## Table of Contents

1. [FastAPI Class](#fastapi-class)
2. [Routing](#routing)
3. [Models](#models)
4. [Dependencies](#dependencies)
5. [Middleware](#middleware)
6. [OpenAPI](#openapi)
7. [Type Definitions](#type-definitions)

## FastAPI Class

### Constructor

```typescript
new FastAPI(options?: FastAPIOptions)
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | 'FastAPI' | API title |
| `description` | string | '' | API description |
| `version` | string | '0.1.0' | API version |
| `openapi_url` | string | '/openapi.json' | OpenAPI schema endpoint |
| `docs_url` | string | '/docs' | Swagger UI endpoint |
| `redoc_url` | string | '/redoc' | ReDoc endpoint |
| `debug` | boolean | false | Enable debug mode |

**Example:**

```typescript
const app = new FastAPI({
  title: 'My API',
  description: 'API description',
  version: '1.0.0',
  debug: true,
});
```

### Route Methods

#### `get(path, handler, options?)`

Register a GET route.

```typescript
app.get(path: string, handler: RouteHandler, options?: PathOperation): FastAPI
```

**Example:**

```typescript
app.get('/users', async (req) => {
  return { users: [] };
}, {
  summary: 'Get users',
  tags: ['Users'],
});
```

#### `post(path, handler, options?)`

Register a POST route.

```typescript
app.post(path: string, handler: RouteHandler, options?: PathOperation): FastAPI
```

#### `put(path, handler, options?)`

Register a PUT route.

```typescript
app.put(path: string, handler: RouteHandler, options?: PathOperation): FastAPI
```

#### `delete(path, handler, options?)`

Register a DELETE route.

```typescript
app.delete(path: string, handler: RouteHandler, options?: PathOperation): FastAPI
```

#### `patch(path, handler, options?)`

Register a PATCH route.

```typescript
app.patch(path: string, handler: RouteHandler, options?: PathOperation): FastAPI
```

#### `head(path, handler, options?)`

Register a HEAD route.

```typescript
app.head(path: string, handler: RouteHandler, options?: PathOperation): FastAPI
```

#### `options(path, handler, options?)`

Register an OPTIONS route.

```typescript
app.options(path: string, handler: RouteHandler, options?: PathOperation): FastAPI
```

### PathOperation Options

| Option | Type | Description |
|--------|------|-------------|
| `summary` | string | Short description |
| `description` | string | Long description |
| `tags` | string[] | Tags for grouping |
| `response_model` | any | Response validation model |
| `status_code` | number | HTTP status code |
| `responses` | Record<number, any> | Additional responses |
| `deprecated` | boolean | Mark as deprecated |
| `operation_id` | string | Unique operation ID |
| `dependencies` | Record<string, any> | Dependencies to inject |
| `include_in_schema` | boolean | Include in OpenAPI schema |

### Middleware

#### `add_middleware(middleware)`

Add middleware to the application.

```typescript
app.add_middleware(middleware: MiddlewareFunction): FastAPI
```

**Example:**

```typescript
import { CORSMiddleware } from '@elide/fastapi/middleware';

app.add_middleware(CORSMiddleware({
  allow_origins: ['https://example.com'],
}));
```

### Exception Handling

#### `add_exception_handler(exc_class, handler)`

Add exception handler.

```typescript
app.add_exception_handler(exc_class: any, handler: Function): FastAPI
```

**Example:**

```typescript
app.add_exception_handler(Error, (req, err) => {
  return {
    status_code: 500,
    content: { detail: err.message },
    headers: { 'Content-Type': 'application/json' },
  };
});
```

### Lifecycle Events

#### `on_event(event, handler)`

Register startup or shutdown event handler.

```typescript
app.on_event(event: 'startup' | 'shutdown', handler: Function): FastAPI
```

**Example:**

```typescript
app.on_event('startup', async () => {
  console.log('Starting up...');
});

app.on_event('shutdown', async () => {
  console.log('Shutting down...');
});
```

### Router

#### `include_router(router, prefix?, tags?)`

Include an API router.

```typescript
app.include_router(router: APIRouter, prefix?: string, tags?: string[]): FastAPI
```

**Example:**

```typescript
import { APIRouter } from '@elide/fastapi';

const router = new APIRouter();
router.get('/users', async () => ({ users: [] }));

app.include_router(router, '/api/v1', ['API']);
```

### Server

#### `listen(port, callback?)`

Start HTTP server.

```typescript
app.listen(port: number, callback?: () => void): Server
```

**Example:**

```typescript
app.listen(8000, () => {
  console.log('Server running on port 8000');
});
```

#### `callback()`

Get request handler callback.

```typescript
app.callback(): (req: IncomingMessage, res: ServerResponse) => void
```

**Example:**

```typescript
import * as http from 'http';

const server = http.createServer(app.callback());
server.listen(8000);
```

### OpenAPI

#### `openapi()`

Get OpenAPI schema.

```typescript
app.openapi(): OpenAPISpec
```

**Example:**

```typescript
const schema = app.openapi();
console.log(JSON.stringify(schema, null, 2));
```

## Routing

### APIRouter

#### Constructor

```typescript
new APIRouter(options?: {
  prefix?: string;
  tags?: string[];
  dependencies?: Record<string, any>;
})
```

**Example:**

```typescript
const router = new APIRouter({
  prefix: '/api/v1',
  tags: ['API v1'],
});
```

#### Methods

Same as FastAPI class:
- `get(path, handler, options?)`
- `post(path, handler, options?)`
- `put(path, handler, options?)`
- `delete(path, handler, options?)`
- `patch(path, handler, options?)`

#### `include_router(router, prefix?, tags?)`

Include another router.

```typescript
router.include_router(router: APIRouter, prefix?: string, tags?: string[]): APIRouter
```

## Models

### BaseModel

#### Constructor

```typescript
new BaseModel(data: any)
```

Creates and validates model instance.

**Example:**

```typescript
const UserModel = createModel('User', {
  fields: {
    name: Field({ type: 'string' }),
  },
});

const user = new UserModel({ name: 'John' });
```

#### `dict()`

Convert to plain object.

```typescript
model.dict(): Record<string, any>
```

#### `json()`

Convert to JSON string.

```typescript
model.json(): string
```

#### Static Methods

##### `parse_obj(data)`

Parse from object.

```typescript
Model.parse_obj(data: any): BaseModel
```

##### `parse_raw(json)`

Parse from JSON string.

```typescript
Model.parse_raw(json: string): BaseModel
```

##### `schema()`

Get OpenAPI schema.

```typescript
Model.schema(): any
```

### createModel

Create a model class.

```typescript
createModel(name: string, schema: ModelSchema): typeof BaseModel
```

**Example:**

```typescript
const UserModel = createModel('User', {
  title: 'User',
  description: 'User model',
  fields: {
    id: Field({ type: 'number' }),
    email: Field({ type: 'string', required: true }),
  },
});
```

### Field

Define a model field.

```typescript
Field(options: FieldDefinition): FieldDefinition
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `type` | string | Field type ('string', 'number', 'boolean', 'array') |
| `required` | boolean | Whether field is required |
| `default` | any | Default value |
| `description` | string | Field description |
| `example` | any | Example value |
| `min` | number | Minimum value (numbers) |
| `max` | number | Maximum value (numbers) |
| `minLength` | number | Minimum length (strings) |
| `maxLength` | number | Maximum length (strings) |
| `pattern` | string | Regex pattern (strings) |
| `enum` | any[] | Allowed values |

**Example:**

```typescript
const field = Field({
  type: 'string',
  required: true,
  minLength: 3,
  maxLength: 50,
  description: 'Username',
});
```

### Helper Functions

#### `Query(default?, options?)`

Define query parameter.

```typescript
Query(default_value?: any, options?: FieldDefinition): FieldDefinition
```

#### `Path(options?)`

Define path parameter.

```typescript
Path(options?: FieldDefinition): FieldDefinition
```

#### `Body(options?)`

Define request body.

```typescript
Body(options?: FieldDefinition): FieldDefinition
```

#### `Header(default?, options?)`

Define header parameter.

```typescript
Header(default_value?: any, options?: FieldDefinition): FieldDefinition
```

## Dependencies

### DependencyInjector

Handles dependency resolution.

#### `resolve(dependencies, request)`

Resolve dependencies for a request.

```typescript
injector.resolve(
  dependencies: Record<string, Dependency>,
  request: any
): Promise<Record<string, any>>
```

### Depends

Mark a function as a dependency.

```typescript
Depends(dependency: Dependency): Dependency
```

**Example:**

```typescript
const get_db = () => ({ query: async () => [] });

app.get('/users', async (req, deps) => {
  const users = await deps.db.query('SELECT * FROM users');
  return { users };
}, {
  dependencies: {
    db: Depends(get_db),
  },
});
```

### Built-in Dependencies

#### `get_db()`

Get database session.

```typescript
get_db(): Dependency
```

#### `get_current_user()`

Get current authenticated user.

```typescript
get_current_user(): Dependency
```

#### `pagination(request)`

Get pagination parameters.

```typescript
pagination(request: any): Dependency
```

## Middleware

### CORSMiddleware

CORS middleware.

```typescript
CORSMiddleware(options?: CORSOptions): MiddlewareFunction
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allow_origins` | string[] | ['*'] | Allowed origins |
| `allow_methods` | string[] | ['GET', 'POST', ...] | Allowed methods |
| `allow_headers` | string[] | ['*'] | Allowed headers |
| `allow_credentials` | boolean | false | Allow credentials |
| `expose_headers` | string[] | [] | Expose headers |
| `max_age` | number | 600 | Max age in seconds |

**Example:**

```typescript
app.add_middleware(CORSMiddleware({
  allow_origins: ['https://example.com'],
  allow_credentials: true,
}));
```

### LoggingMiddleware

Request/response logging.

```typescript
LoggingMiddleware(options?: {
  log_requests?: boolean;
  log_responses?: boolean;
  logger?: (message: string) => void;
}): MiddlewareFunction
```

### RateLimitMiddleware

Rate limiting.

```typescript
RateLimitMiddleware(options?: {
  requests_per_minute?: number;
  identifier?: (request: any) => string;
}): MiddlewareFunction
```

### RequestIDMiddleware

Add request ID to requests.

```typescript
RequestIDMiddleware(options?: {
  header_name?: string;
  generator?: () => string;
}): MiddlewareFunction
```

### SecurityHeadersMiddleware

Add security headers.

```typescript
SecurityHeadersMiddleware(options?: {
  hsts?: boolean;
  nosniff?: boolean;
  xss_protection?: boolean;
  frame_options?: string;
}): MiddlewareFunction
```

### TimingMiddleware

Add response timing.

```typescript
TimingMiddleware(): MiddlewareFunction
```

### GZipMiddleware

Response compression.

```typescript
GZipMiddleware(options?: {
  minimum_size?: number;
  compression_level?: number;
}): MiddlewareFunction
```

## OpenAPI

### OpenAPIGenerator

Generates OpenAPI specifications.

#### Constructor

```typescript
new OpenAPIGenerator(app: FastAPI)
```

#### `generate(routes)`

Generate OpenAPI schema from routes.

```typescript
generator.generate(routes: Map<string, Map<string, RouteDefinition>>): OpenAPISpec
```

### Response

Define API response.

```typescript
Response(status_code: number, description: string, model?: any): any
```

**Example:**

```typescript
app.get('/users', async () => ({ users: [] }), {
  responses: {
    404: Response(404, 'Not found'),
    500: Response(500, 'Server error'),
  },
});
```

## Type Definitions

### RouteHandler

```typescript
type RouteHandler = (request: any, dependencies?: any) => Promise<any> | any;
```

### MiddlewareFunction

```typescript
type MiddlewareFunction = (request: any, next: () => Promise<any>) => Promise<any>;
```

### Request Object

```typescript
interface Request {
  method: string;
  url: string;
  params: Record<string, string>;  // Path parameters
  query: Record<string, any>;      // Query parameters
  body: any;                        // Request body
  headers: Record<string, string>; // Headers
  raw: IncomingMessage;            // Raw Node.js request
}
```

### Response Object

```typescript
interface Response {
  status_code: number;
  content: any;
  headers: Record<string, string>;
  media_type?: string;
}
```

### HTTPException

```typescript
interface HTTPException extends Error {
  status_code: number;
  detail: string;
  headers?: Record<string, string>;
}
```

**Example:**

```typescript
throw {
  status_code: 404,
  detail: 'User not found',
};
```

## Error Handling

### Validation Errors

Automatically returned for validation failures:

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "Invalid email format",
      "type": "value_error.str.regex"
    }
  ]
}
```

### Custom Errors

```typescript
// Throw HTTP exception
throw {
  status_code: 400,
  detail: 'Invalid request',
};

// With custom error code
throw {
  status_code: 400,
  detail: 'Invalid request',
  error_code: 'INVALID_INPUT',
};
```

## Complete Example

```typescript
import FastAPI from '@elide/fastapi';
import { APIRouter } from '@elide/fastapi/routing';
import { createModel, Field } from '@elide/fastapi/models';
import { Depends } from '@elide/fastapi/dependencies';
import { CORSMiddleware, RateLimitMiddleware } from '@elide/fastapi/middleware';

// Create app
const app = new FastAPI({
  title: 'My API',
  version: '1.0.0',
});

// Add middleware
app.add_middleware(CORSMiddleware());
app.add_middleware(RateLimitMiddleware());

// Define model
const UserModel = createModel('User', {
  fields: {
    id: Field({ type: 'number' }),
    email: Field({ type: 'string', required: true }),
  },
});

// Define dependency
const get_db = () => ({ query: async () => [] });

// Create router
const router = new APIRouter({ prefix: '/api' });

router.get('/users', async (req, deps) => {
  const users = await deps.db.query('SELECT * FROM users');
  return { users };
}, {
  summary: 'List users',
  tags: ['Users'],
  dependencies: { db: Depends(get_db) },
});

router.post('/users', async (req) => {
  const user = new UserModel(req.body);
  return user.dict();
}, {
  summary: 'Create user',
  status_code: 201,
  response_model: UserModel,
});

// Include router
app.include_router(router);

// Start server
app.listen(8000, () => {
  console.log('Server running on port 8000');
});
```

## See Also

- [README.md](./README.md) - Overview and quick start
- [BENCHMARKS.md](./BENCHMARKS.md) - Performance benchmarks
- [POLYGLOT_GUIDE.md](./POLYGLOT_GUIDE.md) - Python + TypeScript integration
- [Examples](./examples/) - Complete examples
