# dns-packet - DNS Packet Encoding - Elide Polyglot Showcase

Encode and decode DNS packets for custom DNS implementations.

## 🚀 Quick Start

```typescript
import { encode, decode, createQuery } from './elide-dns-packet.ts';

const query = createQuery('example.com', 'A');
const buffer = encode(query);
const decoded = decode(buffer);
```

**Package has ~15M+ downloads/week on npm**
