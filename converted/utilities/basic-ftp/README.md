# basic-ftp - Modern FTP Client - Elide Polyglot Showcase

Modern, promise-based FTP client.

## 🚀 Quick Start

```typescript
import { Client } from './elide-basic-ftp.ts';

const client = new Client();
await client.connect({ host: 'ftp.example.com' });

const files = await client.list('/');
console.log(files);
```

**Package has ~2M+ downloads/week on npm**
