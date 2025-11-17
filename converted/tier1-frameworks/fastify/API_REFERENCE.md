# Fastify on Elide - API Reference

> Complete API documentation for Fastify on Elide

## Table of Contents

- [Factory Function](#factory-function)
- [Fastify Instance](#fastify-instance)
- [Request Object](#request-object)
- [Reply Object](#reply-object)
- [Schemas](#schemas)
- [Hooks](#hooks)
- [Plugins](#plugins)
- [Decorators](#decorators)
- [Error Handling](#error-handling)
- [Polyglot APIs](#polyglot-apis)

## Factory Function

### `fastify(options?)`

Creates a new Fastify instance.

**Parameters:**

- `options` (object, optional): Configuration options
  - `logger` (boolean | Logger): Enable logging or provide custom logger
  - `ignoreTrailingSlash` (boolean): Ignore trailing slashes in routes (default: `true`)
  - `caseSensitive` (boolean): Case-sensitive routing (default: `false`)
  - `bodyLimit` (number): Maximum request body size in bytes (default: 1MB)
  - `maxParamLength` (number): Maximum URL parameter length (default: 100)
  - `trustProxy` (boolean): Trust proxy headers

**Returns:** `FastifyInstance`

**Example:**

```typescript
import { fastify } from '@elide/fastify';

const app = fastify({
  logger: true,
  caseSensitive: false,
  bodyLimit: 10485760 // 10MB
});
```

## Fastify Instance

### Route Registration

#### `app.get(path, [options], handler)`

Register a GET route.

**Parameters:**

- `path` (string): Route path (supports params: `/users/:id`)
- `options` (RouteOptions, optional): Route configuration
- `handler` (RouteHandler): Async function handling the request

**Example:**

```typescript
app.get('/users/:id', async (request, reply) => {
  const { id } = request.params;
  return { userId: id };
});

// With options
app.get('/users/:id', {
  schema: {
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  return { userId: request.params.id };
});
```

#### `app.post(path, [options], handler)`
#### `app.put(path, [options], handler)`
#### `app.delete(path, [options], handler)`
#### `app.patch(path, [options], handler)`
#### `app.head(path, [options], handler)`
#### `app.options(path, [options], handler)`

Same API as `app.get()`.

#### `app.all(path, [options], handler)`

Register handler for all HTTP methods.

#### `app.route(options)`

Register route with full options.

**Example:**

```typescript
app.route({
  method: ['GET', 'POST'],
  url: '/multi',
  schema: { /* ... */ },
  handler: async (request, reply) => {
    return { method: request.method };
  }
});
```

### Lifecycle Hooks

#### `app.addHook(hookName, handler)`

Add a lifecycle hook.

**Hook Types:**

- `onRequest`: Called when request is received
- `preParsing`: Before body parsing
- `preValidation`: Before schema validation
- `preHandler`: Before route handler
- `preSerialization`: Before response serialization
- `onSend`: Before sending response
- `onResponse`: After response sent
- `onError`: When error occurs
- `onTimeout`: When request times out

**Example:**

```typescript
app.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();
});

app.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - request.startTime;
  console.log(`Request took ${duration}ms`);
});
```

### Plugin System

#### `app.register(plugin, [options])`

Register a plugin.

**Parameters:**

- `plugin` (PluginFunction): Plugin function
- `options` (PluginOptions, optional): Plugin configuration
  - `prefix` (string): Route prefix for plugin routes

**Example:**

```typescript
const myPlugin = async (instance, opts) => {
  instance.get('/plugin-route', async (request, reply) => {
    return { plugin: true };
  });
};

app.register(myPlugin, { prefix: '/v1' });
```

### Decorators

#### `app.decorate(name, value)`

Add property to Fastify instance.

```typescript
app.decorate('config', { env: 'production' });

// Access via app.config
console.log(app.config.env);
```

#### `app.decorateRequest(name, value)`

Add property to all request objects.

```typescript
app.decorateRequest('userId', null);

// Access in routes
app.get('/', async (request, reply) => {
  request.userId = 123;
  return { userId: request.userId };
});
```

#### `app.decorateReply(name, value)`

Add property/method to all reply objects.

```typescript
app.decorateReply('success', function(data) {
  return this.send({ success: true, data });
});

// Use in routes
app.get('/', async (request, reply) => {
  return reply.success({ message: 'ok' });
});
```

### Server Control

#### `app.listen(port, [host], [callback])`

Start HTTP server.

**Returns:** `Promise<string>` (server address)

**Example:**

```typescript
// Simple
await app.listen(3000);

// With host
await app.listen(3000, '0.0.0.0');

// With callback
app.listen(3000, (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${address}`);
});
```

#### `app.close([callback])`

Close server and cleanup.

**Returns:** `Promise<void>`

```typescript
await app.close();
```

#### `app.ready([callback])`

Wait for all plugins to load.

**Returns:** `Promise<void>`

```typescript
await app.ready();
console.log('All plugins loaded');
```

### Error Handling

#### `app.setErrorHandler(handler)`

Set custom error handler.

```typescript
app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  reply.code(500).send({
    error: 'Internal Server Error',
    message: error.message
  });
});
```

#### `app.setNotFoundHandler(handler)`

Set custom 404 handler.

```typescript
app.setNotFoundHandler((request, reply) => {
  reply.code(404).send({
    error: 'Not Found',
    message: `Route ${request.method} ${request.url} not found`
  });
});
```

### Schema Compilation

#### `app.setValidatorCompiler(compiler)`

Set custom schema validator.

```typescript
import Ajv from 'ajv';

const ajv = new Ajv();

app.setValidatorCompiler(({ schema }) => {
  return ajv.compile(schema);
});
```

#### `app.setSerializerCompiler(compiler)`

Set custom response serializer.

```typescript
app.setSerializerCompiler(({ schema }) => {
  return (data) => JSON.stringify(data);
});
```

## Request Object

### Properties

- `request.id` (string): Unique request ID
- `request.params` (object): URL parameters
- `request.query` (object): Query string parameters
- `request.body` (any): Parsed request body
- `request.headers` (object): HTTP headers
- `request.method` (string): HTTP method
- `request.url` (string): Request URL
- `request.hostname` (string): Request hostname
- `request.ip` (string): Client IP address
- `request.protocol` (string): Protocol (http/https)
- `request.raw` (IncomingMessage): Node.js request object
- `request.log` (Logger): Request logger
- `request.server` (FastifyInstance): Fastify instance
- `request.routeOptions` (RouteOptions): Current route options

### Example

```typescript
app.get('/debug', async (request, reply) => {
  return {
    id: request.id,
    method: request.method,
    url: request.url,
    params: request.params,
    query: request.query,
    headers: request.headers,
    ip: request.ip
  };
});
```

## Reply Object

### Methods

#### `reply.code(statusCode)`

Set HTTP status code.

**Returns:** `FastifyReply` (chainable)

```typescript
reply.code(201).send({ created: true });
```

#### `reply.status(statusCode)`

Alias for `reply.code()`.

#### `reply.header(name, value)`

Set response header.

**Returns:** `FastifyReply` (chainable)

```typescript
reply.header('X-Custom-Header', 'value')
     .header('X-Another-Header', '123')
     .send({ ok: true });
```

#### `reply.headers(headers)`

Set multiple headers.

```typescript
reply.headers({
  'X-Header-1': 'value1',
  'X-Header-2': 'value2'
}).send({ ok: true });
```

#### `reply.type(contentType)`

Set Content-Type header.

```typescript
reply.type('text/html').send('<h1>Hello</h1>');
```

#### `reply.send(payload)`

Send response.

**Returns:** `FastifyReply`

```typescript
// JSON
reply.send({ message: 'hello' });

// String
reply.send('Hello World');

// Buffer
reply.send(Buffer.from('data'));

// Stream
reply.send(fs.createReadStream('./file.txt'));
```

#### `reply.redirect([statusCode], url)`

Redirect to URL.

```typescript
// 302 redirect (default)
reply.redirect('/new-location');

// Custom status
reply.redirect(301, '/permanent-location');
```

### Properties

- `reply.sent` (boolean): Whether response has been sent
- `reply.raw` (ServerResponse): Node.js response object
- `reply.log` (Logger): Reply logger
- `reply.request` (FastifyRequest): Associated request
- `reply.server` (FastifyInstance): Fastify instance

## Schemas

### Route Schema

```typescript
{
  body: JSONSchema,        // Validate request body
  querystring: JSONSchema, // Validate query parameters
  params: JSONSchema,      // Validate URL parameters
  headers: JSONSchema,     // Validate headers
  response: {              // Validate/serialize responses
    200: JSONSchema,
    201: JSONSchema,
    400: JSONSchema
  }
}
```

### JSON Schema Types

```typescript
{
  type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null',
  properties?: Record<string, JSONSchema>,
  required?: string[],
  items?: JSONSchema,
  minLength?: number,
  maxLength?: number,
  minimum?: number,
  maximum?: number,
  pattern?: string,
  format?: string,
  enum?: any[],
  const?: any,
  default?: any
}
```

### Common Schemas

```typescript
import { CommonSchemas } from '@elide/fastify/schemas';

// Pre-defined schemas
CommonSchemas.email          // Email validation
CommonSchemas.uuid           // UUID validation
CommonSchemas.positiveInteger // Positive integer
CommonSchemas.nonEmptyString // Non-empty string
CommonSchemas.pagination     // Pagination params
CommonSchemas.timestamp      // ISO timestamp
```

## Hooks

### Hook Types

```typescript
type HookHandler = (
  request: FastifyRequest,
  reply: FastifyReply,
  done?: (err?: Error) => void
) => Promise<void> | void;
```

### Hook Utilities

```typescript
import { HookUtils } from '@elide/fastify/hooks';

// Timing hooks
const { onRequest, onResponse } = HookUtils.createTimingHook();
app.addHook('onRequest', onRequest);
app.addHook('onResponse', onResponse);

// CORS
app.addHook('onRequest', HookUtils.createCORSHook({
  origin: '*',
  methods: ['GET', 'POST']
}));

// Authentication
app.addHook('preHandler', HookUtils.createAuthHook(
  async (token) => validateToken(token)
));

// Rate limiting
app.addHook('onRequest', HookUtils.createRateLimitHook({
  max: 100,
  windowMs: 60000
}));

// Security headers
app.addHook('onRequest', HookUtils.createSecurityHeadersHook());

// Request ID
app.addHook('onRequest', HookUtils.createRequestIdHook());
```

## Plugins

### Plugin Function

```typescript
type PluginFunction = (
  instance: FastifyInstance,
  opts: PluginOptions
) => Promise<void> | void;
```

### Creating Plugins

```typescript
import { PluginFactory } from '@elide/fastify/plugins';

// Simple plugin
const myPlugin = PluginFactory.simple('my-plugin', async (instance, opts) => {
  instance.get('/my-route', async (request, reply) => {
    return { plugin: opts.name };
  });
});

// Plugin with dependencies
const myPlugin = PluginFactory.withDependencies(
  'my-plugin',
  ['dep1', 'dep2'],
  async (instance, opts) => {
    // ...
  }
);

// Plugin with metadata
const myPlugin = PluginFactory.create(
  {
    name: 'my-plugin',
    version: '1.0.0',
    dependencies: ['other-plugin']
  },
  async (instance, opts) => {
    // ...
  }
);
```

### Built-in Plugins

```typescript
import { CommonPlugins } from '@elide/fastify/plugins';

// CORS
app.register(CommonPlugins.cors({
  origin: '*',
  credentials: true
}));

// Rate limiting
app.register(CommonPlugins.rateLimit({
  max: 100,
  windowMs: 60000
}));

// Helmet (security)
app.register(CommonPlugins.helmet());

// Authentication
app.register(CommonPlugins.auth(
  async (token) => validateToken(token)
));

// Cookies
app.register(CommonPlugins.cookie());

// Health check
app.register(CommonPlugins.healthCheck({
  path: '/health'
}));

// Swagger
app.register(CommonPlugins.swagger({
  info: {
    title: 'My API',
    version: '1.0.0'
  }
}));

// Compression
app.register(CommonPlugins.compress());

// Static files
app.register(CommonPlugins.static('./public', {
  prefix: '/static'
}));

// Multipart
app.register(CommonPlugins.multipart());
```

## Polyglot APIs

### Python Integration

```typescript
// Eval Python code
const result = Polyglot.eval('python', `
import numpy as np

class Processor:
    def process(self, data):
        return np.array(data).mean()

Processor()
`);

// Import Python module
const module = Polyglot.import('python', './my_module.py');

// Use in routes
app.post('/process', async (request, reply) => {
  const result = module.process(request.body.data);
  return { result };
});
```

### Ruby Integration

```typescript
// Eval Ruby code
const result = Polyglot.eval('ruby', `
require 'active_support/core_ext/string'

class Processor
  def process(text)
    text.titleize
  end
end

Processor.new
`);

// Import Ruby module
const module = Polyglot.import('ruby', './my_module.rb');
```

### Polyglot Plugins

```typescript
import { PolyglotPlugins } from '@elide/fastify/plugins';

// Python plugin
app.register(PolyglotPlugins.fromPython('ml-plugin', `
def register(app, opts):
    @app.post('/predict')
    def predict(request, reply):
        # ML logic
        reply.send({'prediction': 'value'})
`));

// Ruby plugin
app.register(PolyglotPlugins.fromRuby('text-plugin', `
def register(app, opts)
  app.get '/format' do |request, reply|
    reply.send({text: request.query['text'].titleize})
  end
end
`));

// Import from file
app.register(PolyglotPlugins.importPython('./plugins/my_plugin.py'));
app.register(PolyglotPlugins.importRuby('./plugins/my_plugin.rb'));
```

### Polyglot Schema Validators

```typescript
import { PolyglotSchemaValidator } from '@elide/fastify/schemas';

// Python validator
const validator = PolyglotSchemaValidator.fromPython(`
def validate(data):
    return isinstance(data, dict) and 'email' in data
`);

// Ruby validator
const validator = PolyglotSchemaValidator.fromRuby(`
lambda { |data| data.is_a?(Hash) && data.key?('email') }
`);

// Use in custom compiler
app.setValidatorCompiler(({ schema }) => {
  if (schema.polyglot === 'python') {
    return PolyglotSchemaValidator.fromPython(schema.code);
  }
  // ... default validation
});
```

---

**See also:**
- [README.md](./README.md) - Getting started
- [BENCHMARKS.md](./BENCHMARKS.md) - Performance data
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
