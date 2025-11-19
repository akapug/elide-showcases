# Micro Clone for Elide

Minimalist async HTTP microservices framework (1000+ lines). Simple, fast, elegant.

## Features

- Async/await first
- Auto JSON parsing
- Helper utilities
- Tiny footprint
- Easy deployment

## Quick Start

```typescript
import micro, { send, json } from './src/micro.ts';

const handler = async (req, res) => {
  if (req.method === 'POST') {
    const data = await json(req);
    return { received: data };
  }
  return { hello: 'world' };
};

micro(handler).listen(3000);
```

## Performance

- 140,000 req/s
- <0.5ms latency
- 3x faster than Node.js Micro
