# Fastify Rate Limit - High-Performance Rate Limiting

Rate limiting plugin for Fastify applications in Elide.

Based on [fastify-rate-limit](https://www.npmjs.com/package/fastify-rate-limit) (~100K+ downloads/week)

## Quick Start

```typescript
import Fastify from 'fastify';
import rateLimit from './elide-fastify-rate-limit';

const fastify = Fastify();

fastify.register(rateLimit, {
  max: 100,
  timeWindow: 60000
});
```

## License

MIT
