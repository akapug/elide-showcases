# ftp - FTP Client - Elide Polyglot Showcase

FTP client for file transfers.

## 🚀 Quick Start

```typescript
import { Client } from './elide-ftp.ts';

const client = new Client();
client.connect({ host: 'ftp.example.com' });

client.list('/', (err, list) => {
  console.log(list);
});
```

**Package has ~3M+ downloads/week on npm**
