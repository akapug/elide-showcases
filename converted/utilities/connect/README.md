# Connect - HTTP Middleware Framework

Extensible HTTP server framework with composable middleware.

Based on [connect](https://www.npmjs.com/package/connect) (~1M+ downloads/week)

## Features

- Middleware composition
- Request/response handling
- Error handling middleware
- Mount path support
- Route matching
- Zero dependencies

## Quick Start

```typescript
import createServer from './elide-connect.ts';

const app = createServer();

// Add middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Route handling
app.use('/api', (req, res) => {
  res.json({ message: 'API endpoint' });
});

// Error handling
app.use((err, req, res, next) => {
  res.statusCode = 500;
  res.json({ error: err.message });
});
```

## Polyglot Examples

**JavaScript/TypeScript:**
```typescript
const app = createServer();
app.use('/users', (req, res) => {
  res.json({ users: ['Alice', 'Bob'] });
});
```

**Python (via Elide):**
```python
app = create_server()
app.use('/users', lambda req, res, next: res.json({'users': ['Alice', 'Bob']}))
```

**Ruby (via Elide):**
```ruby
app = create_server
app.use('/users') { |req, res| res.json(users: ['Alice', 'Bob']) }
```

## Why Polyglot?

- One middleware system for all languages
- Share HTTP logic across services
- Consistent request handling
- Perfect for microservices
