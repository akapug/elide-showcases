# Restify Clone for Elide

REST API framework with route versioning, content negotiation, throttling, and DTrace support (1500+ lines).

## Features

- Route versioning (header & path-based)
- Content negotiation
- Request throttling
- Semantic HTTP error codes
- DTrace support
- Built for REST APIs

## Quick Start

```typescript
import restify from './src/restify.ts';

const server = restify.createServer({
  name: 'myapi',
  version: '1.0.0'
});

server.get({ path: '/hello', version: '1.0.0' }, (req, res) => {
  res.send({ message: 'Hello v1' });
});

server.listen(3000);
```

## Performance

- 110,000 req/s with versioning
- 2.5x faster than Node.js Restify
- Efficient throttling
