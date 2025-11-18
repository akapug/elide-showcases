# Throttle Debounce - Function Rate Control

Throttle and debounce functions for rate control in Elide.

Based on [throttle-debounce](https://www.npmjs.com/package/throttle-debounce) (~500K+ downloads/week)

## Quick Start

```typescript
import { throttle, debounce } from './elide-throttle-debounce';

// Throttle: Execute at most once per delay
const throttled = throttle(1000, () => {
  console.log('Throttled!');
});

// Debounce: Execute after delay of inactivity
const debounced = debounce(300, (query: string) => {
  console.log('Search:', query);
});
```

## License

MIT
