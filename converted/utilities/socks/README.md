# socks - SOCKS Proxy Client - Elide Polyglot Showcase

SOCKS4/SOCKS5 proxy client implementation.

## 🚀 Quick Start

```typescript
import { SocksClient } from './elide-socks.ts';

const connection = await SocksClient.createConnection({
  proxy: { host: 'proxy.com', port: 1080, type: 5 },
  destination: { host: 'example.com', port: 80 }
});
```

**Package has ~5M+ downloads/week on npm**
