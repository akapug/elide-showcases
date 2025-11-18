# ping - Ping Utility - Elide Polyglot Showcase

Ping hosts using ICMP or TCP for network monitoring and health checks.

## 🚀 Quick Start

```typescript
import { probe } from './elide-ping.ts';

const result = await probe('example.com');
console.log(`Host: ${result.host}`);
console.log(`Alive: ${result.alive}`);
console.log(`Time: ${result.time}ms`);
```

**Package has ~3M+ downloads/week on npm**
