# Timed Out - Request Timeout Utility

Timeout utility for HTTP requests and operations in Elide.

Based on [timed-out](https://www.npmjs.com/package/timed-out) (~100K+ downloads/week)

## Quick Start

```typescript
import timedOut from './elide-timed-out';

const controller = timedOut({
  request: 5000,
  response: 10000
});

fetch('/api', { signal: controller.signal });
```

## License

MIT
