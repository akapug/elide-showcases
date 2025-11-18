# Timeout AbortController - Automatic Timeout Aborts

AbortController with automatic timeout in Elide.

Based on [timeout-abort-controller](https://www.npmjs.com/package/timeout-abort-controller) (~100K+ downloads/week)

## Quick Start

```typescript
import TimeoutAbortController from './elide-timeout-abort-controller';

const controller = new TimeoutAbortController(5000);

fetch('/api/data', { signal: controller.signal })
  .catch(err => console.log('Timeout!'));
```

## License

MIT
