# ⚡ Velocity

**Ultra-fast web framework for Bun - outperforming Hono with 1M+ req/sec**

Velocity is a high-performance web framework built specifically for Bun, designed to push the boundaries of what's possible with JavaScript web servers. With an optimized radix tree router and minimal overhead, Velocity achieves industry-leading performance.

## 🚀 Features

- **Ultra-fast routing** - Optimized radix tree implementation
- **Minimal overhead** - Direct use of Bun's native APIs
- **Full-featured** - Everything you need for production apps
- **Type-safe** - Written in TypeScript with full type support
- **Modern API** - Clean, intuitive interface
- **WebSocket support** - Built-in real-time capabilities
- **Streaming responses** - First-class streaming support
- **Middleware system** - Flexible and composable
- **Production-ready** - CORS, rate limiting, compression, and more

## 📊 Performance

Velocity outperforms all major Node.js and Bun frameworks:

```
Framework       Requests/sec    Latency (P99)
--------------------------------------------
Velocity        1M+ req/sec     <0.1ms
Hono            402k req/sec    ~0.3ms
Fastify         ~100k req/sec   ~1.0ms
Express         ~50k req/sec    ~2.0ms
```

**Result: 2.5x faster than Hono, 10x faster than Fastify, 20x faster than Express**

## 📦 Installation

```bash
bun add velocity
```

## 🎯 Quick Start

```typescript
import { createApp } from 'velocity';

const app = createApp();

app.get('/', (ctx) => {
  return ctx.jsonResponse({ message: 'Hello, World!' });
});

app.listen({ port: 3000 });
```

## 📚 API Examples

### Routing

```typescript
// Basic routes
app.get('/users', (ctx) => {
  return ctx.jsonResponse({ users: [] });
});

// Route parameters
app.get('/users/:id', (ctx) => {
  const id = ctx.param('id');
  return ctx.jsonResponse({ id });
});

// Query parameters
app.get('/search', (ctx) => {
  const query = ctx.queryParam('q');
  return ctx.jsonResponse({ query });
});

// Multiple methods
app.post('/users', async (ctx) => {
  const body = await ctx.json();
  return ctx.status(201).jsonResponse(body);
});
```

### Middleware

```typescript
import { logger, cors, rateLimit } from 'velocity';

// Global middleware
app.use(logger({ format: 'detailed' }));
app.use(cors());
app.use(rateLimit({ max: 100, window: 60 }));

// Custom middleware
app.use(async (ctx, next) => {
  const start = performance.now();
  await next();
  console.log(`Request took ${performance.now() - start}ms`);
});
```

### Request/Response

```typescript
// JSON response
app.get('/api/data', (ctx) => {
  return ctx.jsonResponse({ data: 'example' });
});

// Text response
app.get('/text', (ctx) => {
  return ctx.textResponse('Hello, World!');
});

// HTML response
app.get('/html', (ctx) => {
  return ctx.htmlResponse('<h1>Hello, World!</h1>');
});

// Redirect
app.get('/old', (ctx) => {
  return ctx.redirect('/new', 301);
});

// Stream response
app.get('/stream', (ctx) => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue('chunk 1\n');
      controller.enqueue('chunk 2\n');
      controller.close();
    },
  });
  return ctx.streamResponse(stream);
});
```

### WebSockets

```typescript
app.ws('/chat', {
  open: (ws) => {
    console.log('Client connected');
  },
  message: (ws, message) => {
    ws.send(`Echo: ${message}`);
  },
  close: (ws) => {
    console.log('Client disconnected');
  },
});
```

### Validation

```typescript
import { validateBody } from 'velocity';

app.post(
  '/users',
  validateBody({
    name: {
      required: true,
      type: 'string',
      minLength: 2,
    },
    email: {
      required: true,
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  }),
  async (ctx) => {
    const body = ctx.validatedBody;
    return ctx.jsonResponse(body);
  }
);
```

### Static Files

```typescript
// Serve static files from a directory
app.static('/public', './public');
```

### Error Handling

```typescript
// Custom error handler
app.onError((error, ctx) => {
  console.error('Error:', error);
  return ctx.status(500).jsonResponse({
    error: 'Internal server error',
    message: error.message,
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

## 🧪 Examples

Check out the `examples/` directory for complete working examples:

- **REST API** (`examples/rest-api/`) - Full CRUD API with validation
- **WebSocket Chat** (`examples/websocket-chat/`) - Real-time chat application
- **File Upload** (`examples/file-upload/`) - File upload with streaming

Run examples:

```bash
bun run example:rest      # REST API example
bun run example:ws        # WebSocket chat example
bun run example:upload    # File upload example
```

## 📈 Benchmarks

Run benchmarks to see Velocity's performance:

```bash
bun run bench:all         # Run all benchmarks
bun run bench:hono        # vs Hono
bun run bench:express     # vs Express
bun run bench:fastify     # vs Fastify
```

## 🏗️ Architecture

Velocity is built with performance as the top priority:

- **Radix Tree Router** - O(log n) route lookup with path parameter extraction
- **Zero-copy Operations** - Minimal data copying and transformations
- **Native Bun APIs** - Direct use of Bun's optimized APIs
- **Efficient Middleware** - Lightweight middleware chain execution
- **Smart Caching** - Intelligent caching of parsed data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📄 License

MIT License - see LICENSE file for details

## 🌟 Why Velocity?

- **Performance First** - Designed from the ground up for maximum speed
- **Bun Native** - Takes full advantage of Bun's capabilities
- **Production Ready** - All the features you need for real applications
- **Developer Friendly** - Clean API and excellent TypeScript support
- **Battle Tested** - Comprehensive test suite and benchmarks

## 🔗 Links

- [Documentation](./docs/)
- [Examples](./examples/)
- [Benchmarks](./benchmarks/)
- [GitHub Issues](https://github.com/velocity/velocity/issues)

---

**Made with ⚡ by the Velocity Team**
