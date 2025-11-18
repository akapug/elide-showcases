# dnscache - DNS Caching - Elide Polyglot Showcase

Cache DNS lookups to improve performance.

## 🚀 Quick Start

```typescript
import { lookup, clear } from './elide-dnscache.ts';

lookup('example.com', {}, (err, address) => {
  console.log(address); // Cached result
});

// Clear cache
clear('example.com');
```

**Package has ~1M+ downloads/week on npm**
