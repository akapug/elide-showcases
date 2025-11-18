# socks-proxy-agent - SOCKS Proxy Agent - Elide Polyglot Showcase

HTTP Agent for SOCKS proxy support.

## 🚀 Quick Start

```typescript
import SocksProxyAgent from './elide-socks-proxy-agent.ts';

const agent = new SocksProxyAgent('socks5://proxy.com:1080');

// Use with fetch
const response = await fetch('https://example.com', { agent });
```

**Package has ~80M+ downloads/week on npm**
