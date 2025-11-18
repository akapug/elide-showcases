# Debounce Fn - Modern Debounce

Simple, modern debounce implementation in Elide.

Based on [debounce-fn](https://www.npmjs.com/package/debounce-fn) (~100K+ downloads/week)

## Quick Start

```typescript
import debounceFn from './elide-debounce-fn';

const debounced = debounceFn((msg: string) => {
  console.log(msg);
}, { wait: 300 });
```

## License

MIT
