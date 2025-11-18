# tcping - TCP Ping - Elide Polyglot Showcase

Ping a TCP port to check if it's open and measure latency.

## 🚀 Quick Start

```typescript
import { ping } from './elide-tcping.ts';

const result = await ping({ address: 'example.com', port: 80 });
console.log(`Port ${result.port}: ${result.open ? 'Open' : 'Closed'}`);
```

**Package has ~500K+ downloads/week on npm**
