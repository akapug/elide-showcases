# Velocity Quick Start Guide

Get started with Velocity in minutes!

## Installation

```bash
bun add velocity
```

## Your First Server

Create a file `server.ts`:

```typescript
import { createApp } from 'velocity';

const app = createApp();

app.get('/', (ctx) => {
  return ctx.jsonResponse({ message: 'Hello, Velocity!' });
});

app.listen({ port: 3000 });
console.log('Server running on http://localhost:3000');
```

Run it:

```bash
bun run server.ts
```

## Adding Routes

```typescript
// GET request
app.get('/users', (ctx) => {
  return ctx.jsonResponse({ users: [] });
});

// POST request
app.post('/users', async (ctx) => {
  const body = await ctx.json();
  return ctx.status(201).jsonResponse(body);
});

// Route with parameters
app.get('/users/:id', (ctx) => {
  const id = ctx.param('id');
  return ctx.jsonResponse({ id, name: 'John Doe' });
});

// Query parameters
app.get('/search', (ctx) => {
  const query = ctx.queryParam('q');
  return ctx.jsonResponse({ results: [], query });
});
```

## Adding Middleware

```typescript
import { createApp, logger, cors } from 'velocity';

const app = createApp();

// Add middleware
app.use(logger({ format: 'detailed' }));
app.use(cors());

// Your routes...
```

## Request Handling

```typescript
app.post('/api/data', async (ctx) => {
  // Get JSON body
  const json = await ctx.json();

  // Get text body
  const text = await ctx.text();

  // Get form data
  const formData = await ctx.formData();

  // Get headers
  const auth = ctx.header('Authorization');

  // Get cookies
  const session = ctx.cookie('session');

  return ctx.jsonResponse({ success: true });
});
```

## Response Types

```typescript
// JSON
app.get('/json', (ctx) => {
  return ctx.jsonResponse({ data: 'value' });
});

// Text
app.get('/text', (ctx) => {
  return ctx.textResponse('Plain text response');
});

// HTML
app.get('/html', (ctx) => {
  return ctx.htmlResponse('<h1>Hello, World!</h1>');
});

// Redirect
app.get('/old', (ctx) => {
  return ctx.redirect('/new', 301);
});

// File
app.get('/download', (ctx) => {
  const file = Bun.file('./file.pdf');
  return ctx.fileResponse(file, 'document.pdf');
});
```

## Error Handling

```typescript
// Custom error handler
app.onError((error, ctx) => {
  console.error('Error:', error);
  return ctx.status(500).jsonResponse({
    error: 'Something went wrong',
  });
});

// Custom 404 handler
app.onNotFound((ctx) => {
  return ctx.status(404).jsonResponse({
    error: 'Not found',
    path: ctx.path,
  });
});
```

## WebSockets

```typescript
app.ws('/chat', {
  open: (ws) => {
    console.log('Client connected');
    ws.send('Welcome!');
  },
  message: (ws, message) => {
    console.log('Received:', message);
    ws.send(`Echo: ${message}`);
  },
  close: (ws) => {
    console.log('Client disconnected');
  },
});
```

## Static Files

```typescript
// Serve files from ./public directory at /static
app.static('/static', './public');
```

## Validation

```typescript
import { validateBody } from 'velocity';

app.post(
  '/users',
  validateBody({
    name: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 50,
    },
    email: {
      required: true,
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    age: {
      type: 'number',
      min: 18,
      max: 120,
    },
  }),
  async (ctx) => {
    const body = ctx.validatedBody;
    // Body is validated and typed
    return ctx.jsonResponse(body);
  }
);
```

## Next Steps

- Check out the [Examples](../examples/) for complete applications
- Read the [API Documentation](./API.md) for detailed information
- Run [Benchmarks](../benchmarks/) to see Velocity's performance
- Explore [Middleware](./MIDDLEWARE.md) options

## Tips

1. **Use TypeScript** - Velocity has excellent TypeScript support
2. **Add middleware early** - Set up logging, CORS, etc. before routes
3. **Handle errors** - Always set custom error handlers
4. **Validate input** - Use the built-in validation for user data
5. **Monitor performance** - Use the logger middleware to track request times

## Common Patterns

### RESTful API

```typescript
const app = createApp();

// List all
app.get('/api/items', (ctx) => { /* ... */ });

// Get one
app.get('/api/items/:id', (ctx) => { /* ... */ });

// Create
app.post('/api/items', async (ctx) => { /* ... */ });

// Update
app.put('/api/items/:id', async (ctx) => { /* ... */ });

// Delete
app.delete('/api/items/:id', (ctx) => { /* ... */ });
```

### Authentication

```typescript
// Auth middleware
const requireAuth = async (ctx, next) => {
  const token = ctx.header('Authorization');

  if (!token) {
    return ctx.status(401).jsonResponse({ error: 'Unauthorized' });
  }

  // Verify token...
  ctx.user = { id: '123' }; // Attach user to context

  return await next();
};

// Protected route
app.get('/api/profile', requireAuth, (ctx) => {
  return ctx.jsonResponse({ user: ctx.user });
});
```

### Rate Limiting

```typescript
import { rateLimit } from 'velocity';

app.use(rateLimit({
  max: 100,          // 100 requests
  window: 60,        // per 60 seconds
  keyGenerator: (ctx) => ctx.ip || 'anonymous',
}));
```

## Getting Help

- Check the [examples](../examples/) directory
- Read the [documentation](./API.md)
- Open an issue on GitHub

Happy coding with Velocity! ⚡
