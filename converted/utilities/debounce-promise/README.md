# Debounce Promise - Promise Debouncing

Debounce promise-returning functions in Elide.

Based on [debounce-promise](https://www.npmjs.com/package/debounce-promise) (~100K+ downloads/week)

## Quick Start

```typescript
import debouncePromise from './elide-debounce-promise';

const fetchData = debouncePromise(
  async (query: string) => {
    return fetch(\`/api?q=\${query}\`);
  },
  300
);
```

## License

MIT
