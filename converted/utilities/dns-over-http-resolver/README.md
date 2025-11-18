# dns-over-http-resolver - DoH Resolver - Elide Polyglot Showcase

Resolve DNS queries over HTTPS for privacy and security.

## 🚀 Quick Start

```typescript
import { resolve } from './elide-dns-over-http-resolver.ts';

const ips = await resolve('example.com', 'A', 'cloudflare');
console.log(ips);
```

**Package has ~1M+ downloads/week on npm**
