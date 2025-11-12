# Morgan - Elide Polyglot Showcase

> **One HTTP request logger for ALL languages** - TypeScript, Python, Ruby, and Java

Log HTTP requests with a single implementation that works across your entire polyglot stack.

## Why This Matters

In polyglot architectures, having **different logging formats** in each language creates:
- ❌ Inconsistent log formats across services
- ❌ Difficult log aggregation and analysis
- ❌ Multiple logging configurations to maintain
- ❌ Hard to trace requests across services
- ❌ Different performance characteristics

**Elide solves this** with ONE implementation that works in ALL languages.

## Features

- ✅ Predefined formats (combined, common, dev, short, tiny)
- ✅ Custom format strings
- ✅ Custom tokens
- ✅ Response time tracking
- ✅ Skip function for conditional logging
- ✅ Stream support for custom output
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ Express.js compatible API

## Quick Start

### TypeScript

```typescript
import morgan from './elide-morgan.ts';

// Predefined formats
app.use(morgan('combined'));
app.use(morgan('dev'));
app.use(morgan('tiny'));

// Custom format
app.use(morgan(':method :url :status :response-time ms'));

// With options
app.use(morgan('combined', {
  skip: (req, res) => res.statusCode < 400,
  stream: myLogStream
}));
```

## Predefined Formats

### combined
```
:remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :content-length ":referrer" ":user-agent"
```
Example: `127.0.0.1 - - [10/Oct/2024:13:55:36 +0000] "GET /api/users HTTP/1.1" 200 1234 "https://example.com" "Mozilla/5.0"`

### common
```
:remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :content-length
```
Example: `127.0.0.1 - - [10/Oct/2024:13:55:36 +0000] "GET /api/users HTTP/1.1" 200 1234`

### dev
```
:method :url :status :response-time ms - :content-length
```
Example: `GET /api/users 200 52.341 ms - 1234`

### short
```
:remote-addr :remote-user :method :url HTTP/:http-version :status :content-length - :response-time ms
```
Example: `127.0.0.1 - GET /api/users HTTP/1.1 200 1234 - 52.341 ms`

### tiny
```
:method :url :status :content-length - :response-time ms
```
Example: `GET /api/users 200 1234 - 52.341 ms`

## Available Tokens

- `:method` - HTTP method
- `:url` - Request URL
- `:status` - Response status code
- `:response-time` - Response time in milliseconds
- `:date` - Current date in UTC
- `:http-version` - HTTP version
- `:remote-addr` - Remote IP address
- `:remote-user` - Remote user (if authenticated)
- `:referrer` - Referrer header
- `:user-agent` - User agent string
- `:content-length` - Response content length
- `:req[header]` - Request header value
- `:res[header]` - Response header value

## API Reference

### `morgan(format, options?)`

Create a morgan middleware.

```typescript
const logger = morgan('combined', {
  immediate: false,  // Log when request received (not finished)
  skip: (req, res) => res.statusCode < 400,  // Skip function
  stream: process.stdout  // Output stream
});
```

### `morgan.token(name, fn)`

Define a custom token.

```typescript
import { token } from './elide-morgan.ts';

token('request-id', (req, res) => {
  return req.headers['x-request-id'] || 'no-id';
});

// Use in format
app.use(morgan(':method :url [:request-id] :status'));
```

## Use Cases

### Development Logging

```typescript
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
```

### Production Logging

```typescript
import fs from 'fs';

const accessLogStream = fs.createWriteStream('access.log', { flags: 'a' });

app.use(morgan('combined', {
  stream: accessLogStream
}));
```

### Error Logging Only

```typescript
app.use(morgan('combined', {
  skip: (req, res) => res.statusCode < 400
}));
```

### Request Tracing

```typescript
token('trace-id', (req) => req.headers['x-trace-id']);

app.use(morgan(':method :url [:trace-id] :status :response-time ms'));
```

### Custom Format

```typescript
app.use(morgan(':remote-addr - :method :url - :status [:response-time ms]'));
```

### JSON Logging

```typescript
const jsonFormat = (tokens, req, res) => {
  return JSON.stringify({
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: tokens['response-time'](req, res),
    timestamp: new Date().toISOString()
  });
};

app.use(morgan(jsonFormat));
```

## Links

- [Elide Documentation](https://docs.elide.dev)
- [npm morgan package](https://www.npmjs.com/package/morgan) (~11M downloads/week)
- [Express.js Middleware](https://expressjs.com/en/resources/middleware/morgan.html)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## Package Stats

- **npm downloads**: ~11M/week (morgan)
- **Use case**: HTTP logging, monitoring, debugging
- **Elide advantage**: Consistent logs across all services
- **Polyglot score**: 38/50 (B-Tier) - Good polyglot showcase

---

**Built with ❤️ for the Elide Polyglot Runtime**

*One logger to log them all.*
