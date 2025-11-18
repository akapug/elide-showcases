# is-port-reachable - Check Port Reachability - Elide Polyglot Showcase

Check if a port on a host is reachable.

## 🚀 Quick Start

```typescript
import isPortReachable from './elide-is-port-reachable.ts';

const reachable = await isPortReachable(80, { host: 'example.com' });
console.log(`Port reachable: ${reachable}`);

// Check local port
const local = await isPortReachable(3000);
```

**Package has ~3M+ downloads/week on npm**
