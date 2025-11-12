# Express for Elide

Fast, unopinionated, minimalist web framework for Node.js, converted to run on Elide.

**Downloads**: ~25M/week on npm
**Category**: Web Framework
**Status**: ⚠️ Demo Implementation

## Overview

Express is the most popular Node.js web framework. This Elide conversion demonstrates the core Express API patterns. For production use, consider the full Express framework or Elide's native HTTP capabilities.

## Features

- Robust routing (GET, POST, PUT, DELETE, PATCH)
- Middleware support
- Request/response helpers
- Route parameters
- JSON body parsing
- Error handling
- Modular routers

## Quick Start

```typescript
import express from './express.ts';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## API Reference

### Application

```typescript
const app = express();

// Routing
app.get(path, handler)
app.post(path, handler)
app.put(path, handler)
app.delete(path, handler)
app.patch(path, handler)

// Middleware
app.use(middleware)
app.use(path, middleware)

// Settings
app.set(name, value)
app.get(name)

// Listen
app.listen(port, callback)
```

### Request

```typescript
req.method      // HTTP method
req.url         // Request URL
req.path        // URL path
req.params      // Route parameters
req.query       // Query string parameters
req.headers     // Request headers
req.body        // Request body (with middleware)
```

### Response

```typescript
res.status(code)           // Set status code
res.send(data)             // Send response
res.json(data)             // Send JSON
res.set(header, value)     // Set header
res.redirect(url)          // Redirect
```

## Run the Demo

```bash
elide run express.ts
```

## Resources

- Original package: https://www.npmjs.com/package/express
- Downloads: ~25M/week
- License: MIT
