# Hapi Rate Limit - Rate Limiting Plugin

Rate limiting plugin for Hapi framework in Elide.

Based on [hapi-rate-limit](https://www.npmjs.com/package/hapi-rate-limit) (~20K+ downloads/week)

## Quick Start

```typescript
import Hapi from '@hapi/hapi';
import hapiRateLimit from './elide-hapi-rate-limit';

const server = Hapi.server({ port: 3000 });

await server.register({
  plugin: hapiRateLimit,
  options: { max: 100, duration: 60000 }
});
```

## License

MIT
