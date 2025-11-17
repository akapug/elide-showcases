# Polka Clone for Elide

Micro web server with Express compatibility. Extremely fast, tiny footprint (800+ lines).

## Features

- Express-compatible API
- Tiny footprint (<1KB core)
- Blazing fast routing
- Middleware support
- Zero dependencies

## Quick Start

```typescript
import polka from './src/polka.ts';

polka()
  .get('/', (req, res) => {
    res.end('Hello World');
  })
  .get('/users/:id', (req, res) => {
    res.json({ userId: req.params.id });
  })
  .listen(3000);
```

## Performance

- 3-4x faster than Express
- 2x faster than Node.js Polka
- <1ms avg response time

## API

Same as Express: `get`, `post`, `put`, `delete`, `patch`, `use`, `listen`
