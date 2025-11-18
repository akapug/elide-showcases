# Promise Timeout - Add Timeouts to Promises

Wrap promises with automatic timeouts in Elide.

Based on [promise-timeout](https://www.npmjs.com/package/promise-timeout) (~100K+ downloads/week)

## Quick Start

```typescript
import { timeout } from './elide-promise-timeout';

const result = await timeout(
  fetchData(),
  5000,
  'Request timed out'
);
```

## License

MIT
