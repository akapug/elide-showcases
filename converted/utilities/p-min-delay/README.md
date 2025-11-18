# p-min-delay - Minimum Promise Delay

Ensure promises take at least a minimum time in Elide.

Based on [p-min-delay](https://www.npmjs.com/package/p-min-delay) (~100K+ downloads/week)

## Quick Start

```typescript
import pMinDelay from './elide-p-min-delay';

// Prevent loading flicker
const result = await pMinDelay(
  fetchData(),
  1000 // At least 1 second
);
```

## License

MIT
