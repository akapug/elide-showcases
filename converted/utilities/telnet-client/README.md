# telnet-client - Telnet Client - Elide Polyglot Showcase

Telnet client for remote terminal access.

## 🚀 Quick Start

```typescript
import { Telnet } from './elide-telnet-client.ts';

const telnet = new Telnet();
await telnet.connect({ host: 'example.com', port: 23 });

const response = await telnet.exec('ls');
console.log(response);
```

**Package has ~500K+ downloads/week on npm**
