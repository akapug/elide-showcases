# ssh2 - SSH2 Client - Elide Polyglot Showcase

SSH2 client for secure remote connections.

## 🚀 Quick Start

```typescript
import { Client } from './elide-ssh2.ts';

const conn = new Client();
conn.connect({
  host: 'server.com',
  username: 'user',
  password: 'pass'
});

conn.exec('ls -la', (err, stream) => {
  console.log(stream.stdout);
});
```

**Package has ~8M+ downloads/week on npm**
