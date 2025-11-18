# Troubleshooting Guide - Fastify on Elide

> Common issues and solutions when using Fastify on Elide

## Table of Contents

- [Installation Issues](#installation-issues)
- [Runtime Errors](#runtime-errors)
- [Performance Issues](#performance-issues)
- [Schema Validation Issues](#schema-validation-issues)
- [Plugin Issues](#plugin-issues)
- [Polyglot Issues](#polyglot-issues)
- [Native Image Build Issues](#native-image-build-issues)
- [Debugging Tips](#debugging-tips)

## Installation Issues

### Problem: Elide CLI not found

```bash
elide: command not found
```

**Solution:**

```bash
# Install Elide globally
npm install -g @elide/cli

# Verify installation
elide --version

# If still not found, check npm global bin path
npm config get prefix
# Add to PATH if needed
export PATH=$PATH:$(npm config get prefix)/bin
```

### Problem: TypeScript compilation errors

```
error TS2307: Cannot find module '@elide/fastify'
```

**Solution:**

```bash
# Install TypeScript dependencies
npm install --save-dev typescript @types/node

# Create tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true
  }
}
```

## Runtime Errors

### Problem: Port already in use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
app.listen(3001); // Use different port
```

### Problem: Request timeout

```
Error: Request timeout
```

**Solution:**

```typescript
// Increase timeout
const app = fastify({
  logger: true,
  requestTimeout: 30000, // 30 seconds
});

// Or per-route
app.get('/slow-route', {
  config: {
    timeout: 60000, // 60 seconds
  }
}, async (request, reply) => {
  // Slow operation
});
```

### Problem: Body parsing fails

```
Error: Invalid JSON
```

**Solution:**

```typescript
// Increase body size limit
const app = fastify({
  bodyLimit: 10485760, // 10MB
});

// Handle parsing errors
app.setErrorHandler((error, request, reply) => {
  if (error.name === 'SyntaxError') {
    reply.code(400).send({
      error: 'Bad Request',
      message: 'Invalid JSON in request body'
    });
  }
});
```

## Performance Issues

### Problem: Slow route responses

**Symptoms:**
- High response times
- Low throughput

**Diagnosis:**

```typescript
// Add timing hooks
app.addHook('onRequest', async (request, reply) => {
  (request as any).startTime = Date.now();
});

app.addHook('onResponse', async (request, reply) => {
  const duration = Date.now() - (request as any).startTime;
  if (duration > 100) {
    request.log.warn(`Slow route: ${request.url} took ${duration}ms`);
  }
});
```

**Solutions:**

1. **Enable caching:**

```typescript
const cache = new Map();

app.get('/expensive', async (request, reply) => {
  const cacheKey = request.url;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const result = await expensiveOperation();
  cache.set(cacheKey, result);
  return result;
});
```

2. **Optimize schema validation:**

```typescript
// Use simpler schemas for high-traffic routes
app.get('/hot-path', {
  schema: {
    response: {
      200: {
        type: 'object',
        // Minimal schema for fast serialization
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }
}, handler);
```

3. **Use native compilation:**

```bash
elide build --native server.ts
./server-native
```

### Problem: High memory usage

**Diagnosis:**

```typescript
// Monitor memory
app.get('/metrics', async (request, reply) => {
  return {
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };
});
```

**Solutions:**

1. **Clear caches periodically:**

```typescript
setInterval(() => {
  cache.clear();
}, 3600000); // Clear every hour
```

2. **Limit concurrent requests:**

```typescript
app.register(CommonPlugins.rateLimit({
  max: 100,
  windowMs: 60000
}));
```

3. **Use streaming for large responses:**

```typescript
import { createReadStream } from 'fs';

app.get('/large-file', async (request, reply) => {
  const stream = createReadStream('./large-file.json');
  reply.type('application/json').send(stream);
});
```

## Schema Validation Issues

### Problem: Validation always fails

```
ValidationError: Body validation failed
```

**Diagnosis:**

```typescript
app.setErrorHandler((error, request, reply) => {
  if (error.name === 'ValidationError') {
    // Log validation details
    request.log.error({
      body: request.body,
      errors: (error as any).errors
    });

    reply.code(400).send({
      error: 'Validation Failed',
      details: (error as any).errors
    });
  }
});
```

**Common Issues:**

1. **Type mismatch:**

```typescript
// Wrong: sending string instead of number
curl -X POST ... -d '{"age": "25"}' // ❌

// Correct:
curl -X POST ... -d '{"age": 25}' // ✓
```

2. **Missing required fields:**

```typescript
// Schema requires 'email'
schema: {
  body: {
    type: 'object',
    required: ['name', 'email'], // email is required!
    properties: {
      name: { type: 'string' },
      email: { type: 'string' }
    }
  }
}

// Request missing email ❌
{ "name": "John" }

// Correct: ✓
{ "name": "John", "email": "john@example.com" }
```

3. **additionalProperties:**

```typescript
// Schema forbids extra fields
schema: {
  body: {
    type: 'object',
    properties: { name: { type: 'string' } },
    additionalProperties: false // Strict!
  }
}

// Request with extra field ❌
{ "name": "John", "extra": "field" }

// Allow additional properties:
additionalProperties: true // or just omit the property
```

### Problem: Schema validation too strict

**Solution: Use `coerceTypes`:**

```typescript
// Custom validator that coerces types
import Ajv from 'ajv';

const ajv = new Ajv({
  coerceTypes: true, // Convert strings to numbers, etc.
  removeAdditional: true // Remove additional properties
});

app.setValidatorCompiler(({ schema }) => {
  return ajv.compile(schema);
});
```

## Plugin Issues

### Problem: Plugin not loading

```
Error: Plugin 'my-plugin' failed to load
```

**Diagnosis:**

```typescript
app.register(myPlugin, opts)
  .ready((err) => {
    if (err) {
      console.error('Plugin registration failed:', err);
    }
  });
```

**Common Issues:**

1. **Plugin dependencies not met:**

```typescript
// Plugin requires another plugin
const pluginA = PluginFactory.simple('a', async (instance) => {
  // ...
});

const pluginB = PluginFactory.withDependencies(
  'b',
  ['a'], // Requires pluginA
  async (instance) => {
    // ...
  }
);

// Register in correct order!
app.register(pluginA); // Must be first
app.register(pluginB); // Then pluginB
```

2. **Async plugin errors:**

```typescript
// Wrong: not handling async errors
const badPlugin = async (instance, opts) => {
  await somethingThatMightFail(); // No error handling!
};

// Correct: handle errors
const goodPlugin = async (instance, opts) => {
  try {
    await somethingThatMightFail();
  } catch (error) {
    instance.log.error(error);
    throw error; // Re-throw for Fastify to handle
  }
};
```

### Problem: Plugin routes not working

**Issue: Routes registered after listen()**

```typescript
// Wrong order ❌
app.listen(3000);
app.register(myPlugin); // Too late!

// Correct order ✓
app.register(myPlugin);
await app.ready(); // Wait for plugins
await app.listen(3000);
```

## Polyglot Issues

### Problem: Polyglot.eval() not defined

```
ReferenceError: Polyglot is not defined
```

**Solution:**

This is expected in the showcase. Polyglot features require Elide runtime with polyglot support enabled:

```yaml
# elide.yaml
runtime:
  polyglot:
    enabled: true
    languages:
      - javascript
      - python
      - ruby
```

Then run with:

```bash
elide run --polyglot server.ts
```

### Problem: Python module not found

```
ModuleNotFoundError: No module named 'numpy'
```

**Solution:**

```bash
# Install Python packages in Elide environment
elide python -m pip install numpy scipy scikit-learn

# Or use requirements.txt
echo "numpy==1.24.0" > requirements.txt
echo "scipy==1.10.0" >> requirements.txt
elide python -m pip install -r requirements.txt
```

### Problem: Ruby gem not found

```
LoadError: cannot load such file -- active_support
```

**Solution:**

```bash
# Install Ruby gems in Elide environment
elide ruby -S gem install activesupport

# Or use Gemfile
echo "gem 'activesupport'" > Gemfile
elide ruby -S bundle install
```

## Native Image Build Issues

### Problem: Build fails with reflection error

```
Error: Class not found at runtime
```

**Solution:**

Create reflection configuration:

```json
// reflect-config.json
[
  {
    "name": "com.example.MyClass",
    "allDeclaredConstructors": true,
    "allDeclaredMethods": true,
    "allDeclaredFields": true
  }
]
```

Build with config:

```bash
elide build --native \
  -H:ReflectionConfigurationFiles=reflect-config.json \
  server.ts
```

### Problem: Large native image size

```
Warning: Native image is 200MB
```

**Solutions:**

1. **Enable compression:**

```bash
elide build --native --optimize=size server.ts
```

2. **Remove unused code:**

```bash
# Use tree-shaking
elide build --native --tree-shake server.ts
```

3. **Exclude debug symbols:**

```bash
elide build --native --strip-debug server.ts
```

## Debugging Tips

### Enable Debug Logging

```typescript
const app = fastify({
  logger: {
    level: 'debug',
    prettyPrint: true
  }
});
```

### Use Request Tracing

```typescript
app.addHook('onRequest', async (request, reply) => {
  request.log.info({
    id: request.id,
    method: request.method,
    url: request.url,
    headers: request.headers
  }, 'Request received');
});
```

### Inspect Route Tree

```typescript
// Print all registered routes
const routes = app.router.getAllRoutes();
console.table(routes.map(r => ({
  method: r.method,
  path: r.path
})));
```

### Profile Performance

```typescript
// Add performance marks
app.addHook('onRequest', async (request, reply) => {
  performance.mark(`${request.id}-start`);
});

app.addHook('onResponse', async (request, reply) => {
  performance.mark(`${request.id}-end`);
  performance.measure(
    `request-${request.id}`,
    `${request.id}-start`,
    `${request.id}-end`
  );

  const measure = performance.getEntriesByName(`request-${request.id}`)[0];
  request.log.info(`Request took ${measure.duration}ms`);
});
```

### Test Schema Validation

```typescript
import { SchemaCompiler } from './src/schemas';

const compiler = new SchemaCompiler();
const schema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' }
  }
};

// Test valid data
const valid = compiler.validate(schema, { name: 'John' });
console.log('Valid:', valid); // true

// Test invalid data
const invalid = compiler.validate(schema, { age: 25 });
console.log('Invalid:', invalid); // false
console.log('Errors:', compiler.getErrors());
```

## Getting Help

### Check Logs

```bash
# Enable debug mode
DEBUG=fastify:* elide run server.ts

# Capture logs to file
elide run server.ts 2>&1 | tee server.log
```

### Community Resources

- [Fastify Documentation](https://www.fastify.io/docs/)
- [Elide Documentation](https://elide.dev/docs)
- [GraalVM Issues](https://github.com/oracle/graal/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/fastify)

### Report Bugs

When reporting issues, include:

1. **Environment:**
   - Elide version: `elide --version`
   - Node.js version: `node --version`
   - OS: `uname -a`

2. **Minimal reproduction:**
   ```typescript
   // Smallest code that reproduces the issue
   ```

3. **Error output:**
   ```
   Full error message and stack trace
   ```

4. **Expected vs actual behavior**

---

**Still having issues?** Open an issue on GitHub with the template above.
