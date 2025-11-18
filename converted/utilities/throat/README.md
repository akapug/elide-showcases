# Throat - Promise Concurrency Limiter

Limit promise concurrency with a semaphore in Elide.

Based on [throat](https://www.npmjs.com/package/throat) (~200K+ downloads/week)

## Quick Start

```typescript
import throat from './elide-throat';

// Limit to 2 concurrent promises
const limiter = throat(2);

const promises = [1, 2, 3, 4, 5].map(id =>
  limiter(() => fetchData(id))
);

await Promise.all(promises);
```

## License

MIT
