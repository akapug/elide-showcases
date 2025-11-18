# Awesome Debounce Promise - Advanced Promise Debouncing

Advanced promise debouncing with key-based caching in Elide.

Based on [awesome-debounce-promise](https://www.npmjs.com/package/awesome-debounce-promise) (~50K+ downloads/week)

## Quick Start

```typescript
import awesomeDebouncePromise from './elide-awesome-debounce-promise';

const search = awesomeDebouncePromise(
  async (query: string) => fetch(\`/api?q=\${query}\`),
  300,
  { key: (query) => query }
);
```

## License

MIT
