# multicast-dns - mDNS - Elide Polyglot Showcase

Implement mDNS for local network service discovery.

## 🚀 Quick Start

```typescript
import { create } from './elide-multicast-dns.ts';

const mdns = create();
mdns.query('mydevice.local', 'A');
```

**Package has ~8M+ downloads/week on npm**
